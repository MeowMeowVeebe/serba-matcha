import { NextResponse } from "next/server";
import { prisma } from "@/lib/server/prisma";
import sharp from "sharp";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Compress base64 image using sharp
async function compressImage(base64Image: string): Promise<string> {
  try {
    // Extract the base64 data (remove data:image/xxx;base64, prefix)
    const matches = base64Image.match(/^data:image\/([a-zA-Z]+);base64,(.+)$/);
    if (!matches) {
      return base64Image; // Return original if not valid base64 image
    }
    
    const imageBuffer = Buffer.from(matches[2], 'base64');
    
    // Compress image: resize to max 800px width, convert to JPEG with 70% quality
    const compressedBuffer = await sharp(imageBuffer)
      .resize(800, 800, { 
        fit: 'inside', 
        withoutEnlargement: true 
      })
      .jpeg({ quality: 70 })
      .toBuffer();
    
    // Convert back to base64
    const compressedBase64 = `data:image/jpeg;base64,${compressedBuffer.toString('base64')}`;
    
    console.log(`Image compressed: ${(imageBuffer.length / 1024).toFixed(1)}KB -> ${(compressedBuffer.length / 1024).toFixed(1)}KB`);
    
    return compressedBase64;
  } catch (error) {
    console.error('Image compression failed:', error);
    return base64Image; // Return original if compression fails
  }
}

export async function GET() {
  try {
    const products = await prisma.sellerProduct.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        transactions: {
          where: {
            status: { in: ["settlement", "capture", "success", "paid"] },
          },
          select: { id: true },
        },
      },
    });

    // Map products to include sold count
    const productsWithSold = products.map((p) => ({
      id: p.id,
      name: p.name,
      price: p.price,
      stock: p.stock,
      category: p.category,
      description: p.description,
      image: p.image,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
      sold: p.transactions.length,
    }));

    return NextResponse.json({ products: productsWithSold });
  } catch (error) {
    console.error("GET /api/seller/products error:", error);
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, price, stock, category, description, image } = body;
    
    if (!name || price == null || stock == null) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Compress image if provided
    let processedImage = image ?? "";
    if (image && image.startsWith('data:image/')) {
      processedImage = await compressImage(image);
    }

    const data = { 
      name, 
      price: Number(price), 
      stock: Number(stock), 
      category: category ?? "Cold Matcha", 
      description: description ?? "", 
      image: processedImage 
    };

    const product = id
      ? await prisma.sellerProduct.update({ where: { id }, data })
      : await prisma.sellerProduct.create({ data });

    return NextResponse.json({ product });
  } catch (error) {
    console.error("POST /api/seller/products error:", error);
    
    // Handle specific errors
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: "Invalid request data. Image may be too large." }, { status: 400 });
    }
    
    return NextResponse.json({ error: "Failed to save product" }, { status: 500 });
  }
}
