import React from 'react';
import { Joyride, STATUS, Step, EventData } from 'react-joyride';
import { Language } from '../utils/translations';

interface OnboardingTourProps {
  run: boolean;
  language: Language;
  onClose: () => void;
}

export default function OnboardingTour({ run, language, onClose }: OnboardingTourProps) {
  const isRtl = language === 'ar';

  const steps: Step[] = [
    {
      target: 'body',
      placement: 'center',
      title: isRtl ? 'مرحباً بك في SniperAI v2.1 🚀' : 'Welcome to SniperAI v2.1 🚀',
      content: isRtl 
        ? 'دعنا نأخذك في جولة تفاعلية سريعة ومثيرة لاستكشاف لوحة القيادة الذكية والمخصصة للشركاء التنفيذيين.' 
        : 'Let us take you on a quick interactive tour of your intelligent executive partner dashboard.',
      skipBeacon: true,
    },
    {
      target: '#global-search-container',
      placement: 'bottom',
      title: isRtl ? 'البحث الذكي ولوحة الأوامر 🔍' : 'Global Search & Command Palette 🔍',
      content: isRtl 
        ? 'ابحث بسرعة عن الشركات والمستأجرين، المنتجات، والتقارير في أي وقت. اضغط على Ctrl+K أو Cmd+K لفتح لوحة الأوامر فوراً والتحرك بسلاسة عبر لوحة المفاتيح!' 
        : 'Search tenants, products, or reports instantly. Hit Ctrl+K or Cmd+K to launch the Command Palette for keyboard-driven navigation across the app!',
      skipBeacon: true,
    },
    {
      target: '#filter-bar-container',
      placement: 'bottom',
      title: isRtl ? 'شريط تصفية المستأجرين والمؤشرات 🎛️' : 'Multi-Tenant Filter Bar 🎛️',
      content: isRtl 
        ? 'تنقل بسهولة بين الشركات والمستأجرين المختلفين. يمكنك تحديد المنتجات، فترات التاريخ، والحملات لتحديث التحليلات فوراً.' 
        : 'Easily switch between corporate tenant workspaces. Filter by products, campaign types, or custom dates to update your views in real-time.',
      skipBeacon: true,
    },
    {
      target: '#kpi-cards-section',
      placement: 'bottom',
      title: isRtl ? 'مؤشرات الأداء الرئيسية 📊' : 'Executive KPI Cards 📊',
      content: isRtl 
        ? 'شاهد الإيرادات الإجمالية، أرباح التشغيل، وهوامش الربح. على الأجهزة المحمولة، يمكنك السحب لليمين واليسار للتنقل بين البطاقات بسلاسة!' 
        : 'Monitor gross revenue, margins, and operating profit. On mobile devices, enjoy a high-fidelity swipe-to-switch experience to cycle through KPIs!',
      skipBeacon: true,
    },
    {
      target: '#ai-floating-trigger-btn',
      placement: 'top',
      title: isRtl ? 'مساعد الذكاء الاصطناعي الصوتي 🤖' : 'AI Strategic Copilot 🤖',
      content: isRtl 
        ? 'مساعدك الشخصي للتحليل المالي والاستراتيجي. اسأل عن المنتجات الأكثر ربحية، أو قم بتفعيل المساعد الصوتي للتحدث معه مباشرة باللغة الطبيعية.' 
        : 'Your personal AI-powered financial advisory agent. Ask questions, view performance analysis, or activate the voice mode for interactive consulting.',
      skipBeacon: true,
    },
    {
      target: '#strategic-report-panel',
      placement: 'top',
      title: isRtl ? 'التقرير الاستراتيجي المولد بالذكاء الاصطناعي 📝' : 'AI Strategic Performance Report 📝',
      content: isRtl 
        ? 'احصل على تقرير تحليلي معمق ومعزز بالرؤى من الذكاء الاصطناعي للشركة المحددة مع خيارات التصدير إلى PDF أو CSV.' 
        : 'Generate deep strategic performance briefs using advanced AI models. Cleanly export them to PDF or CSV for executive meetings.',
      skipBeacon: true,
    },
    {
      target: '#crm-tracker-panel',
      placement: 'top',
      title: isRtl ? 'متتبع المبيعات والعمليات الشاذة 💼' : 'Sales Deals & AI Anomalies 💼',
      content: isRtl 
        ? 'راقب الصفقات المفتوحة في المبيعات وتأكد من سلامة المعاملات عبر سجل العمليات الشاذة التي يتم رصدها تلقائياً بالذكاء الاصطناعي.' 
        : 'Keep an eye on open sales opportunities and trace stability anomalies captured instantly by our automated background filters.',
      skipBeacon: true,
    },
    {
      target: 'body',
      placement: 'center',
      title: isRtl ? 'جاهز للانطلاق! 🎉' : 'All Set & Ready! 🎉',
      content: isRtl 
        ? 'أنت الآن جاهز لاستخدام المنصة بكامل طاقتها. يمكنك تشغيل هذه الجولة مجدداً في أي وقت بالضغط على زر "جولة سريعة" في الأعلى.' 
        : 'You are now ready to fully harness SniperAI. Relaunch this guide anytime by clicking the "Quick Tour" button in the header.',
      skipBeacon: true,
    }
  ];

  const handleJoyrideCallback = (data: EventData) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      onClose();
    }
  };

  const locale = {
    back: isRtl ? 'السابق' : 'Back',
    close: isRtl ? 'إغلاق' : 'Close',
    last: isRtl ? 'إنهاء' : 'Finish',
    next: isRtl ? 'التالي' : 'Next',
    open: isRtl ? 'فتح' : 'Open',
    skip: isRtl ? 'تخطي الجولة' : 'Skip Tour',
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous={true}
      scrollToFirstStep={true}
      onEvent={handleJoyrideCallback}
      locale={locale}
      options={{
        arrowColor: '#090d16',
        backgroundColor: '#090d16',
        overlayColor: 'rgba(2, 6, 23, 0.85)',
        primaryColor: '#6366f1',
        textColor: '#f8fafc',
        zIndex: 10000,
        buttons: ['back', 'close', 'primary', 'skip'],
        showProgress: true,
      }}
      styles={{
        tooltip: {
          borderRadius: '16px',
          border: '1px solid #1e293b',
          padding: '22px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.6)',
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        tooltipContainer: {
          textAlign: isRtl ? 'right' : 'left',
          direction: isRtl ? 'rtl' : 'ltr',
        },
        tooltipTitle: {
          fontSize: '15px',
          fontWeight: '700',
          color: '#ffffff',
          marginBottom: '8px',
        },
        tooltipContent: {
          fontSize: '12.5px',
          lineHeight: '1.6',
          color: '#cbd5e1',
        },
        buttonPrimary: {
          backgroundColor: '#6366f1',
          borderRadius: '10px',
          color: '#ffffff',
          fontSize: '12px',
          fontWeight: '600',
          padding: '8px 16px',
          cursor: 'pointer',
          outline: 'none',
          boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)',
        },
        buttonBack: {
          color: '#94a3b8',
          fontSize: '12px',
          fontWeight: '500',
          marginRight: isRtl ? '0' : '10px',
          marginLeft: isRtl ? '10px' : '0',
          cursor: 'pointer',
        },
        buttonSkip: {
          color: '#64748b',
          fontSize: '12px',
          cursor: 'pointer',
        },
      }}
    />
  );
}
