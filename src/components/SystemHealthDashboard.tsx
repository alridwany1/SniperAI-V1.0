import React, { useState, useEffect } from 'react';
import { safeFetchJson } from '../utils/apiUtils';
import { 
  Cpu, 
  Database, 
  Sparkles, 
  RefreshCw, 
  Layers, 
  ShieldCheck, 
  Clock, 
  CheckCircle2, 
  AlertTriangle, 
  Trash2, 
  Activity,
  Gauge
} from 'lucide-react';

interface HealthData {
  status: string;
  timestamp: string;
  responseTimeMs: number;
  database: {
    status: string;
    latencyMs: number;
  };
  aiEngine: {
    status: string;
    avgLatencyMs: number;
    provider: string;
  };
  cache: {
    size: number;
    hits: number;
    misses: number;
    writeCount: number;
    hitRatePercent: number;
  };
  system: {
    platform: string;
    arch: string;
    cpuCores: number;
    cpuLoad1Min: number;
    memory: {
      rssMb: number;
      heapTotalMb: number;
      heapUsedMb: number;
      externalMb: number;
      systemFreeGb: number;
      systemTotalGb: number;
    };
  };
}

interface SystemHealthDashboardProps {
  language: 'en' | 'ar';
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({ language }) => {
  const [health, setHealth] = useState<HealthData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isFlushing, setIsFlushing] = useState<boolean>(false);
  const [flushMessage, setFlushMessage] = useState<string | null>(null);

  const fetchHealthData = async () => {
    try {
      const data = await safeFetchJson('/api/v1/health');
      setHealth(data);
      setError(null);
    } catch (err: any) {
      console.error('Error loading health diagnostics:', err);
      setError(language === 'ar' ? 'فشل تحميل بيانات تشخيص النظام' : 'Failed to retrieve system diagnostic data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealthData();
    const interval = setInterval(fetchHealthData, 5000);
    return () => clearInterval(interval);
  }, [language]);

  const handleFlushCache = async () => {
    setIsFlushing(true);
    setFlushMessage(null);
    try {
      const data = await safeFetchJson('/api/v1/health/flush', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      if (data.success) {
        setFlushMessage(language === 'ar' ? 'تم تفريغ الذاكرة المؤقتة بنجاح!' : 'Cache flushed successfully!');
        fetchHealthData();
      } else {
        setFlushMessage(data.error || (language === 'ar' ? 'فشل تفريغ الذاكرة المؤقتة' : 'Failed to flush cache'));
      }
    } catch (err: any) {
      setFlushMessage(language === 'ar' ? 'حدث خطأ في الاتصال' : 'Connection error occurred');
    } finally {
      setIsFlushing(false);
      setTimeout(() => setFlushMessage(null), 3000);
    }
  };

  const isAr = language === 'ar';

  if (loading && !health) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-950/20 backdrop-blur-md rounded-3xl border border-slate-900/60">
        <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin mb-4" />
        <p className="text-slate-400 text-xs">
          {isAr ? 'جاري قياس استجابة النظام وتجميع الإحصائيات...' : 'Measuring system responses and aggregating metrics...'}
        </p>
      </div>
    );
  }

