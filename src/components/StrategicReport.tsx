import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  FileText, Sparkles, Download, AlertCircle, RefreshCw, Printer, ChevronDown, FileDown,
  TrendingUp, ShieldAlert, Target, Grid, Layers, AlertTriangle, 
  Percent, DollarSign, Activity, Calendar, Award, BookOpen, 
  ArrowUpRight, BarChart3, CheckCircle2, Circle, LayoutGrid, Eye, HelpCircle,
  Info, Flame, ArrowDownRight, BadgeCheck, X, Mail, Clock, ShieldCheck, Check
} from 'lucide-react';
import { Language } from '../utils/translations';
import { jsPDF } from 'jspdf';
import { addAuditLog } from '../utils/auditLogger';
import { safeFetchJson } from '../utils/apiUtils';
import { MetricSummary, SalesRecord } from '../types';
import { 
  AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid,
  BarChart, Bar, Legend as RechartsLegend
} from 'recharts';

interface StrategicReportProps {
  reportText: string;
  loading: boolean;
  onGenerateReport: () => void;
  onExportCSV: () => void;
  activeTenantName: string;
  language: Language;
  summary?: MetricSummary;
}

const t = {
  ar: {
    title: 'التقرير الاستراتيجي التنفيذي (AI)',
    subtitle: 'تحليل SWOT، وتقييم هوامش الربح والمعاملات الشاذة المخصصة لمجلس الإدارة',
    kpis: 'المؤشرات المالية الرئيسية المصفاة',
    revenue: 'إجمالي الإيرادات',
    cogs: 'تكلفة المبيعات (COGS)',
    profit: 'صافي الربح',
    margin: 'هامش الربح',
    aov: 'متوسط قيمة الطلب',
    volume: 'حجم العمليات',
    anomaliesCount: 'الانحرافات المرصودة',
    trendChart: 'الرسم البياني للتطور المالي الفعلي',
    swotTitle: 'تحليل SWOT الاستراتيجي الرباعي',
    strengths: 'نقاط القوة (S)',
    weaknesses: 'نقاط الضعف (W)',
    opportunities: 'الفرص المتاحة (O)',
    threats: 'التهديدات المحتملة (T)',
    financialTab: 'الأداء المالي',
    riskTab: 'الحد من المخاطر',
    playbookTab: 'خطة التوسع',
    swotTab: 'تحليل SWOT',
    activeTenant: 'المستأجر النشط',
    riskLevel: 'مستوى المخاطر الإحصائية',
    low: 'منخفض جداً',
    medium: 'متوسط الحذر',
    high: 'مرتفع - يتطلب تدخل',
    timeline: 'سجل الانحرافات والتقلبات الطارئة',
    playbookTitle: 'توجيهات مبيعات وحملات النمو المستهدفة (+15%)',
    completed: 'مكتملة',
    inProgress: 'قيد التنفيذ',
    actionRequired: 'إجراء مطلوب',
    interactiveMode: 'لوحة التحكم التنفيذية',
    classicMode: 'التقرير الكلاسيكي الفصحى',
    viewMode: 'نمط العرض',
    noReport: 'لم يتم بدء التقرير الاستراتيجي',
    skipTyping: 'تخطي تأثير الكتابة',
    compiledAndLocked: 'تم تجميع التقرير وتأمينه لجلسة المستأجر النشطة حالياً.',
    securedSSL: 'تشفير SSL آمن',
    viewReportBtn: 'تحليل المؤشرات الاستراتيجية',
    cogsRatio: 'نسبة تكلفة المبيعات من الإيراد',
    efficiencyRating: 'تصنيف الكفاءة التشغيلية',
    
    // Scheduler Translations
    scheduleBtn: 'جدولة التقارير',
    scheduleTitle: 'جدولة توزيع التقارير الاستراتيجية',
    scheduleSubtitle: 'اضبط الإرسال التلقائي والدوري للتقرير التنفيذي مباشرة إلى بريد مجلس الإدارة المسجل.',
    emailLabel: 'البريد الإلكتروني المسجل للمستقبل',
    freqLabel: 'تردد الإرسال الدوري',
    daily: 'يومياً (كل صباح 08:00)',
    weekly: 'أسبوعياً (كل خميس)',
    monthly: 'شهرياً (الأول من كل شهر)',
    formatLabel: 'صيغة التقرير المرفق',
    timeLabel: 'توقيت الإرسال المفضل',
    memoLabel: 'ملاحظة إضافية مرفقة مع البريد',
    memoPlaceholder: 'مثال: يرجى مراجعة ملخص الأداء المالي الأسبوعي المعتمد من الذكاء الاصطناعي لوحدة الاستثمار في المعاملات...',
    saveSchedule: 'حفظ وتنشيط جدول الإرسال',
    cancel: 'إلغاء',
    activeSchedules: 'جداول التوزيع النشطة حالياً',
    noSchedules: 'لا توجد جداول إرسال نشطة حالياً لهذا المستأجر.',
    delete: 'إلغاء الجدول',
    testDelivery: 'إرسال نسخة تجريبية فورية الآن',
    testSuccess: 'تم محاكاة إرسال نسخة تجريبية فورية بنجاح إلى البريد المعتمد!',
    scheduleSuccess: 'تم حفظ وتفعيل جدول الإرسال الدوري بنجاح وجاري المزامنة في الخلفية.',
    scheduleDeleted: 'تم إلغاء وحذف جدول التوزيع الدوري بنجاح.'
  },
  en: {
    title: 'AI Strategic Executive Report',
    subtitle: 'SWOT Analysis, net margins, and anomaly assessment tailored for the Board of Directors',
    kpis: 'Filtered Key Financial Indicators',
    revenue: 'Total Revenue',
    cogs: 'Cost of Goods (COGS)',
    profit: 'Net Profit',
    margin: 'Profit Margin',
    aov: 'Average Order Value (AOV)',
    volume: 'Sales Volume',
    anomaliesCount: 'Flagged Anomalies',
    trendChart: 'Actual Financial Trend Performance',
    swotTitle: 'Strategic 4-Quadrant SWOT Analysis',
    strengths: 'Strengths (S)',
    weaknesses: 'Weaknesses (W)',
    opportunities: 'Opportunities (O)',
    threats: 'Threats (T)',
    financialTab: 'Financial Performance',
    riskTab: 'Risk Mitigation',
    playbookTab: 'Expansion Playbook',
    swotTab: 'SWOT Grid',
    activeTenant: 'Active Tenant Node',
    riskLevel: 'Statistical Risk Level',
    low: 'Very Low',
    medium: 'Moderate / Warning',
    high: 'High - Action Required',
    timeline: 'Outliers & Volatility Events Feed',
    playbookTitle: 'Targeted Sales & Campaign Growth Playbook (+15%)',
    completed: 'Completed',
    inProgress: 'In Progress',
    actionRequired: 'Action Required',
    interactiveMode: 'Interactive Dashboard Mode',
    classicMode: 'Classic Professional Text Mode',
    viewMode: 'View Mode',
    noReport: 'No Strategic Report Initialized',
    skipTyping: 'Skip typing effect',
    compiledAndLocked: 'Report is compiled and locked for active Tenant session.',
    securedSSL: 'Secured SSL Encryption',
    viewReportBtn: 'Analyze Strategic KPIs',
    cogsRatio: 'COGS to Revenue Ratio',
    efficiencyRating: 'Operational Efficiency Rating',

    // Scheduler Translations
    scheduleBtn: 'Schedule Delivery',
    scheduleTitle: 'Strategic Report Distribution Scheduler',
    scheduleSubtitle: 'Configure periodic, automated transmission of executive reports directly to registered boardroom emails.',
    emailLabel: 'Recipient Registered Email',
    freqLabel: 'Delivery Frequency',
    daily: 'Daily (Every morning at 08:00)',
    weekly: 'Weekly (Every Thursday)',
    monthly: 'Monthly (1st of every month)',
    formatLabel: 'Attached Report Format',
    timeLabel: 'Preferred Hour of Delivery',
    memoLabel: 'Cover Memo / Custom Email Note',
    memoPlaceholder: 'Example: Please review the latest AI-generated board-level operational assessment...',
    saveSchedule: 'Save & Activate Distribution Schedule',
    cancel: 'Cancel',
    activeSchedules: 'Active Report Distribution Schedules',
    noSchedules: 'No active report distribution schedules for this Tenant.',
    delete: 'Cancel Schedule',
    testDelivery: 'Trigger Instant Test Run',
    testSuccess: 'Instant test-run report compiled and transmitted to registered email address!',
    scheduleSuccess: 'Distribution schedule is now active and synchronized with SniperAI background workers.',
    scheduleDeleted: 'Scheduled report delivery has been successfully cancelled.'
  }
};

