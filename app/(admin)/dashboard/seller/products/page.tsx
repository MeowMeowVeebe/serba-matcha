export const dynamic = "force-dynamic";

// Middleware enforces admin-only access; just render client UI.
const ClientPage = (await import("./ClientPage")).default;

export default function SellerProductsPage() {
  return <ClientPage />;
}
