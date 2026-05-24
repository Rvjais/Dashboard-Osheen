import { Component, ErrorInfo, ReactNode } from 'react';
import Button from './ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-brand-sidebar flex items-center justify-center p-8">
          <div className="bg-white rounded-3xl shadow-2xl p-10 max-w-md text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-red-50 flex items-center justify-center mx-auto">
              <span className="text-4xl">⚠️</span>
            </div>
            <h2 className="text-2xl font-display font-bold text-gray-900">Something went wrong</h2>
            <p className="text-sm text-gray-500 leading-relaxed">
              The application encountered an unexpected error. Please try refreshing the page.
            </p>
            {this.state.error && (
              <p className="text-[10px] font-mono text-gray-400 bg-gray-50 p-3 rounded-xl text-left truncate">
                {this.state.error.message}
              </p>
            )}
            <Button
              className="w-full py-3 rounded-xl"
              onClick={() => window.location.reload()}
            >
              Refresh Page
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
