import ClientLayout from "./ClientLayout";
// Core CSS only - critical for initial render
import "./globals.css";
import "@/styles/design-system.css";
import "@/styles/matcha-design-system.css";
import "@/styles/datatable.css";

export const metadata = {
  title: "Serba Matcha - User Dashboard",
  description: "Personal dashboard for Serba Matcha users",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Matcha",
  },
};

export const viewport = {
  themeColor: "#6B9C6F",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#6B9C6F" />
        <link rel="apple-touch-icon" href="/vercel.svg" />
      </head>
      <body className="dark">
        {/* ClientLayout bertanggung jawab untuk alert / interaktivitas */}
        <ClientLayout>{children}</ClientLayout>
        
        {/* PWA Registration (disabled in dev to avoid stale cache) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              const isProd = ${process.env.NODE_ENV === "production"};
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                  if (isProd) {
                    navigator.serviceWorker.register('/sw.js')
                      .then((registration) => {
                        console.log('SW registered: ', registration);
                      })
                      .catch((error) => {
                        console.log('SW registration failed: ', error);
                      });
                  } else {
                    navigator.serviceWorker.getRegistrations()
                      .then((registrations) => registrations.forEach((registration) => registration.unregister()))
                      .catch((error) => console.log('SW unregister failed: ', error));

                    if ('caches' in window) {
                      caches.keys()
                        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
                        .catch((error) => console.log('Cache clear failed: ', error));
                    }
                  }
                });
              }
            `,
          }}
        />
      </body>
    </html>
  );
}
