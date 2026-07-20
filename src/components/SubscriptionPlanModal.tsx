import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { translations, Language } from '../utils/translations';
import { Check, Sparkles, Shield, Cpu, Zap, Star, Loader2, X } from 'lucide-react';
import { Tenant } from '../types';

interface SubscriptionPlanModalProps {
  isOpen: boolean;
  onSelectPlan: (planId: string) => void;
  language: Language;
  activeTenant?: Tenant | null;
  onCheckoutSuccess?: () => void;
  onCancel?: () => void;
}

export default function SubscriptionPlanModal({
  isOpen,
  onSelectPlan,
  language,
  activeTenant,
  onCheckoutSuccess,
  onCancel
}: SubscriptionPlanModalProps) {
  const t = translations[language];
  const isRTL = language === 'ar';

  const [step, setStep] = useState<'selection' | 'payment'>('selection');
  const [selectedPlan, setSelectedPlan] = useState<string>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');

  const handleProceed = () => {
    if (step === 'selection') {
      setStep('payment');
    } else {
      handleCheckout();
    }
  };

  const handleCheckout = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTenant || !onCheckoutSuccess) {
      onSelectPlan(selectedPlan);
      return;
    }

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/billing/${activeTenant.id}/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: selectedPlan }),
      });
      if (res.ok) {
        onCheckoutSuccess();
      } else {
        console.error('Checkout failed');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsProcessing(false);
    }
  };

  const plans = [
    {
      id: 'monthly',
      name: t.monthlyPlanName,
      price: '$0',
      period: isRTL ? '/ شهرياً' : '/ mo',
      badge: null,
      icon: Cpu,
      color: 'from-slate-600 to-slate-400',
      borderGlow: 'hover:border-slate-500/40',
      bgCard: 'bg-slate-950/60',
      limits: isRTL ? [
        { label: 'مصادر البيانات المتاحة', value: 'شركة واحدة (Single Tenant)' },
        { label: 'حد سجلات المبيعات', value: '10,000 سجل / شهرياً' },
        { label: 'المعاملات الشاذة', value: 'حتى 5 شهرياً' },
        { label: 'مدى التنبؤ العصبي', value: 'أساسي' }
      ] : [
        { label: 'Connected CRM Sources', value: '1 Tenant Limit' },
        { label: 'Monthly Sales Records', value: '10,000 records / mo' },
        { label: 'Anomaly Detection', value: 'Up to 5 / month' },
        { label: 'Neural Forecast Window', value: 'Basic AI Trend' }
      ],
      features: isRTL ? [
        'ربط شركة واحدة (Single Tenant)',
        'تنبؤ مالي ذكي أساسي',
        'كشف حتى 5 معاملات شاذة شهرياً',
        'استعلامات محدودة لمساعد الذكاء الاصطناعي',
        'دعم عبر البريد الإلكتروني'
      ] : [
        '1 Tenant connection limit',
        'Basic AI trend forecasting',
        'Detect up to 5 anomalies / mo',
        'Standard Gemini query limit',
        'Email customer support'
      ]
    },
    {
      id: 'annual',
      name: t.annualPlanName,
      price: billingCycle === 'yearly' ? '$39' : '$49',
      period: billingCycle === 'yearly' ? (isRTL ? '/ شهرياً (دفع سنوي)' : '/ mo (billed annually)') : (isRTL ? '/ شهرياً' : '/ mo'),
      badge: t.mostPopular,
      icon: Sparkles,
      color: 'from-indigo-600 to-violet-500',
      borderGlow: 'border-indigo-500/50 hover:border-indigo-500/80 shadow-lg shadow-indigo-950/20',
      bgCard: 'bg-slate-950/90 relative overflow-hidden ring-1 ring-indigo-500/30',
      limits: isRTL ? [
        { label: 'مصادر البيانات المتاحة', value: 'حتى 5 مصادر (Multi-Tenant)' },
        { label: 'حد سجلات المبيعات', value: '150,000 سجل / شهرياً' },
        { label: 'المعاملات الشاذة', value: 'غير محدود بالكامل' },
        { label: 'مدى التنبؤ العصبي', value: '30 يوماً مع حدود الثقة' }
      ] : [
        { label: 'Connected CRM Sources', value: 'Up to 5 Tenants' },
        { label: 'Monthly Sales Records', value: '150,000 records / mo' },
        { label: 'Anomaly Detection', value: 'Unlimited Audits & Advice' },
        { label: 'Neural Forecast Window', value: '30-Day + Confidence Bounds' }
      ],
      features: isRTL ? [
        'ربط حتى 5 شركات مختلفة (Multi-Tenant)',
        'تنبؤ ذكي متقدم بـ 30 يوماً مع حدود الثقة',
        'كشف غير محدود للمعاملات الشاذة وتحليل أسبابها',
        'استعلامات غير محدودة لمساعد الذكاء الاصطناعي',
        'ربط مباشر مع Odoo و Shopify وقواعد البيانات',
        'دعم فني ذو أولوية على مدار الساعة'
      ] : [
        'Up to 5 Tenant connections',
        'Full 30-Day forecasting with bounds',
        'Unlimited anomaly audits & advice',
        'Uncapped Gemini Strategist queries',
        'Full CRM federation (Odoo, Shopify)',
        'Priority 24/7 technical support'
      ]
    },
    {
      id: 'enterprise',
      name: t.enterprisePlanName,
      price: billingCycle === 'yearly' ? '$149' : '$189',
      period: billingCycle === 'yearly' ? (isRTL ? '/ شهرياً (دفع سنوي)' : '/ mo (billed annually)') : (isRTL ? '/ شهرياً' : '/ mo'),
      badge: null,
      icon: Shield,
      color: 'from-amber-600 to-rose-500',
      borderGlow: 'hover:border-amber-500/40',
      bgCard: 'bg-slate-950/60',
      limits: isRTL ? [
        { label: 'مصادر البيانات المتاحة', value: 'عدد غير محدود من الفروع والشركات' },
        { label: 'حد سجلات المبيعات', value: 'غير محدود بالكامل' },
        { label: 'مستخدمين مشرفين', value: 'غير محدود مع صلاحيات مخصصة' },
        { label: 'مدى التنبؤ العصبي', value: 'تخصيص كامل وتدريب خاص' }
      ] : [
        { label: 'Connected CRM Sources', value: 'Unlimited Tenants' },
        { label: 'Monthly Sales Records', value: 'Uncapped / Month' },
        { label: 'User Controls', value: 'Unlimited (RBAC)' },
        { label: 'Neural Forecast Window', value: 'Custom Trained Models' }
      ],
      features: isRTL ? [
        'عدد غير محدود من الشركات والفروع',
        'تخصيص نماذج التنبؤ وتدريب الخوارزميات',
        'واجهة برمجة تطبيقات (API) مخصصة للنظام',
        'تشفير بيانات عسكري عالي الأمان',
        'مدير حسابات استراتيجي مخصص',
        'خدمة تطبيق وتهيئة مخصصة من فريقنا'
      ] : [
        'Unlimited Tenants & Subsidiaries',
        'Custom training for forecast models',
        'Dedicated secure system APIs',
        'Military-grade data encryption',
        'Dedicated Enterprise account executive',
        'Tailored on-premise onboarding'
      ]
    }
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="w-full max-w-6xl bg-[#090d16] border border-slate-900 rounded-3xl p-6 md:p-8 relative shadow-2xl my-8"
        >
          {/* Subtle background glows */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none"></div>

          {step === 'selection' ? (
            <>
              {/* Header */}
              <div className="text-center max-w-2xl mx-auto mb-8 md:mb-12 relative z-10">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/25 text-xs font-semibold mb-3">
                  <Zap className="w-3.5 h-3.5 fill-indigo-400/20" />
                  <span>{isRTL ? 'خطوة متبقية واحدة' : 'One Last Step'}</span>
                </div>
                <h2 className="text-2xl md:text-3.5xl font-extrabold text-white tracking-tight font-display">
                  {t.subscriptionTitle}
                </h2>
                <p className="text-xs md:text-sm text-slate-400 mt-2.5 font-light leading-relaxed">
                  {t.choosePlanSubtitle}
                </p>
              </div>

              {/* Billing Cycle Toggle */}
              <div className="flex items-center justify-center gap-3 mb-8 relative z-10">
                <span className={`text-xs ${billingCycle === 'monthly' ? 'text-white font-bold' : 'text-slate-400 font-light'}`}>
                  {isRTL ? 'الدفع الشهري' : 'Monthly Billing'}
                </span>
                <button
                  type="button"
                  onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                  className="w-11 h-6 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-full p-0.5 transition-all focus:outline-none flex items-center cursor-pointer"
                >
                  <div 
                    className={`w-4.5 h-4.5 bg-indigo-500 rounded-full transition-all transform ${
                      billingCycle === 'yearly' ? (isRTL ? '-translate-x-5' : 'translate-x-5') : 'translate-x-0'
                    }`}
                  />
                </button>
                <span className={`text-xs ${billingCycle === 'yearly' ? 'text-white font-bold' : 'text-slate-400 font-light'} flex items-center gap-1`}>
                  <span>{isRTL ? 'الدفع السنوي' : 'Yearly Billing'}</span>
                  <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 px-1.5 py-0.5 rounded-full">
                    {isRTL ? 'توفير ٢٠٪' : 'Save 20%'}
                  </span>
                </span>
              </div>

              {/* Pricing Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch relative z-10 mb-8 md:mb-10">
                {plans.map((plan) => {
                  const IconComp = plan.icon;
                  const isSelected = selectedPlan === plan.id;

                  return (
                    <div
                      key={plan.id}
                      onClick={() => setSelectedPlan(plan.id)}
                      className={`flex flex-col rounded-3xl border p-6.5 transition-all duration-300 cursor-pointer relative ${
                        isSelected
                          ? 'border-indigo-500 bg-slate-950/95 ring-1 ring-indigo-500/30'
                          : 'border-slate-800/80 bg-slate-950/45 hover:bg-slate-950/75'
                      } ${plan.borderGlow}`}
                    >
                      {/* Selected indicator */}
                      {isSelected && (
                        <div className={`absolute top-4 ${isRTL ? 'left-4' : 'right-4'} bg-indigo-500 text-white rounded-full p-1`}>
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}

                      {plan.badge && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2">
                          <span className="flex items-center gap-1 text-[10px] bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-extrabold px-3 py-1 rounded-full uppercase tracking-wider shadow-md border border-indigo-400/25">
                            <Star className="w-2.5 h-2.5 fill-white" />
                            {plan.badge}
                          </span>
                        </div>
                      )}

                      {/* Icon & Plan Name */}
                      <div className="flex items-center gap-3.5 mb-5 mt-2">
                        <div className={`p-3 rounded-2xl bg-gradient-to-tr ${plan.color} text-white shadow-lg border border-white/10`}>
                          <IconComp className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-bold text-white tracking-tight font-display text-start">
                            {plan.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono tracking-wider uppercase mt-0.5 text-start">
                            {plan.id === 'annual' ? t.billedAnnually : plan.id === 'monthly' ? t.billedMonthly : (isRTL ? 'حسب الحاجة' : 'On-Demand')}
                          </p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-baseline gap-1 mb-5 border-b border-slate-900 pb-5 text-start">
                        <span className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
                          {plan.price}
                        </span>
                        <span className="text-xs text-slate-500 font-light font-mono">
                          {plan.period}
                        </span>
                      </div>

                      {/* Quotas & Limits */}
                      <div className="mb-5 bg-[#0b101c]/60 rounded-2xl p-3.5 border border-slate-900 text-start space-y-2">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 font-bold block">
                          {isRTL ? 'الحدود المعتمدة في الخطة' : 'Plan Quotas & Limits'}
                        </span>
                        <div className="grid grid-cols-2 gap-2">
                          {plan.limits.map((lim, lIdx) => (
                            <div key={lIdx} className="bg-slate-950/80 p-2.5 rounded-xl border border-slate-900">
                              <span className="text-[9px] text-slate-400 block truncate leading-none mb-1.5">{lim.label}</span>
                              <span className="text-[10.5px] font-bold text-indigo-400 font-sans block leading-tight">{lim.value}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3.5 flex-1 mb-6">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-xs leading-relaxed text-slate-300">
                            <span className={`p-0.5 rounded-full mt-0.5 ${
                              isSelected ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-slate-900 text-slate-400 border border-slate-800'
                            } shrink-0`}>
                              <Check className="w-3 h-3" />
                            </span>
                            <span className="text-start font-light">{feat}</span>
                          </li>
                        ))}
                      </ul>

                      {/* Select button inside card */}
                      <div className="mt-auto">
                        <button
                          type="button"
                          className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all border cursor-pointer ${
                            isSelected
                              ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white border-indigo-500 shadow-md shadow-indigo-950/50'
                              : 'bg-slate-900/50 text-slate-400 border-slate-800 hover:text-white hover:border-slate-700'
                          }`}
                        >
                          {isSelected ? (isRTL ? 'الخطة المحددة حالياً' : 'Currently Selected') : t.selectPlan}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Plan Comparison Matrix */}
              <div className="mt-4 mb-8 relative z-10 border border-slate-900/80 bg-[#070b13] rounded-3xl p-5 md:p-6.5 text-start">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-5 border-b border-slate-900 pb-4">
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">
                      {isRTL ? 'مصفوفة مقارنة الحدود والميزات التفصيلية' : 'Detailed Limits & Feature Comparison Matrix'}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {isRTL 
                        ? 'مقارنة شاملة بين حدود الباقات المختلفة لمساعدتك في اتخاذ القرار الأمثل لمؤسستك.' 
                        : 'Side-by-side limit breakdowns to find the perfect fit for your enterprise operations.'}
                    </p>
                  </div>
                  <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-mono text-indigo-400 font-semibold uppercase">
                    {isRTL ? 'التحليل والمقارنة' : 'Compare & Contrast'}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-start text-xs border-collapse min-w-[600px]">
                    <thead>
                      <tr className="border-b border-slate-900 text-slate-400 font-mono text-[10px] uppercase tracking-wider text-start">
                        <th className="py-3 px-4 font-semibold text-start">{isRTL ? 'المواصفة / حدود الباقة' : 'Limit Specification'}</th>
                        <th className="py-3 px-4 font-semibold text-start text-slate-400">{isRTL ? 'الباقة المبتدئة ($0)' : 'Starter Sandbox ($0)'}</th>
                        <th className="py-3 px-4 font-semibold text-start text-indigo-400">{isRTL ? 'باقة النمو ($39/شهرياً)' : 'Growth Professional ($39/mo)'}</th>
                        <th className="py-3 px-4 font-semibold text-start text-amber-500">{isRTL ? 'باقة المؤسسات ($149/شهرياً)' : 'Enterprise Suite ($149/mo)'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-900/50 text-slate-300">
                      {/* Section 1: Data Limits */}
                      <tr className="bg-slate-950/40 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                        <td colSpan={4} className="py-2.5 px-4 text-start">{isRTL ? 'حدود البيانات والمزامنة' : 'Data Streams & Storage Limits'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'مصادر البيانات والشركات المتصلة' : 'Connected CRM Sources'}</td>
                        <td className="py-3 px-4 text-slate-400">1 {isRTL ? 'شركة واحدة' : 'Tenant Limit'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">{isRTL ? 'حتى 5 مصادر متزامنة' : 'Up to 5 Tenants'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'غير محدود (Multi-Tenant)' : 'Unlimited Tenants'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'حد سجلات المبيعات شهرياً' : 'Monthly Sales Record Vol'}</td>
                        <td className="py-3 px-4 text-slate-400">10,000 {isRTL ? 'سجل' : 'records'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">150,000 {isRTL ? 'سجل' : 'records'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'غير محدود بالكامل' : 'Unlimited (No Cap)'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'تكامل الأنظمة وقواعد البيانات' : 'CRM & Odoo Direct Connect'}</td>
                        <td className="py-3 px-4 text-slate-400">{isRTL ? 'متاح (أساسي)' : 'Available (Basic)'}</td>
                        <td className="py-3 px-4 text-indigo-300">{isRTL ? 'ربط مباشر متكامل' : 'Full CRM Integration'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'تكامل مخصص مع أي نظام' : 'Custom Tailored API Pipelines'}</td>
                      </tr>

                      {/* Section 2: AI & Forecast Quotas */}
                      <tr className="bg-slate-950/40 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                        <td colSpan={4} className="py-2.5 px-4 text-start">{isRTL ? 'خوارزميات الذكاء الاصطناعي والتنبؤ' : 'AI Models & Neural Quotas'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'محرك التنبؤ بالمبيعات' : 'Predictive Forecast Engine'}</td>
                        <td className="py-3 px-4 text-slate-400">{isRTL ? 'أساسي' : 'Basic AI Trend'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">{isRTL ? '30 يوماً مع حدود الثقة' : '30-Day + Confidence Bounds'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'تخصيص كامل وتدريب خاص للنماذج' : 'Custom Fine-Tuning & Local Models'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'كشف العمليات غير العادية والمعاملات الشاذة' : 'Anomaly Detection Audits'}</td>
                        <td className="py-3 px-4 text-slate-400">{isRTL ? 'حتى 5 عمليات شهرياً' : 'Up to 5 anomalies / mo'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">{isRTL ? 'غير محدود بالكامل' : 'Unlimited Audits & Advice'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'غير محدود مع تنبيهات ذكية فورية' : 'Unlimited + Custom Alert Triggers'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'استعلامات مساعد الذكاء الاصطناعي' : 'Gemini Strategist Chat Queries'}</td>
                        <td className="py-3 px-4 text-slate-400">{isRTL ? 'محدودة' : 'Standard Limit'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">{isRTL ? 'غير محدودة بالكامل' : 'Uncapped Queries'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'مساعد ذكاء اصطناعي مخصص للمؤسسة' : 'Custom Brand Persona & Tools'}</td>
                      </tr>

                      {/* Section 3: Users & Access Controls */}
                      <tr className="bg-slate-950/40 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                        <td colSpan={4} className="py-2.5 px-4 text-start">{isRTL ? 'المقاعد وإدارة الصلاحيات والأمان' : 'User Seats & Security'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'المقاعد والمستخدمين المشغلين' : 'User Seats'}</td>
                        <td className="py-3 px-4 text-slate-400">1 {isRTL ? 'مستخدم واحد' : 'User seat'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">5 {isRTL ? 'مستخدمين' : 'User Seats'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'غير محدود بالكامل' : 'Unlimited Seats (RBAC)'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'سجلات تدقيق العمليات الإدارية (Access Logs)' : 'Administrative Access Audit Logs'}</td>
                        <td className="py-3 px-4 text-slate-500">{isRTL ? 'غير متوفر' : 'Not Available'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">{isRTL ? 'سجل كامل للعمليات الإدارية' : 'Full Admin Logs'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'سجل كامل + إرسال تنبيهات بريدية فورية' : 'Full Logs + Real-time Alerts'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'واجهات برمجية API لإدخال المبيعات' : 'Programmatic API Data Insertion'}</td>
                        <td className="py-3 px-4 text-slate-500">{isRTL ? 'غير متوفر' : 'Not Available'}</td>
                        <td className="py-3 px-4 text-slate-500">{isRTL ? 'غير متوفر' : 'Not Available'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'متوفرة بالكامل (توثيق برمجيات SniperAI)' : 'Full SDK, Docs & OAuth Integration'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'أمان وحماية البيانات' : 'Data Encryption'}</td>
                        <td className="py-3 px-4 text-slate-400">{isRTL ? 'أمان قياسي' : 'Standard Secure'}</td>
                        <td className="py-3 px-4 text-indigo-300">{isRTL ? 'تشفير متطور' : 'Advanced Encryption'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'تشفير عسكري فائق الأمان' : 'Military-Grade Secure Vault'}</td>
                      </tr>

                      {/* Section 4: Support */}
                      <tr className="bg-slate-950/40 font-bold text-[10px] text-slate-400 uppercase tracking-wider">
                        <td colSpan={4} className="py-2.5 px-4 text-start">{isRTL ? 'الدعم واتفاقيات الخدمة SLA' : 'Support & SLA'}</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-4 font-medium text-white">{isRTL ? 'قناة الدعم الفني' : 'Technical Support Support'}</td>
                        <td className="py-3 px-4 text-slate-400">{isRTL ? 'عبر البريد الإلكتروني' : 'Email Support'}</td>
                        <td className="py-3 px-4 text-indigo-300 font-medium">{isRTL ? 'أولوية فائقة على مدار الساعة 24/7' : 'Priority 24/7 Support'}</td>
                        <td className="py-3 px-4 text-amber-400 font-semibold">{isRTL ? 'مدير حسابات استراتيجي ومرافقة مخصصة' : 'Dedicated Executive Onboarding & SLA'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            <div className="max-w-md mx-auto relative z-10 mb-8 md:mb-10 text-start">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-white mb-2">{isRTL ? 'تفاصيل الدفع' : 'Payment Details'}</h2>
                <p className="text-sm text-slate-400">{isRTL ? 'أدخل معلومات بطاقتك الائتمانية لإتمام الاشتراك' : 'Enter your credit card information to complete the subscription'}</p>
              </div>
              <form onSubmit={handleCheckout} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-800 space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isRTL ? 'الاسم على البطاقة' : 'Name on Card'}</label>
                  <input type="text" placeholder="John Doe" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">{isRTL ? 'رقم البطاقة' : 'Card Number'}</label>
                  <input type="text" placeholder="0000 0000 0000 0000" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">{isRTL ? 'تاريخ الانتهاء' : 'Expiry Date'}</label>
                    <input type="text" placeholder="MM/YY" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">CVC</label>
                    <input type="text" placeholder="123" required className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" />
                  </div>
                </div>
              </form>
            </div>
          )}

          {/* Action Call to Action footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4.5 rounded-2.5xl bg-slate-950 border border-slate-900/80 relative z-10">
            <div className="text-start">
              <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                {t.selectedPlanLabel}
              </span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="text-sm font-bold text-white font-display">
                  {plans.find(p => p.id === selectedPlan)?.name}
                </span>
                <span className="text-xs text-indigo-400 font-mono font-medium">
                  ({plans.find(p => p.id === selectedPlan)?.price} {plans.find(p => p.id === selectedPlan)?.period})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
              {step === 'payment' && (
                <button
                  type="button"
                  onClick={() => setStep('selection')}
                  disabled={isProcessing}
                  className="px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold rounded-xl border border-slate-800 transition-all cursor-pointer"
                >
                  {isRTL ? 'رجوع' : 'Back'}
                </button>
              )}
              <button
                onClick={handleProceed}
                disabled={isProcessing}
                className={`flex-1 sm:flex-none px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold rounded-xl border border-indigo-500/30 shadow-lg shadow-indigo-950/40 transition-all cursor-pointer flex items-center justify-center gap-2 ${isProcessing ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 fill-white/10" />
                )}
                <span>
                  {isProcessing 
                    ? (isRTL ? 'جاري المعالجة...' : 'Processing...') 
                    : step === 'selection' 
                      ? t.proceedToTenant 
                      : (isRTL ? 'تأكيد الدفع' : 'Confirm Payment')}
                </span>
              </button>
            </div>
          </div>
          {onCancel && (
            <button 
              onClick={onCancel}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-800 rounded-full cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
