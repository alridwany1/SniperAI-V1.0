import React, { useState, useEffect, useRef } from 'react';
import { Bell, BellRing, AlertTriangle, CheckCircle2, ShieldAlert, Settings, X, Trash2, Check, Sparkles } from 'lucide-react';
import { AppNotification } from '../types';
import { Language } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';

interface NotificationCenterProps {
  notifications: AppNotification[];
  language: Language;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onClearAll: () => void;
  onDeleteNotification: (id: string) => void;
}

export default function NotificationCenter({
  notifications,
  language,
  onMarkRead,
  onMarkAllRead,
  onClearAll,
  onDeleteNotification,
}: NotificationCenterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div ref={containerRef} className="relative z-50">
      {/* Notification Bell Button */}
      <button
        id="notification-bell-btn"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-xl transition-all border cursor-pointer ${
          isOpen
            ? 'bg-indigo-600/10 text-indigo-400 border-indigo-500/30'
            : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-800'
        }`}
        title={language === 'ar' ? 'التنبيهات والتحذيرات' : 'System alerts & notifications'}
      >
        {unreadCount > 0 ? (
          <div className="relative">
            <BellRing className="w-5 h-5 text-indigo-400 animate-wiggle" />
            <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[9px] font-bold text-white ring-2 ring-slate-950">
              {unreadCount}
            </span>
            <span className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-rose-500 animate-ping opacity-75 pointer-events-none" />
          </div>
        ) : (
          <Bell className="w-5 h-5 text-slate-400" />
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            id="notifications-dropdown-panel"
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute mt-3 w-80 md:w-96 rounded-2xl border border-slate-800 bg-slate-950 shadow-2xl p-4 overflow-hidden ${
              language === 'ar' ? 'left-0 origin-top-left' : 'right-0 origin-top-right'
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-white tracking-tight uppercase font-display flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                  {language === 'ar' ? 'مجرى تنبيهات التحكم العام' : 'Global Alert Stream'}
                </h3>
                <p className="text-[9px] text-slate-500 font-light mt-0.5">
                  {language === 'ar' ? `${unreadCount} تنبيهات غير مقروءة` : `${unreadCount} unread active alerts`}
                </p>
              </div>

              {notifications.length > 0 && (
                <div className="flex items-center gap-2">
                  <button
                    id="notifications-mark-all-btn"
                    onClick={() => {
                      onMarkAllRead();
                    }}
                    className="text-[9px] text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer flex items-center gap-1"
                    title={language === 'ar' ? 'تأكيد قراءة الجميع' : 'Acknowledge all alerts'}
                  >
                    <Check className="w-3 h-3" />
                    <span>{language === 'ar' ? 'تأكيد الكل' : 'Ack All'}</span>
                  </button>
                  <span className="text-slate-800 text-[10px]">|</span>
                  <button
                    id="notifications-clear-all-btn"
                    onClick={() => {
                      onClearAll();
                    }}
                    className="text-[9px] text-slate-500 hover:text-rose-400 font-semibold cursor-pointer flex items-center gap-1"
                    title={language === 'ar' ? 'مسح كل الإشعارات' : 'Clear all alerts'}
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>{language === 'ar' ? 'مسح' : 'Clear'}</span>
                  </button>
                </div>
              )}
            </div>

            {/* List Container */}
            <div className="max-h-[350px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {notifications.length === 0 ? (
                <div className="py-10 flex flex-col items-center justify-center text-center space-y-2">
                  <div className="p-3 bg-slate-900 rounded-full border border-slate-800 text-slate-600">
                    <CheckCircle2 className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">
                      {language === 'ar' ? 'مجرى التنبيهات طبيعي' : 'Alert Stream Nominal'}
                    </p>
                    <p className="text-[9px] text-slate-600 font-light mt-0.5">
                      {language === 'ar' ? 'لا توجد تنبيهات نشطة معلقة حالياً.' : 'No active system or anomaly alerts.'}
                    </p>
                  </div>
                </div>
              ) : (
                <AnimatePresence initial={false}>
                  {notifications.map((noti) => {
                    // Type styling
                    let typeColor = '';
                    let typeLabel = '';
                    let Icon = Settings;

                    if (noti.type === 'ANOMALY') {
                      typeColor = 'from-rose-500/10 to-transparent border-rose-500/20';
                      typeLabel = language === 'ar' ? 'شذوذ مالي' : 'ANOMALY';
                      Icon = ShieldAlert;
                    } else if (noti.type === 'TASK') {
                      typeColor = 'from-indigo-500/10 to-transparent border-indigo-500/20';
                      typeLabel = language === 'ar' ? 'عملية خلفية' : 'TASK COMPLETED';
                      Icon = CheckCircle2;
                    } else {
                      typeColor = 'from-slate-800/20 to-transparent border-slate-800/30';
                      typeLabel = language === 'ar' ? 'حدث بالنظام' : 'SYSTEM';
                      Icon = Settings;
                    }

                    return (
                      <motion.div
                        key={noti.id}
                        layout
                        initial={{ opacity: 0, x: language === 'ar' ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className={`group relative p-3 rounded-xl border bg-gradient-to-r text-start transition-all ${typeColor} ${
                          noti.read ? 'opacity-60 hover:opacity-100' : 'opacity-100'
                        }`}
                      >
                        {/* Status indicators */}
                        {!noti.read && (
                          <span className={`absolute top-3.5 ${language === 'ar' ? 'left-3' : 'right-3'} flex h-1.5 w-1.5`}>
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-500"></span>
                          </span>
                        )}

                        <div className="flex gap-3">
                          {/* Icon Container */}
                          <div className={`mt-0.5 p-1.5 rounded-lg border h-7 w-7 flex items-center justify-center shrink-0 ${
                            noti.type === 'ANOMALY' 
                              ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' 
                              : noti.type === 'TASK' 
                                ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' 
                                : 'bg-slate-900 text-slate-400 border-slate-800'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>

                          {/* Text Body */}
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[8px] font-mono font-bold tracking-wide uppercase px-1.5 py-0.2 rounded border ${
                                noti.type === 'ANOMALY'
                                  ? 'bg-rose-500/5 text-rose-400 border-rose-500/10'
                                  : noti.type === 'TASK'
                                    ? 'bg-indigo-500/5 text-indigo-400 border-indigo-500/10'
                                    : 'bg-slate-900 text-slate-500 border-slate-800'
                              }`}>
                                {typeLabel}
                              </span>
                              <span className="text-[9px] text-slate-500 font-mono">
                                {noti.timestamp}
                              </span>
                            </div>

                            <p className="text-[10px] font-bold text-slate-100 mt-1 line-clamp-1 leading-snug">
                              {language === 'ar' ? noti.titleAr : noti.titleEn}
                            </p>
                            <p className="text-[9px] text-slate-400 font-light mt-0.5 leading-relaxed">
                              {language === 'ar' ? noti.messageAr : noti.messageEn}
                            </p>
                          </div>
                        </div>

                        {/* Action buttons (dismiss, read) */}
                        <div className={`absolute bottom-2 ${language === 'ar' ? 'left-2' : 'right-2'} flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                          {!noti.read && (
                            <button
                              onClick={() => onMarkRead(noti.id)}
                              className="p-1 rounded bg-slate-900 hover:bg-indigo-600/20 border border-slate-800 text-slate-400 hover:text-indigo-400 cursor-pointer"
                              title={language === 'ar' ? 'تأكيد القراءة' : 'Mark as read'}
                            >
                              <Check className="w-2.5 h-2.5" />
                            </button>
                          )}
                          <button
                            onClick={() => onDeleteNotification(noti.id)}
                            className="p-1 rounded bg-slate-900 hover:bg-rose-600/20 border border-slate-800 text-slate-400 hover:text-rose-400 cursor-pointer"
                            title={language === 'ar' ? 'حذف التنبيه' : 'Remove notification'}
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
