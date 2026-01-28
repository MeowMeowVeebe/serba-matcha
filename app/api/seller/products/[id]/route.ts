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

export async function DELETE(_req: Request, { params }: Params) {
  const id = params.id;
  await prisma.transaction.deleteMany({ where: { productId: id } });
  await prisma.sellerProduct.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
