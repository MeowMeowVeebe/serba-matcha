import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import { getSessionPayloadFromRequest } from "@/lib/server/authSession";

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

  try {
    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ transactions });
  } catch (error: any) {
    console.error("GET transactions error", error);
    return NextResponse.json({ transactions: [], error: error?.message }, { status: 200 });
  }
}

export async function POST(req: Request) {
  const session = getSessionPayloadFromRequest(req);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

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

  const orderId = body.orderId || `order-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const grossAmount = items.reduce((sum, item) => sum + item.price * item.qty, 0) + shippingCost;

  if (grossAmount <= 0) {
    return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  }

  const baseUrl =
    process.env.APP_BASE_URL ||
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  try {
    console.log("Creating transaction for user:", session.sub);
    console.log("Items:", JSON.stringify(items, null, 2));
    console.log("Order ID:", orderId);
    console.log("Gross Amount:", grossAmount);

    // Verify user exists first (optional - to provide better error message)
    let validUserId: string | null = null;
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: session.sub },
        select: { id: true },
      });
      if (userExists) {
        validUserId = session.sub;
      }
      console.log("User exists:", !!userExists, "validUserId:", validUserId);
    } catch (userError) {
      console.log("User lookup failed:", userError);
      // User lookup failed, proceed without userId
    }

    // Create transaction directly in database (bypassing Midtrans for now)
    // Note: We don't set productId to avoid foreign key constraint issues
    // The product info is stored in the items JSON field instead
    const tx = await prisma.transaction.create({
      data: {
        userId: validUserId, // Use validated userId or null
        orderId,
        productId: null, // Don't set productId to avoid FK constraint
        productName: items.length === 1 ? items[0].name : `${items.length} items`,
        price: grossAmount,
        grossAmount,
        shippingCost,
        status: "completed",
        snapToken: null,
        snapRedirectUrl: null,
        customerName: customer.name ?? null,
        customerEmail: customer.email ?? session.email ?? null,
        customerPhone: customer.phone ?? null,
        items: JSON.parse(JSON.stringify(items)), // Ensure proper JSON serialization
      },
    });

    // Reduce stock for each purchased item
    for (const item of items) {
      if (item.productId) {
        try {
          await prisma.sellerProduct.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.qty,
              },
            },
          });
        } catch (stockError) {
          // Ignore if product doesn't exist - continue with other items
          console.warn(`Could not update stock for product ${item.productId}:`, stockError);
        }
      }
    }

    // Return success with redirect to transactions page
    return NextResponse.json({
      transaction: tx,
      success: true,
      redirectUrl: `${baseUrl}/dashboard/home/transactions?orderId=${orderId}`,
      message: "Pesanan berhasil dibuat!",
    });
  } catch (error: any) {
    console.error("Transaction create error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Gagal membuat transaksi";
    if (error?.code === "P2002") {
      errorMessage = "Order ID sudah digunakan, silakan coba lagi";
    } else if (error?.code === "P2003") {
      errorMessage = "Data user tidak valid";
    } else if (error?.message) {
      errorMessage = `Gagal membuat transaksi: ${error.message}`;
    }
    
    return NextResponse.json(
      { error: errorMessage, detail: error?.message || String(error) },
      { status: 500 }
    );
  }
}
