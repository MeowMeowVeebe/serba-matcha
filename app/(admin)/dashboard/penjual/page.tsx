import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

// Middleware already guards admin access.
export default function PenjualPage() {
  redirect("/dashboard/seller/products");
}
