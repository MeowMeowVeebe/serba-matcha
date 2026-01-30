import { redirect } from "next/navigation";

export default function ClientSideRedirect() {
  redirect("/home");
}
