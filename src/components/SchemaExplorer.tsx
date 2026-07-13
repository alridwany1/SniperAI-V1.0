import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { 
  Database, 
  ArrowRight, 
  ArrowLeft, 
  GitCommit, 
  CheckCircle, 
  Sparkles, 
  Cpu, 
  Calendar, 
  ShoppingBag, 
  Megaphone, 
  DollarSign, 
  Layers, 
  Hash, 
  TrendingUp, 
  User, 
  Clock, 
  Activity, 
  HelpCircle,
  BookOpen,
  Settings,
  ShieldCheck
} from 'lucide-react';

interface SchemaExplorerProps {
  analysis: {
    detectedLanguage: string;
    linguisticAnalysis: string;
    tables: Array<{
      tableName: string;
      mappedTo: string;
      purpose: string;
      columns: Array<{
        columnName: string;
        dataType: string;
        mappedTo: string;
        purpose: string;
      }>;
    }>;
  };
  language: 'en' | 'ar';
  dbMapping?: any;
  onChangeMapping?: (newMapping: any) => void;
  onSaveMapping?: () => Promise<void> | void;
  isSaving?: boolean;
}

export default function SchemaExplorer({ 
  analysis, 
  language,
  dbMapping,
  onChangeMapping,
  onSaveMapping,
  isSaving
}: SchemaExplorerProps) {
  const isRtl = language === 'ar';
  const [selectedTableIdx, setSelectedTableIdx] = useState(0);
  const [hoveredCol, setHoveredCol] = useState<string | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const tables = analysis?.tables || [];
  const activeTable = tables[selectedTableIdx];

  // Map target slots to visual icons and labels
  const salesSlots = [
    { id: 'Date', key: 'date', label: isRtl ? 'تاريخ المعاملة' : 'Transaction Date', icon: Calendar, color: 'text-amber-400 border-amber-500/20 bg-amber-500/5' },
    { id: 'Product', key: 'product', label: isRtl ? 'اسم السلعة / منتج' : 'Product Stream', icon: ShoppingBag, color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/5' },
    { id: 'Campaign', key: 'campaign', label: isRtl ? 'الحملة الإعلانية' : 'Campaign Origin', icon: Megaphone, color: 'text-teal-400 border-teal-500/20 bg-teal-500/5' },
    { id: 'Revenue', key: 'revenue', label: isRtl ? 'الإيراد الإجمالي' : 'Gross Revenue', icon: DollarSign, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'Units', key: 'units', label: isRtl ? 'الكمية المباعة' : 'Volume of Sale', icon: Layers, color: 'text-blue-400 border-blue-500/20 bg-blue-500/5' },
    { id: 'Cost', key: 'cost', label: isRtl ? 'تكلفة البضاعة COGS' : 'Operating COGS', icon: Hash, color: 'text-rose-400 border-rose-500/20 bg-rose-500/5' },
  ];

  const crmSlots = [
    { id: 'Deal ID', key: 'id', label: isRtl ? 'رقم الصفقة' : 'CRM Deal ID', icon: TrendingUp, color: 'text-purple-400 border-purple-500/20 bg-purple-500/5' },
    { id: 'Client Name', key: 'customerName', label: isRtl ? 'اسم العميل' : 'Client Name', icon: User, color: 'text-sky-400 border-sky-500/20 bg-sky-500/5' },
    { id: 'Deal Value', key: 'value', label: isRtl ? 'قيمة التعاقد' : 'Deal Contract Value', icon: DollarSign, color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/5' },
    { id: 'Status', key: 'status', label: isRtl ? 'مرحلة البيع' : 'Pipeline Status', icon: Activity, color: 'text-orange-400 border-orange-500/20 bg-orange-500/5' },
    { id: 'Last Updated', key: 'lastUpdated', label: isRtl ? 'آخر تحديث زمنياً' : 'Last Updated Timestamp', icon: Clock, color: 'text-pink-400 border-pink-500/20 bg-pink-500/5' },
  ];

  // Local state to store customized mapping
  const [localMapping, setLocalMapping] = useState<any>({
    sales: { table: '', date: '', product: '', campaign: '', revenue: '', units: '', cost: '' },
    crm: { table: '', id: '', customerName: '', value: '', status: '', lastUpdated: '' }
  });

  const initializedRef = useRef(false);

  // Extract initial mapping if dbMapping is not provided
  useEffect(() => {
    if (dbMapping && Object.keys(dbMapping).length > 0) {
      setLocalMapping(dbMapping);
      initializedRef.current = true;
    } else if (tables.length > 0) {
      const mapping: any = {
        sales: { table: '', date: '', product: '', campaign: '', revenue: '', units: '', cost: '' },
        crm: { table: '', id: '', customerName: '', value: '', status: '', lastUpdated: '' }
      };
      
      tables.forEach(t => {
        if (t.mappedTo === 'Sales Ledger') {
          mapping.sales.table = t.tableName;
          t.columns.forEach((col: any) => {
            if (col.mappedTo === 'Date') mapping.sales.date = col.columnName;
            else if (col.mappedTo === 'Product') mapping.sales.product = col.columnName;
            else if (col.mappedTo === 'Campaign') mapping.sales.campaign = col.columnName;
            else if (col.mappedTo === 'Revenue') mapping.sales.revenue = col.columnName;
            else if (col.mappedTo === 'Units') mapping.sales.units = col.columnName;
            else if (col.mappedTo === 'Cost') mapping.sales.cost = col.columnName;
          });
        } else if (t.mappedTo === 'CRM Pipeline') {
          mapping.crm.table = t.tableName;
          t.columns.forEach((col: any) => {
            if (col.mappedTo === 'Deal ID') mapping.crm.id = col.columnName;
            else if (col.mappedTo === 'Client Name') mapping.crm.customerName = col.columnName;
            else if (col.mappedTo === 'Deal Value') mapping.crm.value = col.columnName;
            else if (col.mappedTo === 'Status') mapping.crm.status = col.columnName;
            else if (col.mappedTo === 'Last Updated') mapping.crm.lastUpdated = col.columnName;
          });
        }
      });
      initializedRef.current = true;
      setLocalMapping(mapping);
      onChangeMapping?.(mapping);
    }
  }, [analysis, dbMapping]);

  if (!tables.length) {
    return (
      <div className="p-6 text-center text-slate-500 text-xs">
        {isRtl ? 'لا توجد جداول متاحة للتحليل.' : 'No table schemas available for analysis.'}
      </div>
    );
  }

  // Handle setting table role
  const handleTableRoleChange = (role: 'sales' | 'crm' | 'unmapped') => {
    if (!activeTable) return;
    const updated = { ...localMapping };
    
    // Unassign roles if they overlap
    if (role === 'sales') {
      // If another table was Sales, unassign it or warn
      updated.sales.table = activeTable.tableName;
      if (updated.crm.table === activeTable.tableName) {
        updated.crm.table = '';
      }
      // Fill in default smart guesses for columns based on analysis
      activeTable.columns.forEach((col: any) => {
        if (col.mappedTo === 'Date') updated.sales.date = col.columnName;
        else if (col.mappedTo === 'Product') updated.sales.product = col.columnName;
        else if (col.mappedTo === 'Campaign') updated.sales.campaign = col.columnName;
        else if (col.mappedTo === 'Revenue') updated.sales.revenue = col.columnName;
        else if (col.mappedTo === 'Units') updated.sales.units = col.columnName;
        else if (col.mappedTo === 'Cost') updated.sales.cost = col.columnName;
      });
      // Fallback first columns if not set
      const colNames = activeTable.columns.map(c => c.columnName);
      if (!updated.sales.date) updated.sales.date = colNames[0] || '';
      if (!updated.sales.product) updated.sales.product = colNames[1] || colNames[0] || '';
      if (!updated.sales.campaign) updated.sales.campaign = colNames[2] || colNames[0] || '';
      if (!updated.sales.revenue) updated.sales.revenue = colNames[3] || colNames[0] || '';
      if (!updated.sales.units) updated.sales.units = colNames[4] || colNames[0] || '';
      if (!updated.sales.cost) updated.sales.cost = colNames[5] || colNames[0] || '';
    } else if (role === 'crm') {
      updated.crm.table = activeTable.tableName;
      if (updated.sales.table === activeTable.tableName) {
        updated.sales.table = '';
      }
      activeTable.columns.forEach((col: any) => {
        if (col.mappedTo === 'Deal ID') updated.crm.id = col.columnName;
        else if (col.mappedTo === 'Client Name') updated.crm.customerName = col.columnName;
        else if (col.mappedTo === 'Deal Value') updated.crm.value = col.columnName;
        else if (col.mappedTo === 'Status') updated.crm.status = col.columnName;
        else if (col.mappedTo === 'Last Updated') updated.crm.lastUpdated = col.columnName;
      });
      const colNames = activeTable.columns.map(c => c.columnName);
      if (!updated.crm.id) updated.crm.id = colNames[0] || '';
      if (!updated.crm.customerName) updated.crm.customerName = colNames[1] || colNames[0] || '';
      if (!updated.crm.value) updated.crm.value = colNames[2] || colNames[0] || '';
      if (!updated.crm.status) updated.crm.status = colNames[3] || colNames[0] || '';
      if (!updated.crm.lastUpdated) updated.crm.lastUpdated = colNames[4] || colNames[0] || '';
    } else {
      if (updated.sales.table === activeTable.tableName) {
        updated.sales.table = '';
      }
      if (updated.crm.table === activeTable.tableName) {
        updated.crm.table = '';
      }
    }
    
    setLocalMapping(updated);
    onChangeMapping?.(updated);
  };

  // Handle changing column slot assignment
  const handleColumnSlotChange = (slotType: 'sales' | 'crm', slotKey: string, columnName: string) => {
    const updated = { ...localMapping };
    if (slotType === 'sales') {
      updated.sales[slotKey] = columnName;
    } else {
      updated.crm[slotKey] = columnName;
    }
    setLocalMapping(updated);
    onChangeMapping?.(updated);
  };

  // Check role of active table
  const isActiveTableSales = localMapping.sales?.table === activeTable?.tableName;
  const isActiveTableCRM = localMapping.crm?.table === activeTable?.tableName;
  const activeTableRole = isActiveTableSales ? 'sales' : isActiveTableCRM ? 'crm' : 'unmapped';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mt-6 border border-slate-800 bg-slate-900/60 rounded-2xl p-5 backdrop-blur-md overflow-hidden relative"
      id="schema-explorer-root"
    >
      {/* Absolute Decorative Glow */}
      <div className="absolute top-0 right-1/4 w-72 h-72 bg-indigo-500/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-emerald-500/3 rounded-full blur-3xl pointer-events-none"></div>

      {/* Title & Metadata Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/20 rounded-xl text-indigo-400 shadow-inner">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              {isRtl ? 'الربط والتحليل الفيدرالي الذكي' : 'Smart Cognitive Mapping Panel'}
              <span className="flex items-center gap-1 text-[10px] bg-indigo-500/10 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-500/20 font-medium">
                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                {isRtl ? 'مدعوم بالذكاء الاصطناعي' : 'AI Assisted'}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {isRtl 
                ? 'يتعرف تلقائياً على بنية الجداول ويسمح بتخصيص وجهة البيانات والأعمدة بمرونة تامة' 
                : 'Auto-introspects schema, handles multilingual formats, and allows dynamic re-mapping'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Detected Language */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl px-3 py-1.5 flex items-center gap-2">
            <span className="text-[10px] text-slate-500">{isRtl ? 'لغة قاعدة البيانات:' : 'DB Language:'}</span>
            <span className="font-semibold text-indigo-400 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-ping"></span>
              {analysis.detectedLanguage}
            </span>
          </div>

          {/* Read-Only Shield */}
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-3 py-1.5 flex items-center gap-1.5 text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span className="font-semibold text-[10px] tracking-wide uppercase">
              {isRtl ? 'اتصال للقراءة فقط SELECT' : 'READ-ONLY CONNECT'}
            </span>
          </div>
        </div>
      </div>

      {/* AI Linguistic Analysis Quote Box */}
      {analysis.linguisticAnalysis && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-5 bg-gradient-to-r from-slate-950 to-slate-900 border border-indigo-500/10 rounded-xl p-4 flex items-start gap-3 relative shadow-inner"
        >
          <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed text-slate-300">
            <strong className="text-white block mb-1">
              {isRtl ? 'تحليل لغوي دلالي (الذكاء الاصطناعي):' : 'AI Semantic Interpretation:'}
            </strong>
            {analysis.linguisticAnalysis}
          </div>
        </motion.div>
      )}

      {/* Tabs for Introspected Tables */}
      <div className="mb-5">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
          {isRtl ? 'الجداول المكتشفة في قاعدة البيانات (انقر لتحديد أو تعديل الربط)' : 'Discovered Database Tables (Click to select/reassign table)'}
        </label>
        <div className="flex flex-wrap gap-2">
          {tables.map((t, idx) => {
            const isActive = selectedTableIdx === idx;
            const isRoutedToSales = localMapping.sales?.table === t.tableName;
            const isRoutedToCRM = localMapping.crm?.table === t.tableName;
            
            let destLabel = isRtl ? 'غير موجه' : 'Unmapped';
            let badgeClass = 'border-slate-800 text-slate-400 bg-slate-950/40';
            if (isRoutedToSales) {
              destLabel = isRtl ? 'لوحة المبيعات' : 'Sales Ledger';
              badgeClass = 'border-amber-500/20 text-amber-400 bg-amber-500/5';
            } else if (isRoutedToCRM) {
              destLabel = isRtl ? 'لوحة CRM' : 'CRM Pipeline';
              badgeClass = 'border-purple-500/20 text-purple-400 bg-purple-500/5';
            }

            return (
              <button
                key={t.tableName}
                onClick={() => setSelectedTableIdx(idx)}
                type="button"
                className={`flex flex-col text-left cursor-pointer transition-all border rounded-xl p-3 min-w-[140px] md:min-w-[170px] relative overflow-hidden ${
                  isActive 
                    ? 'border-indigo-500/40 bg-indigo-500/5 shadow-md shadow-indigo-950/20' 
                    : 'border-slate-800 bg-slate-950/30 hover:bg-slate-800/40 hover:border-slate-700/60'
                }`}
              >
                {isActive && (
                  <motion.div 
                    layoutId="activeTableBar"
                    className="absolute left-0 top-0 bottom-0 w-[3px] bg-indigo-500"
                  />
                )}
                <div className="flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="text-xs font-bold text-white truncate max-w-[130px]" dir="ltr">
                    {t.tableName}
                  </span>
                </div>
                <div className="mt-1.5 flex items-center justify-between gap-1 text-[9px]">
                  <span className="text-slate-500 truncate">{t.columns.length} {isRtl ? 'أعمدة' : 'columns'}</span>
                  <span className={`px-1.5 py-0.5 rounded border text-[8px] font-medium ${badgeClass}`}>
                    {destLabel}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Dynamic Table Routing Control Box */}
      <div className="mb-5 bg-slate-950/40 border border-slate-850 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20">
            <Settings className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              {isRtl ? `توجيه الجدول النشط: ${activeTable.tableName}` : `Active Table Routing: ${activeTable.tableName}`}
            </span>
            <span className="text-[10px] text-slate-400">
              {isRtl 
                ? 'اختر وظيفة هذا الجدول في النظام لتعيين أعمدته للمؤشرات المستهدفة' 
                : 'Select the role of this table to map its columns to target metrics'}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleTableRoleChange('unmapped')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
              activeTableRole === 'unmapped'
                ? 'bg-slate-850 border-slate-700 text-white'
                : 'bg-transparent border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            {isRtl ? 'غير موجه' : 'Unmapped'}
          </button>
          
          <button
            type="button"
            onClick={() => handleTableRoleChange('sales')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
              activeTableRole === 'sales'
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                : 'bg-transparent border-slate-800 text-slate-400 hover:border-amber-500/20 hover:text-amber-300'
            }`}
          >
            {isRtl ? 'جدول مبيعات' : 'Sales Table'}
          </button>

          <button
            type="button"
            onClick={() => handleTableRoleChange('crm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition-all ${
              activeTableRole === 'crm'
                ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                : 'bg-transparent border-slate-800 text-slate-400 hover:border-purple-500/20 hover:text-purple-300'
            }`}
          >
            {isRtl ? 'جدول علاقات العملاء CRM' : 'CRM Table'}
          </button>
        </div>
      </div>

      {/* Main Column-to-Slot Flow Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch relative">
        
        {/* LEFT COLUMN: Source DB Table Columns */}
        <div className="lg:col-span-5 bg-slate-950/50 border border-slate-800/85 rounded-xl p-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              {isRtl ? `أعمدة الجدول: ${activeTable.tableName}` : `Columns of: ${activeTable.tableName}`}
            </span>
            <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full" dir="ltr">
              {activeTableRole === 'sales' ? (isRtl ? 'مبيعات' : 'Sales') : activeTableRole === 'crm' ? 'CRM' : (isRtl ? 'غير موجه' : 'Unmapped')}
            </span>
          </div>

          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {activeTable.columns.map((col, colIdx) => {
              const isColHovered = hoveredCol === col.columnName;
              
              // Figure out active mapping display for column
              let currentSlotLabel = '';
              if (activeTableRole === 'sales') {
                const sKey = Object.keys(localMapping.sales).find(k => localMapping.sales[k as keyof typeof localMapping.sales] === col.columnName);
                if (sKey && sKey !== 'table') {
                  const matched = salesSlots.find(s => s.key === sKey);
                  if (matched) currentSlotLabel = matched.id;
                }
              } else if (activeTableRole === 'crm') {
                const cKey = Object.keys(localMapping.crm).find(k => localMapping.crm[k as keyof typeof localMapping.crm] === col.columnName);
                if (cKey && cKey !== 'table') {
                  const matched = crmSlots.find(s => s.key === cKey);
                  if (matched) currentSlotLabel = matched.id;
                }
              }

              const isHighlight = isColHovered || (hoveredSlot && currentSlotLabel === hoveredSlot);

              return (
                <div
                  key={`${col.columnName}-${colIdx}`}
                  onMouseEnter={() => setHoveredCol(col.columnName)}
                  onMouseLeave={() => setHoveredCol(null)}
                  className={`border rounded-xl p-3 transition-all relative group ${
                    isHighlight
                      ? 'border-indigo-500/50 bg-indigo-500/10 shadow-md shadow-indigo-950/20 scale-[1.01]'
                      : isColHovered
                      ? 'border-slate-700 bg-slate-800/50'
                      : 'border-slate-850 bg-slate-900/30'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <GitCommit className={`w-3.5 h-3.5 transition-colors ${isHighlight ? 'text-indigo-400 animate-spin-slow' : 'text-slate-500'}`} />
                      <span className="text-xs font-semibold text-slate-200" dir="ltr">
                        {col.columnName}
                      </span>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500" dir="ltr">
                      {col.dataType}
                    </span>
                  </div>

                  <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">
                    {col.purpose}
                  </p>

                  {currentSlotLabel && (
                    <div className="mt-2 pt-1.5 border-t border-slate-800/60 flex items-center justify-between text-[9px]">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Cpu className="w-2.5 h-2.5 text-indigo-400" />
                        {isRtl ? 'التوجيه المعين:' : 'Active mapping:'}
                      </span>
                      <span className="text-indigo-400 font-bold bg-indigo-950/30 border border-indigo-500/20 px-2 py-0.5 rounded flex items-center gap-1">
                        {isRtl ? 'موجه إلى' : 'Mapped to'} {currentSlotLabel}
                        {isRtl ? <ArrowLeft className="w-2.5 h-2.5 inline" /> : <ArrowRight className="w-2.5 h-2.5 inline" />}
                      </span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* MIDDLE COLUMN: Flow Arrows / Animation */}
        <div className="hidden lg:col-span-2 lg:flex flex-col items-center justify-center gap-3">
          <div className="p-3 rounded-full bg-slate-950/90 border border-slate-800 shadow-md">
            <Cpu className="w-6 h-6 text-indigo-400 animate-pulse" />
          </div>
          <div className="h-28 w-[1px] bg-gradient-to-b from-slate-800 via-indigo-500 to-slate-800 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-indigo-500 animate-bounce"></div>
          </div>
          <span className="text-[9px] font-mono text-slate-500 tracking-widest uppercase">
            {isRtl ? 'الربط العصبي' : 'Neural Flow'}
          </span>
        </div>

        {/* RIGHT COLUMN: Target Workspaces & Specific Slots */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          
          {/* Sales Target Workspace Card */}
          <div className={`border rounded-xl p-4 transition-all relative ${
            activeTableRole === 'sales' 
              ? 'border-amber-500/30 bg-amber-500/2' 
              : 'border-slate-800 bg-slate-950/20 opacity-40 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
              <Layers className="w-4 h-4 text-amber-400" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                {isRtl ? 'خانات وحدة المبيعات المستهدفة' : 'Sales Workspace Target Slots'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {salesSlots.map((slot) => {
                const mappedColumnName = localMapping.sales?.[slot.key] || '';
                const isSelected = hoveredCol && localMapping.sales?.[slot.key] === hoveredCol;
                const isSlotHovered = hoveredSlot === slot.id;

                return (
                  <div
                    key={slot.id}
                    onMouseEnter={() => setHoveredSlot(slot.id)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={`border rounded-xl p-2.5 transition-all relative overflow-hidden ${slot.color} ${
                      isSelected || isSlotHovered
                        ? 'ring-1 ring-indigo-500/40 border-indigo-500/30 scale-[1.02] bg-slate-950/60'
                        : 'bg-slate-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <slot.icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-slate-400 block font-medium leading-none">
                          {slot.label}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 block mt-0.5 tracking-wider uppercase">
                          {slot.id}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/40">
                      {activeTableRole === 'sales' ? (
                        <select
                          value={mappedColumnName}
                          onChange={(e) => handleColumnSlotChange('sales', slot.key, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-[10px] font-mono rounded-lg px-2 py-1 focus:border-indigo-500 focus:outline-none w-full"
                        >
                          <option value="">{isRtl ? '-- اختر عموداً --' : '-- Choose column --'}</option>
                          {activeTable.columns.map((c, cIdx) => (
                            <option key={`${c.columnName}-${cIdx}`} value={c.columnName}>{c.columnName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[9px] text-slate-600 italic">
                          {isRtl ? 'غير متوفر' : 'Unmapped'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* CRM Target Workspace Card */}
          <div className={`border rounded-xl p-4 transition-all relative ${
            activeTableRole === 'crm' 
              ? 'border-purple-500/30 bg-purple-500/2' 
              : 'border-slate-800 bg-slate-950/20 opacity-40 pointer-events-none'
          }`}>
            <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-3">
              <Database className="w-4 h-4 text-purple-400" />
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">
                {isRtl ? 'خانات وحدة صفقات CRM المستهدفة' : 'CRM Workspace Target Slots'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {crmSlots.map((slot) => {
                const mappedColumnName = localMapping.crm?.[slot.key] || '';
                const isSelected = hoveredCol && localMapping.crm?.[slot.key] === hoveredCol;
                const isSlotHovered = hoveredSlot === slot.id;

                return (
                  <div
                    key={slot.id}
                    onMouseEnter={() => setHoveredSlot(slot.id)}
                    onMouseLeave={() => setHoveredSlot(null)}
                    className={`border rounded-xl p-2.5 transition-all relative overflow-hidden ${slot.color} ${
                      isSelected || isSlotHovered
                        ? 'ring-1 ring-indigo-500/40 border-indigo-500/30 scale-[1.02] bg-slate-950/60'
                        : 'bg-slate-950/30'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <slot.icon className="w-3.5 h-3.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <span className="text-[9px] text-slate-400 block font-medium leading-none">
                          {slot.label}
                        </span>
                        <span className="text-[8px] font-bold text-slate-500 block mt-0.5 tracking-wider uppercase">
                          {slot.id}
                        </span>
                      </div>
                    </div>

                    <div className="mt-2 pt-1.5 border-t border-slate-800/40">
                      {activeTableRole === 'crm' ? (
                        <select
                          value={mappedColumnName}
                          onChange={(e) => handleColumnSlotChange('crm', slot.key, e.target.value)}
                          className="bg-slate-950 border border-slate-800 text-slate-200 text-[10px] font-mono rounded-lg px-2 py-1 focus:border-indigo-500 focus:outline-none w-full"
                        >
                          <option value="">{isRtl ? '-- اختر عموداً --' : '-- Choose column --'}</option>
                          {activeTable.columns.map((c, cIdx) => (
                            <option key={`${c.columnName}-${cIdx}`} value={c.columnName}>{c.columnName}</option>
                          ))}
                        </select>
                      ) : (
                        <span className="text-[9px] text-slate-600 italic">
                          {isRtl ? 'غير متوفر' : 'Unmapped'}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>

      {/* Guide/Legend bar */}
      <div className="mt-5 border-t border-slate-800/60 pt-3 flex flex-col md:flex-row items-center justify-between gap-4 text-[10px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          {isRtl 
            ? 'حدد الجدول، عيّن دوره (مبيعات أو CRM)، ثم اختر وجهة كل عمود بدقة متناهية.' 
            : 'Select a table, assign its role, then map each column field precisely using the dropdown selectors.'}
        </span>
        <span className="text-[9px] font-mono text-slate-500">
          SniperAI Cognitive Mapping v2.5
        </span>
      </div>

      {/* Save Button with strict Read-only notice */}
      {onSaveMapping && (
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-950/40 p-4 rounded-xl border border-slate-800/50">
          <div className="flex items-center gap-2 text-slate-400 text-xs leading-relaxed max-w-xl">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {isRtl 
                ? 'اتصال قاعدة البيانات للقراءة فقط بالكامل (SELECT). يمنع النظام تماماً أي تعديل أو كتابة لضمان أمان بياناتك.' 
                : 'Your database remains 100% READ-ONLY. The system strictly blocks any write or structural modifications.'}
            </span>
          </div>
          <button
            type="button"
            onClick={onSaveMapping}
            disabled={isSaving}
            className="px-5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl border border-indigo-500/30 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>{isRtl ? 'جاري الحفظ والربط الفيدرالي...' : 'Saving & Re-Mapping...'}</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5 text-indigo-300 animate-pulse" />
                <span>{isRtl ? 'حفظ وتطبيق إعدادات المخطط' : 'Save & Apply Custom Schema'}</span>
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}
