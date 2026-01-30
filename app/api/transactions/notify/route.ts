import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

type MidtransNotification = {
  order_id: string;
  transaction_status: string;
  fraud_status?: string;
  gross_amount?: string;
  signature_key?: string;
};

const PAID_STATUSES = new Set(["settlement", "capture", "success", "paid"]);
const CANCEL_STATUSES = new Set(["deny", "cancel", "expire", "failure"]);

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as MidtransNotification;
  const orderId = body.order_id;
  if (!orderId) {
    return NextResponse.json({ error: "Missing order_id" }, { status: 400 });
  }

  // Note: In production you should verify the signature_key. Omitted here for brevity.
  const tx = await prisma.transaction.findUnique({ where: { orderId } });
  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const newStatus = body.transaction_status ?? "pending";
  const wasPaid = PAID_STATUSES.has(tx.status);
  const nowPaid = PAID_STATUSES.has(newStatus);

  const updated = await prisma.transaction.update({
    where: { orderId },
    data: {
      status: newStatus,
    },
  });

  // Only decrement stock on the first transition to a paid status.
  if (!wasPaid && nowPaid && Array.isArray(tx.items)) {
    await Promise.all(
      (tx.items as any[])
        .filter((item) => item.productId && item.qty)
        .map((item) =>
          prisma.sellerProduct
            .update({
              where: { id: item.productId as string },
              data: { stock: { decrement: Number(item.qty) || 1 } },
            })
            .catch(() => {})
        )
    );
  }

  return NextResponse.json({ ok: true, status: updated.status });
}
