import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";

export async function GET() {
  const products = await prisma.sellerProduct.findMany({
    orderBy: { updatedAt: "desc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const body = await req.json();
  const { id, name, price, stock, category, description, image } = body;
  if (!name || price == null || stock == null) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const data = { name, price: Number(price), stock: Number(stock), category: category ?? "General", description: description ?? "", image: image ?? "/matcha-tea.png" };

  const product = id
    ? await prisma.sellerProduct.update({ where: { id }, data })
    : await prisma.sellerProduct.create({ data });

  return NextResponse.json({ product });
}
