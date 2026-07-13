import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertOctagon, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const isArabic = localStorage.getItem('language') === 'ar';

      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 font-sans selection:bg-rose-500/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(244,63,94,0.07)_0,transparent_100%)] pointer-events-none" />
          
          <div className="relative w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-rose-500 to-amber-500" />
            
            <div className="mx-auto w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mb-6 border border-rose-500/20">
              <AlertOctagon className="w-8 h-8 text-rose-500 animate-pulse" />
            </div>

            <h1 className="text-xl font-semibold text-slate-200 tracking-tight mb-2">
              {isArabic ? 'حدث خطأ غير متوقع' : 'Something went wrong'}
            </h1>
            
            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              {isArabic 
                ? 'فشل التطبيق في تحميل هذا الجزء من الواجهة. تم تسجيل الخطأ داخلياً.'
                : 'The application failed to load this section. The error has been logged automatically.'}
            </p>

            {this.state.error && (
              <div className="mb-6 p-4 bg-slate-950/80 rounded-xl border border-slate-800 text-left overflow-x-auto max-h-32 scrollbar-thin">
                <code className="text-xs font-mono text-rose-400/90 whitespace-pre-wrap">
                  {this.state.error.toString()}
                </code>
              </div>
            )}

            <button
              onClick={this.handleReset}
              className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white font-medium rounded-xl shadow-lg shadow-rose-950/40 hover:shadow-rose-950/60 active:scale-[0.98] transition-all duration-200"
            >
              <RefreshCw className="w-4 h-4" />
              <span>{isArabic ? 'إعادة تحميل الصفحة' : 'Reload Application'}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
