/**
 * Reusable Component Patterns
 * Phase 8: Data and Components
 */

import React, { ReactNode, ComponentType, ErrorInfo, Suspense } from 'react';

// ============================================================================
// ERROR BOUNDARY
// ============================================================================

interface ErrorBoundaryProps {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode);
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        this.props.onError?.(error, errorInfo);
    }

    reset = (): void => {
        this.setState({ hasError: false, error: null });
    };

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            if (typeof this.props.fallback === 'function') {
                return this.props.fallback(this.state.error, this.reset);
            }
            return this.props.fallback || <DefaultErrorFallback error={this.state.error} reset={this.reset} />;
        }
        return this.props.children;
    }
}

function DefaultErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
    return (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
            <h3 className="text-lg font-bold text-red-600 dark:text-red-400 mb-2">
                Đã xảy ra lỗi
            </h3>
            <p className="text-sm text-red-500 dark:text-red-300 mb-4">
                {error.message}
            </p>
            <button
                onClick={reset}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
                Thử lại
            </button>
        </div>
    );
}

// ============================================================================
// LOADING STATES
// ============================================================================

interface LoadingProps {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingProps) {
    const sizeClasses = {
        sm: 'w-4 h-4',
        md: 'w-8 h-8',
        lg: 'w-12 h-12',
    };

    return (
        <div className={`${sizeClasses[size]} ${className}`}>
            <div className="animate-spin rounded-full border-2 border-gray-300 border-t-emerald-500 h-full w-full" />
        </div>
    );
}

export function LoadingSkeleton({ className = '' }: { className?: string }) {
    return (
        <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />
    );
}

// ============================================================================
// CONDITIONAL RENDERING
// ============================================================================

interface ShowProps {
    when: boolean | unknown;
    fallback?: ReactNode;
    children: ReactNode;
}

export function Show({ when, fallback = null, children }: ShowProps) {
    return <>{when ? children : fallback}</>;
}

interface ForProps<T> {
    each: T[];
    fallback?: ReactNode;
    children: (item: T, index: number) => ReactNode;
}

export function For<T>({ each, fallback = null, children }: ForProps<T>) {
    if (each.length === 0) return <>{fallback}</>;
    return <>{each.map((item, index) => children(item, index))}</>;
}

// ============================================================================
// ASYNC COMPONENT WRAPPER
// ============================================================================

interface AsyncProps<T> {
    promise: Promise<T>;
    loading?: ReactNode;
    error?: (err: Error) => ReactNode;
    children: (data: T) => ReactNode;
}

export function Async<T>({ promise, loading, error, children }: AsyncProps<T>) {
    const [state, setState] = React.useState<{
        status: 'pending' | 'fulfilled' | 'rejected';
        data?: T;
        error?: Error;
    }>({ status: 'pending' });

    React.useEffect(() => {
        promise
            .then(data => setState({ status: 'fulfilled', data }))
            .catch(error => setState({ status: 'rejected', error }));
    }, [promise]);

    if (state.status === 'pending') {
        return <>{loading || <LoadingSpinner />}</>;
    }

    if (state.status === 'rejected') {
        return <>{error ? error(state.error!) : <DefaultErrorFallback error={state.error!} reset={() => { }} />}</>;
    }

    return <>{children(state.data!)}</>;
}

// ============================================================================
// PORTAL
// ============================================================================

import { createPortal } from 'react-dom';

interface PortalProps {
    children: ReactNode;
    container?: Element | null;
}

export function Portal({ children, container }: PortalProps) {
    const target = container || (typeof document !== 'undefined' ? document.body : null);
    if (!target) return null;
    return createPortal(children, target);
}

// ============================================================================
// HOC UTILITIES
// ============================================================================

/**
 * With loading HOC
 */
export function withLoading<P extends object>(
    Component: ComponentType<P>,
    LoadingComponent: ComponentType = LoadingSpinner
) {
    return function WithLoadingComponent(props: P & { isLoading?: boolean }) {
        const { isLoading, ...rest } = props;
        if (isLoading) return <LoadingComponent />;
        return <Component {...(rest as P)} />;
    };
}

/**
 * With error boundary HOC
 */
export function withErrorBoundary<P extends object>(
    Component: ComponentType<P>,
    fallback?: ErrorBoundaryProps['fallback']
) {
    return function WithErrorBoundaryComponent(props: P) {
        return (
            <ErrorBoundary fallback={fallback}>
                <Component {...props} />
            </ErrorBoundary>
        );
    };
}
