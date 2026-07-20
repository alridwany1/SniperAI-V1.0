import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, TrendingUp, Shield, Cpu, Globe, ArrowRight, ArrowLeft, 
  Volume2, VolumeX, CheckCircle2, Zap, Check, Crown, Server, Star,
  LineChart, AlertCircle, Play, Database, RefreshCw, Send, AlertTriangle, Eye
} from 'lucide-react';
import sniperLogo from '../assets/images/sniper_ai_logo_1783155755401.jpg';

interface MarketingSplashProps {
  language: 'en' | 'ar';
  onLanguageToggle: () => void;
  onFinish: () => void;
}

export default function MarketingSplash({ language, onLanguageToggle, onFinish }: MarketingSplashProps) {
  const [progress, setProgress] = useState(0);
  const [loadingText, setLoadingText] = useState('');
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('yearly');
  const [activeScenario, setActiveScenario] = useState<'normal' | 'optimistic' | 'conservative'>('normal');
  const [simulationStep, setSimulationStep] = useState(0);
  const [simulationLogs, setSimulationLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const isRTL = language === 'ar';
  const simIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (simIntervalRef.current) {
        clearInterval(simIntervalRef.current);
      }
    };
  }, []);

  // Elegant Loading steps - perfectly synced with the unified theme
  const steps = [
    {
      percentage: 20,
      ar: 'جاري تهيئة خوارزميات التنبؤ المالي للذكاء الاصطناعي...',
      en: 'Initializing AI financial forecasting algorithms...',
    },
    {
      percentage: 45,
      ar: 'تحميل نموذج كشف المعاملات المالية الشاذة بدقة عالية...',
      en: 'Loading critical anomaly detection engine...',
    },
    {
      percentage: 70,
      ar: 'مزامنة لوحة القيادة التفاعلية والربط الفيدرالي لـ Odoo...',
      en: 'Synchronizing interactive ledger and Odoo federation...',
    },
    {
      percentage: 90,
      ar: 'تحسين تسريع بطاقات الأداء ومؤشرات الربحية المستهدفة...',
      en: 'Optimizing KPI cards and target profitability models...',
    },
    {
      percentage: 100,
      ar: 'تم تحميل البيئة الاستراتيجية بنجاح. النظام جاهز للانطلاق!',
      en: 'Strategic intelligence suite ready. Systems online!',
    }
  ];

  // Features - Unified with professional Indigo and Slate color accents
  const features = [
    {
      icon: TrendingUp,
      titleAr: 'تنبؤات مبيعات فائقة الدقة',
      titleEn: 'Precision Sales Forecasting',
      descAr: 'خوارزميات متطورة تتنبأ بحركة المبيعات والطلب للـ 30 يوماً القادمة بدقة عالية لتقليل مخاطر التوريد.',
      descEn: 'State-of-the-art predictive curves forecasting demand & revenue patterns 30 days out with absolute confidence limits.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/15',
    },
    {
      icon: Shield,
      titleAr: 'رصد فوري للمعاملات الشاذة',
      titleEn: 'Instant Anomaly Detection',
      descAr: 'نظام حماية يعتمد على التعلم الآلي للكشف التلقائي عن أي تراجع حاد أو طفرة مفاجئة وتفسير أسبابها.',
      descEn: 'Machine learning monitors transactions to instantly audit outliers, detail root causes, and suggest tactical actions.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/15',
    },
    {
      icon: Cpu,
      titleAr: 'مساعد أعمال ذكي مدمج',
      titleEn: 'Interactive AI Strategist',
      descAr: 'مساعد استشاري مدعوم بـ Gemini يقدم توصيات فورية لزيادة هوامش الربح وتحليل البيانات العميقة بصيغة تفاعلية.',
      descEn: 'Gemini-powered advisory agent answering complex queries, drafting reports, and solving tasks in real-time.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/15',
    },
    {
      icon: Globe,
      titleAr: 'تعدد الشركات والربط السحابي',
      titleEn: 'Multi-Tenant Cloud Integration',
      descAr: 'ربط سلس مع منصات مبيعات عالمية مثل Odoo وشوبيفاي مع دعم كامل للغتين العربية والانجليزية والعملات المحلية.',
      descEn: 'Fluent cross-tenant synchronization with live channels for Odoo CRM, Shopify, and database ledgers.',
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/10',
      border: 'border-indigo-500/15',
    }
  ];

  // Pricing Plans
  const pricingPlans = [
    {
      id: 'starter',
      nameAr: 'الباقة المبتدئة',
      nameEn: 'Starter Sandbox',
      priceMonthly: 0,
      priceYearly: 0,
      icon: Server,
      color: 'text-slate-400',
      borderClass: 'border-slate-800 bg-slate-950/40 hover:border-slate-700/80',
      bgClass: 'bg-slate-950/40',
      featuresAr: [
        'ربط شركة واحدة (Single Tenant)',
        'تنبؤ مالي ذكي أساسي',
        'كشف حتى 5 معاملات شاذة شهرياً',
        'استعلامات محدودة لمساعد الذكاء الاصطناعي',
        'دعم عبر البريد الإلكتروني'
      ],
      featuresEn: [
        '1 Tenant connection limit',
        'Basic AI trend forecasting',
        'Detect up to 5 anomalies / mo',
        'Standard Gemini query limit',
        'Email customer support'
      ]
    },
    {
      id: 'growth',
      nameAr: 'باقة النمو الاحترافية',
      nameEn: 'Growth Professional',
      priceMonthly: 49,
      priceYearly: 39,
      icon: Zap,
      color: 'text-indigo-400',
      borderClass: 'border-indigo-500/30 shadow-[0_0_20px_rgba(99,102,241,0.06)] hover:border-indigo-500/50',
      bgClass: 'bg-indigo-950/10 border-indigo-500/20 relative',
      popular: true,
      featuresAr: [
        'ربط حتى 5 شركات مختلفة (Multi-Tenant)',
        'تنبؤ ذكي متقدم بـ 30 يوماً مع حدود الثقة',
        'كشف غير محدود للمعاملات الشاذة وتحليل أسبابها',
        'استعلامات غير محدودة لمساعد الذكاء الاصطناعي',
        'ربط مباشر مع Odoo و Shopify وقواعد البيانات',
        'دعم فني ذو أولوية على مدار الساعة'
      ],
      featuresEn: [
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
      nameAr: 'باقة المؤسسات والتحكم',
      nameEn: 'Enterprise Suite',
      priceMonthly: 189,
      priceYearly: 149,
      icon: Crown,
      color: 'text-indigo-300',
      borderClass: 'border-slate-800 bg-slate-950/40 hover:border-indigo-500/30',
      bgClass: 'bg-slate-950/40',
      featuresAr: [
        'عدد غير محدود من الشركات والفروع',
        'تخصيص نماذج التنبؤ وتدريب الخوارزميات',
        'واجهة برمجة تطبيقات (API) مخصصة للنظام',
        'تشفير بيانات عسكري عالي الأمان',
        'مدير حسابات استراتيجي مخصص',
        'خدمة تطبيق وتهيئة مخصصة من فريقنا'
      ],
      featuresEn: [
        'Unlimited Tenants & Subsidiaries',
        'Custom training for forecast models',
        'Dedicated secure system APIs',
        'Military-grade data encryption',
        'Dedicated Enterprise account executive',
        'Tailored on-premise onboarding'
      ]
    }
  ];

  // Dynamic Chart Points based on selected scenario
  const chartPoints: Record<'normal' | 'optimistic' | 'conservative', number[]> = {
    normal: [30, 45, 38, 52, 48, 65, 58, 72, 68, 85, 80, 95],
    optimistic: [30, 50, 48, 68, 65, 88, 82, 105, 100, 125, 120, 145],
    conservative: [30, 40, 32, 44, 38, 48, 42, 50, 46, 55, 50, 58]
  };

  // Run Real-time Simulation step-by-step
  const startSimulation = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimulationStep(0);
    setSimulationLogs([]);

    const messages = isRTL ? [
      '🔌 جاري الاتصال بقنوات بيانات Odoo و Shopify...',
      '📥 تم سحب آخر 10,000 عملية مبيعات بنجاح.',
      '🤖 جاري تشغيل نموذج الذكاء الاصطناعي للتنبؤ وحساب الانحرافات...',
      '⚠️ تنبيه: تم رصد معاملة شاذة (قيمة بيع مرتفعة غير مبررة بـ $12,450)!',
      '🧠 جاري تفعيل Gemini لتفسير الشذوذ وتقديم الحلول الاستراتيجية...',
      '✅ تم تحديث لوحة التحكم وإرسال إشعار فوري للمشرف.'
    ] : [
      '🔌 Connecting to Odoo and Shopify live channels...',
      '📥 Pulled last 10,000 corporate sale records instantly.',
      '🤖 Powering ML predictive models & calculating standard deviations...',
      '⚠️ Alert: Detected sales anomaly (unexplained high spike of $12,450)!',
      '🧠 Invoking Gemini AI agent to analyze outlier context & draft response...',
      '✅ Dashboard updated & Slack/Odoo notification sent to administrator.'
    ];

    if (simIntervalRef.current) {
      clearInterval(simIntervalRef.current);
    }

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < messages.length) {
        const nextMsg = messages[currentStep];
        if (nextMsg) {
          setSimulationLogs(prev => [...prev, nextMsg]);
        }
        setSimulationStep(currentStep + 1);
        currentStep++;
      }
      
      if (currentStep >= messages.length) {
        if (simIntervalRef.current) {
          clearInterval(simIntervalRef.current);
          simIntervalRef.current = null;
        }
        setIsSimulating(false);
      }
    }, 1200);

    simIntervalRef.current = interval;
  };

  useEffect(() => {
    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += Math.floor(Math.random() * 4) + 1;
      if (currentProgress >= 100) {
        currentProgress = 100;
        clearInterval(interval);
      }
      setProgress(currentProgress);

      const currentStep = steps.find(s => currentProgress <= s.percentage) || steps[steps.length - 1];
      setLoadingText(isRTL ? currentStep.ar : currentStep.en);
    }, 70);

    return () => clearInterval(interval);
  }, [language]);

  useEffect(() => {
    if (progress === 100 && isAudioEnabled) {
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
        oscillator.frequency.setValueAtTime(880, audioCtx.currentTime + 0.15); // A5
        gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        oscillator.start();
        oscillator.stop(audioCtx.currentTime + 0.4);
      } catch (e) {
        console.warn('Audio feedback blocked by browser policies:', e);
      }
    }
  }, [progress, isAudioEnabled]);

  // SVG Chart path builder
  const getSvgPath = (points: number[]) => {
    return points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${i * 40 + 20} ${150 - p}`).join(' ');
  };

  // SVG Chart area path builder
  const getSvgAreaPath = (points: number[]) => {
    const linePath = getSvgPath(points);
    return `${linePath} L ${(points.length - 1) * 40 + 20} 150 L 20 150 Z`;
  };

  return (
    <div 
      dir={isRTL ? 'rtl' : 'ltr'} 
      className="min-h-screen bg-slate-950 text-slate-200 flex flex-col justify-between p-4 sm:p-6 overflow-x-hidden relative selection:bg-indigo-600 selection:text-white"
    >
      {/* Harmonious Subtle Glow Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[45vw] h-[45vw] bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[45vw] h-[45vw] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-1/3 left-1/3 w-[30vw] h-[30vw] bg-indigo-700/5 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Utility Nav */}
      <header className="relative z-10 max-w-7xl w-full mx-auto flex items-center justify-between py-3 border-b border-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="relative w-9 h-9 rounded-xl overflow-hidden border border-indigo-500/20 shadow-md shadow-indigo-950/20 shrink-0">
            <img src={sniperLogo} alt="SniperAI Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-extrabold tracking-tight text-white">SniperAI</span>
              <span className="text-[8px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold font-mono">V2.1</span>
            </div>
            <p className="text-[10px] text-slate-400 font-light mt-0.5 hidden sm:block">
              {isRTL ? 'نظام التحليلات التنبؤية وكشف الانحرافات التشغيلية' : 'Predictive Analytics & Outlier Detection Engine'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Audio Feedback Toggle */}
          <button
            type="button"
            onClick={() => setIsAudioEnabled(!isAudioEnabled)}
            className="p-2 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl text-slate-400 hover:text-white transition-all cursor-pointer"
            title={isRTL ? 'المؤثرات الصوتية' : 'Sound Effects'}
          >
            {isAudioEnabled ? <Volume2 className="w-4 h-4 text-indigo-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
          </button>

          {/* Language Toggle */}
          <button
            type="button"
            onClick={onLanguageToggle}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-slate-700 rounded-xl text-xs font-semibold text-slate-300 hover:text-white transition-all cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isRTL ? 'English' : 'العربية'}</span>
          </button>

          {/* Skip Button */}
          <button
            type="button"
            onClick={onFinish}
            className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 active:scale-[0.98] border border-indigo-500/20 text-indigo-300 hover:text-indigo-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            <span>{isRTL ? 'دخول فوري' : 'Quick Launch'}</span>
            {isRTL ? <ArrowLeft className="w-3.5 h-3.5 mr-1" /> : <ArrowRight className="w-3.5 h-3.5 ml-1" />}
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="relative z-10 max-w-6xl w-full mx-auto py-8 sm:py-12 flex flex-col items-center flex-grow">
        
        {/* Slogan */}
        <div className="text-center space-y-4 max-w-3xl mb-12 sm:mb-16">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-500/5 border border-indigo-500/15 rounded-full"
          >
            <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="text-[10px] font-extrabold tracking-wider uppercase text-indigo-300 font-mono">
              {isRTL ? 'منظومة استخبارات مبيعات فائقة الدقة' : 'Corporate Forecast & Integrity Suite'}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight font-display text-white leading-tight"
          >
            {isRTL ? (
              <>
                التحكّم الكامل في <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent font-black">بيانات مبيعاتك</span> بنماذج التنبؤ الذكي
              </>
            ) : (
              <>
                Elevate your <span className="bg-gradient-to-r from-indigo-400 via-indigo-300 to-indigo-200 bg-clip-text text-transparent font-black">Sales Operations</span> with AI Analytics
              </>
            )}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-xs sm:text-sm text-slate-400 font-light leading-relaxed max-w-2xl mx-auto"
          >
            {isRTL 
              ? 'تجمع منصة SniperAI بين دقة التنبؤ المالي للـ 30 يوماً القادمة، والكشف الفوري عن المعاملات والأنشطة الشاذة، لتزويد متخذي القرار الاستثماري برؤية واضحة وموثوقة.'
              : 'SniperAI integrates advanced machine learning projection curves, multi-tenant database systems, and active fraud/outlier diagnostics into a premium executive workspace.'}
          </motion.p>
        </div>

        {/* ==================== Live Interactive Charts & Operations Simulation Section ==================== */}
        <div className="w-full max-w-5xl mb-14">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-900 flex-grow" />
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 font-mono flex items-center gap-2">
              <LineChart className="w-4 h-4 text-indigo-400" />
              <span>{isRTL ? 'لوحة المحاكاة والعمليات التشغيلية الحية' : 'Live Operations & Simulation Center'}</span>
            </h2>
            <div className="h-px bg-gradient-to-l from-transparent to-slate-900 flex-grow" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
            
            {/* Box 1: Interactive AI Forecast Simulation Chart (12 col on small, 7 on large) */}
            <div className="lg:col-span-7 bg-slate-950/80 border border-slate-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
              
              <div>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="text-start">
                    <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono">
                      {isRTL ? 'النمذجة التنبؤية الذكية' : 'AI FORECASTING ENGINE'}
                    </span>
                    <h3 className="text-sm sm:text-base font-bold text-white mt-0.5">
                      {isRTL ? 'محاكاة توقعات الطلب والمبيعات للـ 30 يوماً القادمة' : '30-Day Predictive Sales & Demand curves'}
                    </h3>
                  </div>

                  {/* Toggle Scenario Buttons */}
                  <div className="flex items-center gap-1 bg-slate-900/60 p-1 border border-slate-800 rounded-xl self-start">
                    {(['optimistic', 'normal', 'conservative'] as const).map((scen) => (
                      <button
                        key={scen}
                        type="button"
                        onClick={() => setActiveScenario(scen)}
                        className={`px-2.5 py-1 text-[10px] font-bold rounded-lg transition-all capitalize cursor-pointer ${
                          activeScenario === scen 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {isRTL 
                          ? (scen === 'optimistic' ? 'متفائل' : scen === 'normal' ? 'متوسط' : 'تحفظي')
                          : scen}
                      </button>
                    ))}
                  </div>
                </div>

                <p className="text-[11px] text-slate-400 font-light text-start mb-6">
                  {isRTL 
                    ? 'يقوم النظام برصد سلوكيات الشراء السابقة، العوامل الموسمية، والربط مع Odoo لإنتاج ثلاثة سيناريوهات بدقة متناهية.'
                    : 'Analyze seasonal behavior, channel backlogs, and transactional telemetry to output actionable curves.'}
                </p>
              </div>

              {/* Breathtaking Customized Interactive SVG Chart */}
              <div className="relative bg-[#070b16] border border-slate-900/80 rounded-xl p-4 h-52 flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                  <div className="w-full border-b border-dashed border-slate-800"></div>
                  <div className="w-full border-b border-dashed border-slate-800"></div>
                  <div className="w-full border-b border-dashed border-slate-800"></div>
                  <div className="w-full border-b border-dashed border-slate-800"></div>
                </div>

                <svg className="w-full h-full" viewBox="0 0 480 160" preserveAspectRatio="none">
                  {/* Gradients */}
                  <defs>
                    <linearGradient id="chartGlow" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Shaded Area */}
                  <path
                    d={getSvgAreaPath(chartPoints[activeScenario])}
                    fill="url(#chartGlow)"
                    className="transition-all duration-700 ease-in-out"
                  />

                  {/* Line Chart Path */}
                  <path
                    d={getSvgPath(chartPoints[activeScenario])}
                    fill="none"
                    stroke="#818cf8"
                    strokeWidth="3"
                    strokeLinecap="round"
                    className="transition-all duration-700 ease-in-out"
                  />

                  {/* Interactive Dot indicators on the line */}
                  {chartPoints[activeScenario].map((pt, index) => (
                    <circle
                      key={index}
                      cx={index * 40 + 20}
                      cy={150 - pt}
                      r="4"
                      className="fill-indigo-400 stroke-slate-950 stroke-[2px] transition-all duration-700 ease-in-out"
                    />
                  ))}
                </svg>

                {/* Micro Chart Info overlay */}
                <div className="absolute top-3 left-3 bg-slate-950/90 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[9px] font-mono text-indigo-400">
                  <span>CONFIDENCE LIMITS: 98.4%</span>
                </div>
                <div className="absolute bottom-3 right-3 bg-slate-950/90 border border-slate-800/80 rounded-lg px-2.5 py-1 text-[9px] font-mono text-emerald-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  <span>{isRTL ? 'تنبؤ محدث' : 'LIVE FORECAST'}</span>
                </div>
              </div>

              {/* Chart Legend */}
              <div className="flex items-center justify-between mt-4 text-[10px] font-mono text-slate-500">
                <span>{isRTL ? 'الأسبوع ١' : 'Wk 1'}</span>
                <span>{isRTL ? 'الأسبوع ٢' : 'Wk 2'}</span>
                <span>{isRTL ? 'الأسبوع ٣' : 'Wk 3'}</span>
                <span>{isRTL ? 'الأسبوع ٤ (مستهدف)' : 'Wk 4 (Forecast)'}</span>
              </div>
            </div>

            {/* Box 2: System Live Operations Simulation (5 on large) */}
            <div className="lg:col-span-5 bg-slate-950/80 border border-slate-900 rounded-2xl p-5 sm:p-6 flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>

              <div className="space-y-3">
                <div className="text-start">
                  <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest font-mono flex items-center gap-1.5">
                    <Database className="w-3.5 h-3.5" />
                    <span>{isRTL ? 'محاكاة دورة التدقيق الفوري' : 'OPERATIONAL PIPELINE SIMULATOR'}</span>
                  </span>
                  <h3 className="text-sm sm:text-base font-bold text-white mt-1">
                    {isRTL ? 'خطوات رصد العمليات ومعالجتها ذكياً' : 'Live Anomaly Detection Pipeline'}
                  </h3>
                  <p className="text-[11px] text-slate-400 font-light mt-1">
                    {isRTL 
                      ? 'اضغط على زر البدء لترى كيف يقوم النظام بسحب المعاملات، اكتشاف الأخطاء تلقائياً، وإشراك Gemini لتحليل المشكلة.'
                      : 'Click Play to simulate active CRM synchronization, fraud scanning, and real-time Gemini AI auditing.'}
                  </p>
                </div>

                {/* Simulation Logs display board */}
                <div className="bg-[#070b16] border border-slate-900/80 rounded-xl p-3 h-48 overflow-y-auto font-mono text-[10px] text-slate-300 space-y-2 text-start flex flex-col justify-start">
                  {simulationLogs.length === 0 ? (
                    <div className="my-auto text-center text-slate-500 italic space-y-1">
                      <p>{isRTL ? 'انقر على زر البدء أدناه لبدء دورة المحاكاة' : 'Click the button below to start'}</p>
                    </div>
                  ) : (
                    simulationLogs.map((log, idx) => {
                      if (!log) return null;
                      const isAlert = log.includes('⚠️') || log.includes('Alert:');
                      const isSuccess = log.includes('✅');
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -5 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`p-1.5 rounded-lg border leading-relaxed ${
                            isAlert 
                              ? 'bg-amber-500/5 border-amber-500/20 text-amber-300' 
                              : isSuccess 
                                ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300' 
                                : 'bg-slate-900/40 border-slate-800/60 text-slate-300'
                          }`}
                        >
                          {log}
                        </motion.div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Start Simulation Control Button */}
              <div className="mt-4 pt-4 border-t border-slate-900">
                <button
                  type="button"
                  onClick={startSimulation}
                  disabled={isSimulating}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
                    isSimulating 
                      ? 'bg-slate-900 text-slate-500 border border-slate-800' 
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/40 active:scale-[0.98]'
                  }`}
                >
                  {isSimulating ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isRTL ? 'جاري التدقيق والمعالجة...' : 'Analyzing Operational Telemetry...'}</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{isRTL ? 'بدء محاكاة رصد عملية شاذة' : 'Run Real-time Audit Simulation'}</span>
                    </>
                  )}
                </button>
              </div>

            </div>

          </div>
        </div>

        {/* Section Title 2: System Core Features (ميزات النظام) */}
        <div className="w-full max-w-5xl mb-14 sm:mb-20">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-900 flex-grow" />
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 font-mono flex items-center gap-2">
              <Star className="w-4 h-4 text-indigo-400" />
              <span>{isRTL ? 'ميزات النظام الأساسية' : 'System Core Features'}</span>
            </h2>
            <div className="h-px bg-gradient-to-l from-transparent to-slate-900 flex-grow" />
          </div>

          {/* Dynamic Marketing Feature Showcase Grid (Bento Style) - Highly Color Coordinated */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {features.map((feat, idx) => {
              const Icon = feat.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.1 + idx * 0.08 }}
                  whileHover={{ y: -2, transition: { duration: 0.2 } }}
                  className="bg-slate-950/80 border border-slate-900 hover:border-indigo-500/20 p-5 rounded-2xl flex gap-4 transition-all duration-300 relative overflow-hidden group select-none"
                >
                  {/* Decorative Hover Glow */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none group-hover:bg-indigo-500/10 transition-all duration-300"></div>

                  <div className={`p-3 rounded-xl ${feat.bg} ${feat.color} border ${feat.border} shrink-0 h-12 w-12 flex items-center justify-center`}>
                    <Icon className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="space-y-1 text-start">
                    <h3 className="text-xs sm:text-sm font-bold text-white tracking-wide">
                      {isRTL ? feat.titleAr : feat.titleEn}
                    </h3>
                    <p className="text-[10px] sm:text-[11.5px] text-slate-400 font-light leading-relaxed">
                      {isRTL ? feat.descAr : feat.descEn}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Section Title 3: Pricing & Subscriptions (خطط الاشتراك) */}
        <div className="w-full max-w-5xl mb-12">
          <div className="flex items-center gap-3 mb-8">
            <div className="h-px bg-gradient-to-r from-transparent to-slate-900 flex-grow" />
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-indigo-400 font-mono flex items-center gap-2">
              <Zap className="w-4 h-4 text-indigo-400 animate-pulse" />
              <span>{isRTL ? 'خطط وباقات الاشتراك المرنة' : 'Subscription & Pricing Models'}</span>
            </h2>
            <div className="h-px bg-gradient-to-l from-transparent to-slate-900 flex-grow" />
          </div>

          {/* Pricing Toggle (Monthly vs Yearly) - Highly elegant design */}
          <div className="flex items-center justify-center gap-3 mb-10">
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
              <span className="text-[9px] font-bold bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full">
                {isRTL ? 'توفير ٢٠٪' : 'Save 20%'}
              </span>
            </span>
          </div>

          {/* Subscription Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {pricingPlans.map((plan) => {
              const PlanIcon = plan.icon;
              const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
              const featuresList = isRTL ? plan.featuresAr : plan.featuresEn;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.2 }}
                  className={`border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 relative ${plan.borderClass} ${plan.bgClass}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-600 text-white text-[9px] font-extrabold tracking-widest uppercase px-3 py-1 rounded-full border border-indigo-500 shadow-md shadow-indigo-950/40">
                      {isRTL ? 'الأكثر مبيعاً' : 'Most Popular'}
                    </div>
                  )}

                  <div className="space-y-4">
                    {/* Header */}
                    <div className="flex justify-between items-start gap-2">
                      <div>
                        <h3 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                          {isRTL ? plan.nameAr : plan.nameEn}
                        </h3>
                      </div>
                      <div className={`p-2 rounded-lg bg-slate-900 border border-slate-800 ${plan.color}`}>
                        <PlanIcon className="w-4 h-4" />
                      </div>
                    </div>

                    {/* Price */}
                    <div className="py-2 text-start">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl sm:text-3xl font-extrabold text-white font-mono">
                          ${price}
                        </span>
                        <span className="text-xs text-slate-400">
                          / {isRTL ? 'شهرياً' : 'month'}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        {price === 0 
                          ? (isRTL ? 'مجاني بالكامل للشركات الفردية' : 'Completely free for individual developers')
                          : (billingCycle === 'yearly' 
                            ? (isRTL ? `يُدفع سنوياً ($${price * 12})` : `Billed annually ($${price * 12})`)
                            : (isRTL ? 'يُدفع شهرياً، مرونة إلغاء كاملة' : 'Billed monthly, cancel anytime'))}
                      </p>
                    </div>

                    {/* Features List */}
                    <ul className="space-y-3 pt-4 border-t border-slate-900 text-start">
                      {featuresList.map((feat, fIdx) => (
                        <li key={fIdx} className="flex items-start gap-2 text-[10px] sm:text-[11px] text-slate-300 leading-normal">
                          <Check className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Call to Action Inside Plan */}
                  <div className="pt-6 mt-6 border-t border-slate-900">
                    <button
                      type="button"
                      onClick={onFinish}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer flex items-center justify-center gap-1.5 ${
                        plan.popular
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-950/30 active:scale-[0.98]'
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800/80'
                      }`}
                    >
                      <span>{isRTL ? 'ابدأ مع هذه الباقة' : 'Choose Plan & Launch'}</span>
                      {isRTL ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>

      </main>

      {/* Bottom Loading / Action Control Panel */}
      <footer className="relative z-10 max-w-3xl w-full mx-auto border border-slate-900 bg-slate-950/80 backdrop-blur-md rounded-2xl p-5 sm:p-6 mb-4">
        <AnimatePresence mode="wait">
          {progress < 100 ? (
            <motion.div 
              key="loader"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {/* Progress Labels */}
              <div className="flex justify-between items-center text-[11px] font-medium text-slate-400 font-mono">
                <span className="animate-pulse text-start">{loadingText}</span>
                <span className="text-indigo-400 font-bold text-xs">{progress}%</span>
              </div>

              {/* High-end loading bar */}
              <div className="w-full h-1.5 bg-slate-900 border border-slate-800 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${progress}%` }}
                  transition={{ ease: 'easeOut' }}
                />
              </div>

              <p className="text-[9px] text-slate-500 font-light text-center">
                {isRTL 
                  ? 'يرجى الانتظار بينما نقوم بمزامنة البنية التحتية وقنوات البيانات الآمنة لشركتك...' 
                  : 'Please hold as we configure secure TLS channels and initialize live prediction grids...'}
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="launch"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col sm:flex-row items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 text-start">
                <div className="p-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-indigo-400 animate-bounce" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">
                    {isRTL ? 'المنصة جاهزة للتشغيل الاستراتيجي' : 'Strategic Workspace Fully Synced'}
                  </h4>
                  <p className="text-[10px] text-slate-400 font-light mt-0.5">
                    {isRTL 
                      ? 'تم تحميل لوحة قيادة SniperAI وموديول التنبؤ الذكي بنجاح.' 
                      : 'AI prediction and core ledger layers initialized successfully.'}
                  </p>
                </div>
              </div>

              {/* Enter Button CTA */}
              <button
                type="button"
                onClick={onFinish}
                className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white py-2.5 px-6 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-indigo-950/40 shrink-0"
              >
                <span>{isRTL ? 'دخول لوحة التحكم' : 'Launch Workspace'}</span>
                {isRTL ? <ArrowLeft className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </footer>

      {/* Humble Footer Info */}
      <div className="relative z-10 max-w-7xl w-full mx-auto text-center border-t border-slate-900/60 pt-4">
        <p className="text-[10px] text-slate-500 font-light">
          {isRTL 
            ? '© ٢٠٢٦ SniperAI. جميع الحقوق محفوظة لشركة القناص للذكاء الاصطناعي وتقنيات التنبؤ المالي.' 
            : '© 2026 SniperAI. All rights reserved. Secured corporate analytical system node.'}
        </p>
      </div>
    </div>
  );
}
