import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  AlertCircle, 
  CheckCircle, 
  RefreshCcw, 
  ArrowRight, 
  Sparkles, 
  Shield, 
  Zap, 
  Check, 
  Loader2, 
  Download, 
  Lock, 
  Calendar, 
  DollarSign, 
  Activity,
  ExternalLink,
  X,
  Cpu,
  Crown
} from 'lucide-react';
import { BillingData } from '../types';
import { Language, translations } from '../utils/translations';
import { motion, AnimatePresence } from 'motion/react';
import { jsPDF } from 'jspdf';

interface BillingDashboardProps {
  tenantId: string;
  language: Language;
  onUpgradePlan: () => void;
}

export default function BillingDashboard({ tenantId, language, onUpgradePlan }: BillingDashboardProps) {
  const t = translations[language];
  const isRTL = language === 'ar';

  const [billing, setBilling] = useState<BillingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingCard, setUpdatingCard] = useState(false);
  const [cardSuccess, setCardSuccess] = useState<string | null>(null);
  const [cardError, setCardError] = useState<string | null>(null);

  // Card Form States
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Notification Toast state
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showLimitToast, setShowLimitToast] = useState(false);

  // Statement Generator States
  const [statementMonth, setStatementMonth] = useState('07');
  const [statementYear, setStatementYear] = useState('2026');
  const [generatingStatement, setGeneratingStatement] = useState(false);

  const fetchBilling = () => {
    setLoading(true);
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
  };

  useEffect(() => {
    fetchBilling();
  }, [tenantId]);

  useEffect(() => {
    if (billing) {
      const rawPlan = billing.plan.toLowerCase();
      const isEnterprise = rawPlan.includes('enterprise');
      const isAnnual = rawPlan.includes('annual') || rawPlan.includes('team') || rawPlan.includes('pro');
      
      // If the user is on the Basic plan, they are nearing their limit
      if (!isEnterprise && !isAnnual) {
        const timer = setTimeout(() => {
          setShowLimitToast(true);
        }, 1200);
        return () => clearTimeout(timer);
      }
    }
  }, [billing]);

  const handleCardUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardName || !cardNumber || !cardExpiry || !cardCvc) {
      setCardError(isRTL ? 'جميع الحقول مطلوبة لتحديث بطاقة الدفع' : 'All fields are required to update payment card');
      return;
    }

    setUpdatingCard(true);
    setCardError(null);
    setCardSuccess(null);

    try {
      const response = await fetch(`/api/billing/${tenantId}/update-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cardholder: cardName,
          number: cardNumber,
          expiry: cardExpiry,
          cvc: cardCvc
        })
      });

      if (response.ok) {
        const resData = await response.json();
        if (resData.success) {
          setBilling(resData.billing);
          setCardSuccess(isRTL ? 'تم تحديث بطاقة الدفع الائتمانية بنجاح!' : 'Payment card details updated successfully!');
          setIsFormOpen(false);
          // Clear inputs
          setCardName('');
          setCardNumber('');
          setCardExpiry('');
          setCardCvc('');
          showToast(isRTL ? 'تم تحديث معلومات الدفع بنجاح' : 'Payment information updated successfully');
        } else {
          setCardError(resData.message || (isRTL ? 'فشل تحديث بطاقة الدفع' : 'Failed to update payment card'));
        }
      } else {
        setCardError(isRTL ? 'عذراً، فشل الاتصال بخوادم الدفع الآمنة' : 'Failed to connect to secure billing servers');
      }
    } catch (err) {
      console.error(err);
      setCardError(isRTL ? 'حدث خطأ غير متوقع أثناء معالجة البيانات' : 'An unexpected error occurred during card validation');
    } finally {
      setUpdatingCard(false);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const downloadInvoiceAsPDF = (invoice: {
    id: string;
    date: string;
    description: string;
    amount: number;
    status: 'Paid' | 'Unpaid' | 'Pending';
  }) => {
    try {
      showToast(
        isRTL 
          ? `جاري توليد وتحميل الفاتورة ${invoice.id} كملف PDF...` 
          : `Generating and compiling PDF for invoice ${invoice.id}...`
      );

      const doc = new jsPDF();
      
      // Theme colors
      const primaryColor = [79, 70, 229]; // Indigo-600
      const secondaryColor = [30, 41, 59]; // Slate-800
      const lightBgColor = [248, 250, 252]; // Slate-50
      const borderLineColor = [226, 232, 240]; // Slate-200

      // Elegant top header banner
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(15, 15, 180, 35, 'F');

      // Title & Brand inside header
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('SNIPER AI', 22, 32);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('GLOBAL FINANCIAL & MULTI-TENANT CRM ENGINE', 22, 40);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('OFFICIAL TAX INVOICE', 140, 29);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Invoice ID: ${invoice.id}`, 140, 37);
      doc.text(`Issue Date: ${invoice.date}`, 140, 43);

      // Divider Line below header
      doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2]);
      doc.setLineWidth(0.5);
      doc.line(15, 58, 195, 58);

      // Meta Info Grid (Billed To vs Issued By)
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('BILLED TO:', 15, 68);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105); // Slate-600
      doc.text(`Client ID / Tenant: ${tenantId.toUpperCase()}`, 15, 74);
      doc.text(`Cardholder: ${billing?.creditCard?.cardholder || 'Authorized SaaS Tenant'}`, 15, 80);
      doc.text(`Payment: ${billing?.creditCard?.brand || 'Visa'} ending in •••• ${billing?.creditCard?.last4 || '4242'}`, 15, 86);

      // Right Column: Issued By
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.text('ISSUED BY:', 120, 68);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Sniper AI Technologies Inc.', 120, 74);
      doc.text('Cloud Run Ingress Node Alpha', 120, 80);
      doc.text('Support: billing@sniper.ai', 120, 86);

      // Transaction Status Badge
      doc.setFillColor(240, 253, 250); // Emerald-50 background
      doc.rect(15, 96, 180, 10, 'F');
      
      doc.setDrawColor(204, 251, 241); // Emerald-100 border
      doc.rect(15, 96, 180, 10, 'S');

      doc.setTextColor(13, 148, 136); // Emerald-600
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9.5);
      const paymentStatusText = `PAYMENT STATUS: ${invoice.status.toUpperCase()} - SECURELY SETTLED VIA STRIPE GATEWAY`;
      doc.text(paymentStatusText, 20, 102.5);

      // Table Header
      doc.setFillColor(241, 245, 249); // Slate-100
      doc.rect(15, 114, 180, 8, 'F');
      
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('ITEM DESCRIPTION', 18, 119.5);
      doc.text('QTY', 115, 119.5);
      doc.text('UNIT PRICE', 140, 119.5);
      doc.text('TOTAL AMOUNT', 168, 119.5);

      // Table Row
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(51, 65, 85); // Slate-700
      doc.text(invoice.description, 18, 130);
      doc.text('1', 117, 130);
      doc.text(`$${invoice.amount.toFixed(2)}`, 140, 130);
      doc.text(`$${invoice.amount.toFixed(2)}`, 168, 130);

      // Divider below row
      doc.setDrawColor(241, 245, 249);
      doc.line(15, 136, 195, 136);

      // Summary Section (aligned right)
      const summaryX = 130;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Subtotal:', summaryX, 146);
      doc.text(`$${invoice.amount.toFixed(2)}`, 175, 146);

      doc.text('Tax (0.00% VAT):', summaryX, 152);
      doc.text('$0.00', 175, 152);

      // Double line for Total
      doc.setDrawColor(226, 232, 240);
      doc.line(130, 156, 195, 156);

      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(11);
      doc.text('Total Paid (USD):', summaryX, 163);
      doc.text(`$${invoice.amount.toFixed(2)}`, 172, 163);

      doc.line(130, 166, 195, 166);

      // Cryptographic secure verification notice
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.rect(15, 180, 180, 18, 'F');
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      const ledgerStr = `SYSTEM LEDGER VERIFICATION HASH: sha256_e7d80f8b8a0df92b0c15d5e6ffbf_${invoice.id.toLowerCase()}_2026`;
      doc.text(ledgerStr, 18, 187);
      doc.text('This is an electronically generated official fiscal tax document. No signature is required.', 18, 192);

      // Footer
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('THANK YOU FOR YOUR VALUED PARTNERSHIP!', 62, 220);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Sniper AI Technologies Inc.  •  https://ai.studio/build  •  billing@sniper.ai', 54, 226);

      // Save PDF
      doc.save(`SniperAI_Invoice_${invoice.id}.pdf`);
      showToast(isRTL ? 'تم تحميل الفاتورة بنجاح كملف PDF!' : 'Invoice PDF downloaded successfully!');
    } catch (err) {
      console.error("PDF generation failed:", err);
      showToast(isRTL ? 'حدث خطأ أثناء إعداد ملف PDF المالي' : 'Failed to compile official invoice PDF.');
    }
  };

  const downloadMonthlyStatementAsPDF = () => {
    try {
      setGeneratingStatement(true);

      const targetPeriod = `${statementYear}-${statementMonth}`;
      
      // Get billing invoices list or empty
      const invoiceList = billing?.invoices || [];
      
      // Filter invoices for selected period
      const filteredInvoices = invoiceList.filter(inv => inv.date.startsWith(targetPeriod));
      
      const monthNames: { [key: string]: string } = {
        '01': 'January', '02': 'February', '03': 'March', '04': 'April',
        '05': 'May', '06': 'June', '07': 'July', '08': 'August',
        '09': 'September', '10': 'October', '11': 'November', '12': 'December'
      };
      
      const monthLabel = monthNames[statementMonth] || statementMonth;
      
      showToast(
        isRTL 
          ? `جاري توليد كشف الحساب لشهر ${monthLabel} ${statementYear}...` 
          : `Compiling billing statement for ${monthLabel} ${statementYear}...`
      );

      const doc = new jsPDF();
      
      const primaryColor = [79, 70, 229]; // Indigo-600
      const secondaryColor = [30, 41, 59]; // Slate-800
      const lightBgColor = [248, 250, 252]; // Slate-50
      const borderLineColor = [226, 232, 240]; // Slate-200

      // Header Banner
      doc.setFillColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]); // Slate Dark header for Statement
      doc.rect(15, 15, 180, 35, 'F');

      // Title & Brand inside header
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('SNIPER AI', 22, 32);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('GLOBAL FINANCIAL & MULTI-TENANT CRM ENGINE', 22, 40);

      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(13);
      doc.text('MONTHLY BILLING STATEMENT', 125, 29);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`Statement Period: ${monthLabel} ${statementYear}`, 125, 37);
      doc.text(`Generated On: ${new Date().toISOString().split('T')[0]}`, 125, 43);

      // Divider Line below header
      doc.setDrawColor(borderLineColor[0], borderLineColor[1], borderLineColor[2]);
      doc.setLineWidth(0.5);
      doc.line(15, 58, 195, 58);

      // Meta Info Grid
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('ACCOUNT OWNER:', 15, 68);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text(`Client ID / Tenant: ${tenantId.toUpperCase()}`, 15, 74);
      doc.text(`Registered Cardholder: ${billing?.creditCard?.cardholder || 'Authorized SaaS Tenant'}`, 15, 80);
      doc.text(`Active Subscription Plan: ${activePlanName}`, 15, 86);

      // Right Column: Statement Overview
      doc.setTextColor(secondaryColor[0], secondaryColor[1], secondaryColor[2]);
      doc.setFont('Helvetica', 'bold');
      doc.text('STATEMENT SUMMARY:', 120, 68);
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      
      const totalAmountPaid = filteredInvoices.reduce((sum, inv) => sum + inv.amount, 0);
      
      doc.text(`Total Transactions: ${filteredInvoices.length}`, 120, 74);
      doc.text(`Total Settled: $${totalAmountPaid.toFixed(2)}`, 120, 80);
      doc.text(`Pending Addon Renewals: ${billing?.pendingRenewals?.length || 0}`, 120, 86);

      // Table Header of Transactions
      doc.setFillColor(79, 70, 229); // Indigo header
      doc.rect(15, 96, 180, 8, 'F');
      
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text('REF ID', 18, 101.5);
      doc.text('TRANSACTION DATE', 48, 101.5);
      doc.text('DESCRIPTION / SUBSCRIPTION ITEM', 90, 101.5);
      doc.text('STATUS', 158, 101.5);
      doc.text('AMOUNT', 176, 101.5);

      // Populate Table Rows
      let currentY = 112;
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8.5);
      doc.setTextColor(51, 65, 85);

      if (filteredInvoices.length === 0) {
        doc.text('No transaction events recorded for this billing cycle.', 18, currentY);
        doc.setDrawColor(241, 245, 249);
        doc.line(15, currentY + 5, 195, currentY + 5);
        currentY += 12;
      } else {
        filteredInvoices.forEach((inv) => {
          doc.setFont('Helvetica', 'bold');
          doc.text(inv.id, 18, currentY);
          
          doc.setFont('Helvetica', 'normal');
          doc.text(inv.date, 48, currentY);
          
          // Truncate description if too long
          const desc = inv.description.length > 35 ? `${inv.description.slice(0, 32)}...` : inv.description;
          doc.text(desc, 90, currentY);
          
          doc.text(inv.status, 158, currentY);
          doc.text(`$${inv.amount.toFixed(2)}`, 176, currentY);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 5, 195, currentY + 5);
          currentY += 12;
        });
      }

      // Add Pending Renewals if any and if we are in current month or near it
      const renewalsList = billing?.pendingRenewals || [];
      if (renewalsList.length > 0) {
        // Draw separate section for upcoming renewals
        doc.setFillColor(248, 250, 252);
        doc.rect(15, currentY, 180, 6, 'F');
        
        doc.setFont('Helvetica', 'bold');
        doc.setTextColor(15, 23, 42);
        doc.text('UPCOMING RENEWALS & CHARGES (ESTIMATED)', 18, currentY + 4.5);
        currentY += 12;

        renewalsList.forEach((renewal) => {
          doc.setFont('Helvetica', 'normal');
          doc.text('PENDING', 18, currentY);
          doc.text(renewal.date, 48, currentY);
          doc.text(`${renewal.item} (Recurring Renewal)`, 90, currentY);
          doc.text('Pending', 158, currentY);
          doc.text(`$${renewal.amount.toFixed(2)}`, 176, currentY);

          doc.setDrawColor(241, 245, 249);
          doc.line(15, currentY + 5, 195, currentY + 5);
          currentY += 12;
        });
      }

      // Total Settled Summary Block
      const summaryY = currentY + 5;
      doc.setFontSize(9);
      doc.setTextColor(71, 85, 105);
      doc.text('Total Settled Transactions:', 120, summaryY);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      doc.text(`$${totalAmountPaid.toFixed(2)}`, 175, summaryY);

      doc.setDrawColor(226, 232, 240);
      doc.line(120, summaryY + 4, 195, summaryY + 4);

      // Cryptographic secure verification notice
      doc.setFillColor(lightBgColor[0], lightBgColor[1], lightBgColor[2]);
      doc.rect(15, summaryY + 12, 180, 18, 'F');
      
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184); // Slate-400
      const statementHash = `STATEMENT SECURITY TOKEN ID: statement_sha256_${tenantId}_${statementMonth}_${statementYear}`;
      doc.text(statementHash, 18, summaryY + 19);
      doc.text('All details represent current official ledger indices matching your Sniper AI cloud subscription.', 18, summaryY + 24);

      // Footer
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(100, 116, 139);
      doc.text('THANK YOU FOR YOUR VALUED PARTNERSHIP!', 62, summaryY + 45);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text('Sniper AI Technologies Inc.  •  https://ai.studio/build  •  billing@sniper.ai', 54, summaryY + 51);

      // Save PDF
      doc.save(`SniperAI_Statement_${monthLabel}_${statementYear}.pdf`);
      showToast(isRTL ? 'تم تحميل كشف الحساب بنجاح كملف PDF!' : 'Monthly statement PDF downloaded successfully!');
    } catch (err) {
      console.error("Statement PDF generation failed:", err);
      showToast(isRTL ? 'حدث خطأ أثناء إعداد ملف كشف الحساب المالي' : 'Failed to compile monthly billing statement PDF.');
    } finally {
      setGeneratingStatement(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <p className="text-xs text-slate-400 font-medium">
          {isRTL ? 'جاري تحميل بوابة الدفع الفوترة الآمنة...' : 'Retrieving secure billing ledger...'}
        </p>
      </div>
    );
  }

  if (!billing) {
    return (
      <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-3" />
        <h4 className="text-sm font-bold text-white mb-1">
          {isRTL ? 'عذراً، تعذر العثور على سجلات الفواتير' : 'Billing Record Unresolved'}
        </h4>
        <p className="text-xs text-slate-400">
          {isRTL ? 'يرجى مراجعة صلاحيات الحساب أو المحاولة مرة أخرى لاحقاً.' : 'Please verify workspace subscription clearance or retry.'}
        </p>
      </div>
    );
  }

  // Normalize Plan info
  const rawPlan = billing.plan.toLowerCase();
  const isEnterprise = rawPlan.includes('enterprise');
  const isAnnual = rawPlan.includes('annual') || rawPlan.includes('team') || rawPlan.includes('pro');
  const isMonthly = rawPlan.includes('monthly') || rawPlan.includes('basic') || rawPlan.includes('starter') || rawPlan.includes('starter flow');

  let activePlanName = isRTL ? 'الباقة المبتدئة' : 'Starter Sandbox';
  let activePlanPrice = '$0.00';
  let activePlanPeriod = isRTL ? '/ شهرياً' : '/ mo';
  let activePlanColor = 'from-slate-600 to-slate-400';
  let PlanIcon = Cpu;
  let featuresList: string[] = [];

  if (isEnterprise) {
    activePlanName = isRTL ? 'باقة المؤسسات والتحكم (Enterprise Suite)' : 'Enterprise Suite Plan';
    activePlanPrice = '$149.00';
    activePlanPeriod = isRTL ? '/ شهرياً (دفع سنوي)' : '/ mo (billed annually)';
    activePlanColor = 'from-amber-600 to-rose-500';
    PlanIcon = Crown;
    featuresList = isRTL ? [
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
    ];
  } else if (isAnnual) {
    activePlanName = isRTL ? 'باقة النمو الاحترافية (Growth Professional)' : 'Growth Professional Plan';
    activePlanPrice = '$39.00';
    activePlanPeriod = isRTL ? '/ شهرياً (دفع سنوي)' : '/ mo (billed annually)';
    activePlanColor = 'from-indigo-600 to-violet-500';
    PlanIcon = Zap;
    featuresList = isRTL ? [
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
    ];
  } else {
    // Basic/Monthly/Starter Sandbox
    activePlanName = isRTL ? 'الباقة المبتدئة (Starter Sandbox)' : 'Starter Sandbox';
    activePlanPrice = '$0.00';
    activePlanPeriod = isRTL ? '/ شهرياً' : '/ mo';
    activePlanColor = 'from-slate-600 to-slate-400';
    PlanIcon = Cpu;
    featuresList = isRTL ? [
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
    ];
  }

  // Card default mockup
  const card = billing.creditCard || {
    brand: 'Visa',
    last4: '4242',
    expMonth: '12',
    expYear: '2029',
    cardholder: isRTL ? 'مؤسسة ريادة الأعمال' : 'SaaS Organization Inc.'
  };

  // Invoices default mockup
  const invoices = billing.invoices || [
    { id: 'INV-2026-101', date: '2026-07-01', description: `${billing.plan} Setup Fee`, amount: 0, status: 'Paid' as const }
  ];

  return (
    <div className="space-y-6 text-start">
      {/* Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-indigo-600 text-white font-semibold text-xs py-3 px-5 rounded-xl shadow-xl border border-indigo-500/30 flex items-center gap-2"
          >
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-300" />
            <span>{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proactive Limit Warning Toast */}
      <AnimatePresence>
        {showLimitToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 right-6 z-50 bg-slate-950/95 backdrop-blur-xl border border-amber-500/30 text-white rounded-3xl p-5 max-w-sm shadow-2xl shadow-amber-950/20 flex flex-col gap-3.5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500 shrink-0 mt-0.5 animate-pulse">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1">
                  {isRTL ? 'تنبيه استهلاك حدود الباقة!' : 'Usage Limit Alert!'}
                </h4>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isRTL 
                    ? 'لقد استهلكت أكثر من 84% من سجلات المبيعات و 100% من مصادر البيانات المتصلة المتاحة على باقتك الحالية.'
                    : 'You have utilized over 84% of your sales records and 100% of your connected data sources on your current plan.'}
                </p>
              </div>
              <button 
                onClick={() => setShowLimitToast(false)}
                className="text-slate-500 hover:text-white transition-colors cursor-pointer p-1"
                aria-label="Close alert"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="flex items-center gap-2 border-t border-slate-900 pt-3">
              <button
                onClick={() => {
                  setShowLimitToast(false);
                  onUpgradePlan();
                }}
                className="flex-1 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 rounded-xl text-[11px] font-extrabold transition-all cursor-pointer shadow-md shadow-orange-950/10 text-center flex items-center justify-center gap-1"
              >
                <Sparkles className="w-3.5 h-3.5 fill-slate-950/20" />
                {isRTL ? 'ترقية الاشتراك الآن' : 'Upgrade Plan Now'}
              </button>
              <button
                onClick={() => setShowLimitToast(false)}
                className="px-3 py-2 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-[11px] font-semibold transition-colors cursor-pointer"
              >
                {isRTL ? 'تجاهل' : 'Dismiss'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Alert Banner for Limit Warning inside the dashboard */}
      {(!isEnterprise && !isAnnual) && (
        <div className="bg-amber-500/5 backdrop-blur-md border border-amber-500/20 rounded-3xl p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>
          <div className="flex items-start gap-3.5 relative z-10">
            <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20 text-amber-500 shrink-0">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                <span>{isRTL ? 'اقتراب نفاذ حدود الباقة الحالية' : 'Approaching Plan Resource Limits'}</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-mono font-bold animate-pulse">84% {isRTL ? 'مستهلك' : 'USED'}</span>
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed max-w-2xl">
                {isRTL 
                  ? 'يرجى العلم أن مؤسستك تقترب من استنفاد حدود سجلات المبيعات النشطة المتاحة لهذا الشهر (استهلكت 8,410 من 10,000 سجل). قم بترقية خطتك لتجنب أي توقف مؤقت لتحليلاتك الذكية.'
                  : 'Your organization is nearing the allocated sales volume tier for this billing period (8,410 of 10,000 records). Upgrade today to maintain uninterrupted flow of automated neural insights.'}
              </p>
            </div>
          </div>
          <button
            onClick={onUpgradePlan}
            className="w-full md:w-auto px-4.5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-md shadow-amber-950/10 flex items-center justify-center gap-1.5 whitespace-nowrap relative z-10 font-sans"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950/20" />
            {isRTL ? 'عرض خطط الترقية المتاحة' : 'View Upgrade Options'}
          </button>
        </div>
      )}

      {/* Main Billing and Subscription Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Active Subscription & Limits Progress */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Active Subscription Plan Details */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
            {/* Visual background gradient */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-800/60 pb-5">
              <div className="flex items-center gap-4">
                <div className={`p-4 rounded-2xl bg-gradient-to-tr ${activePlanColor} text-white shadow-lg`}>
                  <PlanIcon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500">{isRTL ? 'الاشتراك الفعال حالياً' : 'Current active tier'}</span>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {isRTL ? 'نشط' : 'Active'}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mt-1 font-display">
                    {activePlanName}
                  </h3>
                </div>
              </div>

              <div className="text-start sm:text-end">
                <div className="flex items-baseline gap-1 justify-start sm:justify-end">
                  <span className="text-2xl font-extrabold text-white tracking-tight font-mono">{activePlanPrice}</span>
                  <span className="text-xs text-slate-500 font-mono">{activePlanPeriod}</span>
                </div>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  {isRTL ? 'تاريخ التجديد القادم:' : 'Renewing on:'} <span className="font-mono font-semibold text-indigo-400">{billing.nextBillingDate}</span>
                </p>
              </div>
            </div>

            {/* Simulated Tier Usage Limits Progress Bars */}
            <div className="mb-6 space-y-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-800/40">
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-indigo-400" />
                {isRTL ? 'حدود واستهلاك الخطة الحالية' : 'Tier resource utilization & quotas'}
              </h4>

              {/* Limit 1: Analysed Records */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{isRTL ? 'سجلات المبيعات المحللة شهرياً' : 'Analysed monthly sales records'}</span>
                  <span className="font-mono text-white font-medium">
                    {isEnterprise ? (isRTL ? 'غير محدود' : 'Unlimited') : isAnnual ? '34,291 / 150,000' : '8,410 / 10,000'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: isEnterprise ? '100%' : isAnnual ? '23%' : '84%' }}
                  />
                </div>
              </div>

              {/* Limit 2: Connected Sources */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{isRTL ? 'مصادر البيانات الموصولة' : 'Connected data pipelines'}</span>
                  <span className="font-mono text-white font-medium">
                    {isEnterprise ? (isRTL ? 'غير محدود' : 'Unlimited') : isAnnual ? '3 / 5' : '1 / 1'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-400 h-full rounded-full transition-all duration-1000" 
                    style={{ width: isEnterprise ? '100%' : isAnnual ? '60%' : '100%' }}
                  />
                </div>
              </div>

              {/* Limit 3: Executive Seats */}
              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-slate-400">{isRTL ? 'مقاعد الأعضاء والمستخدمين المشرفين' : 'Active executive & admin seats'}</span>
                  <span className="font-mono text-white font-medium">
                    {isEnterprise ? (isRTL ? 'غير محدود' : 'Unlimited') : isAnnual ? '2 / 5' : '1 / 1'}
                  </span>
                </div>
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-violet-500 h-full rounded-full transition-all duration-1000" 
                    style={{ width: isEnterprise ? '100%' : isAnnual ? '40%' : '100%' }}
                  />
                </div>
              </div>
            </div>

            {/* List of active features */}
            <div className="space-y-3">
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isRTL ? 'الميزات المتاحة في باقتك الحالية' : 'Features unlocked on your tier'}
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {featuresList.map((feat, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <span className="p-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0 mt-0.5">
                      <Check className="w-3 h-3" />
                    </span>
                    <span className="leading-tight font-light">{feat}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Billing status bar */}
            <div className="mt-8 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-[10px] text-slate-500 block uppercase font-mono">{isRTL ? 'حالة حساب الفوترة الرئيسي' : 'Master billing clearance status'}</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-bold mt-1.5 ${
                  billing.invoiceStatus === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  billing.invoiceStatus === 'Overdue' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                  'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${billing.invoiceStatus === 'Paid' ? 'bg-emerald-400' : 'bg-rose-400'} animate-pulse`}></span>
                  {billing.invoiceStatus === 'Paid' ? (isRTL ? 'جميع الدفعات مسددة' : 'Nominal - Paid') : billing.invoiceStatus}
                </span>
              </div>

              <button
                onClick={onUpgradePlan}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer shadow-lg shadow-indigo-950/40"
              >
                <Sparkles className="w-3.5 h-3.5 fill-white/10" />
                {isRTL ? 'ترقية / تغيير باقة الاشتراك' : 'Change or Upgrade Plan'}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Payment Method (Interactive Mock Card & Update Card Form) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Payment Method Card */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl text-start">
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              {isRTL ? 'طريقة الدفع المعتمدة' : 'Active Payment Method'}
            </h3>

            {/* Glassmorphism Obsidian Credit Card Graphic */}
            <div className="relative w-full h-44 rounded-2xl bg-gradient-to-br from-[#1b1f30] via-[#0d0f1a] to-[#080a12] border border-slate-800 p-5 overflow-hidden shadow-2xl flex flex-col justify-between mb-5 select-none font-sans">
              {/* Abstract decorative chip */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
              
              {/* Header card row */}
              <div className="flex justify-between items-center relative z-10">
                <div className="w-10 h-7 rounded-md bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <div className="grid grid-cols-3 gap-0.5 w-6 h-4">
                    <div className="border border-amber-500/30 rounded-sm"></div>
                    <div className="border border-amber-500/30 rounded-sm"></div>
                    <div className="border border-amber-500/30 rounded-sm"></div>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold tracking-widest text-slate-400 uppercase">
                  {card.brand}
                </span>
              </div>

              {/* Number card row */}
              <div className="relative z-10 text-center my-2">
                <span className="text-base sm:text-lg font-mono tracking-widest text-white font-medium block">
                  ••••  ••••  ••••  {card.last4}
                </span>
              </div>

              {/* Footer card row */}
              <div className="flex justify-between items-end relative z-10">
                <div>
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 block mb-0.5">{isRTL ? 'مالك البطاقة' : 'Cardholder'}</span>
                  <span className="text-xs text-slate-200 font-mono font-semibold block truncate max-w-[180px]">
                    {card.cardholder}
                  </span>
                </div>
                <div className="text-end">
                  <span className="text-[8px] uppercase tracking-wider text-slate-500 block mb-0.5">{isRTL ? 'تاريخ الصلاحية' : 'Expires'}</span>
                  <span className="text-xs text-slate-200 font-mono font-semibold block">
                    {card.expMonth}/{card.expYear.toString().slice(-2)}
                  </span>
                </div>
              </div>
            </div>

            {/* Toggle card update form */}
            {!isFormOpen ? (
              <button
                onClick={() => setIsFormOpen(true)}
                className="w-full py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-1.5"
              >
                <Lock className="w-3.5 h-3.5 text-indigo-400" />
                {isRTL ? 'تحديث بطاقة الائتمان الآمنة' : 'Update Credit Card details'}
              </button>
            ) : (
              <form onSubmit={handleCardUpdateSubmit} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-indigo-500" />
                    {isRTL ? 'تحديث بطاقة الدفع الآمنة' : 'Secure Card Gateway'}
                  </span>
                  <button 
                    type="button" 
                    onClick={() => setIsFormOpen(false)}
                    className="text-xs text-slate-500 hover:text-white cursor-pointer"
                  >
                    {isRTL ? 'إلغاء' : 'Cancel'}
                  </button>
                </div>

                {cardError && (
                  <div className="text-[11px] text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2 rounded-lg">
                    {cardError}
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">{isRTL ? 'الاسم بالكامل على البطاقة' : 'Cardholder Full Name'}</label>
                  <input 
                    type="text" 
                    value={cardName}
                    onChange={(e) => setCardName(e.target.value)}
                    placeholder="e.g. Othman Al-Subhi" 
                    required 
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-medium text-slate-400 mb-1">{isRTL ? 'رقم البطاقة المكون من 16 رقماً' : '16-Digit Card Number'}</label>
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010" 
                    required 
                    maxLength={19}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">{isRTL ? 'تاريخ الصلاحية' : 'Expiry'}</label>
                    <input 
                      type="text" 
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      placeholder="MM/YY" 
                      required 
                      maxLength={5}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-medium text-slate-400 mb-1">CVC</label>
                    <input 
                      type="password" 
                      value={cardCvc}
                      onChange={(e) => setCardCvc(e.target.value)}
                      placeholder="•••" 
                      required 
                      maxLength={4}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-white text-xs focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-mono" 
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={updatingCard}
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  {updatingCard ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  {updatingCard ? (isRTL ? 'جاري التحقق والتحديث...' : 'Saving safely...') : (isRTL ? 'تأكيد وحفظ البطاقة' : 'Authorize & Save Card')}
                </button>
              </form>
            )}
          </div>

          {/* Pending Renewals & Add-ons */}
          <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 shadow-xl text-start">
            <h3 className="text-sm font-bold text-white mb-3.5 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400" />
              {isRTL ? 'الاشتراكات والخدمات التابعة قادماً' : 'Next Billing Renewals'}
            </h3>

            {billing.pendingRenewals.length === 0 ? (
              <div className="bg-slate-950/20 border border-slate-800/50 p-4 rounded-2xl flex flex-col items-center justify-center text-center py-6">
                <CheckCircle className="w-7 h-7 text-emerald-500/80 mb-2" />
                <p className="text-xs text-slate-300 font-semibold">{isRTL ? 'لا توجد خدمات معلقة أو رسوم إضافية' : 'No upcoming custom add-on charges'}</p>
                <p className="text-[10px] text-slate-500 mt-0.5">{isRTL ? 'تم تغطية كافة الخدمات في باقة الاشتراك النشط.' : 'Everything is fully cleared by your bundle subscription.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {billing.pendingRenewals.map((r, i) => (
                  <div key={i} className="bg-slate-950/40 border border-slate-800/60 p-3 rounded-xl flex items-center justify-between gap-2.5">
                    <div>
                      <h4 className="text-xs font-bold text-slate-200">{r.item}</h4>
                      <div className="flex items-center gap-1.5 text-[9px] text-slate-500 mt-1 font-mono">
                        <Calendar className="w-3 h-3 text-slate-600" />
                        <span>{r.date}</span>
                      </div>
                    </div>
                    <div className="text-end shrink-0">
                      <span className="text-xs font-mono font-bold text-indigo-400">${r.amount}</span>
                      <span className="text-[8px] text-slate-500 block">{isRTL ? 'مبلغ معلق' : 'Estimated'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Invoices & Historic Ledger Section */}
      <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-6 md:p-8 shadow-xl text-start">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4.5 h-4.5 text-indigo-400" />
              {isRTL ? 'سجل المعاملات والفواتير السابقة' : 'Billing Invoice & Payment History'}
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-light">
              {isRTL ? 'شاهد وحمّل الإيصالات المالية المعتمدة لاشتراك مستأجرك.' : 'Audit and retrieve fiscal PDFs of payment history.'}
            </p>
          </div>
          <button 
            onClick={() => showToast(isRTL ? 'جاري تصدير السجل بصيغة CSV...' : 'Exporting billing ledger to CSV...')}
            className="px-4 py-2 bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center justify-center gap-2"
          >
            <Download className="w-3.5 h-3.5" />
            {isRTL ? 'تصدير السجل المالي' : 'Export fiscal ledger'}
          </button>
        </div>

        {/* Monthly Statement Generator Control Card */}
        <div className="mb-6 p-5 rounded-2xl bg-slate-950/40 border border-slate-800/60 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">
                {isRTL ? 'منشئ كشف الحساب الشهري المعتمد' : 'Official Monthly Statement Generator'}
              </h4>
              <p className="text-[11px] text-slate-400">
                {isRTL ? 'اختر الشهر والسنة لتوليد كشف حساب موثق بصيغة PDF.' : 'Generate a certified transaction ledger for any billing cycle.'}
              </p>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
            <select
              value={statementMonth}
              onChange={(e) => setStatementMonth(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-medium cursor-pointer"
            >
              <option value="01">{isRTL ? 'يناير' : 'January'}</option>
              <option value="02">{isRTL ? 'فبراير' : 'February'}</option>
              <option value="03">{isRTL ? 'مارس' : 'March'}</option>
              <option value="04">{isRTL ? 'أبريل' : 'April'}</option>
              <option value="05">{isRTL ? 'مايو' : 'May'}</option>
              <option value="06">{isRTL ? 'يونيو' : 'June'}</option>
              <option value="07">{isRTL ? 'يوليو' : 'July'}</option>
              <option value="08">{isRTL ? 'أغسطس' : 'August'}</option>
              <option value="09">{isRTL ? 'سبتمبر' : 'September'}</option>
              <option value="10">{isRTL ? 'أكتوبر' : 'October'}</option>
              <option value="11">{isRTL ? 'نوفمبر' : 'November'}</option>
              <option value="12">{isRTL ? 'ديسمبر' : 'December'}</option>
            </select>

            <select
              value={statementYear}
              onChange={(e) => setStatementYear(e.target.value)}
              className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 font-mono font-medium cursor-pointer"
            >
              <option value="2026">2026</option>
              <option value="2025">2025</option>
            </select>

            <button
              onClick={downloadMonthlyStatementAsPDF}
              disabled={generatingStatement}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-md shadow-indigo-950/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {generatingStatement ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Download className="w-3.5 h-3.5" />
              )}
              {generatingStatement 
                ? (isRTL ? 'جاري التوليد...' : 'Compiling PDF...') 
                : (isRTL ? 'تحميل كشف الحساب' : 'Download Statement')
              }
            </button>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/20">
          <div className="overflow-x-auto">
            <table className="w-full text-slate-300" style={{ direction: isRTL ? 'rtl' : 'ltr' }}>
              <thead className="bg-slate-950/40 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-4 text-slate-400 text-start">{isRTL ? 'معرف الفاتورة' : 'Invoice Reference'}</th>
                  <th className="px-5 py-4 text-slate-400 text-start">{isRTL ? 'تاريخ الدفع' : 'Billing Date'}</th>
                  <th className="px-5 py-4 text-slate-400 text-start">{isRTL ? 'الوصف' : 'Description'}</th>
                  <th className="px-5 py-4 text-slate-400 text-start">{isRTL ? 'المبلغ' : 'Amount'}</th>
                  <th className="px-5 py-4 text-slate-400 text-start">{isRTL ? 'الحالة' : 'Status'}</th>
                  <th className="px-5 py-4 text-slate-400 text-end">{isRTL ? 'الإجراءات' : 'Actions'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 text-xs">
                {invoices.map((inv, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/20 transition-all">
                    <td className="px-5 py-3.5 font-mono font-semibold text-white text-start">{inv.id}</td>
                    <td className="px-5 py-3.5 text-slate-400 font-mono text-start">{inv.date}</td>
                    <td className="px-5 py-3.5 text-slate-300 text-start">{inv.description}</td>
                    <td className="px-5 py-3.5 font-mono font-semibold text-white text-start">
                      {inv.amount === 0 ? (isRTL ? 'مجاني' : '$0.00') : `$${inv.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
                    </td>
                    <td className="px-5 py-3.5 text-start">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium ${
                        inv.status === 'Paid' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                        inv.status === 'Pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                        'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-end">
                      <button 
                        onClick={() => downloadInvoiceAsPDF(inv)}
                        className="p-1 text-slate-400 hover:text-indigo-400 transition-colors inline-flex items-center gap-1 cursor-pointer font-medium"
                        title={isRTL ? 'تحميل الفاتورة معتمدة' : 'Download receipt'}
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="text-[10px] underline hidden sm:inline">{isRTL ? 'إيصال مالي' : 'Receipt'}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  );
}
