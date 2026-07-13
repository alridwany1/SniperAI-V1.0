import { SalesRecord, CRMDeal, InventoryItem } from '../types';

interface ParsedData {
  salesRecords: SalesRecord[];
  crmDeals: CRMDeal[];
  inventoryItems?: InventoryItem[];
  originalSchema?: any;
}

/**
 * Normalizes headers to standard keys
 */
function mapHeaderToKey(header: string): string {
  if (!header) return '';
  
  // Date mappings
  if (matchKeyword(header, ['date', 'time', 'تاريخ', 'fecha', 'day', 'يوم', 'التاريخ'])) {
    return 'date';
  }
  
  // Product mappings
  if (matchKeyword(header, ['product', 'item', 'sku', 'منتج', 'سلعة', 'صنف', 'producto', 'artículo', 'المنتج', 'السلعة'])) {
    return 'product';
  }
  
  // Campaign mappings
  if (matchKeyword(header, ['campaign', 'promo', 'حملة', 'تسويق', 'campana', 'origen', 'الحملة', 'التسويق'])) {
    return 'campaign';
  }
  
  // Revenue mappings
  if (matchKeyword(header, ['revenue', 'amount', 'price', 'total', 'إيراد', 'مبلغ', 'سعر', 'قيمة', 'اجمالي', 'ingresos', 'monto', 'venta', 'الإيراد', 'المبلغ', 'السعر', 'القيمة'])) {
    return 'revenue';
  }
  
  // Units mappings
  if (matchKeyword(header, ['units', 'qty', 'quantity', 'count', 'كمية', 'عدد', 'unidades', 'cantidad', 'الكمية', 'العدد'])) {
    return 'units';
  }
  
  // Cost mappings
  if (matchKeyword(header, ['cost', 'cogs', 'expense', 'تكلفة', 'مصاريف', 'costo', 'gasto', 'التكلفة', 'المصاريف'])) {
    return 'cost';
  }

  // CRM: Customer Name mappings
  if (matchKeyword(header, ['customer', 'client', 'contact', 'عميل', 'اسم_العميل', 'اسم العميل', 'cliente', 'nombre', 'account', 'العميل'])) {
    return 'customerName';
  }

  // CRM: Value mappings
  if (matchKeyword(header, ['value', 'worth', 'deal_value', 'قيمة_الصفقة', 'قيمة الصفقة', 'valor', 'contrato', 'القيمة'])) {
    return 'value';
  }

  // CRM: Status mappings
  if (matchKeyword(header, ['status', 'stage', 'state', 'phase', 'حالة', 'مرحلة', 'estado', 'etapa', 'الحالة', 'المرحلة'])) {
    return 'status';
  }

  // CRM: Last Updated mappings
  if (matchKeyword(header, ['update', 'last_update', 'تحديث', 'تعديل', 'actualizacion', 'التحديث', 'التعديل'])) {
    return 'lastUpdated';
  }

  // Inventory mappings for key fields
  if (matchKeyword(header, ['sku', 'code', 'id', 'معرف', 'رمز', 'رقم', 'كود', 'الرمز', 'الرقم', 'الكود'])) {
    return 'sku';
  }
  if (matchKeyword(header, ['stock', 'level', 'qty', 'quantity', 'count', 'available', 'كمية', 'مستوى', 'رصيد', 'موجود', 'الكمية', 'المستوى', 'الرصيد', 'الموجود'])) {
    return 'stockLevel';
  }
  if (matchKeyword(header, ['safety', 'min', 'minimum', 'alert', 'حد', 'امان', 'ادنى', 'تنبيه', 'الحد', 'الامان', 'الادنى', 'التنبيه'])) {
    return 'safetyStock';
  }
  if (matchKeyword(header, ['supplier', 'vendor', 'source', 'manufacturer', 'مورد', 'شركة', 'مصدر', 'المورد', 'الشركة', 'المصدر'])) {
    return 'supplier';
  }
  if (matchKeyword(header, ['price', 'sale_price', 'sell', 'بيع', 'سعر', 'سعر_البيع', 'سعر البيع'])) {
    return 'unitPrice';
  }

  return header.toLowerCase().trim().replace(/["'`_]/g, '');
}

/**
 * Parses raw JSON content
 */
function parseJSONContent(text: string): ParsedData {
  const salesRecords: SalesRecord[] = [];
  const crmDeals: CRMDeal[] = [];
  const inventoryItems: InventoryItem[] = [];
  
  try {
    const raw = JSON.parse(text);
    
    // Helper to process a flat array of objects
    const processArray = (arr: any[]) => {
      arr.forEach((item, idx) => {
        if (typeof item !== 'object' || item === null) return;
        
        // Let's identify the nature of the object by its keys
        const keys = Object.keys(item).map(k => ({ original: k, standard: mapHeaderToKey(k) }));
        const hasSalesIndicators = keys.some(k => ['revenue', 'units', 'cost'].includes(k.standard));
        const hasCRMIndicators = keys.some(k => ['customerName', 'status', 'value'].includes(k.standard));
        const hasInventoryIndicators = keys.some(k => ['stockLevel', 'safetyStock', 'supplier', 'unitPrice'].includes(k.standard));
        
        if (hasInventoryIndicators) {
          // Map to InventoryItem
          const skuKey = keys.find(k => k.standard === 'sku')?.original || '';
          const nameKey = keys.find(k => k.standard === 'product')?.original || '';
          const stockKey = keys.find(k => k.standard === 'stockLevel')?.original || '';
          const safetyKey = keys.find(k => k.standard === 'safetyStock')?.original || '';
          const costKey = keys.find(k => k.standard === 'cost')?.original || '';
          const priceKey = keys.find(k => k.standard === 'unitPrice')?.original || '';
          const supplierKey = keys.find(k => k.standard === 'supplier')?.original || '';
          const restockedKey = keys.find(k => k.standard === 'date')?.original || '';
          
          inventoryItems.push({
            id: skuKey && item[skuKey] ? String(item[skuKey]) : `inv-json-${idx + 1}`,
            sku: skuKey && item[skuKey] ? String(item[skuKey]) : `SKU-${idx + 100}`,
            productName: nameKey && item[nameKey] ? String(item[nameKey]) : 'Unknown Item',
            stockLevel: stockKey && !isNaN(parseInt(item[stockKey], 10)) ? parseInt(item[stockKey], 10) : 120,
            safetyStock: safetyKey && !isNaN(parseInt(item[safetyKey], 10)) ? parseInt(item[safetyKey], 10) : 30,
            unitCost: costKey && !isNaN(parseFloat(item[costKey])) ? parseFloat(item[costKey]) : 0,
            unitPrice: priceKey && !isNaN(parseFloat(item[priceKey])) ? parseFloat(item[priceKey]) : 0,
            supplier: supplierKey && item[supplierKey] ? String(item[supplierKey]) : 'Local Supplier',
            lastRestocked: restockedKey && item[restockedKey] ? String(item[restockedKey]).substring(0, 10) : new Date().toLocaleDateString('en-US')
          });
        } else if (hasSalesIndicators || !hasCRMIndicators) {
          // Map to SalesRecord
          const dateKey = keys.find(k => k.standard === 'date')?.original || '';
          const productKey = keys.find(k => k.standard === 'product')?.original || '';
          const campaignKey = keys.find(k => k.standard === 'campaign')?.original || '';
          const revenueKey = keys.find(k => k.standard === 'revenue')?.original || '';
          const unitsKey = keys.find(k => k.standard === 'units')?.original || '';
          const costKey = keys.find(k => k.standard === 'cost')?.original || '';
          
          salesRecords.push({
            date: item[dateKey] ? String(item[dateKey]).substring(0, 10) : new Date().toISOString().substring(0, 10),
            product: item[productKey] ? String(item[productKey]) : 'Standard Product',
            campaign: item[campaignKey] ? String(item[campaignKey]) : 'Organic',
            revenue: item[revenueKey] && !isNaN(parseFloat(item[revenueKey])) ? parseFloat(item[revenueKey]) : 0,
            units: item[unitsKey] && !isNaN(parseInt(item[unitsKey], 10)) ? parseInt(item[unitsKey], 10) : 1,
            cost: item[costKey] && !isNaN(parseFloat(item[costKey])) ? parseFloat(item[costKey]) : 0,
            isAnomaly: false,
            anomalyReason: ''
          });
        } else {
          // Map to CRMDeal
          const idKey = keys.find(k => k.standard.includes('id'))?.original || '';
          const nameKey = keys.find(k => k.standard === 'customerName')?.original || '';
          const valueKey = keys.find(k => k.standard === 'value')?.original || '';
          const statusKey = keys.find(k => k.standard === 'status')?.original || '';
          const updatedKey = keys.find(k => k.standard === 'lastUpdated')?.original || '';
          
          const rawStatus = item[statusKey] ? String(item[statusKey]) : 'Lead';
          let status: CRMDeal['status'] = 'Lead';
          if (/won|فوز|ناجحة|ganado/i.test(rawStatus)) status = 'Won';
          else if (/lost|خسارة|ملغاة|perdido/i.test(rawStatus)) status = 'Lost';
          else if (/proposal|عرض|تقديم|propuesta/i.test(rawStatus)) status = 'Proposal';
          else if (/qualified|مؤهل|qual/i.test(rawStatus)) status = 'Qualified';
 
          crmDeals.push({
            id: item[idKey] ? String(item[idKey]) : `deal-${idx + 1}`,
            customerName: item[nameKey] ? String(item[nameKey]) : 'Unknown Client',
            value: item[valueKey] && !isNaN(parseFloat(item[valueKey])) ? parseFloat(item[valueKey]) : 0,
            status,
            lastUpdated: item[updatedKey] ? String(item[updatedKey]).substring(0, 10) : new Date().toISOString().substring(0, 10)
          });
        }
      });
    };
 
    if (Array.isArray(raw)) {
      processArray(raw);
    } else if (typeof raw === 'object' && raw !== null) {
      // Look for nested arrays e.g. { sales: [...], crm: [...] }
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key])) {
          if (key.toLowerCase().includes('sale') || key.toLowerCase().includes('ledger') || key.toLowerCase().includes('record') || key.toLowerCase().includes('مبيعات')) {
            const tempRecords: SalesRecord[] = [];
            raw[key].forEach((item: any) => {
              const keys = Object.keys(item).map(k => ({ original: k, standard: mapHeaderToKey(k) }));
              const dateKey = keys.find(k => k.standard === 'date')?.original || '';
              const productKey = keys.find(k => k.standard === 'product')?.original || '';
              const campaignKey = keys.find(k => k.standard === 'campaign')?.original || '';
              const revenueKey = keys.find(k => k.standard === 'revenue')?.original || '';
              const unitsKey = keys.find(k => k.standard === 'units')?.original || '';
              const costKey = keys.find(k => k.standard === 'cost')?.original || '';
 
              tempRecords.push({
                date: item[dateKey] ? String(item[dateKey]).substring(0, 10) : new Date().toISOString().substring(0, 10),
                product: item[productKey] ? String(item[productKey]) : 'Standard Product',
                campaign: item[campaignKey] ? String(item[campaignKey]) : 'Organic',
                revenue: item[revenueKey] && !isNaN(parseFloat(item[revenueKey])) ? parseFloat(item[revenueKey]) : 0,
                units: item[unitsKey] && !isNaN(parseInt(item[unitsKey], 10)) ? parseInt(item[unitsKey], 10) : 1,
                cost: item[costKey] && !isNaN(parseFloat(item[costKey])) ? parseFloat(item[costKey]) : 0,
                isAnomaly: false,
                anomalyReason: ''
              });
            });
            salesRecords.push(...tempRecords);
          } else if (key.toLowerCase().includes('crm') || key.toLowerCase().includes('deal') || key.toLowerCase().includes('lead') || key.toLowerCase().includes('pipeline') || key.toLowerCase().includes('عملاء') || key.toLowerCase().includes('صفقات')) {
            const tempDeals: CRMDeal[] = [];
            raw[key].forEach((item: any, idx: number) => {
              const keys = Object.keys(item).map(k => ({ original: k, standard: mapHeaderToKey(k) }));
              const idKey = keys.find(k => k.standard.includes('id'))?.original || '';
              const nameKey = keys.find(k => k.standard === 'customerName')?.original || '';
              const valueKey = keys.find(k => k.standard === 'value')?.original || '';
              const statusKey = keys.find(k => k.standard === 'status')?.original || '';
              const updatedKey = keys.find(k => k.standard === 'lastUpdated')?.original || '';
 
              const rawStatus = item[statusKey] ? String(item[statusKey]) : 'Lead';
              let status: CRMDeal['status'] = 'Lead';
              if (/won|فوز|ناجحة|ganado/i.test(rawStatus)) status = 'Won';
              else if (/lost|خسارة|ملغاة|perdido/i.test(rawStatus)) status = 'Lost';
              else if (/proposal|عرض|تقديم|propuesta/i.test(rawStatus)) status = 'Proposal';
              else if (/qualified|مؤهل|qual/i.test(rawStatus)) status = 'Qualified';
 
              tempDeals.push({
                id: item[idKey] ? String(item[idKey]) : `deal-${idx + 1}`,
                customerName: item[nameKey] ? String(item[nameKey]) : 'Unknown Client',
                value: item[valueKey] && !isNaN(parseFloat(item[valueKey])) ? parseFloat(item[valueKey]) : 0,
                status,
                lastUpdated: item[updatedKey] ? String(item[updatedKey]).substring(0, 10) : new Date().toISOString().substring(0, 10)
              });
            });
            crmDeals.push(...tempDeals);
          } else if (key.toLowerCase().includes('inventory') || key.toLowerCase().includes('stock') || key.toLowerCase().includes('warehouse') || key.toLowerCase().includes('store') || key.toLowerCase().includes('catalog') || key.toLowerCase().includes('product') || key.toLowerCase().includes('item') || key.toLowerCase().includes('مخزن') || key.toLowerCase().includes('مخزون') || key.toLowerCase().includes('مستودع') || key.toLowerCase().includes('بضاعة') || key.toLowerCase().includes('منتجات') || key.toLowerCase().includes('اصناف')) {
            const tempInventory: InventoryItem[] = [];
            raw[key].forEach((item: any, idx: number) => {
              const keys = Object.keys(item).map(k => ({ original: k, standard: mapHeaderToKey(k) }));
              const skuKey = keys.find(k => k.standard === 'sku')?.original || '';
              const nameKey = keys.find(k => k.standard === 'product')?.original || '';
              const stockKey = keys.find(k => k.standard === 'stockLevel')?.original || '';
              const safetyKey = keys.find(k => k.standard === 'safetyStock')?.original || '';
              const costKey = keys.find(k => k.standard === 'cost')?.original || '';
              const priceKey = keys.find(k => k.standard === 'unitPrice')?.original || '';
              const supplierKey = keys.find(k => k.standard === 'supplier')?.original || '';
              const restockedKey = keys.find(k => k.standard === 'date')?.original || '';

              tempInventory.push({
                id: skuKey && item[skuKey] ? String(item[skuKey]) : `inv-json-${idx + 1}`,
                sku: skuKey && item[skuKey] ? String(item[skuKey]) : `SKU-${idx + 100}`,
                productName: nameKey && item[nameKey] ? String(item[nameKey]) : 'Unknown Item',
                stockLevel: stockKey && !isNaN(parseInt(item[stockKey], 10)) ? parseInt(item[stockKey], 10) : 120,
                safetyStock: safetyKey && !isNaN(parseInt(item[safetyKey], 10)) ? parseInt(item[safetyKey], 10) : 30,
                unitCost: costKey && !isNaN(parseFloat(item[costKey])) ? parseFloat(item[costKey]) : 0,
                unitPrice: priceKey && !isNaN(parseFloat(item[priceKey])) ? parseFloat(item[priceKey]) : 0,
                supplier: supplierKey && item[supplierKey] ? String(item[supplierKey]) : 'Local Supplier',
                lastRestocked: restockedKey && item[restockedKey] ? String(item[restockedKey]).substring(0, 10) : new Date().toLocaleDateString('en-US')
              });
            });
            inventoryItems.push(...tempInventory);
          } else {
            // Process generally
            processArray(raw[key]);
          }
        }
      }
    }
  } catch (e) {
    console.error('Failed to parse JSON file:', e);
  }
  
  return { salesRecords, crmDeals, inventoryItems };
}

