import { redirect } from "next/navigation";

export default async function LoginRedirectPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const nextParam = params?.next;
  const next = Array.isArray(nextParam) ? nextParam[0] : nextParam;
  const target = next ? `/dashboard/login?next=${encodeURIComponent(next)}` : "/dashboard/login";
  redirect(target);
}
