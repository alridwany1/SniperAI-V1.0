import React from 'react';
import { SalesRecord, Tenant } from '../types';
import { AlertTriangle, TrendingUp, HelpCircle, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Language } from '../utils/translations';

interface AnomaliesListProps {
  anomalies: SalesRecord[];
  activeTenant: Tenant;
  language: Language;
}

export default function AnomaliesList({ anomalies, activeTenant, language }: AnomaliesListProps) {
  return (
    <div id="anomalies-list-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[340px]">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white text-start">
              {language === 'ar' ? 'حالات الشذوذ المالي وسجلات التدقيق' : 'System Anomalies & Audit Logs'}
            </h2>
            <p className="text-[10px] text-slate-400 font-light text-start">
              {language === 'ar' ? 'فحص نزاهة وموثوقية سجلات المعاملات' : 'Integrity inspection of transaction records'}
            </p>
          </div>
        </div>
        
        <span className="text-[9px] bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800 text-slate-500 font-mono">
          {language === 'ar' ? 'العتبة: > 3.0σ' : 'Threshold: > 3.0σ'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
        {anomalies.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
            <div className="p-2.5 bg-slate-950/80 rounded-full border border-slate-900 text-slate-600">
              <BadgeInfo className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-400">
                {language === 'ar' ? 'جميع السجلات تقع ضمن النطاق الآمن' : 'All Records within Tolerance Bounds'}
              </p>
              <p className="text-[10px] text-slate-600 font-light mt-0.5">
                {language === 'ar' 
                  ? 'لم يتم رصد أي تباينات حرجة أو انحرافات غير طبيعية في الإيرادات تحت التصفية الحالية.' 
                  : 'No critical high/low revenue variances detected under current filters.'}
              </p>
            </div>
          </div>
        ) : (
          anomalies.map((a, idx) => {
            const isHighRev = a.revenue > a.units * 100; // typical high threshold
            const cardBg = isHighRev ? 'from-emerald-500/5 to-transparent' : 'from-rose-500/5 to-transparent';
            const borderCol = isHighRev ? 'hover:border-emerald-500/30' : 'hover:border-rose-500/30';
            const textCol = isHighRev ? 'text-emerald-400' : 'text-rose-400';

            return (
              <div 
                key={idx}
                className={`bg-slate-950/40 border border-slate-900/80 rounded-xl p-3 flex flex-col justify-between transition-all bg-gradient-to-r text-start ${cardBg} ${borderCol}`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 justify-start">
                    <span className="text-xs font-bold text-slate-200">{a.product}</span>
                    {a.campaign !== 'None' && (
                      <span className="text-[9px] bg-slate-900 text-slate-400 px-1.5 py-0.2 rounded font-light border border-slate-800">
                        {a.campaign}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-slate-400">{a.date}</span>
                </div>
                
                <p className="text-[11px] text-slate-300 font-light leading-relaxed text-start">
                  {a.anomalyReason || (language === 'ar' ? 'انحراف إيرادات ذو دلالة إحصائية يتطلب المراجعة.' : 'Statistically significant revenue deviation requiring review.')}
                </p>

                <div className="flex items-center justify-between border-t border-slate-900/60 mt-2.5 pt-1.5 text-[10px] text-slate-500 font-mono">
                  <span>{language === 'ar' ? `الوحدات: ${a.units}` : `Units: ${a.units}`}</span>
                  <span className={`font-semibold ${textCol}`}>{language === 'ar' ? `الإيرادات: $${a.revenue.toLocaleString()}` : `Revenue: $${a.revenue.toLocaleString()}`}</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
