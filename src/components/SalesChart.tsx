import React, { useState } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, Legend, Line, CartesianGrid } from 'recharts';
import { ForecastRecord, Tenant } from '../types';
import { Sparkles, TrendingUp, HelpCircle, Eye, EyeOff, ZoomIn } from 'lucide-react';
import { translations, Language } from '../utils/translations';
import { getCurrencySymbol } from '../utils/currency';

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
  const symbol = getCurrencySymbol(activeTenant.currency);

  // Map the accent colors
  let primaryColor = '#6366f1'; // Indigo
  if (activeTenant.accentColor === 'rose') primaryColor = '#f43f5e';
  else if (activeTenant.accentColor === 'emerald') primaryColor = '#10b981';

  // Format historical + forecast data into a contiguous stream
  const mergedData: ChartPoint[] = [];

  // Slice to last 30 days of history if zoomed in
  const displayHistorical = zoom30Days ? historicalData.slice(-30) : historicalData;

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

      return (
        <div className="bg-slate-950/95 border border-slate-800 p-4 rounded-xl shadow-2xl max-w-sm backdrop-blur-md">
          <p className="text-xs font-semibold text-slate-400 mb-2 font-mono">{data.date}</p>
          
          <div className="space-y-1.5">
            {data.revenue !== undefined && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: primaryColor }}></span>
                  <span>{language === 'ar' ? 'الإيرادات الفعلية:' : 'Actual Revenue:'}</span>
                </span>
                <span className="text-xs font-bold text-white font-mono">{symbol}{data.revenue.toLocaleString()}</span>
              </div>
            )}

            {data.cost !== undefined && showCost && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-slate-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>{language === 'ar' ? 'تكلفة التشغيل:' : 'Operating Cost:'}</span>
                </span>
                <span className="text-xs font-bold text-slate-400 font-mono">{symbol}{data.cost.toLocaleString()}</span>
              </div>
            )}

            {data.forecast !== undefined && (
              <div className="flex items-center justify-between gap-6">
                <span className="text-xs text-emerald-400 flex items-center gap-1.5 font-medium">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  <span>{language === 'ar' ? 'التنبؤ الذكي:' : 'AI Predicted:'}</span>
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono">{symbol}{data.forecast.toLocaleString()}</span>
              </div>
            )}

            {isForecastingVal && data.lowerBound !== undefined && data.upperBound !== undefined && showBounds && (
              <div className="pt-2 border-t border-slate-800 mt-2 text-[10px] text-slate-400 space-y-1 font-light">
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'الحد الأقصى للثقة:' : 'Confidence Limit Max:'}</span>
                  <span className="font-mono text-emerald-500/80">{symbol}{data.upperBound.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{language === 'ar' ? 'الحد الأدنى للثقة:' : 'Confidence Limit Min:'}</span>
                  <span className="font-mono text-amber-500/80">{symbol}{data.lowerBound.toLocaleString()}</span>
                </div>
              </div>
            )}
          </div>

          {data.isAnomaly && (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 mt-3">
              <p className="text-[10px] text-amber-400 font-medium uppercase tracking-wider mb-0.5">{language === 'ar' ? 'تم رصد معاملة شاذة' : 'Critical Anomaly Detected'}</p>
              <p className="text-[11px] text-amber-200 leading-relaxed font-light">{data.anomalyReason}</p>
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

      {/* Recharts Container */}
      <div className="h-80 w-full mb-4">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={mergedData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            
            <Tooltip content={<CustomTooltip />} />
            
            <Legend 
              verticalAlign="top" 
              height={36} 
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }}
            />

            {/* Shaded Area for History */}
            <Area 
              name="History Trend"
              type="monotone" 
              dataKey="revenue" 
              stroke="transparent" 
              fill="url(#colorHistory)" 
              legendType="none"
            />

            {/* Shaded Area for Forecast bounds */}
            {showBounds && (
              <Area 
                name="Forecast Confidence Interval"
                type="monotone" 
                dataKey="forecastRange"
                stroke="transparent"
                fill="rgba(16, 185, 129, 0.15)"
                legendType="none"
              />
            )}

            {/* Historical Line */}
            <Line 
              name="Historical Sales Revenue"
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
                name="Operational Cost of Goods"
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
              name="30-Day AI Forecast projection"
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
    </div>
  );
}
