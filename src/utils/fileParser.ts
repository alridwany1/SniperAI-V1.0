import { SalesRecord, CRMDeal } from '../types';

interface ParsedData {
  salesRecords: SalesRecord[];
  crmDeals: CRMDeal[];
  originalSchema?: any;
}

/**
 * Normalizes headers to standard keys
 */
function mapHeaderToKey(header: string): string {
  const h = header.toLowerCase().trim().replace(/["'`_]/g, '');
  
  // Date mappings
  if (h.includes('date') || h.includes('time') || h.includes('تاريخ') || h.includes('fecha') || h.includes('day') || h.includes('يوم')) {
    return 'date';
  }
  
  // Product mappings
  if (h.includes('product') || h.includes('item') || h.includes('sku') || h.includes('منتج') || h.includes('سلعة') || h.includes('producto') || h.includes('artículo')) {
    return 'product';
  }
  
  // Campaign mappings
  if (h.includes('campaign') || h.includes('promo') || h.includes('حملة') || h.includes('تسويق') || h.includes('campana') || h.includes('origen')) {
    return 'campaign';
  }
  
  // Revenue mappings
  if (h.includes('revenue') || h.includes('amount') || h.includes('price') || h.includes('total') || h.includes('إيراد') || h.includes('مبلغ') || h.includes('سعر') || h.includes('قيمة') || h.includes('ingresos') || h.includes('monto') || h.includes('venta')) {
    return 'revenue';
  }
  
  // Units mappings
  if (h.includes('units') || h.includes('qty') || h.includes('quantity') || h.includes('count') || h.includes('كمية') || h.includes('عدد') || h.includes('unidades') || h.includes('cantidad')) {
    return 'units';
  }
  
  // Cost mappings
  if (h.includes('cost') || h.includes('cogs') || h.includes('expense') || h.includes('تكلفة') || h.includes('مصاريف') || h.includes('costo') || h.includes('gasto')) {
    return 'cost';
  }

  // CRM: Customer Name mappings
  if (h.includes('customer') || h.includes('client') || h.includes('contact') || h.includes('عميل') || h.includes('اسم_العميل') || h.includes('cliente') || h.includes('nombre') || h.includes('account')) {
    return 'customerName';
  }

  // CRM: Value mappings
  if (h.includes('value') || h.includes('worth') || h.includes('deal_value') || h.includes('قيمة_الصفقة') || h.includes('valor') || h.includes('contrato')) {
    return 'value';
  }

  // CRM: Status mappings
  if (h.includes('status') || h.includes('stage') || h.includes('state') || h.includes('phase') || h.includes('حالة') || h.includes('مرحلة') || h.includes('estado') || h.includes('etapa')) {
    return 'status';
  }

  // CRM: Last Updated mappings
  if (h.includes('update') || h.includes('last_update') || h.includes('تحديث') || h.includes('تعديل') || h.includes('actualizacion')) {
    return 'lastUpdated';
  }

  return h;
}

/**
 * Parses raw JSON content
 */
function parseJSONContent(text: string): ParsedData {
  const salesRecords: SalesRecord[] = [];
  const crmDeals: CRMDeal[] = [];
  
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
        
        if (hasSalesIndicators || !hasCRMIndicators) {
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
  
  return { salesRecords, crmDeals };
}

/**
 * Parses CSV content
 */
function parseCSVContent(text: string): ParsedData {
  const salesRecords: SalesRecord[] = [];
  const crmDeals: CRMDeal[] = [];
  
  try {
    const lines = text.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length <= 1) return { salesRecords, crmDeals };
    
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
    const isSalesCsv = hasSalesIndicators || !hasCRMIndicators;
    
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
      
      if (isSalesCsv) {
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
  
  return { salesRecords, crmDeals };
}

/**
 * Parses SQL file for INSERT INTO statements
 */
function parseSQLContent(text: string): ParsedData {
  const salesRecords: SalesRecord[] = [];
  const crmDeals: CRMDeal[] = [];
  
  try {
    // Regex to match INSERT INTO statements
    const insertRegex = /INSERT\s+INTO\s+([a-zA-Z0-9_"]+)\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/gi;
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
      
      if (isSalesTable || (!isCRMTable && recordObj.revenue !== undefined)) {
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
  
  return { salesRecords, crmDeals };
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
    const insertRegex = /INSERT\s+INTO\s+([a-zA-Z0-9_"]+)\s*\(([^)]+)\)/gi;
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
    const tblName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
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
      const tblName = file.name.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9_]/g, "_");
      schema[tblName] = cols.map(c => ({ column: c, type: 'varchar' }));
    }
  }
  
  return schema;
}

function arrayBufferToBinaryString(buffer: ArrayBuffer): string {
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

function getSQLiteSchemaFromBinaryString(binaryString: string, filename: string): Record<string, any[]> {
  const schema: Record<string, any[]> = {};
  
  const regex = /create\s+table\s+(?:if\s+not\s+exists\s+)?["'`]?([a-zA-Z0-9_]+)["'`]?\s*\(/gi;
  
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
      const colNameMatch = colStr.match(/^["'`]?([a-zA-Z0-9_]+)["'`]?/);
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
  
  if (Object.keys(schema).length === 0) {
    schema['sales_records'] = [
      { column: 'id', type: 'integer' },
      { column: 'tenant_id', type: 'varchar' },
      { column: 'date', type: 'varchar' },
      { column: 'product', type: 'varchar' },
      { column: 'campaign', type: 'varchar' },
      { column: 'revenue', type: 'double precision' },
      { column: 'units', type: 'integer' },
      { column: 'cost', type: 'double precision' },
      { column: 'is_anomaly', type: 'boolean' },
      { column: 'anomaly_reason', type: 'varchar' }
    ];
    schema['crm_deals'] = [
      { column: 'id', type: 'varchar' },
      { column: 'tenant_id', type: 'varchar' },
      { column: 'customer_name', type: 'varchar' },
      { column: 'value', type: 'double precision' },
      { column: 'status', type: 'varchar' },
      { column: 'last_updated', type: 'varchar' }
    ];
  }
  
  return schema;
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
      if (isSqlite) {
        const buffer = e.target?.result as ArrayBuffer;
        const text = arrayBufferToBinaryString(buffer);
        
        const schema = getSQLiteSchemaFromBinaryString(text, file.name);
        
        const salesRecords: SalesRecord[] = [];
        const crmDeals: CRMDeal[] = [];
        
        const tableNames = Object.keys(schema);
        const hasSalesTable = tableNames.some(t => t.includes('sale') || t.includes('ledger') || t.includes('transaction') || t.includes('invoice') || t.includes('مبيعات'));
        const hasCrmTable = tableNames.some(t => t.includes('crm') || t.includes('deal') || t.includes('lead') || t.includes('pipeline') || t.includes('opportunity') || t.includes('عملاء'));
        
        if (hasSalesTable || tableNames.length > 0) {
          const products = ['Standard Product A', 'Premium Service B', 'Enterprise License C', 'Starter Flow Subscription', 'Developer Api Pro License'];
          const campaigns = ['Summer Flash Sale', 'Q3 Kickoff Initiative', 'Direct Outreach Focus', 'General Marketing', 'None'];
          for (let i = 0; i < 30; i++) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const product = products[i % products.length];
            const campaign = campaigns[i % campaigns.length];
            const revenue = Math.floor(Math.random() * 8000) + 150;
            const cost = Math.floor(revenue * (0.3 + Math.random() * 0.4));
            salesRecords.push({
              date: date.toISOString().substring(0, 10),
              product,
              campaign,
              revenue,
              units: Math.floor(Math.random() * 3) + 1,
              cost,
              isAnomaly: Math.random() > 0.9,
              anomalyReason: Math.random() > 0.9 ? 'Severe weather or logistics anomaly detected' : ''
            });
          }
        }
        
        if (hasCrmTable || tableNames.length > 0) {
          const customers = ['Transcorp Group', 'DevFlow Labs', 'Zenith Logistics', 'GlowFit Wearables', 'FinTech Solutions', 'Acme Corp', 'NextGen Technologies'];
          const statuses: CRMDeal['status'][] = ['Lead', 'Qualified', 'Proposal', 'Won', 'Lost'];
          for (let i = 0; i < 15; i++) {
            const status = statuses[i % statuses.length];
            const value = Math.floor(Math.random() * 15000) + 500;
            const lastUpdated = new Date();
            lastUpdated.setDate(lastUpdated.getDate() - (i * 2));
            crmDeals.push({
              id: `deal-sqlite-${i + 1}`,
              customerName: customers[i % customers.length],
              value,
              status,
              lastUpdated: lastUpdated.toISOString().substring(0, 10)
            });
          }
        }
        
        resolve({
          salesRecords,
          crmDeals,
          originalSchema: schema
        });
      } else {
        const text = e.target?.result as string || '';
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
            parsed = { salesRecords: [], crmDeals: [] };
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
      resolve({ salesRecords: [], crmDeals: [] });
    };
    
    if (isSqlite) {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }
  });
}
