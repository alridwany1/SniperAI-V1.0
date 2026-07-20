import { useState, useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { useToast } from '../components/Toast';
import { MetricSummary, ForecastRecord, CRMDeal, SyncHistoryEntry } from '../types';

export const useDashboardData = () => {
  const { selectedTenantId, activeTenant, language } = useApp();
  const { showToast } = useToast();

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
  const [forecastData, setForecastData] = useState<ForecastRecord[]>([]);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [forecastAnalysis, setForecastAnalysis] = useState('');
  
  const [crmDeals, setCrmDeals] = useState<CRMDeal[]>([]);
  const [crmLoading, setCrmLoading] = useState(false);
  
  const [syncHistory, setSyncHistory] = useState<SyncHistoryEntry[]>([]);
  const [syncHistoryLoading, setSyncHistoryLoading] = useState(false);

  const [dynamicCampaigns, setDynamicCampaigns] = useState<string[]>([]);
  const [dynamicProducts, setDynamicProducts] = useState<string[]>([]);
  const [dynamicMinDate, setDynamicMinDate] = useState<string>('2026-01-01');
  const [dynamicMaxDate, setDynamicMaxDate] = useState<string>('2026-07-03');
  
  const [dbStatus, setDbStatus] = useState<{
    salesConnection: 'connected' | 'error' | 'syncing';
    crmConnection: 'connected' | 'error' | 'syncing';
    lastSync: string;
    message: string;
  }>({
    salesConnection: 'connected',
    crmConnection: 'connected',
    lastSync: 'Just now',
    message: 'System nominal'
  });

  const fetchMetrics = useCallback((campaign: string = 'All', product: string = 'All', start: string = '', end: string = '') => {
    return fetch('/api/dashboard/metrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tenantId: selectedTenantId,
        campaign,
        product,
        startDate: start,
        endDate: end
      })
    })
      .then(res => res.json())
      .then(data => {
        if (data.summary) setSummary(data.summary);
        if (data.chartData) setChartData(data.chartData);
        if (data.filters) {
          if (data.filters.campaigns) setDynamicCampaigns(data.filters.campaigns);
          if (data.filters.products) setDynamicProducts(data.filters.products);
          if (data.filters.minDate) setDynamicMinDate(data.filters.minDate);
          if (data.filters.maxDate) setDynamicMaxDate(data.filters.maxDate);
        }
        if (data.dbStatus) setDbStatus(data.dbStatus);
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading metrics', 'error');
      });
  }, [selectedTenantId, showToast]);

  const fetchCRMDeals = useCallback(() => {
    setCrmLoading(true);
    return fetch('/api/crm/deals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tenantId: selectedTenantId })
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.deals) {
          setCrmDeals(data.deals);
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading CRM deals', 'error');
      })
      .finally(() => setCrmLoading(false));
  }, [selectedTenantId, showToast]);

  const fetchSyncHistory = useCallback(() => {
    setSyncHistoryLoading(true);
    return fetch(`/api/sync/history?tenantId=${selectedTenantId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.history) {
          setSyncHistory(data.history);
        }
      })
      .catch(err => {
        console.error(err);
        showToast('Error loading CRM sync history', 'error');
      })
      .finally(() => setSyncHistoryLoading(false));
  }, [selectedTenantId, showToast]);

  return {
    summary, setSummary,
    chartData, setChartData,
    forecastData, setForecastData,
    forecastLoading, setForecastLoading,
    forecastAnalysis, setForecastAnalysis,
    crmDeals, setCrmDeals,
    crmLoading, setCrmLoading,
    syncHistory, setSyncHistory,
    syncHistoryLoading, setSyncHistoryLoading,
    dynamicCampaigns, dynamicProducts, dynamicMinDate, dynamicMaxDate,
    dbStatus, setDbStatus,
    fetchMetrics, fetchCRMDeals, fetchSyncHistory
  };
};
