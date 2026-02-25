import { uiLogger } from '@/utils/logger';
import React, { Component, ReactNode, ErrorInfo } from 'react';
import analytics from '@/lib/analytics';
import * as Sentry from '@sentry/react';
import { translate } from '@/hooks/useTranslation';

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

interface State {
    hasError: boolean;
    error?: Error;
    errorInfo?: ErrorInfo;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 */
export class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        uiLogger.error('ErrorBoundary caught error', { error, errorInfo });

        // Track error with Sentry (production monitoring)
        Sentry.withScope((scope) => {
            scope.setContext('react', {
                componentStack: errorInfo.componentStack,
            });
            Sentry.captureException(error);
        });

        // Track error with analytics (internal tracking)
        analytics.trackError(error, {
            componentStack: errorInfo.componentStack,
            location: window.location.href,
        });

        this.setState({ errorInfo });
    }

    render() {
        const t = translate;

        if (this.state.hasError) {
            // Custom fallback UI
            if (this.props.fallback) {
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-8">
                    <div className="max-w-md w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-8 border border-red-500/50">
                        <div className="text-center">
                            <div className="text-6xl mb-4">⚠️</div>
                            <h1 className="text-2xl font-bold text-white mb-2">
                                {t('errorboundary.oops_something_went_wrong')}</h1>
                            <p className="text-gray-400 mb-6">
                                {t('errorboundary.we_ve_encountered_an_unexpecte')}</p>

                            {import.meta.env.DEV && this.state.error && (
                                <details className="text-left bg-gray-900 rounded p-4 mb-4">
                                    <summary className="cursor-pointer text-red-400 font-mono text-sm mb-2">
                                        {t('errorboundary.error_details_dev_only')}</summary>
                                    <pre className="text-xs text-gray-300 overflow-auto">
                                        {this.state.error.message}
                                        {'\n\n'}
                                        {this.state.error.stack}
                                    </pre>
                                </details>
                            )}

                            <button
                                onClick={() => window.location.reload()}
                                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg font-medium hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                            >
                                {t('errorboundary.reload_page')}</button>

                            <button
                                onClick={() => window.location.href = '/'}
                                className="ml-3 px-6 py-3 bg-gray-700 text-white rounded-lg font-medium hover:bg-gray-600 transition-colors"
                            >
                                {t('errorboundary.go_home')}</button>
                        </div>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
