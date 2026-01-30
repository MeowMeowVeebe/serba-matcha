"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import useSWR, { mutate as globalMutate } from "swr";

// ============================================
// Fast API Fetcher with Caching
// ============================================

type FetchOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

// Global request cache for deduplication
const requestCache = new Map<string, Promise<Response>>();
const CACHE_DURATION = 100; // 100ms deduplication window

async function apiFetch<T>(url: string, options?: FetchOptions): Promise<T> {
  const method = options?.method || "GET";
  const cacheKey = `${method}:${url}:${JSON.stringify(options?.body || {})}`;

  // Deduplicate GET requests within cache window
  if (method === "GET") {
    const cached = requestCache.get(cacheKey);
    if (cached) {
      const res = await cached;
      return res.clone().json();
    }
  }

  const fetchPromise = fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Accept-Encoding": "gzip, deflate, br",
      ...options?.headers,
    },
    body: options?.body ? JSON.stringify(options.body) : undefined,
    credentials: "include",
  });

  // Cache GET requests briefly
  if (method === "GET") {
    requestCache.set(cacheKey, fetchPromise);
    setTimeout(() => requestCache.delete(cacheKey), CACHE_DURATION);
  }

  const res = await fetchPromise;

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || `Request failed: ${res.status}`);
  }

  return res.json();
}

// ============================================
// Fast Data Hook with SWR
// ============================================

type UseApiOptions<T> = {
  /** Initial data to show immediately */
  fallbackData?: T;
  /** Revalidate on window focus */
  revalidateOnFocus?: boolean;
  /** Cache duration in ms */
  dedupingInterval?: number;
  /** Auto refresh interval in ms */
  refreshInterval?: number;
  /** Don't fetch on mount */
  suspendFetch?: boolean;
};

export function useApiData<T>(
  url: string | null,
  options?: UseApiOptions<T>
) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<T>(
    url,
    url ? () => apiFetch<T>(url) : null,
    {
      fallbackData: options?.fallbackData,
      revalidateOnFocus: options?.revalidateOnFocus ?? false,
      revalidateOnReconnect: false,
      dedupingInterval: options?.dedupingInterval ?? 30000, // 30 seconds default
      errorRetryCount: 1,
      keepPreviousData: true,
      refreshInterval: options?.refreshInterval,
      isPaused: () => options?.suspendFetch ?? false,
    }
  );

  return {
    data: data ?? null,
    error: error?.message ?? null,
    isLoading: isLoading && !data,
    isValidating,
    mutate,
    refresh: () => mutate(),
  };
}

// ============================================
// Mutation Hook (POST/PUT/DELETE)
// ============================================

type MutationOptions<TData, TResult> = {
  onSuccess?: (data: TResult) => void;
  onError?: (error: Error) => void;
  /** URLs to invalidate after mutation */
  invalidateUrls?: string[];
  /** Optimistic update function */
  optimisticUpdate?: (data: TData) => void;
};

export function useMutation<TData = unknown, TResult = unknown>(
  url: string,
  method: "POST" | "PUT" | "PATCH" | "DELETE" = "POST",
  options?: MutationOptions<TData, TResult>
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TResult | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const mutate = useCallback(
    async (body?: TData): Promise<TResult> => {
      // Cancel previous request
      abortRef.current?.abort();
      abortRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      // Apply optimistic update
      options?.optimisticUpdate?.(body as TData);

      try {
        const result = await apiFetch<TResult>(url, { method, body });
        setData(result);
        
        // Invalidate related caches
        if (options?.invalidateUrls) {
          options.invalidateUrls.forEach((u) => globalMutate(u));
        }

        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Request failed";
        setError(message);
        options?.onError?.(err instanceof Error ? err : new Error(message));
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [url, method, options]
  );

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  return {
    mutate,
    isLoading,
    error,
    data,
    reset,
  };
}

// ============================================
// Batch Request Helper
// ============================================

type BatchRequest = {
  url: string;
  options?: FetchOptions;
};

export async function batchFetch<T extends unknown[]>(
  requests: BatchRequest[]
): Promise<T> {
  const results = await Promise.all(
    requests.map(({ url, options }) => apiFetch(url, options))
  );
  return results as T;
}

// ============================================
// Prefetch Helper
// ============================================

export function prefetchApi(urls: string[]) {
  if (typeof window === "undefined") return;

  urls.forEach((url) => {
    fetch(url, {
      credentials: "include",
      headers: {
        Accept: "application/json",
        "Accept-Encoding": "gzip, deflate, br",
      },
    }).catch(() => {});
  });
}
