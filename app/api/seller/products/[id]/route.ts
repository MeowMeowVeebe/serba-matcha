import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

type ParamsPromise = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: ParamsPromise) {
  const { id } = await params;
  if (!id) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

  const body = await req.json();
  const { name, price, stock, category, description, image } = body;
  const product = await prisma.sellerProduct.update({
    where: { id },
    data: {
      name,
      price: Number(price),
      stock: Number(stock),
      category,
      description,
      image,
    },
  });
  return NextResponse.json({ product });
}

export async function DELETE(req: NextRequest, { params }: ParamsPromise) {
  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Missing product id" }, { status: 400 });
  }
  try {
    // Clean dependent rows first to avoid FK issues
    await prisma.transaction.updateMany({
      where: { productId: id },
      data: { productId: null },
    });
    await prisma.sellerProduct.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const message =
      typeof e?.message === "string" ? e.message : "Gagal menghapus produk karena constraint database.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
