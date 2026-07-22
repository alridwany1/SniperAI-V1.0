import React, { useState, useEffect } from 'react';
import { translations, Language } from '../utils/translations';
import { 
  X, Settings, CheckCircle, AlertCircle, RefreshCw, Database, 
  GripVertical, Plus, Trash2, Calendar, Package, Megaphone, 
  DollarSign, Hash, TrendingDown, ArrowRight, ArrowLeft,
  Activity, Wifi, Server, ShieldAlert, Cpu
} from 'lucide-react';
import { Tenant, SchemaMapping } from '../types';
import { safeFetchJson } from '../utils/apiUtils';
import ConfirmModal from './ConfirmModal';
import SchemaExplorer from './SchemaExplorer';

interface TenantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant | null;
  language: Language;
  onUpdateSuccess: (updatedTenant: Tenant) => void;
  onDeleteSuccess?: (deletedTenantId: string) => void;
}

const DEFAULT_API_FIELDS = [
  'transaction_date',
  'created_at',
  'gross_revenue',
  'sale_amount',
  'quantity_sold',
  'cogs_value',
  'item_cost',
  'product_name',
  'sku',
  'marketing_campaign',
  'utm_source'
];

const INTERNAL_METRICS = [
  { key: 'date', labelEn: 'Date Cycle', labelAr: 'دورة التاريخ', descEn: 'Transaction date (YYYY-MM-DD)', descAr: 'تاريخ المعاملة (YYYY-MM-DD)', icon: Calendar },
  { key: 'product', labelEn: 'Product Stream', labelAr: 'تدفق المنتج', descEn: 'Product / SKU identification', descAr: 'اسم المنتج أو رمز SKU', icon: Package },
  { key: 'campaign', labelEn: 'Campaign Origin', labelAr: 'أصل الحملة', descEn: 'Marketing campaign attribution', descAr: 'مصدر الحملة التسويقية الإعلانية', icon: Megaphone },
  { key: 'revenue', labelEn: 'Gross Revenue', labelAr: 'إجمالي الإيرادات', descEn: 'Total monetary sales value', descAr: 'إجمالي القيمة النقدية للمبيعات', icon: DollarSign },
  { key: 'units', labelEn: 'Volume of Sale', labelAr: 'حجم المبيعات', descEn: 'Quantity of products sold', descAr: 'كمية الوحدات المباعة', icon: Hash },
  { key: 'cost', labelEn: 'Operating COGS', labelAr: 'تكلفة المبيعات', descEn: 'Cost of goods sold', descAr: 'تكلفة البضائع المباعة', icon: TrendingDown },
];

