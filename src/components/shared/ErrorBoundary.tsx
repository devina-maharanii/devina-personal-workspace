"use client";

import { Component, ReactNode } from "react";
import * as Sentry from "@sentry/nextjs";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI — if not provided, renders default inline error card */
  fallback?: ReactNode;
  /** Label for the section — used in Sentry breadcrumb */
  label?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Client-side React error boundary for wrapping arbitrary sub-sections.
 * Reports caught errors to Sentry with an optional section label.
 *
 * Usage:
 * ```tsx
 * <ErrorBoundary label="AnalyticsChart">
 *   <HeavyComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    Sentry.withScope((scope) => {
      if (this.props.label) {
        scope.setTag("component", this.props.label);
        scope.setContext("componentStack", { stack: info.componentStack });
      }
      Sentry.captureException(error);
    });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-900/40 bg-rose-950/10 p-8 text-center">
          <div className="h-10 w-10 rounded-xl border border-rose-800/30 bg-rose-950/40 flex items-center justify-center">
            <AlertTriangle className="h-5 w-5 text-rose-400" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-zinc-200">
              {this.props.label ? `Failed to load ${this.props.label}` : "Something went wrong"}
            </p>
            <p className="text-xs text-zinc-500 max-w-xs">
              {this.state.error?.message || "An unexpected error occurred in this section."}
            </p>
          </div>
          <button
            onClick={this.handleRetry}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white text-xs font-medium transition-colors"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Retry
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
