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
      price: t.monthlyPlanPrice,
      period: isRTL ? '/ شهرياً' : '/ mo',
      badge: null,
      icon: Cpu,
      color: 'from-blue-600 to-cyan-500',
      borderGlow: 'hover:border-blue-500/40',
      bgCard: 'bg-slate-950/60',
      features: isRTL ? [
        'ربط مصدر نظام إدارة علاقات عملاء واحد (Odoo / PostgreSQL)',
        'تحليل ما يصل إلى 10,000 سجل مبيعات شهرياً',
        'التنبؤ العصبي القياسي للمبيعات (30 يوماً)',
        'مستخدم مشرف واحد',
        'الدعم الفني القياسي عبر البريد الإداري'
      ] : [
        '1 Connected CRM Source (Odoo / PostgreSQL)',
        'Up to 10,000 Sales Records / month',
        'Standard Neural Sales Forecasting (30 days)',
        '1 Admin seat',
        'Standard Email Support'
      ]
    },
    {
      id: 'annual',
      name: t.annualPlanName,
      price: t.annualPlanPrice,
      period: isRTL ? '/ شهرياً (دفع سنوي)' : '/ mo (billed annually)',
      badge: t.mostPopular,
      icon: Sparkles,
      color: 'from-indigo-600 to-violet-500',
      borderGlow: 'border-indigo-500/50 hover:border-indigo-500/80 shadow-lg shadow-indigo-950/20',
      bgCard: 'bg-slate-950/90 relative overflow-hidden ring-1 ring-indigo-500/30',
      features: isRTL ? [
        'ربط ما يصل إلى 5 مصادر بيانات / مستأجرين',
        'تحليل ما يصل إلى 150,000 سجل مبيعات شهرياً',
        'تنبؤ تنبؤي متقدم بالتعلم العميق مع حدود ثقة',
        'ذكاء مالي فوري مع مساعد الذكاء الاصطناعي 24/7',
        'ما يصل إلى 5 مستخدمين تنفيذيّين',
        'دعم فني ذو أولوية فائقة (أقل من ساعتين)'
      ] : [
        'Up to 5 Connected Data Sources / Tenants',
        'Up to 150,000 Sales Records / month',
        'Deep Learning Predictive Forecasting with bounds',
        '24/7 AI-Agent Chatbot Financial Intelligence',
        'Up to 5 Executive Seats',
        'Priority Support (Under 2 hours)'
      ]
    },
    {
      id: 'enterprise',
      name: t.enterprisePlanName,
      price: t.enterprisePlanPrice,
      period: '',
      badge: null,
      icon: Shield,
      color: 'from-amber-600 to-rose-500',
      borderGlow: 'hover:border-amber-500/40',
      bgCard: 'bg-slate-950/60',
      features: isRTL ? [
        'مصادر بيانات ومستأجرون متعددون غير محدودين',
        'سجلات مبيعات وقنوات بيانات مخصصة غير محدودة',
        'ضبط دقيق لنماذج تعلم الآلة وعمليات نشر محلية',
        'تقارير رؤى استراتيجية تنفيذية مع تصدير CSV',
        'مستخدمون غير محدودين مع تحكم بالصلاحيات (RBAC)',
        'مهندس حلول مخصص ودعم فني مع اتفاقية مستوى الخدمة'
      ] : [
        'Unlimited Connected Data Sources & Multi-tenants',
        'Unlimited Sales Records & Custom Data Pipelines',
        'Custom ML Model Fine-Tuning & Local Deployments',
        'Strategic Executive Insights Reports with CSV Export',
        'Unlimited Seats with Role-Based Access Control',
        'Dedicated Solutions Architect & SLA Support'
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
                  {selectedPlan === 'annual' ? t.annualPlanName : selectedPlan === 'monthly' ? t.monthlyPlanName : t.enterprisePlanName}
                </span>
                <span className="text-xs text-indigo-400 font-mono font-medium">
                  ({selectedPlan === 'annual' ? t.annualPlanPrice : selectedPlan === 'monthly' ? t.monthlyPlanPrice : t.enterprisePlanPrice}
                  {selectedPlan !== 'enterprise' ? (isRTL ? '/شهرياً' : '/mo') : ''})
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
