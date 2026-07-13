import React, { createContext, useContext, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  toasts: Toast[];
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration: number = 4000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, [removeToast]);

  const isArabic = localStorage.getItem('language') === 'ar';

  return (
    <ToastContext.Provider value={{ showToast, toasts, removeToast }}>
      {children}
      
      {/* Toast Portal/Container */}
      <div 
        className={`fixed bottom-6 z-[9999] flex flex-col gap-3 max-w-sm w-full px-6 pointer-events-none ${
          isArabic ? 'left-0' : 'right-0'
        }`}
      >
        <AnimatePresence>
          {toasts.map((toast) => {
            let Icon = Info;
            let themeClass = '';

            switch (toast.type) {
              case 'success':
                Icon = CheckCircle2;
                themeClass = 'bg-slate-900 border-emerald-500/30 text-emerald-400 shadow-emerald-950/20';
                break;
              case 'error':
                Icon = AlertCircle;
                themeClass = 'bg-slate-900 border-rose-500/30 text-rose-400 shadow-rose-950/20';
                break;
              case 'warning':
                Icon = AlertTriangle;
                themeClass = 'bg-slate-900 border-amber-500/30 text-amber-400 shadow-amber-950/20';
                break;
              case 'info':
              default:
                Icon = Info;
                themeClass = 'bg-slate-900 border-indigo-500/30 text-indigo-400 shadow-indigo-950/20';
                break;
            }

            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.8, transition: { duration: 0.15 } }}
                className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-xl ${themeClass}`}
              >
                <div className="shrink-0 mt-0.5">
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-slate-100 leading-relaxed break-words">
                    {toast.message}
                  </p>
                </div>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors p-0.5 rounded hover:bg-slate-800"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};
