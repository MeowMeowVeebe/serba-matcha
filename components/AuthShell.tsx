"use client";

import { useEffect, useRef, type ReactNode } from "react";
import AuthHeader from "@/components/ui/AuthHeader";

type Props = {
  ariaLabel: string;

  headerTitle: string;
  headerDescription?: string;
  headerRightSlot?: ReactNode;

  /**
   * Custom aside content. If provided, it will be rendered inside the default <aside className="auth-aside"> wrapper.
   * If omitted, AuthShell renders a default brand block + optional title/description/benefits.
   */
  aside?: ReactNode;

  /** Default aside content (used when `aside` is not provided). */
  asideTitle?: string;
  asideDescription?: string;
  asideBenefits?: string[];

  children: ReactNode;
};

export default function AuthShell({
  ariaLabel,
  headerTitle,
  headerDescription,
  headerRightSlot,
  aside,
  asideTitle,
  asideDescription,
  asideBenefits,
  children,
}: Props) {
  const animRef = useRef<HTMLDivElement | null>(null);
  const animInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!animRef.current || typeof window === "undefined") return;

    let cancelled = false;

    const loadAnimation = async () => {
      try {
        const existing = document.querySelector("script[data-lottie-web]") as HTMLScriptElement | null;
        if (!existing) {
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/bodymovin/5.12.2/lottie.min.js";
          script.async = true;
          script.defer = true;
          script.dataset.lottieWeb = "true";
          document.head.appendChild(script);
          await new Promise<void>((resolve) => {
            script.addEventListener("load", () => resolve());
            script.addEventListener("error", () => resolve());
          });
        }

        if (cancelled || !animRef.current) return;

        const container = animRef.current;

        const lottie = (window as Window & { lottie?: any }).lottie;
        if (!lottie) return;

        // Prevent duplicates (Next dev + React StrictMode can mount/unmount effects twice)
        try {
          if (animInstanceRef.current) {
            animInstanceRef.current.destroy?.();
            animInstanceRef.current = null;
          }
          lottie.destroy(container);
        } catch {
          // ignore
        }

        container.innerHTML = "";

        const instance = lottie.loadAnimation({
          container,
          renderer: "svg",
          loop: true,
          autoplay: true,
          path: "https://assets6.lottiefiles.com/packages/lf20_5ngs2ksb.json",
        });

        animInstanceRef.current = instance;
      } catch (err) {
        console.warn("Lottie load failed", err);
      }
    };

    loadAnimation();

    return () => {
      cancelled = true;

      try {
        if (animInstanceRef.current) {
          animInstanceRef.current.destroy?.();
          animInstanceRef.current = null;
        }
        const lottie = (window as Window & { lottie?: any }).lottie;
        if (lottie && animRef.current) {
          lottie.destroy(animRef.current);
        }
      } catch (err) {
        console.warn("Lottie cleanup failed", err);
      }
    };
  }, []);

  return (
    <main className="auth-container">
      <section className="auth-card" aria-label={ariaLabel}>
        <aside className="auth-aside" aria-hidden>
          <div className="auth-aside__animation" ref={animRef} />
        </aside>
        <div className="auth-form">
          <AuthHeader title={headerTitle} description={headerDescription} rightSlot={headerRightSlot} />
          {children}
        </div>
      </section>
    </main>
  );
}
