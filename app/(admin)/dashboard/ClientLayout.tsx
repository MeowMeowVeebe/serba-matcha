"use client";

import { ReactNode, useEffect, useCallback } from "react";
import { SWRConfig } from "swr";
import { AlertProvider } from "@/context/AlertContext";
import { ToastProvider } from "@/components/ui/ToastManager";
import { LoadingBar } from "@/components/ui/LoadingBar";
import { CommandPalette } from "@/components/ui/CommandPalette";
import { GlobalConfirmProvider } from "@/components/ui/GlobalConfirmDialog";

type ClientLayoutProps = {
  children: ReactNode;
};

// Optimized global fetcher with compression and keepalive
const fetcher = async (url: string) => {
  const res = await fetch(url, { 
    credentials: "include",
    headers: { 
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
    },
    keepalive: true,
  });
  if (!res.ok) throw new Error(`Error ${res.status}`);
  return res.json();
};

// Preload critical data with smart prefetching
function usePreload() {
  const prefetch = useCallback(() => {
    // Batch prefetch critical endpoints
    const criticalUrls = ["/api/auth/me"];
    
    criticalUrls.forEach(url => {
      fetch(url, { 
        credentials: "include",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate, br",
        },
        // Use low priority for prefetch
        priority: "low" as RequestPriority,
      }).catch(() => {});
    });
  }, []);

  useEffect(() => {
    // Prefetch immediately
    prefetch();

    // Also prefetch on visibility change (when user returns to tab)
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        prefetch();
      }
    };

    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [prefetch]);
}

// SWR Provider with optimized cache settings
const swrConfig = {
  fetcher,
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  revalidateIfStale: false,
  dedupingInterval: 60000, // 60 seconds deduplication
  errorRetryCount: 1,
  errorRetryInterval: 3000,
  keepPreviousData: true,
  loadingTimeout: 5000,
  focusThrottleInterval: 10000,
  // Use provider for better caching
  provider: () => new Map(),
};

export default function ClientLayout({ children }: ClientLayoutProps) {
  usePreload();

  return (
    <SWRConfig value={swrConfig}>
      <AlertProvider>
        <ToastProvider>
          <GlobalConfirmProvider>
            <LoadingBar />
            {children}
            <CommandPalette />
          </GlobalConfirmProvider>
        </ToastProvider>
      </AlertProvider>
    </SWRConfig>
  );
}
