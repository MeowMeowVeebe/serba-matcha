import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";
// midtrans-client ships CommonJS only; require keeps TS happy without extra types.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const midtransClient = require("midtrans-client");

type CartItem = {
  productId?: string | null;
  name: string;
  price: number;
  qty: number;
  image?: string | null;
  category?: string | null;
};

export async function GET(req: NextRequest) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const statusFilter = req.nextUrl.searchParams.get("status");
  const includeAll = req.nextUrl.searchParams.get("all") === "1";

  const where: any = {};
  if (!includeAll) {
    where.userId = session.sub;
  }
  if (statusFilter) {
    where.status = statusFilter;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ transactions });
}

export async function POST(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));

  const rawItems: CartItem[] = Array.isArray(body.items)
    ? body.items
    : body.productName && body.price != null
      ? [{ productId: body.productId ?? null, name: body.productName, price: Number(body.price), qty: 1 }]
      : [];

  const items: CartItem[] = rawItems
    .map((item, idx) => ({
      productId: item.productId ?? null,
      name: String(item.name ?? `Item ${idx + 1}`).slice(0, 50),
      price: Math.max(0, Math.round(Number(item.price ?? 0))),
      qty: Math.max(1, Math.round(Number(item.qty ?? 1))),
      image: item.image ?? null,
      category: item.category ?? null,
    }))
    .filter((item) => item.name && item.price > 0 && item.qty > 0);

  if (items.length === 0) {
    return NextResponse.json({ error: "No items to checkout" }, { status: 400 });
  }

  const shippingCost = Math.max(0, Math.round(Number(body.shippingCost ?? 0)));
  const shippingMethod = typeof body.shippingMethod === "string" ? body.shippingMethod : "standard";
  const customer = {
    name: body.customer?.name ?? session.email?.split("@")?.[0] ?? "Guest",
    email: body.customer?.email ?? session.email ?? undefined,
    phone: body.customer?.phone ?? undefined,
  };

  if (!process.env.MIDTRANS_SERVER_KEY || !process.env.MIDTRANS_CLIENT_KEY) {
    return NextResponse.json(
      { error: "Midtrans keys missing. Set MIDTRANS_SERVER_KEY and MIDTRANS_CLIENT_KEY." },
      { status: 500 }
    );
  }

  const snap = new midtransClient.Snap({
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === "true",
    serverKey: process.env.MIDTRANS_SERVER_KEY,
    clientKey: process.env.MIDTRANS_CLIENT_KEY,
  });

  const orderId = body.orderId || `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const grossAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0) + shippingCost;

  if (grossAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const baseUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  const itemDetails = [
    ...items.map((item, idx) => ({
      id: item.productId || `ITEM-${idx + 1}`,
      price: item.price,
      quantity: item.qty,
      name: item.name,
    })),
    ...(shippingCost > 0
      ? [
          {
            id: "SHIPPING",
            price: shippingCost,
            quantity: 1,
            name: `Shipping (${shippingMethod})`,
          },
        ]
      : []),
  ];

  try {
    const transaction = await snap.createTransaction({
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      item_details: itemDetails,
      customer_details: {
        first_name: customer.name ?? "Guest",
        email: customer.email ?? undefined,
        phone: customer.phone ?? undefined,
      },
      callbacks: {
        finish: `${baseUrl}/dashboard/transactions?orderId=${orderId}`,
        pending: `${baseUrl}/cart?status=pending&orderId=${orderId}`,
        error: `${baseUrl}/cart?status=error&orderId=${orderId}`,
      },
    });

    const tx = await prisma.transaction.create({
      data: {
        userId: session.sub,
        orderId,
        productId: items.length === 1 ? items[0].productId ?? null : null,
        productName: items.length === 1 ? items[0].name : `${items.length} items`,
        price: grossAmount,
        grossAmount,
        shippingCost,
        status: "pending",
        snapToken: transaction.token,
        snapRedirectUrl: transaction.redirect_url,
        customerName: customer.name ?? null,
        customerEmail: customer.email ?? null,
        customerPhone: customer.phone ?? null,
        items,
      },
    });

    return NextResponse.json({
      transaction: tx,
      token: transaction.token,
      redirectUrl: transaction.redirect_url,
    });
  } catch (error: any) {
    console.error("Midtrans error", error);
    return NextResponse.json(
      { error: "Failed to create Midtrans transaction", detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
