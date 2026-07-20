import React, { useState, useEffect } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from 'recharts';
import { ForecastRecord, Tenant } from '../types';
import { Sparkles, TrendingUp, HelpCircle, Eye, EyeOff, ZoomIn, Info, X, Loader2, Calendar, SlidersHorizontal } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { getCurrencySymbol } from '../utils/currency';
import { motion, AnimatePresence } from 'motion/react';

interface ChartPoint {
  date: string;
  revenue?: number;
  cost?: number;
  forecast?: number;
  lowerBound?: number;
  upperBound?: number;
  forecastRange?: [number, number];
  isAnomaly?: boolean;
  anomalyReason?: string;
}

interface SalesChartProps {
  historicalData: { date: string; revenue: number; cost: number; isAnomaly: boolean; anomalyReason?: string }[];
  forecastData: ForecastRecord[];
  activeTenant: Tenant;
  forecastLoading: boolean;
  onTriggerForecast: (modelType: string) => void;
  forecastAnalysis: string;
  language: Language;
}

export default function SalesChart({
  historicalData,
  forecastData,
  activeTenant,
  forecastLoading,
  onTriggerForecast,
  forecastAnalysis,
  language,
}: SalesChartProps) {
  const [showCost, setShowCost] = useState(true);
  const [showBounds, setShowBounds] = useState(true);
  const [zoom30Days, setZoom30Days] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>('regression');
  const [activeAnomalyTab, setActiveAnomalyTab] = useState<'summary' | 'metrics' | 'action'>('summary');
  const symbol = getCurrencySymbol(activeTenant.currency);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalTransactions, setModalTransactions] = useState<any[]>([]);
  const [modalLoading, setModalLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Comparison Mode state management
  const [compareMode, setCompareMode] = useState<'none' | 'products' | 'dates'>('none');
  const [compareLoading, setCompareLoading] = useState(false);

  // For Product comparison:
  const [productA, setProductA] = useState<string>('');
  const [productB, setProductB] = useState<string>('');
  const [prodChartDataA, setProdChartDataA] = useState<any[]>([]);
  const [prodChartDataB, setProdChartDataB] = useState<any[]>([]);

  // For Date Range comparison:
  const [startDateA, setStartDateA] = useState<string>('');
  const [endDateA, setEndDateA] = useState<string>('');
  const [startDateB, setStartDateB] = useState<string>('');
  const [endDateB, setEndDateB] = useState<string>('');
  const [dateChartDataA, setDateChartDataA] = useState<any[]>([]);
  const [dateChartDataB, setDateChartDataB] = useState<any[]>([]);

  let primaryColor = '#6366f1'; // Indigo
  if (activeTenant.accentColor === 'rose') primaryColor = '#f43f5e';
  else if (activeTenant.accentColor === 'emerald') primaryColor = '#10b981';
  else if (activeTenant.accentColor) primaryColor = activeTenant.accentColor;

  // Helper to calculate prior period of same duration
  const getPriorPeriod = (startStr: string, endStr: string) => {
    try {
      const start = new Date(startStr);
      const end = new Date(endStr);
      const diffMs = end.getTime() - start.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24)) + 1;
      
      const startB = new Date(start);
      startB.setDate(start.getDate() - diffDays);
      const endB = new Date(start);
      endB.setDate(start.getDate() - 1);
      
      const formatDate = (d: Date) => {
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      return {
        start: formatDate(startB),
        end: formatDate(endB)
      };
    } catch (e) {
      return { start: "2026-01-01", end: "2026-05-31" };
    }
  };

  // Pre-fill comparison settings when tenant or historicalData is available
  useEffect(() => {
    if (activeTenant && activeTenant.products && activeTenant.products.length > 0) {
      if (!productA) setProductA(activeTenant.products[0].name);
      if (!productB) {
        setProductB(activeTenant.products.length > 1 ? activeTenant.products[1].name : 'All');
      }
    }

    if (historicalData && historicalData.length > 0) {
      const firstDate = historicalData[0].date;
      const lastDate = historicalData[historicalData.length - 1].date;
      if (!startDateA) setStartDateA(firstDate);
      if (!endDateA) setEndDateA(lastDate);
      
      const prior = getPriorPeriod(firstDate, lastDate);
      if (!startDateB) setStartDateB(prior.start);
      if (!endDateB) setEndDateB(prior.end);
    }
  }, [historicalData, activeTenant]);

  // Load comparison data from backend
  useEffect(() => {
    if (compareMode === 'none') return;

    let isMounted = true;
    const fetchCompareData = async () => {
      setCompareLoading(true);
      try {
        if (compareMode === 'products') {
          const resA = await fetch('/api/dashboard/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: activeTenant.id,
              campaign: 'All',
              product: productA,
              startDate: historicalData[0]?.date || '2026-01-01',
              endDate: historicalData[historicalData.length - 1]?.date || '2026-07-03'
            })
          });
          const dataA = await resA.json();

          const resB = await fetch('/api/dashboard/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: activeTenant.id,
              campaign: 'All',
              product: productB,
              startDate: historicalData[0]?.date || '2026-01-01',
              endDate: historicalData[historicalData.length - 1]?.date || '2026-07-03'
            })
          });
          const dataB = await resB.json();

          if (isMounted) {
            setProdChartDataA(dataA.chartData || []);
            setProdChartDataB(dataB.chartData || []);
          }
        } else if (compareMode === 'dates') {
          const resA = await fetch('/api/dashboard/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: activeTenant.id,
              campaign: 'All',
              product: 'All',
              startDate: startDateA,
              endDate: endDateA
            })
          });
          const dataA = await resA.json();

          const resB = await fetch('/api/dashboard/metrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              tenantId: activeTenant.id,
              campaign: 'All',
              product: 'All',
              startDate: startDateB,
              endDate: endDateB
            })
          });
          const dataB = await resB.json();

          if (isMounted) {
            setDateChartDataA(dataA.chartData || []);
            setDateChartDataB(dataB.chartData || []);
          }
        }
      } catch (err) {
        console.error("Error loading comparison metrics:", err);
      } finally {
        if (isMounted) setCompareLoading(false);
      }
    };

    fetchCompareData();
    return () => {
      isMounted = false;
    };
  }, [compareMode, productA, productB, startDateA, endDateA, startDateB, endDateB, activeTenant, historicalData]);

  // Merge products by date
  const mergeByDate = (dataA: any[], dataB: any[]) => {
    const map: Record<string, { date: string; revenueA: number; costA: number; revenueB: number; costB: number }> = {};
    dataA.forEach(item => {
      map[item.date] = { date: item.date, revenueA: item.revenue || 0, costA: item.cost || 0, revenueB: 0, costB: 0 };
    });
    dataB.forEach(item => {
      if (!map[item.date]) {
        map[item.date] = { date: item.date, revenueA: 0, costA: 0, revenueB: item.revenue || 0, costB: item.cost || 0 };
      } else {
        map[item.date].revenueB = item.revenue || 0;
        map[item.date].costB = item.cost || 0;
      }
    });
    return Object.values(map).sort((a, b) => a.date.localeCompare(b.date));
  };

  // Merge dates by day index
  const mergeByDayIndex = (dataA: any[], dataB: any[]) => {
    const merged: any[] = [];
    const maxLen = Math.max(dataA.length, dataB.length);
    for (let i = 0; i < maxLen; i++) {
      const itemA = dataA[i];
      const itemB = dataB[i];
      merged.push({
        dayIndex: i + 1,
        label: `${language === 'ar' ? 'اليوم' : 'Day'} ${i + 1}`,
        dateA: itemA ? itemA.date : null,
        revenueA: itemA ? itemA.revenue : 0,
        costA: itemA ? itemA.cost : 0,
        dateB: itemB ? itemB.date : null,
        revenueB: itemB ? itemB.revenue : 0,
        costB: itemB ? itemB.cost : 0,
      });
    }
    return merged;
  };

  const productMergedData = compareMode === 'products' ? mergeByDate(prodChartDataA, prodChartDataB) : [];
  const dateMergedData = compareMode === 'dates' ? mergeByDayIndex(dateChartDataA, dateChartDataB) : [];

  // Calculate comparison benchmarking stats
  const calculateComparisonStats = () => {
    if (compareMode === 'products') {
      const totalRevA = prodChartDataA.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalCostA = prodChartDataA.reduce((sum, item) => sum + (item.cost || 0), 0);
      const totalRevB = prodChartDataB.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalCostB = prodChartDataB.reduce((sum, item) => sum + (item.cost || 0), 0);

      const profitA = totalRevA - totalCostA;
      const profitB = totalRevB - totalCostB;

      const marginA = totalRevA > 0 ? (profitA / totalRevA) * 100 : 0;
      const marginB = totalRevB > 0 ? (profitB / totalRevB) * 100 : 0;

      const revenueDiffPct = totalRevA > 0 ? ((totalRevB - totalRevA) / totalRevA) * 100 : 0;

      return {
        totalRevA,
        totalRevB,
        profitA,
        profitB,
        marginA,
        marginB,
        revenueDiffPct,
        winner: totalRevB > totalRevA ? productB : productA,
        winnerPct: Math.abs(revenueDiffPct).toFixed(1)
      };
    } else if (compareMode === 'dates') {
      const totalRevA = dateChartDataA.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalCostA = dateChartDataA.reduce((sum, item) => sum + (item.cost || 0), 0);
      const totalRevB = dateChartDataB.reduce((sum, item) => sum + (item.revenue || 0), 0);
      const totalCostB = dateChartDataB.reduce((sum, item) => sum + (item.cost || 0), 0);

      const profitA = totalRevA - totalCostA;
      const profitB = totalRevB - totalCostB;

      const marginA = totalRevA > 0 ? (profitA / totalRevA) * 100 : 0;
      const marginB = totalRevB > 0 ? (profitB / totalRevB) * 100 : 0;

      const revenueDiffPct = totalRevB > 0 ? ((totalRevA - totalRevB) / totalRevB) * 100 : 0;

      return {
        totalRevA,
        totalRevB,
        profitA,
        profitB,
        marginA,
        marginB,
        revenueDiffPct,
        winner: totalRevA > totalRevB ? (language === 'ar' ? 'الفترة أ' : 'Range A') : (language === 'ar' ? 'الفترة ب' : 'Range B'),
        winnerPct: Math.abs(revenueDiffPct).toFixed(1)
      };
    }
    return null;
  };

  const compStats = calculateComparisonStats();

  const CustomComparisonTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const isRTL = language === 'ar';
      
      if (compareMode === 'products') {
        const data = payload[0].payload;
        const revA = data.revenueA || 0;
        const revB = data.revenueB || 0;
        const diff = revB - revA;
        const diffPct = revA > 0 ? (diff / revA) * 100 : 0;

        return (
          <div className="bg-slate-950/98 border border-slate-800 p-4 rounded-xl shadow-2xl w-72 sm:w-80 backdrop-blur-md select-none text-start">
            <p className="text-xs font-semibold text-slate-400 mb-2 font-mono">{data.date}</p>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                  <span className="truncate max-w-[150px]">{productA}</span>
                </span>
                <span className="text-xs font-bold text-white font-mono">{symbol}{revA.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                  <span className="truncate max-w-[150px]">{productB}</span>
                </span>
                <span className="text-xs font-bold text-emerald-300 font-mono">{symbol}{revB.toLocaleString()}</span>
              </div>
              <div className="pt-2 border-t border-slate-800 mt-2 text-[10px] flex items-center justify-between">
                <span className="text-slate-400">{isRTL ? 'التباين والفرق مبيعاً:' : 'Variance / Performance Gap:'}</span>
                <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diff >= 0 ? '+' : ''}{diffPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      } else if (compareMode === 'dates') {
        const data = payload[0].payload;
        const revA = data.revenueA || 0;
        const revB = data.revenueB || 0;
        const diff = revA - revB;
        const diffPct = revB > 0 ? (diff / revB) * 100 : 0;

        return (
          <div className="bg-slate-950/98 border border-slate-800 p-4 rounded-xl shadow-2xl w-72 sm:w-80 backdrop-blur-md select-none text-start">
            <p className="text-xs font-semibold text-slate-400 mb-2 font-mono">{data.label}</p>
            <div className="space-y-1.5">
              <div className="flex flex-col gap-0.5 border-b border-slate-900 pb-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                    <span>{isRTL ? 'الفترة أ:' : 'Range A:'}</span>
                  </span>
                  <span className="text-xs font-bold text-white font-mono">{symbol}{revA.toLocaleString()}</span>
                </div>
                {data.dateA && <span className="text-[9px] text-slate-500 font-mono ml-4">{data.dateA}</span>}
              </div>

              <div className="flex flex-col gap-0.5 pt-0.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>{isRTL ? 'الفترة ب:' : 'Range B:'}</span>
                  </span>
                  <span className="text-xs font-bold text-amber-300 font-mono">{symbol}{revB.toLocaleString()}</span>
                </div>
                {data.dateB && <span className="text-[9px] text-slate-500 font-mono ml-4">{data.dateB}</span>}
              </div>

              <div className="pt-2 border-t border-slate-800 mt-2 text-[10px] flex items-center justify-between">
                <span className="text-slate-400">{isRTL ? 'تغير الأداء المقارن:' : 'Relative Performance Diff:'}</span>
                <span className={`font-mono font-bold ${diff >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {diff >= 0 ? '+' : ''}{diffPct.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        );
      }
    }
    return null;
  };

  const handleChartClick = async (state: any) => {
    if (state && state.activeLabel) {
      const clickedDate = state.activeLabel;
      setSelectedDate(clickedDate);
      setIsModalOpen(true);
      setModalLoading(true);
      try {
        const response = await fetch('/api/dashboard/transactions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tenantId: activeTenant.id,
            date: clickedDate,
          }),
        });
        if (response.ok) {
          const resData = await response.json();
          setModalTransactions(resData.transactions || []);
        } else {
          setModalTransactions([]);
        }
      } catch (err) {
        console.error("Error fetching transaction details:", err);
        setModalTransactions([]);
      } finally {
        setModalLoading(false);
      }
    }
  };

  // Format historical + forecast data into a contiguous stream
  const mergedData: ChartPoint[] = [];

  // Slice to last 30 days of history if zoomed in
  const displayHistorical = zoom30Days ? historicalData.slice(-30) : historicalData;

  // Helper to parse and classify anomaly records with precise localized recommendations
  const getAnomalyDetails = (reason: string, revenue: number, cost: number, lang: Language) => {
    const r = reason.toLowerCase();
    let category = '';
    let severity = '';
    let color = '';
    let bgLight = '';
    let borderCol = '';
    let recommendations: string[] = [];

    if (r.includes('spike') || r.includes('surge') || r.includes('high') || r.includes('increase') || r.includes('ارتفاع') || r.includes('طفرة')) {
      category = lang === 'ar' ? 'طفرة في الإيرادات' : 'Revenue Surge';
      severity = lang === 'ar' ? 'مرتفع / إيجابي' : 'High / Positive';
      color = 'text-emerald-400';
      bgLight = 'bg-emerald-500/10';
      borderCol = 'border-emerald-500/30';
      recommendations = lang === 'ar' ? [
        'التحقق من حملات التسويق النشطة لتوثيق أسباب النجاح.',
        'توسيع مخزون المنتجات الأكثر مبيعاً لتلبية الطلب المستمر.',
        'تحسين ميزانية الإعلانات لزيادة استهداف العملاء المماثلين.',
        'مشاركة التقرير المالي مع الإدارة للتخطيط للربع القادم.'
      ] : [
        'Verify active marketing campaigns to document keys to success.',
        'Scale inventory of best-selling products to meet ongoing demand.',
        'Optimize ad budget allocation to double down on high-performing segments.',
        'Share the financial milestone with key stakeholders for quarterly planning.'
      ];
    } else if (r.includes('drop') || r.includes('low') || r.includes('decrease') || r.includes('dip') || r.includes('انخفاض') || r.includes('تراجع')) {
      category = lang === 'ar' ? 'انخفاض الإيرادات' : 'Revenue Dip';
      severity = lang === 'ar' ? 'مرتفع / حرج' : 'High / Critical';
      color = 'text-rose-400';
      bgLight = 'bg-rose-500/10';
      borderCol = 'border-rose-500/30';
      recommendations = lang === 'ar' ? [
        'مراجعة قنوات البيع للكشف عن أي توقف أو أعطال فنية.',
        'تحليل إشارات التخلي عن السلة أو تراجع رضا العملاء.',
        'إطلاق حملة تنشيطية سريعة أو تقديم عروض مخصصة.',
        'التحقق من صحة تغذية البيانات للأنظمة المحاسبية.'
      ] : [
        'Audit checkout tunnels and payment gateways for potential downtime.',
        'Analyze cart abandonment metrics or customer churn signals.',
        'Launch a time-sensitive re-engagement campaign with promo codes.',
        'Verify accounting pipelines and transaction sync logs for delays.'
      ];
    } else if (r.includes('cost') || r.includes('expense') || r.includes('overhead') || r.includes('تكلفة') || r.includes('مصاريف')) {
      category = lang === 'ar' ? 'طفرة في التكاليف' : 'Operating Cost Spike';
      severity = lang === 'ar' ? 'تحذير / انتباه' : 'Warning / Attention';
      color = 'text-amber-400';
      bgLight = 'bg-amber-500/10';
      borderCol = 'border-amber-500/30';
      recommendations = lang === 'ar' ? [
        'مراجعة فواتير الموردين للتأكد من عدم وجود رسوم خاطئة.',
        'تدقيق توزيع الموارد والتحقق من النفقات غير المتوقعة.',
        'إعادة التفاوض على شروط الدفع أو البحث عن بدائل.',
        'مراجعة الميزانية العامة للحد من الهدر المالي الفوري.'
      ] : [
        'Audit vendor invoices to identify any unauthorized or double charges.',
        'Verify resource allocations and look for unscheduled overhead costs.',
        'Re-negotiate credit terms or evaluate cost-effective supply alternatives.',
        'Enforce tight spend limits to contain the cost overruns immediately.'
      ];
    } else {
      category = lang === 'ar' ? 'انحراف تشغيلي' : 'Operational Outlier';
      severity = lang === 'ar' ? 'متوسط' : 'Moderate';
      color = 'text-violet-400';
      bgLight = 'bg-violet-500/10';
      borderCol = 'border-violet-500/30';
      recommendations = lang === 'ar' ? [
        'إجراء تسوية يدوية للمعاملات في هذا التاريخ المحدد.',
        'مراجعة سجلات التدقيق للكشف عن أي تعديلات جماعية.',
        'التحقق من تزامن البيانات بين المتجر وقاعدة البيانات.',
        'التواصل مع الدعم الفني لمراجعة سلامة الأنظمة.'
      ] : [
        'Perform a manual reconciliation of transactions for this specific date.',
        'Check system audit logs for bulk adjustments or administrative operations.',
        'Verify database integrity and data pipeline sync status.',
        'Contact system administrators to verify general infrastructure logs.'
      ];
    }

    const profit = revenue - cost;
    const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
    const devRatio = cost > 0 ? (revenue / cost) : 0;

    return {
      category,
      severity,
      color,
      bgLight,
      borderCol,
      recommendations,
      profit,
      margin,
      devRatio
    };
  };

  // 1. Add historical records
  displayHistorical.forEach(h => {
    mergedData.push({
      date: h.date,
      revenue: h.revenue,
      cost: h.cost,
      isAnomaly: h.isAnomaly,
      anomalyReason: h.anomalyReason,
    });
  });

  // 2. Add forecast records (carrying over the last historical point to avoid a gap)
  if (forecastData.length > 0 && displayHistorical.length > 0) {
    const lastHistory = displayHistorical[displayHistorical.length - 1];
    
    // Push an anchor point joining the lines
    mergedData.push({
      date: lastHistory.date,
      forecast: lastHistory.revenue,
      lowerBound: lastHistory.revenue,
      upperBound: lastHistory.revenue,
      forecastRange: [lastHistory.revenue, lastHistory.revenue],
    });

    forecastData.forEach(f => {
      mergedData.push({
        date: f.date,
        forecast: f.revenue,
        lowerBound: f.lowerBound,
        upperBound: f.upperBound,
        forecastRange: [f.lowerBound, f.upperBound],
      });
    });
  }

  // Custom Dot for anomalies
  const CustomAnomalyDot = (props: any) => {
    const { cx, cy, payload } = props;
    if (payload.isAnomaly) {
      return (
        <svg x={cx - 8} y={cy - 8} width={16} height={16} viewBox="0 0 16 16" fill="none" className="cursor-pointer">
          <circle cx={8} cy={8} r={6} fill="#f59e0b" stroke="#0f172a" strokeWidth={2} />
          <path d="M8 5V9M8 11H8.01" stroke="#0f172a" strokeWidth={1.5} strokeLinecap="round" />
        </svg>
      );
    }
    return null;
  };

  // Custom Tooltip component to handle historical, anomaly, and forecast parameters elegantly
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: ChartPoint = payload[0].payload;
      const isForecastingVal = data.forecast !== undefined && data.revenue === undefined;
      const isRTL = language === 'ar';

      const anomalyDetails = data.isAnomaly 
        ? getAnomalyDetails(data.anomalyReason || '', data.revenue || 0, data.cost || 0, language)
        : null;

      return (
        <div 
          className="bg-slate-950/98 border border-slate-800 p-4 rounded-xl shadow-2xl w-72 sm:w-80 backdrop-blur-md select-none transition-all duration-200"
          style={{ pointerEvents: 'auto' }}
        >
          <p className="text-xs font-semibold text-slate-400 mb-2 font-mono text-start">{data.date}</p>
          
          <div className="space-y-1.5">
            {data.revenue !== undefined && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                  <span>{isRTL ? 'الإيرادات الفعلية:' : 'Actual Revenue:'}</span>
                </span>
                <span className="text-xs font-bold text-white font-mono">{symbol}{data.revenue.toLocaleString()}</span>
              </div>
            )}

            {data.cost !== undefined && showCost && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>{isRTL ? 'تكلفة التشغيل:' : 'Operating Cost:'}</span>
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">{symbol}{data.cost.toLocaleString()}</span>
              </div>
            )}

            {data.forecast !== undefined && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{isRTL ? 'التنبؤ الذكي:' : 'AI Predicted:'}</span>
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{symbol}{data.forecast.toLocaleString()}</span>
              </div>
            )}

            {isForecastingVal && data.lowerBound !== undefined && data.upperBound !== undefined && showBounds && (
              <div className="pt-2 border-t border-slate-800 mt-2 text-[10px] text-slate-400 space-y-1 font-light">
                <div className="flex justify-between">
                  <span>{isRTL ? 'الحد الأقصى للثقة:' : 'Confidence Limit Max:'}</span>
                  <span className="font-mono text-emerald-500/80">{symbol}{data.upperBound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{isRTL ? 'الحد الأدنى للثقة:' : 'Confidence Limit Min:'}</span>
                  <span className="font-mono text-amber-500/80">{symbol}{data.lowerBound.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {data.isAnomaly && anomalyDetails && (
            <div className="mt-3.5 pt-3.5 border-t border-slate-800/80">
              {/* Tab Switcher */}
              <div className="flex bg-slate-900/90 rounded-lg p-0.5 border border-slate-800/80 mb-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAnomalyTab('summary');
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeAnomalyTab === 'summary'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Info className="w-3 h-3 shrink-0" />
                  <span>{isRTL ? 'الملخص' : 'Summary'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAnomalyTab('metrics');
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeAnomalyTab === 'metrics'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <TrendingUp className="w-3 h-3 shrink-0" />
                  <span>{isRTL ? 'المقاييس' : 'Metrics'}</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveAnomalyTab('action');
                  }}
                  className={`flex-1 py-1 px-1.5 rounded-md text-[10px] font-medium transition-all flex items-center justify-center gap-1 cursor-pointer ${
                    activeAnomalyTab === 'action'
                      ? 'bg-slate-800 text-white font-semibold shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Sparkles className="w-3 h-3 shrink-0" />
                  <span>{isRTL ? 'خطة العمل' : 'Action'}</span>
                </button>
              </div>

              {/* Tab Contents */}
              <AnimatePresence mode="wait">
                {activeAnomalyTab === 'summary' && (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-2 text-start"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">{isRTL ? 'تصنيف الحالة الشاذة:' : 'Anomaly Class:'}</span>
                      <span className={`text-[10px] font-semibold ${anomalyDetails.color} px-2 py-0.5 bg-slate-900 rounded border border-slate-800`}>
                        {anomalyDetails.category}
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-slate-400">{isRTL ? 'مستوى الخطورة:' : 'Severity Level:'}</span>
                      <span className={`text-[10px] font-bold ${anomalyDetails.color} animate-pulse`}>
                        {anomalyDetails.severity}
                      </span>
                    </div>
                    <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-2 mt-1">
                      <p className="text-[9.5px] text-amber-400 font-semibold mb-0.5 flex items-center gap-1">
                        <HelpCircle className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>{isRTL ? 'التفسير والسبب الرئيسي:' : 'Root Cause & Explanation:'}</span>
                      </p>
                      <p className="text-[10px] text-slate-300 leading-relaxed font-light">
                        {data.anomalyReason}
                      </p>
                    </div>
                  </motion.div>
                )}

                {activeAnomalyTab === 'metrics' && (
                  <motion.div
                    key="metrics"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-2 text-start"
                  >
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{isRTL ? 'صافي الربح الفعلي:' : 'Net Profit:'}</span>
                      <span className={`font-mono font-semibold ${anomalyDetails.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {anomalyDetails.profit >= 0 ? '+' : ''}{symbol}{anomalyDetails.profit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-slate-400">{isRTL ? 'هامش الربح التشغيلي:' : 'Operating Margin:'}</span>
                      <span className="font-mono font-semibold text-slate-300">
                        {anomalyDetails.margin.toFixed(1)}%
                      </span>
                    </div>

                    {/* Progress indicators */}
                    <div className="space-y-2 pt-1.5 border-t border-slate-800/60">
                      <div>
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>{isRTL ? 'مؤشر العائد إلى التكلفة' : 'Return-to-Cost Index'}</span>
                          <span className="font-mono text-slate-400">{anomalyDetails.devRatio.toFixed(2)}x</span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                          <div 
                            className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(anomalyDetails.devRatio * 20, 100)}%` }}
                          />
                        </div>
                      </div>

                      <div>
                        <div className="flex justify-between text-[9px] text-slate-500">
                          <span>{isRTL ? 'نسبة الانحراف الإجمالي' : 'Total Deviation Ratio'}</span>
                          <span className="font-mono text-slate-400">
                            {Math.min(Math.round(Math.abs((data.revenue || 0) - (data.cost || 0)) / (data.cost || 1) * 100), 500)}%
                          </span>
                        </div>
                        <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden mt-0.5 border border-slate-800">
                          <div 
                            className={`h-full rounded-full transition-all duration-300 ${anomalyDetails.color.replace('text-', 'bg-')}`}
                            style={{ width: `${Math.min(Math.abs((data.revenue || 0) - (data.cost || 0)) / (data.cost || 1) * 100, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {activeAnomalyTab === 'action' && (
                  <motion.div
                    key="action"
                    initial={{ opacity: 0, y: 3 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -3 }}
                    transition={{ duration: 0.12 }}
                    className="space-y-1.5 text-start"
                  >
                    <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 shrink-0" />
                      <span>{isRTL ? 'توصيات الذكاء الاصطناعي:' : 'AI Suggested Actions:'}</span>
                    </span>
                    <ul className="space-y-1">
                      {anomalyDetails.recommendations.map((rec, i) => (
                        <li key={i} className="text-[9.5px] text-slate-300 leading-normal flex items-start gap-1">
                          <span className="text-emerald-500 shrink-0 mt-0.5">✓</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  const t = translations[language];

  return (
    <div id="sales-forecast-chart" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-6 shadow-xl mb-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold font-display text-white flex items-center gap-2 text-start">
            <span>{t.chartTitle}</span>
            {forecastData.length > 0 && (
              <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-medium uppercase tracking-wider animate-pulse">
                {language === 'ar' ? 'التنبؤ نشط' : 'Forecast Active'}
              </span>
            )}
          </h2>
          <p className="text-xs text-slate-400 font-light mt-1 text-start">
            {t.chartSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 justify-start">
          {/* Zoom to Fit toggle */}
          <button
            id="zoom-to-fit-btn"
            onClick={() => setZoom30Days(!zoom30Days)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              zoom30Days 
                ? 'bg-violet-500/20 text-violet-300 border-violet-500/50' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Toggle between full historical range and a focused view of the last 30 days"
          >
            <ZoomIn className="w-3.5 h-3.5" />
            <span>{zoom30Days ? t.fullHistory : t.zoomToFit}</span>
          </button>

          {/* Toggle Cost visibility */}
          <button
            onClick={() => setShowCost(!showCost)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              showCost 
                ? 'bg-slate-800 text-slate-300 border-slate-700' 
                : 'bg-slate-950/40 text-slate-500 border-slate-900'
            }`}
          >
            {showCost ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>{showCost ? (language === 'ar' ? 'إخفاء التكلفة' : 'Hide COGS') : (language === 'ar' ? 'عرض التكلفة' : 'Show COGS')}</span>
          </button>

          {/* Toggle Error Bounds visibility */}
          {forecastData.length > 0 && (
            <button
              onClick={() => setShowBounds(!showBounds)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                showBounds 
                  ? 'bg-slate-800 text-slate-300 border-slate-700' 
                  : 'bg-slate-950/40 text-slate-500 border-slate-900'
              }`}
            >
              {showBounds ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showBounds ? (language === 'ar' ? 'إخفاء حدود التنبؤ' : 'Hide Bounds') : (language === 'ar' ? 'عرض حدود التنبؤ' : 'Show Bounds')}</span>
            </button>
          )}

          {/* Model Selector for ML/DL Analysis */}
          <div className="flex items-center gap-1">
            <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
              {language === 'ar' ? 'النموذج:' : 'Model:'}
            </span>
            <select
              id="ml-dl-model-select"
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer h-9 font-medium"
            >
              <option value="regression">
                {language === 'ar' ? '📉 انحدار خطي (أساسي)' : '📉 Linear Regression'}
              </option>
              <option value="arima">
                {language === 'ar' ? '📊 نموذج ARIMA' : '📊 ARIMA'}
              </option>
              <option value="lstm">
                {language === 'ar' ? '🧠 التعلم العميق (LSTM)' : '🧠 Deep Learning (LSTM)'}
              </option>
            </select>
          </div>

          {/* Forecast Button */}
          <button
            id="run-forecast-btn"
            onClick={() => onTriggerForecast(selectedModel)}
            disabled={forecastLoading}
            className="flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-medium px-4 py-2 rounded-xl transition-all shadow-md shadow-emerald-950/30 border border-emerald-500/30 disabled:opacity-50 h-9 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${forecastLoading ? 'animate-spin' : ''}`} />
            <span>{forecastLoading ? (language === 'ar' ? 'محاكاة المعاملات...' : 'Simulating Parameters...') : t.triggerForecast}</span>
          </button>
        </div>
      </div>

      {/* Comparison View Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-800/80 pb-4 mb-4">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mr-2">
          {language === 'ar' ? 'نمط العرض والتحليل:' : 'View Mode & Benchmarking:'}
        </span>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCompareMode('none')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'none'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-950/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'التحليل الافتراضي والتنبؤ' : 'Standard View'}</span>
          </button>
          
          <button
            onClick={() => setCompareMode('products')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'products'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-950/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مقارنة المنتجات' : 'Compare Products'}</span>
          </button>
          
          <button
            onClick={() => setCompareMode('dates')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
              compareMode === 'dates'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-950/40 font-bold'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{language === 'ar' ? 'مقارنة الفترات الزمنية' : 'Compare Date Ranges'}</span>
          </button>
        </div>
      </div>

      {/* Product comparison inputs */}
      {compareMode === 'products' && (
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col sm:flex-row sm:items-center gap-4 text-start animate-fade-in">
          <div className="flex-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'ar' ? 'المنتج الأساسي (أ)' : 'Base Product (A)'}
            </label>
            <select
              value={productA}
              onChange={(e) => setProductA(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-10 font-medium"
            >
              <option value="All">{language === 'ar' ? 'كل المنتجات' : 'All Products'}</option>
              {activeTenant.products.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
          
          <div className="flex items-center justify-center pt-2 sm:pt-4">
            <div className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold font-mono">
              VS
            </div>
          </div>

          <div className="flex-1">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'ar' ? 'المنتج المقارن (ب)' : 'Benchmark Product (B)'}
            </label>
            <select
              value={productB}
              onChange={(e) => setProductB(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-10 font-medium"
            >
              <option value="All">{language === 'ar' ? 'كل المنتجات' : 'All Products'}</option>
              {activeTenant.products.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </select>
          </div>
        </div>
      )}

      {/* Date range comparison inputs */}
      {compareMode === 'dates' && (
        <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-4 mb-4 flex flex-col md:flex-row md:items-center gap-4 text-start animate-fade-in">
          {/* Period A */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {language === 'ar' ? 'تاريخ بداية الفترة (أ)' : 'Range A Start'}
              </label>
              <input
                type="date"
                value={startDateA}
                onChange={(e) => setStartDateA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-10"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {language === 'ar' ? 'تاريخ نهاية الفترة (أ)' : 'Range A End'}
              </label>
              <input
                type="date"
                value={endDateA}
                onChange={(e) => setEndDateA(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-10"
              />
            </div>
          </div>

          <div className="flex items-center justify-center pt-2 md:pt-4">
            <div className="p-2 rounded-full bg-slate-900 border border-slate-800 text-slate-500 text-xs font-bold font-mono">
              VS
            </div>
          </div>

          {/* Period B */}
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {language === 'ar' ? 'تاريخ بداية الفترة (ب)' : 'Range B Start'}
              </label>
              <input
                type="date"
                value={startDateB}
                onChange={(e) => setStartDateB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-10"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                {language === 'ar' ? 'تاريخ نهاية الفترة (ب)' : 'Range B End'}
              </label>
              <input
                type="date"
                value={endDateB}
                onChange={(e) => setEndDateB(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer h-10"
              />
            </div>
          </div>
        </div>
      )}

      {/* Comparison stats bar */}
      {compareMode !== 'none' && compStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-950/60 border border-slate-800 p-4 rounded-2xl mb-4 text-start animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              {compareMode === 'products' 
                ? (language === 'ar' ? 'مقارنة المبيعات الإجمالية' : 'Gross Sales Comparison')
                : (language === 'ar' ? 'مقارنة الفترات الزمنية' : 'Period Sales Benchmarking')}
            </span>
            <div className="flex items-center justify-between font-mono text-xs text-slate-300">
              <span className="truncate max-w-[120px]">{compareMode === 'products' ? productA : `${language === 'ar' ? 'الفترة أ' : 'Range A'}`}</span>
              <span className="text-white font-bold">{symbol}{compStats.totalRevA.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-slate-300">
              <span className="truncate max-w-[120px]">{compareMode === 'products' ? productB : `${language === 'ar' ? 'الفترة ب' : 'Range B'}`}</span>
              <span className="text-white font-bold">{symbol}{compStats.totalRevB.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
            </div>
          </div>

          <div className="space-y-1 border-y md:border-y-0 md:border-x border-slate-800 md:px-4 py-2.5 md:py-0">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              {language === 'ar' ? 'هامش الربح التشغيلي والربحية' : 'Profitability Margin Variance'}
            </span>
            <div className="flex items-center justify-between font-mono text-xs text-slate-300">
              <span className="truncate max-w-[120px]">{compareMode === 'products' ? productA : `${language === 'ar' ? 'الفترة أ' : 'Range A'}`}</span>
              <span className="text-emerald-400 font-medium">{compStats.marginA.toFixed(1)}%</span>
            </div>
            <div className="flex items-center justify-between font-mono text-xs text-slate-300">
              <span className="truncate max-w-[120px]">{compareMode === 'products' ? productB : `${language === 'ar' ? 'الفترة ب' : 'Range B'}`}</span>
              <span className="text-emerald-400 font-medium">{compStats.marginB.toFixed(1)}%</span>
            </div>
          </div>

          <div className="flex flex-col justify-center space-y-1">
            <span className="text-[10px] text-slate-400 block uppercase tracking-wider font-semibold">
              {language === 'ar' ? 'الملخص التنفيذي للمقارنة' : 'Benchmarking Execution Insight'}
            </span>
            <p className="text-xs text-slate-200 font-medium leading-relaxed">
              {compareMode === 'products' ? (
                language === 'ar' ? (
                  <span>
                    المنتج <strong className="text-indigo-400">{compStats.winner}</strong> يتفوق مبيعاً بفارق{' '}
                    <span className="text-emerald-400 font-mono font-bold">+{compStats.winnerPct}%</span>.
                  </span>
                ) : (
                  <span>
                    Product <strong className="text-indigo-400">{compStats.winner}</strong> leads by{' '}
                    <span className="text-emerald-400 font-mono font-bold">+{compStats.winnerPct}%</span>.
                  </span>
                )
              ) : (
                language === 'ar' ? (
                  <span>
                    أداء <strong className="text-indigo-400">{compStats.winner}</strong> حقق فرقاً بنسبة{' '}
                    <span className={`font-mono font-bold ${compStats.revenueDiffPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {compStats.revenueDiffPct >= 0 ? '+' : ''}{compStats.revenueDiffPct.toFixed(1)}%
                    </span>.
                  </span>
                ) : (
                  <span>
                    Performance variance shows a{' '}
                    <span className={`font-mono font-bold ${compStats.revenueDiffPct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {compStats.revenueDiffPct >= 0 ? '+' : ''}{compStats.revenueDiffPct.toFixed(1)}%
                    </span> change.
                  </span>
                )
              )}
            </p>
          </div>
        </div>
      )}

      {/* Recharts Container */}
      <div className="h-80 w-full mb-4">
        {compareLoading ? (
          <div className="h-full w-full flex flex-col items-center justify-center gap-3 bg-slate-950/20 border border-slate-800/40 rounded-2xl">
            <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
            <p className="text-xs text-slate-400 font-mono">
              {language === 'ar' ? 'جاري تجميع وتحليل البيانات القياسية...' : 'Benchmarking financial performance channels...'}
            </p>
          </div>
        ) : compareMode === 'products' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={productMergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(dateStr) => {
                  try {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) return `${parts[1]}/${parts[2]}`;
                    return dateStr;
                  } catch {
                    return dateStr;
                  }
                }}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${symbol}${val.toLocaleString()}`}
              />
              <Tooltip content={<CustomComparisonTooltip />} wrapperStyle={{ pointerEvents: 'auto' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
              <Line 
                name={`${language === 'ar' ? 'مبيعات' : 'Sales:'} ${productA}`}
                type="monotone" 
                dataKey="revenueA" 
                stroke={primaryColor} 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#0b0f19', strokeWidth: 2 }}
              />
              <Line 
                name={`${language === 'ar' ? 'مبيعات' : 'Sales:'} ${productB}`}
                type="monotone" 
                dataKey="revenueB" 
                stroke="#10b981" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#0b0f19', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : compareMode === 'dates' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={dateMergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              <XAxis 
                dataKey="label" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${symbol}${val.toLocaleString()}`}
              />
              <Tooltip content={<CustomComparisonTooltip />} wrapperStyle={{ pointerEvents: 'auto' }} />
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
              <Line 
                name={`${language === 'ar' ? 'الفترة أ' : 'Range A'} (${startDateA} ${language === 'ar' ? 'إلى' : 'to'} ${endDateA})`}
                type="monotone" 
                dataKey="revenueA" 
                stroke={primaryColor} 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#0b0f19', strokeWidth: 2 }}
              />
              <Line 
                name={`${language === 'ar' ? 'الفترة ب' : 'Range B'} (${startDateB} ${language === 'ar' ? 'إلى' : 'to'} ${endDateB})`}
                type="monotone" 
                dataKey="revenueB" 
                stroke="#f59e0b" 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#0b0f19', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} onClick={handleChartClick} style={{ cursor: 'pointer' }}>
              <defs>
                <linearGradient id="colorHistory" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={primaryColor} stopOpacity={0.12}/>
                  <stop offset="95%" stopColor={primaryColor} stopOpacity={0.00}/>
                </linearGradient>
                <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.12}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0.00}/>
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.3} />
              
              <XAxis 
                dataKey="date" 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(dateStr) => {
                  try {
                    const parts = dateStr.split('-');
                    if (parts.length === 3) {
                      return `${parts[1]}/${parts[2]}`;
                    }
                    return dateStr;
                  } catch {
                    return dateStr;
                  }
                }}
              />
              
              <YAxis 
                stroke="#64748b" 
                fontSize={10} 
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `${symbol}${val.toLocaleString()}`}
              />
              
              <Tooltip content={<CustomTooltip />} wrapperStyle={{ pointerEvents: 'auto' }} />
              
              <Legend 
                verticalAlign="top" 
                height={36} 
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
              />
  
              {/* Shaded Area for History */}
              <Area 
                name={language === 'ar' ? 'اتجاه المبيعات التاريخية' : 'History Trend'}
                type="monotone" 
                dataKey="revenue" 
                stroke="transparent" 
                fill="url(#colorHistory)" 
                legendType="none"
              />
  
              {/* Shaded Area for Forecast bounds */}
              {showBounds && (
                <Area 
                  name={language === 'ar' ? 'فاصل الثقة للتنبؤ' : 'Forecast Confidence Interval'}
                  type="monotone" 
                  dataKey="forecastRange"
                  stroke="transparent"
                  fill="rgba(16, 185, 129, 0.15)"
                  legendType="none"
                />
              )}
  
              {/* Historical Line */}
              <Line 
                name={language === 'ar' ? 'إيرادات المبيعات التاريخية' : 'Historical Sales Revenue'}
                type="monotone" 
                dataKey="revenue" 
                stroke={primaryColor} 
                strokeWidth={2.5}
                dot={false}
                activeDot={{ r: 6, stroke: '#0b0f19', strokeWidth: 2 }}
                connectNulls
              />
  
              {/* Cost Line */}
              {showCost && (
                <Line 
                  name={language === 'ar' ? 'تكاليف البضائع المباعة' : 'Operational Cost of Goods'}
                  type="monotone" 
                  dataKey="cost" 
                  stroke="#64748b" 
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={false}
                  activeDot={false}
                  connectNulls
                />
              )}
  
              {/* Forecast Line */}
              <Line 
                name={language === 'ar' ? 'إسقاط التنبؤ الذكي لـ 30 يوماً' : '30-Day AI Forecast projection'}
                type="monotone" 
                dataKey="forecast" 
                stroke="#10b981" 
                strokeWidth={2.5}
                strokeDasharray="6 4"
                dot={false}
                activeDot={{ r: 6, stroke: '#0b0f19', strokeWidth: 2 }}
                connectNulls
              />
  
              {/* Overlay Invisible Line to place Anomaly Dot icons exactly on historical values */}
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="transparent"
                legendType="none"
                dot={<CustomAnomalyDot />}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Color indicator key guidelines */}
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-[10.5px] text-slate-400 font-light border-t border-slate-800/50 pt-4 text-start justify-start">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: primaryColor }}></span>
          <span>{language === 'ar' ? 'خط متصل: سجلات المبيعات التاريخية الفعلية' : 'Solid Line: Real historical sales records'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 border-t border-dashed border-emerald-500"></span>
          <span>{language === 'ar' ? 'خط متقطع: إسقاطات التنبؤ بنموذج التعلم الآلي / التعلم العميق' : 'Dashed Line: Predictive machine/deep learning forecast projections'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded-sm bg-emerald-500/15 border border-emerald-500/30"></span>
          <span>{language === 'ar' ? 'المنطقة المظللة بالأخضر: فاصل الثقة للتنبؤ (النطاق)' : 'Shaded Green Band: Forecast Confidence Interval (Range Bounds)'}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2 rounded-sm bg-amber-500/20 border border-amber-500/30"></span>
          <span>{language === 'ar' ? 'مؤشرات النقط: معاملات شاذة تم رصدها' : 'Dot indicators: Flagged business transaction anomalies'}</span>
        </div>
      </div>

      {/* Strategic AI commentary box */}
      {forecastAnalysis && (
        <div className="mt-5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-5 shadow-inner text-start">
          <div className="flex items-center gap-2 mb-3 justify-start">
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
              {language === 'ar' ? 'ملاحظات المحاكاة الذكية من كبير العلماء الماليين' : 'Chief AI Scientist Model Commentary'}
            </h4>
          </div>
          
          <div className="prose prose-invert prose-xs text-xs text-slate-300 font-light leading-relaxed space-y-3 max-h-64 overflow-y-auto pr-2">
            {forecastAnalysis.split('\n').map((line, idx) => {
              if (line.trim().startsWith('###') || line.trim().startsWith('**')) {
                return <p key={idx} className="font-semibold text-white pt-2 first:pt-0">{line.replace(/###|\*\*/g, '').trim()}</p>;
              }
              if (line.trim().startsWith('-') || line.trim().startsWith('*')) {
                return <li key={idx} className="ml-4 list-disc text-slate-300">{line.replace(/^[-*]\s*/, '').trim()}</li>;
              }
              return line.trim() ? <p key={idx}>{line}</p> : null;
            })}
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', duration: 0.4 }}
              className="relative w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden max-h-[85vh] flex flex-col text-start"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950/30">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 bg-indigo-500/10 text-indigo-400 rounded-xl">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      {language === 'ar' ? 'سجل المعاملات التفصيلي' : 'Detailed Transaction Ledger'}
                    </h3>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      {selectedDate}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-all cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto flex-1">
                {modalLoading ? (
                  <div className="flex flex-col items-center justify-center py-16 gap-3">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-400">
                      {language === 'ar' ? 'جاري تحميل سجلات المعاملات...' : 'Retrieving transactions from secure node...'}
                    </p>
                  </div>
                ) : modalTransactions.length > 0 ? (
                  <div className="space-y-4">
                    {/* Summary row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {language === 'ar' ? 'إجمالي المعاملات' : 'Transaction Count'}
                        </span>
                        <span className="text-sm font-bold text-white font-mono">
                          {modalTransactions.length}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {language === 'ar' ? 'إجمالي الإيرادات' : 'Total Revenue'}
                        </span>
                        <span className="text-sm font-bold text-white font-mono text-emerald-400">
                          {symbol}{modalTransactions.reduce((acc, t) => acc + (t.revenue || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {language === 'ar' ? 'إجمالي التكاليف' : 'Total Costs (COGS)'}
                        </span>
                        <span className="text-sm font-bold text-white font-mono text-slate-400">
                          {symbol}{modalTransactions.reduce((acc, t) => acc + (t.cost || 0), 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="bg-slate-950/40 border border-slate-800/60 rounded-xl p-3">
                        <span className="text-[10px] text-slate-400 block mb-1">
                          {language === 'ar' ? 'صافي الربح' : 'Net Margin Profit'}
                        </span>
                        {(() => {
                          const rev = modalTransactions.reduce((acc, t) => acc + (t.revenue || 0), 0);
                          const cost = modalTransactions.reduce((acc, t) => acc + (t.cost || 0), 0);
                          const prof = rev - cost;
                          return (
                            <span className={`text-sm font-bold font-mono ${prof >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {symbol}{prof.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          );
                        })()}
                      </div>
                    </div>

                    {/* Table */}
                    <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-slate-300" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}>
                          <thead className="bg-slate-950/40 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                            <tr>
                              <th className="px-4 py-3.5 text-slate-400 text-start">{language === 'ar' ? 'المنتج' : 'Product Stream'}</th>
                              <th className="px-4 py-3.5 text-slate-400 text-start">{language === 'ar' ? 'الحملة الإعلانية' : 'Campaign Origin'}</th>
                              <th className="px-4 py-3.5 text-slate-400 text-start">{language === 'ar' ? 'الوحدات' : 'Units'}</th>
                              <th className="px-4 py-3.5 text-slate-400 text-start">{language === 'ar' ? 'التكلفة' : 'COGS'}</th>
                              <th className="px-4 py-3.5 text-slate-400 text-start">{language === 'ar' ? 'الإيرادات' : 'Revenue'}</th>
                              <th className="px-4 py-3.5 text-slate-400 text-start">{language === 'ar' ? 'الحالة' : 'Status'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/50 text-xs">
                            {modalTransactions.map((tx, idx) => (
                              <tr key={idx} className="hover:bg-slate-800/20 transition-all">
                                <td className="px-4 py-3 font-medium text-white text-start">{tx.product || '-'}</td>
                                <td className="px-4 py-3 text-slate-400 text-start">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-800/80 border border-slate-700/50 text-[10px]">
                                    {tx.campaign || (language === 'ar' ? 'مباشر' : 'Direct/None')}
                                  </span>
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-300 text-start">{tx.units || 0}</td>
                                <td className="px-4 py-3 font-mono text-slate-500 text-start">{symbol}{tx.cost?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 font-mono font-semibold text-emerald-400 text-start">{symbol}{tx.revenue?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                                <td className="px-4 py-3 text-start">
                                  {tx.isAnomaly ? (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
                                      {language === 'ar' ? 'شذوذ مالي' : 'Anomaly'}
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      {language === 'ar' ? 'طبيعي' : 'Nominal'}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                    <div className="w-12 h-12 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
                      <Sparkles className="w-6 h-6 text-emerald-400 shrink-0" />
                    </div>
                    <h4 className="text-sm font-bold text-white mb-1">
                      {language === 'ar' ? 'توقع مالي مستقبلي' : 'AI Projected Horizon'}
                    </h4>
                    <p className="text-xs text-slate-400 max-w-md leading-relaxed">
                      {language === 'ar' 
                        ? 'هذا تاريخ مستقبلي يقع ضمن النطاق المتنبأ به. لا توجد سجلات معاملات تاريخية فعلية متاحة لهذه الفترة، ويتم توليد البيانات كلياً عبر نماذج التنبؤ الرياضية والعصبية.'
                        : 'This date lies in the future forecasting window. No actual historical transaction ledger is available. The values are mathematically simulated based on historical trends and deep learning projection bounds.'}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 border-t border-slate-800 bg-slate-950/20 flex justify-end">
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                >
                  {language === 'ar' ? 'إغلاق' : 'Close'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
