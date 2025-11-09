/**
 * Performance Monitoring Dashboard
 *
 * Admin component for monitoring application performance metrics
 * and ensuring performance requirements are met.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { performanceMonitor, PERFORMANCE_THRESHOLDS } from '@/lib/performance';
import { themeManager } from '@/lib/theme-optimized';
import { navigationManager } from '@/lib/navigation-optimized';

interface PerformanceStats {
  name: string;
  average: number;
  min: number;
  max: number;
  count: number;
  p95: number;
  threshold: number;
  status: 'pass' | 'warning' | 'fail';
}

export const PerformanceDashboard: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const scheduleMicrotask = useCallback((callback: () => void) => {
    if (typeof queueMicrotask === 'function') {
      queueMicrotask(callback);
    } else {
      Promise.resolve().then(callback);
    }
  }, []);

  const updateStats = useCallback(() => {
    const newStats: PerformanceStats[] = [];

    // Get stats for each tracked operation
    const operations = [
      'theme-switch',
      'navigation-update',
      'auth-completion',
      'component-render',
    ];

    operations.forEach((operation) => {
      const operationStats = performanceMonitor.getPerformanceStats(operation);
      const threshold = PERFORMANCE_THRESHOLDS.find(
        (t) => t.name === operation
      );

      if (operationStats.count > 0 && threshold) {
        let status: 'pass' | 'warning' | 'fail' = 'pass';

        if (operationStats.p95 > threshold.maxDuration) {
          status = 'fail';
        } else if (operationStats.average > threshold.maxDuration * 0.8) {
          status = 'warning';
        }

        newStats.push({
          name: operation,
          ...operationStats,
          threshold: threshold.maxDuration,
          status,
        });
      }
    });

    setStats(newStats);
  }, []);

  useEffect(() => {
    scheduleMicrotask(updateStats);

    // Subscribe to performance updates
    const unsubscribe = performanceMonitor.subscribe(() => {
      scheduleMicrotask(updateStats);
    });

    return unsubscribe;
  }, [scheduleMicrotask, updateStats]);

  const startMonitoring = () => {
    setIsMonitoring(true);
    performanceMonitor.clear();
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);
  };

  const exportMetrics = () => {
    const metrics = performanceMonitor.exportMetrics();
    const blob = new Blob([metrics], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return 'text-green-600 bg-green-100';
      case 'warning':
        return 'text-yellow-600 bg-yellow-100';
      case 'fail':
        return 'text-red-600 bg-red-100';
    }
  };

  const getStatusIcon = (status: 'pass' | 'warning' | 'fail') => {
    switch (status) {
      case 'pass':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'fail':
        return '❌';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Performance Monitoring Dashboard
        </h1>
        <p className="text-gray-600">
          Monitor application performance metrics and ensure requirements are
          met.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Controls</h3>
          <div className="space-y-4">
            <button
              onClick={isMonitoring ? stopMonitoring : startMonitoring}
              className={`w-full px-4 py-2 rounded-md font-medium ${
                isMonitoring
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {isMonitoring ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>

            <button
              onClick={updateStats}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded-md font-medium hover:bg-gray-700"
            >
              Refresh Stats
            </button>

            <button
              onClick={exportMetrics}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-md font-medium hover:bg-green-700"
            >
              Export Metrics
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Theme Performance
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Average Switch Time:
              </span>
              <span className="font-medium">
                {themeManager.getPerformanceStats().average.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P95 Switch Time:</span>
              <span className="font-medium">
                {themeManager.getPerformanceStats().p95.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Switches:</span>
              <span className="font-medium">
                {themeManager.getPerformanceStats().count}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Navigation Performance
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">
                Average Update Time:
              </span>
              <span className="font-medium">
                {navigationManager.getPerformanceStats().average.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">P95 Update Time:</span>
              <span className="font-medium">
                {navigationManager.getPerformanceStats().p95.toFixed(2)}ms
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Total Updates:</span>
              <span className="font-medium">
                {navigationManager.getPerformanceStats().count}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Performance Metrics
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Operation
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Average (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  P95 (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Threshold (ms)
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Count
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map((stat) => (
                <tr key={stat.name}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {stat.name
                      .replace('-', ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.average.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.p95.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.threshold}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {stat.count}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(stat.status)}`}
                    >
                      {getStatusIcon(stat.status)} {stat.status.toUpperCase()}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stats.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 text-lg mb-2">
            No performance data available
          </div>
          <p className="text-gray-500">
            Start monitoring to collect performance metrics.
          </p>
        </div>
      )}
    </div>
  );
};