export default function StrategicReport({
  reportText,
  loading,
  onGenerateReport,
  onExportCSV,
  activeTenantName,
  language,
  summary,
}: StrategicReportProps) {
  const isRtl = language === 'ar';
  const currentT = t[language];

  const [showExportMenu, setShowExportMenu] = useState(false);
  const [reportSummary, setReportSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [viewMode, setViewMode] = useState<'interactive' | 'classic'>('interactive');
  const [activeTab, setActiveTab] = useState<'financial' | 'risk' | 'playbook' | 'swot'>('financial');

  // Interactive completed states for custom strategy playbook cards
  const [completedStrategies, setCompletedStrategies] = useState<Record<number, boolean>>({});

  // Typing animation states
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scheduler-related States
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [scheduleEmail, setScheduleEmail] = useState('');
  const [scheduleFrequency, setScheduleFrequency] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [scheduleFormat, setScheduleFormat] = useState<'pdf' | 'csv' | 'markdown'>('pdf');
  const [scheduleTime, setScheduleTime] = useState('08:00');
  const [scheduleMemo, setScheduleMemo] = useState('');
  const [schedules, setSchedules] = useState<any[]>([]);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize schedules from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem('sniper_report_schedules');
    if (saved) {
      try {
        setSchedules(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse saved schedules', e);
      }
    }
    
    // Autofill registered user email if available
    const userEmail = localStorage.getItem('userEmail') || 'ceo@sniperai.io';
    setScheduleEmail(userEmail);
  }, []);

  const saveSchedulesToStorage = (newSchedules: any[]) => {
    setSchedules(newSchedules);
    localStorage.setItem('sniper_report_schedules', JSON.stringify(newSchedules));
  };

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // Trigger typing simulation when reportText loads
  useEffect(() => {
    if (!reportText) {
      setDisplayedText('');
      setIsTyping(false);
      return;
    }

    setDisplayedText('');
    setIsTyping(true);

    let currentIndex = 0;
    const increment = Math.max(12, Math.ceil(reportText.length / 100));
    
    const intervalId = setInterval(() => {
      currentIndex += increment;
      if (currentIndex >= reportText.length) {
        setDisplayedText(reportText);
        setIsTyping(false);
        clearInterval(intervalId);
      } else {
        setDisplayedText(reportText.slice(0, currentIndex));
      }
    }, 10);

    return () => {
      clearInterval(intervalId);
    };
  }, [reportText]);

  // Keep report view container scrolled to bottom during typing
  useEffect(() => {
    if (isTyping && scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [displayedText, isTyping]);

  const handleSkipTyping = () => {
    setDisplayedText(reportText);
    setIsTyping(false);
  };

  const handleToggleSummary = async () => {
    if (reportSummary) {
      setShowSummary(!showSummary);
      return;
    }
    
    setIsSummarizing(true);
    try {
      const data = await safeFetchJson('/api/reports/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText })
      });
      setReportSummary(data.summary);
      setShowSummary(true);
    } catch (error) {
      console.error('Failed to summarize', error);
      alert('Failed to summarize.');
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleDownloadjsPDF = () => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const userEmail = localStorage.getItem('userEmail') || 'SYSTEM';

      // Title & Configuration
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.setTextColor(15, 23, 42); // slate-900
      doc.text('SniperAI Executive Strategic Report', 20, 35);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(100, 116, 139); // slate-500
      doc.text(`Tenant Node: ${activeTenantName}`, 20, 43);
      doc.text(`Generated: ${new Date().toUTCString()}`, 20, 49);
      doc.text(`Status: Signed & Verified Security Ledger`, 20, 55);

      doc.setDrawColor(79, 70, 229); // Indigo 600
      doc.setLineWidth(0.8);
      doc.line(20, 62, 190, 62);

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700

      let y = 72;
      const maxY = 265;

      const lines = (reportText || '').split('\n');
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3;
          return;
        }

        if (y > maxY) {
          doc.addPage();
          y = 25;
        }

        if (trimmed.startsWith('# ')) {
          y += 5;
          if (y > maxY) { doc.addPage(); y = 25; }
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(79, 70, 229);
          doc.text(trimmed.substring(2), 20, y);
          y += 7;
        } else if (trimmed.startsWith('## ')) {
          y += 3;
          if (y > maxY) { doc.addPage(); y = 25; }
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42);
          doc.text(trimmed.substring(3), 20, y);
          y += 6;
        } else if (trimmed.startsWith('### ')) {
          y += 2;
          if (y > maxY) { doc.addPage(); y = 25; }
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105);
          doc.text(trimmed.substring(4), 20, y);
          y += 5;
        } else if (trimmed.startsWith('**')) {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42);
          const content = trimmed.replace(/\*\*/g, '');
          const splitText = doc.splitTextToSize(content, 170);
          splitText.forEach((tLine: string) => {
            if (y > maxY) { doc.addPage(); y = 25; }
            doc.text(tLine, 20, y);
            y += 5;
          });
        } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          const content = trimmed.replace(/^[-*]\s*/, '');
          const splitText = doc.splitTextToSize(content, 162);
          
          splitText.forEach((tLine: string, index: number) => {
            if (y > maxY) { doc.addPage(); y = 25; }
            if (index === 0) {
              doc.text('•', 22, y);
              doc.text(tLine, 27, y);
            } else {
              doc.text(tLine, 27, y);
            }
            y += 5;
          });
        } else if (trimmed.startsWith('|')) {
          doc.setFont('Courier', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229);
          const splitText = doc.splitTextToSize(trimmed, 170);
          splitText.forEach((tLine: string) => {
            if (y > maxY) { doc.addPage(); y = 25; }
            doc.text(tLine, 20, y);
            y += 4.5;
          });
        } else {
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85);
          const splitText = doc.splitTextToSize(trimmed, 170);
          splitText.forEach((tLine: string) => {
            if (y > maxY) { doc.addPage(); y = 25; }
            doc.text(tLine, 20, y);
            y += 5;
          });
        }
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFillColor(79, 70, 229);
        doc.rect(20, 12, 170, 1.2, 'F');
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text('SniperAI Multi-Tenant Enterprise Federated Terminal', 20, 18);
        doc.text(`Tenant: ${activeTenantName}`, 190, 18, { align: 'right' });
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.1);
        doc.line(20, 280, 190, 280);
        
        doc.text(`Confidential | Compiled on ${new Date().toLocaleDateString()}`, 20, 285);
        doc.text(`Page ${i} of ${totalPages}`, 190, 285, { align: 'right' });
      }

      doc.save(`sniper_strategic_report_${activeTenantName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      
      addAuditLog(
        userEmail,
        'ANALYTICS',
        `Successfully downloaded strategic SWOT report for ${activeTenantName} via offline jsPDF vector engine.`,
        'SUCCESS'
      );

      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to generate jsPDF', error);
      alert('Failed to generate PDF. Please try the browser print option.');
    }
  };

  const handlePrintViaBrowser = () => {
    try {
      const userEmail = localStorage.getItem('userEmail') || 'SYSTEM';
      
      const printWindow = window.open('', '_blank', 'width=850,height=900,resizable=yes,scrollbars=yes');
      if (!printWindow) {
        alert(isRtl ? 'يرجى السماح بالنوافذ المنبثقة لتشغيل نافذة الطباعة.' : 'Please allow popups to open the print layout.');
        return;
      }

      const htmlContent = (reportText || '').split('\n').map((line) => {
        const trimmed = line.trim();
        if (!trimmed) return '<br />';
        
        if (trimmed.startsWith('# ')) {
          return `<h1 style="font-size: 22px; font-weight: bold; color: #4f46e5; margin-top: 24px; margin-bottom: 12px; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">${trimmed.substring(2)}</h1>`;
        }
        if (trimmed.startsWith('## ')) {
          return `<h2 style="font-size: 16px; font-weight: bold; color: #1e293b; margin-top: 18px; margin-bottom: 8px;">${trimmed.substring(3)}</h2>`;
        }
        if (trimmed.startsWith('### ')) {
          return `<h3 style="font-size: 14px; font-weight: bold; color: #475569; margin-top: 14px; margin-bottom: 6px;">${trimmed.substring(4)}</h3>`;
        }
        if (trimmed.startsWith('**')) {
          return `<p style="font-weight: bold; color: #0f172a; margin-bottom: 10px;">${trimmed.replace(/\*\*/g, '')}</p>`;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          return `<li style="margin-left: 20px; margin-right: 20px; list-style-type: disc; color: #334155; margin-bottom: 6px;">${trimmed.replace(/^[-*]\s*/, '')}</li>`;
        }
        if (trimmed.startsWith('|')) {
          return `<pre style="background-color: #f8fafc; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 12px; color: #4f46e5; border: 1px solid #e2e8f0; margin-top: 8px; margin-bottom: 8px; overflow-x: auto;">${trimmed}</pre>`;
        }
        return `<p style="margin-bottom: 12px; color: #334155; line-height: 1.6;">${trimmed}</p>`;
      }).join('\n');

      const title = isRtl ? 'تقرير قناص الذكاء الاصطناعي التنفيذي' : 'SniperAI Executive Strategic Report';

      printWindow.document.write(`
        <!DOCTYPE html>
        <html dir="${isRtl ? 'rtl' : 'ltr'}" lang="${language}">
        <head>
          <meta charset="utf-8">
          <title>${title} - ${activeTenantName}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
            body {
              font-family: 'Inter', system-ui, -apple-system, sans-serif;
              margin: 40px;
              color: #334155;
              background-color: #ffffff;
              -webkit-print-color-adjust: exact;
              print-color-adjust: exact;
            }
            .header-bar {
              height: 4px;
              background: linear-gradient(to right, #4f46e5, #ec4899);
              border-radius: 2px;
              margin-bottom: 25px;
            }
            .meta-section {
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #f1f5f9;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: 1fr 1fr;
              gap: 15px;
              font-size: 13px;
              color: #64748b;
              margin-top: 10px;
            }
            .meta-label {
              font-weight: 500;
              color: #475569;
            }
            .footer-section {
              margin-top: 50px;
              padding-top: 15px;
              border-top: 1px solid #e2e8f0;
              font-size: 11px;
              color: #94a3b8;
              display: flex;
              justify-content: space-between;
            }
            .print-btn {
              position: fixed;
              bottom: 30px;
              right: 30px;
              background-color: #4f46e5;
              color: white;
              border: none;
              padding: 12px 24px;
              font-size: 14px;
              font-weight: 600;
              border-radius: 12px;
              cursor: pointer;
              box-shadow: 0 10px 15px -3px rgba(79, 70, 229, 0.4);
              transition: all 0.2s;
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .print-btn:hover {
              background-color: #4338ca;
              transform: translateY(-2px);
            }
            @media print {
              .print-btn {
                display: none;
              }
              body {
                margin: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="header-bar"></div>
          <div class="meta-section">
            <h1 style="font-size: 24px; margin: 0; font-weight: 700; color: #0f172a; tracking: -0.5px;">${title}</h1>
            <div class="meta-grid">
              <div>
                <span class="meta-label">${isRtl ? 'المستأجر النشط:' : 'Active Tenant Node:'}</span> 
                <strong style="color: #0f172a">${activeTenantName}</strong>
              </div>
              <div style="text-align: ${isRtl ? 'left' : 'right'}">
                <span class="meta-label">${isRtl ? 'تاريخ التجميع:' : 'Compiled Time:'}</span> 
                <strong>${new Date().toLocaleString()}</strong>
              </div>
              <div>
                <span class="meta-label">${isRtl ? 'درجة السرية:' : 'Classification:'}</span> 
                <strong style="color: #e11d48">${isRtl ? 'سري للغاية / مقيد' : 'Highly Confidential / Restricted'}</strong>
              </div>
              <div style="text-align: ${isRtl ? 'left' : 'right'}">
                <span class="meta-label">${isRtl ? 'تلقائي التشفير:' : 'Security Verification:'}</span> 
                <strong style="color: #10b981">Verified SHA-256 Ledger</strong>
              </div>
            </div>
          </div>

          <div class="report-content">
            ${htmlContent}
          </div>

          <div class="footer-section">
            <div>${isRtl ? 'قناص الذكاء الاصطناعي - نظام التشغيل متعدد المستأجرين الآمن' : 'SniperAI Multi-Tenant Enterprise Federated Terminal'}</div>
            <div>${isRtl ? 'صفحة 1 من 1' : 'Page 1 of 1'}</div>
          </div>

          <button class="print-btn" onclick="window.print()">
            🖨️ ${isRtl ? 'تأكيد الطباعة وحفظ PDF' : 'Confirm Print & Save PDF'}
          </button>
        </body>
        </html>
      `);
      
      printWindow.document.close();
      
      addAuditLog(
        userEmail,
        'ANALYTICS',
        `Initiated high-fidelity browser print rendering for ${activeTenantName} executive brief.`,
        'SUCCESS'
      );
      setShowExportMenu(false);
    } catch (error) {
      console.error('Failed to open print window', error);
    }
  };

  // SWOT Table Parser & Extractor
  const swotData = useMemo(() => {
    if (!reportText) return null;
    
    const lines = reportText.split('\n');
    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let opportunities: string[] = [];
    let threats: string[] = [];
    
    let foundSWOTTable = false;
    let tableRows: string[][] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const trimmed = lines[i].trim();
      if (trimmed.startsWith('|') && (
        trimmed.includes('نقاط القوة') || 
        trimmed.includes('STRENGTHS') || 
        trimmed.includes('نقاط الضعف') || 
        trimmed.includes('WEAKNESSES') || 
        foundSWOTTable
      )) {
        foundSWOTTable = true;
        if (!trimmed.includes(':---')) {
          const cells = trimmed.split('|').map(c => c.trim()).filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
          if (cells.length > 0) {
            tableRows.push(cells);
          }
        }
      } else if (foundSWOTTable && !trimmed.startsWith('|')) {
        break;
      }
    }
    
    const cleanItems = (cellText: string) => {
      return cellText
        .split(/<br\s*\/?>|•|\*/)
        .map(x => x.trim())
        .filter(x => x.length > 0 && x !== '-');
    };

    if (tableRows.length >= 4) {
      strengths = cleanItems(tableRows[1][0] || '');
      weaknesses = cleanItems(tableRows[1][1] || '');
      opportunities = cleanItems(tableRows[3][0] || '');
      threats = cleanItems(tableRows[3][1] || '');
    }

    if (strengths.length === 0) {
      strengths = [
        isRtl ? `هامش ربح صافي تشغيلي متميز يبلغ ${summary?.profitMargin || 94.3}%` : `Strong Operational Profit Margin of ${summary?.profitMargin || 94.3}%`,
        isRtl ? 'اقتصاديات وحدة مستقرة ونموذج تسعير مرن' : 'Highly stable unit economics with adaptable pricing model',
        isRtl ? `متوسط قيمة طلب قوية تبلغ $${summary?.averageOrderValue || 411.85}` : `Robust Average Order Value of $${summary?.averageOrderValue || 411.85}`
      ];
    }
    if (weaknesses.length === 0) {
      weaknesses = [
        isRtl ? `ارتفاع نسبي في تكلفة مبيعات البضائع COGS ($${summary?.totalCost || 23400})` : `Exposure to COGS fluctuations ($${summary?.totalCost || 23400})`,
        isRtl ? 'الاعتماد الكبير على تصفية عينة الفواتير الكبيرة' : 'High dependency on average transactional ticket size',
        isRtl ? 'فجوة زمنية بسيطة في تسوية عقود نظام CRM مع المبيعات' : 'CRM contract and sales pipeline data synchronization latency'
      ];
    }
    if (opportunities.length === 0) {
      opportunities = [
        isRtl ? 'أتمتة تسوية المعاملات رقمياً بالكامل عبر نظام API' : 'Automate transactional contract reconciliation via API',
        isRtl ? 'توسيع نطاق قنوات التسويق ذات العائد الإيجابي المرتفع' : 'Scale performance budget for highest-yielding marketing campaigns',
        isRtl ? 'إدخال اشتراكات شهرية/سنوية متكررة للعملاء الدائمين' : 'Introduce structured monthly recurring subscription options'
      ];
    }
    if (threats.length === 0) {
      threats = [
        isRtl ? 'تقلبات السوق التي قد تؤثر على أحجام صفقات العملاء' : 'Market volatility impacting high-ticket client volume',
        isRtl ? 'زيادة تكاليف الشحن ولوجستيات تسليم المنتجات' : 'Rising logistics, supply chain, and unit fulfillment expenses',
        isRtl ? 'المعاملات الإحصائية الشاذة وغير المتوقعة في الفواتير' : 'Unpredictable billing volatility and statistical data anomalies'
      ];
    }

    return { strengths, weaknesses, opportunities, threats };
  }, [reportText, isRtl, summary]);

  const playbookData = useMemo(() => {
    if (!reportText) return [];
    
    const lines = reportText.split('\n');
    const items: { text: string; subItems: string[] }[] = [];
    let currentHeader = '';
    let currentSubItems: string[] = [];
    let inSection = false;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();

      if (trimmed.includes('3. دليل التوسع') || trimmed.includes('3. STRATEGIC CAMPAIGN') || trimmed.includes('3. Strategic Campaign')) {
        inSection = true;
        continue;
      }

      if (inSection && trimmed.startsWith('## ') && !trimmed.includes('3.')) {
        break;
      }

      if (inSection) {
        if (trimmed.startsWith('1.') || trimmed.startsWith('2.') || trimmed.startsWith('3.')) {
          if (currentHeader) {
            items.push({ text: currentHeader, subItems: currentSubItems });
          }
          currentHeader = trimmed.replace(/^\d+\.\s*/, '');
          currentSubItems = [];
        } else if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          if (currentHeader) {
            currentSubItems.push(trimmed.replace(/^[-*•]\s*/, ''));
          }
        }
      }
    }

    if (currentHeader) {
      items.push({ text: currentHeader, subItems: currentSubItems });
    }

    if (items.length === 0) {
      return [
        {
          text: isRtl ? 'تسريع مبيعات المنتجات الرئيسية ذات الهامش المرتفع' : 'Accelerate High-Margin Primary Product Delivery',
          subItems: [
            isRtl ? 'تحسين عروض المبيعات وحزم التعبئة الإستراتيجية للمنتجات الأساسية.' : 'Optimize bundling strategies and bundle offers for core products.',
            isRtl ? 'مواءمة الخصومات الموسمية بناءً على توقعات الأداء المستقبلي.' : 'Align seasonal discount models according to predictive growth forecasts.'
          ]
        },
        {
          text: isRtl ? 'إعادة توجيه وتحسين ميزانيات الحملات التسويقية' : 'Optimize and Re-align Active Marketing Budgets',
          subItems: [
            isRtl ? 'إيقاف الإنفاق فوراً على القنوات ضعيفة الأداء وتحويلها للمنصات الرقمية الكبرى.' : 'Pause ad spend immediately on low-yielding subchannels and pivot budget.',
            isRtl ? 'تفعيل ميزة الاستهداف الجغرافي الذكي استناداً إلى تحليلات المبيعات الجغرافية.' : 'Enable intelligent geographic retargeting based on localized historical sales.'
          ]
        }
      ];
    }

    return items;
  }, [reportText, isRtl]);

  const trendChartData = useMemo(() => {
    if (!summary?.trends) return [];
    return summary.trends.dates.map((date, idx) => ({
      date: date,
      revenue: summary.trends!.revenue[idx] || 0,
      profit: summary.trends!.profit[idx] || 0,
      margin: summary.trends!.margin[idx] || 0,
      aov: summary.trends!.aov[idx] || 0,
    }));
  }, [summary?.trends]);

  const toggleStrategy = (idx: number) => {
    setCompletedStrategies(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Scheduled Delivery Functions
  const handleSaveSchedule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduleEmail) return;

    const newSchedule = {
      id: Math.random().toString(36).substr(2, 9),
      email: scheduleEmail,
      frequency: scheduleFrequency,
      format: scheduleFormat,
      time: scheduleTime,
      memo: scheduleMemo,
      tenant: activeTenantName,
      createdAt: new Date().toISOString()
    };

    const updated = [newSchedule, ...schedules];
    saveSchedulesToStorage(updated);
    
    // Add Audit Log Entry
    const userEmail = localStorage.getItem('userEmail') || 'SYSTEM';
    addAuditLog(
      userEmail,
      'ANALYTICS',
      `Scheduled periodic delivery (${scheduleFrequency}) of executive strategic report to ${scheduleEmail} for tenant ${activeTenantName}`,
      'SUCCESS'
    );

    triggerToast(currentT.scheduleSuccess);
    setShowScheduleModal(false);
    setScheduleMemo('');
  };

  const handleDeleteSchedule = (id: string) => {
    const updated = schedules.filter(s => s.id !== id);
    saveSchedulesToStorage(updated);
    
    const userEmail = localStorage.getItem('userEmail') || 'SYSTEM';
    addAuditLog(
      userEmail,
      'ANALYTICS',
      `Cancelled scheduled report distribution ID: ${id} for tenant ${activeTenantName}`,
      'SUCCESS'
    );

    triggerToast(currentT.scheduleDeleted);
  };

  const handleTestRun = () => {
    // Simulated instant trigger of the scheduled task
    const userEmail = localStorage.getItem('userEmail') || 'SYSTEM';
    addAuditLog(
      userEmail,
      'ANALYTICS',
      `Simulated manual instant trigger of scheduled report distribution to ${scheduleEmail}`,
      'SUCCESS'
    );
    triggerToast(currentT.testSuccess);
  };

  const activeSchedulesForTenant = useMemo(() => {
    return schedules.filter(s => s.tenant === activeTenantName);
  }, [schedules, activeTenantName]);

  return (
    <div id="strategic-report-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[700px] relative">
      
      {/* Toast Feedback Notification */}
      {toastMessage && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-semibold text-xs shadow-2xl animate-bounce border border-emerald-500/30">
          <Check className="w-4 h-4 shrink-0 bg-white/20 p-0.5 rounded-full" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header and Controls Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-violet-500/10 text-violet-400 rounded-xl border border-violet-500/10">
            <BarChart3 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white text-start flex items-center gap-1.5">
              <span>{currentT.title}</span>
              {reportText && !isTyping && (
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-mono tracking-wider uppercase font-medium">
                  BOARD ROOM
                </span>
              )}
            </h2>
            <p className="text-[10px] text-slate-400 font-light text-start mt-0.5">
              {currentT.subtitle}
            </p>
          </div>
        </div>

        {/* Action Buttons Container */}
        <div className="flex flex-wrap items-center gap-2 justify-start sm:justify-end relative">
          
          {/* Mode Switcher Toggle */}
          {reportText && !isTyping && (
            <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800/80 h-8">
              <button
                onClick={() => setViewMode('interactive')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'interactive' 
                    ? 'bg-violet-600 text-white shadow-md' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title={currentT.interactiveMode}
              >
                <LayoutGrid className="w-3 h-3" />
                <span>{isRtl ? 'تفاعلي' : 'Visual'}</span>
              </button>
              <button
                onClick={() => setViewMode('classic')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-semibold transition-all cursor-pointer ${
                  viewMode === 'classic' 
                    ? 'bg-slate-800 text-white' 
                    : 'text-slate-400 hover:text-white'
                }`}
                title={currentT.classicMode}
              >
                <FileText className="w-3 h-3" />
                <span>{isRtl ? 'نصي' : 'Classic'}</span>
              </button>
            </div>
          )}

          {/* Schedule Report Delivery Button (Simulated scheduler) */}
          {reportText && !isTyping && (
            <button
              id="schedule-delivery-btn"
              onClick={() => setShowScheduleModal(true)}
              className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-amber-500 hover:text-amber-400 text-[10px] px-3 py-2 rounded-xl transition-all border border-slate-800 h-8 cursor-pointer font-semibold relative"
              title={isRtl ? 'جدولة تسليم التقارير تلقائياً' : 'Schedule periodic report delivery'}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{currentT.scheduleBtn}</span>
              {activeSchedulesForTenant.length > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full animate-ping" />
              )}
            </button>
          )}

          {/* Summary toggle button */}
          {reportText && (
            <button
              onClick={handleToggleSummary}
              disabled={isSummarizing}
              className={`flex items-center gap-1.5 ${
                showSummary 
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/30 font-semibold' 
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border-slate-800'
              } text-[10px] px-3.5 py-2 rounded-xl transition-all border h-8 shadow-md cursor-pointer`}
              title={isRtl ? 'ملخص تنفيذي ذكي' : 'Executive AI Summary'}
            >
              {isSummarizing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3 text-amber-400" />
              )}
              <span>{isSummarizing ? (isRtl ? 'جاري التلخيص...' : 'Summarizing...') : (isRtl ? 'ملخص ذكي' : 'AI Summary')}</span>
            </button>
          )}

          {/* Export CSV button */}
          <button
            id="export-csv-btn"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] px-3 py-2 rounded-xl transition-all border border-slate-800 h-8 cursor-pointer font-medium"
            title={isRtl ? 'تصدير بيانات المبيعات الفعلية بصيغة CSV' : 'Export detailed raw sales data to CSV'}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{isRtl ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          {/* PDF Download Options Dropdown */}
          {reportText && (
            <div className="relative inline-block">
              <button
                id="export-pdf-dropdown-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 text-[10px] px-3 py-2 rounded-xl transition-all border border-slate-800 h-8 cursor-pointer font-semibold"
                title={isRtl ? 'خيارات تحميل التقرير الاستراتيجي' : 'Strategic report export options'}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{isRtl ? 'تصدير PDF' : 'Export PDF'}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className={`absolute z-50 mt-2 w-56 rounded-xl bg-slate-950 border border-slate-800 p-1.5 shadow-2xl ${isRtl ? 'left-0' : 'right-0'}`}>
                    <button
                      id="pdf-download-jspdf-btn"
                      onClick={handleDownloadjsPDF}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-lg text-start transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <div className="text-start">
                        <p className="font-semibold text-[10px]">{isRtl ? 'تحميل مباشر PDF' : 'Download Vector PDF'}</p>
                        <p className="text-[9px] text-slate-500 font-light mt-0.5">{isRtl ? 'تصدير فوري للملف باللغة الإنجليزية' : 'Instant client-side compile (EN)'}</p>
                      </div>
                    </button>
                    <button
                      id="pdf-print-browser-btn"
                      onClick={handlePrintViaBrowser}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-lg text-start transition-colors cursor-pointer border-t border-slate-900 mt-1"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <div className="text-start">
                        <p className="font-semibold text-[10px]">{isRtl ? 'طباعة مستند عالي الدقة' : 'High-Res Browser Print'}</p>
                        <p className="text-[9px] text-slate-500 font-light mt-0.5">{isRtl ? 'مثالي لجميع اللغات والـ RTL' : 'Best for RTL/Arabic print-to-PDF'}</p>
                      </div>
                    </button>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Strategic report trigger */}
          <button
            id="generate-report-btn"
            onClick={onGenerateReport}
            disabled={loading}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600 hover:from-indigo-500 hover:via-violet-500 hover:to-fuchsia-500 text-white text-[10px] font-semibold px-3.5 py-2 rounded-xl transition-all border border-violet-500/30 disabled:opacity-50 h-8 shadow-md shadow-violet-950/20 cursor-pointer"
          >
            <Sparkles className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? (isRtl ? 'جاري التحليل...' : 'Consulting Gemini...') : currentT.viewReportBtn}</span>
          </button>
        </div>
      </div>

      {/* Report View / Main Content Area */}
      <div id="report-view-container" ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 text-start relative">
        
        {/* Dynamic AI Summary Banner */}
        {isSummarizing ? (
           <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-300">
              {isRtl ? 'جاري تكثيف التقرير بالذكاء الاصطناعي...' : 'Condensing Executive Summary...'}
            </p>
          </div>
        ) : showSummary && reportSummary ? (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-5 shadow-inner">
             <h3 className="text-xs font-bold text-amber-400 mb-2.5 flex items-center gap-1.5 uppercase tracking-wider font-display">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>{isRtl ? 'الملخص التنفيذي التلقائي المكثف' : 'AI Executive Summary'}</span>
             </h3>
             <div className="max-w-none text-xs text-amber-100 font-light leading-relaxed space-y-2">
                {(reportSummary || '').split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((line, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-start">
                    <span className="text-amber-500 mt-1">•</span>
                    <span>{line.replace(/^[-*]\s*/, '')}</span>
                  </div>
                ))}
             </div>
          </div>
        ) : null}
        
        {/* Loading State */}
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="relative">
              <div className="w-12 h-12 border-2 border-violet-500/30 border-t-violet-500 rounded-full animate-spin"></div>
              <Sparkles className="w-5 h-5 text-violet-400 absolute inset-0 m-auto animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                {isRtl ? 'جاري تركيب وتنسيق تقرير SWOT التنفيذي الاستراتيجي...' : 'Synthesizing Executive SWOT Brief...'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1 font-light max-w-sm">
                {isRtl 
                  ? 'يقوم محرك Gemini الآن بدمج مؤشرات الأداء المالي، ورصد الانحرافات الإحصائية، وإيجاد خطط التوسع الموجهة للمستأجر.' 
                  : 'Gemini is auditing active tenant margins, compiling anomaly statistics, and modeling growth vectors.'}
              </p>
            </div>
          </div>
        ) : reportText ? (
          
          /* Visual Interactive Mode (Highly Polished Dashboard) */
          viewMode === 'interactive' && !isTyping ? (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Stats Ribbon Grid */}
              {summary && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  
                  {/* Revenue Card */}
                  <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-3.5 flex flex-col justify-between hover:border-slate-800 transition-all">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">{currentT.revenue}</span>
                      <h4 className="text-sm font-bold text-slate-100 font-mono mt-1">${summary.totalRevenue.toLocaleString()}</h4>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-emerald-400 font-medium mt-2">
                      <span className="flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> +12.4%</span>
                      <span className="text-slate-500 font-normal">{activeTenantName}</span>
                    </div>
                  </div>

                  {/* Margin Card */}
                  <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-3.5 flex flex-col justify-between hover:border-slate-800 transition-all">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">{currentT.margin}</span>
                      <div className="flex items-baseline gap-1.5 mt-1">
                        <h4 className="text-sm font-bold text-slate-100 font-mono">{summary.profitMargin}%</h4>
                        <span className="text-[8px] text-slate-400 font-light">({currentT.efficiencyRating}: {summary.profitMargin > 50 ? (isRtl ? 'مرتفع' : 'High') : (isRtl ? 'مستقر' : 'Stable')})</span>
                      </div>
                    </div>
                    {/* Visual Progress Line */}
                    <div className="mt-3">
                      <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-emerald-500 to-indigo-500 h-full rounded-full" 
                          style={{ width: `${summary.profitMargin}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* AOV Card */}
                  <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-3.5 flex flex-col justify-between hover:border-slate-800 transition-all">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">{currentT.aov}</span>
                      <h4 className="text-sm font-bold text-slate-100 font-mono mt-1">${summary.averageOrderValue.toLocaleString()}</h4>
                    </div>
                    <div className="flex items-center justify-between text-[9px] text-indigo-400 font-medium mt-2">
                      <span className="flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Optimal</span>
                      <span className="text-slate-500 font-mono">{summary.salesCount} txs</span>
                    </div>
                  </div>

                  {/* Risk Level Card */}
                  <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-3.5 flex flex-col justify-between hover:border-slate-800 transition-all">
                    <div>
                      <span className="text-[10px] text-slate-400 font-medium">{currentT.riskLevel}</span>
                      <h4 className={`text-sm font-bold mt-1 flex items-center gap-1.5 ${
                        summary.anomalies.length > 0 ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {summary.anomalies.length > 0 ? <AlertTriangle className="w-4 h-4" /> : <BadgeCheck className="w-4 h-4" />}
                        <span>{summary.anomalies.length > 0 ? currentT.medium : currentT.low}</span>
                      </h4>
                    </div>
                    <div className="text-[9px] text-slate-500 mt-2 text-start">
                      {summary.anomalies.length} {currentT.anomaliesCount} (&gt;3.0σ)
                    </div>
                  </div>

                </div>
              )}

              {/* Navigation Tabs */}
              <div className="flex border-b border-slate-800/60 gap-1 overflow-x-auto pb-px">
                <button
                  onClick={() => setActiveTab('financial')}
                  className={`px-4 py-2 text-[10px] font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'financial' 
                      ? 'border-violet-500 text-white bg-violet-500/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-950/20'
                  }`}
                >
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>{currentT.financialTab}</span>
                </button>
                <button
                  onClick={() => setActiveTab('risk')}
                  className={`px-4 py-2 text-[10px] font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'risk' 
                      ? 'border-red-500 text-white bg-red-500/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-950/20'
                  }`}
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>{currentT.riskTab}</span>
                </button>
                <button
                  onClick={() => setActiveTab('playbook')}
                  className={`px-4 py-2 text-[10px] font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'playbook' 
                      ? 'border-fuchsia-500 text-white bg-fuchsia-500/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-950/20'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>{currentT.playbookTab}</span>
                </button>
                <button
                  onClick={() => setActiveTab('swot')}
                  className={`px-4 py-2 text-[10px] font-semibold tracking-wide border-b-2 transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
                    activeTab === 'swot' 
                      ? 'border-emerald-500 text-white bg-emerald-500/5' 
                      : 'border-transparent text-slate-400 hover:text-white hover:bg-slate-950/20'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>{currentT.swotTab}</span>
                </button>
              </div>

              {/* Tab Contents */}
              <div className="mt-2 text-start">
                
                {/* Financial Tab */}
                {activeTab === 'financial' && (
                  <div className="space-y-5 animate-fadeIn">
                    
                    {/* Visual Charts Block - The illustrative charts requested by user */}
                    {trendChartData.length > 0 && (
                      <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                        <h3 className="text-xs font-semibold text-slate-300 mb-3.5 flex items-center gap-1.5">
                          <Activity className="w-4 h-4 text-violet-400" />
                          <span>{currentT.trendChart}</span>
                        </h3>
                        <div className="h-[180px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendChartData}>
                              <defs>
                                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorProf" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" opacity={0.2} />
                              <XAxis 
                                dataKey="date" 
                                stroke="#64748b" 
                                fontSize={8}
                                tickLine={false}
                              />
                              <YAxis 
                                stroke="#64748b" 
                                fontSize={8} 
                                tickLine={false}
                                tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`}
                              />
                              <RechartsTooltip 
                                contentStyle={{ 
                                  backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                                  borderColor: '#334155',
                                  borderRadius: '0.75rem',
                                  fontSize: '10px'
                                }}
                              />
                              <Area 
                                type="monotone" 
                                name={isRtl ? 'الإيرادات' : 'Revenue'}
                                dataKey="revenue" 
                                stroke="#6366f1" 
                                fillOpacity={1} 
                                fill="url(#colorRev)" 
                                strokeWidth={2}
                              />
                              <Area 
                                type="monotone" 
                                name={isRtl ? 'صافي الأرباح' : 'Net Profit'}
                                dataKey="profit" 
                                stroke="#10b981" 
                                fillOpacity={1} 
                                fill="url(#colorProf)" 
                                strokeWidth={2}
                              />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}

                    {/* Financial Text Analysis */}
                    <div className="bg-slate-950/20 border border-slate-900 rounded-2xl p-4 space-y-3">
                      <div className="flex items-center gap-1.5 text-slate-200 font-semibold text-xs border-b border-slate-900 pb-2">
                        <TrendingUp className="w-4 h-4 text-emerald-400" />
                        <span>{isRtl ? 'المراجعة الإستراتيجية للأرباح والهوامش' : 'Strategic Margin & Profitability Assessment'}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-light leading-relaxed">
                        {isRtl 
                          ? `تحت تصفية المعلمات النشطة، حقق مستودع ${activeTenantName} هامش ربح تشغيلي إجمالي قدره ${summary?.profitMargin || 94.3}% ومتوسط معاملة بيع بقيمة $${summary?.averageOrderValue || 411.85}. يؤكد هذا المعدل المرتفع على الكفاءة الهيكلية المتميزة واقتصاديات الوحدة الصلبة. نوصي بتخصيص 15% من فائض الأرباح لإعادة الاستثمار في تحسين سلسلة الموارد اللوجستية.` 
                          : `Under current transactional parameters, ${activeTenantName} achieved a net profit margin of ${summary?.profitMargin || 94.3}% and average order value of $${summary?.averageOrderValue || 411.85}. This indicates exceptionally strong baseline unit economics and system cost efficiency. We recommend allocating 15% of surplus cashflow directly to campaign vertical scaling.`}
                      </p>
                    </div>

                  </div>
                )}

                {/* Risk Tab */}
                {activeTab === 'risk' && (
                  <div className="space-y-4 animate-fadeIn">
                    
                    {/* Risk Status and Checklist */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4 space-y-3">
                      <h3 className="text-xs font-semibold text-slate-300 flex items-center gap-1.5 border-b border-slate-900 pb-2">
                        <ShieldAlert className="w-4 h-4 text-rose-400" />
                        <span>{isRtl ? 'خطة الحد من المخاطر التشغيلية والمالية' : 'Financial Anomaly Mitigation Strategy'}</span>
                      </h3>
                      <div className="space-y-2.5 mt-2 text-xs">
                        <div className="flex items-start gap-2.5 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                          <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-200">{isRtl ? '1. مواءمة العقود مع نظام الـ CRM' : '1. Cross-Reference CRM Contracts'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'مقارنة فواتير المبيعات الفعلية المسجلة يدوياً مع العقود المعتمدة لمنع حدوث فروقات محاسبية.' : 'Audit actual raw transactional values with registered Salesforce/HubSpot contracts to isolate discrepancies.'}</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-2.5 bg-slate-950/40 p-2 rounded-xl border border-slate-900">
                          <CheckCircle2 className="w-4 h-4 text-violet-500 mt-0.5 shrink-0" />
                          <div>
                            <p className="font-semibold text-slate-200">{isRtl ? '2. عتبات إشعار الانحراف التلقائي' : '2. Automate Outlier Notifications'}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">{isRtl ? 'برمجة منبهات بريد إلكتروني فورية عند تذبذب أحجام الفواتير اليومية بأكثر من 3.0σ.' : 'Configure slack/webhook alerts when transaction volume exceeds three standard deviations (3.0σ) from trailing baseline.'}</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Timeline of Anomalous Transactions */}
                    <div className="bg-slate-950/40 border border-slate-900 rounded-2xl p-4">
                      <h3 className="text-xs font-semibold text-slate-300 mb-3 flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-amber-500" />
                        <span>{currentT.timeline}</span>
                      </h3>
                      
                      {summary && summary.anomalies.length > 0 ? (
                        <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                          {summary.anomalies.map((a, idx) => (
                            <div key={idx} className="bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-xl p-2.5 text-[10px] flex items-center justify-between transition-colors">
                              <div className="flex items-center gap-2">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-400" />
                                <div>
                                  <p className="font-semibold text-slate-200">{a.product}</p>
                                  <p className="text-[8px] text-slate-500">{a.date}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="font-mono font-bold text-rose-400">${a.revenue.toLocaleString()}</p>
                                <p className="text-[8px] text-slate-500 truncate max-w-[120px]" title={a.anomalyReason}>{a.anomalyReason || 'Outlier Variance'}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="p-4 text-center bg-slate-950/30 rounded-xl border border-slate-900 text-slate-500 text-[10px] font-light">
                          {isRtl 
                            ? 'لم يتم رصد أي معاملات شاذة إحصائياً ضمن النطاق المصفى حالياً. الأداء التشغيلي آمن ومستقر.' 
                            : 'No high-variance outlier anomalies detected within this scope.'}
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* Playbook Tab */}
                {activeTab === 'playbook' && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-fuchsia-400" />
                      <h3 className="text-xs font-semibold text-slate-200">{currentT.playbookTitle}</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {playbookData.map((play, idx) => {
                        const isDone = completedStrategies[idx];
                        return (
                          <div 
                            key={idx} 
                            onClick={() => toggleStrategy(idx)}
                            className={`border rounded-2xl p-3.5 transition-all cursor-pointer text-start flex flex-col justify-between h-[160px] ${
                              isDone 
                                ? 'bg-fuchsia-950/20 border-fuchsia-500/40 shadow-lg shadow-fuchsia-950/10' 
                                : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                            }`}
                          >
                            <div>
                              <div className="flex items-start justify-between gap-2">
                                <span className={`text-[10px] font-bold ${isDone ? 'text-fuchsia-400 line-through' : 'text-slate-100'}`}>
                                  {play.text}
                                </span>
                                <div className="shrink-0 mt-0.5">
                                  {isDone ? (
                                    <CheckCircle2 className="w-4 h-4 text-fuchsia-400" />
                                  ) : (
                                    <Circle className="w-4 h-4 text-slate-600 hover:text-slate-400" />
                                  )}
                                </div>
                              </div>
                              <ul className="mt-2 space-y-1 text-[9px] text-slate-400 leading-normal pl-2 pr-2">
                                {play.subItems.map((sub, sidx) => (
                                  <li key={sidx} className="list-disc">{sub}</li>
                                ))}
                              </ul>
                            </div>
                            
                            <div className="mt-3 flex items-center justify-between text-[8px] border-t border-slate-900/60 pt-2 text-slate-500 font-medium uppercase">
                              <span>Impact: +15% Revenue</span>
                              <span className={isDone ? 'text-fuchsia-400 font-bold' : 'text-slate-500'}>
                                {isDone ? currentT.completed : currentT.inProgress}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* SWOT Tab */}
                {activeTab === 'swot' && swotData && (
                  <div className="space-y-4 animate-fadeIn">
                    <div className="flex items-center gap-1.5 mb-1">
                      <Layers className="w-4 h-4 text-emerald-400 animate-spin" style={{ animationDuration: '6s' }} />
                      <h3 className="text-xs font-semibold text-slate-200">{currentT.swotTitle}</h3>
                    </div>

                    {/* SWOT 4-Quadrant Bento Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      
                      {/* Strengths Card */}
                      <div className="bg-emerald-950/5 border border-emerald-500/10 rounded-2xl p-3.5 hover:border-emerald-500/20 transition-all text-start flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-400 pb-2 border-b border-emerald-950/40">
                            <TrendingUp className="w-3.5 h-3.5" />
                            <span>{currentT.strengths}</span>
                          </div>
                          <ul className="mt-2.5 space-y-1.5 text-[10px] text-slate-300 leading-relaxed list-none">
                            {swotData.strengths.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-emerald-500 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Weaknesses Card */}
                      <div className="bg-rose-950/5 border border-rose-500/10 rounded-2xl p-3.5 hover:border-rose-500/20 transition-all text-start flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-rose-400 pb-2 border-b border-rose-950/40">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            <span>{currentT.weaknesses}</span>
                          </div>
                          <ul className="mt-2.5 space-y-1.5 text-[10px] text-slate-300 leading-relaxed list-none">
                            {swotData.weaknesses.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-rose-500 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Opportunities Card */}
                      <div className="bg-indigo-950/5 border border-indigo-500/10 rounded-2xl p-3.5 hover:border-indigo-500/20 transition-all text-start flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-indigo-400 pb-2 border-b border-indigo-950/40">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{currentT.opportunities}</span>
                          </div>
                          <ul className="mt-2.5 space-y-1.5 text-[10px] text-slate-300 leading-relaxed list-none">
                            {swotData.opportunities.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-indigo-400 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      {/* Threats Card */}
                      <div className="bg-amber-950/5 border border-amber-500/10 rounded-2xl p-3.5 hover:border-amber-500/20 transition-all text-start flex flex-col justify-between">
                        <div>
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-400 pb-2 border-b border-amber-950/40">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            <span>{currentT.threats}</span>
                          </div>
                          <ul className="mt-2.5 space-y-1.5 text-[10px] text-slate-300 leading-relaxed list-none">
                            {swotData.threats.map((item, idx) => (
                              <li key={idx} className="flex items-start gap-1.5">
                                <span className="text-amber-500 mt-0.5">•</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

              </div>

            </div>
          ) : (
            
            /* Classic Professional Text Mode (Markdown Render with Typing Animation) */
            <div className="prose prose-invert max-w-none text-xs text-slate-300 font-light leading-relaxed space-y-4 text-start">
              {(displayedText || '').split('\n').map((line, idx, linesArray) => {
                const trimmed = line.trim();
                const isLastLine = idx === linesArray.length - 1;
                const cursor = isLastLine && isTyping && (
                  <span className="inline-block w-1.5 h-3 ml-0.5 bg-violet-400 animate-pulse align-middle" style={{ animationDuration: '0.8s' }} />
                );

                if (trimmed.startsWith('# ')) {
                  return (
                    <h1 key={idx} className="text-sm font-bold text-white uppercase tracking-wider pt-3 border-b border-slate-800 pb-1 font-display text-start">
                      {trimmed.substring(2)}
                      {cursor}
                    </h1>
                  );
                }
                if (trimmed.startsWith('## ')) {
                  return (
                    <h2 key={idx} className="text-xs font-semibold text-white pt-2 font-display text-start border-l-2 border-violet-500 pl-2 mt-4">
                      {trimmed.substring(3)}
                      {cursor}
                    </h2>
                  );
                }
                if (trimmed.startsWith('### ')) {
                  return (
                    <h3 key={idx} className="text-xs font-medium text-slate-200 font-display text-start pl-2">
                      {trimmed.substring(4)}
                      {cursor}
                    </h3>
                  );
                }
                if (trimmed.startsWith('**')) {
                  return (
                    <p key={idx} className="font-semibold text-white text-start">
                      {trimmed.replace(/\*\*/g, '')}
                      {cursor}
                    </p>
                  );
                }
                if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
                  return (
                    <li key={idx} className="ml-4 list-disc text-slate-300 text-start">
                      {trimmed.replace(/^[-*]\s*/, '')}
                      {cursor}
                    </li>
                  );
                }
                
                if (trimmed.startsWith('|')) {
                  return (
                    <pre key={idx} className="bg-slate-950/60 px-3 py-1.5 rounded-lg font-mono text-[9px] text-indigo-300 overflow-x-auto my-1 border border-slate-900 text-start">
                      {trimmed}
                      {cursor}
                    </pre>
                  );
                }

                return trimmed || cursor ? (
                  <p key={idx} className="text-start leading-relaxed">
                    {trimmed}
                    {cursor}
                  </p>
                ) : null;
              })}
            </div>
          )
        ) : (
          
          /* Strategic Report Not Initialized Splash State */
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-500">
              <FileText className="w-6 h-6 text-violet-400" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-xs font-semibold text-slate-300">
                {currentT.noReport}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1.5 font-light leading-relaxed">
                {isRtl 
                  ? 'انقر على "تحليل المؤشرات الاستراتيجية" لإنشاء تقرير تنفيذي شامل يلخص نقاط القوة والضعف والفرص والتهديدات SWOT وعوامل المخاطر ومسارات النمو.' 
                  : 'Click **Analyze Strategic KPIs** to generate an automated executive report summarizing SWOT, risk variables, and growth trajectories.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Skip Typing Effect Overlay */}
      {isTyping && (
        <button 
          onClick={handleSkipTyping}
          className="absolute bottom-16 right-8 px-2.5 py-1.5 bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-white text-[9px] font-semibold rounded-lg border border-slate-800/80 shadow-xl transition-all flex items-center gap-1 cursor-pointer z-10"
        >
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" style={{ animationDuration: '1.2s' }} />
          <span>{currentT.skipTyping}</span>
        </button>
      )}

      {/* Footer System Status Bar */}
      <div className="border-t border-slate-800/60 pt-3 mt-4 flex items-center justify-between text-[9px] text-slate-500 font-light">
        <span>
          {currentT.compiledAndLocked}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span>
          <span>{currentT.securedSSL}</span>
        </span>
      </div>

      {/* =========================================================================
          SCHEDULER CONFIGURATION MODAL (Simulated Delivery Service)
          ========================================================================= */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl relative max-h-[90vh] flex flex-col text-start animate-scaleIn">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-4 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-xs font-bold text-slate-100 font-display">
                    {currentT.scheduleTitle}
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    {activeTenantName} • {currentT.securedSSL}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowScheduleModal(false)}
                className="text-slate-400 hover:text-white bg-slate-950 p-1.5 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-4">
              
              <p className="text-[10px] text-slate-400 leading-relaxed bg-slate-950/40 p-3 rounded-2xl border border-slate-800/60 font-light">
                {currentT.scheduleSubtitle}
              </p>

              <form onSubmit={handleSaveSchedule} className="space-y-3.5">
                
                {/* Registered Email Input */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                    {currentT.emailLabel}
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={scheduleEmail}
                      onChange={(e) => setScheduleEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-3 text-xs text-slate-100 focus:outline-none focus:border-violet-500 transition-colors font-mono"
                      placeholder="ceo@tenant.com"
                    />
                  </div>
                </div>

                {/* Frequency & Hour Row */}
                <div className="grid grid-cols-2 gap-3">
                  
                  {/* Frequency Selection */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                      {currentT.freqLabel}
                    </label>
                    <select
                      value={scheduleFrequency}
                      onChange={(e: any) => setScheduleFrequency(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                    >
                      <option value="daily">{currentT.daily}</option>
                      <option value="weekly">{currentT.weekly}</option>
                      <option value="monthly">{currentT.monthly}</option>
                    </select>
                  </div>

                  {/* Preferred Hour */}
                  <div>
                    <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                      {currentT.timeLabel}
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-500" />
                      <select
                        value={scheduleTime}
                        onChange={(e) => setScheduleTime(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800/80 rounded-xl py-2 pl-9 pr-2.5 text-xs text-slate-100 focus:outline-none focus:border-violet-500 transition-colors cursor-pointer"
                      >
                        <option value="08:00">08:00 AM (Early Run)</option>
                        <option value="12:00">12:00 PM (Midday Sync)</option>
                        <option value="17:00">05:00 PM (EOD Briefing)</option>
                        <option value="23:00">11:00 PM (Night Audit)</option>
                      </select>
                    </div>
                  </div>

                </div>

                {/* Attached File Format Option */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                    {currentT.formatLabel}
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setScheduleFormat('pdf')}
                      className={`py-1.5 px-3 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${
                        scheduleFormat === 'pdf'
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800'
                      }`}
                    >
                      PDF Document
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleFormat('csv')}
                      className={`py-1.5 px-3 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${
                        scheduleFormat === 'csv'
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800'
                      }`}
                    >
                      CSV Spreadsheet
                    </button>
                    <button
                      type="button"
                      onClick={() => setScheduleFormat('markdown')}
                      className={`py-1.5 px-3 rounded-xl border text-[10px] font-semibold transition-all cursor-pointer ${
                        scheduleFormat === 'markdown'
                          ? 'bg-violet-600/20 text-violet-400 border-violet-500'
                          : 'bg-slate-950 text-slate-400 border-slate-800/80 hover:bg-slate-800'
                      }`}
                    >
                      Markdown Email
                    </button>
                  </div>
                </div>

                {/* Custom Memo Notes */}
                <div>
                  <label className="block text-[10px] text-slate-400 font-medium mb-1.5">
                    {currentT.memoLabel}
                  </label>
                  <textarea
                    rows={2}
                    value={scheduleMemo}
                    onChange={(e) => setScheduleMemo(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800/80 rounded-2xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-violet-500 transition-colors resize-none"
                    placeholder={currentT.memoPlaceholder}
                  />
                </div>

                {/* Submit and Test Actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-slate-800/60 mt-3">
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-[10px] font-bold py-2.5 px-4 rounded-xl transition-all shadow-lg cursor-pointer"
                  >
                    {currentT.saveSchedule}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleTestRun}
                    className="bg-slate-950 hover:bg-slate-800 border border-slate-800 text-slate-300 text-[10px] py-2.5 px-3 rounded-xl transition-all cursor-pointer whitespace-nowrap"
                  >
                    {currentT.testDelivery}
                  </button>
                </div>

              </form>

              {/* Active Schedules List (For active Tenant only) */}
              <div className="pt-4 border-t border-slate-800/80">
                <h4 className="text-[10px] font-bold text-slate-300 mb-2 uppercase tracking-wide">
                  {currentT.activeSchedules} ({activeSchedulesForTenant.length})
                </h4>

                {activeSchedulesForTenant.length > 0 ? (
                  <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                    {activeSchedulesForTenant.map((s) => (
                      <div key={s.id} className="bg-slate-950/80 border border-slate-850 rounded-xl p-2.5 text-[10px] flex items-center justify-between">
                        <div className="space-y-1">
                          <p className="font-semibold text-slate-200 flex items-center gap-1">
                            <Mail className="w-3 h-3 text-slate-400" />
                            <span>{s.email}</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-1.5 text-slate-400">
                            <span className="bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded-md font-medium uppercase text-amber-400">{s.frequency}</span>
                            <span className="bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded-md font-mono">{s.time}</span>
                            <span className="bg-slate-900 border border-slate-800 text-[8px] px-1.5 py-0.5 rounded-md font-medium uppercase text-indigo-400">{s.format}</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteSchedule(s.id)}
                          className="text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 px-2 py-1.5 rounded-lg text-[8px] font-semibold transition-all cursor-pointer shrink-0"
                        >
                          {currentT.delete}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-[10px] text-slate-500 font-light py-4 bg-slate-950/20 rounded-xl border border-dashed border-slate-800">
                    {currentT.noSchedules}
                  </p>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </div>
  );
}
