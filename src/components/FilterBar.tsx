import React from 'react';
import { Tenant } from '../types';
import { Filter, Calendar, Layers, Sparkles, RefreshCcw, Database, Settings } from 'lucide-react';
import { translations, Language } from '../utils/translations';

interface FilterBarProps {
  tenants: Tenant[];
  selectedTenantId: string;
  onSelectTenant: (id: string) => void;
  selectedCampaign: string;
  onSelectCampaign: (campaign: string) => void;
  selectedProduct: string;
  onSelectProduct: (product: string) => void;
  startDate: string;
  endDate: string;
  onChangeDates: (start: string, end: string) => void;
  onReset: () => void;
  language: Language;
  onOpenTenantSettings: () => void;
  dynamicCampaigns?: string[];
  dynamicProducts?: string[];
  dynamicMinDate?: string;
  dynamicMaxDate?: string;
}

export default function FilterBar({
  tenants,
  selectedTenantId,
  onSelectTenant,
  selectedCampaign,
  onSelectCampaign,
  selectedProduct,
  onSelectProduct,
  startDate,
  endDate,
  onChangeDates,
  onReset,
  language,
  onOpenTenantSettings,
  dynamicCampaigns,
  dynamicProducts,
  dynamicMinDate,
  dynamicMaxDate,
}: FilterBarProps) {
  const activeTenant = tenants.find(t => t.id === selectedTenantId);
  const productsList = dynamicProducts && dynamicProducts.length > 0 
    ? dynamicProducts 
    : (activeTenant ? activeTenant.products.map(p => p.name) : []);
  const campaignsList = dynamicCampaigns && dynamicCampaigns.length > 0
    ? dynamicCampaigns
    : (activeTenant ? activeTenant.campaigns : []);

  const minDateLimit = dynamicMinDate || "2026-01-01";
  const maxDateLimit = dynamicMaxDate || "2026-07-03";

  const getActivePreset = () => {
    const anchor = maxDateLimit;
    if (endDate !== anchor) return "custom";

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    const anchorDate = new Date(maxDateLimit);
    
    const d7 = new Date(anchorDate);
    d7.setDate(anchorDate.getDate() - 6);
    const last7 = formatDate(d7);

    const d30 = new Date(anchorDate);
    d30.setDate(anchorDate.getDate() - 29);
    const last30 = formatDate(d30);

    const d90 = new Date(anchorDate);
    d90.setDate(anchorDate.getDate() - 89);
    const last90 = formatDate(d90);

    const ytd = minDateLimit;

    if (startDate === last7) return "7days";
    if (startDate === last30) return "30days";
    if (startDate === last90) return "90days";
    if (startDate === ytd) return "ytd";

    return "custom";
  };

  const handlePresetChange = (preset: string) => {
    if (preset === "custom") return;
    const anchor = new Date(maxDateLimit);
    let start = new Date(anchor);
    let end = new Date(anchor);

    if (preset === '7days') {
      start.setDate(anchor.getDate() - 6);
    } else if (preset === '30days') {
      start.setDate(anchor.getDate() - 29);
    } else if (preset === '90days') {
      start.setDate(anchor.getDate() - 89);
    } else if (preset === 'ytd') {
      start = new Date(minDateLimit);
    }

    const formatDate = (d: Date) => d.toISOString().split('T')[0];
    onChangeDates(formatDate(start), formatDate(end));
  };

  const t = translations[language];

  return (
    <div id="filter-bar-container" className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl p-5 mb-6 shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4">
        {/* Tenant Switcher with description */}
        <div className="flex-1">
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2 text-start">
            {t.tenantLabel}
          </label>
          <div className="flex flex-wrap gap-2">
            {Array.from(new Map(tenants.map(t => [t.id, t])).values()).map((ten) => {
              const isActive = ten.id === selectedTenantId;
              let borderCol = 'border-slate-800';
              let activeBg = 'bg-slate-800 text-slate-300';
              if (isActive) {
                if (ten.accentColor === 'indigo') {
                  borderCol = 'border-indigo-500';
                  activeBg = 'bg-indigo-600/20 text-indigo-400 border-indigo-500/50';
                } else if (ten.accentColor === 'rose') {
                  borderCol = 'border-rose-500';
                  activeBg = 'bg-rose-600/20 text-rose-400 border-rose-500/50';
                } else if (ten.accentColor === 'emerald') {
                  borderCol = 'border-emerald-500';
                  activeBg = 'bg-emerald-600/20 text-emerald-400 border-emerald-500/50';
                }
              }

              return (
                <button
                  key={ten.id}
                  id={`tenant-btn-${ten.id}`}
                  onClick={() => onSelectTenant(ten.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? `${activeBg} shadow-md shadow-slate-950/20`
                      : 'border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  <span>{ten.name}</span>
                </button>
              );
            })}
          </div>
          {activeTenant && (
            <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1.5 mt-2.5 text-xs text-slate-400 text-start">
              <span className="font-medium text-slate-300">
                {language === 'ar' ? 'قطاع الصناعة' : 'Industry'}: {activeTenant.industry}
              </span>
              <span className="text-slate-700 hidden sm:inline">|</span>
              <span className="font-light">{activeTenant.description}</span>
              {activeTenant.currency && (
                <>
                  <span className="text-slate-700 hidden sm:inline">|</span>
                  <span className="bg-slate-950 px-2 py-0.5 rounded text-[10px] font-mono text-indigo-400 font-bold border border-slate-800">
                    {activeTenant.currency}
                  </span>
                </>
              )}
              {/* Settings Trigger Button */}
              <button
                id="edit-tenant-settings-btn"
                onClick={onOpenTenantSettings}
                className={`inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-[11px] font-semibold px-2.5 py-1 rounded-lg border border-slate-800 transition-all cursor-pointer shadow-sm ${
                  language === 'ar' ? 'mr-auto' : 'ml-auto'
                }`}
              >
                <Settings className="w-3.5 h-3.5 text-indigo-400" />
                <span>{language === 'ar' ? 'إعدادات المستأجر' : 'Tenant Settings'}</span>
              </button>
            </div>
          )}
          {activeTenant?.dataSource && (
            <div className="mt-3 flex flex-wrap items-center gap-2.5 p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 max-w-3xl text-start">
              <div className="flex items-center gap-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                <Database className="w-3.5 h-3.5" />
                <span>{activeTenant.dataSource.provider}</span>
              </div>
              <div className="text-[11px] text-slate-400 font-light flex flex-wrap items-center gap-x-4 gap-y-1">
                <span>
                  <strong className="text-slate-300">{language === 'ar' ? 'المضيف:' : 'Host:'}</strong>{' '}
                  <code className="font-mono bg-slate-900/60 px-1.5 py-0.5 rounded text-indigo-300 text-[10px]">{activeTenant.dataSource.host}</code>
                </span>
                {activeTenant.dataSource.databaseName && (
                  <span>
                    <strong className="text-slate-300">{language === 'ar' ? 'قاعدة البيانات:' : 'DB:'}</strong>{' '}
                    <code className="font-mono bg-slate-900/60 px-1.5 py-0.5 rounded text-indigo-300 text-[10px]">{activeTenant.dataSource.databaseName}</code>
                  </span>
                )}
                {activeTenant.dataSource.username && (
                  <span>
                    <strong className="text-slate-300">{language === 'ar' ? 'المستخدم:' : 'User:'}</strong>{' '}
                    <code className="font-mono bg-slate-900/60 px-1.5 py-0.5 rounded text-indigo-300 text-[10px]">{activeTenant.dataSource.username}</code>
                  </span>
                )}
                <span className="flex items-center gap-1 text-emerald-400 text-[10px] font-medium sm:ml-auto">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  {language === 'ar' ? 'متصل ومزامن' : 'Connected & Synced'}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Global Reset Button */}
        <div className="flex items-end justify-end">
          <button
            id="reset-filters-btn"
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs bg-slate-950/80 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-all border border-slate-800 h-10 shadow-inner"
          >
            <RefreshCcw className="w-3.5 h-3.5" />
            <span>{t.resetFilters}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 pt-3 border-t border-slate-800/60">
        {/* Product Filter */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium text-start">{t.productLabel}</label>
          <div className="relative">
            <select
              id="product-select"
              value={selectedProduct}
              onChange={(e) => onSelectProduct(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer text-start"
            >
              <option value="All">{language === 'ar' ? 'كل المنتجات' : 'All Products'}</option>
              {productsList.map(prod => (
                <option key={prod} value={prod}>{prod}</option>
              ))}
            </select>
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-500 text-[10px]`}>
              ▼
            </div>
          </div>
        </div>

        {/* Campaign Filter */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium text-start">{t.campaignLabel}</label>
          <div className="relative">
            <select
              id="campaign-select"
              value={selectedCampaign}
              onChange={(e) => onSelectCampaign(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer text-start"
            >
              <option value="All">{language === 'ar' ? 'كل الحملات' : 'All Campaigns'}</option>
              {campaignsList.map(camp => (
                <option key={camp} value={camp}>{camp}</option>
              ))}
            </select>
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-500 text-[10px]`}>
              ▼
            </div>
          </div>
        </div>

        {/* Date Presets Dropdown */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium text-start">
            {language === 'ar' ? 'نطاق زمن مسبق' : 'Date Preset'}
          </label>
          <div className="relative">
            <select
              id="date-preset-select"
              value={getActivePreset()}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 appearance-none cursor-pointer text-start font-medium"
            >
              <option value="ytd">{language === 'ar' ? 'منذ بداية العام (الكل)' : 'Year to Date (All)'}</option>
              <option value="7days">{language === 'ar' ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              <option value="30days">{language === 'ar' ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
              <option value="90days">{language === 'ar' ? 'آخر 90 يوماً' : 'Last 90 Days'}</option>
              <option value="custom">{language === 'ar' ? 'نطاق مخصص ✎' : 'Custom Range ✎'}</option>
            </select>
            <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-indigo-400 text-[10px]`}>
              ▼
            </div>
          </div>
        </div>

        {/* Start Date */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium flex items-center gap-1 text-start justify-start">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.startDateLabel}</span>
          </label>
          <input
            id="start-date-input"
            type="date"
            value={startDate}
            min={minDateLimit}
            max={maxDateLimit}
            onChange={(e) => onChangeDates(e.target.value, endDate)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-start"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="text-xs text-slate-400 block mb-1.5 font-medium flex items-center gap-1 text-start justify-start">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{t.endDateLabel}</span>
          </label>
          <input
            id="end-date-input"
            type="date"
            value={endDate}
            min={minDateLimit}
            max={maxDateLimit}
            onChange={(e) => onChangeDates(startDate, e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer text-start"
          />
        </div>
      </div>
    </div>
  );
}
