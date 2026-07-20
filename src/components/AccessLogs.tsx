import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Language } from '../utils/translations';
import { getAuditLogs, AuditLogEntry, AuditCategory, AuditStatus } from '../utils/auditLogger';
import { 
  Search, Shield, ShieldAlert, Clock, Terminal, Globe, 
  Trash2, Download, RefreshCcw, AlertTriangle, CheckCircle, 
  Info, Filter, Cpu, Database, Eye, X, Copy, Check, UserCheck, 
  SlidersHorizontal, ShieldCheck, Activity
} from 'lucide-react';

interface LocalUser {
  name: string;
  email: string;
  plan?: string;
  createdAt?: string;
}

interface AccessLogsProps {
  language: Language;
  currentUserEmail: string;
  users: LocalUser[];
}

const localTranslations = {
  en: {
    title: 'Administrative Access Logs',
    subtitle: 'Searchable, filterable security audit of all high-privilege administrative actions by operator roles.',
    searchPlaceholder: 'Search by operator email, action, log ID or IP address...',
    allRoles: 'All Roles',
    allCategories: 'All Categories',
    allStatuses: 'All Statuses',
    roleFilterLabel: 'Operator Role',
    categoryFilterLabel: 'Category',
    statusFilterLabel: 'Status',
    exportLabel: 'Export CSV Ledger',
    refreshLabel: 'Refresh Logs',
    inspectLabel: 'Inspect Details',
    totalActions: 'Total Admin Actions',
    sysAdminCount: 'SysAdmin Actions',
    enterpriseAdminCount: 'Enterprise Admin Actions',
    executiveCount: 'Executive Partner Actions',
    systemCount: 'Automated System Actions',
    colTimestamp: 'Timestamp (UTC)',
    colRole: 'Operator Role',
    colOperator: 'Operator Entity',
    colAction: 'Event Description',
    colStatus: 'Outcome Status',
    colIp: 'IP Address',
    noLogs: 'No administrative access records match the active filter criteria.',
    modalTitle: 'Log Transaction Receipt',
    logUuid: 'Log UUID',
    timestampIso: 'Timestamp (ISO)',
    outcomeStatus: 'Outcome Status',
    eventNarrative: 'Event Narrative',
    closeLedger: 'Close Ledger',
    copied: 'Copied!',
    sysAdminRole: 'SysAdmin',
    enterpriseAdminRole: 'Enterprise Admin',
    executiveRole: 'Executive User',
    systemRole: 'System Platform'
  },
  ar: {
    title: 'سجلات الوصول الإدارية والتحكم',
    subtitle: 'تدقيق أمني قابل للبحث والتصفية لجميع الإجراءات الإدارية عالية الامتياز حسب أدوار المشغلين.',
    searchPlaceholder: 'ابحث بالبريد الإلكتروني للمشغل، الإجراء، معرّف السجل أو عنوان IP...',
    allRoles: 'جميع الأدوار',
    allCategories: 'جميع الفئات',
    allStatuses: 'جميع الحالات',
    roleFilterLabel: 'دور المشغل',
    categoryFilterLabel: 'الفئة',
    statusFilterLabel: 'الحالة',
    exportLabel: 'تصدير سجل CSV',
    refreshLabel: 'تحديث السجلات',
    inspectLabel: 'عرض التفاصيل',
    totalActions: 'إجمالي العمليات الإدارية',
    sysAdminCount: 'عمليات مدير النظام',
    enterpriseAdminCount: 'عمليات مدير المؤسسة',
    executiveCount: 'عمليات الشريك التنفيذي',
    systemCount: 'عمليات النظام التلقائية',
    colTimestamp: 'الطابع الزمني (UTC)',
    colRole: 'دور المشغل',
    colOperator: 'المشغل',
    colAction: 'وصف الحدث والعملية',
    colStatus: 'حالة النتيجة',
    colIp: 'عنوان IP',
    noLogs: 'لا توجد سجلات وصول إدارية تطابق معايير التصفية النشطة.',
    modalTitle: 'معلومات السجل التفصيلية للعملية',
    logUuid: 'معرّف السجل',
    timestampIso: 'الطابع الزمني (ISO)',
    outcomeStatus: 'حالة النتيجة',
    eventNarrative: 'تفاصيل الحدث والرسالة',
    closeLedger: 'إغلاق السجل',
    copied: 'تم النسخ!',
    sysAdminRole: 'مشرف النظام',
    enterpriseAdminRole: 'مشرف المؤسسة',
    executiveRole: 'مستخدم تنفيذي',
    systemRole: 'منصة النظام'
  }
};

