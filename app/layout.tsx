import ClientLayout from "./ClientLayout";
import "./globals.css";
import "../styles/design-system.css";
import "../styles/datatable.css";
import "../styles/advanced-components.css";
import "../styles/print.css";
import "../styles/datepicker.css";
// Enhanced Components CSS (Rekomendasi Frontend Batch 1)
import "../styles/parallax.css";
import "../styles/glassmorphism.css";
import "../styles/animated-data.css";
import "../styles/theme-generator.css";
import "../styles/journey-map.css";
import "../styles/branded-skeleton.css";
import "../styles/smart-command.css";
import "../styles/ambient-onboarding.css";
// Enhanced Components CSS (Rekomendasi Frontend Batch 2)
import "../styles/swipeable-gestures.css";
import "../styles/sound-dashboard.css";
import "../styles/notification-comparison.css";
import "../styles/avatar-vim-inline.css";
import "../styles/i18n-celebrations.css";

export const metadata = {
  title: "Serba Matcha - Admin Dashboard",
  description: "Secure admin dashboard with RBAC and audit logging",
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
