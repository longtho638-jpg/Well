import React, { Component, ErrorInfo, ReactNode } from 'react';
import { createLogger } from '@/utils/logger';
import { translate } from '@/hooks/useTranslation';

const errorLogger = createLogger('ErrorBoundary');

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Aura Elite ErrorBoundary - catches React errors, logs via structured logger,
 * and displays a glassmorphism-styled fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    errorLogger.error('Uncaught error in component tree', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });

    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render(): ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    if (this.props.fallback) {
      return this.props.fallback;
    }

    const t = translate;
    const isDev = import.meta.env.DEV;

    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 flex items-center justify-center p-6">
        {/* Background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-lg w-full">
          {/* Glassmorphism card */}
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl shadow-red-500/5 p-8">
            {/* Error icon */}
            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-red-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
                  />
                </svg>
              </div>
            </div>

            {/* Title & description */}
            <h1 className="text-2xl font-bold text-white text-center mb-2 font-display">
              {t('errorboundary.oops_something_went_wrong')}
            </h1>
            <p className="text-zinc-400 text-center mb-8 text-sm leading-relaxed">
              {t('errorboundary.we_ve_encountered_an_unexpecte')}
            </p>

            {/* Dev-only error details */}
            {isDev && this.state.error && (
              <details className="mb-6 bg-zinc-900/60 rounded-xl border border-white/5 overflow-hidden">
                <summary className="cursor-pointer px-4 py-3 text-red-400 font-mono text-xs hover:bg-white/5 transition-colors">
                  {t('errorboundary.error_details_dev_only')}
                </summary>
                <pre className="px-4 py-3 text-xs text-zinc-300 overflow-auto max-h-48 border-t border-white/5 whitespace-pre-wrap break-words">
                  {this.state.error.message}
                  {'\n\n'}
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 px-5 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl font-medium text-sm hover:from-emerald-500 hover:to-teal-500 transition-all shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 cursor-pointer"
              >
                {t('errorboundary.retry')}
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-5 py-3 bg-white/5 border border-white/10 text-white rounded-xl font-medium text-sm hover:bg-white/10 transition-all cursor-pointer"
              >
                {t('errorboundary.reload')}
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 px-5 py-3 bg-white/5 border border-white/10 text-zinc-400 rounded-xl font-medium text-sm hover:bg-white/10 hover:text-white transition-all cursor-pointer"
              >
                {t('errorboundary.go_home')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default ErrorBoundary;
