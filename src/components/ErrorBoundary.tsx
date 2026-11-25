import { Component, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message?: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: unknown): State {
    return { hasError: true, message: error instanceof Error ? error.message : String(error) };
  }

  componentDidCatch(error: unknown) {
    console.error('CyberLens render error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-[#050810] px-4">
          <div className="max-w-md text-center">
            <h1 className="font-mono text-cyber-cyan text-xl mb-3">CyberLens · Xatolik</h1>
            <p className="text-gray-400 text-sm mb-4">
              Ilovani yuklashda kutilmagan xatolik yuz berdi. Sahifani yangilang.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2.5 bg-cyber-cyan text-cyber-black font-mono text-sm rounded hover:bg-cyber-cyan/90 transition-colors"
            >
              Qayta yuklash
            </button>
            {this.state.message && (
              <p className="mt-4 text-[11px] text-gray-600 font-mono break-all">{this.state.message}</p>
            )}
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
