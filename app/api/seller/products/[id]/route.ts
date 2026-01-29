import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

type Params = { params: { id: string } };

export async function PATCH(req: Request, { params }: Params) {
  const id = params.id;
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

export async function DELETE(req: Request, { params }: Params) {
  // Guard: try both params and URL parsing to be resilient to routing edge cases
  let id = params?.id;
  if (!id) {
    const pathParts = new URL(req.url).pathname.split("/").filter(Boolean);
    id = pathParts[pathParts.length - 1];
  }
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
