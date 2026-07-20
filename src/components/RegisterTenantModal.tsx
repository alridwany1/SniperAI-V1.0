import React, { useState } from 'react';
import { translations, Language } from '../utils/translations';
import { X, PlusCircle, CheckCircle, AlertCircle, Shield, Globe, Database, Key, Server } from 'lucide-react';
import { Tenant, SalesRecord, CRMDeal } from '../types';
import SchemaExplorer from './SchemaExplorer';
import { parseLocalFile } from '../utils/fileParser';

interface RegisterTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
  onOnboardSuccess: (newTenant: Tenant) => void;
  userEmail: string;
  tenants: Tenant[];
  userProfile?: {
    fullName: string;
    role: string;
    company: string;
    avatarId: string;
    tenantId: string;
    plan?: string;
  } | null;
}

export default function RegisterTenantModal({
  isOpen,
  onClose,
  language,
  onOnboardSuccess,
  userEmail,
  tenants,
  userProfile,
}: RegisterTenantModalProps) {
  const t = translations[language];

  // Form states
  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [accentColor, setAccentColor] = useState('indigo');
  const [description, setDescription] = useState('');

  // Data Source Configuration States
  const [provider, setProvider] = useState('Odoo');
  const [host, setHost] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [databaseName, setDatabaseName] = useState('');
  const [username, setUsername] = useState('');

  // Local File States
  const [localFile, setLocalFile] = useState<File | null>(null);
  const [localFileSchema, setLocalFileSchema] = useState<any | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [parsedSalesRecords, setParsedSalesRecords] = useState<SalesRecord[]>([]);
  const [parsedCrmDeals, setParsedCrmDeals] = useState<CRMDeal[]>([]);

  // Connection testing states
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'success' | 'failed'>('idle');
  const [connectionMessage, setConnectionMessage] = useState('');
  const [schemaAnalysis, setSchemaAnalysis] = useState<any | null>(null);
  const [customDbMapping, setCustomDbMapping] = useState<any>(null);

  // Clear connection status on input changes
  const resetConnection = () => {
    setConnectionStatus('idle');
    setConnectionMessage('');
    setSchemaAnalysis(null);
    setLocalFileSchema(null);
    setCustomDbMapping(null);
  };

  const handleProviderChange = (val: string) => {
    setProvider(val);
    if (val !== 'Local' && val !== 'SQLite') {
      setLocalFile(null);
      setDatabaseName('');
    } else {
      setHost('local-bridge://secure');
      setApiKey('local-token-simulated');
      setUsername('local_client');
    }
    resetConnection();
  };
  const handleHostChange = (val: string) => {
    const trimmed = val.trim();
    if (trimmed.startsWith('postgresql://') || trimmed.startsWith('postgres://')) {
      setProvider('PostgreSQL');
      try {
        const urlStr = trimmed.startsWith('postgres://') 
          ? trimmed.replace('postgres://', 'http://') 
          : trimmed.replace('postgresql://', 'http://');
        const url = new URL(urlStr);
        const parsedHost = url.host;
        const parsedUser = decodeURIComponent(url.username || '');
        const parsedPass = decodeURIComponent(url.password || '');
        let parsedDb = decodeURIComponent(url.pathname || '').replace(/^\//, '');
        if (parsedDb.includes('?')) {
          parsedDb = parsedDb.split('?')[0];
        }
        
        setHost(parsedHost);
        if (parsedUser) setUsername(parsedUser);
        if (parsedPass) setApiKey(parsedPass);
        if (parsedDb) setDatabaseName(parsedDb);
        resetConnection();
        return;
      } catch (e) {
        const match = trimmed.match(/^(?:postgresql|postgres):\/\/([^:]+):([^@]+)@([^/]+)\/(.+)$/);
        if (match) {
          setUsername(match[1]);
          setApiKey(match[2]);
          setHost(match[3]);
          let dbPart = match[4];
          if (dbPart.includes('?')) dbPart = dbPart.split('?')[0];
          setDatabaseName(dbPart);
          resetConnection();
          return;
        }
      }
    } else if (trimmed.startsWith('mongodb://') || trimmed.startsWith('mongodb+srv://')) {
      setProvider('MongoDB');
    }
    setHost(val);
    resetConnection();
  };
  const handleApiKeyChange = (val: string) => {
    setApiKey(val);
    resetConnection();
  };
  const handleDatabaseNameChange = (val: string) => {
    setDatabaseName(val);
    resetConnection();
  };
  const handleUsernameChange = (val: string) => {
    setUsername(val);
    resetConnection();
  };

  // UI states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async (e: React.MouseEvent) => {
    e.preventDefault();
    setConnectionStatus('testing');
    setConnectionMessage('');
    setError('');

    if (provider !== 'Local' && provider !== 'SQLite') {
      if (!host.trim()) {
        setConnectionStatus('failed');
        setConnectionMessage(language === 'ar' ? 'الرجاء إدخال مضيف الاتصال أو عنوان API أولاً' : 'Please input connection host or API URL first');
        return;
      }
      if (!apiKey.trim()) {
        setConnectionStatus('failed');
        setConnectionMessage(language === 'ar' ? 'الرجاء إدخال مفتاح واجهة البرمجة أو كلمة المرور أولاً' : 'Please input API Key or password first');
        return;
      }
      if (!databaseName.trim()) {
        setConnectionStatus('failed');
        setConnectionMessage(language === 'ar' ? 'الرجاء إدخال اسم قاعدة البيانات أولاً' : 'Please input database name first');
        return;
      }
    } else {
      if (!databaseName.trim()) {
        setConnectionStatus('failed');
        setConnectionMessage(language === 'ar' ? 'الرجاء سحب أو اختيار ملف قاعدة بيانات أولاً' : 'Please drag or select a database file first');
        return;
      }
    }

    try {
      const response = await fetch('/api/tenants/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider,
          host: (provider === 'Local' || provider === 'SQLite') ? 'local-bridge://secure' : host.trim(),
          apiKey: (provider === 'Local' || provider === 'SQLite') ? 'local-token-simulated' : apiKey.trim(),
          databaseName: databaseName.trim(),
          username: (provider === 'Local' || provider === 'SQLite') ? 'local_client' : username.trim(),
          displayLanguage: language,
          localSchema: localFileSchema,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        setConnectionStatus('failed');
        setConnectionMessage(data.message || (language === 'ar' ? 'فشل اختبار الاتصال.' : 'Failed to test connection.'));
        setSchemaAnalysis(null);
      } else {
        setConnectionStatus('success');
        setConnectionMessage(data.message);
        setSchemaAnalysis(data.analysis);
      }
    } catch (err: any) {
      console.error(err);
      setConnectionStatus('failed');
      setConnectionMessage(language === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'Error communicating with the verification server.');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    if (!name.trim()) {
      setError(language === 'ar' ? 'اسم المستأجر مطلوب' : 'Tenant Name is required');
      setIsSubmitting(false);
      return;
    }

    // Check user subscription limits for tenant data pipelines
    const userPlan = (userProfile?.plan || 'monthly').toLowerCase();
    let tenantLimit = 1;
    if (userPlan === 'annual' || userPlan === 'growth') {
      tenantLimit = 5;
    } else if (userPlan === 'enterprise') {
      tenantLimit = Infinity;
    }

    if (tenants.length >= tenantLimit) {
      setError(
        language === 'ar'
          ? `عذراً، لقد تجاوزت الحد الأقصى لعدد مصادر البيانات ومساحات العمل المسموح بها لباقتك الحالية (${tenantLimit === Infinity ? 'غير محدود' : tenantLimit} مصادر). يرجى ترقية باقة الاشتراك لزيادة حدودك.`
          : `Sorry, you have exceeded the maximum connected data sources allowed for your current subscription tier (${tenantLimit === Infinity ? 'Unlimited' : tenantLimit} pipelines). Please upgrade your plan to increase limits.`
      );
      setIsSubmitting(false);
      return;
    }

    if (!industry.trim()) {
      setError(language === 'ar' ? 'قطاع الصناعة مطلوب' : 'Industry/Sector is required');
      setIsSubmitting(false);
      return;
    }

    if (connectionStatus !== 'success') {
      setError(language === 'ar' ? 'يجب اختبار الاتصال بنجاح وتأكيده قبل حفظ المستأجر الجديد.' : 'You must successfully test and establish the database connection before saving the new tenant.');
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch('/api/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          industry: industry.trim(),
          description: description.trim(),
          accentColor,
          currency,
          dataSource: {
            provider,
            host: host.trim(),
            apiKey: apiKey.trim(),
            databaseName: databaseName.trim(),
            username: username.trim(),
          },
          salesRecords: parsedSalesRecords,
          crmDeals: parsedCrmDeals,
          dbMapping: customDbMapping,
          localSchema: localFileSchema
        }),
      });

      if (!response.ok) {
        throw new Error(language === 'ar' ? 'فشل إعداد المستأجر الجديد.' : 'Failed to onboard new tenant.');
      }

      const newTenant = await response.json();
      setSuccess(true);
      setTimeout(() => {
        onOnboardSuccess(newTenant);
        // Reset and close
        setName('');
        setIndustry('');
        setCurrency('USD');
        setAccentColor('indigo');
        setDescription('');
        
        // Reset data source fields
        setProvider('Odoo');
        setHost('');
        setApiKey('');
        setDatabaseName('');
        setUsername('');
        setConnectionStatus('idle');
        setConnectionMessage('');
        setCustomDbMapping(null);
        
        setSuccess(false);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error(err);
      setError(err.message || (language === 'ar' ? 'حدث خطأ أثناء الاتصال بالخادم.' : 'An error occurred while connecting to the server.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const currencies = [
    { code: 'USD', symbol: '$', nameEn: 'US Dollar', nameAr: 'دولار أمريكي' },
    { code: 'EUR', symbol: '€', nameEn: 'Euro', nameAr: 'يورو' },
    { code: 'SAR', symbol: '﷼', nameEn: 'Saudi Riyal', nameAr: 'ريال سعودي' },
    { code: 'GBP', symbol: '£', nameEn: 'British Pound', nameAr: 'جنيه إسترليني' },
    { code: 'JPY', symbol: '¥', nameEn: 'Japanese Yen', nameAr: 'ين ياباني' },
    { code: 'AED', symbol: 'د.إ', nameEn: 'UAE Dirham', nameAr: 'درهم إماراتي' },
  ];

  const colors = [
    { name: 'indigo', class: 'bg-indigo-500 border-indigo-400', labelEn: 'Royal Indigo', labelAr: 'أزرق ملكي' },
    { name: 'rose', class: 'bg-rose-500 border-rose-400', labelEn: 'Crimson Rose', labelAr: 'وردي قرمزي' },
    { name: 'emerald', class: 'bg-emerald-500 border-emerald-400', labelEn: 'Cyber Emerald', labelAr: 'أخضر سيبراني' },
  ];

  return (
    <div 
      id="register-tenant-modal-overlay"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
    >
      <div 
        id="register-tenant-modal-content"
        className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl flex flex-col max-h-[90vh] overflow-y-auto"
      >
        {/* Top visual accents */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-[1px] bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent"></div>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800/60 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-indigo-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold font-display text-white text-start">{t.registerNewTenant}</h2>
              <p className="text-[10px] text-slate-400 font-light text-start">{language === 'ar' ? 'إضافة مستأجر نشط ومستقل للبيئة الفيدرالية' : 'Add separate independent workspace container'}</p>
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
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 animate-bounce">
              <CheckCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{t.successTenant}</h3>
              <p className="text-xs text-slate-400 mt-1 font-light">
                {language === 'ar' ? 'جاري إنشاء سجلات المبيعات وسجل التدقيق وربط Odoo...' : 'Provisioning sales ledger, generating transaction logs, connecting Odoo CRM...'}
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

            <p className="text-xs text-slate-400 font-light leading-relaxed">
              {t.onboardTenantDesc}
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
                placeholder={language === 'ar' ? 'مثال: شركة النجم للتوريدات' : 'e.g. Acme Corporation'}
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
                  placeholder={language === 'ar' ? 'مثال: البيع بالتجزئة والخدمات' : 'e.g. Retail, FinTech, Logistics'}
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
                  <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-500 text-[10px]`}>
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
                placeholder={language === 'ar' ? 'اكتب وصفاً موجزاً لطبيعة عمل المستأجر وعملائه الماليين...' : 'Brief summary of tenant products, commercial reach, and executive goals...'}
                rows={2}
                className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all resize-none"
              />
            </div>

            {/* Accent Color Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                {t.accentColor}
              </label>
              <div className="flex gap-4">
                {colors.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => setAccentColor(col.name)}
                    className={`flex-1 flex items-center gap-2.5 px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      accentColor === col.name
                        ? 'border-indigo-500 bg-slate-950 text-white shadow-inner'
                        : 'border-slate-800 bg-slate-950/40 text-slate-500 hover:text-slate-300'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded-full ${col.class} shadow-sm`}></span>
                    <span>{language === 'ar' ? col.labelAr : col.labelEn}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Data Source Configuration */}
            <div className="pt-5 border-t border-slate-800/80 mt-4 space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-indigo-950/40 border border-indigo-900/30 text-indigo-400">
                  <Database className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-bold text-white uppercase tracking-wider font-display">
                  {t.dataSourceTitle}
                </h3>
              </div>

              {/* Grid for Provider & Host */}
              <div className="grid grid-cols-1 gap-4">
                {/* Data Source Provider select */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                    {t.selectDataSource} <span className="text-indigo-400">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={provider}
                      onChange={(e) => handleProviderChange(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 focus:outline-none appearance-none cursor-pointer"
                    >
                      <option value="Odoo">{language === 'ar' ? 'نظام مبيعات Odoo' : 'Odoo CRM'}</option>
                      <option value="PostgreSQL">PostgreSQL</option>
                      <option value="MongoDB">MongoDB</option>
                      <option value="Shopify">{language === 'ar' ? 'متجر شوبيفاي الإلكتروني' : 'Shopify E-Commerce'}</option>
                      <option value="SQLite">{language === 'ar' ? 'قاعدة بيانات SQLite محلية' : 'SQLite (Local DB)'}</option>
                      <option value="Local">{t.localDatabaseOption}</option>
                    </select>
                    <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-500 text-[10px]`}>
                      ▼
                    </div>
                  </div>
                </div>
              </div>

              {(provider === 'Local' || provider === 'SQLite') ? (
                /* Drag-and-Drop Local DB File Selector */
                <div className="space-y-4">
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        setLocalFile(file);
                        setDatabaseName(file.name);
                        resetConnection();
                        parseLocalFile(file).then(res => {
                          setParsedSalesRecords(res.salesRecords);
                          setParsedCrmDeals(res.crmDeals);
                          setLocalFileSchema(res.originalSchema || null);
                        });
                      }
                    }}
                    onClick={() => document.getElementById('modal-local-file-input')?.click()}
                    className={`border border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                        : localFile
                        ? 'border-emerald-500/50 bg-emerald-500/5 hover:border-emerald-500 hover:bg-emerald-500/10'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700/60 hover:bg-slate-900/40'
                    }`}
                  >
                    <input
                      type="file"
                      id="modal-local-file-input"
                      className="hidden"
                      accept=".db,.sqlite,.sql,.csv,.json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setLocalFile(file);
                          setDatabaseName(file.name);
                          resetConnection();
                          parseLocalFile(file).then(res => {
                            setParsedSalesRecords(res.salesRecords);
                            setParsedCrmDeals(res.crmDeals);
                            setLocalFileSchema(res.originalSchema || null);
                          });
                        }
                      }}
                    />
                    <div className="flex flex-col items-center gap-3">
                      <div className={`p-3 rounded-xl border ${
                        localFile
                          ? 'bg-emerald-500/15 border-emerald-500/20 text-emerald-400'
                          : 'bg-indigo-500/15 border-indigo-500/20 text-indigo-400'
                      }`}>
                        <Database className="w-5 h-5 animate-pulse" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {localFile ? `${t.fileSelectedLabel} ${localFile.name}` : t.dragAndDropLabel}
                        </p>
                        {localFile && (
                          <p className="text-[10px] text-emerald-400 font-mono mt-1">
                            {(localFile.size / 1024).toFixed(2)} KB
                          </p>
                        )}
                        <p className="text-[10px] text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                          {t.localDbExplain}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Remote Database Host and Credentials */
                <div className="space-y-4">
                  {/* Connection Host / API URL */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                      {t.connectionHost} <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={host}
                      onChange={(e) => handleHostChange(e.target.value)}
                      placeholder={
                        provider === 'Odoo' ? 'https://your-company.odoo.com' :
                        provider === 'PostgreSQL' ? 'postgresql://db.company.com:5432' :
                        provider === 'MongoDB' ? 'mongodb+srv://cluster0.mongodb.net' :
                        'https://your-store.myshopify.com'
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                      required
                    />
                  </div>

                  {/* Grid for credentials (API Key & Username) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Username / Client ID */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                        {t.usernameLabel}
                      </label>
                      <input
                        type="text"
                        value={username}
                        onChange={(e) => handleUsernameChange(e.target.value)}
                        placeholder={
                          provider === 'Odoo' ? 'api_user@company.com' :
                          provider === 'PostgreSQL' ? 'db_admin' :
                          provider === 'MongoDB' ? 'mongo_app_user' :
                          'e.g. Client ID'
                        }
                        className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                      />
                    </div>

                    {/* API Key / Token / Password */}
                    <div>
                      <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                        {t.apiKeyToken} <span className="text-indigo-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="password"
                          value={apiKey}
                          onChange={(e) => handleApiKeyChange(e.target.value)}
                          placeholder="••••••••••••••••"
                          className={`w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl ${language === 'ar' ? 'pl-9 pr-4' : 'pl-4 pr-9'} py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all`}
                          required
                        />
                        <div className={`absolute inset-y-0 ${language === 'ar' ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-slate-500`}>
                          <Key className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Database Name / Store URL */}
                  <div>
                    <label className="text-xs font-semibold text-slate-300 block mb-1.5 uppercase tracking-wide">
                      {t.dbNameStoreUrl} <span className="text-indigo-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={databaseName}
                      onChange={(e) => handleDatabaseNameChange(e.target.value)}
                      placeholder={
                        provider === 'Odoo' ? 'e.g. odoo_enterprise_db' :
                        provider === 'PostgreSQL' ? 'e.g. sales_ledger_db' :
                        provider === 'MongoDB' ? 'e.g. crm_deal_db' :
                        'e.g. main-retail-store'
                      }
                      className="w-full bg-slate-950 border border-slate-800 focus:border-indigo-500/80 rounded-xl px-4 py-2.5 text-sm text-slate-200 placeholder-slate-600 focus:outline-none transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              {/* Connection Status & Tester Button */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-3.5 rounded-2xl bg-slate-950 border border-slate-800/80">
                <div className="flex-1 text-xs">
                  {connectionStatus === 'idle' && (
                    <p className="text-slate-400 font-light">
                      {language === 'ar' 
                        ? 'يرجى اختبار وصلاحية الاتصال لتفادي فشل تشغيل المستأجر.' 
                        : 'Verify the credentials can securely hook into the database schema.'}
                    </p>
                  )}
                  {connectionStatus === 'testing' && (
                    <div className="flex items-center gap-2 text-indigo-400 font-semibold animate-pulse">
                      <div className="w-3.5 h-3.5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t.testingConnection}</span>
                    </div>
                  )}
                  {connectionStatus === 'success' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                        <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                        <span>{t.connectionSuccess}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-mono pl-5 leading-normal">{connectionMessage}</p>
                    </div>
                  )}
                  {connectionStatus === 'failed' && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-rose-400 font-bold">
                        <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                        <span>{language === 'ar' ? 'فشل التحقق من الاتصال' : 'Connection Verification Failed'}</span>
                      </div>
                      <p className="text-[11px] text-rose-300 font-light pl-5 leading-normal">{connectionMessage}</p>
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={connectionStatus === 'testing'}
                  className={`px-4.5 py-2.5 text-xs font-bold rounded-xl border cursor-pointer transition-all shrink-0 flex items-center justify-center gap-2 ${
                    connectionStatus === 'success'
                      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                      : connectionStatus === 'failed'
                      ? 'border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                      : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 hover:border-indigo-500/50'
                  } disabled:opacity-50`}
                >
                  <Server className="w-3.5 h-3.5 shrink-0" />
                  <span>{t.testConnection}</span>
                </button>
              </div>

              {schemaAnalysis && (
                <SchemaExplorer 
                  analysis={schemaAnalysis} 
                  language={language} 
                  dbMapping={customDbMapping}
                  onChangeMapping={(mapping) => setCustomDbMapping(mapping)}
                />
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/60 mt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-950 hover:bg-slate-800 border border-slate-800/85 rounded-xl transition-all cursor-pointer disabled:opacity-50"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 rounded-xl border border-indigo-500/30 shadow-md shadow-indigo-950/30 transition-all cursor-pointer disabled:opacity-50 h-9"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.submitting}</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>{t.onboardBtn}</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}
      </div>
    </div>
  );
}
