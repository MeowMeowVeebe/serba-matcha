import { redirect } from "next/navigation";
import { getSessionPayloadFromNextCookies } from "@/lib/server/nextAuthSession";
import { findUserById } from "@/lib/server/userStore";

export default async function HomePage() {
  const session = await getSessionPayloadFromNextCookies();
  if (!session) redirect("/dashboard/login");

  const me = await findUserById(session.sub);
  if (!me) redirect("/dashboard/login");

  redirect("/dashboard/home");
}



