"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export function LoadingBar() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const pathname = usePathname();

  useEffect(() => {
    setIsLoading(true);
    setProgress(0);

    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + Math.random() * 10;
      });
    }, 200);

    // Complete loading after a short delay
    const timeout = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setIsLoading(false);
        setProgress(0);
      }, 300);
    }, 500);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [pathname]);

  if (!isLoading && progress === 0) return null;

  return (
    <div className="loading-bar">
      <div
        className="loading-bar__progress"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 300ms ease-out" : "width 200ms ease",
        }}
      />
    </div>
  );
}

// Global loading state hook
let globalLoadingCallback: ((loading: boolean) => void) | null = null;

export function useLoadingBar() {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    globalLoadingCallback = setIsLoading;
    return () => {
      globalLoadingCallback = null;
    };
  }, []);

  return {
    startLoading: () => globalLoadingCallback?.(true),
    stopLoading: () => globalLoadingCallback?.(false),
    isLoading,
  };
}

export function triggerLoading(loading: boolean) {
  globalLoadingCallback?.(loading);
}
