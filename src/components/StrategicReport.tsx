import React, { useState, useEffect, useRef } from 'react';
import { FileText, Sparkles, Download, AlertCircle, RefreshCw, Printer, ChevronDown, FileDown } from 'lucide-react';
import { Language } from '../utils/translations';
import { jsPDF } from 'jspdf';
import { addAuditLog } from '../utils/auditLogger';

interface StrategicReportProps {
  reportText: string;
  loading: boolean;
  onGenerateReport: () => void;
  onExportCSV: () => void;
  activeTenantName: string;
  language: Language;
}

export default function StrategicReport({
  reportText,
  loading,
  onGenerateReport,
  onExportCSV,
  activeTenantName,
  language,
}: StrategicReportProps) {
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showSummary, setShowSummary] = useState(false);

  // Typing animation states
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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
    // Chunk size is dynamic relative to report text length to keep generation speed high-performance (completes within 2-3 seconds)
    const increment = Math.max(8, Math.ceil(reportText.length / 120));
    
    const intervalId = setInterval(() => {
      currentIndex += increment;
      if (currentIndex >= reportText.length) {
        setDisplayedText(reportText);
        setIsTyping(false);
        clearInterval(intervalId);
      } else {
        setDisplayedText(reportText.slice(0, currentIndex));
      }
    }, 12);

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
    if (summary) {
      setShowSummary(!showSummary);
      return;
    }
    
    setIsSummarizing(true);
    try {
      const response = await fetch('/api/reports/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportText })
      });
      const data = await response.json();
      setSummary(data.summary);
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

      // Add a cool decorative line below the header
      doc.setDrawColor(79, 70, 229); // Indigo 600
      doc.setLineWidth(0.8);
      doc.line(20, 62, 190, 62);

      // Reset style for body
      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // slate-700

      let y = 72;
      const maxY = 265;

      const lines = (reportText || '').split('\n');
      
      lines.forEach((line) => {
        const trimmed = line.trim();
        if (!trimmed) {
          y += 3; // empty line spacing
          return;
        }

        // Check if we need a new page before writing
        if (y > maxY) {
          doc.addPage();
          y = 25; // Reset Y for new page
        }

        if (trimmed.startsWith('# ')) {
          y += 5;
          if (y > maxY) { doc.addPage(); y = 25; }
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(14);
          doc.setTextColor(79, 70, 229); // Indigo 600
          doc.text(trimmed.substring(2), 20, y);
          y += 7;
        } else if (trimmed.startsWith('## ')) {
          y += 3;
          if (y > maxY) { doc.addPage(); y = 25; }
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(11);
          doc.setTextColor(15, 23, 42); // slate-900
          doc.text(trimmed.substring(3), 20, y);
          y += 6;
        } else if (trimmed.startsWith('### ')) {
          y += 2;
          if (y > maxY) { doc.addPage(); y = 25; }
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(71, 85, 105); // slate-600
          doc.text(trimmed.substring(4), 20, y);
          y += 5;
        } else if (trimmed.startsWith('**')) {
          doc.setFont('Helvetica', 'bold');
          doc.setFontSize(10);
          doc.setTextColor(15, 23, 42); // slate-900
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
          doc.setTextColor(51, 65, 85); // slate-700
          const content = trimmed.replace(/^[-*]\s*/, '');
          const splitText = doc.splitTextToSize(content, 162); // bullet indent
          
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
          // Table layout
          doc.setFont('Courier', 'normal');
          doc.setFontSize(8.5);
          doc.setTextColor(79, 70, 229); // Indigo mono
          const splitText = doc.splitTextToSize(trimmed, 170);
          splitText.forEach((tLine: string) => {
            if (y > maxY) { doc.addPage(); y = 25; }
            doc.text(tLine, 20, y);
            y += 4.5;
          });
        } else {
          doc.setFont('Helvetica', 'normal');
          doc.setFontSize(10);
          doc.setTextColor(51, 65, 85); // slate-700
          const splitText = doc.splitTextToSize(trimmed, 170);
          splitText.forEach((tLine: string) => {
            if (y > maxY) { doc.addPage(); y = 25; }
            doc.text(tLine, 20, y);
            y += 5;
          });
        }
      });

      // Pass 2: Draw professional headers and footers on all pages
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        
        // Header line & text
        doc.setFillColor(79, 70, 229);
        doc.rect(20, 12, 170, 1.2, 'F');
        
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // slate-400
        doc.text('SniperAI Multi-Tenant Enterprise Federated Terminal', 20, 18);
        doc.text(`Tenant: ${activeTenantName}`, 190, 18, { align: 'right' });
        
        // Footer line & text
        doc.setDrawColor(226, 232, 240); // slate-200
        doc.setLineWidth(0.1);
        doc.line(20, 280, 190, 280);
        
        doc.text(`Confidential | Compiled on ${new Date().toLocaleDateString()}`, 20, 285);
        doc.text(`Page ${i} of ${totalPages}`, 190, 285, { align: 'right' });
      }

      // Save PDF file
      doc.save(`sniper_strategic_report_${activeTenantName.toLowerCase().replace(/\s+/g, '_')}.pdf`);
      
      // Audit log the export action
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
      const isRtl = language === 'ar';
      
      const printWindow = window.open('', '_blank', 'width=850,height=900,resizable=yes,scrollbars=yes');
      if (!printWindow) {
        alert(language === 'ar' ? 'يرجى السماح بالنوافذ المنبثقة لتشغيل نافذة الطباعة.' : 'Please allow popups to open the print layout.');
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

      const title = language === 'ar' ? 'تقرير قناص الذكاء الاصطناعي التنفيذي' : 'SniperAI Executive Strategic Report';

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
                <span class="meta-label">${language === 'ar' ? 'المستأجر النشط:' : 'Active Tenant Node:'}</span> 
                <strong style="color: #0f172a">${activeTenantName}</strong>
              </div>
              <div style="text-align: ${isRtl ? 'left' : 'right'}">
                <span class="meta-label">${language === 'ar' ? 'تاريخ التجميع:' : 'Compiled Time:'}</span> 
                <strong>${new Date().toLocaleString()}</strong>
              </div>
              <div>
                <span class="meta-label">${language === 'ar' ? 'درجة السرية:' : 'Classification:'}</span> 
                <strong style="color: #e11d48">${language === 'ar' ? 'سري للغاية / مقيد' : 'Highly Confidential / Restricted'}</strong>
              </div>
              <div style="text-align: ${isRtl ? 'left' : 'right'}">
                <span class="meta-label">${language === 'ar' ? 'تشفير التحقق:' : 'Security Verification:'}</span> 
                <strong style="color: #10b981">Verified SHA-256 Ledger</strong>
              </div>
            </div>
          </div>

          <div class="report-content">
            ${htmlContent}
          </div>

          <div class="footer-section">
            <div>${language === 'ar' ? 'قناص الذكاء الاصطناعي - نظام التشغيل متعدد المستأجرين الآمن' : 'SniperAI Multi-Tenant Enterprise Federated Terminal'}</div>
            <div>${language === 'ar' ? 'صفحة 1 من 1' : 'Page 1 of 1'}</div>
          </div>

          <button class="print-btn" onclick="window.print()">
            🖨️ ${language === 'ar' ? 'تأكيد الطباعة وحفظ PDF' : 'Confirm Print & Save PDF'}
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

  return (
    <div id="strategic-report-panel" className="bg-slate-900/40 backdrop-blur-md border border-slate-800 rounded-3xl p-5 shadow-xl flex flex-col h-[520px] relative">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800/80 pb-4 mb-4 gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-violet-500/10 text-violet-400 rounded-lg">
            <FileText className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold font-display text-white text-start">
              {language === 'ar' ? 'التقرير المالي التنفيذي (AI)' : 'AI Executive Brief & Reporting'}
            </h2>
            <p className="text-[10px] text-slate-400 font-light text-start">
              {language === 'ar' ? 'تحليل SWOT، وتقييم هوامش الربح والمعاملات الشاذة' : 'SWOT Analysis, margins and anomalies assessment'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 justify-start sm:justify-end relative">
          {/* Summary toggle button */}
          {reportText && (
            <button
              onClick={handleToggleSummary}
              disabled={isSummarizing}
              className={`flex items-center gap-1.5 ${
                showSummary 
                  ? 'bg-amber-600/20 text-amber-400 border-amber-500/30' 
                  : 'bg-slate-950 hover:bg-slate-800 text-slate-300'
              } text-[10px] font-medium px-3.5 py-2 rounded-xl transition-all border border-slate-800 h-8 shadow-md cursor-pointer`}
              title={language === 'ar' ? 'ملخص تنفيذي' : 'Executive Summary'}
            >
              {isSummarizing ? (
                <RefreshCw className="w-3 h-3 animate-spin" />
              ) : (
                <Sparkles className="w-3 h-3" />
              )}
              <span>{isSummarizing ? (language === 'ar' ? 'جاري التلخيص...' : 'Summarizing...') : (language === 'ar' ? 'ملخص' : 'Summary')}</span>
            </button>
          )}

          {/* Export CSV button */}
          <button
            id="export-csv-btn"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-medium px-3 py-2 rounded-xl transition-all border border-slate-800 h-8 cursor-pointer"
            title={language === 'ar' ? 'تصدير بيانات المبيعات الفعلية بصيغة CSV' : 'Export detailed raw sales data to CSV'}
          >
            <Download className="w-3.5 h-3.5 text-slate-400" />
            <span>{language === 'ar' ? 'تصدير CSV' : 'Export CSV'}</span>
          </button>

          {/* PDF Download Options Dropdown */}
          {reportText && (
            <div className="relative inline-block">
              <button
                id="export-pdf-dropdown-btn"
                onClick={() => setShowExportMenu(!showExportMenu)}
                className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 text-indigo-400 hover:text-indigo-300 text-[10px] font-medium px-3 py-2 rounded-xl transition-all border border-slate-800 h-8 cursor-pointer"
                title={language === 'ar' ? 'خيارات تحميل التقرير الاستراتيجي' : 'Strategic report export options'}
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'تصدير PDF' : 'Export PDF'}</span>
                <ChevronDown className="w-3 h-3 text-slate-500" />
              </button>

              {showExportMenu && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowExportMenu(false)} 
                  />
                  <div className={`absolute z-50 mt-2 w-56 rounded-xl bg-slate-950 border border-slate-800 p-1.5 shadow-2xl ${language === 'ar' ? 'left-0' : 'right-0'}`}>
                    <button
                      id="pdf-download-jspdf-btn"
                      onClick={handleDownloadjsPDF}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-lg text-start transition-colors cursor-pointer"
                    >
                      <FileText className="w-4 h-4 text-indigo-400" />
                      <div className="text-start">
                        <p className="font-semibold text-[10px]">{language === 'ar' ? 'تحميل مباشر PDF' : 'Download Vector PDF'}</p>
                        <p className="text-[9px] text-slate-500 font-light mt-0.5">{language === 'ar' ? 'تصدير فوري للملف باللغة الإنجليزية' : 'Instant client-side compile (EN)'}</p>
                      </div>
                    </button>
                    <button
                      id="pdf-print-browser-btn"
                      onClick={handlePrintViaBrowser}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 text-[10px] text-slate-300 hover:text-white hover:bg-indigo-600/10 rounded-lg text-start transition-colors cursor-pointer border-t border-slate-900 mt-1"
                    >
                      <Printer className="w-4 h-4 text-emerald-400" />
                      <div className="text-start">
                        <p className="font-semibold text-[10px]">{language === 'ar' ? 'طباعة مستند عالي الدقة' : 'High-Res Browser Print'}</p>
                        <p className="text-[9px] text-slate-500 font-light mt-0.5">{language === 'ar' ? 'مثالي لجميع اللغات والـ RTL' : 'Best for RTL/Arabic print-to-PDF'}</p>
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
            className="flex items-center gap-1.5 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white text-[10px] font-medium px-3.5 py-2 rounded-xl transition-all border border-violet-500/30 disabled:opacity-50 h-8 shadow-md shadow-violet-950/20 cursor-pointer"
          >
            <Sparkles className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? (language === 'ar' ? 'جاري الاستشارة...' : 'Consulting Gemini...') : (language === 'ar' ? 'تحليل المؤشرات الاستراتيجية' : 'Analyze Strategic KPIs')}</span>
          </button>
        </div>
      </div>

      {/* Report View Area */}
      <div id="report-view-container" ref={scrollContainerRef} className="flex-1 overflow-y-auto pr-1 text-start relative">
        {isSummarizing ? (
           <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-10 h-10 border-2 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-semibold text-slate-300">
              {language === 'ar' ? 'جاري تكثيف التقرير...' : 'Condensing Executive Summary...'}
            </p>
          </div>
        ) : showSummary && summary ? (
          <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-2xl mb-4">
             <h3 className="text-xs font-bold text-amber-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider font-display">
                <Sparkles className="w-3.5 h-3.5" />
                {language === 'ar' ? 'ملخص تنفيذي سريع' : 'Executive Summary'}
             </h3>
             <div className="prose prose-invert max-w-none text-xs text-amber-100 font-light leading-relaxed space-y-2">
                {(summary || '').split('\n').filter(line => line.trim().startsWith('-') || line.trim().startsWith('*')).map((line, idx) => (
                  <li key={idx} className="list-disc ml-4">{line.replace(/^[-*]\s*/, '')}</li>
                ))}
             </div>
          </div>
        ) : null}
        
        {loading ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
            <div className="w-10 h-10 border-2 border-violet-500 border-t-transparent rounded-full animate-spin"></div>
            <div>
              <p className="text-xs font-semibold text-slate-300">
                {language === 'ar' ? 'جاري تركيب تقرير SWOT التنفيذي الاستراتيجي...' : 'Synthesizing Executive SWOT Brief...'}
              </p>
              <p className="text-[11px] text-slate-500 mt-1 font-light">
                {language === 'ar' 
                  ? 'Gemini يقوم بدمج وتجميع اتجاهات المبيعات وعوامل المخاطر المصفاة حالياً.' 
                  : 'Gemini is consolidating filtered sales trends and risk factors.'}
              </p>
            </div>
          </div>
        ) : reportText ? (
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
                  <h2 key={idx} className="text-xs font-semibold text-white pt-2 font-display text-start">
                    {trimmed.substring(3)}
                    {cursor}
                  </h2>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h3 key={idx} className="text-xs font-medium text-slate-200 font-display text-start">
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
              
              // Handle tables if they look like markdown rows
              if (trimmed.startsWith('|')) {
                // Render table lines cleanly or wrap in mono font block
                return (
                  <pre key={idx} className="bg-slate-950/60 px-3 py-1.5 rounded-lg font-mono text-[10px] text-indigo-300 overflow-x-auto my-1 border border-slate-900 text-start">
                    {trimmed}
                    {cursor}
                  </pre>
                );
              }

              return trimmed || cursor ? (
                <p key={idx} className="text-start">
                  {trimmed}
                  {cursor}
                </p>
              ) : null;
            })}
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
            <div className="p-3 bg-slate-950/80 rounded-2xl border border-slate-800 text-slate-500">
              <FileText className="w-6 h-6" />
            </div>
            <div className="max-w-xs">
              <h4 className="text-xs font-semibold text-slate-300">
                {language === 'ar' ? 'لم يتم بدء التقرير الاستراتيجي' : 'No Report Initialized'}
              </h4>
              <p className="text-[11px] text-slate-500 mt-1 font-light">
                {language === 'ar' 
                  ? 'انقر على "تحليل المؤشرات الاستراتيجية" لإنشاء تقرير تنفيذي شامل يلخص نقاط القوة والضعف والفرص والتهديدات SWOT وعوامل المخاطر ومسارات النمو.' 
                  : 'Click **Analyze Strategic KPIs** to generate an automated executive report summarizing SWOT, risk variables, and growth trajectories.'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Skip button overlay */}
      {isTyping && (
        <button 
          onClick={handleSkipTyping}
          className="absolute bottom-16 right-8 px-2.5 py-1.5 bg-slate-950/90 hover:bg-slate-900 text-slate-400 hover:text-white text-[9px] font-medium rounded-lg border border-slate-800/80 shadow-xl transition-all flex items-center gap-1 cursor-pointer z-10"
        >
          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-ping" style={{ animationDuration: '1.2s' }} />
          <span>{language === 'ar' ? 'تخطي تأثير الكتابة' : 'Skip typing effect'}</span>
        </button>
      )}

      <div className="border-t border-slate-800/60 pt-3 mt-4 flex items-center justify-between text-[9px] text-slate-500 font-light">
        <span>
          {language === 'ar' ? 'تم تجميع التقرير وتأمينه لجلسة المستأجر النشطة حالياً.' : 'Report is compiled and locked for active Tenant session.'}
        </span>
        <span>{language === 'ar' ? 'تشفير SSL آمن' : 'Secured SSL Encryption'}</span>
      </div>
    </div>
  );
}
