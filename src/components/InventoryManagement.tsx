import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Package, 
  Search, 
  Plus, 
  AlertTriangle, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpDown, 
  CheckCircle2, 
  XCircle,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  PlusCircle,
  History,
  FileSpreadsheet
} from 'lucide-react';
import { InventoryItem, Tenant } from '../types';
import { db, handleFirestoreError, OperationType } from '../utils/firebase';
import { 
  collection, 
  getDocs, 
  setDoc, 
  doc, 
  writeBatch,
  query
} from 'firebase/firestore';

interface InventoryManagementProps {
  tenant: Tenant | null;
  language: 'en' | 'ar';
  userEmail: string | null;
  addNotification: (
    type: 'ANOMALY' | 'TASK' | 'SYSTEM',
    titleEn: string,
    titleAr: string,
    messageEn: string,
    messageAr: string,
    meta?: any
  ) => void;
  onUpdateTenantProducts: (newProducts: { name: string; price: number; costOfGoods: number }[]) => void;
}

interface InventoryLog {
  id: string;
  timestamp: string;
  sku: string;
  productName: string;
  type: 'RESTOCK' | 'SALE' | 'ADJUST' | 'CREATE';
  quantity: number;
  previousLevel: number;
  newLevel: number;
  user: string;
}

export default function InventoryManagement({ 
  tenant, 
  language, 
  userEmail,
  addNotification,
  onUpdateTenantProducts
}: InventoryManagementProps) {
  const isRtl = language === 'ar';
  
  // State variables
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'STOCK' | 'VALUE' | 'SKU'>('NAME');
  const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
  
  // Table selection states
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>(tenant?.dbMapping?.inventory?.table || '');
  const [isSavingTable, setIsSavingTable] = useState<boolean>(false);
  
  // Modals state
  const [isRestockModalOpen, setIsRestockModalOpen] = useState<boolean>(false);
  const [selectedItemForRestock, setSelectedItemForRestock] = useState<InventoryItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(50);
  const [restockSupplier, setRestockSupplier] = useState<string>('');
  
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    sku: '',
    initialStock: 100,
    safetyStock: 20,
    unitCost: 10,
    unitPrice: 20,
    supplier: ''
  });
  
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [showLogs, setShowLogs] = useState<boolean>(false);

  // Generate mock logs when items are loaded
  const generateMockLogs = (currentItems: InventoryItem[]) => {
    // Disabled mock data generation as requested by user
    setLogs([]);
  };

  // Fetch available database tables for the current tenant
  useEffect(() => {
    if (!tenant) return;
    
    if (tenant.dataSource?.provider === 'PostgreSQL') {
      fetch(`/api/tenants/${tenant.id}/schema`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.schema) {
            setAvailableTables(Object.keys(data.schema));
          }
        })
        .catch(err => console.error("Error fetching schema tables:", err));
    }
  }, [tenant]);

  // Load Inventory from API (with real database backing)
  useEffect(() => {
    if (!tenant) return;
    
    setLoading(true);
    const url = selectedTable 
      ? `/api/inventory/${tenant.id}/items?table=${encodeURIComponent(selectedTable)}` 
      : `/api/inventory/${tenant.id}/items`;
      
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load inventory");
        return res.json();
      })
      .then((loadedItems: InventoryItem[]) => {
        setItems(loadedItems);
        generateMockLogs(loadedItems);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Error loading inventory from server API:", err);
        setLoading(false);
      });
  }, [tenant, selectedTable]);

  // Handle saving the selected table as default mapped table in Firestore
  const handleSaveAsDefault = async () => {
    if (!tenant) return;
    setIsSavingTable(true);
    try {
      const updatedMapping = {
        ...(tenant.dbMapping || {}),
        inventory: {
          ...(tenant.dbMapping?.inventory || {}),
          table: selectedTable
        }
      };
      
      const res = await fetch(`/api/tenants/${tenant.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: tenant.name,
          industry: tenant.industry,
          currency: tenant.currency,
          description: tenant.description,
          schemaMappings: tenant.schemaMappings,
          dbMapping: updatedMapping
        })
      });
      
      if (!res.ok) throw new Error("Failed to save tenant mapping");
      
      // Update tenant mapping state locally if possible
      tenant.dbMapping = updatedMapping;
      
      addNotification(
        'SYSTEM',
        `Default Inventory Table Updated`,
        `تم تحديث جدول المخزون الافتراضي`,
        `Table "${selectedTable}" has been saved as the default inventory table.`,
        `تم حفظ جدول "${selectedTable}" كجدول المخزون الافتراضي بنجاح.`
      );
    } catch (err) {
      console.error("Error saving default inventory table:", err);
    } finally {
      setIsSavingTable(false);
    }
  };

  // Handle manual restock update
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForRestock || !tenant) return;

    const previousLevel = selectedItemForRestock.stockLevel;
    const newLevel = previousLevel + restockQty;
    
    const updatedItem: InventoryItem = {
      ...selectedItemForRestock,
      stockLevel: newLevel,
      lastRestocked: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US'),
      supplier: restockSupplier || selectedItemForRestock.supplier
    };

    try {
      const res = await fetch(`/api/inventory/${tenant.id}/items/${updatedItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedItem)
      });
      if (!res.ok) throw new Error("Failed to update stock");
      
      // Update local items state
      setItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
      
      // Add a log
      const newLog: InventoryLog = {
        id: `log-restock-${Date.now()}`,
        timestamp: new Date().toLocaleString(isRtl ? 'ar-EG' : 'en-US'),
        sku: updatedItem.sku,
        productName: updatedItem.productName,
        type: 'RESTOCK',
        quantity: restockQty,
        previousLevel,
        newLevel,
        user: userEmail || 'manager@sniper.ai'
      };
      setLogs(prev => [newLog, ...prev]);

      // Success notification
      addNotification(
        'TASK',
        `Restocked Item: ${updatedItem.productName}`,
        `تم إعادة تخزين: ${updatedItem.productName}`,
        `Added +${restockQty} units. New stock level: ${newLevel}.`,
        `تمت إضافة +${restockQty} وحدات. مستوى المخزون الجديد: ${newLevel}.`
      );

      // Reset & close
      setIsRestockModalOpen(false);
      setSelectedItemForRestock(null);
    } catch (err) {
      console.error("Failed to update stock:", err);
    }
  };

  // Handle adding new item & product
  const handleAddItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenant) return;

    // Generate sku if empty
    let sku = newProduct.sku.trim();
    if (!sku) {
      const initials = newProduct.name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
      sku = `${initials}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const newItemId = `item-${Date.now()}`;
    const newInventoryItem: InventoryItem = {
      id: newItemId,
      sku,
      productName: newProduct.name,
      stockLevel: Number(newProduct.initialStock),
      safetyStock: Number(newProduct.safetyStock),
      unitCost: Number(newProduct.unitCost),
      unitPrice: Number(newProduct.unitPrice),
      supplier: newProduct.supplier || 'Standard Global Supplier',
      lastRestocked: new Date().toLocaleDateString(isRtl ? 'ar-EG' : 'en-US')
    };

    try {
      const res = await fetch(`/api/inventory/${tenant.id}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInventoryItem)
      });
      if (!res.ok) throw new Error("Failed to add inventory item");
      
      // 2. Add to local items state
      setItems(prev => [newInventoryItem, ...prev]);

      // 3. Register as a tenant product to ensure cohesion with the dashboard
      const updatedTenantProducts = [
        ...(tenant.products || []),
        { 
          name: newProduct.name, 
          price: Number(newProduct.unitPrice), 
          costOfGoods: Number(newProduct.unitCost) 
        }
      ];

      // Update parent states
      onUpdateTenantProducts(updatedTenantProducts);

      // Log the action
      const newLog: InventoryLog = {
        id: `log-create-${Date.now()}`,
        timestamp: new Date().toLocaleString(isRtl ? 'ar-EG' : 'en-US'),
        sku,
        productName: newProduct.name,
        type: 'CREATE',
        quantity: newProduct.initialStock,
        previousLevel: 0,
        newLevel: newProduct.initialStock,
        user: userEmail || 'manager@sniper.ai'
      };
      setLogs(prev => [newLog, ...prev]);

      // Trigger notification
      addNotification(
        'SYSTEM',
        `New Inventory Line Registered`,
        `تم تسجيل صنف مخزون جديد`,
        `Successfully added ${newProduct.name} to inventory and catalog.`,
        `تم إضافة ${newProduct.name} بنجاح إلى سجل المخزون وقائمة المنتجات.`
      );

      // Reset & close
      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        sku: '',
        initialStock: 100,
        safetyStock: 20,
        unitCost: 10,
        unitPrice: 20,
        supplier: ''
      });
    } catch (err) {
      console.error("Failed to add inventory item:", err);
    }
  };

  // Calculations for KPI Cards
  const totalItems = items.length;
  const totalStockValue = items.reduce((acc, item) => acc + (item.stockLevel * item.unitCost), 0);
  const totalRetailValue = items.reduce((acc, item) => acc + (item.stockLevel * item.unitPrice), 0);
  const lowStockItemsCount = items.filter(item => item.stockLevel > 0 && item.stockLevel <= item.safetyStock).length;
  const outOfStockItemsCount = items.filter(item => item.stockLevel === 0).length;

  // Filter & Sort Logic
  const filteredItems = items
    .filter(item => {
      const matchSearch = 
        item.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.supplier && item.supplier.toLowerCase().includes(searchQuery.toLowerCase()));
      
      if (!matchSearch) return false;

      if (statusFilter === 'IN_STOCK') return item.stockLevel > item.safetyStock;
      if (statusFilter === 'LOW_STOCK') return item.stockLevel > 0 && item.stockLevel <= item.safetyStock;
      if (statusFilter === 'OUT_OF_STOCK') return item.stockLevel === 0;
      return true;
    })
    .sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'NAME') {
        comparison = a.productName.localeCompare(b.productName);
      } else if (sortBy === 'STOCK') {
        comparison = a.stockLevel - b.stockLevel;
      } else if (sortBy === 'VALUE') {
        comparison = (a.stockLevel * a.unitCost) - (b.stockLevel * b.unitCost);
      } else if (sortBy === 'SKU') {
        comparison = a.sku.localeCompare(b.sku);
      }
      return sortOrder === 'ASC' ? comparison : -comparison;
    });

  const toggleSort = (field: 'NAME' | 'STOCK' | 'VALUE' | 'SKU') => {
    if (sortBy === field) {
      setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC');
    } else {
      setSortBy(field);
      setSortOrder('ASC');
    }
  };

  // Translations
  const t = {
    title: isRtl ? 'إدارة المخزون والسلع' : 'Inventory & Stock Management',
    subtitle: isRtl ? 'تتبع مستويات المخزون الحالية، التقييم، وتنبيهات إعادة الطلب' : 'Track current stock levels, valuations, and replenishment alerts',
    kpiTotalValue: isRtl ? 'قيمة المخزون الإجمالية (تكلفة)' : 'Total Inventory Value (Cost)',
    kpiTotalRetail: isRtl ? 'قيمة البيع المتوقعة' : 'Expected Retail Value',
    kpiLowStock: isRtl ? 'تنبيهات نقص المخزون' : 'Low Stock Alerts',
    kpiOutOfStock: isRtl ? 'مواد نفدت بالكامل' : 'Out of Stock Items',
    kpiTotalProducts: isRtl ? 'إجمالي خطوط السلع' : 'Total Product Lines',
    searchPlaceholder: isRtl ? 'ابحث بالاسم، رمز SKU أو المورد...' : 'Search by name, SKU, or supplier...',
    filterAll: isRtl ? 'الكل' : 'All',
    filterInStock: isRtl ? 'متوفر' : 'In Stock',
    filterLowStock: isRtl ? 'مخزون منخفض' : 'Low Stock',
    filterOutOfStock: isRtl ? 'نفد المخزون' : 'Out of Stock',
    addNewProduct: isRtl ? 'إضافة منتج ومخزون جديد' : 'Add Product & Stock',
    sku: isRtl ? 'رمز SKU' : 'SKU',
    productName: isRtl ? 'اسم المنتج' : 'Product Name',
    stockLevel: isRtl ? 'مستوى المخزون' : 'Stock Level',
    safetyStock: isRtl ? 'حد الأمان' : 'Safety Limit',
    unitCost: isRtl ? 'سعر التكلفة' : 'Unit Cost',
    unitPrice: isRtl ? 'سعر البيع' : 'Retail Price',
    supplier: isRtl ? 'المورد المعتمد' : 'Supplier',
    actions: isRtl ? 'إجراءات' : 'Actions',
    restock: isRtl ? 'إعادة طلب' : 'Restock',
    restockTitle: isRtl ? 'تغذية المخزون الفورية' : 'Replenish Inventory Now',
    addTitle: isRtl ? 'تسجيل صنف مخزون جديد' : 'Register New Inventory Item',
    historyLogs: isRtl ? 'سجل العمليات والتدفقات' : 'Inventory Ledger & Audit Logs',
    hideHistory: isRtl ? 'إخفاء السجل' : 'Hide Ledger',
    showHistory: isRtl ? 'عرض سجل العمليات' : 'Show Ledger',
    emptyMessage: isRtl ? 'لا توجد منتجات مطابقة لخيارات البحث.' : 'No matching products found in inventory.',
    statusInStock: isRtl ? 'آمن' : 'Secure',
    statusLowStock: isRtl ? 'منخفض' : 'Critical Low',
    statusOutOfStock: isRtl ? 'نفد تماماً' : 'Empty',
    save: isRtl ? 'حفظ البيانات' : 'Save Details',
    cancel: isRtl ? 'إلغاء' : 'Cancel',
    loadingText: isRtl ? 'جاري تحميل سجلات المستودع والمخزون...' : 'Synchronizing warehouse stock records...'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-950/40 rounded-3xl border border-slate-900/80 p-8">
        <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-4" />
        <p className="text-slate-400 text-sm font-medium animate-pulse">{t.loadingText}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-start">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/30 p-6 rounded-3xl border border-slate-900/80">
        <div>
          <h2 className="text-lg font-bold font-display text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            <span>{t.title}</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-light">
            {t.subtitle} {tenant ? `(${tenant.name})` : ''}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowLogs(!showLogs)}
            className="flex items-center gap-1.5 bg-slate-950 hover:bg-slate-900 text-slate-300 px-4 py-2.5 rounded-xl border border-slate-800 text-xs font-bold transition-all cursor-pointer h-10"
          >
            <History className="w-3.5 h-3.5" />
            <span>{showLogs ? t.hideHistory : t.showHistory}</span>
          </button>
          
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl border border-indigo-500/30 shadow-md shadow-indigo-950/20 transition-all cursor-pointer h-10"
          >
            <Plus className="w-4 h-4" />
            <span>{t.addNewProduct}</span>
          </button>
        </div>
      </div>

      {/* Table Selector block (only shown if tenant has a PostgreSQL database config) */}
      {tenant?.dataSource?.provider === 'PostgreSQL' && (
        <div className="bg-slate-900/30 p-5 rounded-3xl border border-slate-900/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600/10 rounded-2xl border border-indigo-500/20 text-indigo-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isRtl ? 'اتصال جدول قاعدة البيانات' : 'Database Table Connection'}
              </h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {isRtl 
                  ? 'اختر جدول المخزون النشط من الجداول المكتشفة في قاعدة البيانات.' 
                  : 'Select the active inventory table from the introspected database schemas.'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="bg-slate-950 text-white text-xs font-medium px-4 py-2.5 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all cursor-pointer h-10 min-w-[200px]"
            >
              <option value="">
                {isRtl ? '-- اختر جدول المخزون --' : '-- Select Inventory Table --'}
              </option>
              {availableTables.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>

            {selectedTable && selectedTable !== tenant.dbMapping?.inventory?.table && (
              <button
                onClick={handleSaveAsDefault}
                disabled={isSavingTable}
                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 text-xs font-bold px-4 py-2.5 rounded-xl border border-emerald-500/20 transition-all cursor-pointer h-10 flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {isSavingTable 
                    ? (isRtl ? 'جاري الحفظ...' : 'Saving...') 
                    : (isRtl ? 'تعيين كافتراضي' : 'Set as Default')}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Drawer / Panel */}
      <AnimatePresence>
        {showLogs && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden bg-slate-950/80 border border-slate-800/80 rounded-3xl p-5 mb-4 shadow-inner"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                <History className="w-4 h-4" />
                <span>{t.historyLogs}</span>
              </h3>
              <span className="text-[10px] bg-slate-900 text-slate-400 px-2 py-0.5 rounded-full border border-slate-800">
                {logs.length} {isRtl ? 'سجل' : 'records'}
              </span>
            </div>
            <div className="max-h-56 overflow-y-auto space-y-2 pr-1 font-mono text-xs">
              {logs.map((log) => (
                <div key={log.id} className="flex flex-col sm:flex-row justify-between bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/40 gap-2 hover:bg-slate-900 transition-all">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-slate-500">[{log.timestamp}]</span>
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                      log.type === 'RESTOCK' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/30' :
                      log.type === 'CREATE' ? 'bg-indigo-950/40 text-indigo-400 border border-indigo-900/30' :
                      log.type === 'SALE' ? 'bg-amber-950/40 text-amber-400 border border-amber-900/30' :
                      'bg-slate-800 text-slate-300'
                    }`}>
                      {log.type}
                    </span>
                    <span className="text-white font-medium">{log.productName} ({log.sku})</span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-400 justify-between sm:justify-end">
                    <span>
                      {isRtl ? 'الكمية:' : 'Qty:'} <strong className="text-white">+{log.quantity}</strong>
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      ({log.previousLevel} → {log.newLevel})
                    </span>
                    <span className="text-indigo-400/80 text-[11px] font-sans">@{log.user.split('@')[0]}</span>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Stock Value */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-3xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">{t.kpiTotalValue}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-display text-white">
              {totalStockValue.toLocaleString()}
            </span>
            <span className="text-xs text-indigo-400 font-semibold">{tenant?.currency || 'USD'}</span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-slate-500">
            <FileSpreadsheet className="w-3.5 h-3.5 text-indigo-400" />
            <span>{t.kpiTotalRetail}: {totalRetailValue.toLocaleString()} {tenant?.currency || 'USD'}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-3xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">{t.kpiLowStock}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-bold font-display ${lowStockItemsCount > 0 ? 'text-amber-400' : 'text-slate-300'}`}>
              {lowStockItemsCount}
            </span>
            {lowStockItemsCount > 0 && <span className="text-xs text-amber-500 font-bold animate-pulse">!</span>}
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-slate-500">
            <AlertTriangle className={`w-3.5 h-3.5 ${lowStockItemsCount > 0 ? 'text-amber-400' : 'text-slate-600'}`} />
            <span>{isRtl ? 'يتطلب إعادة تزويد عاجلة' : 'Needs priority attention'}</span>
          </div>
        </div>

        {/* Out Of Stock items */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-3xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">{t.kpiOutOfStock}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-2xl font-bold font-display ${outOfStockItemsCount > 0 ? 'text-rose-400' : 'text-slate-300'}`}>
              {outOfStockItemsCount}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-slate-500">
            <XCircle className={`w-3.5 h-3.5 ${outOfStockItemsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-slate-600'}`} />
            <span>{isRtl ? 'المبيعات معطلة لهذه السلع' : 'Halts direct transaction flow'}</span>
          </div>
        </div>

        {/* Total Product Lines */}
        <div className="bg-slate-900/40 backdrop-blur-md border border-slate-900/80 rounded-3xl p-5 relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none"></div>
          <p className="text-[11px] text-slate-400 uppercase font-semibold tracking-wider">{t.kpiTotalProducts}</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold font-display text-white">
              {totalItems}
            </span>
          </div>
          <div className="mt-2.5 flex items-center gap-1 text-[10px] text-slate-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>{isRtl ? 'مسارات تصنيف السلع فعالة' : 'Active catalogs registered'}</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-slate-900/40 border border-slate-900/80 rounded-3xl p-4 md:p-5 shadow-xl flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className="w-full bg-slate-950/60 text-white pl-11 pr-4 py-3 rounded-2xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs"
          />
        </div>

        {/* Filtering Tabs & Sort Dropdown */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Status filter segment */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800">
            {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-2 rounded-xl text-[10px] font-bold transition-all cursor-pointer ${
                  statusFilter === filter
                    ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/20'
                    : 'text-slate-400 hover:text-white border border-transparent'
                }`}
              >
                {filter === 'ALL' ? t.filterAll :
                 filter === 'IN_STOCK' ? t.filterInStock :
                 filter === 'LOW_STOCK' ? t.filterLowStock : t.filterOutOfStock}
              </button>
            ))}
          </div>

          {/* Sort trigger indicator */}
          <div className="flex bg-slate-950 p-1 rounded-2xl border border-slate-800 text-slate-400 text-[10px] font-bold items-center gap-1.5 px-3 py-2 shrink-0">
            <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
            <span>{isRtl ? 'الفرز:' : 'Sort:'}</span>
            <button 
              onClick={() => toggleSort('NAME')} 
              className={`hover:text-white transition-all ${sortBy === 'NAME' ? 'text-indigo-400 font-extrabold' : ''}`}
            >
              {isRtl ? 'الاسم' : 'Name'}
            </button>
            <span className="text-slate-800">|</span>
            <button 
              onClick={() => toggleSort('STOCK')} 
              className={`hover:text-white transition-all ${sortBy === 'STOCK' ? 'text-indigo-400 font-extrabold' : ''}`}
            >
              {isRtl ? 'المخزون' : 'Stock'}
            </button>
            <span className="text-slate-800">|</span>
            <button 
              onClick={() => toggleSort('VALUE')} 
              className={`hover:text-white transition-all ${sortBy === 'VALUE' ? 'text-indigo-400 font-extrabold' : ''}`}
            >
              {isRtl ? 'القيمة' : 'Value'}
            </button>
            <button 
              onClick={() => setSortOrder(prev => prev === 'ASC' ? 'DESC' : 'ASC')}
              className="p-1 rounded bg-slate-900 border border-slate-800 hover:text-white cursor-pointer ml-1"
            >
              <ArrowUpDown className="w-3 h-3 text-indigo-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid of Inventory Items */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => {
            const isOutOfStock = item.stockLevel === 0;
            const isLowStock = !isOutOfStock && item.stockLevel <= item.safetyStock;
            const itemValue = item.stockLevel * item.unitCost;
            const retailValue = item.stockLevel * item.unitPrice;
            const potentialProfit = retailValue - itemValue;

            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
                className={`bg-slate-900/40 border rounded-3xl p-5 shadow-xl relative overflow-hidden transition-all flex flex-col justify-between ${
                  isOutOfStock ? 'border-rose-950/40 bg-rose-950/5' : 
                  isLowStock ? 'border-amber-950/40 bg-amber-950/5' : 'border-slate-900/80'
                }`}
              >
                {/* Ribbon decoration for warning state */}
                <div className={`absolute top-0 right-0 w-2 h-full ${
                  isOutOfStock ? 'bg-rose-500' :
                  isLowStock ? 'bg-amber-500' : 'bg-transparent'
                }`}></div>

                {/* Card header */}
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <span className="font-mono text-[10px] text-slate-500 uppercase tracking-wider bg-slate-950 px-2 py-0.5 rounded border border-slate-800/60">
                        {item.sku}
                      </span>
                      <h4 className="text-sm font-bold font-display text-white mt-2 leading-tight">
                        {item.productName}
                      </h4>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2 py-1 rounded-xl text-[9px] font-bold flex items-center gap-1 uppercase ${
                      isOutOfStock ? 'bg-rose-950/30 text-rose-400 border border-rose-900/30' :
                      isLowStock ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' :
                      'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        isOutOfStock ? 'bg-rose-500' :
                        isLowStock ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}></span>
                      <span>
                        {isOutOfStock ? t.statusOutOfStock :
                         isLowStock ? t.statusLowStock : t.statusInStock}
                      </span>
                    </span>
                  </div>

                  {/* Stock level indicators */}
                  <div className="mt-4 bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-slate-400">{t.stockLevel}:</span>
                      <strong className={`font-mono ${isOutOfStock ? 'text-rose-400' : isLowStock ? 'text-amber-400' : 'text-white'}`}>
                        {item.stockLevel} {isRtl ? 'وحدة' : 'units'}
                      </strong>
                    </div>

                    {/* Simple progress bar */}
                    <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          isOutOfStock ? 'bg-rose-500' :
                          isLowStock ? 'bg-amber-500' : 'bg-indigo-500'
                        }`}
                        style={{ width: `${Math.min(100, (item.stockLevel / (item.safetyStock * 3)) * 100)}%` }}
                      ></div>
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-500">
                      <span>{t.safetyStock}: {item.safetyStock}</span>
                      <span>{isRtl ? 'آخر إمداد:' : 'Replenished:'} {item.lastRestocked || '-'}</span>
                    </div>
                  </div>

                  {/* Pricing and Valuation details */}
                  <div className="mt-4 grid grid-cols-2 gap-3 text-xs border-t border-slate-800/40 pt-3">
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-light tracking-wide block">{t.unitCost}</span>
                      <strong className="text-slate-300 font-mono">
                        {item.unitCost.toLocaleString()} {tenant?.currency || 'USD'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] uppercase font-light tracking-wide block">{t.unitPrice}</span>
                      <strong className="text-slate-300 font-mono">
                        {item.unitPrice.toLocaleString()} {tenant?.currency || 'USD'}
                      </strong>
                    </div>
                  </div>

                  <div className="mt-3 bg-slate-900/30 p-2.5 rounded-xl border border-slate-800/20 grid grid-cols-2 text-[10px]">
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'قيمة الاستثمار:' : 'Capital Value:'}</span>
                      <span className="font-semibold text-white font-mono">{itemValue.toLocaleString()} {tenant?.currency || 'USD'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">{isRtl ? 'العائد المتوقع:' : 'Potential Profit:'}</span>
                      <span className="font-semibold text-indigo-400 font-mono">+{potentialProfit.toLocaleString()} {tenant?.currency || 'USD'}</span>
                    </div>
                  </div>

                  {item.supplier && (
                    <div className="mt-3 text-[10px] text-slate-400 font-light flex items-center gap-1.5 px-1">
                      <span className="w-1.5 h-1.5 bg-slate-700 rounded-full"></span>
                      <span>{t.supplier}: <strong className="text-slate-300 font-medium">{item.supplier}</strong></span>
                    </div>
                  )}
                </div>

                {/* Quick actions row */}
                <div className="mt-5 border-t border-slate-800/40 pt-4 flex gap-2">
                  <button
                    onClick={() => {
                      setSelectedItemForRestock(item);
                      setRestockQty(50);
                      setRestockSupplier(item.supplier || '');
                      setIsRestockModalOpen(true);
                    }}
                    className="flex-1 flex items-center justify-center gap-1 bg-slate-950 hover:bg-slate-900 text-indigo-400 hover:text-white border border-indigo-500/20 hover:border-indigo-500/40 py-2 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    <PlusCircle className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{t.restock}</span>
                  </button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {filteredItems.length === 0 && (
          <div className="col-span-full py-16 text-center bg-slate-900/20 border border-dashed border-slate-800 rounded-3xl">
            <Package className="w-8 h-8 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-xs font-medium">{t.emptyMessage}</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Restock Dialog */}
      <AnimatePresence>
        {isRestockModalOpen && selectedItemForRestock && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsRestockModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative overflow-hidden shadow-2xl z-10 text-start"
            >
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2 mb-2">
                <Package className="w-5 h-5 text-indigo-400" />
                <span>{t.restockTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-5 font-light leading-relaxed">
                {isRtl ? 'زيادة عدد الوحدات المتوفرة في المستودع فورياً للصنف المختار.' : 'Directly increase the warehouse stock count for the selected item.'}
              </p>

              <form onSubmit={handleRestockSubmit} className="space-y-4">
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800/60">
                  <span className="text-[10px] text-indigo-400 uppercase font-bold font-mono block mb-1">
                    {selectedItemForRestock.sku}
                  </span>
                  <h4 className="text-xs font-bold text-white">{selectedItemForRestock.productName}</h4>
                  <div className="mt-2.5 flex justify-between text-xs text-slate-400">
                    <span>{t.stockLevel}: <strong className="text-white">{selectedItemForRestock.stockLevel}</strong></span>
                    <span>{t.safetyStock}: <strong className="text-white">{selectedItemForRestock.safetyStock}</strong></span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                    {isRtl ? 'الكمية المضافة (وحدات)' : 'Quantity to Add (Units)'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={restockQty}
                    onChange={(e) => setRestockQty(Math.max(1, parseInt(e.target.value) || 0))}
                    className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                    {t.supplier} ({isRtl ? 'اختياري' : 'Optional'})
                  </label>
                  <input
                    type="text"
                    value={restockSupplier}
                    onChange={(e) => setRestockSupplier(e.target.value)}
                    placeholder={selectedItemForRestock.supplier}
                    className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs"
                  />
                </div>

                <div className="flex gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsRestockModalOpen(false)}
                    className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Add Product & Inventory Line Dialog */}
      <AnimatePresence>
        {isAddModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAddModalOpen(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm"
            ></motion.div>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 relative overflow-hidden shadow-2xl z-10 text-start max-h-[90vh] overflow-y-auto"
            >
              <h3 className="text-base font-bold font-display text-white flex items-center gap-2 mb-2">
                <PlusCircle className="w-5 h-5 text-indigo-400" />
                <span>{t.addTitle}</span>
              </h3>
              <p className="text-xs text-slate-400 mb-5 font-light leading-relaxed">
                {isRtl ? 'تسجيل منتج جديد في النظام وربطه بمستوى مخزون افتراضي وتفاصيل المورد.' : 'Register a brand-new product in the system linked to initial stock levels and catalog definitions.'}
              </p>

              <form onSubmit={handleAddItemSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'اسم المنتج أو السلعة' : 'Product Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={newProduct.name}
                      onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                      placeholder={isRtl ? 'على سبيل المثال: سترة رياضية ضد المطر' : 'e.g. Waterproof Sports Vest'}
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'رمز الـ SKU (اختياري)' : 'SKU Code (Optional)'}
                    </label>
                    <input
                      type="text"
                      value={newProduct.sku}
                      onChange={(e) => setNewProduct({ ...newProduct, sku: e.target.value })}
                      placeholder="e.g. VEST-101"
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'اسم المورد المعتمد' : 'Authorized Supplier'}
                    </label>
                    <input
                      type="text"
                      value={newProduct.supplier}
                      onChange={(e) => setNewProduct({ ...newProduct, supplier: e.target.value })}
                      placeholder={isRtl ? 'على سبيل المثال: مصنع الشرق للأقمشة' : 'e.g. Al-Sharq Fabrics'}
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'المخزون الافتراضي الأولي' : 'Initial Stock Count'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.initialStock}
                      onChange={(e) => setNewProduct({ ...newProduct, initialStock: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'مستوى حد الأمان للتنبيه' : 'Safety Alert Margin'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.safetyStock}
                      onChange={(e) => setNewProduct({ ...newProduct, safetyStock: Math.max(0, parseInt(e.target.value) || 0) })}
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'سعر التكلفة لكل وحدة' : 'Unit Cost Price'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={newProduct.unitCost}
                      onChange={(e) => setNewProduct({ ...newProduct, unitCost: Math.max(0.01, parseFloat(e.target.value) || 0) })}
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-400 font-semibold mb-1.5">
                      {isRtl ? 'سعر البيع المقترح' : 'Unit Retail Price'} *
                    </label>
                    <input
                      type="number"
                      required
                      min="0.01"
                      step="0.01"
                      value={newProduct.unitPrice}
                      onChange={(e) => setNewProduct({ ...newProduct, unitPrice: Math.max(0.01, parseFloat(e.target.value) || 0) })}
                      className="w-full bg-slate-950 text-white px-4 py-3 rounded-xl border border-slate-800 focus:border-indigo-500 focus:outline-none transition-all text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="flex-1 bg-slate-950 hover:bg-slate-900 text-slate-400 hover:text-white border border-slate-800 py-3 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    {t.cancel}
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white py-3 rounded-xl text-xs font-bold cursor-pointer transition-all"
                  >
                    {t.save}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
