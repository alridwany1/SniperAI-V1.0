import React, { useState, useEffect } from 'react';
import { CreditCard, AlertCircle, CheckCircle, RefreshCcw, ArrowRight } from 'lucide-react';
import { BillingData } from '../types';
import { Language } from '../utils/translations';

interface BillingDashboardProps {
  tenantId: string;
  language: Language;
  onUpgradePlan: () => void;
}

export default function BillingDashboard({ tenantId, language, onUpgradePlan }: BillingDashboardProps) {
  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/billing/${tenantId}`)
      .then((res) => res.json())
      .then((data) => {
        setBilling(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load billing data', err);
        setLoading(false);
      });
  }, [tenantId]);

  if (loading) return <div className="text-slate-500 text-sm p-4">Loading billing data...</div>;
  if (!billing) return <div className="text-slate-500 text-sm p-4">Could not load billing information.</div>;

  const isRTL = language === 'ar';
  
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 shadow-xl h-full">
      <h2 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <CreditCard className="w-5 h-5 text-indigo-400" />
        {isRTL ? 'لوحة تحكم الفواتير' : 'Billing Dashboard'}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Invoice Status */}
        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-500 text-xs mb-1 uppercase font-semibold">{isRTL ? 'حالة الفاتورة' : 'Invoice Status'}</p>
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
              billing.invoiceStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400' :
              billing.invoiceStatus === 'Overdue' ? 'bg-rose-500/10 text-rose-400' :
              'bg-amber-500/10 text-amber-400'
            }`}>
              {billing.invoiceStatus}
            </span>
            <p className="text-white font-mono text-sm">{billing.plan} Plan</p>
          </div>
          <p className="text-slate-400 text-xs mt-3">{isRTL ? 'تاريخ الفاتورة القادمة:' : 'Next Billing Date:'} {billing.nextBillingDate}</p>
        </div>

        {/* Pending Renewals */}
        <div className="bg-slate-950/50 p-5 rounded-2xl border border-slate-800">
          <p className="text-slate-500 text-xs mb-3 uppercase font-semibold">{isRTL ? 'التجديدات المعلقة' : 'Pending Renewals'}</p>
          {billing.pendingRenewals.length === 0 ? (
            <p className="text-slate-600 text-xs">{isRTL ? 'لا توجد تجديدات معلقة' : 'No pending renewals'}</p>
          ) : (
            <ul className="space-y-2">
              {billing.pendingRenewals.map((r, i) => (
                <li key={i} className="flex justify-between text-xs text-slate-300">
                  <span>{r.item}</span>
                  <span className="font-mono">${r.amount} - {r.date}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Upgrade CTA */}
      <div className="mt-6 pt-6 border-t border-slate-800 flex justify-between items-center">
        <p className="text-slate-400 text-xs">{isRTL ? 'هل تريد ميزات أكثر؟' : 'Need more features?'}</p>
        <button
          onClick={onUpgradePlan}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 cursor-pointer transition-colors"
        >
          {isRTL ? 'ترقية الخطة' : 'Upgrade Plan'}
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
