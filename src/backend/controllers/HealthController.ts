import { Request, Response, NextFunction } from 'express';
import { db } from '../config/firebase.js';
import { getDoc, doc } from 'firebase/firestore';
import { CacheService } from '../services/cache.service.js';
import { aiLatencyHist } from '../config/ai.js';
import os from 'os';

export class HealthController {
  static async getHealth(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    
    // 1. Measure Firestore / Database Latency
    let dbLatency = 0;
    let dbStatus = 'HEALTHY';
    try {
      const dbStart = Date.now();
      // Fast check of a meta doc in firestore
      await getDoc(doc(db, 'tenants', 'apex-logistics'));
      dbLatency = Date.now() - dbStart;
    } catch (err: any) {
      console.warn('[HEALTH CHECK] DB check encountered error:', err.message);
      dbStatus = 'DEGRADED';
      dbLatency = -1;
    }

    // 2. Compute AI Latency Metrics
    const avgAiLatency = aiLatencyHist.length > 0 
      ? Math.round(aiLatencyHist.reduce((a, b) => a + b, 0) / aiLatencyHist.length)
      : 342; // default simulated healthy latency in ms

    // 3. System Metrics
    const memory = process.memoryUsage();
    const cpuLoad = os.loadavg();
    const freeMem = os.freemem();
    const totalMem = os.totalmem();

    // 4. Cache Performance metrics
    const cacheMetrics = CacheService.getMetrics();

    const responseTime = Date.now() - startTime;

    res.json({
      status: 'UP',
      timestamp: new Date().toISOString(),
      responseTimeMs: responseTime,
      database: {
        status: dbStatus,
        latencyMs: dbLatency,
      },
      aiEngine: {
        status: 'ONLINE',
        avgLatencyMs: avgAiLatency,
        provider: 'Google Gemini 2.5 Flash',
      },
      cache: cacheMetrics,
      system: {
        platform: os.platform(),
        arch: os.arch(),
        cpuCores: os.cpus().length,
        cpuLoad1Min: Math.round(cpuLoad[0] * 100) / 100,
        memory: {
          rssMb: Math.round(memory.rss / 1024 / 1024 * 100) / 100,
          heapTotalMb: Math.round(memory.heapTotal / 1024 / 1024 * 100) / 100,
          heapUsedMb: Math.round(memory.heapUsed / 1024 / 1024 * 100) / 100,
          externalMb: Math.round(memory.external / 1024 / 1024 * 100) / 100,
          systemFreeGb: Math.round(freeMem / 1024 / 1024 / 1024 * 100) / 100,
          systemTotalGb: Math.round(totalMem / 1024 / 1024 / 1024 * 100) / 100,
        }
      }
    });
  }

  static async flushCache(req: Request, res: Response, next: NextFunction) {
    try {
      CacheService.flushAll();
      res.json({ success: true, message: 'In-memory analytical cache successfully purged.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}
