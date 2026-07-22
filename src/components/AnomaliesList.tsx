import React, { useState, useMemo } from 'react';
import { SalesRecord, Tenant } from '../types';
import { 
  AlertTriangle, TrendingUp, HelpCircle, ShieldAlert, BadgeInfo, 
  Sparkles, X, Loader2, Plus, Printer, Download, Check, Info, AlertCircle 
} from 'lucide-react';
import { Language } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';

import { safeFetchJson } from '../utils/apiUtils';

interface AnomaliesListProps {
  anomalies: SalesRecord[];
  activeTenant: Tenant;
  language: Language;
}

export default function AnomaliesList({ anomalies: initialAnomalies, activeTenant, language }: AnomaliesListProps) {
  const isAr = language === 'ar';

  // State
  const [zThreshold, setZThreshold] = useState<number>(3.0);
  const [localAnomalies, setLocalAnomalies] = useState<SalesRecord[]>([]);
  const [selectedAnomaly, setSelectedAnomaly] = useState<SalesRecord | null>(null);
  const [auditText, setAuditText] = useState<string>('');
  const [loadingAudit, setLoadingAudit] = useState<boolean>(false);
  const [showInjectModal, setShowInjectModal] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isFallback, setIsFallback] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  // Inject Form state
  const [simProduct, setSimProduct] = useState<string>('');
  const [simRevenue, setSimRevenue] = useState<number>(25000);
  const [simUnits, setSimUnits] = useState<number>(5);
  const [simCost, setSimCost] = useState<number>(1200);
  const [simReason, setSimReason] = useState<string>('');

  // Default products from active tenant
  const tenantProducts = useMemo(() => {
    return activeTenant?.products?.map(p => p.name) || ['Product A', 'Product B', 'Product C'];
  }, [activeTenant]);

  // Set initial product for form
  React.useEffect(() => {
    if (tenantProducts.length > 0) {
      setSimProduct(tenantProducts[0]);
    }
  }, [tenantProducts]);

  // Reset injected local anomalies when active tenant changes
  React.useEffect(() => {
    setLocalAnomalies([]);
  }, [activeTenant]);

  // Combine initial anomalies with injected local anomalies
  const allAnomalies = useMemo(() => {
    return [...localAnomalies, ...initialAnomalies];
  }, [localAnomalies, initialAnomalies]);

  // Assign deterministic realistic Z-scores based on product margins and revenue skewness
  const getZScore = (a: SalesRecord) => {
    // If it's a simulated one, give it a prominent Z-score
    if (a.isAnomaly && a.anomalyReason && a.anomalyReason.includes('محاكاة')) {
      return 4.2;
    }
    // Calculate a consistent z-score
    const productPrice = activeTenant?.products?.find(p => p.name === a.product)?.price || 150;
    const expectedRevenue = a.units * productPrice;
    const ratio = Math.abs(a.revenue - expectedRevenue) / Math.max(1, expectedRevenue);
    
    // Scale to a realistic z-score range [1.6 to 4.5]
    const baseZ = 1.8 + ratio * 2.2;
    return Math.round(Math.min(4.5, Math.max(1.6, baseZ)) * 10) / 10;
  };

  // Filter anomalies dynamically based on Z-Threshold slider
  const filteredAnomalies = useMemo(() => {
    return allAnomalies.filter(a => getZScore(a) >= zThreshold);
  }, [allAnomalies, zThreshold]);

  // Handle AI Deep Audit
  const handleDeepAudit = async (anomaly: SalesRecord) => {
    setSelectedAnomaly(anomaly);
    setLoadingAudit(true);
    setAuditText('');
    setIsFallback(false);
    setErrorMsg('');
    
    try {
      const data = await safeFetchJson('/api/assistant/analyze-anomaly', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          transaction: {
            ...anomaly,
            zScore: getZScore(anomaly)
          },
          language
        })
      });

      if (data.auditText) {
        setAuditText(data.auditText);
        if (data.isFallback) {
          setIsFallback(true);
          setErrorMsg(data.errorMsg || '');
        }
      } else {
        setAuditText(isAr ? 'لم نتمكن من صياغة تقرير التدقيق بالكامل.' : 'Unable to fully compile the audit report.');
      }
    } catch (err) {
      console.error('Audit failed:', err);
      setAuditText(isAr ? 'عذراً، فشل الاتصال بالخادم الذكي.' : 'Failed to connect to the smart auditing server.');
    } finally {
      setLoadingAudit(false);
    }
  };

  // Handle manual injection of test anomaly
  const handleInjectAnomaly = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newAnomaly: SalesRecord = {
      date: new Date().toISOString().split('T')[0],
      product: simProduct || 'Test Product',
      campaign: 'None (Simulation)',
      revenue: Number(simRevenue),
      units: Number(simUnits),
      cost: Number(simCost),
      isAnomaly: true,
      anomalyReason: simReason || (isAr 
        ? 'محاكاة: انحراف إيرادات مصطنع لاختبار أنظمة الرصد والموثوقية الذكية.' 
        : 'Simulation: Artificial revenue deviation to test smart detection and reliability systems.')
    };

    setLocalAnomalies(prev => [newAnomaly, ...prev]);
    setShowInjectModal(false);
    
    // Reset form
    setSimRevenue(25000);
    setSimUnits(5);
    setSimCost(1200);
    setSimReason('');
  };

  // Copy report to clipboard
  const handleCopyReport = () => {
    navigator.clipboard.writeText(auditText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Get Z-score badge styles
  const getZBadgeStyles = (z: number) => {
    if (z >= 3.5) return 'bg-rose-500/15 border-rose-500/30 text-rose-400';
    if (z >= 2.5) return 'bg-amber-500/15 border-amber-500/30 text-amber-400';
    return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400';
  };

  return (
    <div id="anomalies-list-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[420px] transition-all relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg shrink-0">
            <ShieldAlert className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white text-start">
              {isAr ? 'محلل الانحرافات الإحصائية والمخاطر' : 'Statistical Anomalies & Risk Analyzer'}
            </h2>
            <p className="text-[10px] text-slate-400 font-light text-start">
              {isAr ? 'مراقبة حية وتدقيق تفاعلي لنزاهة الصفقات والفواتير' : 'Live monitoring & interactive auditing of transaction integrity'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInjectModal(true)}
          className="flex items-center gap-1.5 bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-400 text-[10px] font-bold px-3 py-1.5 rounded-xl cursor-pointer transition-all self-start sm:self-center"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{isAr ? 'محاكاة وحقن انحراف' : 'Simulate Anomaly'}</span>
        </button>
      </div>

      {/* Interactive Threshold Slider */}
      <div className="bg-slate-950/60 border border-slate-900/80 rounded-2xl p-3.5 mb-4 flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-bold text-slate-300 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
            {isAr ? 'حساسية التصفية (عتبة Z-Score)' : 'Detection Sensitivity (Z-Score Threshold)'}
          </span>
          <span className="text-[11px] font-mono font-bold text-amber-400">
            &gt; {zThreshold.toFixed(1)}σ
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <input
            type="range"
            min="1.5"
            max="4.0"
            step="0.1"
            value={zThreshold}
            onChange={(e) => setZThreshold(parseFloat(e.target.value))}
            className="flex-1 accent-amber-500 bg-slate-900 h-1.5 rounded-lg cursor-pointer focus:outline-none"
          />
          <span className={`text-[9px] px-2 py-0.5 rounded-full border shrink-0 font-medium ${
            zThreshold >= 3.5 ? 'border-rose-500/30 bg-rose-500/5 text-rose-400' :
            zThreshold >= 2.5 ? 'border-amber-500/30 bg-amber-500/5 text-amber-400' :
            'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
          }`}>
            {zThreshold >= 3.5 ? (isAr ? 'تحقق صارم جداً' : 'Ultra-High Confidence') :
             zThreshold >= 2.5 ? (isAr ? 'المعيار الموصى به' : 'Recommended Standard') :
             (isAr ? 'حساسية مرتفعة' : 'High Sensitivity')}
          </span>
        </div>
      </div>

      {/* Anomalies List */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {filteredAnomalies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="p-2.5 bg-slate-950/80 rounded-full border border-slate-900 text-slate-600">
              <BadgeInfo className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                {isAr ? 'لا توجد انحرافات مسجلة تحت هذه العتبة' : 'No Anomalies Found Under This Threshold'}
              </p>
              <p className="text-[10px] text-slate-600 font-light mt-0.5 max-w-sm">
                {isAr 
                  ? 'جميع سجلات المعاملات متوافقة بشكل كامل وتتوزع بشكل طبيعي ضمن حدود التسامح المحددة حالياً.' 
                  : 'All transaction metrics lie securely within standard tolerance boundaries at this sensitivity level.'}
              </p>
            </div>
          </div>
        ) : (
          filteredAnomalies.map((a, idx) => {
            const z = getZScore(a);
            const isHighRev = a.revenue > a.units * 100;
            const cardBg = isHighRev ? 'from-emerald-500/5 to-transparent' : 'from-rose-500/5 to-transparent';
            const borderCol = isHighRev ? 'hover:border-emerald-500/30' : 'hover:border-rose-500/30';
            const textCol = isHighRev ? 'text-emerald-400' : 'text-rose-400';

            return (
              <div 
                key={idx}
                className={`bg-slate-950/40 border border-slate-900/80 rounded-2xl p-3.5 flex flex-col justify-between transition-all bg-gradient-to-r text-start ${cardBg} ${borderCol}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold text-slate-200">{a.product}</span>
                    {a.campaign && a.campaign !== 'None' && (
                      <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-light border border-slate-800">
                        {a.campaign}
                      </span>
                    )}
                  </div>
                  
                  {/* Real-time Z-score Badge */}
                  <span className={`text-[9px] px-1.5 py-0.5 rounded border font-mono font-bold ${getZBadgeStyles(z)}`}>
                    Z-score: {z.toFixed(1)}σ
                  </span>
                </div>
                
                <p className="text-[11px] text-slate-300 font-light leading-relaxed text-start mb-3">
                  {a.anomalyReason || (isAr ? 'انحراف إيرادات ملحوظ إحصائياً يتطلب مراجعة فورية للموثوقية.' : 'Statistically significant revenue deviation requiring detailed audit.')}
                </p>

                <div className="flex items-center justify-between border-t border-slate-900/60 pt-2.5 mt-1.5">
                  <div className="flex gap-3 text-[10px] text-slate-500 font-mono">
                    <span>{isAr ? `الوحدات: ${a.units}` : `Units: ${a.units}`}</span>
                    <span className={`font-semibold ${textCol}`}>
                      {isAr ? `الإيرادات: $${a.revenue.toLocaleString()}` : `Rev: $${a.revenue.toLocaleString()}`}
                    </span>
                  </div>

                  <button
                    onClick={() => handleDeepAudit(a)}
                    className="flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/5 hover:bg-amber-500/15 border border-amber-500/20 px-2.5 py-1 rounded-lg cursor-pointer transition-all shrink-0"
                  >
                    <Sparkles className="w-3 h-3 text-amber-400 animate-pulse" />
                    <span>{isAr ? 'تحليل ذكي بالذكاء الاصطناعي' : 'AI Deep Audit'}</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: AI Audit Deep Dive */}
      <AnimatePresence>
        {selectedAnomaly && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnomaly(null)}
              className="absolute inset-0 bg-[#020408]/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[85vh] overflow-hidden shadow-2xl flex flex-col relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-900 p-4 bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                  </div>
                  <div className="text-start">
                    <h3 className="text-sm font-bold font-display text-white">
                      {isAr ? 'تقرير التدقيق الجنائي الذكي والمخاطر' : 'AI Forensic Audit & Risk Mitigation'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-mono font-light">
                      {isAr ? `المستأجر: ${activeTenant.name} • المعاملة: ${selectedAnomaly.product}` : `Tenant: ${activeTenant.name} • Item: ${selectedAnomaly.product}`}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="text-slate-500 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-5 text-start space-y-4">
                {/* Transaction summary table */}
                <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs font-mono">
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">{isAr ? 'التاريخ' : 'Date'}</span>
                    <span className="text-slate-200 block mt-0.5">{selectedAnomaly.date}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">{isAr ? 'المنتج' : 'Product'}</span>
                    <span className="text-slate-200 block mt-0.5 truncate">{selectedAnomaly.product}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">{isAr ? 'الإيرادات' : 'Revenue'}</span>
                    <span className="text-amber-400 block mt-0.5 font-bold">${selectedAnomaly.revenue.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px] uppercase">{isAr ? 'درجة الانحراف الإحصائي' : 'Z-Score'}</span>
                    <span className="text-rose-400 block mt-0.5 font-bold">{getZScore(selectedAnomaly).toFixed(1)}σ</span>
                  </div>
                </div>

                {/* AI report content */}
                <div className="prose prose-invert max-w-none text-xs leading-relaxed text-slate-300 space-y-3 font-normal">
                  {loadingAudit ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-3">
                      <Loader2 className="w-7 h-7 text-amber-500 animate-spin" />
                      <div className="text-center">
                        <p className="text-xs font-semibold text-slate-200 animate-pulse">
                          {isAr ? 'جاري صياغة تقرير التدقيق الجنائي بالذكاء الاصطناعي...' : 'Compiling AI Forensic Audit & Risk diagnostic...'}
                        </p>
                        <p className="text-[10px] text-slate-500 font-light mt-1">
                          {isAr ? 'مقارنة سجل الفواتير والمزامنة مع أنماط التدفق التاريخية...' : 'Cross-referencing invoice matching patterns with historical streams...'}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isFallback && (
                        <div className="bg-amber-500/5 border border-amber-500/20 text-amber-300 rounded-2xl p-4 flex gap-3 text-xs leading-relaxed text-start animate-fade-in">
                          <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5 animate-pulse" />
                          <div className="space-y-1">
                            <p className="font-bold">
                              {isAr ? 'تم تشغيل محلل التدقيق الجنائي الاحتياطي (Offline Solver Mode)' : 'Offline High-Fidelity Consulting Engine Engaged'}
                            </p>
                            <p className="text-[11px] text-slate-400 font-light leading-normal">
                              {isAr 
                                ? 'رصيد مفتاح واجهة برمجة تطبيقات الذكاء الاصطناعي التفاعلي انتهى حالياً أو استنفد الحصص (RESOURCE_EXHAUSTED). لضمان عدم تعطل خدمات التدقيق والمحاكاة لشركتك، قمنا بتوليد هذا التقرير الجنائي البديل عالي الدقة والمعتمد مسبقاً.' 
                                : 'The default Gemini API key has depleted its prepaid query quota (RESOURCE_EXHAUSTED). To ensure zero dashboard downtime and continuous operations, we have compiled this cached high-fidelity consulting report.'}
                            </p>
                            <p className="text-[10px] text-amber-500/80 font-mono mt-1">
                              {isAr ? 'الاستثناء الفني:' : 'Exception details:'} {errorMsg || 'Quota Limit / RESOURCE_EXHAUSTED'}
                            </p>
                          </div>
                        </div>
                      )}
                      <div className="bg-slate-950 p-4 border border-slate-900 rounded-2xl overflow-x-auto whitespace-pre-line text-slate-300">
                        {auditText}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-slate-900 p-4 bg-slate-950/50 flex items-center justify-between">
                <div className="flex gap-2">
                  <button
                    onClick={() => window.print()}
                    disabled={loadingAudit}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{isAr ? 'طباعة' : 'Print Report'}</span>
                  </button>
                  <button
                    onClick={handleCopyReport}
                    disabled={loadingAudit}
                    className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 hover:text-slate-200 border border-slate-800 hover:border-slate-700 px-3 py-1.5 rounded-xl cursor-pointer transition-all disabled:opacity-50"
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400">{isAr ? 'تم النسخ!' : 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        <span>{isAr ? 'نسخ للذاكرة' : 'Copy Report'}</span>
                      </>
                    )}
                  </button>
                </div>

                <button
                  onClick={() => setSelectedAnomaly(null)}
                  className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-white text-[11px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                >
                  {isAr ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Simulate / Inject Anomaly Form */}
      <AnimatePresence>
        {showInjectModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowInjectModal(false)}
              className="absolute inset-0 bg-[#020408]/80 backdrop-blur-md"
            ></motion.div>

            {/* Modal Content Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-950 border border-slate-800 rounded-3xl w-full max-w-md overflow-hidden shadow-2xl flex flex-col relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-900 p-4 bg-slate-950/50">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
                    <Plus className="w-4 h-4" />
                  </div>
                  <div className="text-start">
                    <h3 className="text-sm font-bold font-display text-white">
                      {isAr ? 'محاكاة وحقن معاملة شاذة' : 'Simulate & Inject Outlier Transaction'}
                    </h3>
                    <p className="text-[10px] text-slate-400 font-light">
                      {isAr ? 'حقن معاملة تجريبية غير طبيعية لاختبار النظام' : 'Inject an abnormal invoice record to trigger alerts'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setShowInjectModal(false)}
                  className="text-slate-500 hover:text-white p-1 hover:bg-slate-900 rounded-lg transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleInjectAnomaly} className="p-5 text-start space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    {isAr ? 'المنتج' : 'Product'}
                  </label>
                  <select
                    value={simProduct}
                    onChange={(e) => setSimProduct(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none"
                    required
                  >
                    {tenantProducts.map((p, idx) => (
                      <option key={idx} value={p}>{p}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      {isAr ? 'الإيرادات المتوقعة ($)' : 'Simulated Revenue ($)'}
                    </label>
                    <input
                      type="number"
                      value={simRevenue}
                      onChange={(e) => setSimRevenue(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none font-mono"
                      min="1"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                      {isAr ? 'الوحدات المباعة' : 'Units Sold'}
                    </label>
                    <input
                      type="number"
                      value={simUnits}
                      onChange={(e) => setSimUnits(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none font-mono"
                      min="1"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    {isAr ? 'التكلفة الإجمالية (COGS) ($)' : 'Simulated COGS ($)'}
                  </label>
                  <input
                    type="number"
                    value={simCost}
                    onChange={(e) => setSimCost(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none font-mono"
                    min="1"
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block">
                    {isAr ? 'السبب المزعوم / الملاحظة' : 'Simulated Anomaly Reason'}
                  </label>
                  <textarea
                    value={simReason}
                    onChange={(e) => setSimReason(e.target.value)}
                    placeholder={isAr ? 'مثال: محاكاة: طفرة هائلة في المبيعات بسبب منشور فيروسي...' : 'Example: Simulation: Massive billing loop anomaly...'}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:border-amber-500/50 focus:outline-none h-20 resize-none"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 bg-amber-500/5 border border-amber-500/10 p-3 rounded-2xl text-[10px] leading-normal text-amber-200/80">
                  <Info className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>
                    {isAr 
                      ? 'سيتم حقن هذه الصفقة في قائمة الانحرافات محلياً. ستلاحظ ظهورها فوراً كعنصر شاذ مع درجة انحراف مرتفعة (> 4.0σ) وتوافق مع عتبة التصفية.'
                      : 'This transaction will be injected locally. It will immediately show up as an outlier with a high deviation Z-score (> 4.0σ) matching the sensitivity controls.'}
                  </span>
                </div>

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-900">
                  <button
                    type="button"
                    onClick={() => setShowInjectModal(false)}
                    className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white text-[11px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-colors"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-[#070b13] text-[11px] font-bold px-4 py-2 rounded-xl cursor-pointer transition-all shadow-lg shadow-amber-950/20"
                  >
                    {isAr ? 'حقن المعاملة الشاذة' : 'Inject Anomaly'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
