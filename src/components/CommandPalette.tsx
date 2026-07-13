import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, Command, X, Globe, Package, FileText, 
  TrendingUp, AlertTriangle, CreditCard, User, Users, ChevronRight, CornerDownLeft
} from 'lucide-react';
import { Tenant } from '../types';
import { Language } from '../utils/translations';

interface CommandPaletteProps {
  tenants: Tenant[];
  activeTenant: Tenant | null;
  onSelectTenant: (id: string) => void;
  selectedProduct: string;
  onSelectProduct: (product: string) => void;
  activeView: 'dashboard' | 'users' | 'billing' | 'profile' | 'inventory';
  setActiveView: (view: 'dashboard' | 'users' | 'billing' | 'profile' | 'inventory') => void;
  isSuperAdmin: boolean;
  language: Language;
}

interface SearchItem {
  id: string;
  type: 'workspace' | 'product' | 'report';
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  action: () => void;
  badge?: string;
}

export default function CommandPalette({
  tenants,
  activeTenant,
  onSelectTenant,
  selectedProduct,
  onSelectProduct,
  activeView,
  setActiveView,
  isSuperAdmin,
  language,
}: CommandPaletteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const isRtl = language === 'ar';

  // Toggle palette shortcut: Ctrl+K or Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Prevent background scrolling when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setSearchQuery('');
      setSelectedIndex(0);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Smooth scroll helper for keyboard navigation
  const scrollToActiveItem = (index: number) => {
    if (!listRef.current) return;
    const container = listRef.current;
    const activeElement = container.children[index] as HTMLElement;
    if (!activeElement) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const elemTop = activeElement.offsetTop;
    const elemBottom = elemTop + activeElement.clientHeight;

    if (elemTop < containerTop) {
      container.scrollTop = elemTop;
    } else if (elemBottom > containerBottom) {
      container.scrollTop = elemBottom - container.clientHeight;
    }
  };

  // Compile all searchable items
  const getSearchItems = (): SearchItem[] => {
    const items: SearchItem[] = [];

    // 1. Navigation / Reports View items
    items.push({
      id: 'nav-dashboard',
      type: 'report',
      title: isRtl ? 'لوحة القيادة التنفيذية' : 'Executive Dashboard Overview',
      subtitle: isRtl ? 'المؤشرات الرئيسية والرسوم البيانية' : 'Primary KPI dashboards and metric charts',
      icon: <Globe className="w-4 h-4 text-indigo-400" />,
      action: () => {
        setActiveView('dashboard');
        setIsOpen(false);
      },
      badge: isRtl ? 'عرض' : 'View'
    });

    items.push({
      id: 'nav-strategic-report',
      type: 'report',
      title: isRtl ? 'تقرير التحليل الاستراتيجي (AI)' : 'AI Strategic Analysis Report',
      subtitle: isRtl ? 'التقرير الاستراتيجي المولد بالذكاء الاصطناعي للمؤسسة' : 'AI-generated strategic performance reporting',
      icon: <FileText className="w-4 h-4 text-emerald-400" />,
      action: () => {
        setActiveView('dashboard');
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('strategic-report-panel');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
            }, 2000);
          }
        }, 150);
      },
      badge: isRtl ? 'تقرير' : 'Report'
    });

    items.push({
      id: 'nav-crm',
      type: 'report',
      title: isRtl ? 'متتبع المبيعات وصفقات العملاء (CRM)' : 'CRM Sales Pipeline Tracker',
      subtitle: isRtl ? 'صفقات المبيعات النشطة وعلاقات العملاء' : 'Active sales deals and customer accounts',
      icon: <TrendingUp className="w-4 h-4 text-teal-400" />,
      action: () => {
        setActiveView('dashboard');
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('crm-tracker-panel');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
            }, 2000);
          }
        }, 150);
      },
      badge: isRtl ? 'أداة' : 'Tool'
    });

    items.push({
      id: 'nav-anomalies',
      type: 'report',
      title: isRtl ? 'سجل العمليات الشاذة والتنبيهات (AI)' : 'AI Anomalies & Incidents Log',
      subtitle: isRtl ? 'التنبيهات والتحذيرات الذكية للعمليات' : 'Flagged system deviation, stability warnings',
      icon: <AlertTriangle className="w-4 h-4 text-amber-400" />,
      action: () => {
        setActiveView('dashboard');
        setIsOpen(false);
        setTimeout(() => {
          const el = document.getElementById('anomalies-list-panel');
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-indigo-500', 'ring-offset-2', 'ring-offset-slate-950');
            }, 2000);
          }
        }, 150);
      },
      badge: isRtl ? 'أمن' : 'Audit'
    });

    items.push({
      id: 'nav-billing',
      type: 'report',
      title: isRtl ? 'نظام الفوترة والاشتراكات' : 'Billing, Invoicing & Subscription Plans',
      subtitle: isRtl ? 'إدارة الخطط وترقيات مستويات الخدمة المالي' : 'Manage enterprise billing levels and limits',
      icon: <CreditCard className="w-4 h-4 text-violet-400" />,
      action: () => {
        setActiveView('billing');
        setIsOpen(false);
      },
      badge: isRtl ? 'مالي' : 'Billing'
    });

    items.push({
      id: 'nav-profile',
      type: 'report',
      title: isRtl ? 'الملف الشخصي وخصائص الحساب' : 'User Profile Settings',
      subtitle: isRtl ? 'المعلومات الشخصية والربط الفيدرالي للموظف' : 'Personal employee coordinates and workspace metrics',
      icon: <User className="w-4 h-4 text-pink-400" />,
      action: () => {
        setActiveView('profile');
        setIsOpen(false);
      },
      badge: isRtl ? 'حساب' : 'Profile'
    });

    if (isSuperAdmin) {
      items.push({
        id: 'nav-users',
        type: 'report',
        title: isRtl ? 'إدارة المستخدمين والمستأجرين' : 'User Management & Team Profiles',
        subtitle: isRtl ? 'صلاحيات الدخول وإضافة مساحات عمل المستأجرين' : 'Configure tenant workspaces, assign system privileges',
        icon: <Users className="w-4 h-4 text-cyan-400" />,
        action: () => {
          setActiveView('users');
          setIsOpen(false);
        },
        badge: isRtl ? 'إشراف' : 'Admin'
      });
    }

    // 2. Tenants (Workspaces)
    const uniqueTenants = Array.from(new Map(tenants.map(t => [t.id, t])).values());
    uniqueTenants.forEach((t) => {
      items.push({
        id: `tenant-${t.id}`,
        type: 'workspace',
        title: t.name,
        subtitle: `${isRtl ? 'مساحة عمل' : 'Workspace'} • ${t.industry} • ${t.products.length} ${isRtl ? 'منتجات' : 'Products'}`,
        icon: (
          <div 
            className="w-4 h-4 rounded-full border border-slate-700 shrink-0" 
            style={{ backgroundColor: t.accentColor || '#6366f1' }}
          />
        ),
        action: () => {
          onSelectTenant(t.id);
          setActiveView('dashboard');
          setIsOpen(false);
        },
        badge: isRtl ? 'مساحة' : 'Workspace'
      });

      // 3. Products
      t.products.forEach((p) => {
        items.push({
          id: `product-${t.id}-${p.name.replace(/\s+/g, '-').toLowerCase()}`,
          type: 'product',
          title: p.name,
          subtitle: `${isRtl ? 'منتج في' : 'Product in'} ${t.name} • ${isRtl ? 'التكلفة' : 'Cost'}: $${p.costOfGoods} • ${isRtl ? 'السعر' : 'Price'}: $${p.price}`,
          icon: <Package className="w-4 h-4 text-slate-400 shrink-0" />,
          action: () => {
            onSelectTenant(t.id);
            onSelectProduct(p.name);
            setActiveView('dashboard');
            setIsOpen(false);
          },
          badge: isRtl ? 'منتج' : 'Product'
        });
      });
    });

    const uniqueMap = new Map<string, SearchItem>();
    items.forEach(item => {
      uniqueMap.set(item.id, item);
    });
    return Array.from(uniqueMap.values());
  };

  // Filter items based on query
  const searchItems = getSearchItems();
  const filteredItems = searchQuery.trim() === ''
    ? searchItems.slice(0, 8) // Show defaults
    : searchItems.filter(item => 
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.badge?.toLowerCase().includes(searchQuery.toLowerCase())
      );

  // Manage keyboard events inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev < filteredItems.length - 1 ? prev + 1 : 0;
        scrollToActiveItem(next);
        return next;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => {
        const next = prev > 0 ? prev - 1 : filteredItems.length - 1;
        scrollToActiveItem(next);
        return next;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[selectedIndex]) {
        filteredItems[selectedIndex].action();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Header Search Trigger Button */}
      <div 
        id="global-search-container"
        className="relative w-full max-w-xs cursor-pointer select-none"
        onClick={() => setIsOpen(true)}
      >
        <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 transition-all rounded-xl px-3 py-1.5 text-xs text-slate-400 w-full justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isRtl ? 'بحث سريع... ' : 'Quick search...'}</span>
          </div>
          <kbd className="hidden sm:inline-flex h-5 select-none items-center gap-0.5 rounded border border-slate-800 bg-slate-950 px-1.5 font-mono text-[9px] font-medium text-slate-500">
            <Command className="w-2.5 h-2.5" /> K
          </kbd>
        </div>
      </div>

      {/* Command Palette Overlay Backdrop */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
            {/* Backdrop Blur overlay */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-slate-950/80 backdrop-blur-md"
            />

            {/* Main Command Dialogue Window */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
              className="relative bg-slate-950/95 border border-slate-900/90 w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh] z-10"
              onKeyDown={handleKeyDown}
            >
              {/* Top Search Area */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-900/80">
                <Search className="w-5 h-5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setSelectedIndex(0);
                  }}
                  placeholder={isRtl ? 'ابحث عن مساحة عمل، منتج، أو تقرير... (Ctrl+K)' : 'Search workspaces, products, or reports... (Ctrl+K)'}
                  className="bg-transparent border-0 outline-none text-sm text-slate-100 placeholder-slate-500 w-full focus:ring-0 focus:outline-none"
                  style={{ direction: isRtl ? 'rtl' : 'ltr' }}
                />
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-900 rounded-lg transition-all"
                  aria-label="Close command palette"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Items scroll list */}
              <div 
                ref={listRef}
                className="overflow-y-auto flex-1 p-2 space-y-0.5 max-h-[45vh] scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
                style={{ direction: isRtl ? 'rtl' : 'ltr' }}
              >
                {filteredItems.length > 0 ? (
                  filteredItems.map((item, index) => {
                    const isSelected = selectedIndex === index;
                    return (
                      <div
                        key={item.id}
                        onClick={item.action}
                        onMouseEnter={() => setSelectedIndex(index)}
                        className={`flex items-center justify-between px-3.5 py-3 rounded-xl cursor-pointer select-none transition-all ${
                          isSelected 
                            ? 'bg-slate-900/80 text-white' 
                            : 'text-slate-400 hover:bg-slate-900/40 hover:text-slate-200'
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? 'bg-slate-950 text-white' : 'bg-slate-950/40'}`}>
                            {item.icon}
                          </div>
                          <div className="min-w-0 text-start">
                            <p className="text-xs font-semibold truncate leading-tight">
                              {item.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 truncate leading-tight">
                              {item.subtitle}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {item.badge && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold font-mono bg-slate-900/60 text-slate-500 uppercase border border-slate-800">
                              {item.badge}
                            </span>
                          )}
                          {isSelected && (
                            <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-slate-400 text-xs font-medium">
                      {isRtl ? 'لم يتم العثور على نتائج للبحث.' : 'No results found for your search.'}
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1 font-light">
                      {isRtl ? 'جرب البحث بكلمات أخرى مثل "Apex" أو "Strategic" أو "Billing"' : 'Try searching other terms like "Apex", "Strategic" or "Billing"'}
                    </p>
                  </div>
                )}
              </div>

              {/* Bottom Hotkey Help Area */}
              <div className="px-4 py-2 bg-slate-950 border-t border-slate-900 text-[10px] text-slate-500 flex justify-between items-center select-none font-mono">
                <div className="flex items-center gap-3">
                  <span>
                    {isRtl ? '↑↓ للتنقل' : '↑↓ to navigate'}
                  </span>
                  <span>
                    {isRtl ? '⏎ للاختيار' : '⏎ to select'}
                  </span>
                  <span>
                    {isRtl ? 'Esc للإغلاق' : 'Esc to close'}
                  </span>
                </div>
                <div>
                  SniperAI Command Palette v2.1
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
