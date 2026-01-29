import { redirect } from "next/navigation";

export default function PenjualRedirect() {
  redirect("/dashboard/seller/products");
}

