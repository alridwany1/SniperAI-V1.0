import React, { useState, useEffect } from 'react';
import { Database, Plus, Trash2, Play, Code, Eye, AlertCircle, X, ChevronRight, CheckSquare, Square } from 'lucide-react';
import { Tenant, ChatMessage } from '../types';
import { safeFetchJson } from '../utils/apiUtils';

interface SchemaField {
  column: string;
  type: string;
}

interface VisualQueryBuilderProps {
  activeTenant: Tenant;
  language: 'en' | 'ar';
  onClose: () => void;
  onQueryExecuted: (sqlText: string, resultsMsg: ChatMessage) => void;
}

interface WhereClause {
  column: string;
  operator: string;
  value: string;
}

export default function VisualQueryBuilder({
  activeTenant,
  language,
  onClose,
  onQueryExecuted
}: VisualQueryBuilderProps) {
  const isRTL = language === 'ar';
  
  // Schema states
  const [schema, setSchema] = useState<Record<string, SchemaField[]>>({});
  const [loadingSchema, setLoadingSchema] = useState(false);
  const [schemaError, setSchemaError] = useState<string | null>(null);

  // Form states
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [whereClauses, setWhereClauses] = useState<WhereClause[]>([]);
  const [orderByColumn, setOrderByColumn] = useState<string>('');
  const [orderByDirection, setOrderByDirection] = useState<'ASC' | 'DESC'>('DESC');
  const [limitCount, setLimitCount] = useState<number>(10);
  
  // Custom SQL / Editing states
  const [isManualSql, setIsManualSql] = useState(false);
  const [sqlQueryString, setSqlQueryString] = useState('');
  const [executing, setExecuting] = useState(false);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Fetch schema on mount or activeTenant change
  useEffect(() => {
    let active = true;
    const fetchSchema = async () => {
      setLoadingSchema(true);
      setSchemaError(null);
      try {
        const data = await safeFetchJson(`/api/tenants/${activeTenant.id}/schema`);
        if (data.success && data.schema && active) {
          setSchema(data.schema);
          const tables = Object.keys(data.schema);
          if (tables.length > 0) {
            setSelectedTable(tables[0]);
          }
        } else if (active) {
          setSchemaError(data.error || 'Failed to load table schemas');
        }
      } catch (err: any) {
        if (active) {
          setSchemaError(err.message || 'Error connecting to schema API');
        }
      } finally {
        if (active) setLoadingSchema(false);
      }
    };

    fetchSchema();
    return () => {
      active = false;
    };
  }, [activeTenant.id]);

  // Reset columns and clauses when table changes
  useEffect(() => {
    if (selectedTable && schema[selectedTable]) {
      // By default select all columns
      const cols = schema[selectedTable].map(f => f.column);
      setSelectedColumns(cols);
      setWhereClauses([]);
      setOrderByColumn(cols[0] || '');
      setOrderByDirection('DESC');
    }
  }, [selectedTable, schema]);

  // Generate SQL string reactively
  useEffect(() => {
    if (isManualSql) return; // Don't overwrite if manual mode is active

    if (!selectedTable) {
      setSqlQueryString('');
      return;
    }

    const colsPart = selectedColumns.length === 0 ? '*' : selectedColumns.map(c => `"${c}"`).join(', ');
    let sql = `SELECT ${colsPart} FROM "${selectedTable}"`;

    // Where
    if (whereClauses.length > 0) {
      const conds = whereClauses
        .filter(c => c.column && c.operator)
        .map(c => {
          const val = c.value;
          const isNumeric = !isNaN(Number(val)) && val.trim() !== '';
          if (c.operator === 'IS NULL' || c.operator === 'IS NOT NULL') {
            return `"${c.column}" ${c.operator}`;
          }
          if (c.operator === 'LIKE') {
            return `"${c.column}" LIKE '%${val.replace(/'/g, "''")}%'`;
          }
          const escapedVal = isNumeric ? val : `'${val.replace(/'/g, "''")}'`;
          return `"${c.column}" ${c.operator} ${escapedVal}`;
        });
      if (conds.length > 0) {
        sql += ` WHERE ${conds.join(' AND ')}`;
      }
    }

    // Order By
    if (orderByColumn) {
      sql += ` ORDER BY "${orderByColumn}" ${orderByDirection}`;
    }

    // Limit
    if (limitCount && limitCount > 0) {
      sql += ` LIMIT ${limitCount}`;
    }

    setSqlQueryString(sql);
  }, [selectedTable, selectedColumns, whereClauses, orderByColumn, orderByDirection, limitCount, isManualSql]);

  // Operators helper
  const OPERATORS = ['=', '!=', '>', '<', '>=', '<=', 'LIKE', 'IS NULL', 'IS NOT NULL'];

  const handleAddWhere = () => {
    const tableCols = selectedTable && schema[selectedTable] ? schema[selectedTable] : [];
    if (tableCols.length === 0) return;
    setWhereClauses([...whereClauses, { column: tableCols[0].column, operator: '=', value: '' }]);
  };

  const handleRemoveWhere = (idx: number) => {
    setWhereClauses(whereClauses.filter((_, i) => i !== idx));
  };

  const handleUpdateWhere = (idx: number, field: keyof WhereClause, val: string) => {
    const updated = [...whereClauses];
    updated[idx][field] = val;
    setWhereClauses(updated);
  };

  const handleToggleColumn = (col: string) => {
    if (selectedColumns.includes(col)) {
      // Don't let them unselect all columns completely visually
      setSelectedColumns(selectedColumns.filter(c => c !== col));
    } else {
      setSelectedColumns([...selectedColumns, col]);
    }
  };

  const handleSelectAllColumns = () => {
    if (!selectedTable || !schema[selectedTable]) return;
    const allCols = schema[selectedTable].map(f => f.column);
    if (selectedColumns.length === allCols.length) {
      // Toggle to empty
      setSelectedColumns([]);
    } else {
      setSelectedColumns(allCols);
    }
  };

  const handleRunQuery = async () => {
    if (!sqlQueryString.trim()) return;
    setExecuting(true);
    setExecutionError(null);

    try {
      const data = await safeFetchJson('/api/query/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: activeTenant.id,
          query: sqlQueryString,
          structuredQuery: isManualSql ? null : {
            table: selectedTable,
            columns: selectedColumns,
            where: whereClauses,
            orderBy: { column: orderByColumn, direction: orderByDirection },
            limit: limitCount
          }
        })
      });

      if (data.success) {
        // Construct standard AI model response payload featuring SQL query stats & beautiful custom tableData
        const durationText = language === 'ar' ? `خلال ${data.executionTimeMs} ملي ثانية` : `in ${data.executionTimeMs}ms`;
        const resultMsg: ChatMessage = {
          id: `sql-res-${Date.now()}`,
          role: 'model',
          text: language === 'ar' 
            ? `📊 **نتائج استعلام SQL** (${durationText}):\n\`${data.query}\``
            : `📊 **SQL Query Results** (${durationText}):\n\`${data.query}\``,
          timestamp: new Date().toLocaleTimeString(),
          tableData: {
            title: language === 'ar' 
              ? `استعلام عن ${selectedTable || 'قاعدة البيانات'} [${durationText}]`
              : `Query on ${selectedTable || 'Database'} [${durationText}]`,
            headers: data.columns,
            rows: data.rows
          }
        };

        onQueryExecuted(sqlQueryString, resultMsg);
        onClose();
      } else {
        setExecutionError(data.error || 'Failed to execute query');
      }
    } catch (err: any) {
      setExecutionError(err.message || 'Error executing query on database');
    } finally {
      setExecuting(false);
    }
  };

  const tablesList = Object.keys(schema);
  const currentTableColumns = selectedTable && schema[selectedTable] ? schema[selectedTable] : [];

  return (
    <div className="absolute inset-x-0 bottom-0 top-[60px] bg-slate-950 border-t border-slate-800 flex flex-col z-50 animate-slide-up text-xs overflow-hidden">
      {/* Header Panel */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-900/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Database className="w-4 h-4 text-indigo-400" />
          <h3 className="font-semibold text-slate-200 text-sm">
            {isRTL ? 'مخطط وباني استعلامات SQL' : 'SQL Visual Query Builder'}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="p-1 text-slate-400 hover:text-slate-100 bg-slate-800 hover:bg-slate-700/80 rounded-lg transition-all cursor-pointer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {loadingSchema ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2.5 text-slate-400 font-mono text-[10px]">
          <span className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></span>
          <span>{isRTL ? 'جاري تحميل قائمة الجداول والأعمدة...' : 'Loading tables and attributes...'}</span>
        </div>
      ) : schemaError ? (
        <div className="flex-1 p-6 flex flex-col items-center justify-center gap-3 text-center">
          <AlertCircle className="w-8 h-8 text-rose-500" />
          <p className="text-slate-300 font-medium">{schemaError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg"
          >
            {isRTL ? 'إعادة المحاولة' : 'Retry'}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
          
          {/* Table Selector */}
          <div className="space-y-1">
            <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
              {isRTL ? 'اختر الجدول' : '1. Select Database Table'}
            </label>
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
            >
              {tablesList.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Columns Selector */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {isRTL ? '2. الأعمدة المراد عرضها' : '2. Columns to display (SELECT)'}
              </label>
              <button
                type="button"
                onClick={handleSelectAllColumns}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-all font-semibold cursor-pointer"
              >
                {selectedColumns.length === currentTableColumns.length 
                  ? (isRTL ? 'إلغاء تحديد الكل' : 'Clear All')
                  : (isRTL ? 'تحديد الكل' : 'Select All')}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-1.5 bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
              {currentTableColumns.map(f => {
                const isSelected = selectedColumns.includes(f.column);
                return (
                  <button
                    key={f.column}
                    type="button"
                    onClick={() => handleToggleColumn(f.column)}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-start transition-all cursor-pointer border ${
                      isSelected 
                        ? 'bg-indigo-600/10 border-indigo-500/30 text-indigo-200' 
                        : 'bg-slate-900/60 border-transparent text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-600" />
                    )}
                    <span className="font-mono text-[10px] truncate">{f.column}</span>
                    <span className="text-[9px] text-slate-500 font-mono ml-auto">({f.type})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Filters / WHERE clause */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {isRTL ? '3. شروط التصفية (WHERE)' : '3. Filters (WHERE Clause)'}
              </label>
              <button
                type="button"
                onClick={handleAddWhere}
                className="text-[10px] bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded-md flex items-center gap-1 transition-all cursor-pointer"
              >
                <Plus className="w-3 h-3 text-indigo-400" />
                <span>{isRTL ? 'إضافة شرط' : 'Add Condition'}</span>
              </button>
            </div>

            {whereClauses.length === 0 ? (
              <div className="text-[10px] text-slate-500 text-center py-2 bg-slate-900/20 rounded-lg border border-dashed border-slate-800/60 font-light">
                {isRTL ? 'لا توجد شروط نشطة. سيتم سحب كافة السجلات.' : 'No active filters. All table records will be included.'}
              </div>
            ) : (
              <div className="space-y-2">
                {whereClauses.map((clause, idx) => (
                  <div key={idx} className="flex gap-1.5 items-center">
                    {/* Column */}
                    <select
                      value={clause.column}
                      onChange={(e) => handleUpdateWhere(idx, 'column', e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-slate-200 focus:outline-none"
                    >
                      {currentTableColumns.map(f => (
                        <option key={f.column} value={f.column}>{f.column}</option>
                      ))}
                    </select>

                    {/* Operator */}
                    <select
                      value={clause.operator}
                      onChange={(e) => handleUpdateWhere(idx, 'operator', e.target.value)}
                      className="w-16 bg-slate-900 border border-slate-800 rounded-md px-1 py-1 text-slate-200 focus:outline-none font-mono text-[10px]"
                    >
                      {OPERATORS.map(op => (
                        <option key={op} value={op}>{op}</option>
                      ))}
                    </select>

                    {/* Value */}
                    {clause.operator !== 'IS NULL' && clause.operator !== 'IS NOT NULL' && (
                      <input
                        type="text"
                        value={clause.value}
                        onChange={(e) => handleUpdateWhere(idx, 'value', e.target.value)}
                        placeholder={isRTL ? 'القيمة...' : 'Value...'}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-md px-1.5 py-1 text-slate-200 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-indigo-500/30"
                      />
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleRemoveWhere(idx)}
                      className="p-1.5 text-rose-400 hover:text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-md transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Order By and Limit row */}
          <div className="grid grid-cols-2 gap-4">
            {/* Order By */}
            <div className="space-y-1">
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {isRTL ? '4. الترتيب (ORDER BY)' : '4. Sorting (ORDER BY)'}
              </label>
              <div className="flex gap-1">
                <select
                  value={orderByColumn}
                  onChange={(e) => setOrderByColumn(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-slate-200 focus:outline-none"
                >
                  <option value="">{isRTL ? '-- بدون ترتيب --' : '-- No Sorting --'}</option>
                  {currentTableColumns.map(f => (
                    <option key={f.column} value={f.column}>{f.column}</option>
                  ))}
                </select>
                {orderByColumn && (
                  <button
                    type="button"
                    onClick={() => setOrderByDirection(orderByDirection === 'ASC' ? 'DESC' : 'ASC')}
                    className="px-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-lg text-[9px] font-mono cursor-pointer font-bold"
                  >
                    {orderByDirection}
                  </button>
                )}
              </div>
            </div>

            {/* Limit */}
            <div className="space-y-1">
              <label className="block text-[10px] font-medium text-slate-400 uppercase tracking-wider">
                {isRTL ? '5. عدد النتائج القصوى (LIMIT)' : '5. Row Limit (LIMIT)'}
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={limitCount}
                onChange={(e) => setLimitCount(Math.min(100, Math.max(1, parseInt(e.target.value, 10) || 10)))}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-200 focus:outline-none"
              />
            </div>
          </div>

          {/* SQL Preview Panel */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
            <div className="flex items-center justify-between">
              <label className="text-[10px] font-medium text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3 h-3 text-indigo-400" />
                <span>{isRTL ? 'استعلام SQL الناتج' : 'Generated SQL Statement'}</span>
              </label>
              <button
                type="button"
                onClick={() => setIsManualSql(!isManualSql)}
                className="text-[10px] text-indigo-400 hover:text-indigo-300 transition-all font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>{isManualSql ? (isRTL ? 'العودة للمخطط المرئي' : 'Switch to Visual') : (isRTL ? 'تعديل الاستعلام يدوياً' : 'Edit Manually')}</span>
              </button>
            </div>
            <textarea
              value={sqlQueryString}
              onChange={(e) => isManualSql && setSqlQueryString(e.target.value)}
              readOnly={!isManualSql}
              rows={3}
              className={`w-full font-mono text-[10px] p-2.5 rounded-lg border focus:outline-none leading-relaxed transition-all ${
                isManualSql 
                  ? 'bg-slate-900 border-indigo-500/50 text-indigo-100 focus:ring-1 focus:ring-indigo-500/30' 
                  : 'bg-slate-950 border-slate-800/80 text-emerald-400/90'
              }`}
            />
          </div>

          {/* Execution Warning / Error Alert */}
          {executionError && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-lg flex gap-2 items-start text-[10px] animate-fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{executionError}</span>
            </div>
          )}

        </div>
      )}

      {/* Execute Footer Actions */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex gap-2 justify-end">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-all font-semibold cursor-pointer"
        >
          {isRTL ? 'إلغاء' : 'Cancel'}
        </button>
        <button
          type="button"
          disabled={executing || !sqlQueryString.trim() || loadingSchema}
          onClick={handleRunQuery}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-all flex items-center gap-1.5 font-semibold disabled:opacity-40 disabled:hover:bg-indigo-600 cursor-pointer"
        >
          {executing ? (
            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
          ) : (
            <Play className="w-3 h-3 fill-current" />
          )}
          <span>{isRTL ? 'تشغيل الاستعلام' : 'Run Query'}</span>
        </button>
      </div>
    </div>
  );
}
