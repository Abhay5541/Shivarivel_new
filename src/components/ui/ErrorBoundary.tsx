import { Component, type ErrorInfo, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from './Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Application Error Boundary caught an error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-[#F7F5F0]">
          <div className="max-w-md w-full bg-white border border-[#E2DDD5] rounded-xl p-8 text-center shadow-sm">
            <div className="w-12 h-12 rounded-full bg-[#FCEEEE] border border-[#9E2A2B]/20 flex items-center justify-center text-[#9E2A2B] mx-auto mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-[#242424] font-heading mb-2">
              Something went wrong.
            </h2>
            <p className="text-xs text-[#6B6B6B] mb-6 leading-relaxed">
              An unexpected error occurred while loading this view. Your existing data remains completely secure. Please try reloading the page.
            </p>
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="primary"
                onClick={this.handleReset}
                className="gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try again
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
