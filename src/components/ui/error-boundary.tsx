'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';
import { motion } from 'framer-motion';

interface ErrorBoundaryProps {
    children: React.ReactNode;
    fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
    hasError: boolean;
    error?: Error;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
    constructor(props: ErrorBoundaryProps) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error: Error): ErrorBoundaryState {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
        console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    resetError = () => {
        this.setState({ hasError: false, error: undefined });
    };

    render() {
        if (this.state.hasError) {
            if (this.props.fallback) {
                return this.props.fallback;
            }

            return (
                <div className="flex min-h-[400px] w-full flex-col items-center justify-center p-8 text-center">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="bg-red-50 dark:bg-red-900/20 mb-6 flex h-24 w-24 items-center justify-center rounded-3xl"
                    >
                        <AlertCircle className="text-red-500 h-10 w-10" />
                    </motion.div>
                    <motion.h2
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="mb-3 text-2xl font-bold tracking-tight"
                    >
                        Something went wrong
                    </motion.h2>
                    <motion.p
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-muted-foreground mb-8 max-w-md"
                    >
                        {this.state.error?.message ||
                            "We encountered an unexpected error. Don't worry, your data is safe."}
                    </motion.p>
                    <div className="flex gap-4">
                        <Button onClick={() => window.location.reload()} variant="outline" className="gap-2">
                            <RefreshCw className="h-4 w-4" />
                            Reload Page
                        </Button>
                        <Button onClick={this.resetError} className="gap-2">
                            Try Again
                        </Button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
