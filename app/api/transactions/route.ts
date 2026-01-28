import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ transactions });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { productId, productName, price } = body;
  if (!productName || price == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const tx = await prisma.transaction.create({
    data: {
      productId: productId ?? null,
      productName,
      price: Number(price),
    },
  });

  if (productId) {
    await prisma.sellerProduct.update({
      where: { id: productId },
      data: { stock: { decrement: 1 } },
    }).catch(() => {});
  }

  return NextResponse.json({ transaction: tx });
}