/**
 * Parses CSV content
 */
function parseCSVContent(text: string): ParsedData {
  const salesRecords: SalesRecord[] = [];
  const crmDeals: CRMDeal[] = [];
  const inventoryItems: InventoryItem[] = [];
  
  try {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return { salesRecords, crmDeals, inventoryItems };
    
    // Detect delimiter
    let delimiter = ',';
    if (lines[0].includes(';')) delimiter = ';';
    else if (lines[0].includes('\t')) delimiter = '\t';
    
    // Split headers
    const headers = lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
    const mappedKeys = headers.map(h => mapHeaderToKey(h));
    
    // Detect type of CSV
    const hasSalesIndicators = mappedKeys.some(k => ['revenue', 'units', 'cost'].includes(k));
    const hasCRMIndicators = mappedKeys.some(k => ['customerName', 'status', 'value'].includes(k));
    const hasInventoryIndicators = mappedKeys.some(k => ['sku', 'stockLevel', 'safetyStock', 'supplier', 'unitPrice'].includes(k));
    
    let csvRole = 'sales';
    if (hasInventoryIndicators) csvRole = 'inventory';
    else if (hasCRMIndicators && !hasSalesIndicators) csvRole = 'crm';
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      // Simple CSV split (not handling escaped commas inside quotes for simplicity but sufficient for standard database exports)
      const values = line.split(delimiter).map(v => v.replace(/^["']|["']$/g, '').trim());
      if (values.length < headers.length) continue;
      
      const recordObj: any = {};
      headers.forEach((h, idx) => {
        const standardKey = mappedKeys[idx];
        recordObj[standardKey] = values[idx];
      });
      
      if (csvRole === 'inventory') {
        inventoryItems.push({
          id: recordObj.sku || `inv-csv-${i}`,
          sku: recordObj.sku || `SKU-${i + 100}`,
          productName: recordObj.product || 'Unknown Item',
          stockLevel: recordObj.stockLevel && !isNaN(parseInt(recordObj.stockLevel, 10)) ? parseInt(recordObj.stockLevel, 10) : 120,
          safetyStock: recordObj.safetyStock && !isNaN(parseInt(recordObj.safetyStock, 10)) ? parseInt(recordObj.safetyStock, 10) : 30,
          unitCost: recordObj.cost && !isNaN(parseFloat(recordObj.cost)) ? parseFloat(recordObj.cost) : 0,
          unitPrice: recordObj.unitPrice && !isNaN(parseFloat(recordObj.unitPrice)) ? parseFloat(recordObj.unitPrice) : 0,
          supplier: recordObj.supplier || 'Local Supplier',
          lastRestocked: recordObj.date ? recordObj.date.substring(0, 10) : new Date().toLocaleDateString('en-US')
        });
      } else if (csvRole === 'sales') {
        salesRecords.push({
          date: recordObj.date ? recordObj.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
          product: recordObj.product || 'Standard Product',
          campaign: recordObj.campaign || 'Organic',
          revenue: recordObj.revenue && !isNaN(parseFloat(recordObj.revenue)) ? parseFloat(recordObj.revenue) : 0,
          units: recordObj.units && !isNaN(parseInt(recordObj.units, 10)) ? parseInt(recordObj.units, 10) : 1,
          cost: recordObj.cost && !isNaN(parseFloat(recordObj.cost)) ? parseFloat(recordObj.cost) : 0,
          isAnomaly: false,
          anomalyReason: ''
        });
      } else {
        const rawStatus = recordObj.status || 'Lead';
        let status: CRMDeal['status'] = 'Lead';
        if (/won|فوز|ناجحة|ganado/i.test(rawStatus)) status = 'Won';
        else if (/lost|خسارة|ملغاة|perdido/i.test(rawStatus)) status = 'Lost';
        else if (/proposal|عرض|تقديم|propuesta/i.test(rawStatus)) status = 'Proposal';
        else if (/qualified|مؤهل|qual/i.test(rawStatus)) status = 'Qualified';

        crmDeals.push({
          id: recordObj.id || `deal-${i}`,
          customerName: recordObj.customerName || 'Unknown Client',
          value: recordObj.value && !isNaN(parseFloat(recordObj.value)) ? parseFloat(recordObj.value) : 0,
          status,
          lastUpdated: recordObj.lastUpdated ? recordObj.lastUpdated.substring(0, 10) : new Date().toISOString().substring(0, 10)
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse CSV file:', e);
  }
  
  return { salesRecords, crmDeals, inventoryItems };
}

/**
 * Parses SQL file for INSERT INTO statements
 */
function parseSQLContent(text: string): ParsedData {
  const salesRecords: SalesRecord[] = [];
  const crmDeals: CRMDeal[] = [];
  const inventoryItems: InventoryItem[] = [];
  
  try {
    // Regex to match INSERT INTO statements
    const insertRegex = /INSERT\s+INTO\s+([^\s\(]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;
    let match;
    let index = 1;
    
    while ((match = insertRegex.exec(text)) !== null) {
      const tableName = match[1].toLowerCase().replace(/["'`]/g, '');
      const columns = match[2].split(',').map(c => c.trim().replace(/["'`]/g, ''));
      const valuesStr = match[3];
      
      // Split values, handling simple quotes
      const values: string[] = [];
      let currentVal = '';
      let inQuotes = false;
      
      for (let charIdx = 0; charIdx < valuesStr.length; charIdx++) {
        const char = valuesStr[charIdx];
        if (char === "'" || char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          values.push(currentVal.trim().replace(/^['"]|['"]$/g, ''));
          currentVal = '';
        } else {
          currentVal += char;
        }
      }
      if (currentVal) {
        values.push(currentVal.trim().replace(/^['"]|['"]$/g, ''));
      }
      
      if (values.length < columns.length) continue;
      
      const recordObj: any = {};
      columns.forEach((col, idx) => {
        const standardKey = mapHeaderToKey(col);
        recordObj[standardKey] = values[idx];
      });
      
      const isSalesTable = tableName.includes('sale') || tableName.includes('ledger') || tableName.includes('transaction') || tableName.includes('invoice') || tableName.includes('مبيعات');
      const isCRMTable = tableName.includes('crm') || tableName.includes('deal') || tableName.includes('lead') || tableName.includes('pipeline') || tableName.includes('opportunity') || tableName.includes('عملاء');
      const isInventoryTable = tableName.includes('inventory') || tableName.includes('stock') || tableName.includes('warehouse') || tableName.includes('store') || tableName.includes('مخزن') || tableName.includes('مخزون') || tableName.includes('مستودع') || tableName.includes('بضاعة') || tableName.includes('منتجات') || tableName.includes('اصناف');
      
      if (isInventoryTable || recordObj.stockLevel !== undefined) {
        inventoryItems.push({
          id: recordObj.sku || `inv-sql-${index++}`,
          sku: recordObj.sku || `SKU-${index + 100}`,
          productName: recordObj.product || 'Unknown Item',
          stockLevel: recordObj.stockLevel && !isNaN(parseInt(recordObj.stockLevel, 10)) ? parseInt(recordObj.stockLevel, 10) : 120,
          safetyStock: recordObj.safetyStock && !isNaN(parseInt(recordObj.safetyStock, 10)) ? parseInt(recordObj.safetyStock, 10) : 30,
          unitCost: recordObj.cost && !isNaN(parseFloat(recordObj.cost)) ? parseFloat(recordObj.cost) : 0,
          unitPrice: recordObj.unitPrice && !isNaN(parseFloat(recordObj.unitPrice)) ? parseFloat(recordObj.unitPrice) : 0,
          supplier: recordObj.supplier || 'Local Supplier',
          lastRestocked: recordObj.date ? recordObj.date.substring(0, 10) : new Date().toLocaleDateString('en-US')
        });
      } else if (isSalesTable || (!isCRMTable && recordObj.revenue !== undefined)) {
        salesRecords.push({
          date: recordObj.date ? recordObj.date.substring(0, 10) : new Date().toISOString().substring(0, 10),
          product: recordObj.product || 'Standard Product',
          campaign: recordObj.campaign || 'Organic',
          revenue: recordObj.revenue && !isNaN(parseFloat(recordObj.revenue)) ? parseFloat(recordObj.revenue) : 0,
          units: recordObj.units && !isNaN(parseInt(recordObj.units, 10)) ? parseInt(recordObj.units, 10) : 1,
          cost: recordObj.cost && !isNaN(parseFloat(recordObj.cost)) ? parseFloat(recordObj.cost) : 0,
          isAnomaly: false,
          anomalyReason: ''
        });
      } else if (isCRMTable || recordObj.customerName !== undefined) {
        const rawStatus = recordObj.status || 'Lead';
        let status: CRMDeal['status'] = 'Lead';
        if (/won|فوز|ناجحة|ganado/i.test(rawStatus)) status = 'Won';
        else if (/lost|خسارة|ملغاة|perdido/i.test(rawStatus)) status = 'Lost';
        else if (/proposal|عرض|تقديم|propuesta/i.test(rawStatus)) status = 'Proposal';
        else if (/qualified|مؤهل|qual/i.test(rawStatus)) status = 'Qualified';
 
        crmDeals.push({
          id: recordObj.id || `deal-${index++}`,
          customerName: recordObj.customerName || 'Unknown Client',
          value: recordObj.value && !isNaN(parseFloat(recordObj.value)) ? parseFloat(recordObj.value) : 0,
          status,
          lastUpdated: recordObj.lastUpdated ? recordObj.lastUpdated.substring(0, 10) : new Date().toISOString().substring(0, 10)
        });
      }
    }
  } catch (e) {
    console.error('Failed to parse SQL insert scripts:', e);
  }
  
  return { salesRecords, crmDeals, inventoryItems };
}

function getCSVColumns(text: string): string[] {
  const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
  if (lines.length === 0) return [];
  let delimiter = ',';
  if (lines[0].includes(';')) delimiter = ';';
  else if (lines[0].includes('\t')) delimiter = '\t';
  return lines[0].split(delimiter).map(h => h.replace(/^["']|["']$/g, '').trim());
}

function getJSONColumns(text: string): Record<string, string[]> {
  try {
    const raw = JSON.parse(text);
    const res: Record<string, string[]> = {};
    if (Array.isArray(raw)) {
      if (raw.length > 0 && typeof raw[0] === 'object' && raw[0] !== null) {
        res['data'] = Object.keys(raw[0]);
      }
    } else if (typeof raw === 'object' && raw !== null) {
      for (const key of Object.keys(raw)) {
        if (Array.isArray(raw[key]) && raw[key].length > 0) {
          if (typeof raw[key][0] === 'object' && raw[key][0] !== null) {
            res[key] = Object.keys(raw[key][0]);
          }
        }
      }
    }
    return res;
  } catch (e) {
    return {};
  }
}

function getSQLColumns(text: string): Record<string, string[]> {
  const res: Record<string, string[]> = {};
  try {
    const insertRegex = /INSERT\s+INTO\s+([^\s\(]+)\s*\(([^)]+)\)/gi;
    let match;
    while ((match = insertRegex.exec(text)) !== null) {
      const tableName = match[1].toLowerCase().replace(/["'`]/g, '');
      const columns = match[2].split(',').map(c => c.trim().replace(/["'`]/g, ''));
      if (!res[tableName]) {
        res[tableName] = columns;
      }
    }
  } catch (e) {
    // ignore
  }
  return res;
}

function getSchemaFromFile(file: File, text: string): Record<string, any[]> {
  const name = file.name.toLowerCase();
  let schema: Record<string, any[]> = {};
  
  if (name.endsWith('.json')) {
    const colsMap = getJSONColumns(text);
    for (const [tbl, cols] of Object.entries(colsMap)) {
      schema[tbl] = cols.map(c => ({ column: c, type: 'varchar' }));
    }
  } else if (name.endsWith('.csv')) {
    const cols = getCSVColumns(text);
    const tblName = file.name.replace(/\.[^/.]+$/, "").replace(/[^\p{L}\p{N}_]/gu, "_");
    schema[tblName] = cols.map(c => ({ column: c, type: 'varchar' }));
  } else if (name.endsWith('.sql')) {
    const colsMap = getSQLColumns(text);
    for (const [tbl, cols] of Object.entries(colsMap)) {
      schema[tbl] = cols.map(c => ({ column: c, type: 'varchar' }));
    }
  }
  
  if (Object.keys(schema).length === 0) {
    if (text.includes('INSERT INTO') || text.includes('insert into')) {
      const colsMap = getSQLColumns(text);
      for (const [tbl, cols] of Object.entries(colsMap)) {
        schema[tbl] = cols.map(c => ({ column: c, type: 'varchar' }));
      }
    } else if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
      const colsMap = getJSONColumns(text);
      for (const [tbl, cols] of Object.entries(colsMap)) {
        schema[tbl] = cols.map(c => ({ column: c, type: 'varchar' }));
      }
    } else if (text.includes(',') && text.split('\n')[0].split(',').length > 2) {
      const cols = getCSVColumns(text);
      const tblName = file.name.replace(/\.[^/.]+$/, "").replace(/[^\p{L}\p{N}_]/gu, "_");
      schema[tblName] = cols.map(c => ({ column: c, type: 'varchar' }));
    }
  }
  
  return schema;
}

function arrayBufferToUTF8String(buffer: ArrayBuffer): string {
  try {
    const decoder = new TextDecoder('utf-8', { fatal: true });
    return decoder.decode(buffer);
  } catch (err) {
    try {
      console.log("UTF-8 decoding failed, trying windows-1256 for Arabic support.");
      const decoder = new TextDecoder('windows-1256', { fatal: false });
      return decoder.decode(buffer);
    } catch (fallbackErr) {
      const bytes = new Uint8Array(buffer);
      let binary = '';
      const len = bytes.byteLength;
      const chunkLimit = 8192;
      for (let i = 0; i < len; i += chunkLimit) {
        const chunk = bytes.subarray(i, i + chunkLimit);
        binary += String.fromCharCode.apply(null, chunk as any);
      }
      return binary;
    }
  }
}

export function normalizeArabicText(text: string): string {
  if (!text) return '';
  let normalized = text.toLowerCase().trim();
  
  // Remove leading "ال" prefix
  if (normalized.startsWith('ال')) {
    normalized = normalized.substring(2);
  }
  
  // Normalize Alifs (أ, إ, آ to ا)
  normalized = normalized.replace(/[أإآ]/g, 'ا');
  
  // Normalize Teh Marbuta (ة to ه)
  normalized = normalized.replace(/ة/g, 'ه');
  
  // Normalize Yeh (ى to ي)
  normalized = normalized.replace(/ى/g, 'ي');
  
  return normalized;
}

export function matchKeyword(columnName: string, keywords: string[]): boolean {
  if (!columnName) return false;
  const colLower = columnName.toLowerCase();
  const colNorm = normalizeArabicText(columnName);
  
  return keywords.some(kw => {
    const kwLower = kw.toLowerCase();
    const kwNorm = normalizeArabicText(kw);
    return colLower.includes(kwLower) || colNorm.includes(kwNorm);
  });
}

function getSQLiteSchemaFromBinaryString(binaryString: string, filename: string): Record<string, any[]> {
  const schema: Record<string, any[]> = {};
  
  const regex = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?([^"'`\s\(]+)["'`]?\s*\(/gi;
  
  let match;
  while ((match = regex.exec(binaryString)) !== null) {
    const tableName = match[1];
    const startIdx = match.index + match[0].length;
    
    let parenCount = 1;
    let endIdx = startIdx;
    while (parenCount > 0 && endIdx < binaryString.length) {
      const char = binaryString[endIdx];
      if (char === '(') parenCount++;
      else if (char === ')') parenCount--;
      endIdx++;
    }
    
    const columnsContent = binaryString.substring(startIdx, endIdx - 1);
    
    const columns: string[] = [];
    let currentCol = '';
    let parenLevel = 0;
    for (let i = 0; i < columnsContent.length; i++) {
      const char = columnsContent[i];
      if (char === '(') parenLevel++;
      else if (char === ')') parenLevel--;
      
      if (char === ',' && parenLevel === 0) {
        columns.push(currentCol.trim());
        currentCol = '';
      } else {
        currentCol += char;
      }
    }
    if (currentCol.trim()) {
      columns.push(currentCol.trim());
    }
    
    const parsedColumns = columns.map(colStr => {
      const colNameMatch = colStr.match(/^["'`]?([^"'`\s]+)["'`]?/);
      if (colNameMatch) {
        const colName = colNameMatch[1];
        let colType = 'varchar';
        const rest = colStr.substring(colNameMatch[0].length).trim().toLowerCase();
        
        if (rest.includes('int') || rest.includes('serial')) colType = 'integer';
        else if (rest.includes('double') || rest.includes('float') || rest.includes('real') || rest.includes('numeric')) colType = 'double precision';
        else if (rest.includes('bool')) colType = 'boolean';
        else if (rest.includes('date') || rest.includes('time')) colType = 'timestamp';
        
        return { column: colName, type: colType };
      }
      return null;
    }).filter(c => c !== null) as any[];
    
    if (parsedColumns.length > 0) {
      schema[tableName] = parsedColumns;
    }
  }
  
  return schema;
}

function loadSqlJs(): Promise<any> {
  return new Promise((resolve, reject) => {
    if ((window as any).initSqlJs) {
      resolve((window as any).initSqlJs);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/sql-wasm.js';
    script.async = true;
    script.onload = () => {
      resolve((window as any).initSqlJs);
    };
    script.onerror = () => {
      reject(new Error('Failed to load sql.js from CDN'));
    };
    document.head.appendChild(script);
  });
}

/**
 * Public entry point to parse any supported local file type
 */
export function parseLocalFile(file: File): Promise<ParsedData> {
  return new Promise((resolve) => {
    const name = file.name.toLowerCase();
    const isSqlite = name.endsWith('.db') || name.endsWith('.sqlite') || name.endsWith('.sqlite3') || name.endsWith('.db3');

    const reader = new FileReader();
    
    reader.onload = (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const text = arrayBufferToUTF8String(buffer);
      
      if (isSqlite) {
        
        loadSqlJs().then(async (initSqlJs) => {
          try {
            const SQL = await initSqlJs({
              locateFile: (file: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}`
            });
            const db = new SQL.Database(new Uint8Array(buffer));
            
            // Introspect tables and schemas
            const schema: Record<string, { column: string; type: string }[]> = {};
            
            const tablesRes = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'");
            const tableNames: string[] = [];
            if (tablesRes.length > 0 && tablesRes[0].values) {
              tablesRes[0].values.forEach((row: any) => {
                tableNames.push(row[0]);
              });
            }
            
            for (const tName of tableNames) {
              const colsRes = db.exec(`PRAGMA table_info("${tName}")`);
              if (colsRes.length > 0 && colsRes[0].values) {
                schema[tName] = colsRes[0].values.map((cRow: any) => ({
                  column: cRow[1], // name
                  type: cRow[2]    // type
                }));
              }
            }
            
            const salesRecords: SalesRecord[] = [];
            const crmDeals: CRMDeal[] = [];
            const inventoryItems: InventoryItem[] = [];
            
            // Find the sales, CRM, and inventory tables based on column matching or table names
            const salesTable = tableNames.find(t => matchKeyword(t, ['sale', 'ledger', 'transaction', 'invoice', 'order', 'مبيعات', 'عمليات', 'فواتير', 'طلبات', 'طلب']));
            const crmTable = tableNames.find(t => matchKeyword(t, ['crm', 'deal', 'lead', 'pipeline', 'opportunity', 'عملاء', 'صفقات', 'فرص', 'زبائن', 'عميل']));
            const inventoryTable = tableNames.find(t => matchKeyword(t, ['inventory', 'stock', 'warehouse', 'store', 'catalog', 'product', 'item', 'مخزن', 'مخزون', 'مستودع', 'بضاعة', 'سلع', 'منتجات', 'اصناف']));
            
            if (salesTable) {
              const dateCol = schema[salesTable].find(c => matchKeyword(c.column, ['date', 'time', 'create', 'تاريخ', 'وقت', 'يوم']))?.column;
              const productCol = schema[salesTable].find(c => matchKeyword(c.column, ['product', 'item', 'sku', 'منتج', 'سلعة', 'صنف']))?.column;
              const campaignCol = schema[salesTable].find(c => matchKeyword(c.column, ['campaign', 'source', 'medium', 'حملة', 'مصدر', 'تسويق']))?.column;
              const revenueCol = schema[salesTable].find(c => matchKeyword(c.column, ['revenue', 'amount', 'price', 'total', 'إيراد', 'مبلغ', 'سعر', 'قيمة', 'اجمالي']))?.column;
              const unitsCol = schema[salesTable].find(c => matchKeyword(c.column, ['unit', 'qty', 'quantity', 'count', 'كمية', 'عدد']))?.column;
              const costCol = schema[salesTable].find(c => matchKeyword(c.column, ['cost', 'cogs', 'expense', 'تكلفة', 'مصاريف']))?.column;
              
              const rowsRes = db.exec(`SELECT * FROM "${salesTable}" LIMIT 2000`);
              if (rowsRes.length > 0 && rowsRes[0].columns && rowsRes[0].values) {
                const colNames = rowsRes[0].columns;
                rowsRes[0].values.forEach((rowVals: any) => {
                  const rowObj: any = {};
                  colNames.forEach((cName, idx) => {
                    rowObj[cName] = rowVals[idx];
                  });
                  
                  salesRecords.push({
                    date: dateCol && rowObj[dateCol] ? String(rowObj[dateCol]).substring(0, 10) : new Date().toISOString().substring(0, 10),
                    product: productCol && rowObj[productCol] ? String(rowObj[productCol]) : 'Standard Product',
                    campaign: campaignCol && rowObj[campaignCol] ? String(rowObj[campaignCol]) : 'Organic',
                    revenue: revenueCol && !isNaN(parseFloat(rowObj[revenueCol])) ? parseFloat(rowObj[revenueCol]) : 0,
                    units: unitsCol && !isNaN(parseInt(rowObj[unitsCol], 10)) ? parseInt(rowObj[unitsCol], 10) : 1,
                    cost: costCol && !isNaN(parseFloat(rowObj[costCol])) ? parseFloat(rowObj[costCol]) : 0,
                    isAnomaly: false,
                    anomalyReason: ''
                  });
                });
              }
            }
            
            if (crmTable) {
              const idCol = schema[crmTable].find(c => matchKeyword(c.column, ['id', 'key', 'code', 'معرف', 'رقم', 'كود']))?.column;
              const nameCol = schema[crmTable].find(c => matchKeyword(c.column, ['name', 'customer', 'client', 'contact', 'عميل', 'اسم', 'زبون']))?.column;
              const valueCol = schema[crmTable].find(c => matchKeyword(c.column, ['value', 'amount', 'worth', 'revenue', 'قيمة', 'مبلغ', 'سعر']))?.column;
              const statusCol = schema[crmTable].find(c => matchKeyword(c.column, ['status', 'stage', 'state', 'phase', 'حالة', 'مرحلة']))?.column;
              const updatedCol = schema[crmTable].find(c => matchKeyword(c.column, ['update', 'date', 'time', 'تحديث', 'تاريخ']))?.column;
              
              const rowsRes = db.exec(`SELECT * FROM "${crmTable}" LIMIT 2000`);
              if (rowsRes.length > 0 && rowsRes[0].columns && rowsRes[0].values) {
                const colNames = rowsRes[0].columns;
                rowsRes[0].values.forEach((rowVals: any, idx) => {
                  const rowObj: any = {};
                  colNames.forEach((cName, cIdx) => {
                    rowObj[cName] = rowVals[cIdx];
                  });
                  
                  const rawStatus = statusCol && rowObj[statusCol] ? String(rowObj[statusCol]) : 'Lead';
                  let status: CRMDeal['status'] = 'Lead';
                  if (/won|فوز|ناجحة|ganado/i.test(rawStatus)) status = 'Won';
                  else if (/lost|خسارة|ملغاة|perdido/i.test(rawStatus)) status = 'Lost';
                  else if (/proposal|عرض|تقديم|propuesta/i.test(rawStatus)) status = 'Proposal';
                  else if (/qualified|مؤهل|qual/i.test(rawStatus)) status = 'Qualified';
                  
                  crmDeals.push({
                    id: idCol && rowObj[idCol] ? String(rowObj[idCol]) : `deal-sqlite-${idx + 1}`,
                    customerName: nameCol && rowObj[nameCol] ? String(rowObj[nameCol]) : 'Unknown Client',
                    value: valueCol && !isNaN(parseFloat(rowObj[valueCol])) ? parseFloat(rowObj[valueCol]) : 0,
                    status,
                    lastUpdated: updatedCol && rowObj[updatedCol] ? String(rowObj[updatedCol]).substring(0, 10) : new Date().toISOString().substring(0, 10)
                  });
                });
              }
            }

            if (inventoryTable) {
              const skuCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['sku', 'code', 'id', 'معرف', 'رمز', 'رقم', 'كود']))?.column;
              const nameCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['name', 'product', 'item', 'title', 'منتج', 'اسم', 'سلعة', 'صنف']))?.column;
              const stockCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['stock', 'level', 'qty', 'quantity', 'count', 'available', 'كمية', 'مستوى', 'رصيد', 'موجود']))?.column;
              const safetyCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['safety', 'min', 'minimum', 'alert', 'حد', 'امان', 'ادنى', 'تنبيه']))?.column;
              const costCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['cost', 'cogs', 'purchase', 'شراء', 'تكلفة', 'سعر_التكلفة']))?.column;
              const priceCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['price', 'sale_price', 'sell', 'بيع', 'سعر', 'سعر_البيع']))?.column;
              const supplierCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['supplier', 'vendor', 'source', 'manufacturer', 'مورد', 'شركة', 'مصدر']))?.column;
              const restockedCol = schema[inventoryTable].find(c => matchKeyword(c.column, ['date', 'time', 'update', 'restock', 'تاريخ', 'تحديث', 'توريد']))?.column;
              
              const rowsRes = db.exec(`SELECT * FROM "${inventoryTable}" LIMIT 2000`);
              if (rowsRes.length > 0 && rowsRes[0].columns && rowsRes[0].values) {
                const colNames = rowsRes[0].columns;
                rowsRes[0].values.forEach((rowVals: any, idx) => {
                  const rowObj: any = {};
                  colNames.forEach((cName, cIdx) => {
                    rowObj[cName] = rowVals[cIdx];
                  });
                  
                  inventoryItems.push({
                    id: skuCol && rowObj[skuCol] ? String(rowObj[skuCol]) : `inv-sqlite-${idx + 1}`,
                    sku: skuCol && rowObj[skuCol] ? String(rowObj[skuCol]) : `SKU-${idx + 100}`,
                    productName: nameCol && rowObj[nameCol] ? String(rowObj[nameCol]) : 'Unknown Item',
                    stockLevel: stockCol && !isNaN(parseInt(rowObj[stockCol], 10)) ? parseInt(rowObj[stockCol], 10) : 120,
                    safetyStock: safetyCol && !isNaN(parseInt(rowObj[safetyCol], 10)) ? parseInt(rowObj[safetyCol], 10) : 30,
                    unitCost: costCol && !isNaN(parseFloat(rowObj[costCol])) ? parseFloat(rowObj[costCol]) : 0,
                    unitPrice: priceCol && !isNaN(parseFloat(rowObj[priceCol])) ? parseFloat(rowObj[priceCol]) : 0,
                    supplier: supplierCol && rowObj[supplierCol] ? String(rowObj[supplierCol]) : 'Local Supplier',
                    lastRestocked: restockedCol && rowObj[restockedCol] ? String(rowObj[restockedCol]).substring(0, 10) : new Date().toLocaleDateString('en-US')
                  });
                });
              }
            }
            
            db.close();
            resolve({
              salesRecords,
              crmDeals,
              inventoryItems,
              originalSchema: schema
            });
          } catch (sqliteErr) {
            console.error("SQLite binary parsing failed, falling back to basic header discovery", sqliteErr);
            const schema = getSQLiteSchemaFromBinaryString(text, file.name);
            resolve({
              salesRecords: [],
              crmDeals: [],
              inventoryItems: [],
              originalSchema: schema
            });
          }
        }).catch((err) => {
          console.error("Failed to load sql.js", err);
          const schema = getSQLiteSchemaFromBinaryString(text, file.name);
          resolve({
            salesRecords: [],
            crmDeals: [],
            inventoryItems: [],
            originalSchema: schema
          });
        });
      } else {
        let parsed: ParsedData;
        
        if (name.endsWith('.json')) {
          parsed = parseJSONContent(text);
        } else if (name.endsWith('.csv')) {
          parsed = parseCSVContent(text);
        } else if (name.endsWith('.sql')) {
          parsed = parseSQLContent(text);
        } else {
          if (text.includes('INSERT INTO') || text.includes('insert into')) {
            parsed = parseSQLContent(text);
          } else if (text.trim().startsWith('{') || text.trim().startsWith('[')) {
            parsed = parseJSONContent(text);
          } else if (text.includes(',') && text.split('\n')[0].split(',').length > 2) {
            parsed = parseCSVContent(text);
          } else {
            parsed = { salesRecords: [], crmDeals: [], inventoryItems: [] };
          }
        }
        
        const originalSchema = getSchemaFromFile(file, text);
        resolve({
          ...parsed,
          originalSchema
        });
      }
    };
    
    reader.onerror = () => {
      resolve({ salesRecords: [], crmDeals: [], inventoryItems: [] });
    };
    
    reader.readAsArrayBuffer(file);
  });
}
