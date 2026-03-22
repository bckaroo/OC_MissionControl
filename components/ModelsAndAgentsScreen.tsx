'use client';

import React, { useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  BarChart3,
  CheckCircle,
  Clock,
  Database,
  Zap,
  Cpu,
  AlertTriangle,
} from 'lucide-react';
import { MODEL_SPECS } from '@/lib/modelTracking';

interface ModelStatus {
  modelId: string;
  status: 'healthy' | 'degraded' | 'broken' | 'unknown';
  lastHealthCheck: number;
  responseTimeMs: number;
  errorMessage?: string;
  requestsSucceeded: number;
  requestsFailed: number;
}

interface ModelUsage {
  modelId: string;
  totalTokensUsed: number;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  lastUpdated: number;
  timesUsed: number;
}

interface APILimit {
  modelId: string;
  provider: string;
  isLocal: boolean;
  limitTokensPer1Min: number;
  limitTokensPer1Day: number;
  currentUsage1Min: number;
  currentUsage1Day: number;
  percentageUsed1Day: number;
  warningLevel?: string;
  timeToRestoreMinutes?: number;
}

export default function ModelsAndAgentsScreen() {
  const [statuses, setStatuses] = useState<Record<string, ModelStatus>>({});
  const [usages, setUsages] = useState<Record<string, ModelUsage>>({});
  const [limits, setLimits] = useState<APILimit[]>([]);
  const [summary, setSummary] = useState({ healthy: 0, degraded: 0, broken: 0 });
  const [usageSummary, setUsageSummary] = useState({ totalTokens: 0, totalCost: 0 });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'usage' | 'limits'>('overview');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statusRes, usageRes, limitsRes] = await Promise.all([
          fetch('/api/models/status'),
          fetch('/api/models/usage'),
          fetch('/api/models/limits'),
        ]);

        if (statusRes.ok) {
          const statusData = await statusRes.json();
          setStatuses(statusData.status);
          setSummary(statusData.summary);
        }

        if (usageRes.ok) {
          const usageData = await usageRes.json();
          setUsages(usageData.usage);
          setUsageSummary({
            totalTokens: usageData.summary.totalTokensUsed,
            totalCost: usageData.summary.totalEstimatedCost,
          });
        }

        if (limitsRes.ok) {
          const limitsData = await limitsRes.json();
          setLimits(limitsData.limits);
        }
      } catch (error) {
        console.error('Failed to fetch model data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-50 border-green-200';
      case 'degraded':
        return 'bg-yellow-50 border-yellow-200';
      case 'broken':
        return 'bg-red-50 border-red-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-600" />;
      case 'broken':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Activity className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatCost = (cost: number) => {
    return cost > 0 ? `$${cost.toFixed(2)}` : 'Free';
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Zap className="w-12 h-12 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading model data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Cpu className="w-8 h-8 text-blue-600" />
            Models & Agents
          </h1>
          <p className="text-gray-600 mt-2">
            Track token usage, API limits, and model health status
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Healthy Models</span>
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{summary.healthy}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Degraded Models</span>
              <AlertTriangle className="w-5 h-5 text-yellow-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{summary.degraded}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Broken Models</span>
              <AlertCircle className="w-5 h-5 text-red-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">{summary.broken}</p>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Total API Cost</span>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-900">${usageSummary.totalCost.toFixed(2)}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          {(['overview', 'usage', 'limits'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 px-1 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-4">
            {Object.entries(MODEL_SPECS).map(([modelId, spec]) => {
              const status = statuses[modelId];
              const usage = usages[modelId];

              return (
                <div
                  key={modelId}
                  className={`rounded-lg border p-4 shadow-sm transition-colors ${getStatusColor(status?.status || 'unknown')}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(status?.status || 'unknown')}
                      <div>
                        <h3 className="font-semibold text-gray-900">{spec.name}</h3>
                        <p className="text-sm text-gray-600">{spec.provider}</p>
                      </div>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                      status?.status === 'healthy'
                        ? 'bg-green-200 text-green-800'
                        : status?.status === 'degraded'
                        ? 'bg-yellow-200 text-yellow-800'
                        : status?.status === 'broken'
                        ? 'bg-red-200 text-red-800'
                        : 'bg-gray-200 text-gray-800'
                    }`}>
                      {status?.status || 'unknown'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                    <div>
                      <p className="text-gray-600 text-xs">Parameters</p>
                      <p className="font-medium text-gray-900">{spec.params}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Context</p>
                      <p className="font-medium text-gray-900">{formatNumber(spec.contextWindow)}</p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Response Time</p>
                      <p className="font-medium text-gray-900">
                        {status?.responseTimeMs || spec.speedMs}ms
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Cost per 1M</p>
                      <p className="font-medium text-gray-900">
                        {spec.isLocal ? 'Free' : `$${spec.costPer1MTokens.input}-${spec.costPer1MTokens.output}`}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-600 text-xs">Health</p>
                      <p className="font-medium text-gray-900">
                        {status?.requestsSucceeded}/{status?.requestsSucceeded + status?.requestsFailed || 'N/A'}
                      </p>
                    </div>
                  </div>

                  {status?.errorMessage && (
                    <div className="mt-3 p-2 bg-red-100 text-red-800 text-xs rounded">
                      {status.errorMessage}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Usage Tab */}
        {activeTab === 'usage' && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Token Usage by Model
              </h3>
              <div className="space-y-3">
                {Object.entries(usages)
                  .sort((a, b) => b[1].totalTokensUsed - a[1].totalTokensUsed)
                  .map(([modelId, usage]) => (
                    <div key={modelId} className="border-b border-gray-200 pb-3 last:border-b-0">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-gray-900">
                          {MODEL_SPECS[modelId]?.name || modelId}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">
                          {formatNumber(usage.totalTokensUsed)} tokens
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-gray-600">
                        <span>Input: {formatNumber(usage.inputTokens)}</span>
                        <span>Output: {formatNumber(usage.outputTokens)}</span>
                        <span>Used {usage.timesUsed} times</span>
                        <span className="font-medium text-gray-900 ml-auto">
                          {formatCost(usage.estimatedCost)}
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-500 h-full"
                          style={{
                            width: `${Math.min(
                              (usage.totalTokensUsed / Object.values(usages).reduce((a, b) => a + b.totalTokensUsed, 1)) * 100,
                              100
                            )}%`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* Limits Tab */}
        {activeTab === 'limits' && (
          <div className="space-y-4">
            {limits
              .filter((l) => !l.isLocal)
              .map((limit) => (
                <div
                  key={limit.modelId}
                  className={`rounded-lg border p-4 shadow-sm ${
                    limit.warningLevel === 'warning'
                      ? 'bg-yellow-50 border-yellow-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                      {MODEL_SPECS[limit.modelId]?.name || limit.modelId}
                      {limit.warningLevel === 'warning' && (
                        <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      )}
                    </h3>
                    <span className="text-sm font-medium text-gray-600">
                      {limit.percentageUsed1Day.toFixed(1)}% of daily limit
                    </span>
                  </div>

                  <div className="mb-3">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-600">Daily Usage</span>
                      <span className="font-medium text-gray-900">
                        {formatNumber(limit.currentUsage1Day)} / {formatNumber(limit.limitTokensPer1Day)}
                      </span>
                    </div>
                    <div className="bg-gray-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-full transition-colors ${
                          limit.percentageUsed1Day > 80
                            ? 'bg-red-500'
                            : limit.percentageUsed1Day > 70
                            ? 'bg-yellow-500'
                            : 'bg-green-500'
                        }`}
                        style={{ width: `${Math.min(limit.percentageUsed1Day, 100)}%` }}
                      />
                    </div>
                  </div>

                  {limit.timeToRestoreMinutes && limit.timeToRestoreMinutes > 0 && (
                    <div className="flex items-center gap-2 p-2 bg-red-50 rounded text-sm text-red-700">
                      <Clock className="w-4 h-4" />
                      <span>
                        If limit is hit, restoration in ~{limit.timeToRestoreMinutes} minutes
                      </span>
                    </div>
                  )}
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
