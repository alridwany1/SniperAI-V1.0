import { useToast } from './components/Toast';
import { useApp } from './context/AppContext';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Tenant, SalesRecord, MetricSummary, ForecastRecord, ChatMessage, CRMDeal, AppNotification, SyncHistoryEntry } from './types';
import FilterBar from './components/FilterBar';
import KPICards from './components/KPICards';
import SalesChart from './components/SalesChart';
import AIAssistant from './components/AIAssistant';
import StrategicReport from './components/StrategicReport';
import CRMTracker from './components/CRMTracker';
import AnomaliesList from './components/AnomaliesList';
import AuthPage from './components/AuthPage';
import MarketingSplash from './components/MarketingSplash';
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
import LegalAndApiModal from './components/LegalAndApiModal';
import { translations, Language } from './utils/translations';
import { Layers, Shield, Sparkles, TrendingUp, Cpu, Radio, Globe, LogOut, PlusCircle, Users, CreditCard, User, Database, RefreshCw, Package, Settings, Eye, EyeOff, ArrowUp, ArrowDown, GripVertical, SlidersHorizontal } from 'lucide-react';
import { addAuditLog } from './utils/auditLogger';
import sniperLogo from './assets/images/sniper_ai_logo_1783155755401.jpg';
import { db, handleFirestoreError, OperationType } from './utils/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export default function App() {
  const { showToast } = useToast();
  const {
    userEmail, setUserEmail,
    isAuthenticated, setIsAuthenticated,
    activeTenant, setActiveTenant,
    selectedTenantId, setSelectedTenantId,
    tenants, setTenants,
    language, setLanguage
  } = useApp();
  // Authentication & language states
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    return !sessionStorage.getItem('has_seen_splash');
  });
  

  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState<boolean>(false);
  const [isSubscriptionModalOpen, setIsSubscriptionModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms' | 'apiSpecs'>('privacy');
  const [runTour, setRunTour] = useState<boolean>(false);

  // Dashboard layout configuration state
  interface DashboardWidget {
    id: string;
    nameEn: string;
    nameAr: string;
    visible: boolean;
  }

  const [dashboardWidgets, setDashboardWidgets] = useState<DashboardWidget[]>([
    { id: 'kpi_cards', nameEn: 'KPI Summary Cards', nameAr: 'بطاقات مؤشرات الأداء الرئيسي', visible: true },
    { id: 'sales_chart', nameEn: 'Sales Chart & AI Forecast', nameAr: 'مخطط المبيعات والتنبؤ الذكي', visible: true },
    { id: 'pie_chart', nameEn: 'Product Distribution', nameAr: 'توزيع مبيعات المنتجات', visible: true },
    { id: 'strategic_report', nameEn: 'Strategic Executive Report', nameAr: 'التقرير الاستراتيجي التنفيذي', visible: true },
    { id: 'crm_tracker', nameEn: 'CRM Deals Tracker', nameAr: 'مستكشف صفقات العملاء CRM', visible: true },
    { id: 'anomalies', nameEn: 'Financial Anomaly Audit', nameAr: 'تدقيق المعاملات المالية الشاذة', visible: true },
  ]);
  const [isCustomizerOpen, setIsCustomizerOpen] = useState<boolean>(false);

  // Load custom workspace configuration
  useEffect(() => {
    const saved = localStorage.getItem('sniper_dashboard_layout');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const merged = [
            { id: 'kpi_cards', nameEn: 'KPI Summary Cards', nameAr: 'بطاقات مؤشرات الأداء الرئيسي', visible: true },
            { id: 'sales_chart', nameEn: 'Sales Chart & AI Forecast', nameAr: 'مخطط المبيعات والتنبؤ الذكي', visible: true },
            { id: 'pie_chart', nameEn: 'Product Distribution', nameAr: 'توزيع مبيعات المنتجات', visible: true },
            { id: 'strategic_report', nameEn: 'Strategic Executive Report', nameAr: 'التقرير الاستراتيجي التنفيذي', visible: true },
            { id: 'crm_tracker', nameEn: 'CRM Deals Tracker', nameAr: 'مستكشف صفقات العملاء CRM', visible: true },
            { id: 'anomalies', nameEn: 'Financial Anomaly Audit', nameAr: 'تدقيق المعاملات المالية الشاذة', visible: true },
          ].map(def => {
            const match = parsed.find((p: any) => p.id === def.id);
            const isVisible = match ? match.visible : def.visible;
            const orderIdx = match ? parsed.findIndex((p: any) => p.id === def.id) : 99;
            return { ...def, visible: isVisible, orderIdx };
          });
          merged.sort((a, b) => a.orderIdx - b.orderIdx);
          setDashboardWidgets(merged.map(({ orderIdx, ...rest }) => rest));
        }
      } catch (e) {
        console.error("Error reading saved layout:", e);
      }
    }
  }, []);

  const handleToggleWidget = (id: string) => {
    const updated = dashboardWidgets.map(w => w.id === id ? { ...w, visible: !w.visible } : w);
    setDashboardWidgets(updated);
    localStorage.setItem('sniper_dashboard_layout', JSON.stringify(updated));
  };

  const handleMoveWidget = (index: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= dashboardWidgets.length) return;
    
    const updated = [...dashboardWidgets];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    
    setDashboardWidgets(updated);
    localStorage.setItem('sniper_dashboard_layout', JSON.stringify(updated));
  };

  const handleResetLayout = () => {
    const defaults = [
      { id: 'kpi_cards', nameEn: 'KPI Summary Cards', nameAr: 'بطاقات مؤشرات الأداء الرئيسي', visible: true },
      { id: 'sales_chart', nameEn: 'Sales Chart & AI Forecast', nameAr: 'مخطط المبيعات والتنبؤ الذكي', visible: true },
      { id: 'pie_chart', nameEn: 'Product Distribution', nameAr: 'توزيع مبيعات المنتجات', visible: true },
      { id: 'strategic_report', nameEn: 'Strategic Executive Report', nameAr: 'التقرير الاستراتيجي التنفيذي', visible: true },
      { id: 'crm_tracker', nameEn: 'CRM Deals Tracker', nameAr: 'مستكشف صفقات العملاء CRM', visible: true },
      { id: 'anomalies', nameEn: 'Financial Anomaly Audit', nameAr: 'تدقيق المعاملات المالية الشاذة', visible: true },
    ];
    setDashboardWidgets(defaults);
    localStorage.setItem('sniper_dashboard_layout', JSON.stringify(defaults));
    showToast(language === 'ar' ? 'تمت استعادة تخطيط لوحة التحكم الافتراضي' : 'Default dashboard layout restored', 'success');
  };

  

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
    bio?: string;
    plan?: string;
  } | null>(null);

  const [isLoadingProfile, setIsLoadingProfile] = useState<boolean>(true);

  // Config state
  
  

  // Filter state
  
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
      .catch(err => { console.error("Error fetching tenants:", err); showToast("Error fetching tenants", "error"); });
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
        let tenantId = data.tenantId || '';
        let fullName = data.fullName || 'User';
        let role = data.role || 'Member';
        let company = data.company || 'Organization';
        let avatarId = data.avatarId || 'av1';
        let bio = data.bio || '';
        let plan = data.plan || (data.bio && data.bio.toLowerCase().includes('plan:') ? data.bio.toLowerCase().split('plan:')[1].trim() : 'monthly');

        if (emailKey === 'executive@sniper.ai') {
          tenantId = 'apex-logistics';
          fullName = 'Executive User';
          role = 'Executive Partner';
          company = 'Apex Logistics';
          avatarId = 'av2';
          bio = 'Executive User Account';
          plan = 'enterprise';
        }

        const profile = {
          fullName,
          role,
          company,
          avatarId,
          tenantId,
          bio,
          plan
        };
        setUserProfile(profile);
        localStorage.setItem(cacheKey, JSON.stringify({ ...data, ...profile }));
        if (profile.tenantId && profile.tenantId !== selectedTenantId) {
          console.log("Setting selectedTenantId from user profile:", profile.tenantId);
          setSelectedTenantId(profile.tenantId);
        }

        // Write back if we forced it for the executive account and it is not in sync
        if (emailKey === 'executive@sniper.ai' && (!data.tenantId || data.tenantId !== 'apex-logistics')) {
          try {
            await setDoc(docRef, {
              fullName,
              role,
              company,
              avatarId,
              tenantId,
              bio: 'Executive User Account',
              location: 'Riyadh, Saudi Arabia',
              phone: '+966 50 111 2222',
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (writeErr) {
            console.error("Failed to update executive tenantId in Firestore:", writeErr);
          }
        }
      } else {
        // Fallback to cache if available
        const cachedStr = localStorage.getItem(cacheKey);
        if (cachedStr) {
          const cachedData = JSON.parse(cachedStr);
          let tenantId = cachedData.tenantId || '';
          let fullName = cachedData.fullName || 'User';
          let role = cachedData.role || 'Member';
          let company = cachedData.company || 'Organization';
          let avatarId = cachedData.avatarId || 'av1';

          if (emailKey === 'executive@sniper.ai') {
            tenantId = 'apex-logistics';
            fullName = 'Executive User';
            role = 'Executive Partner';
            company = 'Apex Logistics';
            avatarId = 'av2';
          }

          const profile = {
            fullName,
            role,
            company,
            avatarId,
            tenantId,
            bio: cachedData.bio || '',
            plan: cachedData.plan || (cachedData.bio && cachedData.bio.toLowerCase().includes('plan:') ? cachedData.bio.toLowerCase().split('plan:')[1].trim() : 'monthly')
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
            tenantId: payload.tenantId,
            bio: payload.bio,
            plan: 'enterprise'
          });
          setSelectedTenantId('root');

          if (!isOffline) {
            try {
              await setDoc(docRef, payload);
            } catch (writeErr) {
              console.warn("Failed to write admin profile to Firestore (using offline mode):", writeErr);
            }
          }
        } else if (emailKey === 'executive@sniper.ai') {
          const payload = {
            fullName: 'Executive User',
            phone: '+966 50 111 2222',
            role: 'Executive Partner',
            company: 'Apex Logistics',
            bio: 'Executive User Account',
            location: 'Riyadh, Saudi Arabia',
            avatarId: 'av2',
            updatedAt: new Date().toISOString(),
            tenantId: 'apex-logistics',
          };
          localStorage.setItem(cacheKey, JSON.stringify(payload));
          setUserProfile({
            fullName: payload.fullName,
            role: payload.role,
            company: payload.company,
            avatarId: payload.avatarId,
            tenantId: payload.tenantId,
            bio: payload.bio,
            plan: 'enterprise'
          });
          setSelectedTenantId('apex-logistics');

          if (!isOffline) {
            try {
              await setDoc(docRef, payload);
            } catch (writeErr) {
              console.warn("Failed to write executive profile to Firestore (using offline mode):", writeErr);
            }
          }
        } else {
          const payload = {
            fullName: 'New Partner Node',
            phone: '',
            role: 'Operations Lead',
            company: 'Workspace Partner',
            bio: 'Synchronized with active federated dashboard. Plan: MONTHLY',
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
            tenantId: payload.tenantId,
            bio: payload.bio,
            plan: 'monthly'
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
      console.error("Error loading user profile:", err); showToast("Error loading user profile", "error");
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
      .catch(err => { console.error("Error loading metrics:", err); showToast("Error loading metrics", "error"); });
  };

  // Get CRM status
  const fetchCRMDeals = () => {
    return fetch(`/api/crm/deals/${selectedTenantId}`)
      .then(res => res.json())
      .then((deals) => setCrmDeals(deals))
      .catch(err => { console.error("Error loading CRM deals:", err); showToast("Error loading CRM deals", "error"); });
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
        console.error("Error loading CRM sync history:", err); showToast("Error loading CRM sync history", "error");
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
      console.error("Manual refresh failed:", err); showToast("Manual refresh failed", "error");
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
        console.error("Forecasting failed:", err); showToast("Forecasting failed", "error");
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
        language,
        userEmail: userEmail || undefined,
        userProfile: userProfile || undefined
      })
    })
      .then(res => res.json())
      .then((data) => {
        const modelMsg: ChatMessage = {
          id: `model-${Date.now()}`,
          role: 'model',
          text: data.text,
          timestamp: new Date().toLocaleTimeString(),
          tableData: data.tableData,
          action: data.action
        };
        const updatedWithModel = [...updatedWithUser, modelMsg];
        setChatMessages(updatedWithModel);
        saveChatHistory(updatedWithModel);
        setChatLoading(false);

        // Execute action if provided
        if (data.action && data.action.type === 'navigate_to') {
          const view = data.action.payload;
          if (['dashboard', 'users', 'billing', 'profile', 'inventory'].includes(view)) {
            setActiveView(view as any);
            showToast(
              language === 'ar' 
                ? `جاري الانتقال التلقائي إلى واجهة: ${view === 'dashboard' ? 'لوحة التحكم الرئيسي' : view === 'users' ? 'إدارة المستخدمين' : view === 'billing' ? 'الفواتير والاشتراكات' : view === 'profile' ? 'الملف الشخصي' : 'مستودع مخزون المنتجات'}` 
                : `Navigating automatically to ${view} screen...`, 
              "info"
            );
          }
        }
      })
      .catch(err => {
        console.error("Chat failed:", err); showToast("Chat failed", "error");
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
        console.error("Auto-summarization failed:", err); showToast("Auto-summarization failed", "error");
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
        console.error("Report generation failed:", err); showToast("Report generation failed", "error");
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
        console.error("CRM Sync failed:", err); showToast("CRM Sync failed", "error");
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
        console.error('Failed to link user profile to tenant in Firestore:', err); showToast("Failed to link user profile", "error");
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
      console.error("Failed to update tenant products in Firestore:", e); showToast("Failed to update tenant products", "error");
    }

    setTenants(prev => prev.map(t => t.id === activeTenant.id ? updatedTenant : t));
    setActiveTenant(updatedTenant);
  };

  if (!isAuthenticated) {
    if (showSplash) {
      return (
        <MarketingSplash
          language={language}
          onLanguageToggle={handleLanguageToggle}
          onFinish={() => {
            sessionStorage.setItem('has_seen_splash', 'true');
            setShowSplash(false);
          }}
        />
      );
    }

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

            {/* Workspace Customizer Controls */}
            {activeTenant && (
              <div className="bg-slate-900/20 backdrop-blur-md border border-slate-900/80 rounded-2xl p-4 mb-6 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className={`flex items-center gap-2.5 ${language === 'ar' ? 'flex-row-reverse text-right' : 'flex-row text-left'}`}>
                    <div className="p-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
                      <SlidersHorizontal className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-bold text-slate-200 font-display">
                        {language === 'ar' ? 'مخصِص مساحة العمل' : 'Workspace Customizer'}
                      </h3>
                      <p className="text-[10px] text-slate-400">
                        {language === 'ar' ? 'أعد ترتيب أو إخفاء عناصر لوحة التحكم لتناسب احتياجك' : 'Reorder or toggle dashboard components to fit your flow'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-center">
                    <button
                      onClick={handleResetLayout}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px] font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
                    >
                      {language === 'ar' ? 'إعادة التخطيط الافتراضي' : 'Reset Layout'}
                    </button>
                    <button
                      onClick={() => setIsCustomizerOpen(!isCustomizerOpen)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                        isCustomizerOpen 
                          ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-950/25' 
                          : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                      }`}
                    >
                      <Settings className={`w-3 h-3 ${isCustomizerOpen ? 'animate-spin' : ''}`} />
                      <span>{isCustomizerOpen ? (language === 'ar' ? 'حفظ وإغلاق التخصيص' : 'Save & Close') : (language === 'ar' ? 'تخصيص المظهر والتخطيط' : 'Customize Layout')}</span>
                    </button>
                  </div>
                </div>

                {/* Customizer Panel */}
                <AnimatePresence>
                  {isCustomizerOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-4 border-t border-slate-900 pt-4"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {dashboardWidgets.map((widget, idx) => {
                          const isFirst = idx === 0;
                          const isLast = idx === dashboardWidgets.length - 1;
                          return (
                            <div 
                              key={widget.id} 
                              className={`flex items-center justify-between p-3 bg-slate-950/60 hover:bg-slate-950/90 border rounded-xl transition-all ${
                                widget.visible ? 'border-slate-800/80' : 'border-slate-900/40 opacity-50'
                              }`}
                            >
                              <div className={`flex items-center gap-2.5 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                                <div className="text-slate-500 hover:text-slate-400 cursor-grab active:cursor-grabbing">
                                  <GripVertical className="w-3.5 h-3.5" />
                                </div>
                                <div className={language === 'ar' ? 'text-right' : 'text-left'}>
                                  <p className="text-[11px] font-semibold text-slate-200">
                                    {language === 'ar' ? widget.nameAr : widget.nameEn}
                                  </p>
                                  <span className="text-[9px] text-slate-500 font-mono">
                                    {widget.id}
                                  </span>
                                </div>
                              </div>

                              <div className={`flex items-center gap-1.5 ${language === 'ar' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Reordering Arrows */}
                                <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800">
                                  <button
                                    onClick={() => handleMoveWidget(idx, 'up')}
                                    disabled={isFirst}
                                    className={`p-1 rounded text-slate-500 hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors cursor-pointer`}
                                    title="Move Up"
                                  >
                                    <ArrowUp className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleMoveWidget(idx, 'down')}
                                    disabled={isLast}
                                    className={`p-1 rounded text-slate-500 hover:text-indigo-400 disabled:opacity-20 disabled:hover:text-slate-500 transition-colors cursor-pointer`}
                                    title="Move Down"
                                  >
                                    <ArrowDown className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                {/* Visibility Toggle Button */}
                                <button
                                  onClick={() => handleToggleWidget(widget.id)}
                                  className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                    widget.visible 
                                      ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                                      : 'bg-rose-500/5 border-rose-500/10 text-rose-500 hover:bg-rose-500/10'
                                  }`}
                                  title={widget.visible ? 'Hide widget' : 'Show widget'}
                                >
                                  {widget.visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {/* Dashboard Presentation Area (Personalized / Reorderable 6-column Grid) */}
            {activeTenant && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                {dashboardWidgets.map((widget) => {
                  if (!widget.visible) return null;

                  switch (widget.id) {
                    case 'kpi_cards':
                      return (
                        <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-6 transition-all duration-300">
                          <KPICards
                            summary={summary}
                            activeTenant={activeTenant}
                            language={language}
                          />
                        </div>
                      );

                    case 'sales_chart':
                      return (
                        <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-6 transition-all duration-300">
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
                      );

                    case 'pie_chart':
                      return (
                        <div key={widget.id} className="col-span-1 md:col-span-1 lg:col-span-2 transition-all duration-300">
                          <ProductsPieChart 
                            data={summary?.productDistribution || []} 
                            language={language} 
                          />
                        </div>
                      );

                    case 'strategic_report':
                      return (
                        <div key={widget.id} className="col-span-1 md:col-span-2 lg:col-span-4 transition-all duration-300">
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
                      );

                    case 'crm_tracker':
                      return (
                        <div key={widget.id} className="col-span-1 md:col-span-1 lg:col-span-3 transition-all duration-300">
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
                      );

                    case 'anomalies':
                      return (
                        <div key={widget.id} className="col-span-1 md:col-span-1 lg:col-span-3 transition-all duration-300">
                          <AnomaliesList
                            anomalies={summary.anomalies}
                            activeTenant={activeTenant}
                            language={language}
                          />
                        </div>
                      );

                    default:
                      return null;
                  }
                })}
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
            <button
              onClick={() => {
                setLegalModalTab('privacy');
                setIsLegalModalOpen(true);
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none text-slate-500 text-xs"
            >
              {t.privacy}
            </button>
            <button
              onClick={() => {
                setLegalModalTab('apiSpecs');
                setIsLegalModalOpen(true);
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none text-slate-500 text-xs"
            >
              {t.apiSpecs}
            </button>
            <button
              onClick={() => {
                setLegalModalTab('terms');
                setIsLegalModalOpen(true);
              }}
              className="hover:text-slate-300 transition-colors cursor-pointer bg-transparent border-none text-slate-500 text-xs"
            >
              {t.terms}
            </button>
          </div>
        </div>
      </footer>

      <RegisterTenantModal
        isOpen={isOnboardModalOpen}
        onClose={() => setIsOnboardModalOpen(false)}
        language={language}
        onOnboardSuccess={handleOnboardSuccess}
        userEmail={userEmail}
        userProfile={userProfile}
        tenants={tenants}
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

      <LegalAndApiModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        initialTab={legalModalTab}
        language={language}
      />
    </div>
  );
}
