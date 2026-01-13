import ClientLayout from "./ClientLayout";
import "./globals.css";

export const metadata = {
  title: "Matchia",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className="light">
        {/* ClientLayout bertanggung jawab untuk alert / interaktivitas */}
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