  if (error && !health) {
    return (
      <div className="p-8 text-center bg-red-950/10 border border-red-900/30 rounded-3xl">
        <AlertTriangle className="w-10 h-10 text-red-500 mx-auto mb-3" />
        <p className="text-red-400 font-medium mb-4 text-sm">{error}</p>
        <button 
          onClick={fetchHealthData}
          className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition-colors cursor-pointer"
        >
          {isAr ? 'إعادة المحاولة' : 'Retry Connection'}
        </button>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isAr ? 'text-right' : 'text-left'}`} dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header and Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950/40 backdrop-blur-md p-6 rounded-3xl border border-slate-900/80">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-2xl text-indigo-400">
            <Activity className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold font-display text-white">
              {isAr ? 'حالة النظام ومراقبة الأداء' : 'System Health & Performance'}
            </h2>
            <p className="text-xs text-slate-400">
              {isAr ? 'مراقبة فورية للذاكرة، الذكاء الاصطناعي، وقاعدة البيانات مع إدارة الذاكرة المؤقتة.' : 'Real-time monitoring of memory, AI engine latency, DB performance, and cache layers.'}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
          <button
            onClick={fetchHealthData}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 transition-all cursor-pointer h-10"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>{isAr ? 'تحديث الآن' : 'Refresh Now'}</span>
          </button>

          <button
            onClick={handleFlushCache}
            disabled={isFlushing}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-950/20 hover:bg-red-950/40 border border-red-900/30 text-xs font-bold text-red-400 hover:text-red-300 transition-all cursor-pointer h-10"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isFlushing ? (isAr ? 'جاري التفريغ...' : 'Flushing...') : (isAr ? 'تفريغ الذاكرة المؤقتة' : 'Flush In-Memory Cache')}</span>
          </button>
        </div>
      </div>

      {flushMessage && (
        <div className="p-4 bg-indigo-950/20 border border-indigo-500/30 rounded-2xl text-xs font-medium text-indigo-400 text-center animate-fade-in">
          {flushMessage}
        </div>
      )}

      {/* Main Stats Grid */}
      {health && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: API Response Time */}
          <div className="bg-slate-950/30 backdrop-blur-md p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'سرعة استجابة الخادم' : 'API Response Time'}
              </span>
              <div className="p-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-indigo-400 group-hover:scale-110 transition-transform">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-indigo-400">{health.responseTimeMs}</span>
              <span className="text-xs text-slate-500">ms</span>
            </div>
            <p className="text-[10px] text-emerald-400 mt-2 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{isAr ? 'استجابة فائقة السرعة' : 'Optimal load times'}</span>
            </p>
          </div>

          {/* Card 2: Database Status */}
          <div className="bg-slate-950/30 backdrop-blur-md p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'حالة قاعدة البيانات' : 'Database Status'}
              </span>
              <div className={`p-2 rounded-lg group-hover:scale-110 transition-transform ${
                health.database.status === 'HEALTHY' 
                  ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
                  : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
              }`}>
                <Database className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className={`text-xl font-bold font-display ${
                health.database.status === 'HEALTHY' ? 'text-emerald-400' : 'text-amber-400'
              }`}>
                {health.database.status === 'HEALTHY' ? (isAr ? 'سليم' : 'HEALTHY') : (isAr ? 'ضعيف' : 'DEGRADED')}
              </span>
              <span className="text-[10px] text-slate-500 font-mono ml-2">
                ({health.database.latencyMs}ms)
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {isAr ? 'زمن الاستجابة للاستعلامات المباشرة' : 'Direct Firebase query response delay'}
            </p>
          </div>

          {/* Card 3: AI Latency */}
          <div className="bg-slate-950/30 backdrop-blur-md p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'معدل استجابة الذكاء الاصطناعي' : 'AI Response Rate'}
              </span>
              <div className="p-2 bg-violet-500/10 border border-violet-500/20 rounded-lg text-violet-400 group-hover:scale-110 transition-transform">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-violet-400">{health.aiEngine.avgLatencyMs}</span>
              <span className="text-xs text-slate-500">ms</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {isAr ? 'مزود الخدمة: Gemini 2.5 Flash' : 'Provider: Gemini 2.5 Flash API'}
            </p>
          </div>

          {/* Card 4: Cache Hit Rate */}
          <div className="bg-slate-950/30 backdrop-blur-md p-5 rounded-2xl border border-slate-900/80 hover:border-slate-800 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {isAr ? 'معدل نجاح الذاكرة المؤقتة' : 'Cache Hit Rate'}
              </span>
              <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-400 group-hover:scale-110 transition-transform">
                <Gauge className="w-4 h-4" />
              </div>
            </div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-amber-400">{health.cache.hitRatePercent}%</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-2">
              {isAr ? `المفاتيح النشطة: ${health.cache.size}` : `Active stored keys: ${health.cache.size}`}
            </p>
          </div>

        </div>
      )}

      {/* Advanced performance layouts */}
      {health && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: In-Memory Cache Stats */}
          <div className="lg:col-span-1 bg-slate-950/30 backdrop-blur-md p-6 rounded-3xl border border-slate-900/80 space-y-6">
            <h3 className="text-xs font-bold text-slate-200 font-display flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              <span>{isAr ? 'إحصائيات الذاكرة المؤقتة' : 'In-Memory Cache Metrics'}</span>
            </h3>

            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-400">{isAr ? 'معدل نجاح القراءة (Hit Rate)' : 'Cache Hit Ratio'}</span>
                <span className="text-xs font-bold text-indigo-400 font-mono">{health.cache.hitRatePercent}%</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-400">{isAr ? 'نجاح القراءة (Hits)' : 'Total Cache Hits'}</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{health.cache.hits}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-400">{isAr ? 'فشل القراءة (Misses)' : 'Total Cache Misses'}</span>
                <span className="text-xs font-bold text-slate-400 font-mono">{health.cache.misses}</span>
              </div>
              <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                <span className="text-xs text-slate-400">{isAr ? 'عمليات الكتابة (Writes)' : 'Total Cache Writes'}</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{health.cache.writeCount}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{isAr ? 'المفاتيح النشطة بالذاكرة' : 'Keys in memory'}</span>
                <span className="text-xs font-bold text-slate-200 font-mono">{health.cache.size}</span>
              </div>
            </div>

            {/* Micro-bar chart to visualize hits vs misses */}
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-900/60 space-y-2">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                {isAr ? 'توزيع نسبة الاستخدام' : 'Ratio Distribution'}
              </span>
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${health.cache.hitRatePercent}%` }} 
                  className="bg-indigo-500 h-full transition-all duration-500"
                  title="Hits"
                ></div>
                <div 
                  style={{ width: `${100 - health.cache.hitRatePercent}%` }} 
                  className="bg-slate-800 h-full transition-all duration-500"
                  title="Misses"
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-slate-500">
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                  <span>{isAr ? 'نجاح القراءة' : 'Hits'} ({health.cache.hits})</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-slate-800 rounded-full"></span>
                  <span>{isAr ? 'فشل القراءة' : 'Misses'} ({health.cache.misses})</span>
                </span>
              </div>
            </div>
          </div>

          {/* Column 2 & 3: Node Memory & Resource Profiler */}
          <div className="lg:col-span-2 bg-slate-950/30 backdrop-blur-md p-6 rounded-3xl border border-slate-900/80 space-y-6">
            <h3 className="text-xs font-bold text-slate-200 font-display flex items-center gap-2">
              <Cpu className="w-4 h-4 text-violet-400" />
              <span>{isAr ? 'محلل موارد الخادم ونظام التشغيل' : 'Server Resource & Host Profiler'}</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* RAM Usage breakdown */}
              <div className="space-y-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  {isAr ? 'استهلاك الذاكرة العشوائية (Node.js)' : 'Node.js Memory Footprint'}
                </span>

                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                      <span>{isAr ? 'الذاكرة المحجوزة الكلية (Heap Total)' : 'Heap Total'}</span>
                      <span className="font-mono text-slate-200">{health.system.memory.heapTotalMb} MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, (health.system.memory.heapTotalMb / 512) * 100)}%` }} 
                        className="bg-indigo-500 h-full"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                      <span>{isAr ? 'الذاكرة المستخدمة الفعلية (Heap Used)' : 'Heap Used'}</span>
                      <span className="font-mono text-slate-200">{health.system.memory.heapUsedMb} MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, (health.system.memory.heapUsedMb / health.system.memory.heapTotalMb) * 100)}%` }} 
                        className="bg-violet-500 h-full"
                      ></div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs mb-1 text-slate-400">
                      <span>{isAr ? 'حجم الذاكرة الخارجية (External)' : 'External Buffers'}</span>
                      <span className="font-mono text-slate-200">{health.system.memory.externalMb} MB</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden">
                      <div 
                        style={{ width: `${Math.min(100, (health.system.memory.externalMb / 128) * 100)}%` }} 
                        className="bg-amber-500 h-full"
                      ></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Host and CPU info */}
              <div className="space-y-4">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block font-bold">
                  {isAr ? 'مواصفات الخادم المستضيف' : 'Host Environment & Platform'}
                </span>

                <div className="space-y-3">
                  <div className="flex justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400">{isAr ? 'نظام التشغيل / البيئة' : 'Operating System'}</span>
                    <span className="text-slate-200 font-semibold font-mono capitalize">{health.system.platform} ({health.system.arch})</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400">{isAr ? 'عدد النوى (CPU Cores)' : 'CPU Cores'}</span>
                    <span className="text-slate-200 font-semibold font-mono">{health.system.cpuCores} Cores</span>
                  </div>
                  <div className="flex justify-between text-xs border-b border-slate-900 pb-1.5">
                    <span className="text-slate-400">{isAr ? 'متوسط حمل المعالج (1 دقيقة)' : 'CPU Load (1 Min)'}</span>
                    <span className="text-slate-200 font-semibold font-mono">{health.system.cpuLoad1Min}%</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">{isAr ? 'الذاكرة الحرة الكلية للنظام' : 'System Free Memory'}</span>
                    <span className="text-slate-200 font-semibold font-mono">{health.system.memory.systemFreeGb} GB / {health.system.memory.systemTotalGb} GB</span>
                  </div>
                </div>

                <div className="p-3 bg-indigo-500/5 border border-indigo-500/10 rounded-2xl flex items-center gap-2 text-indigo-400 text-[11px] font-medium justify-center">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>{isAr ? 'حالة النظام مؤمنة ومستقرة' : 'Server is secure and fully operational'}</span>
                </div>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
};
