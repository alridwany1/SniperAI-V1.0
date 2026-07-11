import React from 'react';
import { MetricSummary, Tenant } from '../types';
import { DollarSign, Percent, ShoppingBag, TrendingUp, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { getCurrencySymbol } from '../utils/currency';
import AnimatedCounter from './AnimatedCounter';
import { motion, AnimatePresence } from 'motion/react';

interface KPICardsProps {
  summary: MetricSummary;
  activeTenant: Tenant;
  language: Language;
}

interface SparklineProps {
  data: number[];
  color: string;
  language: Language;
}

function Sparkline({ data, color, language }: SparklineProps) {
  if (!data || data.length === 0) return null;
  
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min;
  
  const width = 140;
  const height = 24;
  const padding = 2;
  
  const points = data.map((val, index) => {
    const x = (index / (data.length - 1)) * (width - padding * 2) + padding;
    const y = range > 0 
      ? height - ((val - min) / range) * (height - padding * 2) - padding
      : height / 2;
    return { x, y };
  });
  
  const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaData = points.length > 0
    ? `${pathData} L ${points[points.length - 1].x} ${height} L ${points[0].x} ${height} Z`
    : '';

  const gradientId = React.useId().replace(/:/g, '-');

  return (
    <div className="w-full flex flex-col mt-2.5 mb-1.5" id="sparkline-container">
      <div className="w-full h-7">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full" preserveAspectRatio="none">
          <defs>
            <linearGradient id={`sparkline-grad-${gradientId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity="0.25" />
              <stop offset="100%" stopColor={color} stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {areaData && (
            <path
              d={areaData}
              fill={`url(#sparkline-grad-${gradientId})`}
            />
          )}
          <path
            d={pathData}
            fill="none"
            stroke={color}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="flex justify-between items-center text-[8px] text-slate-500 font-mono mt-1 select-none">
        <span>{language === 'ar' ? 'منذ ٧ أيام' : '7d ago'}</span>
        <span>{language === 'ar' ? 'اليوم' : 'today'}</span>
      </div>
    </div>
  );
}

export default function KPICards({ summary, activeTenant, language }: KPICardsProps) {
  const { totalRevenue, totalCost, profit, profitMargin, averageOrderValue, anomalies } = summary;
  const t = translations[language];
  const symbol = getCurrencySymbol(activeTenant.currency);

  // Set colors based on active tenant accent mapping
  let accentColorClass = 'text-indigo-400';
  let gradientClass = 'from-indigo-600/10 to-transparent border-indigo-900/40';
  let brandColor = '#6366f1'; // Indigo

  if (activeTenant.accentColor === 'rose') {
    accentColorClass = 'text-rose-400';
    gradientClass = 'from-rose-600/10 to-transparent border-rose-900/40';
    brandColor = '#f43f5e';
  } else if (activeTenant.accentColor === 'emerald') {
    accentColorClass = 'text-emerald-400';
    gradientClass = 'from-emerald-600/10 to-transparent border-emerald-900/40';
    brandColor = '#10b981';
  }

  // Cards definitions
  const cards = [
    {
      id: 'kpi-revenue',
      label: t.grossRevenue,
      value: totalRevenue,
      formatter: (val: number) => `${symbol}${val.toLocaleString()}`,
      trend: summary.trends?.revenue || [],
      color: brandColor,
      status: language === 'ar' ? '↑ نمو مستقر' : '↑ Healthy',
      statusDesc: language === 'ar' ? 'معدل المعاملات' : 'historical baseline',
      statusColor: 'text-emerald-400',
      icon: <DollarSign className="w-4 h-4" />,
      iconColorClass: accentColorClass,
      bgGradient: gradientClass,
    },
    {
      id: 'kpi-profit',
      label: t.operatingProfit,
      value: profit,
      formatter: (val: number) => `${symbol}${val.toLocaleString()}`,
      trend: summary.trends?.profit || [],
      color: '#2dd4bf',
      status: t.profitSubtitle,
      statusDesc: '',
      statusColor: 'text-teal-400',
      icon: <TrendingUp className="w-4 h-4" />,
      iconColorClass: 'text-teal-400',
      bgGradient: gradientClass,
    },
    {
      id: 'kpi-margin',
      label: t.operationalMargin,
      value: profitMargin,
      formatter: (val: number) => `${val}%`,
      trend: summary.trends?.margin || [],
      color: '#38bdf8',
      progressBar: true,
      status: '',
      statusDesc: '',
      statusColor: 'text-sky-400',
      icon: <Percent className="w-4 h-4" />,
      iconColorClass: 'text-sky-400',
      bgGradient: gradientClass,
    },
    {
      id: 'kpi-aov',
      label: t.avgOrderValue,
      value: averageOrderValue,
      formatter: (val: number) => `${symbol}${val.toLocaleString()}`,
      trend: summary.trends?.aov || [],
      color: '#a78bfa',
      status: t.aovSubtitle,
      statusDesc: '',
      statusColor: 'text-violet-400',
      icon: <ShoppingBag className="w-4 h-4" />,
      iconColorClass: 'text-violet-400',
      bgGradient: gradientClass,
    },
    {
      id: 'kpi-anomalies',
      label: t.activeAlerts,
      value: anomalies.length,
      formatter: (val: number) => val.toString(),
      trend: summary.trends?.anomalies || [],
      color: '#fbbf24',
      status: anomalies.length > 0 
        ? (language === 'ar' ? 'تحليل شاذ نشط' : 'AI analysis flagged') 
        : (language === 'ar' ? 'حالة مستقرة' : 'Standard stability'),
      statusDesc: '',
      statusColor: anomalies.length > 0 ? 'text-amber-400' : 'text-slate-400',
      icon: <AlertTriangle className="w-4 h-4" />,
      iconColorClass: anomalies.length > 0 ? 'text-amber-400 animate-pulse' : 'text-slate-500',
      bgGradient: 'from-amber-600/5 to-transparent border-slate-800/80',
    }
  ];

  // Gesture swiping state for mobile view
  const [activeIndex, setActiveIndex] = React.useState(0);
  const [slideDirection, setSlideDirection] = React.useState(1);
  const [touchStartX, setTouchStartX] = React.useState<number | null>(null);
  const [touchEndX, setTouchEndX] = React.useState<number | null>(null);

  const minSwipeDistance = 50;

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchEndX(null);
    setTouchStartX(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEndX(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (touchStartX === null || touchEndX === null) return;
    const distance = touchStartX - touchEndX;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    const isRtl = language === 'ar';

    if (isLeftSwipe) {
      // Swiped left
      setSlideDirection(isRtl ? -1 : 1);
      setActiveIndex((prev) => {
        if (isRtl) {
          return prev > 0 ? prev - 1 : 4;
        } else {
          return prev < 4 ? prev + 1 : 0;
        }
      });
    } else if (isRightSwipe) {
      // Swiped right
      setSlideDirection(isRtl ? 1 : -1);
      setActiveIndex((prev) => {
        if (isRtl) {
          return prev < 4 ? prev + 1 : 0;
        } else {
          return prev > 0 ? prev - 1 : 4;
        }
      });
    }
  };

  const nextCard = () => {
    setSlideDirection(1);
    setActiveIndex((prev) => (prev < 4 ? prev + 1 : 0));
  };

  const prevCard = () => {
    setSlideDirection(-1);
    setActiveIndex((prev) => (prev > 0 ? prev - 1 : 4));
  };

  // Motion variants for slide transition
  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 200 : -200,
      opacity: 0,
      scale: 0.96
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 200 : -200,
      opacity: 0,
      scale: 0.96,
      transition: {
        x: { type: 'spring' as const, stiffness: 300, damping: 30 },
        opacity: { duration: 0.2 },
        scale: { duration: 0.2 }
      }
    })
  };

  const activeCard = cards[activeIndex];

  return (
    <div id="kpi-cards-section" className="mb-6">
      {/* Mobile Swipeable View */}
      <div 
        id="kpi-cards-mobile-carousel" 
        className="md:hidden w-full flex flex-col space-y-3"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="relative overflow-hidden min-h-[190px] flex items-stretch">
          <AnimatePresence initial={false} custom={slideDirection} mode="wait">
            <motion.div
              key={activeIndex}
              custom={slideDirection}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              id={activeCard.id}
              className={`w-full bg-slate-900/40 backdrop-blur border rounded-2xl p-5 flex flex-col justify-between shadow-lg bg-gradient-to-br ${activeCard.bgGradient}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-start">{activeCard.label}</span>
                <div className={`p-2 rounded-lg bg-slate-950/80 ${activeCard.iconColorClass}`}>
                  {activeCard.icon}
                </div>
              </div>
              <div>
                <h3 className="text-2xl font-bold font-display text-white text-start">
                  <AnimatedCounter value={activeCard.value} formatter={activeCard.formatter} />
                </h3>
                <Sparkline data={activeCard.trend} color={activeCard.color} language={language} />
                {activeCard.progressBar ? (
                  <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3">
                    <div 
                      className="bg-sky-400 h-1.5 rounded-full transition-all duration-500" 
                      style={{ width: `${Math.min(100, Math.max(0, activeCard.value))}%` }}
                    ></div>
                  </div>
                ) : (
                  <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 font-light text-start">
                    <span className={`${activeCard.statusColor} font-medium`}>{activeCard.status}</span>
                    {activeCard.statusDesc && <span>{activeCard.statusDesc}</span>}
                  </p>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Carousel controls & indicators */}
        <div className="flex items-center justify-between px-2 pt-1 select-none">
          <button
            type="button"
            onClick={prevCard}
            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Previous metric"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Dots indicators */}
          <div className="flex items-center gap-1.5">
            {cards.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setSlideDirection(idx > activeIndex ? 1 : -1);
                  setActiveIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  activeIndex === idx ? 'w-5 bg-indigo-500' : 'w-1.5 bg-slate-800'
                }`}
                aria-label={`Go to metric ${idx + 1}`}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={nextCard}
            className="p-1.5 rounded-lg bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            aria-label="Next metric"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Swipe gesture help string */}
        <div className="flex items-center justify-between text-[9px] text-slate-500 font-mono px-2">
          <span className="animate-pulse">
            {language === 'ar' ? '← اسحب لليسار أو اليمين لتصفح المؤشرات →' : '← Swipe left or right to switch metrics →'}
          </span>
          <span>{activeIndex + 1} / 5</span>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div id="kpi-cards-desktop-grid" className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-4">
        {cards.map((card) => (
          <div 
            key={card.id}
            id={card.id} 
            className={`bg-slate-900/40 backdrop-blur border rounded-2xl p-5 flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 shadow-lg bg-gradient-to-br ${card.bgGradient}`}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider text-start">{card.label}</span>
              <div className={`p-2 rounded-lg bg-slate-950/80 ${card.iconColorClass}`}>
                {card.icon}
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-bold font-display text-white text-start">
                <AnimatedCounter value={card.value} formatter={card.formatter} />
              </h3>
              <Sparkline data={card.trend} color={card.color} language={language} />
              {card.progressBar ? (
                <div className="w-full bg-slate-950 rounded-full h-1.5 mt-3">
                  <div 
                    className="bg-sky-400 h-1.5 rounded-full transition-all duration-500" 
                    style={{ width: `${Math.min(100, Math.max(0, card.value))}%` }}
                  ></div>
                </div>
              ) : (
                <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1.5 font-light text-start">
                  <span className={`${card.statusColor} font-medium`}>{card.status}</span>
                  {card.statusDesc && <span>{card.statusDesc}</span>}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
