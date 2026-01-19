"use client";

import useSWR from "swr";
import { getCachedUser, type AuthUser } from "@/lib/authClient";

// Fast fetcher with error handling and compression
const fetcher = async (url: string) => {
  const res = await fetch(url, { 
    credentials: "include",
    headers: {
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
    },
  });
  if (!res.ok) {
    throw new Error("Not authenticated");
  }
  return res.json();
};

// Global SWR config for user - shared across all components
export function useUser() {
  // Try to get cached user for instant render (no loading state)
  const cachedUser = getCachedUser();
  
  const { data, error, isLoading, mutate } = useSWR<{ user: AuthUser }>(
    "/api/auth/me",
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000, // 60 seconds deduplication
      errorRetryCount: 1,
      keepPreviousData: true,
      suspense: false,
      revalidateIfStale: false, // Don't revalidate stale data automatically
      fallbackData: cachedUser ? { user: cachedUser } : undefined, // Use cached data as fallback
    }
  );

  return {
    user: data?.user ?? cachedUser ?? null,
    isLoading: isLoading && !cachedUser, // Not loading if we have cached data
    isError: !!error,
    mutate,
  };
}

// Prefetch user data - call this early for faster initial load
export function prefetchUser() {
  if (typeof window !== "undefined") {
    fetch("/api/auth/me", { 
      credentials: "include",
      headers: {
        "Accept": "application/json",
        "Accept-Encoding": "gzip, deflate, br",
      },
    }).catch(() => {});
  }
}
