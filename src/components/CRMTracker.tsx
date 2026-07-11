import React, { useState } from 'react';
import { CRMDeal, Tenant, SyncHistoryEntry } from '../types';
import { RefreshCw, Users, Database } from 'lucide-react';
import { Language } from '../utils/translations';

interface CRMTrackerProps {
  deals: CRMDeal[];
  loading: boolean;
  onSyncCRM: () => void;
  activeTenant: Tenant;
  language: Language;
  syncHistory?: SyncHistoryEntry[];
  syncHistoryLoading?: boolean;
  dbStatus?: {
    isDbConnected: boolean;
    salesTableExists: boolean;
    salesTableName: string;
    crmTableExists: boolean;
    crmTableName: string;
    provider: string;
  } | null;
}

export default function CRMTracker({
  deals,
  loading,
  onSyncCRM,
  activeTenant,
  language,
  syncHistory = [],
  syncHistoryLoading = false,
  dbStatus,
}: CRMTrackerProps) {
  const [activeTab, setActiveTab] = useState<'deals' | 'history'>('deals');

  const totalPipelineValue = deals.reduce((sum, deal) => sum + deal.value, 0);
  const wonDeals = deals.filter(d => d.status === 'Won');
  const wonValue = wonDeals.reduce((sum, deal) => sum + deal.value, 0);

  // Set color accent class based on tenant
  let textAccent = 'text-indigo-400';
  let borderAccent = 'border-indigo-500/20';
  if (activeTenant.accentColor === 'rose') {
    textAccent = 'text-rose-400';
    borderAccent = 'border-rose-500/20';
  } else if (activeTenant.accentColor === 'emerald') {
    textAccent = 'text-emerald-400';
    borderAccent = 'border-emerald-500/20';
  }

  const getStatusBadge = (status: CRMDeal['status']) => {
    switch (status) {
      case 'Won':
        return <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">{language === 'ar' ? 'ربحت' : 'Won'}</span>;
      case 'Lost':
        return <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">{language === 'ar' ? 'خسرت' : 'Lost'}</span>;
      case 'Proposal':
        return <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">{language === 'ar' ? 'عرض مالي' : 'Proposal'}</span>;
      case 'Qualified':
        return <span className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">{language === 'ar' ? 'مؤهل' : 'Qualified'}</span>;
      default:
        return <span className="bg-slate-800 text-slate-400 border border-slate-700 px-1.5 py-0.5 rounded text-[10px] font-medium font-mono">{language === 'ar' ? 'فرصة' : 'Lead'}</span>;
    }
  };

  const formatSyncTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (e) {
      return isoString;
    }
  };

  return (
    <div id="crm-tracker-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[340px]">
      {/* Panel Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
            <Users className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white text-start">
              {language === 'ar' ? 'تكاملات ومبيعات نظام Odoo & CRM' : 'Odoo & CRM Deal Integrations'}
            </h2>
            <p className="text-[10px] text-slate-400 font-light text-start">
              {language === 'ar' ? 'مراحل مبيعات العملاء وحالة العقود التجارية' : 'Lead pipeline & commercial contract status'}
            </p>
          </div>
        </div>

        <button
          id="sync-crm-btn"
          onClick={onSyncCRM}
          disabled={loading}
          className="flex items-center gap-1 bg-slate-950 hover:bg-slate-800 text-slate-300 text-[10px] font-medium px-3 py-1.5 rounded-xl border border-slate-800 transition-all disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          <span>{language === 'ar' ? 'مزامنة القنوات' : 'Sync Pipelines'}</span>
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-800/40 mb-3 text-[11px] font-medium">
        <button
          onClick={() => setActiveTab('deals')}
          className={`pb-2 px-3 border-b-2 transition-all ${
            activeTab === 'deals'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          {language === 'ar' ? 'صفقات خط المبيعات' : 'Pipeline Deals'}
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2 px-3 border-b-2 transition-all flex items-center gap-1.5 ${
            activeTab === 'history'
              ? 'border-indigo-500 text-indigo-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <span>{language === 'ar' ? 'سجل المزامنة' : 'Sync History'}</span>
          <span className="bg-slate-850 text-slate-400 px-1.5 py-0.2 rounded-full text-[9px] font-mono border border-slate-800">
            {syncHistory.length}
          </span>
        </button>
      </div>

      {/* Main Body Switcher */}
      {activeTab === 'deals' ? (
        dbStatus && dbStatus.provider === 'PostgreSQL' && !dbStatus.crmTableExists ? (
          <div className="flex-1 flex flex-col justify-center bg-amber-500/5 border border-amber-500/10 rounded-2xl p-4 text-start overflow-y-auto">
            <div className="flex gap-3">
              <div className="p-2 bg-amber-500/10 text-amber-400 rounded-xl h-fit">
                <Database className="w-5 h-5 animate-pulse" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white">
                  {language === 'ar' ? 'تنبيه: الرجاء استكمال الجدول المطلوب' : 'Alert: Please complete the required table'}
                </h4>
                <p className="text-[10px] text-amber-200/70 font-light mt-1 leading-relaxed">
                  {language === 'ar' ? (
                    <>
                      تم الاتصال بنجاح، ولكن <strong>جدول إدارة العملاء ({dbStatus.crmTableName || 'crm_deals'})</strong> غير موجود حالياً في قاعدة البيانات. 
                      الرجاء إنشاء الجدول أو استيراده لعرض القنوات والصفقات:
                    </>
                  ) : (
                    <>
                      Connected successfully, but the <strong>CRM table ({dbStatus.crmTableName || 'crm_deals'})</strong> is missing in the database. 
                      Please create or import the table to view pipeline deals:
                    </>
                  )}
                </p>
                <div className="mt-2 bg-slate-950/80 rounded-lg p-2 border border-slate-900 font-mono text-[9px] text-slate-300 overflow-x-auto">
                  {`CREATE TABLE ${dbStatus.crmTableName || 'crm_deals'} (
  id VARCHAR(100) PRIMARY KEY,
  tenant_id VARCHAR(100),
  customer_name VARCHAR(255),
  value NUMERIC(15, 2),
  status VARCHAR(100),
  last_updated VARCHAR(100)
);`}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Grid summarizing CRM Pipeline volume */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 flex flex-col justify-between text-start">
                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
                  {language === 'ar' ? 'إجمالي المبيعات النشطة بالقناة' : 'Total Active Pipeline'}
                </span>
                <h4 className="text-xs font-bold text-white font-mono mt-0.5">${totalPipelineValue.toLocaleString()}</h4>
              </div>
              <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-900 flex flex-col justify-between text-start">
                <span className="text-[9px] text-slate-500 font-medium uppercase tracking-wider">
                  {language === 'ar' ? 'العقود المغلقة والمضمونة' : 'Closed Won Contracts'}
                </span>
                <h4 className="text-xs font-bold text-emerald-400 font-mono mt-0.5">${wonValue.toLocaleString()}</h4>
              </div>
            </div>

            {/* Pipeline Deal Records List */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {deals.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center text-slate-500 text-[11px] font-light">
                  {language === 'ar' ? 'لا يوجد صفقات نشطة تمت مزامنتها لهذا المستأجر.' : 'No active deals synchronized for this tenant context.'}
                </div>
              ) : (
                Array.from(new Map(deals.map(d => [d.id, d])).values()).map(deal => (
                  <div 
                    key={deal.id}
                    className="bg-slate-950/40 hover:bg-slate-950/90 border border-slate-900 hover:border-slate-800 rounded-xl p-2.5 flex items-center justify-between transition-all text-start"
                  >
                    <div className="flex-1 min-w-0 pr-3">
                      <p className="text-xs font-semibold text-slate-200 truncate text-start">{deal.customerName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5 text-start">
                        {language === 'ar' ? `آخر تحديث: ${deal.lastUpdated}` : `Last update: ${deal.lastUpdated}`}
                      </p>
                    </div>
                    <div className="flex items-center gap-4 justify-end">
                      <span className="text-xs font-bold text-white font-mono">${deal.value.toLocaleString()}</span>
                      <div className="w-16 text-right">
                        {getStatusBadge(deal.status)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )
      ) : (
        /* Sync History View */
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {syncHistoryLoading ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-[11px] font-light gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-sky-400" />
              <span>{language === 'ar' ? 'جاري تحميل السجل الموثق...' : 'Retrieving audited log history...'}</span>
            </div>
          ) : syncHistory.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 text-[11px] font-light gap-1">
              <Database className="w-5 h-5 text-slate-700" />
              <span>{language === 'ar' ? 'لا يوجد سجلات مزامنة مسجلة لهذا المستأجر.' : 'No previous sync operations recorded for this tenant.'}</span>
            </div>
          ) : (
            Array.from(new Map(syncHistory.map(log => [log.id, log])).values()).map(log => (
              <div 
                key={log.id}
                className="bg-slate-950/40 hover:bg-slate-950/80 border border-slate-900 hover:border-slate-800 rounded-xl p-2.5 flex flex-col gap-1.5 transition-all text-start"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-sans">
                    {log.status === 'SUCCESS' ? (
                      <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide font-mono uppercase">
                        {language === 'ar' ? 'ناجح' : 'SUCCESS'}
                      </span>
                    ) : (
                      <span className="bg-rose-500/10 text-rose-400 border border-rose-500/20 px-1.5 py-0.5 rounded text-[8px] font-bold tracking-wide font-mono uppercase">
                        {language === 'ar' ? 'فشل' : 'FAILURE'}
                      </span>
                    )}
                    <span className="text-[10px] text-slate-300 font-medium font-mono">
                      {formatSyncTime(log.timestamp)}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {log.status === 'SUCCESS' 
                      ? (language === 'ar' ? `مزامنة ${log.recordsSynced} صفقة` : `${log.recordsSynced} deals synced`)
                      : (language === 'ar' ? 'خطأ في الربط' : 'Sync error')}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 font-light">
                  <span>
                    {language === 'ar' ? `بواسطة: ${log.initiatedBy}` : `By: ${log.initiatedBy}`}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    ID: {log.id.split('-').pop()?.substring(0, 8)}
                  </span>
                </div>

                {log.status === 'FAILURE' && log.errorMessage && (
                  <div className="mt-1 bg-rose-950/20 border border-rose-900/30 rounded-lg p-2 text-[9px] text-rose-300 font-light leading-relaxed font-mono whitespace-pre-wrap">
                    {log.errorMessage}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
