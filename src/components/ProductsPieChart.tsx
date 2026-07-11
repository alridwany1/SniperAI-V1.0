import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Language } from '../utils/translations';

interface ProductData {
  name: string;
  value: number;
}

interface ProductsPieChartProps {
  data: ProductData[];
  language: Language;
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#3b82f6', '#ec4899', '#14b8a6'];

const RADIAN = Math.PI / 180;

export default function ProductsPieChart({ data, language }: ProductsPieChartProps) {
  const isRTL = language === 'ar';

  const chartData = useMemo(() => {
    return data && data.length > 0 ? data : [{ name: isRTL ? 'لا توجد بيانات' : 'No Data', value: 1 }];
  }, [data, isRTL]);

  const isEmpty = !data || data.length === 0;

  const total = useMemo(() => {
    return data ? data.reduce((sum, item) => sum + item.value, 0) : 0;
  }, [data]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl h-full flex flex-col justify-between">
      <div>
        <h2 className="text-sm font-bold text-slate-100 mb-4 font-display tracking-tight flex items-center justify-between">
          <span>{isRTL ? 'توزيع المبيعات حسب المنتجات' : 'Product Sales Distribution'}</span>
        </h2>
        
        <div className="h-[220px] w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={72}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
                stroke="#0f172a"
                strokeWidth={2}
                isAnimationActive={!isEmpty}
                labelLine={false}
                label={false}
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={isEmpty ? '#334155' : COLORS[index % COLORS.length]} 
                    className="transition-all duration-300 hover:opacity-90 hover:scale-105 origin-center cursor-pointer focus:outline-none"
                  />
                ))}
              </Pie>
              {!isEmpty && (
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                    borderColor: '#1e293b',
                    borderRadius: '1rem',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
                    color: '#f1f5f9',
                    fontSize: '11px',
                    direction: isRTL ? 'rtl' : 'ltr'
                  }}
                  itemStyle={{ color: '#e2e8f0', fontWeight: 500 }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, isRTL ? 'الإيرادات' : 'Revenue']}
                />
              )}
            </PieChart>
          </ResponsiveContainer>

          {/* Center Text */}
          {!isEmpty && (
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-slate-400 text-[9px] font-semibold uppercase tracking-widest mb-0.5">
                {isRTL ? 'الإجمالي' : 'Total'}
              </span>
              <span className="text-md font-bold text-white font-mono">
                ${total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Modern, Highly Structured Custom Legend */}
      {!isEmpty && (
        <div className="mt-5 space-y-2 border-t border-slate-800/80 pt-4">
          {data.map((item, index) => {
            const percentage = total > 0 ? ((item.value / total) * 100).toFixed(1) : '0';
            return (
              <div 
                key={item.name} 
                className="flex items-center justify-between text-[11px] font-light hover:bg-slate-800/10 p-1.5 rounded-xl transition-all"
              >
                <div className="flex items-center gap-2 max-w-[65%] text-start">
                  <span 
                    className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-slate-300 truncate font-display font-medium" title={item.name}>
                    {item.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-end font-mono">
                  <span className="text-slate-200 font-semibold">
                    ${item.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </span>
                  <span className="text-slate-500 text-[10px] bg-slate-950 px-1.5 py-0.5 rounded border border-slate-800/60 font-medium">
                    {percentage}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
