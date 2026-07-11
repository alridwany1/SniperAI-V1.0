import React from 'react';
import { motion } from 'motion/react';
import { User, Building, Database, Activity, CheckCircle, Shield, CreditCard, Sparkles, AlertCircle } from 'lucide-react';
import { Tenant, MetricSummary } from '../types';
import { Language } from '../utils/translations';

interface FederatedSessionHubProps {
  language: Language;
  userEmail: string;
  userProfile: {
    fullName: string;
    role: string;
    company: string;
    avatarId: string;
    tenantId: string;
  } | null;
  activeTenant: Tenant | null;
  summary: MetricSummary;
  crmDealsCount: number;
}

const AVATAR_URLS: Record<string, string> = {
  av1: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&h=150&q=80',
  av2: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
  av3: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
  av4: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
  av5: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
  av6: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
};

const HUB_TRANSLATIONS = {
  en: {
    title: 'Integrated Federation & Data Lifecycle Hub',
    subtitle: 'Tracing system linkage from secure user identity through to active dashboard analytics.',
    userIdentity: 'User Identity (Auth)',
    workspaceScope: 'Workspace Scope (Tenant)',
    dataSourceBridge: 'Data Source Bridge',
    activeDashboard: 'Active Analytics',
    verifiedUser: 'Verified Account',
    activePlan: 'Plan:',
    noWorkspace: 'No Workspace Mapped',
    dataSource: 'Data Provider:',
    statusConnected: 'Connected',
    statusSecure: 'Encrypted',
    visualizing: 'Visualizing:',
    salesRecords: 'sales records',
    crmDeals: 'CRM opportunities',
    anomalies: 'anomalies',
    securedLabel: 'Secure Cloud Sync Active',
    flowArrow: 'connected to',
    bioText: 'Authorized profile loaded from Cloud Firestore database.'
  },
  ar: {
    title: 'مركز الترابط والتكامل لدورة البيانات',
    subtitle: 'تتبع ترابط النظام بدءًا من الهوية الرقمية للمستخدم وصولاً إلى تحليلات لوحة التحكم النشطة.',
    userIdentity: 'الهوية الرقمية للمستخدم',
    workspaceScope: 'نطاق مساحة العمل (المستأجر)',
    dataSourceBridge: 'جسر قاعدة البيانات والاتصال',
    activeDashboard: 'تحليلات لوحة التحكم',
    verifiedUser: 'حساب موثق بنجاح',
    activePlan: 'الباقة:',
    noWorkspace: 'لا توجد مساحة عمل مرتبطة',
    dataSource: 'مزود البيانات:',
    statusConnected: 'متصل نشط',
    statusSecure: 'مشفر بالكامل',
    visualizing: 'عرض البيانات:',
    salesRecords: 'سجل مبيعات',
    crmDeals: 'فرصة في CRM',
    anomalies: 'حالة شذوذ مالي',
    securedLabel: 'مزامنة السحابة النشطة مفعلة',
    flowArrow: 'مرتبط مع',
    bioText: 'تم تحميل الملف الشخصي المصرح به من قاعدة بيانات Cloud Firestore.'
  }
};