export default function AccessLogs({ language, currentUserEmail, users }: AccessLogsProps) {
  const isRTL = language === 'ar';
  const lt = localTranslations[language] || localTranslations.en;

  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [selectedLog, setSelectedLog] = useState<AuditLogEntry | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Load logs on mount
  useEffect(() => {
    setLogs(getAuditLogs());
  }, []);

  const handleRefresh = () => {
    setLogs(getAuditLogs());
  };

  const handleCopyLogId = (id: string) => {
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  // Helper to determine role from email
  const getUserRole = (email: string): 'SysAdmin' | 'Enterprise Admin' | 'Executive User' | 'System Platform' => {
    if (email === 'SYSTEM') return 'System Platform';
    
    const emailLower = email.toLowerCase();
    
    // Check if matching a known user to verify plan
    const matchedUser = users.find(u => u.email.toLowerCase() === emailLower);
    
    if (emailLower.includes('admin') || emailLower === 'admin@sniper.ai') {
      return 'SysAdmin';
    }
    
    if (matchedUser) {
      if (matchedUser.plan === 'enterprise') {
        return 'Enterprise Admin';
      }
      return 'Executive User';
    }

    // Default heuristics
    if (emailLower.includes('executive')) {
      return 'Executive User';
    }
    
    return 'Executive User';
  };

  // Translate role name for badge
  const getRoleLabel = (role: 'SysAdmin' | 'Enterprise Admin' | 'Executive User' | 'System Platform') => {
    switch (role) {
      case 'SysAdmin': return lt.sysAdminRole;
      case 'Enterprise Admin': return lt.enterpriseAdminRole;
      case 'Executive User': return lt.executiveRole;
      case 'System Platform': return lt.systemRole;
    }
  };

  // Colors for role badge
  const getRoleBadgeStyle = (role: 'SysAdmin' | 'Enterprise Admin' | 'Executive User' | 'System Platform') => {
    switch (role) {
      case 'SysAdmin':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'Enterprise Admin':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Executive User':
        return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
      case 'System Platform':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  // Filter logs based on search, role, category, status
  // We focus on Administrative actions: category is ADMIN, SECURITY, WORKSPACE, or SYSTEM
  const filteredLogs = logs.filter(log => {
    const role = getUserRole(log.user);

    // Filter by administrative categories
    const isAdministrativeAction = ['ADMIN', 'SECURITY', 'WORKSPACE', 'SYSTEM'].includes(log.category);
    if (!isAdministrativeAction) return false;

    // Search query matches
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.ipAddress && log.ipAddress.includes(searchTerm));

    // Dropdown filters
    const matchesRole = roleFilter === 'All' || role === roleFilter;
    const matchesCategory = categoryFilter === 'All' || log.category === categoryFilter;
    const matchesStatus = statusFilter === 'All' || log.status === statusFilter;

    return matchesSearch && matchesRole && matchesCategory && matchesStatus;
  });

  // Calculate stats based on filtered audit log subset
  const adminCategoryLogs = logs.filter(log => ['ADMIN', 'SECURITY', 'WORKSPACE', 'SYSTEM'].includes(log.category));
  
  const totalAdminActions = adminCategoryLogs.length;
  const sysAdminActionsCount = adminCategoryLogs.filter(log => getUserRole(log.user) === 'SysAdmin').length;
  const enterpriseAdminActionsCount = adminCategoryLogs.filter(log => getUserRole(log.user) === 'Enterprise Admin').length;
  const executiveActionsCount = adminCategoryLogs.filter(log => getUserRole(log.user) === 'Executive User').length;
  const systemActionsCount = adminCategoryLogs.filter(log => getUserRole(log.user) === 'System Platform').length;

  // CSV Exporter for administrative logs
  const handleExportCSV = () => {
    try {
      const headers = ['Log ID', 'Timestamp (UTC)', 'Operator Role', 'Operator Entity', 'Category', 'Event Narrative', 'Status', 'IP Address'];
      const rows = filteredLogs.map(log => [
        log.id,
        log.timestamp,
        getUserRole(log.user),
        log.user,
        log.category,
        log.action.replace(/"/g, '""'), // Escape double quotes for CSV
        log.status,
        log.ipAddress || '127.0.0.1'
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,\ufeff' 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `sniper_administrative_access_logs_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Failed to export CSV', e);
    }
  };

  // Get icons and colors for Category
  const getCategoryBadgeStyle = (category: AuditCategory) => {
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
      case 'SYSTEM':
        return {
          bg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
          icon: <Database className="w-3.5 h-3.5" />,
          label: language === 'ar' ? 'نظام تلقائي' : 'SYSTEM'
        };
      default:
        return {
          bg: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
          icon: <Terminal className="w-3.5 h-3.5" />,
          label: category
        };
    }
  };

  // Get styles for Status
  const getStatusBadgeStyle = (status: AuditStatus) => {
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
          label: language === 'ar' ? 'فشل' : 'Failure'
        };
    }
  };

  return (
    <div className="space-y-6 text-start">
      {/* Role KPIs / Statistics Bar */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* KPI: Total Administrative Actions */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start relative overflow-hidden">
          <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 rounded-full blur-xl"></div>
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lt.totalActions}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{totalAdminActions}</div>
        </div>

        {/* KPI: SysAdmin Actions */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-rose-400" />
            <span>{lt.sysAdminCount}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{sysAdminActionsCount}</div>
        </div>

        {/* KPI: Enterprise Admin Actions */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span>{lt.enterpriseAdminCount}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{enterpriseAdminActionsCount}</div>
        </div>

        {/* KPI: Executive Partner Actions */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <UserCheck className="w-3.5 h-3.5 text-indigo-400" />
            <span>{lt.executiveCount}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{executiveActionsCount}</div>
        </div>

        {/* KPI: System Platform Actions */}
        <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4 flex flex-col justify-between text-start col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 text-slate-500 text-[10px] font-mono uppercase tracking-wider">
            <Database className="w-3.5 h-3.5 text-emerald-400" />
            <span>{lt.systemCount}</span>
          </div>
          <div className="text-2xl font-extrabold text-white mt-2">{systemActionsCount}</div>
        </div>
      </div>

      {/* Main Table controls and data list */}
      <div className="bg-slate-950/60 border border-slate-900 rounded-3xl p-5 shadow-xl">
        <div className="flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4 mb-5 pb-5 border-b border-slate-900">
          
          {/* Search bar */}
          <div className="flex-1 max-w-lg relative">
            <span className={`absolute inset-y-0 ${isRTL ? 'right-3' : 'left-3'} flex items-center text-slate-500`}>
              <Search className="w-4 h-4 text-slate-500" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={lt.searchPlaceholder}
              className={`w-full bg-slate-900 text-white text-xs ${isRTL ? 'pr-9 pl-4' : 'pl-9 pr-4'} py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500/60 focus:outline-none transition-all`}
            />
          </div>

          {/* Inline filters */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Operator Role Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {lt.roleFilterLabel}
              </span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value="All" className="bg-slate-950 text-white">{lt.allRoles}</option>
                <option value="SysAdmin" className="bg-slate-950 text-white">{lt.sysAdminRole}</option>
                <option value="Enterprise Admin" className="bg-slate-950 text-white">{lt.enterpriseAdminRole}</option>
                <option value="Executive User" className="bg-slate-950 text-white">{lt.executiveRole}</option>
                <option value="System Platform" className="bg-slate-950 text-white">{lt.systemRole}</option>
              </select>
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {lt.categoryFilterLabel}
              </span>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value="All" className="bg-slate-950 text-white">{lt.allCategories}</option>
                <option value="SECURITY" className="bg-slate-950 text-white">{language === 'ar' ? 'أمني' : 'Security'}</option>
                <option value="ADMIN" className="bg-slate-950 text-white">{language === 'ar' ? 'إداري' : 'Admin Operations'}</option>
                <option value="WORKSPACE" className="bg-slate-950 text-white">{language === 'ar' ? 'مساحة العمل' : 'Workspace'}</option>
                <option value="SYSTEM" className="bg-slate-950 text-white">{language === 'ar' ? 'النظام تلقائي' : 'System automated'}</option>
              </select>
            </div>

            {/* Status Filter */}
            <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {lt.statusFilterLabel}
              </span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent text-slate-300 font-bold text-xs focus:outline-none cursor-pointer appearance-none px-1"
              >
                <option value="All" className="bg-slate-950 text-white">{lt.allStatuses}</option>
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
              title={lt.refreshLabel}
            >
              <RefreshCcw className="w-4 h-4" />
            </button>

            {/* Export Trigger */}
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold px-4.5 py-2.5 rounded-xl border border-slate-800 shadow-sm cursor-pointer transition-all"
            >
              <Download className="w-4 h-4 text-indigo-400" />
              <span>{lt.exportLabel}</span>
            </button>
          </div>
        </div>

        {/* Administrative Log Data Table */}
        <div className="overflow-x-auto">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 text-slate-700 mx-auto mb-3 animate-pulse" />
              <p className="text-xs font-light">{lt.noLogs}</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-900 text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-24`}>{lt.colTimestamp}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-32`}>{lt.colRole}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-44`}>{lt.colOperator}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-24`}>{lt.categoryFilterLabel}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'}`}>{lt.colAction}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-24`}>{lt.colStatus}</th>
                  <th className={`pb-3.5 ${isRTL ? 'text-right' : 'text-left'} w-28`}>{lt.colIp}</th>
                  <th className={`pb-3.5 text-center w-12`}>{lt.inspectLabel}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-xs font-light">
                {filteredLogs.map((log) => {
                  const role = getUserRole(log.user);
                  const roleLabel = getRoleLabel(role);
                  const roleBadgeStyle = getRoleBadgeStyle(role);
                  const categoryInfo = getCategoryBadgeStyle(log.category);
                  const statusInfo = getStatusBadgeStyle(log.status);

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

                      {/* Operator Role */}
                      <td className="py-3.5">
                        <div className="flex justify-start">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[9px] font-bold tracking-wider uppercase ${roleBadgeStyle}`}>
                            <span>{roleLabel}</span>
                          </span>
                        </div>
                      </td>

                      {/* Operator Entity */}
                      <td className="py-3.5 text-start pr-4 max-w-[170px] truncate" title={log.user}>
                        <span className={`font-semibold ${log.user === 'SYSTEM' ? 'text-indigo-400' : 'text-slate-300'}`}>
                          {log.user === 'SYSTEM' ? '⚙ SYSTEM_DECR' : log.user}
                        </span>
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

                      {/* Action Narrative */}
                      <td className={`py-3.5 text-start pr-4 font-sans text-xs text-slate-300 leading-normal max-w-sm truncate`} title={log.action}>
                        {log.action}
                      </td>

                      {/* Outcome Status */}
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
                          title={lt.inspectLabel}
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
                    {lt.modalTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 font-mono mt-0.5">{selectedLog.id}</p>
                </div>
              </div>

              <div className="space-y-4 font-mono text-xs text-slate-300">
                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{lt.logUuid}</span>
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
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{lt.timestampIso}</span>
                  <span className="col-span-2 text-white">{selectedLog.timestamp}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{lt.colRole}</span>
                  <span className={`col-span-2 font-bold px-1.5 py-0.5 rounded text-[10px] inline-block ${getRoleBadgeStyle(getUserRole(selectedLog.user))}`}>
                    {getRoleLabel(getUserRole(selectedLog.user))}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{lt.colOperator}</span>
                  <span className="col-span-2 text-white font-semibold">{selectedLog.user}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{lt.colIp}</span>
                  <span className="col-span-2 text-slate-400">{selectedLog.ipAddress || '127.0.0.1'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 py-2 border-b border-slate-900/40">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider">{lt.outcomeStatus}</span>
                  <span className={`col-span-2 font-bold ${
                    selectedLog.status === 'SUCCESS' ? 'text-emerald-400' : 
                    selectedLog.status === 'WARNING' ? 'text-amber-400' : 'text-rose-400'
                  }`}>{selectedLog.status}</span>
                </div>

                <div className="pt-2">
                  <span className="text-slate-500 uppercase text-[10px] tracking-wider block mb-2">{lt.eventNarrative}</span>
                  <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-900 font-sans text-xs text-slate-200 leading-normal whitespace-pre-wrap">
                    {selectedLog.action}
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-900 flex justify-end">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold border border-slate-800 cursor-pointer transition-colors"
                >
                  {lt.closeLedger}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
