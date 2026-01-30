"use client";

import { useState, useCallback, useRef } from "react";

type SubmitState = "idle" | "submitting" | "success" | "error";

type UseOptimisticSubmitOptions<TData, TResult> = {
  onSubmit: (data: TData) => Promise<TResult>;
  onSuccess?: (result: TResult) => void;
  onError?: (error: Error) => void;
  /** Optimistic data to show immediately while submitting */
  optimisticData?: TResult;
  /** Minimum time to show loading state (prevents flash) */
  minLoadingTime?: number;
};

export function useOptimisticSubmit<TData, TResult>({
  onSubmit,
  onSuccess,
  onError,
  optimisticData,
  minLoadingTime = 0,
}: UseOptimisticSubmitOptions<TData, TResult>) {
  const [state, setState] = useState<SubmitState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<TResult | null>(optimisticData ?? null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const submit = useCallback(
    async (data: TData) => {
      // Abort any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setState("submitting");
      setError(null);

      // Show optimistic data immediately
      if (optimisticData) {
        setResult(optimisticData);
      }

      const startTime = Date.now();

      try {
        const response = await onSubmit(data);
        
        // Ensure minimum loading time to prevent flash
        const elapsed = Date.now() - startTime;
        if (minLoadingTime > 0 && elapsed < minLoadingTime) {
          await new Promise((resolve) => setTimeout(resolve, minLoadingTime - elapsed));
        }

        setResult(response);
        setState("success");
        onSuccess?.(response);
        return response;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Terjadi kesalahan";
        setError(errorMessage);
        setState("error");
        onError?.(err instanceof Error ? err : new Error(errorMessage));
        throw err;
      }
    },
    [onSubmit, onSuccess, onError, optimisticData, minLoadingTime]
  );

  const reset = useCallback(() => {
    setState("idle");
    setError(null);
    setResult(null);
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  return {
    submit,
    reset,
    state,
    isSubmitting: state === "submitting",
    isSuccess: state === "success",
    isError: state === "error",
    error,
    result,
  };
}

// Quick form submission hook with built-in loading state
export function useFormSubmit<TResult>(
  submitFn: () => Promise<TResult>,
  options?: {
    onSuccess?: (result: TResult) => void;
    onError?: (error: Error) => void;
  }
) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = useCallback(
    async (e?: React.FormEvent) => {
      e?.preventDefault();
      
      if (isSubmitting) return; // Prevent double submission
      
      setIsSubmitting(true);
      setError(null);

      try {
        const result = await submitFn();
        options?.onSuccess?.(result);
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "Terjadi kesalahan";
        setError(message);
        options?.onError?.(err instanceof Error ? err : new Error(message));
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [submitFn, options, isSubmitting]
  );

  return {
    handleSubmit,
    isSubmitting,
    error,
    setError,
  };
}
