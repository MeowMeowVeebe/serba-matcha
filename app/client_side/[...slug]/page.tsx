import { redirect } from "next/navigation";

const routeMap: Record<string, string> = {
  home: "/home",
  menu: "/menu",
  cart: "/cart",
  about_us: "/about_us",
  our_team: "/our_team",
  shopping: "/shopping",
};

export default function ClientSideCatchAll({
  params,
}: {
  params: { slug: string[] };
}) {
  const [first] = params.slug || [];
  const target = (first && routeMap[first]) || "/home";
  redirect(target);
}
