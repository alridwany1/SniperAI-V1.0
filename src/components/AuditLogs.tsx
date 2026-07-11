import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../utils/translations';
import { 
  getAuditLogs, clearAuditLogs, addAuditLog, AuditCategory, AuditStatus, AuditLogEntry 
} from '../utils/auditLogger';
import ConfirmModal from './ConfirmModal';
import { 
  Search, Shield, ShieldAlert, Clock, Terminal, Globe, 
  Trash2, Download, RefreshCcw, AlertTriangle, CheckCircle, 
  Info, Filter, Cpu, Database, Eye, X, Copy, Check
} from 'lucide-react';

interface AuditLogsProps {
  language: Language;
  currentUserEmail: string;
}

export default function AuditLogs({ language, currentUserEmail }: AuditLogsProps) {
  const t = translations[language];
  const isRTL = language === 'ar';

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // Load audit logs
  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const handleRefresh = () => {
    setLogs(getAuditLogs());
  };

  const handleClearLogs = () => {
    setIsConfirmOpen(true);
  };

  const executeClearLogs = () => {
    clearAuditLogs();
    // Log the clear action itself in the newly cleared list
    addAuditLog(currentUserEmail, 'SECURITY', 'Security audit log reset and archived by administrator.', 'WARNING');
    setLogs(getAuditLogs());
  };

  const handleCopyLogId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // CSV Exporter
  const handleExportCSV = () => {
    try {
      const headers = ['Log ID', 'Timestamp (UTC)', 'Category', 'Triggered By', 'Event Description', 'Status', 'IP Address'];
      const rows = logs.map(log => [
        log.id,
        log.timestamp,
        log.category,
        log.user,
        log.action.replace(/"/g, '""'), // Escape double quotes for CSV
        log.status,
        log.ipAddress || '127.0.0.1'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\ufeff' 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sniper_audit_ledger_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV', e);
    }
  };

  // Filter logs
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(searchTerm));

    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesCategory && matchesStatus;
  });

  // Get icons and colors for Category
  const getCategoryBadge = (category: AuditCategory) => {
    switch (category) {
      case 'SECURITY':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
          icon: <Shield className="w-3.5 h-3.5" />,
          label: language === 'ar' ? 'أمني' : 'SECURITY'
        };
      case 'ADMIN':
        return {
          bg: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
          icon: <Cpu className="w-3.5 h-3.5" />,
          label: language === 'ar' ? 'إداري' : 'ADMIN'
        };
      case 'WORKSPACE':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          icon: <Globe className="w-3.5 h-3.5" />,
          label: language === 'ar' ? 'مساحة العمل' : 'WORKSPACE'
        };
      case 'ANALYTICS':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          icon: <Terminal className="w-3.5 h-3.5" />,
          label: language === 'ar' ? 'تحليلات' : 'ANALYTICS'
        };
      case 'SYSTEM':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <Database className="w-3.5 h-3.5" />,
          label: language === 'ar' ? 'نظام تلقائي' : 'SYSTEM'
        };
    }
  };

  // Get styles for Status
  const getStatusBadge = (status: AuditStatus) => {
    switch (status) {
      case 'SUCCESS':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/15',
          icon: <CheckCircle className="w-3 h-3 text-emerald-400" />,
          label: language === 'ar' ? 'نجاح' : 'Success'
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-500/10 text-amber-400 border-amber-500/15',
          icon: <AlertTriangle className="w-3 h-3 text-amber-400" />,
          label: language === 'ar' ? 'تحذير' : 'Warning'
        };
      case 'INFO':
        return {
          bg: 'bg-blue-500/10 text-blue-400 border-blue-500/15',
          icon: <Info className="w-3 h-3 text-blue-400" />,
          label: language === 'ar' ? 'إشعار' : 'Info'
        };
      case 'ERROR':
        return {
          bg: 'bg-rose-500/10 text-rose-400 border-rose-500/15',
          icon: <ShieldAlert className="w-3 h-3 text-rose-400" />,
          label: language === 'ar' ? 'خطأ أمني' : 'Failure'
        };
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Search and Advanced filter controls */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-900">
          
          {/* Query search */}
          <div className="flex-1 max-w-lg relative">
            <span className={`absolute inset-y-0 ${isRTL ? 'right-3' : 'left-3'} flex items-center text-slate-500`}>
              <Search className="w-4 h-4 text-slate-500" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={language === 'ar' ? 'البحث بالحدث، المستخدم، المعرّف، أو عنوان IP...' : 'Search logs by event, operator, log ID, or IP...'}
              className={`w-full bg-slate-900 text-white text-xs ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 focus:outline-none transition-all`}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {language === 'ar' ? 'الفئة' : 'Category'}
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value="All" className="bg-slate-950 text-white">{t.allPlans}</option>
                <option value="SECURITY" className="bg-slate-950 text-white">{language === 'ar' ? 'أمني' : 'Security'}</option>
                <option value="ADMIN" className="bg-slate-950 text-white">{language === 'ar' ? 'إداري' : 'Admin Operations'}</option>
                <option value="WORKSPACE" className="bg-slate-950 text-white">{language === 'ar' ? 'مساحة العمل' : 'Workspace'}</option>
                <option value="ANALYTICS" className="bg-slate-950 text-white">{language === 'ar' ? 'تحليلات' : 'Analytics & AI'}</option>
                <option value="SYSTEM" className="bg-slate-950 text-white">{language === 'ar' ? 'النظام تلقائي' : 'System automated'}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {language === 'ar' ? 'الحالة' : 'Status'}
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value="All" className="bg-slate-950 text-white">{t.allPlans}</option>
                <option value="SUCCESS" className="bg-slate-950 text-white">{language === 'ar' ? 'ناجح' : 'Success'}</option>
                <option value="WARNING" className="bg-slate-950 text-white">{language === 'ar' ? 'تحذير' : 'Warning'}</option>
                <option value="INFO" className="bg-slate-950 text-white">{language === 'ar' ? 'إشعار' : 'Info'}</option>
                <option value="ERROR" className="bg-slate-950 text-white">{language === 'ar' ? 'خطأ/فشل' : 'Failure'}</option>
              </select>
            </div>

            {/* Refresh Action */}
            <button
              onClick={handleRefresh}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800 transition-colors cursor-pointer"
              title={language === 'ar' ? 'تحديث السجلات' : 'Refresh Ledger'}
            >
              <RefreshCcw className="w-4 h-4" />
            </button>

            {/* Export Trigger */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl border border-slate-800 shadow-sm cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>{t.exportLogs}</span>
            </button>

            {/* Clear Trigger */}
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-2 bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 hover:text-rose-300 text-xs font-semibold px-4.5 py-2.5 rounded-xl border border-rose-900/30 shadow-sm cursor-pointer transition-all"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>{t.clearLogs}</span>
            </button>
          </div>
        </div>

        {/* Chronological Table */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <Globe className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-xs font-light">{t.noLogsFound}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-24`}>{t.logTimestamp}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-32`}>{t.logType}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-44`}>{t.logUser}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{t.logEvent}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-24`}>{t.logStatus}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-32`}>IP Address</th>
                  <th className={`pb-3.5 text-center w-12`}>Inspect</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs font-light">
                {filteredLogs.map((log) => {
                  const categoryInfo = getCategoryBadge(log.category);
                  const statusInfo = getStatusBadge(log.status);

                  return (
                    <tr key={log.id} className="hover:bg-slate-900/25 transition-colors font-mono">
                      {/* Timestamp */}
                      <td className="py-3.5 pr-3 text-slate-400 text-[11px] text-start">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-600" />
                          <span>{new Date(log.timestamp).toLocaleTimeString(undefined, {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'})}</span>
                        </div>
                        <div className="text-[9px] text-slate-600 mt-0.5">
                          {new Date(log.timestamp).toLocaleDateString(undefined, {month: '2-digit', day: '2-digit'})}
                        </div>
                      </td>

                      {/* Category Badge */}
                      <td className="py-3.5">
                        <div className="flex justify-start">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider uppercase ${categoryInfo.bg}`}>
                            {categoryInfo.icon}
                            <span>{categoryInfo.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* User operator */}
                      <td className="py-3.5 text-start pr-4 max-w-[170px] truncate" title={log.user}>
                        <span className={`font-semibold ${log.user === 'SYSTEM' ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {log.user === 'SYSTEM' ? '⚙ SYSTEM_DECR' : log.user}
                        </span>
                      </td>

                      {/* Action / Event Description */}
                      <td className={`py-3.5 text-start pr-4 font-sans text-xs text-slate-300 leading-normal max-w-sm truncate`} title={log.action}>
                        {log.action}
                      </td>

                      {/* Status */}
                      <td className="py-3.5">
                        <div className="flex justify-start">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-lg border text-[10px] font-semibold ${statusInfo.bg}`}>
                            {statusInfo.icon}
                            <span>{statusInfo.label}</span>
                          </span>
                        </div>
                      </td>

                      {/* IP address */}
                      <td className="py-3.5 text-start text-slate-500 text-[11px]">
                        {log.ipAddress || '127.0.0.1'}
                      </td>

                      {/* Inspect details */}
                      <td className="py-3.5 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1 bg-slate-900 hover:bg-indigo-500/10 text-slate-500 hover:text-indigo-400 rounded-lg border border-slate-800 transition-all cursor-pointer"
                          title={language === 'ar' ? 'عرض تفاصيل السجل' : 'Inspect Details'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* DETAILED LOG INSPECT MODAL */}
      <AnimatePresence>
        {selectedLog && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg bg-[#0a0f1d] border border-slate-800 rounded-3xl p-6 relative shadow-2xl text-start"
              dir={isRTL ? 'rtl' : 'ltr'}
            >
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className={`absolute top-4.5 ${isRTL ? 'left-4.5' : 'right-4.5'} text-slate-500 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-slate-900`}
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-6 border-b border-slate-900 pb-4">
                <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-tight">
                    {language === 'ar' ? 'معلومات السجل التفصيلية' : 'Log Transaction Receipt'}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedLog.id}</p>
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs text-slate-300">
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{language === 'ar' ? 'معرف السجل' : 'Log UUID'}</span>
                  <div className="col-span-2 flex items-center gap-1.5">
                    <span className="text-white select-all">{selectedLog.id}</span>
                    <button 
                      onClick={() => handleCopyLogId(selectedLog.id)}
                      className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-indigo-400 transition-colors"
                    >
                      {copiedId === selectedLog.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{language === 'ar' ? 'توقيت الحدث' : 'Timestamp (ISO)'}</span>
                  <span className="col-span-2 text-white">{selectedLog.timestamp}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الفئة' : 'Category'}</span>
                  <span className="col-span-2 text-indigo-400 font-bold">{selectedLog.category}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{language === 'ar' ? 'المشغل' : 'Operator Entity'}</span>
                  <span className="col-span-2 text-white font-semibold">{selectedLog.user}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">IP Address</span>
                  <span className="col-span-2 text-slate-400">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{language === 'ar' ? 'الحالة' : 'Outcome status'}</span>
                  <span className={`col-span-2 font-bold ${
                    selectedLog.status === 'SUCCESS' ? 'text-emerald-400' : 
                    selectedLog.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                  }`}>{selectedLog.status}</span>
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-2">{language === 'ar' ? 'بيان الحدث والرسالة' : 'Event Narrative'}</span>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 font-sans text-xs text-slate-200 leading-relaxed leading-normal whitespace-pre-wrap">
                    {selectedLog.action}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 cursor-pointer transition-colors"
                >
                  {language === 'ar' ? 'إغلاق التفاصيل' : 'Close Ledger'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeClearLogs}
        title={language === 'ar' ? 'إعادة تعيين سجلات التدقيق' : 'Reset Audit Logs'}
        message={language === 'ar' 
          ? 'هل أنت متأكد من رغبتك في إعادة تعيين سجلات التدقيق؟ ستتم استعادة الأحداث الأساسية للنظام.' 
          : 'Are you sure you want to reset the audit log? Initial system events will be restored.'}
        language={language}
      />
    </div>
  );
}