export default function TenantSettingsModal({
  isOpen,
  onClose,
  tenant,
  language,
  onUpdateSuccess,
  onDeleteSuccess,
}: TenantSettingsModalProps) {
  const t = translations[language];
  const isRTL = language === 'ar';

  // Form states
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [description, setDescription] = useState('');
  const [schemaMappings, setSchemaMappings] = useState<SchemaMapping[]>([]);

  // Tab & Drag states
  const [activeTab, setActiveTab] = useState<'general' | 'schema' | 'diagnostics'>('general');
  const [availableFields, setAvailableFields] = useState<string[]>([]);
  const [draggedField, setDraggedField] = useState<string | null>(null);
  const [activeDropTarget, setActiveDropTarget] = useState<string | null>(null);
  const [selectedField, setSelectedField] = useState<string | null>(null);
  const [newFieldName, setNewFieldName] = useState('');

  // UI status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');
  const [success, setSuccess] = useState(false);
  const [isRefreshingSchema, setIsRefreshingSchema] = useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  // DB Schema Explorer States
  const [dbAnalysis, setDbAnalysis] = useState<any | null>(null);
  const [dbMappingState, setDbMappingState] = useState<any>(null);
  const [isLoadingDbSchema, setIsLoadingDbSchema] = useState(false);
  const [isSavingDbMapping, setIsSavingDbMapping] = useState(false);

  const fetchDatabaseSchema = async () => {
    if (!tenant) return;
    setIsLoadingDbSchema(true);
    setError('');
    try {
      const data = await safeFetchJson(`/api/tenants/${tenant.id}/schema?lang=${language}`);
      if (data.success) {
        setDbAnalysis(data.analysis);
        setDbMappingState(data.dbMapping);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to load database schema.');
    } finally {
      setIsLoadingDbSchema(false);
    }
  };

  const handleSaveDbMapping = async () => {
    if (!tenant) return;
    setIsSavingDbMapping(true);
    setError('');
    try {
      const updatedTenant = await safeFetchJson(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim() || tenant.name,
          industry: industry.trim() || tenant.industry,
          currency: currency || tenant.currency,
          description: description.trim() || tenant.description,
          schemaMappings,
          dbMapping: dbMappingState
        }),
      });

      onUpdateSuccess(updatedTenant);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
      }, 1500);
      
      // Re-fetch schema to show updated status
      await fetchDatabaseSchema();
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to save database mapping.');
    } finally {
      setIsSavingDbMapping(false);
    }
  };

  // Diagnostics states
  const [diagnosticLoading, setDiagnosticLoading] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<{
    overallStatus: 'GREEN' | 'YELLOW' | 'RED';
    steps: Array<{
      name: string;
      nameAr: string;
      status: 'SUCCESS' | 'WARNING' | 'FAILED';
      latency?: string;
      message: string;
    }>;
    timestamp: string;
  } | null>(null);

  const runDiagnostics = async () => {
    if (!tenant) return;
    setDiagnosticLoading(true);
    setError('');
    setWarning('');
    try {
      const data = await safeFetchJson(`/api/tenants/${tenant.id}/diagnostics`, {
        method: 'POST'
      });
      setDiagnosticResult(data);
    } catch (e: any) {
      console.error(e);
      setError(e.message || 'Diagnostic scan failed.');
    } finally {
      setDiagnosticLoading(false);
    }
  };

  const handleRefreshSchema = async () => {
    setIsRefreshingSchema(true);
    setError('');
    setWarning('');
    try {
      const data = await safeFetchJson(`/api/tenants/${tenant?.id}/refresh-schema`, {
        method: 'POST',
      });
      if (data.warning) {
        setWarning(data.warning);
      } else {
        setSuccess(true);
        setTimeout(() => {
          setSuccess(false);
        }, 1500);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء تحديث المخطط.' : 'An error occurred while refreshing schema.'));
    } finally {
      setIsRefreshingSchema(false);
    }
  };

  // Sync state when tenant prop changes
  useEffect(() => {
    if (tenant) {
      setName(tenant.name || '');
      setIndustry(tenant.industry || '');
      setCurrency(tenant.currency || 'USD');
      setDescription(tenant.description || '');
      setSchemaMappings(tenant.schemaMappings || []);
      setError('');
      setWarning('');
      setSuccess(false);
      setActiveTab('general');
      setSelectedField(null);
      setNewFieldName('');
      setDiagnosticResult(null);

      const existingSources = (tenant.schemaMappings || []).map(m => m.sourceField);
      const uniqueFields = Array.from(new Set([...DEFAULT_API_FIELDS, ...existingSources]));
      setAvailableFields(uniqueFields);
    }
  }, [tenant, isOpen]);

  // Fetch database schema when active tab is schema
  useEffect(() => {
    if (tenant && activeTab === 'schema' && tenant.dataSource && tenant.dataSource.provider !== 'Local') {
      fetchDatabaseSchema();
    }
  }, [tenant, activeTab, isOpen]);

  if (!isOpen || !tenant) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name.trim()) {
      setError(language === 'ar' ? 'اسم المستأجر مطلوب' : 'Tenant name is required');
      setIsSubmitting(false);
      return;
    }

    if (!industry.trim()) {
      setError(language === 'ar' ? 'قطاع الصناعة مطلوب' : 'Industry/Sector is required');
      setIsSubmitting(false);
      return;
    }

    try {
      const updatedTenant = await safeFetchJson(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim(),
          currency,
          description: description.trim(),
          schemaMappings,
        }),
      });

      setSuccess(true);
      
      setTimeout(() => {
        onUpdateSuccess(updatedTenant);
        setSuccess(false);
        onClose();
      }, 1200);

    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء حفظ الإعدادات.' : 'An error occurred while saving settings.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTenant = () => {
    if (!tenant) return;
    setIsConfirmOpen(true);
  };

  const executeDeleteTenant = async () => {
    if (!tenant) return;
    setIsSubmitting(true);
    setError('');
    try {
      const data = await safeFetchJson('/api/tenants/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [tenant.id] })
      });

      if (data.success) {
        setSuccess(true);
        setTimeout(() => {
          if (onDeleteSuccess) {
            onDeleteSuccess(tenant.id);
          }
          setSuccess(false);
          onClose();
        }, 1200);
      } else {
        throw new Error(language === 'ar' ? 'فشل حذف مساحة العمل.' : 'Failed to delete workspace.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء حذف مساحة العمل.' : 'An error occurred while deleting the workspace.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Drag & Drop logic
  const handleDragStart = (e: React.DragEvent, fieldName: string) => {
    setDraggedField(fieldName);
    e.dataTransfer.setData('text/plain', fieldName);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    setActiveDropTarget(targetField);
  };

  const handleDragLeave = () => {
    setActiveDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetField: string) => {
    e.preventDefault();
    const fieldName = e.dataTransfer.getData('text/plain') || draggedField;
    if (fieldName) {
      applyMapping(fieldName, targetField);
    }
    setDraggedField(null);
    setActiveDropTarget(null);
  };

  const applyMapping = (sourceField: string, targetField: string) => {
    const filtered = schemaMappings.filter(m => m.targetField !== targetField);
    setSchemaMappings([...filtered, { sourceField, targetField }]);
    if (selectedField === sourceField) {
      setSelectedField(null);
    }
  };

  const removeMapping = (targetField: string) => {
    setSchemaMappings(schemaMappings.filter(m => m.targetField !== targetField));
  };

  const handleAddField = () => {
    const trimmed = newFieldName.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    if (trimmed && !availableFields.includes(trimmed)) {
      setAvailableFields([...availableFields, trimmed]);
      setNewFieldName('');
    }
  };

  const handleRemoveField = (fieldName: string) => {
    setAvailableFields(availableFields.filter(f => f !== fieldName));
    setSchemaMappings(schemaMappings.filter(m => m.sourceField !== fieldName));
  };

  const currencies = [
    { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameAr: 'دولار أمريكي' },
    { code: 'EUR', symbol: '€', nameEn: 'Euro', nameAr: 'يورو' },
    { code: 'SAR', symbol: '﷼', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي' },
    { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameAr: 'جنيه إسترليني' },
    { code: 'JPY', symbol: '¥', nameEn: 'Japanese Yen', nameAr: 'ين ياباني' },
    { code: 'AED', symbol: 'د.إ', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  ];

  return (
    <div 
      id="tenant-settings-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div 
        id="tenant-settings-modal-content"
        className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Top visual accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-indigo-400">
              <Settings className="w-5 h-5 animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white text-start">{t.tenantSettings}</h2>
              <p className="text-[10px] text-slate-400 font-light text-start">{t.updateTenantSettings}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body & Form */}
        {success ? (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <CheckCircle className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.tenantSettingsUpdated}</h3>
              <p className="text-xs text-slate-400 mt-1 font-light">
                {language === 'ar' ? 'جاري تطبيق الإعدادات وتحديث لوحة التحكم الفيدرالية...' : 'Applying configurations and updating federal dashboards...'}
              </p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 text-start">
            
            {error && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span className="font-light">{error}</span>
              </div>
            )}

            {warning && (
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0 text-amber-500" />
                <span className="font-light">{warning}</span>
              </div>
            )}

            {/* Tab Selector */}
            <div className="flex border-b border-slate-800/60 mb-5 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab('general');
                  setError('');
                }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'general'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Settings className="w-4 h-4" />
                {language === 'ar' ? 'الإعدادات العامة' : 'General Settings'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('schema');
                  setError('');
                }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'schema'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Database className="w-4 h-4" />
                {language === 'ar' ? 'تكوين المخطط' : 'Schema Configuration'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab('diagnostics');
                  setError('');
                  // Auto-run on open if not loaded yet
                  if (!diagnosticResult) {
                    setTimeout(() => runDiagnostics(), 100);
                  }
                }}
                className={`pb-2.5 px-4 text-xs font-semibold border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === 'diagnostics'
                    ? 'border-indigo-500 text-indigo-400 font-bold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Activity className="w-4 h-4" />
                {language === 'ar' ? 'تشخيص الاتصال' : 'Connection Diagnostics'}
              </button>
            </div>

            {/* Active Tab View */}
            {activeTab === 'general' && (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 font-light leading-relaxed">
                  {t.tenantSettingsDesc}
                </p>

                {/* Tenant Name */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                    {t.tenantName} <span className="text-indigo-400">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={language === 'ar' ? 'اسم المستأجر' : 'Tenant Name'}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                    required
                  />
                </div>

                {/* Grid for Industry & Default Currency */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Industry */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                      {t.tenantIndustry} <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder={language === 'ar' ? 'قطاع الصناعة' : 'Industry'}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Default Currency */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                      {t.defaultCurrency} <span className="text-indigo-400">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none appearance-none cursor-pointer"
                      >
                        {currencies.map((curr) => (
                          <option key={curr.code} value={curr.code}>
                            {curr.code} ({curr.symbol}) - {language === 'ar' ? curr.nameAr : curr.nameEn}
                          </option>
                        ))}
                      </select>
                      <div className={`absolute inset-y-0 ${isRTL ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-500 text-[10px]`}>
                        ▼
                      </div>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                    {t.tenantDesc}
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={language === 'ar' ? 'وصف موجز لنطاق عمل المستأجر...' : 'Brief summary of tenant products or commercial reach...'}
                    rows={3}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none"
                  />
                </div>
              </div>
            )}

            {activeTab === 'schema' && (
              tenant.dataSource && tenant.dataSource.provider !== 'Local' ? (
                /* Dynamic SQL/Database Schema Mapper */
                <div className="space-y-4">
                  {isLoadingDbSchema ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <p className="text-xs text-slate-400 font-light animate-pulse">
                        {language === 'ar' ? 'جاري فحص قاعدة البيانات وتحليل المخطط بالذكاء الاصطناعي...' : 'Introspecting database tables & performing AI analysis...'}
                      </p>
                    </div>
                  ) : dbAnalysis ? (
                    <SchemaExplorer 
                      analysis={dbAnalysis} 
                      language={language} 
                      dbMapping={dbMappingState} 
                      onChangeMapping={(m) => setDbMappingState(m)} 
                      onSaveMapping={handleSaveDbMapping} 
                      isSaving={isSavingDbMapping} 
                    />
                  ) : (
                    <div className="p-8 bg-rose-500/5 border border-rose-500/20 rounded-2xl text-center space-y-3">
                      <AlertCircle className="w-8 h-8 text-rose-400 mx-auto" />
                      <p className="text-xs text-slate-300">
                        {language === 'ar' ? 'فشل تحميل مخطط قاعدة البيانات. تحقق من صحة بيانات الاتصال في التبويب العام.' : 'Failed to load database schema. Verify connection credentials in General tab.'}
                      </p>
                      <button
                        type="button"
                        onClick={fetchDatabaseSchema}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white rounded-xl cursor-pointer"
                      >
                        {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                /* Drag & Drop mapping workspace */
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl text-xs text-indigo-300/90 leading-relaxed font-light">
                    {language === 'ar' 
                      ? '💡 نصيحة: يمكنك سحب حقول الـ API إلى بطاقات المقاييس، أو النقر على بطاقة حقل الـ API ثم النقر على بطاقة المقياس لربطهما على الفور!'
                      : '💡 Tips: You can either drag API fields into the metric cards, or click an API field card and then click a metric card to map them instantly!'}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                    {/* Left Column: API Fields */}
                    <div className="md:col-span-2 space-y-3.5">
                      <div>
                        <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 text-start">
                          {language === 'ar' ? 'حقول استجابة API المتاحة' : 'Available API Fields'}
                        </h3>
                        
                        {/* Add Custom Field */}
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleAddField();
                              }
                            }}
                            placeholder={language === 'ar' ? 'حقل مخصص...' : 'Add field...'}
                            className="flex-1 bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-3 py-2 text-xs text-slate-200 placeholder-slate-600 focus:outline-none transition-all font-mono"
                          />
                          <button
                            type="button"
                            onClick={handleAddField}
                            className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500/30 transition-all cursor-pointer"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable list of fields */}
                      <div className="max-h-[250px] overflow-y-auto pr-1 space-y-1.5 custom-scrollbar bg-slate-950/20 border border-slate-800/50 rounded-2xl p-2.5">
                        {availableFields.map((field, fIdx) => {
                          const isFieldMapped = schemaMappings.some(m => m.sourceField === field);
                          const isFieldSelected = selectedField === field;
                          return (
                            <div
                              key={`${field}-${fIdx}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, field)}
                              onClick={() => setSelectedField(isFieldSelected ? null : field)}
                              className={`group relative flex items-center justify-between gap-1.5 px-3 py-2 text-xs rounded-xl border transition-all cursor-grab active:cursor-grabbing ${
                                isFieldSelected
                                  ? 'bg-indigo-500/20 border-indigo-400 text-indigo-300 shadow-md shadow-indigo-950/40 ring-1 ring-indigo-500/50'
                                  : isFieldMapped
                                  ? 'bg-indigo-950/20 border-indigo-500/20 text-indigo-400/80 hover:text-white hover:border-indigo-500/30'
                                  : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:text-white'
                              }`}
                            >
                              <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                <GripVertical className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400 flex-shrink-0" />
                                <span className="font-mono truncate">{field}</span>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isFieldMapped && (
                                  <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded-md font-semibold">
                                    {language === 'ar' ? 'مربوط' : 'Mapped'}
                                  </span>
                                )}
                                {!DEFAULT_API_FIELDS.includes(field) && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRemoveField(field);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-rose-400 transition-opacity cursor-pointer rounded"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Right Column: Drop Zones */}
                    <div className="md:col-span-3 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2 text-start">
                        {language === 'ar' ? 'مقاييس SniperAI الأساسية' : 'Internal SniperAI Metrics'}
                      </h3>

                      <div className="grid grid-cols-1 gap-2.5 max-h-[300px] overflow-y-auto pr-1 p-0.5">
                        {INTERNAL_METRICS.map((metric) => {
                          const IconComponent = metric.icon;
                          const mapping = schemaMappings.find((m) => m.targetField === metric.key);
                          const isTargetActive = activeDropTarget === metric.key;

                          return (
                            <div
                              key={metric.key}
                              onDragOver={(e) => handleDragOver(e, metric.key)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, metric.key)}
                              onClick={() => {
                                if (selectedField) {
                                  applyMapping(selectedField, metric.key);
                                }
                              }}
                              className={`relative p-3.5 rounded-2xl border transition-all duration-200 text-start ${
                                isTargetActive
                                  ? 'bg-indigo-600/10 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.25)] ring-1 ring-indigo-500 scale-[1.01]'
                                  : selectedField
                                  ? 'border-indigo-500/30 hover:border-indigo-500/60 bg-slate-950/20 cursor-pointer'
                                  : 'border-slate-800 bg-slate-950/40 hover:border-slate-800'
                              }`}
                            >
                              <div className="flex items-center justify-between gap-3">
                                <div className="flex gap-2.5 min-w-0 flex-1">
                                  <div className={`p-2 rounded-xl border flex-shrink-0 ${
                                    mapping 
                                      ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' 
                                      : 'bg-slate-900 border-slate-800 text-slate-500'
                                  }`}>
                                    <IconComponent className="w-4 h-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <h4 className="text-xs font-bold text-slate-200 font-display">
                                      {language === 'ar' ? metric.labelAr : metric.labelEn}
                                    </h4>
                                    <p className="text-[10px] text-slate-500 truncate leading-relaxed mt-0.5">
                                      {language === 'ar' ? metric.descAr : metric.descEn}
                                    </p>
                                  </div>
                                </div>

                                {mapping ? (
                                  <div className="flex items-center gap-1.5 bg-indigo-500/15 border border-indigo-500/20 px-2.5 py-1.5 rounded-xl flex-shrink-0">
                                    <span className="text-xs font-mono font-medium text-indigo-300 max-w-[100px] truncate font-semibold">
                                      {mapping.sourceField}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        removeMapping(metric.key);
                                      }}
                                      className="p-0.5 text-indigo-400 hover:text-rose-400 transition-colors rounded hover:bg-rose-500/10 cursor-pointer"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className={`text-[10px] border border-dashed px-2 py-1.5 rounded-xl flex-shrink-0 ${
                                    isTargetActive
                                      ? 'border-indigo-400 text-indigo-400 bg-indigo-500/5 animate-pulse font-semibold'
                                      : selectedField
                                      ? 'border-indigo-500/40 text-indigo-400/80 bg-indigo-500/5 font-semibold'
                                      : 'border-slate-800 text-slate-600'
                                  }`}>
                                    {selectedField 
                                      ? (language === 'ar' ? 'انقر للربط' : 'Click to Map')
                                      : (language === 'ar' ? 'اسحب هنا' : 'Drag Here')}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )
            )}
            {activeTab === 'diagnostics' && (
              <div className="space-y-4">
                <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-center justify-between gap-4">
                  <div className="text-start">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Cpu className="w-4 h-4 text-indigo-400 animate-pulse" />
                      <span>{language === 'ar' ? 'أداة فحص وتشخيص الاتصال الفيدرالي' : 'Federated Connection Diagnostics'}</span>
                    </h3>
                    <p className="text-[10px] text-slate-400 font-light mt-0.5">
                      {language === 'ar' ? 'تحليل مسار البيانات، التحقق من المفاتيح، والوصول الهيكلي للجداول الفيدرالية للمستأجر الحالي' : 'Auditing active endpoints, credentials, and schema grants for this tenant workspace.'}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={runDiagnostics}
                    disabled={diagnosticLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-[10px] font-semibold text-white rounded-lg border border-indigo-500/30 shadow-md transition-all cursor-pointer shrink-0"
                  >
                    <RefreshCw className={`w-3 h-3 ${diagnosticLoading ? 'animate-spin' : ''}`} />
                    <span>{language === 'ar' ? 'إعادة الفحص' : 'Re-Run Diagnostic'}</span>
                  </button>
                </div>

                {diagnosticLoading ? (
                  <div className="py-12 flex flex-col items-center justify-center text-center space-y-3">
                    <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs text-slate-400 font-light animate-pulse">
                      {language === 'ar' ? 'جاري اختبار استجابة المضيف وفحص جداول قواعد البيانات...' : 'Testing host latencies & querying table catalogs...'}
                    </p>
                  </div>
                ) : diagnosticResult ? (
                  <div className="space-y-4">
                    {/* Overall Traffic Light Banner */}
                    <div className={`p-4 rounded-2xl border flex items-start gap-3.5 ${
                      diagnosticResult.overallStatus === 'GREEN'
                        ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                        : diagnosticResult.overallStatus === 'YELLOW'
                        ? 'bg-amber-500/5 border-amber-500/25 text-amber-450'
                        : 'bg-rose-500/5 border-rose-500/20 text-rose-400'
                    }`}>
                      <div className={`w-3.5 h-3.5 rounded-full shrink-0 mt-1 relative flex items-center justify-center ${
                        diagnosticResult.overallStatus === 'GREEN'
                          ? 'bg-emerald-500'
                          : diagnosticResult.overallStatus === 'YELLOW'
                          ? 'bg-amber-500'
                          : 'bg-rose-500'
                      }`}>
                        <div className={`absolute w-6 h-6 rounded-full opacity-30 animate-ping ${
                          diagnosticResult.overallStatus === 'GREEN'
                            ? 'bg-emerald-500'
                            : diagnosticResult.overallStatus === 'YELLOW'
                            ? 'bg-amber-500'
                            : 'bg-rose-500'
                        }`}></div>
                      </div>
                      <div className="text-start">
                        <h4 className="text-xs font-bold uppercase tracking-wider font-mono">
                          {diagnosticResult.overallStatus === 'GREEN' 
                            ? (language === 'ar' ? 'مؤشر ممتاز - اتصال نشط وموثق بالكامل' : 'Status: GREEN / Fully Operational')
                            : diagnosticResult.overallStatus === 'YELLOW'
                            ? (language === 'ar' ? 'تنبيه - استخدام الذاكرة المحلية والنسخ الاحتياطية' : 'Status: YELLOW / Warning or Local Sandbox Mode')
                            : (language === 'ar' ? 'خطأ حرج - الخادم غير مستجيب أو تم رفض الصلاحيات' : 'Status: RED / Connection Refused')}
                        </h4>
                        <p className="text-[10px] text-slate-400 font-light mt-0.5 leading-relaxed">
                          {diagnosticResult.overallStatus === 'GREEN'
                            ? (language === 'ar' ? 'جميع قنوات اختبار استجابة الخادم ومصادقة بيانات الاعتماد والتحقق الهيكلي من جداول قواعد البيانات تمت بنجاح.' : 'All checks (Round-trip latency, credential validation, and schema discovery) completed successfully.')
                            : diagnosticResult.overallStatus === 'YELLOW'
                            ? (language === 'ar' ? 'تستخدم مساحة العمل الحالية الذاكرة الموقتة والنسخ الاحتياطية لتوليد وعرض البيانات لتجنب تعطل لوحة التحكم.' : 'The active session is supported by local mock/sandbox databases to prevent interface downtime.')
                            : (language === 'ar' ? 'فشلت محاولة الوصول للمضيف الموصوف أو تم رفض مفاتيح الوصول. الرجاء مراجعة بيانات تكوين المستأجر.' : 'Network connection failed or credential handshake was rejected. Please audit destination parameters.')}
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step checklist */}
                    <div className="space-y-2.5">
                      {diagnosticResult.steps.map((step, idx) => {
                        const stepStatus = step.status;
                        return (
                          <div key={idx} className="bg-slate-950/40 border border-slate-850 p-3.5 rounded-xl flex items-start gap-3 hover:border-slate-800 transition-all">
                            {/* Dot indicator matching status */}
                            <div className={`w-2.5 h-2.5 rounded-full mt-1.5 shrink-0 relative flex items-center justify-center ${
                              stepStatus === 'SUCCESS'
                                ? 'bg-emerald-500'
                                : stepStatus === 'WARNING'
                                ? 'bg-amber-500'
                                : 'bg-rose-500'
                            }`}>
                              <span className={`absolute w-4 h-4 rounded-full opacity-20 animate-ping ${
                                stepStatus === 'SUCCESS'
                                  ? 'bg-emerald-500'
                                  : stepStatus === 'WARNING'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}></span>
                            </div>

                            <div className="text-start flex-1">
                              <div className="flex items-center justify-between gap-2">
                                <h5 className="text-xs font-bold text-white leading-none">
                                  {language === 'ar' ? step.nameAr : step.name}
                                </h5>
                                {step.latency && (
                                  <span className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 leading-none">
                                    {step.latency}
                                  </span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 mt-1.5 font-light leading-relaxed">
                                {step.message}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 bg-slate-950/40 border border-slate-850 border-dashed rounded-2xl flex flex-col items-center justify-center text-center p-6 space-y-3">
                    <Wifi className="w-8 h-8 text-slate-650 animate-pulse" />
                    <div>
                      <p className="text-xs font-bold text-slate-300">
                        {language === 'ar' ? 'بانتظار تشغيل الفحص' : 'Diagnostics Ready'}
                      </p>
                      <p className="text-[10px] text-slate-500 font-light mt-1 max-w-xs leading-relaxed">
                        {language === 'ar' 
                          ? 'اضغط على زر "بدء فحص شامل" لإجراء فحص حي من 3 خطوات على قواعد البيانات وقنوات الاتصال المرتبطة.' 
                          : 'Click "Run Diagnostics" to launch a live 3-step audit of network latencies, credentials, and schema permissions.'}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60 mt-4">

              {onDeleteSuccess && (
                <button
                  type="button"
                  onClick={handleDeleteTenant}
                  disabled={isSubmitting || isRefreshingSchema}
                  className={`px-4 py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${isRTL ? 'ml-auto' : 'mr-auto'}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {language === 'ar' ? 'حذف مساحة العمل' : 'Delete Workspace'}
                </button>
              )}

              {tenant?.dataSource?.provider === 'PostgreSQL' && (
                <button
                  type="button"
                  onClick={handleRefreshSchema}
                  disabled={isRefreshingSchema || isSubmitting}
                  className={`px-4 py-2 text-xs font-semibold text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl transition-all cursor-pointer disabled:opacity-50 flex items-center gap-2 ${!onDeleteSuccess ? (isRTL ? 'ml-auto' : 'mr-auto') : ''}`}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingSchema ? 'animate-spin' : ''}`} />
                  {language === 'ar' ? 'تحديث المخطط' : 'Refresh Schema'}
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800/85 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {t.cancelBtn}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl border border-indigo-500/30 shadow-md shadow-indigo-950/30 transition-all cursor-pointer disabled:opacity-50 h-9"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.updatingSettings}</span>
                  </>
                ) : (
                  <span>{t.saveSettings}</span>
                )}
              </button>
            </div>

          </form>
        )}
      </div>

      <ConfirmModal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        onConfirm={executeDeleteTenant}
        title={language === 'ar' ? 'حذف مساحة العمل' : 'Delete Workspace'}
        message={language === 'ar' 
          ? `هل أنت متأكد من رغبتك في حذف مساحة العمل "${name}" نهائياً؟`
          : `Are you sure you want to permanently delete the workspace "${name}"?`}
        language={language}
      />
    </div>
  );
}