export default function FederatedSessionHub({
  language,
  userEmail,
  userProfile,
  activeTenant,
  summary,
  crmDealsCount
}: FederatedSessionHubProps) {
  const t = HUB_TRANSLATIONS[language];
  const isRTL = language === 'ar';

  const avatarUrl = userProfile?.avatarId && AVATAR_URLS[userProfile.avatarId] 
    ? AVATAR_URLS[userProfile.avatarId] 
    : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80';

  // Count items
  const salesCount = summary?.salesCount || 0;
  const anomaliesCount = summary?.anomalies?.length || 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 mb-6 shadow-xl relative overflow-hidden"
    >
      {/* Absolute top visual border accent line */}
      <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>
      
      {/* Hub Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800/80 text-emerald-400">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white text-start">
              {t.title}
            </h2>
            <p className="text-[11px] text-slate-400 font-light mt-0.5 text-start">
              {t.subtitle}
            </p>
          </div>
        </div>
        
        {/* Sync Status Badge */}
        <div className="flex items-center gap-2 bg-emerald-950/20 text-emerald-400 border border-emerald-900/45 px-3 py-1.5 rounded-xl font-mono text-[10px] self-start md:self-center">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>{t.securedLabel}</span>
        </div>
      </div>

      {/* Grid: 4-Step Connection Chain */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 relative">
        
        {/* Step 1: User Identity */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/50 flex flex-col justify-between relative group hover:border-indigo-500/30 transition-all duration-300">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-indigo-500/20 shrink-0">
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div className="text-start">
                <h3 className="text-xs font-bold text-white leading-tight">
                  {userProfile?.fullName || userEmail.split('@')[0]}
                </h3>
                <p className="text-[10px] text-indigo-400 font-mono mt-0.5">
                  {userProfile?.role || 'Executive Partner'}
                </p>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
              <User className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="border-t border-slate-900 pt-2.5 text-start">
            <p className="text-[10px] text-slate-500 font-mono truncate leading-none mb-1">
              {userEmail}
            </p>
            <p className="text-[9px] text-slate-400 font-light italic">
              {t.bioText}
            </p>
          </div>
        </div>

        {/* Step 2: Workspace Scope */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/50 flex flex-col justify-between group hover:border-violet-500/30 transition-all duration-300">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-violet-400">
                <Building className="w-4 h-4" />
              </div>
              <div className="text-start">
                <h3 className="text-xs font-bold text-white leading-tight">
                  {activeTenant ? activeTenant.name : t.noWorkspace}
                </h3>
                <p className="text-[10px] text-violet-400 font-mono mt-0.5">
                  {activeTenant?.industry || 'General Sector'}
                </p>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Building className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="border-t border-slate-900 pt-2.5 text-start flex items-center justify-between">
            <span className="text-[10px] text-slate-500 font-light">
              {activeTenant?.description ? (activeTenant.description.length > 55 ? `${activeTenant.description.substring(0, 52)}...` : activeTenant.description) : 'No description'}
            </span>
            <span className="text-[10px] bg-violet-500/10 text-violet-400 border border-violet-500/20 px-1.5 py-0.5 rounded-md font-bold font-mono">
              {activeTenant?.currency || 'USD'}
            </span>
          </div>
        </div>

        {/* Step 3: Data Source Connection */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/50 flex flex-col justify-between group hover:border-emerald-500/30 transition-all duration-300">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-emerald-400 animate-pulse">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-start">
                <h3 className="text-xs font-bold text-white leading-tight">
                  {activeTenant?.dataSource?.provider || 'Secure Local DB'}
                </h3>
                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                  {t.statusConnected}
                </p>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Database className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="border-t border-slate-900 pt-2.5 text-start">
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-light mb-1">
              <span>{t.dataSource}</span>
              <span className="font-semibold text-slate-200">{activeTenant?.dataSource?.provider || 'SQLite Cache'}</span>
            </div>
            <p className="text-[9px] text-slate-500 font-mono truncate leading-none">
              {activeTenant?.dataSource?.host || 'local-fallback-memory://sales_cogs_crm'}
            </p>
          </div>
        </div>

        {/* Step 4: Active Dashboard */}
        <div className="bg-slate-950/60 rounded-2xl p-4 border border-slate-800/50 flex flex-col justify-between group hover:border-pink-500/30 transition-all duration-300">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0 text-pink-400">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-start">
                <h3 className="text-xs font-bold text-white leading-tight">
                  {t.activeDashboard}
                </h3>
                <p className="text-[10px] text-pink-400 font-mono mt-0.5">
                  {t.visualizing}
                </p>
              </div>
            </div>
            <div className="p-1.5 rounded-lg bg-pink-500/10 border border-pink-500/20 text-pink-400">
              <Activity className="w-3.5 h-3.5" />
            </div>
          </div>
          <div className="border-t border-slate-900 pt-2.5 text-start flex flex-wrap gap-1.5">
            <span className="text-[9px] bg-slate-900 text-slate-300 border border-slate-850 px-1.5 py-0.5 rounded-md font-mono">
              <strong className="text-pink-400 font-bold">{salesCount}</strong> {t.salesRecords}
            </span>
            <span className="text-[9px] bg-slate-900 text-slate-300 border border-slate-850 px-1.5 py-0.5 rounded-md font-mono">
              <strong className="text-pink-400 font-bold">{crmDealsCount}</strong> {t.crmDeals}
            </span>
            <span className="text-[9px] bg-slate-900 text-slate-300 border border-slate-850 px-1.5 py-0.5 rounded-md font-mono">
              <strong className="text-rose-400 font-bold">{anomaliesCount}</strong> {t.anomalies}
            </span>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
