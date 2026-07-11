import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';
import { Language } from '../utils/translations';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  language: Language;
}

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, language }: ConfirmModalProps) {
  const isRTL = language === 'ar';
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="w-full max-w-md bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl relative overflow-hidden"
          >
            {/* Top Close Button */}
            <button
              onClick={onClose}
              className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-900 transition-colors cursor-pointer`}
            >
              <X className="w-4 h-4" />
            </button>

            <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse text-right' : 'flex-row text-left'} items-start`}>
              <div className="flex-shrink-0 p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl h-fit">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-semibold text-slate-100 tracking-tight">
                  {title}
                </h3>
                <p className="mt-2 text-sm text-slate-400 leading-relaxed">
                  {message}
                </p>
              </div>
            </div>

            <div className={`mt-6 flex gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'} justify-end`}>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl transition-colors cursor-pointer"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer shadow-lg shadow-rose-900/20"
              >
                {language === 'ar' ? 'تأكيد الحذف' : 'Confirm Delete'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
