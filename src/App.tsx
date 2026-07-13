import React, { useState, useEffect } from 'react';
import { Tenant, SalesRecord, MetricSummary, ForecastRecord, ChatMessage, CRMDeal, AppNotification, SyncHistoryEntry } from './types';
import FilterBar from './components/FilterBar';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import AIAssistant from './components/AIAssistant';
import StrategicReport from './components/StrategicReport';
import CRMTracker from './components/CRMTracker';
import AnomaliesList from './components/AnomaliesList';
import AuthPage from './components/AuthPage';
import RegisterTenantModal from './components/RegisterTenantModal';
import TenantSettingsModal from './components/TenantSettingsModal';
import BillingDashboard from './components/BillingDashboard';
import SubscriptionPlanModal from './components/SubscriptionPlanModal';
import ThemeSwitcher from './components/ThemeSwitcher';
import ProductsPieChart from './components/ProductsPieChart';
import UserManagement from './components/UserManagement';
import UserProfile from './components/UserProfile';
import NotificationCenter from './components/NotificationCenter';
import FederatedSessionHub from './components/FederatedSessionHub';
import CommandPalette from './components/CommandPalette';
import OnboardingTour from './components/OnboardingTour';
import AddTenantScreen from './components/AddTenantScreen';
import InventoryManagement from './components/InventoryManagement';
import { translations, Language } from './utils/translations';
import { Layers, Shield, Sparkles, TrendingUp, Cpu, Radio, Globe, LogOut, PlusCircle, Users, CreditCard, User, Database, RefreshCw, Package } from 'lucide-react';
import { addAuditLog } from './utils/auditLogger';
import sniperLogo from './assets/images/sniper_ai_logo_1783155755401.jpg';
import { db, handleFirestoreError, OperationType } from './utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  // Authentication & language states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const [userEmail, setUserEmail] = useState<string>(() => {
    return localStorage.getItem('userEmail') || '';
  });

  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [runTour, setRunTour] = useState<boolean>(false);

  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem('language') || 'en') as Language;
  });

  const [lastRefreshed, setLastRefreshed] = useState<Date>(() => new Date());
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  const handleLanguageToggle = () => {
    const nextLang = language === 'en' ? 'ar' : 'en';
    localStorage.setItem('language', nextLang);
    setLanguage(nextLang);
  };

  const handleLogout = () => {
    addAuditLog(userEmail, 'SECURITY', 'Secure user session terminated voluntarily.', 'INFO');
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    setIsAuthenticated(false);
    setUserEmail('');
    setActiveView('dashboard');
  };

  const t = translations[language];

  // Active view toggle (for super admin)
  const [activeView, setActiveView] = useState<'dashboard' | 'users' | 'billing' | 'profile' | 'inventory'>('dashboard');

  // Federated user profile details
  const [userProfile, setUserProfile] = useState<{
    fullName: string;
    role: string;
    company: string;
    avatarId: string;
    tenantId: string;
  } | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Config state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [activeTenant, setActiveTenant] = useState<Tenant | null>(null);

  // Filter state
  const [selectedTenantId, setSelectedTenantId] = useState('root');
  const [selectedCampaign, setSelectedCampaign] = useState('All');
  const [selectedProduct, setSelectedProduct] = useState('All');
  const [startDate, setStartDate] = useState('2026-01-01');
  const [endDate, setEndDate] = useState('2026-07-03');
  const [lastTenantId, setLastTenantId] = useState('');

  // Dynamic filter metadata extracted from tenant rawRecords
  const [dynamicCampaigns, setDynamicCampaigns] = useState<string[]>([]);
  const [dynamicProducts, setDynamicProducts] = useState<string[]>([]);
  const [dynamicMinDate, setDynamicMinDate] = useState<string>('2026-01-01');
  const [dynamicMaxDate, setDynamicMaxDate] = useState<string>('2026-07-03');

  // Business metrics data
  const [summary, setSummary] = useState<MetricSummary>({
    totalRevenue: 0,
    totalCost: 0,
    profit: 0,
    profitMargin: 0,
    averageOrderValue: 0,
    salesCount: 0,
    anomalies: [],
    productDistribution: []
  });
  const [chartData, setChartData] = useState<{ date: string; revenue: number; cost: number; isAnomaly: boolean; anomalyReason?: string }[]>([]);

  // Forecast state
  const [forecastData, setForecastData] = useState<ForecastRecord[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastAnalysis, setForecastAnalysis] = useState('');

  // AI Assistant chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);

  // Strategic Executive Report state
  const [reportText, setReportText] = useState('');
  const [reportLoading, setReportLoading] = useState(false);

  // CRM integration state
  const [crmDeals, setCrmDeals] = useState<CRMDeal[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false);

  const [dbStatus, setDbStatus] = useState<{
    isDbConnected: boolean;
    salesTableExists: boolean;
    salesTableName: string;
    crmTableExists: boolean;
    crmTableName: string;
    provider: string;
  } | null>(null);

  // Global Notification Stream state
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    return [
      {
        id: 'sys-init',
        type: 'SYSTEM',
        titleEn: 'Platform Control Online',
        titleAr: 'منصة التحكم متصلة',
        messageEn: 'Enterprise multi-tenant federated core node online and verified.',
        messageAr: 'عقدة النظام الأساسي متعددة المستأجرين متصلة بالإنترنت وتم التحقق منها.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      },
      {
        id: 'sys-welcome',
        type: 'SYSTEM',
        titleEn: 'Secure Sandbox Active',
        titleAr: 'البيئة التجريبية الآمنة نشطة',
        messageEn: 'Ready for predictive sales forecasting operations.',
        messageAr: 'جاهز لعمليات التنبؤ بالمبيعات في مساحات العمل.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        read: false,
      }
    ];
  });

  const addNotification = (
    type: 'ANOMALY' | 'TASK' | 'SYSTEM',
    titleEn: string,
    titleAr: string,
    messageEn: string,
    messageAr: string,
    meta?: any
  ) => {
    const newNoti: AppNotification = {
      id: `${type}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      type,
      titleEn,
      titleAr,
      messageEn,
      messageAr,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: false,
      meta,
    };
    setNotifications(prev => [newNoti, ...prev]);
  };

  const handleMarkRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Initial Load: Fetch Tenants
  useEffect(() => {
    fetch('/api/tenants')
      .then(res => res.json())
      .then((data: Tenant[]) => {
        const unique = Array.from(new Map(data.map(item => [item.id, item])).values());
        setTenants(unique);
        if (unique.length > 0) {
          // Set active tenant details
          const first = unique.find(t => t.id === selectedTenantId) || unique[0];
          setActiveTenant(first);
        }
      })
      .catch(err => console.error("Error fetching tenants:", err));
  }, []);

  // Load chat messages from Firestore
  useEffect(() => {
    if (!db) return;
    const emailPart = userEmail ? userEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') : 'anonymous';
    const docId = `chat_history_${emailPart}_${selectedTenantId}`;
    const docRef = doc(db, 'chat_histories', docId);

    getDoc(docRef)
      .then((docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data && Array.isArray(data.messages)) {
            // Reconstruct nested arrays for tableData
            const loadedMessages = data.messages.map((msg: any) => {
              if (msg.tableData && Array.isArray(msg.tableData.rows)) {
                return {
                  ...msg,
                  tableData: {
                    ...msg.tableData,
                    rows: msg.tableData.rows.map((row: any) => {
                      if (typeof row === 'string') {
                        try {
                          return JSON.parse(row);
                        } catch (e) {
                          return [];
                        }
                      }
                      return row;
                    })
                  }
                };
              }
              return msg;
            });
            setChatMessages(loadedMessages);
          } else {
            setChatMessages([]);
          }
        } else {
          setChatMessages([]);
        }
      })
      .catch((err) => {
        console.warn("Failed to load chat history from Firestore:", err);
        setChatMessages([]);
      });
  }, [selectedTenantId, userEmail, isAuthenticated]);

  // Auto-start interactive onboarding tour for first-time visitors
  useEffect(() => {
    if (isAuthenticated && localStorage.getItem('sniper_onboarding_completed') !== 'true') {
      const timer = setTimeout(() => {
        setRunTour(true);
      }, 1500); // Wait for dashboard layout to fully settle
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated]);

  const startOnboardingTour = () => {
    setRunTour(false);
    setTimeout(() => {
      setRunTour(true);
    }, 150);
  };

  const fetchUserProfile = async () => {
    if (!isAuthenticated || !userEmail) {
      setIsLoadingProfile(false);
      return;
    }
    const emailKey = userEmail.toLowerCase().trim();
    const docRef = doc(db, 'user_profiles', emailKey);
    const cacheKey = `_user_profile_cache_${emailKey}`;

    setIsLoadingProfile(true);
    try {
      let docSnap;
      let isOffline = false;
      try {
        docSnap = await getDoc(docRef);
      } catch (getErr: any) {
        const isOfflineError = getErr?.message?.includes('offline') || 
                               getErr?.message?.includes('Could not reach Cloud Firestore backend') ||
                               getErr?.code === 'unavailable' ||
                               getErr?.code === 'failed-precondition';
        if (isOfflineError) {
          isOffline = true;
          console.warn("Firestore appears to be offline. Attempting offline cache loading.");
        } else {
          handleFirestoreError(getErr, OperationType.GET, `user_profiles/${emailKey}`, userEmail);
        }
      }

      if (docSnap && docSnap.exists()) {
        const data = docSnap.data();
        const profile = {
          fullName: data.fullName || 'User',
          role: data.role || 'Member',
          company: data.company || 'Organization',
          avatarId: data.avatarId || 'av1',
          tenantId: data.tenantId || ''
        };
        setUserProfile(profile);
        localStorage.setItem(cacheKey, JSON.stringify({ ...data, ...profile }));
        if (profile.tenantId && profile.tenantId !== selectedTenantId) {
          console.log("Setting selectedTenantId from user profile:", profile.tenantId);
          setSelectedTenantId(profile.tenantId);
        }
      } else {
        // Fallback to cache if available
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          const profile = {
            fullName: cachedData.fullName || 'User',
            role: cachedData.role || 'Member',
            company: cachedData.company || 'Organization',
            avatarId: cachedData.avatarId || 'av1',
            tenantId: cachedData.tenantId || ''
          };
          setUserProfile(profile);
          if (profile.tenantId && profile.tenantId !== selectedTenantId) {
            setSelectedTenantId(profile.tenantId);
          }
          console.log("Loaded user profile from offline cache:", cachedData);
          setIsLoadingProfile(false);
          return;
        }

        if (emailKey === 'admin@sniper.ai') {
          const payload = {
            fullName: 'Executive Officer',
            phone: '',
            role: 'Enterprise Admin',
            company: 'Sniper AI',
            bio: 'Account registered with plan: ENTERPRISE',
            location: '',
            avatarId: 'av1',
            updatedAt: new Date().toISOString(),
            tenantId: 'root',
          };
          localStorage.setItem(cacheKey, JSON.stringify(payload));
          setUserProfile({
            fullName: payload.fullName,
            role: payload.role,
            company: payload.company,
            avatarId: payload.avatarId,
            tenantId: payload.tenantId
          });
          setSelectedTenantId('root');

          if (!isOffline) {
            try {
              await setDoc(docRef, payload);
            } catch (writeErr) {
              console.warn("Failed to write admin profile to Firestore (using offline mode):", writeErr);
            }
          }
        } else {
          const payload = {
            fullName: 'New Partner Node',
            phone: '',
            role: 'Operations Lead',
            company: 'Workspace Partner',
            bio: 'Synchronized with active federated dashboard.',
            location: '',
            avatarId: 'av2',
            updatedAt: new Date().toISOString(),
            tenantId: '',
          };
          localStorage.setItem(cacheKey, JSON.stringify(payload));
          setUserProfile({
            fullName: payload.fullName,
            role: payload.role,
            company: payload.company,
            avatarId: payload.avatarId,
            tenantId: payload.tenantId
          });
          setSelectedTenantId('');

          if (!isOffline) {
            try {
              await setDoc(docRef, payload);
            } catch (writeErr) {
              console.warn("Failed to write partner profile to Firestore (using offline mode):", writeErr);
            }
          }
        }
      }
    } catch (err) {
      console.error("Error loading user profile:", err);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  // Load user profile and select saved tenant ID immediately upon login/auth detection
  useEffect(() => {
    fetchUserProfile();
  }, [isAuthenticated, userEmail]);

  // Sync profile when navigation switches to dashboard view to pick up UserProfile updates instantly
  useEffect(() => {
    if (activeView === 'dashboard') {
      fetchUserProfile();
    }
  }, [activeView]);

  // Fetch metrics and CRM pipelines whenever filters change
  useEffect(() => {
    if (!selectedTenantId) return;

    // Reset temporary states on tenant switch
    setForecastData([]);
    setForecastAnalysis('');
    setReportText('');

    // Update active tenant profile
    if (tenants.length > 0) {
      const active = tenants.find(t => t.id === selectedTenantId);
      if (active) setActiveTenant(active);
    }

    fetchMetrics();
    fetchCRMDeals();
    fetchSyncHistory();
  }, [selectedTenantId, selectedCampaign, selectedProduct, startDate, endDate, tenants]);

  // Main HTTP post to get calculated metrics and charts
  const fetchMetrics = () => {
    return fetch('/api/dashboard/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: selectedTenantId,
        campaign: selectedCampaign,
        product: selectedProduct,
        startDate,
        endDate
      })
    })
      .then(res => res.json())
      .then((data) => {
        setSummary(data.summary);
        setChartData(data.chartData);
        if (data.dbStatus) {
          setDbStatus(data.dbStatus);
        } else {
          setDbStatus(null);
        }

        if (data.filterMeta) {
          setDynamicCampaigns(data.filterMeta.campaigns || []);
          setDynamicProducts(data.filterMeta.products || []);
          const newMin = data.filterMeta.minDate || '2026-01-01';
          const newMax = data.filterMeta.maxDate || '2026-07-03';
          setDynamicMinDate(newMin);
          setDynamicMaxDate(newMax);

          if (selectedTenantId !== lastTenantId) {
            setStartDate(newMin);
            setEndDate(newMax);
            setLastTenantId(selectedTenantId);
          }
        }

        // Auto-detect anomalies and populate global notifications feed
        if (data.summary.anomalies && data.summary.anomalies.length > 0) {
          data.summary.anomalies.forEach((anomaly: SalesRecord) => {
            const uniqueId = `anomaly-${anomaly.date}-${anomaly.product}-${anomaly.revenue}`;
            setNotifications((prev) => {
              const alreadyExists = prev.some((n) => n.meta?.uniqueId === uniqueId);
              if (alreadyExists) return prev;

              const isHigh = anomaly.revenue > anomaly.units * 100;
              const titleEn = isHigh ? `Critical Alert: Unusual High Revenue` : `Anomaly Alert: Revenue Variance`;
              const titleAr = isHigh ? `تنبيه حرج: ارتفاع غير طبيعي للإيرادات` : `تنبيه شذوذ: تباين الإيرادات`;

              const messageEn = `${anomaly.product} generated $${anomaly.revenue.toLocaleString()} on ${anomaly.date} (${anomaly.anomalyReason || 'deviation detected'}).`;
              const messageAr = `حقق ${anomaly.product} إيرادات بقيمة $${anomaly.revenue.toLocaleString()} بتاريخ ${anomaly.date} (${anomaly.anomalyReason || 'تم رصد انحراف'}).`;

              const newNoti: AppNotification = {
                id: `anomaly-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
                type: 'ANOMALY',
                titleEn,
                titleAr,
                messageEn,
                messageAr,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                read: false,
                meta: { uniqueId, product: anomaly.product, revenue: anomaly.revenue, anomalyReason: anomaly.anomalyReason },
              };
              return [newNoti, ...prev];
            });
          });
        }
        setLastRefreshed(new Date());
      })
      .catch(err => console.error("Error loading metrics:", err));
  };

  // Get CRM status
  const fetchCRMDeals = () => {
    return fetch(`/api/crm/deals/${selectedTenantId}`)
      .then(res => res.json())
      .then((deals) => setCrmDeals(deals))
      .catch(err => console.error("Error loading CRM deals:", err));
  };

  const fetchSyncHistory = () => {
    setSyncHistoryLoading(true);
    return fetch(`/api/crm/sync-history/${selectedTenantId}`)
      .then(res => res.json())
      .then((history) => {
        setSyncHistory(history);
        setSyncHistoryLoading(false);
      })
      .catch(err => {
        console.error("Error loading CRM sync history:", err);
        setSyncHistoryLoading(false);
      });
  };

  // Handle manual trigger refresh
  const handleRefreshNow = async () => {
    if (isRefreshing) return;
    setIsRefreshing(true);
    addAuditLog(
      userEmail || 'SYSTEM',
      'SYSTEM',
      `Manual dashboard data refresh initiated for tenant: ${selectedTenantId}`,
      'INFO'
    );
    
    // Smooth UI transition with a minimum loading duration
    const minDelay = new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      await Promise.all([
        fetchMetrics(),
        fetchCRMDeals(),
        fetchSyncHistory(),
        minDelay
      ]);
      
      addNotification(
        'SYSTEM',
        'Dashboard Refreshed',
        'تم تحديث لوحة التحكم',
        'All analytics streams, KPIs, and CRM pipelines have been updated to the latest state.',
        'تم تحديث جميع تدفقات التحليلات، مؤشرات الأداء، وصفقات إدارة العملاء إلى أحدث حالة.'
      );
    } catch (err) {
      console.error("Manual refresh failed:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle forecast calculations & commentary query
  const handleTriggerForecast = (modelType: string = 'regression') => {
    setForecastLoading(true);
    fetch('/api/forecast', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: selectedTenantId,
        campaign: selectedCampaign,
        product: selectedProduct,
        days: 30,
        modelType
      })
    })
      .then(res => res.json())
      .then((data) => {
        setForecastData(data.forecast);
        setForecastAnalysis(data.analysis);
        setForecastLoading(false);
        addAuditLog(
          userEmail || 'SYSTEM',
          'ANALYTICS',
          `Synthesized predictive 30-day forecast projection for tenant workspace node: ${selectedTenantId}.`,
          'SUCCESS'
        );
        addNotification(
          'TASK',
          'Sales Forecast Synthesized',
          'تم تجميع توقعات المبيعات',
          `Synthesized predictive 30-day forecast projection for workspace node: ${selectedTenantId}.`,
          `تم تجميع التوقعات التنبؤية لـ 30 يوماً لعقدة مساحة عمل المستأجر: ${selectedTenantId}.`
        );
      })
      .catch(err => {
        console.error("Forecasting failed:", err);
        setForecastLoading(false);
      });
  };

  const sanitizeFirestoreData = (data: any): any => {
    if (data === undefined) return null;
    if (data === null) return null;
    if (Array.isArray(data)) {
      // Check if this is an array of arrays (nested arrays). Firestore doesn't support them.
      if (data.length > 0 && Array.isArray(data[0])) {
        return data.map(item => JSON.stringify(item));
      }
      return data.map(item => sanitizeFirestoreData(item));
    }
    if (typeof data === 'object') {
      const res: any = {};
      for (const key of Object.keys(data)) {
        if (data[key] !== undefined) {
          res[key] = sanitizeFirestoreData(data[key]);
        }
      }
      return res;
    }
    return data;
  };

  const saveChatHistory = (messages: ChatMessage[]) => {
    if (!db) return;
    const emailPart = userEmail ? userEmail.toLowerCase().trim().replace(/[^a-z0-9]/g, '_') : 'anonymous';
    const docId = `chat_history_${emailPart}_${selectedTenantId}`;
    const docRef = doc(db, 'chat_histories', docId);

    // Deeply sanitize to prevent any undefined values from leaking into Firestore
    const sanitizedMessages = sanitizeFirestoreData(messages || []);

    setDoc(docRef, { 
      messages: sanitizedMessages,
      userEmail: userEmail || 'anonymous',
      tenantId: selectedTenantId
    })
      .catch((err) => {
        console.warn("Failed to persist chat history to Firestore:", err);
      });
  };

  // Handle sending chatbot queries
  const handleSendMessage = (text: string, customModelMsg?: ChatMessage) => {
    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text,
      timestamp: new Date().toLocaleTimeString()
    };

    if (customModelMsg) {
      const updatedMessages = [...chatMessages, userMsg, customModelMsg];
      setChatMessages(updatedMessages);
      saveChatHistory(updatedMessages);
      return;
    }

    const updatedWithUser = [...chatMessages, userMsg];
    setChatMessages(updatedWithUser);
    saveChatHistory(updatedWithUser);
    setChatLoading(true);

    fetch('/api/assistant/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: selectedTenantId,
        campaign: selectedCampaign,
        product: selectedProduct,
        startDate,
        endDate,
        message: text,
        history: chatMessages,
        language
      })
    })
      .then(res => res.json())
      .then((data) => {
        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
          tableData: data.tableData
        };
        const updatedWithModel = [...updatedWithUser, modelMsg];
        setChatMessages(updatedWithModel);
        saveChatHistory(updatedWithModel);
        setChatLoading(false);
      })
      .catch(err => {
        console.error("Chat failed:", err);
        setChatLoading(false);
      });
  };

  // Handle Auto-Summarizing current session findings
  const handleAutoSummarize = () => {
    setChatLoading(true);
    fetch('/api/assistant/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: selectedTenantId,
        campaign: selectedCampaign,
        product: selectedProduct,
        startDate,
        endDate,
        language
      })
    })
      .then(res => res.json())
      .then((data) => {
        const modelMsg: ChatMessage = {
          id: `model-summary-${Date.now()}`,
          role: 'model',
          text: data.text || (language === 'ar' ? 'حدث خطأ أثناء توليد الملخص.' : 'Error generating summary.'),
          timestamp: new Date().toLocaleTimeString()
        };
        const updatedMessages = [...chatMessages, modelMsg];
        setChatMessages(updatedMessages);
        saveChatHistory(updatedMessages);
        setChatLoading(false);

        addAuditLog(
          userEmail || 'SYSTEM',
          'ANALYTICS',
          `Generated and persisted session findings auto-summary for workspace node: ${selectedTenantId}.`,
          'SUCCESS'
        );

        addNotification(
          'TASK',
          'Session Summary Generated',
          'تم إنشاء ملخص الجلسة',
          `An automated executive summary of your active filters and core KPIs has been added and saved.`,
          `تم إنشاء وحفظ ملخص تنفيذي تلقائي للفلاتر النشطة والمؤشرات الأساسية في سجل المحادثة.`
        );
      })
      .catch(err => {
        console.error("Auto-summarization failed:", err);
        setChatLoading(false);
      });
  };

  // Handle generating strategic report
  const handleGenerateReport = () => {
    setReportLoading(true);
    fetch('/api/reports/strategic', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: selectedTenantId,
        campaign: selectedCampaign,
        product: selectedProduct,
        startDate,
        endDate,
        language
      })
    })
      .then(res => res.json())
      .then((data) => {
        setReportText(data.report);
        setReportLoading(false);
        addAuditLog(
          userEmail || 'SYSTEM',
          'ANALYTICS',
          `Generated strategic multi-dimensional executive report for workspace node: ${selectedTenantId}.`,
          'SUCCESS'
        );
        addNotification(
          'TASK',
          'Strategic SWOT Report Compiled',
          'تم تجميع التقرير الاستراتيجي SWOT',
          `Strategic executive SWOT report successfully generated for ${selectedTenantId}.`,
          `تم إنشاء التقرير الاستراتيجي SWOT بنجاح لمساحة العمل ${selectedTenantId}.`
        );
      })
      .catch(err => {
        console.error("Report generation failed:", err);
        setReportLoading(false);
      });
  };

  // Handle syncing simulated CRM pipeline progress
  const handleSyncCRM = () => {
    setCrmLoading(true);
    fetch('/api/crm/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: selectedTenantId, userEmail })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || data.success === false) {
          throw new Error(data.details || data.error || 'Transient connection timeout');
        }
        return data;
      })
      .then((data) => {
        setCrmDeals(data.deals || []);
        setCrmLoading(false);
        // Refresh local metrics as CRM deals flow into sales records
        fetchMetrics();
        // Refresh sync logs list
        fetchSyncHistory();
        addAuditLog(
          userEmail || 'SYSTEM',
          'ANALYTICS',
          `Synchronized autonomic CRM pipeline progression dataset for workspace node: ${selectedTenantId}.`,
          'SUCCESS'
        );
        addNotification(
          'TASK',
          'CRM Pipeline Sync Completed',
          'اكتملت مزامنة بيانات إدارة العملاء',
          `Synchronized CRM pipeline deals successfully for ${selectedTenantId}.`,
          `تمت مزامنة صفقات خط أنابيب إدارة علاقات العملاء بنجاح لمساحة العمل ${selectedTenantId}.`
        );
      })
      .catch(err => {
        console.error("CRM Sync failed:", err);
        setCrmLoading(false);
        // Still fetch the sync logs to display the failure entry
        fetchSyncHistory();
        addAuditLog(
          userEmail || 'SYSTEM',
          'ANALYTICS',
          `CRM pipeline synchronization failed: ${err.message}.`,
          'ERROR'
        );
        addNotification(
          'ANOMALY',
          'CRM Pipeline Sync Failed',
          'فشلت مزامنة بيانات إدارة العملاء',
          `CRM sync operation failed: ${err.message}.`,
          `فشلت عملية مزامنة CRM: ${err.message}.`
        );
      });
  };

  // Handle dynamic download of detailed transaction data as CSV
  const handleExportCSV = () => {
    if (chartData.length === 0) return;

    // Build headers
    let csvContent = "date,actual_revenue,cost_of_goods,anomaly_detected,anomaly_reason\n";
    
    // Add rows
    chartData.forEach(row => {
      const rowStr = `"${row.date}","${row.revenue}","${row.cost}","${row.isAnomaly ? 'TRUE' : 'FALSE'}","${row.anomalyReason || ''}"\n`;
      csvContent += rowStr;
    });

    // Initiate file download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `SniperAI_${selectedTenantId}_filtered_sales.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Reset filters
  const handleResetFilters = () => {
    setSelectedCampaign('All');
    setSelectedProduct('All');
    setStartDate(dynamicMinDate);
    setEndDate(dynamicMaxDate);
  };

  const handleOnboardSuccess = async (newTenant: Tenant) => {
    addAuditLog(
      userEmail, 
      'WORKSPACE', 
      `Onboarded new tenant workspace: ${newTenant.name} (${newTenant.id}) in ${newTenant.industry} sector.`, 
      'SUCCESS'
    );
    setTenants(prev => {
      const exists = prev.some(t => t.id === newTenant.id);
      if (exists) {
        return prev.map(t => t.id === newTenant.id ? newTenant : t);
      }
      return [...prev, newTenant];
    });
    setSelectedTenantId(newTenant.id);
    addNotification(
      'SYSTEM',
      'New Workspace Onboarded',
      'تم تسجيل مساحة عمل جديدة',
      `Workspace node ${newTenant.name} has been successfully onboarded in ${newTenant.industry} sector.`,
      `تم بنجاح تسجيل مساحة العمل ${newTenant.name} في قطاع ${newTenant.industry}.`
    );

    // Link user profile to the newly onboarded tenant in Firestore
    if (userEmail) {
      try {
        const emailKey = userEmail.toLowerCase().trim();
        const docRef = doc(db, 'user_profiles', emailKey);
        
        // Save to offline local cache first
        const cacheKey = `_user_profile_cache_${emailKey}`;
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          cachedData.tenantId = newTenant.id;
          localStorage.setItem(cacheKey, JSON.stringify(cachedData));
        } else {
          localStorage.setItem(cacheKey, JSON.stringify({ tenantId: newTenant.id }));
        }

        try {
          await setDoc(docRef, { tenantId: newTenant.id }, { merge: true });
        } catch (writeErr: any) {
          console.warn("Failed to sync tenant link to Firestore (offline cache updated):", writeErr);
        }
        console.log('Successfully linked user profile to tenant:', newTenant.id);
        fetchUserProfile();
        setTimeout(() => {
          setRunTour(true);
        }, 1500);
      } catch (err) {
        console.error('Failed to link user profile to tenant in Firestore:', err);
      }
    }
  };

  const handleTenantsChange = (updatedTenants: Tenant[]) => {
    const unique = Array.from(new Map(updatedTenants.map(item => [item.id, item])).values());
    setTenants(unique);
    if (unique.length > 0) {
      const stillExists = unique.some(t => t.id === selectedTenantId);
      if (!stillExists) {
        setSelectedTenantId(unique[0].id);
      }
    } else {
      setSelectedTenantId('');
    }
  };

  const handleUpdateTenantProducts = async (newProducts: { name: string; price: number; costOfGoods: number }[]) => {
    if (!activeTenant) return;
    const updatedTenant: Tenant = {
      ...activeTenant,
      products: newProducts
    };
    
    try {
      await setDoc(doc(db, 'tenants', activeTenant.id), sanitizeFirestoreData(updatedTenant));
    } catch (e) {
      console.error("Failed to update tenant products in Firestore:", e);
    }

    setTenants(prev => prev.map(t => t.id === activeTenant.id ? updatedTenant : t));
    setActiveTenant(updatedTenant);
  };

  if (!isAuthenticated) {
    return (
      <AuthPage 
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onLoginSuccess={(email, shouldOnboard) => {
          localStorage.setItem('isAuthenticated', 'true');
          localStorage.setItem('userEmail', email);
          setIsAuthenticated(true);
          setUserEmail(email);
          if (shouldOnboard) {
            setIsOnboardModalOpen(true);
          }
        }}
      />
    );
  }

  if (isAuthenticated && (isLoadingProfile || tenants.length === 0)) {
    return (
      <div className="min-h-screen bg-[#060913] text-slate-200 flex flex-col items-center justify-center">
        <div className="space-y-4 text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium tracking-wide text-slate-400 font-mono animate-pulse">
            {language === 'ar' ? 'جاري التحقق من أوراق الاعتماد والربط الفيدرالي...' : 'Authenticating secure workspace node...'}
          </p>
        </div>
      </div>
    );
  }

  const isSuperAdmin = userEmail === 'admin@sniper.ai' || userEmail.toLowerCase().includes('admin');
  const hasActiveTenant = isSuperAdmin || (!!userProfile?.tenantId && tenants.some(t => t.id === userProfile.tenantId));

  if (isAuthenticated && !hasActiveTenant) {
    return (
      <AddTenantScreen
        language={language}
        onLanguageToggle={handleLanguageToggle}
        onOnboardSuccess={handleOnboardSuccess}
        onLogout={handleLogout}
        userEmail={userEmail}
      />
    );
  }

  const rawFilteredTenants = isSuperAdmin 
    ? tenants 
    : tenants.filter(t => t.id === userProfile?.tenantId);
  const filteredTenants = Array.from(new Map(rawFilteredTenants.map(t => [t.id, t])).values());

  return (
    <div dir={t.dir} className="min-h-screen bg-[#070b13] text-slate-200">
      
      {/* Premium Navigation Header */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative w-11 h-11 rounded-xl overflow-hidden shadow-lg border border-indigo-500/20 shadow-indigo-950/40 shrink-0">
              <img 
                src={sniperLogo} 
                alt="SniperAI Logo" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/10 to-transparent pointer-events-none"></div>
            </div>
            <div>
              <div className="flex items-center gap-2 justify-start">
                <h1 className="text-xl font-extrabold font-display text-white tracking-tight">{t.brandName}</h1>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider font-mono">
                  v2.1
                </span>
              </div>
              <p className="text-xs text-slate-400 font-light mt-0.5 text-start">
                {t.appSubtitle}
              </p>
            </div>
          </div>

          <CommandPalette
            tenants={filteredTenants}
            activeTenant={activeTenant}
            onSelectTenant={setSelectedTenantId}
            selectedProduct={selectedProduct}
            onSelectProduct={setSelectedProduct}
            activeView={activeView}
            setActiveView={setActiveView}
            isSuperAdmin={isSuperAdmin}
            language={language}
          />

          <div className="flex flex-wrap items-center gap-3.5 text-xs font-light text-slate-500 justify-start md:justify-end">
            {/* Super Admin Badge */}
            {isSuperAdmin && (
              <div className="flex items-center gap-1.5 bg-indigo-950/40 text-indigo-400 border border-indigo-900/40 px-3 py-1.5 rounded-xl font-semibold text-xs">
                <Shield className="w-3.5 h-3.5" />
                <span>{language === 'ar' ? 'المشرف العام' : 'Super Admin'}</span>
              </div>
            )}

            {/* Global Language Switcher */}
            <button
              onClick={handleLanguageToggle}
              className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 font-semibold cursor-pointer text-xs"
            >
              <Globe className="w-3.5 h-3.5 text-indigo-400" />
              <span>{language === 'en' ? 'العربية' : 'English'}</span>
            </button>

            {/* Interactive Onboarding Tour */}
            <button
              id="tour-trigger-btn"
              onClick={startOnboardingTour}
              className="flex items-center gap-1.5 bg-indigo-950/40 hover:bg-indigo-900/40 text-indigo-400 px-3 py-1.5 rounded-xl border border-indigo-900/30 font-semibold cursor-pointer text-xs transition-all"
              title={language === 'ar' ? 'تشغيل الجولة التعليمية التفاعلية' : 'Launch interactive onboarding tour'}
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
              <span>{language === 'ar' ? 'جولة سريعة' : 'Quick Tour'}</span>
            </button>

            {/* Real-time Manual Refresh Trigger & Indicator */}
            <div className="flex items-center gap-2 bg-slate-900/90 text-slate-300 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
              <span className="text-slate-400 flex items-center">
                <span>{t.lastRefreshedLabel}:</span>
                <strong className="font-mono text-white ml-1 mr-1 font-semibold">
                  {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </strong>
              </span>
              <div className="w-[1px] h-3 bg-slate-800 mx-1"></div>
              <button
                onClick={handleRefreshNow}
                disabled={isRefreshing}
                className={`flex items-center gap-1 hover:text-white transition-all cursor-pointer font-bold ${isRefreshing ? 'opacity-70' : ''}`}
                title={t.refreshNow}
              >
                <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${isRefreshing ? 'animate-spin' : 'hover:rotate-180 duration-500 transition-transform'}`} />
                <span>
                  {isRefreshing ? t.refreshing : t.refreshNow}
                </span>
              </button>
            </div>

            <ThemeSwitcher />

            {/* Global Control Alert Stream Center */}
            <NotificationCenter
              notifications={notifications}
              language={language}
              onMarkRead={handleMarkRead}
              onMarkAllRead={handleMarkAllRead}
              onClearAll={handleClearAll}
              onDeleteNotification={handleDeleteNotification}
            />

            {/* Logout Action */}
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 bg-rose-950/20 hover:bg-rose-900/40 text-rose-400 px-3 py-1.5 rounded-xl border border-rose-900/30 font-semibold cursor-pointer text-xs"
              title={language === 'ar' ? 'تسجيل الخروج من الجلسة الآمنة' : 'Sign out from secure session'}
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>{language === 'ar' ? 'خروج' : 'Logout'}</span>
            </button>

            <div className="hidden sm:flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-medium text-slate-300">{t.sandboxActive}</span>
            </div>
            <div className="hidden lg:flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-slate-600" />
              <span>{t.utcConnected}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        
        {/* View Switcher Tab Bar */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-900/80">
            <button
              onClick={() => setActiveView('dashboard')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'dashboard'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Layers className="w-4 h-4" />
              <span>{t.dashboardTab}</span>
            </button>
            {isSuperAdmin && (
              <button
                onClick={() => setActiveView('users')}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                  activeView === 'users'
                    ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>{t.adminTab}</span>
              </button>
            )}
            <button
              onClick={() => setActiveView('billing')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'billing'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span>{language === 'ar' ? 'الفواتير' : 'Billing'}</span>
            </button>
            <button
              onClick={() => setActiveView('inventory')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'inventory'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <Package className="w-4 h-4" />
              <span>{t.inventoryTab}</span>
            </button>
            <button
              onClick={() => setActiveView('profile')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 ${
                activeView === 'profile'
                  ? 'bg-gradient-to-r from-indigo-600/20 to-violet-600/20 text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-400 hover:text-white border border-transparent'
              }`}
            >
              <User className="w-4 h-4" />
              <span>{language === 'ar' ? 'الملف الشخصي' : 'Profile'}</span>
            </button>
          </div>
        </div>

        {/* Super Admin Section */}
        {isSuperAdmin && (
          <div id="admin-operations-section" className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-3xl p-5 mb-6 shadow-xl relative overflow-hidden">
            {/* Visual glow accent */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 text-indigo-400">
                  <Shield className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-sm font-bold font-display text-white text-start">
                    {t.adminSectionTitle}
                  </h2>
                  <p className="text-[11px] text-slate-400 font-light text-start">
                    {t.adminSectionSubtitle}
                  </p>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  id="onboard-tenant-trigger-btn"
                  onClick={() => setIsOnboardModalOpen(true)}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-semibold px-4 py-2.5 rounded-xl border border-indigo-500/30 shadow-md shadow-indigo-950/25 transition-all cursor-pointer h-10 shrink-0 self-start sm:self-center"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{t.registerNewTenant}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeView === 'users' ? (
          <UserManagement 
            language={language} 
            currentUserEmail={userEmail} 
            tenants={filteredTenants} 
            onTenantsChange={handleTenantsChange} 
          />
        ) : activeView === 'billing' ? (
          <BillingDashboard 
            tenantId={selectedTenantId} 
            language={language} 
            onUpgradePlan={() => setIsSubscriptionModalOpen(true)} 
          />
        ) : activeView === 'profile' ? (
          <UserProfile 
            language={language} 
            currentUserEmail={userEmail} 
            onBack={() => setActiveView('dashboard')}
          />
        ) : activeView === 'inventory' ? (
          <InventoryManagement
            tenant={activeTenant}
            language={language}
            userEmail={userEmail}
            addNotification={addNotification}
            onUpdateTenantProducts={handleUpdateTenantProducts}
          />
        ) : (
          <>
            {/* Row 1: Active filters segmentation */}
            <FilterBar
              tenants={filteredTenants}
              selectedTenantId={selectedTenantId}
              onSelectTenant={setSelectedTenantId}
              selectedCampaign={selectedCampaign}
              onSelectCampaign={setSelectedCampaign}
              selectedProduct={selectedProduct}
              onSelectProduct={setSelectedProduct}
              startDate={startDate}
              endDate={endDate}
              onChangeDates={(start, end) => {
                setStartDate(start);
                setEndDate(end);
              }}
              onReset={handleResetFilters}
              language={language}
              onOpenTenantSettings={() => setIsSettingsModalOpen(true)}
              dynamicCampaigns={dynamicCampaigns}
              dynamicProducts={dynamicProducts}
              dynamicMinDate={dynamicMinDate}
              dynamicMaxDate={dynamicMaxDate}
            />

            {/* Federated Session tracing user, tenant workspace, data source and dashboard linkage */}
            <FederatedSessionHub
              language={language}
              userEmail={userEmail}
              userProfile={userProfile}
              activeTenant={activeTenant}
              summary={summary}
              crmDealsCount={crmDeals.length}
            />

            {/* Row 2, 3, 4: Sales Data Presentation Area */}
            {activeTenant && (
              dbStatus && dbStatus.provider === 'PostgreSQL' && !dbStatus.salesTableExists ? (
                <div className="w-full mb-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-6 text-start backdrop-blur-md">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-amber-500/20 text-amber-400 rounded-2xl">
                      <Database className="w-6 h-6 animate-pulse" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-base font-bold text-white font-display">
                        {language === 'ar' ? 'تنبيه: الرجاء استكمال الجدول المطلوب' : 'Alert: Please complete the required table'}
                      </h3>
                      <p className="text-xs text-amber-200/80 font-light mt-1 max-w-2xl leading-relaxed">
                        {language === 'ar' ? (
                          <>
                            متصل بقاعدة البيانات بنجاح، ولكن <strong>جدول المبيعات ({dbStatus.salesTableName || 'sales_records'})</strong> غير موجود حالياً. 
                            الرجاء استكمال هيكل البيانات المذكور أدناه أو استيراد الجدول في قاعدة بياناتك لعرض مؤشرات المبيعات والرسوم البيانية بشكل طبيعي.
                          </>
                        ) : (
                          <>
                            Successfully connected to the database, but the <strong>sales table ({dbStatus.salesTableName || 'sales_records'})</strong> is currently missing. 
                            Please complete the required schema or import the table in your database to visualize sales KPIs and charts.
                          </>
                        )}
                      </p>
                      
                      <div className="mt-4 bg-slate-950/80 rounded-xl p-3 border border-slate-900 font-mono text-[11px] text-slate-300 overflow-x-auto">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider block mb-1 font-bold">SQL SCHEMA TEMPLATE</span>
                        {`CREATE TABLE ${dbStatus.salesTableName || 'sales_records'} (
  id SERIAL PRIMARY KEY,
  tenant_id VARCHAR(100),
  date DATE,
  product VARCHAR(255),
  campaign VARCHAR(255),
  revenue NUMERIC(15, 2),
  cost NUMERIC(15, 2),
  units INTEGER,
  is_anomaly BOOLEAN,
  anomaly_reason TEXT
);`}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <KPICards
                    summary={summary}
                    activeTenant={activeTenant}
                    language={language}
                  />

                  <div className="w-full mb-6">
                    <SalesChart
                      historicalData={chartData}
                      forecastData={forecastData}
                      activeTenant={activeTenant}
                      forecastLoading={forecastLoading}
                      onTriggerForecast={handleTriggerForecast}
                      forecastAnalysis={forecastAnalysis}
                      language={language}
                    />
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                    <div className="lg:col-span-1">
                      <ProductsPieChart 
                        data={summary?.productDistribution || []} 
                        language={language} 
                      />
                    </div>
                    <div className="lg:col-span-2">
                      <StrategicReport
                        reportText={reportText}
                        loading={reportLoading}
                        onGenerateReport={handleGenerateReport}
                        onExportCSV={handleExportCSV}
                        activeTenantName={activeTenant.name}
                        language={language}
                        summary={summary}
                      />
                    </div>
                  </div>
                </>
              )
            )}

            {/* Row 5: Secondary Business Actions & Audits */}
            {activeTenant && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <CRMTracker
                    deals={crmDeals}
                    loading={crmLoading}
                    onSyncCRM={handleSyncCRM}
                    activeTenant={activeTenant}
                    language={language}
                    syncHistory={syncHistory}
                    syncHistoryLoading={syncHistoryLoading}
                    dbStatus={dbStatus}
                  />
                </div>
                <div>
                  <AnomaliesList
                    anomalies={summary.anomalies}
                    activeTenant={activeTenant}
                    language={language}
                  />
                </div>
              </div>
            )}
          </>
        )}

      </main>

      {/* Corporate footer */}
      <footer className="border-t border-slate-900/60 bg-slate-950/40 py-6 text-center text-xs text-slate-500 font-light mt-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <p>{t.copyright}</p>
          <div className="flex gap-4 justify-center sm:justify-end">
            <a href="#" className="hover:text-slate-300 transition-colors">{t.privacy}</a>
            <a href="#" className="hover:text-slate-300 transition-colors">{t.apiSpecs}</a>
            <a href="#" className="hover:text-slate-300 transition-colors">{t.terms}</a>
          </div>
        </div>
      </footer>

      <RegisterTenantModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        language={language}
        onOnboardSuccess={handleOnboardSuccess}
      />

      <TenantSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        tenant={activeTenant}
        language={language}
        onUpdateSuccess={(updatedTenant) => {
          addAuditLog(
            userEmail,
            'WORKSPACE',
            `Updated settings for tenant workspace: ${updatedTenant.name} (${updatedTenant.id}) - Currency set to ${updatedTenant.currency || 'USD'}.`,
            'SUCCESS'
          );
          setTenants((prev) =>
            prev.map((t) => (t.id === updatedTenant.id ? updatedTenant : t))
          );
          setActiveTenant(updatedTenant);
          addNotification(
            'SYSTEM',
            'Workspace Configuration Updated',
            'تم تحديث إعدادات مساحة العمل',
            `Successfully modified configuration parameters for ${updatedTenant.name}.`,
            `تم بنجاح تعديل معلمات الإعداد لمساحة عمل ${updatedTenant.name}.`
          );
        }}
        onDeleteSuccess={(deletedTenantId) => {
          addAuditLog(
            userEmail,
            'WORKSPACE',
            `Deleted tenant workspace ID: ${deletedTenantId}`,
            'SUCCESS'
          );
          
          setTenants((prev) => {
            const filtered = prev.filter((t) => t.id !== deletedTenantId);
            if (activeTenant?.id === deletedTenantId) {
              setActiveTenant(filtered.length > 0 ? filtered[0] : null);
            }
            return filtered;
          });

          addNotification(
            'SYSTEM',
            'Workspace Deleted',
            'تم حذف مساحة العمل',
            `Successfully deleted workspace of ID ${deletedTenantId}.`,
            `تم بنجاح حذف مساحة العمل ذات المعرف ${deletedTenantId}.`
          );
        }}
      />

      <SubscriptionPlanModal
        isOpen={isSubscriptionModalOpen}
        language={language}
        onSelectPlan={(planId) => {
          setIsSubscriptionModalOpen(false);
          // If we had a checkout, we could trigger it here or inside the modal
        }}
        activeTenant={activeTenant}
        onCheckoutSuccess={() => {
          setIsSubscriptionModalOpen(false);
          addNotification(
            'SYSTEM',
            'Payment Successful',
            'تم الدفع بنجاح',
            `Your subscription has been updated.`,
            `تم تحديث اشتراكك بنجاح.`
          );
          // Refresh billing info by triggering a state update or relying on active view
          setActiveView('dashboard');
          setTimeout(() => setActiveView('billing'), 100);
        }}
        onCancel={() => setIsSubscriptionModalOpen(false)}
      />

      {activeTenant && (
        <AIAssistant
          messages={chatMessages}
          onSendMessage={handleSendMessage}
          onClearHistory={() => {
            setChatMessages([]);
            saveChatHistory([]);
          }}
          onAutoSummarize={handleAutoSummarize}
          activeTenant={activeTenant}
          loading={chatLoading}
          language={language}
        />
      )}

      <OnboardingTour
        run={runTour}
        language={language}
        onClose={() => {
          setRunTour(false);
          localStorage.setItem('sniper_onboarding_completed', 'true');
        }}
      />
    </div>
  );
}
