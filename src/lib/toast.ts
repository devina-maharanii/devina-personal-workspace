import {
  toast as sonnerToast,
  type ExternalToast,
} from "sonner";
import { CheckCircle2, AlertOctagon, AlertTriangle, Info, Loader2 } from "lucide-react";
import React from 'react';

// ─── Toaster Configuration ─────────────────────────────────────────────────────
// Import and place <AppToaster /> in Providers.tsx

export { Toaster as SonnerToaster } from "sonner";

/** Default props for the <Toaster /> component. Spread into your Providers. */
export const toasterProps = {
  position: "bottom-right" as const,
  visibleToasts: 3,
  closeButton: true,
  duration: 4000,
  theme: "dark" as const,
  icons: {
    success: React.createElement(CheckCircle2, { className: "h-4.5 w-4.5 text-emerald-400 shrink-0" }),
    error: React.createElement(AlertOctagon, { className: "h-4.5 w-4.5 text-rose-400 shrink-0" }),
    warning: React.createElement(AlertTriangle, { className: "h-4.5 w-4.5 text-amber-400 shrink-0" }),
    info: React.createElement(Info, { className: "h-4.5 w-4.5 text-indigo-400 shrink-0" }),
    loading: React.createElement(Loader2, { className: "h-4.5 w-4.5 text-indigo-400 animate-spin shrink-0" }),
  },
  toastOptions: {
    classNames: {
      toast:
        "!bg-zinc-950/80 !backdrop-blur-md !border !border-zinc-800 !text-zinc-100 !rounded-2xl !shadow-xl !px-4 !py-3.5 !flex !items-center !gap-3 !w-full sm:!w-[356px]",
      title: "!font-semibold !text-xs !text-zinc-100",
      description: "!text-xxs !text-zinc-400 !mt-0.5",
      actionButton: "!bg-indigo-600 !text-white hover:!bg-indigo-500 !text-xxs !font-bold !rounded-xl !px-3 !py-1.5 !transition-all",
      cancelButton: "!bg-zinc-800 !text-zinc-300 hover:!bg-zinc-700 !text-xxs !font-bold !rounded-xl !px-3 !py-1.5 !transition-all",
      closeButton: "!border-zinc-850 !bg-zinc-900 hover:!bg-zinc-800 !text-zinc-400 !transition-all",
      success: "!border-emerald-500/20 !bg-emerald-950/10",
      error: "!border-rose-500/20 !bg-rose-950/10",
      info: "!border-indigo-500/20 !bg-indigo-950/10",
      warning: "!border-amber-500/20 !bg-amber-950/10",
    },
  },
} as const;

// ─── Helper Wrappers ───────────────────────────────────────────────────────────

/** Show a success toast */
export function showSuccess(message: string, opts?: ExternalToast) {
  return sonnerToast.success(message, opts);
}

/** Show an error toast */
export function showError(message: string, opts?: ExternalToast) {
  return sonnerToast.error(message, opts);
}

/** Show an informational toast */
export function showInfo(message: string, opts?: ExternalToast) {
  return sonnerToast.info(message, opts);
}

/** Show a warning toast */
export function showWarning(message: string, opts?: ExternalToast) {
  return sonnerToast.warning(message, opts);
}

/** Show a loading toast — returns the toast id for later dismissal */
export function showLoading(message: string, opts?: ExternalToast): string | number {
  return sonnerToast.loading(message, opts);
}

/** Dismiss a specific toast by id, or all toasts if no id is provided */
export function dismissToast(id?: string | number) {
  return sonnerToast.dismiss(id);
}

/**
 * Show a promise toast that transitions through loading → success / error.
 *
 * @example
 * ```ts
 * showPromise(saveRecord(), {
 *   loading: "Saving...",
 *   success: "Saved successfully!",
 *   error: "Failed to save.",
 * });
 * ```
 */
export function showPromise<T>(
  promise: Promise<T>,
  opts: {
    loading: string;
    success: string | ((data: T) => string);
    error: string | ((err: unknown) => string);
  },
) {
  return sonnerToast.promise(promise, opts);
}

/** Re-export the raw `toast` instance for edge-case custom calls */
export const toast = sonnerToast;
