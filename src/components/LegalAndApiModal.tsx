import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, ShieldCheck, FileText, Terminal, Copy, Check, ChevronRight, Info, Code, Key } from 'lucide-react';
import { Language } from '../utils/translations';

interface InteractiveCodeConsoleProps {
  isRTL: boolean;
  handleCopy: (text: string) => void;
  copiedText: boolean;
}

function InteractiveCodeConsole({ isRTL, handleCopy, copiedText }: InteractiveCodeConsoleProps) {
  const [activeLang, setActiveLang] = useState<'curl' | 'node' | 'python' | 'go'>('curl');

  const snippets = {
    curl: `curl -X POST "https://api.sniper.ai/api/v1/sales" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "X-Tenant-ID: apex-logistics" \\
  -H "Content-Type: application/json" \\
  -d '{
    "product": "Growth License SKU-100",
    "revenue": 1250.00,
    "cost": 450.00,
    "units": 1,
    "date": "${new Date().toISOString().split('T')[0]}",
    "customer": "Global Corp LLC"
  }'`,
    node: `const salesPayload = {
  product: "Growth License SKU-100",
  revenue: 1250.00,
  cost: 450.00,
  units: 1,
  date: "${new Date().toISOString().split('T')[0]}",
  customer: "Global Corp LLC"
};

fetch('https://api.sniper.ai/api/v1/sales', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'X-Tenant-ID': 'apex-logistics',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(salesPayload)
})
.then(res => {
  if (res.status === 201) return res.json();
  throw new Error(\`Failed with status \${res.status}\`);
})
.then(data => console.log('Successfully pushed sales record:', data))
.catch(err => console.error('Ingestion failed:', err));`,
    python: `import requests
import json

url = "https://api.sniper.ai/api/v1/sales"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "X-Tenant-ID": "apex-logistics",
    "Content-Type": "application/json"
}

payload = {
    "product": "Growth License SKU-100",
    "revenue": 1250.00,
    "cost": 450.00,
    "units": 1,
    "date": "${new Date().toISOString().split('T')[0]}",
    "customer": "Global Corp LLC"
}

response = requests.post(url, headers=headers, data=json.dumps(payload))

if response.status_code == 201:
    print("Record ingested successfully:", response.json())
else:
    print(f"Error {response.status_code}:", response.text)`,
    go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

func main() {
	url := "https://api.sniper.ai/api/v1/sales"
	payload := map[string]interface{}{
		"product":  "Growth License SKU-100",
		"revenue":  1250.00,
		"cost":     450.00,
		"units":    1,
		"date":     "${new Date().toISOString().split('T')[0]}",
		"customer": "Global Corp LLC",
	}

	jsonValue, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(jsonValue))
	req.Header.Set("Authorization", "Bearer YOUR_API_KEY")
	req.Header.Set("X-Tenant-ID", "apex-logistics")
	req.Header.Set("Content-Type", "application/json")

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		fmt.Printf("The HTTP request failed with error %s\\n", err)
	} else {
		defer resp.Body.Close()
		fmt.Println("Ingested Response Status:", resp.Status)
	}
}`
  };

  const langs = [
    { id: 'curl' as const, label: 'cURL' },
    { id: 'node' as const, label: 'Node.js (Fetch)' },
    { id: 'python' as const, label: 'Python (Requests)' },
    { id: 'go' as const, label: 'Go (HTTP)' }
  ];

  return (
    <div className="bg-slate-900/40 border border-slate-900 rounded-2xl overflow-hidden">
      {/* Code language tabs selector */}
      <div className="bg-slate-950/80 px-4 py-2 border-b border-slate-900/60 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-1.5">
          {langs.map((l) => (
            <button
              key={l.id}
              onClick={() => setActiveLang(l.id)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-medium transition-all cursor-pointer ${
                activeLang === l.id
                  ? 'bg-indigo-600 text-white font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => handleCopy(snippets[activeLang])}
          className="p-1.5 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded-lg border border-slate-800/40 transition-colors cursor-pointer flex items-center gap-1.5 text-[10px]"
          title="Copy snippet"
        >
          {copiedText ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400 font-medium font-sans">{isRTL ? 'تم النسخ!' : 'Copied!'}</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span className="font-sans">{isRTL ? 'نسخ الكود' : 'Copy Code'}</span>
            </>
          )}
        </button>
      </div>

      {/* Code Box */}
      <div className="relative">
        <pre className="text-[11px] font-mono p-5 bg-slate-950/80 overflow-x-auto text-indigo-200 leading-relaxed max-h-[320px] select-all">
          {snippets[activeLang]}
        </pre>
      </div>
    </div>
  );
}

interface InteractiveApiSandboxProps {
  isRTL: boolean;
}

function InteractiveApiSandbox({ isRTL }: InteractiveApiSandboxProps) {
  const [apiKey, setApiKey] = useState('sn_live_a89b7c6d5e4f3210');
  const [tenantId, setTenantId] = useState('apex-logistics');
  const [product, setProduct] = useState('Growth License SKU-100');
  const [revenue, setRevenue] = useState('1250.00');
  const [cost, setCost] = useState('450.00');
  const [units, setUnits] = useState('1');
  const [customer, setCustomer] = useState('Global Corp LLC');

  const [isLoading, setIsLoading] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);

  const handleTestIngest = () => {
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      if (!apiKey || !tenantId) {
        setResponseStatus(401);
        setResponseBody(JSON.stringify({
          status: "error",
          error: "Unauthorized",
          message: isRTL 
            ? "مفتاح واجهة التطبيق (API Key) أو معرف مساحة العمل (Tenant ID) غير صالح أو مفقود."
            : "Missing or invalid credentials. Ensure 'Authorization' and 'X-Tenant-ID' headers are supplied correctly."
        }, null, 2));
      } else if (!product || !revenue || !cost || !units) {
        setResponseStatus(400);
        setResponseBody(JSON.stringify({
          status: "error",
          error: "Bad Request",
          message: isRTL
            ? "الطلب غير مكتمل. يرجى إدخال قيم صالحة للمنتج، الإيرادات، التكلفة، والوحدات."
            : "Validation constraint failed. Please supply values for product, revenue, cost, and units."
        }, null, 2));
      } else {
        setResponseStatus(201);
        setResponseBody(JSON.stringify({
          status: "success",
          message: "Sales record ingested successfully into SniperAI engine.",
          record_id: "rec_8ea9b" + Math.random().toString(16).substr(2, 10),
          timestamp: new Date().toISOString(),
          record: {
            product,
            revenue: parseFloat(revenue),
            cost: parseFloat(cost),
            units: parseInt(units),
            customer,
            net_profit: parseFloat(revenue) - parseFloat(cost)
          },
          audit: {
            anomaly_detected: parseFloat(revenue) > 10000,
            forecast_recalculation_scheduled: true,
            pipeline_source: "REST_API"
          }
        }, null, 2));
      }
    }, 850);
  };

  return (
    <div className="bg-slate-900/10 border border-slate-900 rounded-2xl p-4 md:p-5 space-y-4 text-start">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-900 pb-2.5">
        <div>
          <h4 className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-2 font-mono">
            <Code className="w-3.5 h-3.5 animate-pulse text-indigo-400" />
            {isRTL ? 'بيئة المطور التجريبية (API Testing Sandbox)' : 'Interactive API Testing Sandbox'}
          </h4>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {isRTL 
              ? 'اختبر إدخال ومعالجة البيانات برمجياً بمحاكاة طلب حقيقي والحصول على استجابة فورية.' 
              : 'Simulate developer POST calls with real-time JSON requests and response verification.'}
          </p>
        </div>
        <div className="bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-0.5 rounded text-[10px] text-indigo-400 font-mono font-bold">
          SANDBOX INTERACTIVE
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left Form controls */}
        <div className="space-y-3 text-xs">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-mono text-[9px]">API Authorization Key</label>
              <input 
                type="text" 
                value={apiKey} 
                onChange={(e) => setApiKey(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-mono text-[9px]">X-Tenant-ID</label>
              <input 
                type="text" 
                value={tenantId} 
                onChange={(e) => setTenantId(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 font-mono text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-mono text-[9px]">Product SKU / Name</label>
            <input 
              type="text" 
              value={product} 
              onChange={(e) => setProduct(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-400 mb-1 font-mono text-[9px]">Revenue (USD)</label>
              <input 
                type="number" 
                value={revenue} 
                onChange={(e) => setRevenue(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-mono text-[9px]">Cost (USD)</label>
              <input 
                type="number" 
                value={cost} 
                onChange={(e) => setCost(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
              />
            </div>
            <div>
              <label className="block text-slate-400 mb-1 font-mono text-[9px]">Units</label>
              <input 
                type="number" 
                value={units} 
                onChange={(e) => setUnits(e.target.value)} 
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono" 
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-400 mb-1 font-mono text-[9px]">Customer Name</label>
            <input 
              type="text" 
              value={customer} 
              onChange={(e) => setCustomer(e.target.value)} 
              className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-500 text-white rounded-xl px-3 py-2 text-[10px] focus:outline-none focus:ring-1 focus:ring-indigo-500" 
            />
          </div>

          <button
            type="button"
            onClick={handleTestIngest}
            disabled={isLoading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-xl cursor-pointer shadow transition-all flex items-center justify-center gap-2 h-9 disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/35 border-t-white rounded-full animate-spin"></div>
                <span>{isRTL ? 'جاري محاكاة الطلب والتحليل...' : 'Simulating secure transfer...'}</span>
              </>
            ) : (
              <>
                <Terminal className="w-3.5 h-3.5 text-indigo-200" />
                <span>{isRTL ? 'إرسال واختبار محاكاة البيانات' : 'POST to Ingestion Pipeline'}</span>
              </>
            )}
          </button>
        </div>

        {/* Right Console Response Output */}
        <div className="bg-slate-950 rounded-2xl border border-slate-900/60 p-4 font-mono text-[9px] relative overflow-hidden flex flex-col justify-between min-h-[200px]">
          <div className="flex items-center justify-between border-b border-slate-900 pb-2 mb-2.5">
            <span className="text-slate-500 text-[9px]">HTTP/1.1 RESPONSE</span>
            {responseStatus && (
              <span className={`px-2 py-0.5 rounded font-bold text-[8px] ${
                responseStatus === 201 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                  : responseStatus === 401 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-500'
              }`}>
                {responseStatus} {responseStatus === 201 ? 'CREATED' : responseStatus === 401 ? 'UNAUTHORIZED' : 'BAD REQUEST'}
              </span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto max-h-[160px] text-slate-300">
            {responseBody ? (
              <pre className="text-indigo-200 leading-relaxed overflow-x-auto select-all">{responseBody}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-2 py-6">
                <Info className="w-5 h-5 text-slate-700 animate-pulse" />
                <span className="text-center text-[9px] font-sans leading-relaxed">
                  {isRTL 
                    ? 'املأ قيم النموذج برمجياً على اليمين وانقر "إرسال" لمحاكاة بروتوكول HTTPS.' 
                    : 'Fill parameters on the left and dispatch the test payload to verify live response templates.'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface LegalAndApiModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab: 'privacy' | 'terms' | 'apiSpecs';
  language: Language;
}

export default function LegalAndApiModal({ isOpen, onClose, initialTab, language }: LegalAndApiModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms' | 'apiSpecs'>(initialTab);
  const [copiedText, setCopiedText] = useState(false);
  const isRTL = language === 'ar';

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  const tabs = [
    {
      id: 'privacy' as const,
      label: isRTL ? 'ميثاق الخصوصية' : 'Privacy Charter',
      icon: ShieldCheck,
    },
    {
      id: 'terms' as const,
      label: isRTL ? 'شروط الاستخدام' : 'Terms of Use',
      icon: FileText,
    },
    {
      id: 'apiSpecs' as const,
      label: isRTL ? 'مواصفات الـ API' : 'API Specifications',
      icon: Terminal,
    },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="w-full max-w-4xl bg-slate-950 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]"
          >
            {/* Modal Header */}
            <div className="border-b border-slate-900 bg-slate-950 px-6 py-5 flex items-center justify-between">
              <div className={`flex items-center gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-xl">
                  {activeTab === 'privacy' && <ShieldCheck className="w-5 h-5" />}
                  {activeTab === 'terms' && <FileText className="w-5 h-5" />}
                  {activeTab === 'apiSpecs' && <Terminal className="w-5 h-5" />}
                </div>
                <div className={isRTL ? 'text-right' : 'text-left'}>
                  <h2 className="text-lg font-bold text-slate-100 font-display">
                    {isRTL ? 'الوثائق القانونية والتقنية' : 'Legal & Technical Documentation'}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {isRTL ? 'احرص على مراجعة سياسات استخدام المنصة وربط الأنظمة' : 'Review platform policies, usage rules, and system integrations'}
                  </p>
                </div>
              </div>

              <button
                onClick={onClose}
                className={`p-2 text-slate-400 hover:text-slate-100 rounded-xl hover:bg-slate-900 transition-colors cursor-pointer`}
                aria-label="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-slate-950/60 border-b border-slate-900 px-4 py-2 flex flex-wrap gap-1">
              {tabs.map((tab) => {
                const IconComponent = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                      isActive
                        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/25 font-semibold'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Scrollable Document Content Area */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/40 text-slate-300">
              <div className={isRTL ? 'text-right' : 'text-left'} dir={isRTL ? 'rtl' : 'ltr'}>
                
                {/* 1. Privacy Policy Tab */}
                {activeTab === 'privacy' && (
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        {isRTL ? '1. ميثاق حماية البيانات والخصوصية' : '1. Data Privacy & Protection'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL 
                          ? 'نحن في Sniper.ai ندرك تمامًا مدى حساسية بياناتك المالية وسلاسل الإمداد الخاصة بشركتك. تم بناء البنية التحتية لدينا لتعمل وفق أعلى معايير الأمان لضمان عزل البيانات وحفظها بسرية مطلقة.'
                          : 'At Sniper.ai, we are fully committed to protecting your financial and supply chain data. Our infrastructure is architected to guarantee absolute and cryptographically safe separation of organization data.'}
                      </p>
                    </section>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-6">
                      <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                          {isRTL ? 'تشفير البيانات التام' : 'End-to-End Encryption'}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">
                          {isRTL 
                            ? 'يتم تشفير كافة البيانات المالية والتدفقات النقدية عند نقلها (TLS 1.3) وأثناء خمولها في قواعد بيانات Firestore/Cloud SQL المشفرة.'
                            : 'All financial logs and workflows are encrypted in-transit (TLS 1.3) and at-rest within enterprise Cloud SQL / Firestore databases.'}
                        </p>
                      </div>

                      <div className="bg-slate-900/40 border border-slate-900 p-4 rounded-2xl">
                        <h4 className="text-sm font-semibold text-white mb-2 flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                          {isRTL ? 'الالتزام التام بعدم المشاركة' : 'No Data Sharing Policy'}
                        </h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-light">
                          {isRTL 
                            ? 'لا يتم استخدام بيانات المعاملات المالية لتدريب نماذج ذكاء اصطناعي عامة أو مشاركتها بأي شكل من الأشكال مع مستخدمين آخرين.'
                            : 'Your transaction records and operational logs are never utilized to train generic public models or shared with third parties.'}
                        </p>
                      </div>
                    </div>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        {isRTL ? '2. البيانات التي يتم جمعها' : '2. Data Collection and Usage'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL
                          ? 'يقوم النظام بجمع وتحليل مؤشرات المبيعات، المنتجات، الصفقات، وحركة المخزون بشكل حصري بهدف توليد التحليلات الاستباقية والتقارير الاستراتيجية للشركة.'
                          : 'Our systems selectively analyze and compile sales performance, catalog trends, CRM deals, and warehouse inventory solely to deliver automated forecasting and strategic visual reports.'}
                      </p>
                      <ul className={`list-disc list-inside text-xs text-slate-400 space-y-1.5 ${isRTL ? 'pr-2' : 'pl-2'}`}>
                        <li>{isRTL ? 'بيانات ملف التعريف الشخصي (الاسم، البريد الإلكتروني، والصورة الرمزية).' : 'Personal user profile information (Name, Email, Avatar identifier).'}</li>
                        <li>{isRTL ? 'سجلات الربط البرمجي والأنظمة المدمجة (مثل PostgreSQL، MongoDB، Shopify، Odoo).' : 'Integrated systems credentials and mapping schemas.'}</li>
                        <li>{isRTL ? 'سجلات تدقيق العمليات (Audit Logs) التي يقوم بها موظفو المنشأة لأغراض الأمان والامتثال.' : 'Security Audit Logs generated by organization agents.'}</li>
                      </ul>
                    </section>

                    <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-900 flex gap-3">
                      <Info className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs font-semibold text-slate-200 uppercase tracking-wider mb-1">
                          {isRTL ? 'امتثال اللائحة العامة لحماية البيانات (GDPR)' : 'GDPR & Local Compliance'}
                        </h4>
                        <p className="text-xs text-slate-400 font-light leading-relaxed">
                          {isRTL
                            ? 'نلتزم بكافة اللوائح والمواصفات السعودية والدولية لحماية البيانات وحفظ سرية السجلات المالية والتجارية.'
                            : 'We strictly comply with domestic and global regulations regarding customer records protection, secure authentication, and fiscal reporting confidentiality.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. Terms of Use Tab */}
                {activeTab === 'terms' && (
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        {isRTL ? '1. شروط استخدام المنصة والخدمات' : '1. Agreement Terms & SaaS Conditions'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL 
                          ? 'باستخدامك لمنصة Sniper.ai، فإنك تقر وتوافق على الالتزام الكامل بهذه الشروط والأحكام. إذا كنت تمثل منشأة تجارية، فإنك تؤكد صلاحيتك القانونية لإلزام المنشأة بهذه الاتفاقية.'
                          : 'By accessing or utilizing Sniper.ai, you explicitly agree to conform with all platform Terms of Use. If executing on behalf of an enterprise entity, you warrant that you hold legitimate power to bind that entity.'}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        {isRTL ? '2. حماية وحصانة المنظومة والبيانات' : '2. System Integrity & Fair Use'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL
                          ? 'يُمنع منعاً باتاً محاولة تجاوز طبقات حماية البيانات أو تنفيذ طلبات برمجية للوصول غير المصرح به لبيانات مستخدمين أو جهات أخرى. أي محاولة من هذا القبيل تؤدي لإغلاق الحساب فوراً واتخاذ الإجراءات القانونية.'
                          : 'Any active or passive effort to breach, test, or bypass system security parameters or send unauthorized network payloads is strictly prohibited and results in immediate service termination.'}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        {isRTL ? '3. إخلاء المسؤولية الاستباقية' : '3. Predictive Tool Disclaimer'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL
                          ? 'كافة التحليلات والتقارير الاستباقية والنماذج التنبؤية المعروضة بالمنصة هي تنبؤات قائمة على خوارزميات رياضية وإحصائية واستدلالية. المنصة لا تتحمل المسؤولية القانونية أو المالية عن أي قرارات استثمارية أو تجارية تُتخذ بناءً على هذه البيانات.'
                          : 'All strategic forecast outputs and automatic cash flow models rendered inside the visual suite are generated via statistical heuristics. They are advisory in scope. We bear no liability for operational choices based on these predictions.'}
                      </p>
                    </section>

                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        {isRTL ? '4. التحديثات والاشتراكات' : '4. Subscription Policies'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL
                          ? 'نحتفظ بالحق في تعديل الأسعار، الباقات الاستهلاكية، ومواصفات الدعم والميزات المتاحة. سيتم إشعار العملاء بحد أدنى 30 يوماً قبل تطبيق أي تغييرات مالية جوهرية.'
                          : 'We reserve full rights to adjust subscription tiers, pipeline storage allocations, and pricing structures upon providing active business users with a minimum 30-day notice.'}
                      </p>
                    </section>
                  </div>
                )}

                {/* 3. API Specifications Tab */}
                {activeTab === 'apiSpecs' && (
                  <div className="space-y-6">
                    <section className="space-y-3">
                      <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2 border-b border-slate-900 pb-2">
                        <Code className="w-5 h-5 text-indigo-400" />
                        {isRTL ? 'واجهة برمجة تطبيقات دمج البيانات (REST API)' : 'Data Integration REST API'}
                      </h3>
                      <p className="text-sm text-slate-300 leading-relaxed font-light">
                        {isRTL 
                           ? 'تتيح واجهة برمجة التطبيقات (API) للمطورين ربط الأنظمة الخارجية وبرامج المحاسبة (مثل Odoo و Shopify وقنوات المبيعات) لرفع بيانات المعاملات والمبيعات مباشرة وتلقائياً إلى Sniper.ai.'
                           : 'Our REST API enables software engineers to bind external billing engines, customized ERP systems, and warehouse records (such as Odoo, Shopify, or Custom CRM channels) to programmatically push transaction logs in real time.'}
                      </p>
                    </section>

                    {/* API Connection parameters */}
                    <div className="bg-slate-900/60 rounded-2xl border border-slate-900 p-5 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                        <span className="text-xs uppercase font-bold text-indigo-400 tracking-wider flex items-center gap-2 font-mono">
                          <Key className="w-3.5 h-3.5" />
                          {isRTL ? 'معلومات الاتصال والمصادقة' : 'Authentication & Endpoints'}
                        </span>
                        <div className="bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-0.5 rounded text-[10px] text-emerald-400 font-mono font-bold">
                          SECURE HTTPS REQUIRED
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                        <div>
                          <span className="text-slate-500 block mb-1 font-sans font-medium">{isRTL ? 'رابط خادم واجهة التطبيقات' : 'Base API Endpoint'}</span>
                          <code className="text-indigo-300 font-mono select-all bg-slate-950 p-2.5 rounded-xl block border border-slate-900">
                            https://api.sniper.ai/api/v1
                          </code>
                        </div>
                        <div>
                          <span className="text-slate-500 block mb-1 font-sans font-medium">{isRTL ? 'ترويسة العميل والمصادقة' : 'Required Authorization Headers'}</span>
                          <div className="space-y-1.5 font-mono">
                            <code className="text-indigo-300 select-all bg-slate-950 p-2.5 rounded-xl block border border-slate-900">
                              Authorization: Bearer [your_api_key]
                            </code>
                            <code className="text-indigo-300 select-all bg-slate-950 p-2.5 rounded-xl block border border-slate-900">
                              X-Tenant-ID: [your_tenant_id]
                            </code>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Request Schema and Payload Specs */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-200">
                        {isRTL ? 'مواصفات هيكل البيانات المرسلة (JSON Payload Schema)' : 'Request Body Schema (JSON Payload)'}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">
                        {isRTL
                          ? 'يجب إرسال الطلبات بصيغة JSON مع الترويسة "Content-Type: application/json" للرابط POST /sales.'
                          : 'All POST requests targeting the /sales endpoint must include a JSON payload with header "Content-Type: application/json".'}
                      </p>

                      <div className="overflow-x-auto rounded-2xl border border-slate-900">
                        <table className="w-full text-left text-xs" dir={isRTL ? 'rtl' : 'ltr'}>
                          <thead>
                            <tr className="bg-slate-900/50 text-slate-400 font-mono text-[10px] uppercase tracking-wider border-b border-slate-900">
                              <th className="py-2.5 px-4 font-semibold text-start">{isRTL ? 'الحقل' : 'Field'}</th>
                              <th className="py-2.5 px-4 font-semibold text-start">{isRTL ? 'النوع' : 'Type'}</th>
                              <th className="py-2.5 px-4 font-semibold text-start">{isRTL ? 'الحالة' : 'Status'}</th>
                              <th className="py-2.5 px-4 font-semibold text-start">{isRTL ? 'الوصف' : 'Description'}</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-900/50 text-slate-300">
                            <tr>
                              <td className="py-3 px-4 font-mono font-medium text-indigo-400">product</td>
                              <td className="py-3 px-4 font-mono text-slate-400">string</td>
                              <td className="py-3 px-4 text-emerald-400 font-bold">{isRTL ? 'مطلوب' : 'Required'}</td>
                              <td className="py-3 px-4 text-slate-400 font-light">
                                {isRTL ? 'اسم المنتج أو الخدمة المباعة (مثل: "باقة الاشتراك الشهري")' : 'Name of the sold item, license, or service SKU.'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-4 font-mono font-medium text-indigo-400">revenue</td>
                              <td className="py-3 px-4 font-mono text-slate-400">number</td>
                              <td className="py-3 px-4 text-emerald-400 font-bold">{isRTL ? 'مطلوب' : 'Required'}</td>
                              <td className="py-3 px-4 text-slate-400 font-light">
                                {isRTL ? 'إجمالي قيمة الإيراد من الصفقة بالدولار (القيمة الإيجابية)' : 'Gross revenue generated from this transaction in USD.'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-4 font-mono font-medium text-indigo-400">cost</td>
                              <td className="py-3 px-4 font-mono text-slate-400">number</td>
                              <td className="py-3 px-4 text-emerald-400 font-bold">{isRTL ? 'مطلوب' : 'Required'}</td>
                              <td className="py-3 px-4 text-slate-400 font-light">
                                {isRTL ? 'تكلفة البضاعة المباعة أو التكلفة المباشرة لتشغيل الخدمة' : 'Cost of Goods Sold (COGS) to calculate real net profit margin.'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-4 font-mono font-medium text-indigo-400">units</td>
                              <td className="py-3 px-4 font-mono text-slate-400">integer</td>
                              <td className="py-3 px-4 text-emerald-400 font-bold">{isRTL ? 'مطلوب' : 'Required'}</td>
                              <td className="py-3 px-4 text-slate-400 font-light">
                                {isRTL ? 'عدد الوحدات المباعة في هذه العملية (يجب أن يكون أكبر من 0)' : 'Quantity of units sold. Must be an integer greater than zero.'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-4 font-mono font-medium text-indigo-400">date</td>
                              <td className="py-3 px-4 font-mono text-slate-400">string</td>
                              <td className="py-3 px-4 text-emerald-400 font-bold">{isRTL ? 'مطلوب' : 'Required'}</td>
                              <td className="py-3 px-4 text-slate-400 font-light">
                                {isRTL ? 'تاريخ العملية بصيغة ISO-8601 (مثل: YYYY-MM-DD)' : 'Date of transaction formatted as ISO-8601 string (e.g. 2026-07-20).'}
                              </td>
                            </tr>
                            <tr>
                              <td className="py-3 px-4 font-mono font-medium text-indigo-400">customer</td>
                              <td className="py-3 px-4 font-mono text-slate-400">string</td>
                              <td className="py-3 px-4 text-slate-500 font-light">{isRTL ? 'اختياري' : 'Optional'}</td>
                              <td className="py-3 px-4 text-slate-400 font-light">
                                {isRTL ? 'اسم أو معرف العميل لربطه بنظام العلاقات الذكي لـ CRM' : 'Associated customer name or CRM identifier for buyer profiles.'}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Push Sales Data Interactive Snippets Console */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold text-slate-200">
                        {isRTL ? 'أمثلة ومكتبات الربط البرمجي (Developer SDK Snippets)' : 'Developer Integration Code Snippets'}
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-light">
                        {isRTL
                          ? 'اختر اللغة المناسبة لتطبيقك لنسخ نموذج الكود الجاهز ودفع بيانات المبيعات برمجياً.'
                          : 'Select your preferred stack to view copyable templates illustrating how to programmatically post transactions.'}
                      </p>

                      <InteractiveCodeConsole isRTL={isRTL} handleCopy={handleCopy} copiedText={copiedText} />
                    </div>

                    {/* Push Sales Data Sandbox Playground */}
                    <div className="space-y-3">
                      <InteractiveApiSandbox isRTL={isRTL} />
                    </div>

                    {/* Response Specifications */}
                    <div className="space-y-4 pt-2">
                      <h4 className="text-sm font-semibold text-slate-200">
                        {isRTL ? 'رموز الاستجابة وأكواد الأخطاء' : 'API Response & Error Codes'}
                      </h4>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                        <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-1.5">
                          <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-mono text-[10px] font-bold rounded">
                            201 CREATED
                          </span>
                          <h5 className="font-semibold text-slate-200 mt-1">{isRTL ? 'تم الإدراج بنجاح' : 'Successful Sync'}</h5>
                          <p className="text-slate-400 font-light leading-relaxed">
                            {isRTL 
                              ? 'تم حفظ المعاملة بنجاح، وتدقيق العمليات الشاذة وجدولتها للتنبؤ فورا.'
                              : 'The transaction was ingested, auto-audited, and scheduled for the next ML forecast cycle.'}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-1.5">
                          <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 font-mono text-[10px] font-bold rounded">
                            400 BAD REQUEST
                          </span>
                          <h5 className="font-semibold text-slate-200 mt-1">{isRTL ? 'خطأ في معالجة المدخلات' : 'Validation Error'}</h5>
                          <p className="text-slate-400 font-light leading-relaxed">
                            {isRTL 
                              ? 'القيم المدخلة ناقصة أو تخالف هيكل البيانات المطلوب (مثل قيم سالبة أو صيغة تاريخ غير صحيحة).'
                              : 'Missing required parameters, invalid date structure, negative units, or malformed JSON payloads.'}
                          </p>
                        </div>

                        <div className="p-4 bg-slate-900/30 border border-slate-900 rounded-2xl space-y-1.5">
                          <span className="px-2 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 font-mono text-[10px] font-bold rounded">
                            401 UNAUTHORIZED
                          </span>
                          <h5 className="font-semibold text-slate-200 mt-1">{isRTL ? 'مشكلة في المصادقة' : 'Unauthorized'}</h5>
                          <p className="text-slate-400 font-light leading-relaxed">
                            {isRTL 
                              ? 'مفتاح الـ API مفقود، منتهي الصلاحية، أو معرف المؤسسة غير متوافق.'
                              : 'The authorization bearer token is missing, expired, or organizational matching constraints failed.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Modal Footer */}
            <div className="border-t border-slate-900 bg-slate-950/80 px-6 py-4 flex items-center justify-between">
              <span className="text-[10px] text-slate-500 tracking-wider uppercase font-mono font-bold">
                {activeTab === 'apiSpecs' 
                  ? (isRTL ? 'مواصفات واجهة برمجة التطبيقات' : 'API Specifications')
                  : (isRTL ? 'ميثاق الحماية والخصوصية' : 'Sniper AI Legal Charter')}
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl transition-colors cursor-pointer shadow-lg shadow-indigo-900/10"
              >
                {isRTL ? 'إغلاق النافذة' : 'Close Document'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
