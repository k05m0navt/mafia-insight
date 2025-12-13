'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Save,
  RefreshCw,
  Clock,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SyncPreferences {
  syncEnabled: boolean;
  syncSchedule: string | null;
  lastSyncAt: string | null;
}

interface SyncStatus {
  isRunning: boolean;
  progress: number;
  currentOperation: string | null;
  lastSyncTime: string | null;
  lastSyncType: string | null;
  lastError: string | null;
}

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Daily (Midnight UTC)', cron: '0 0 * * *' },
  { value: 'hourly', label: 'Hourly', cron: '0 * * * *' },
  { value: '0 0 * * *', label: 'Daily at Midnight UTC', cron: '0 0 * * *' },
  { value: '0 */6 * * *', label: 'Every 6 Hours', cron: '0 */6 * * *' },
  { value: '0 */12 * * *', label: 'Every 12 Hours', cron: '0 */12 * * *' },
];

export default function SyncSettingsPage() {
  const [preferences, setPreferences] = useState<SyncPreferences>({
    syncEnabled: false,
    syncSchedule: null,
    lastSyncAt: null,
  });
  const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetchSyncPreferences();
    fetchSyncStatus();
  }, []);

  const fetchSyncPreferences = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/settings/sync');
      if (!response.ok) {
        throw new Error('Failed to fetch sync preferences');
      }

      const data = await response.json();
      setPreferences(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load sync preferences'
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchSyncStatus = async () => {
    try {
      const response = await fetch('/api/gomafia-sync/status');
      if (!response.ok) {
        return;
      }

      const data = await response.json();
      if (data.syncStatus) {
        setSyncStatus(data.syncStatus);
      }
    } catch (err) {
      // Silently fail - status is optional
      console.error('Failed to fetch sync status:', err);
    }
  };

  const savePreferences = async () => {
    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      const response = await fetch('/api/settings/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncEnabled: preferences.syncEnabled,
          syncSchedule: preferences.syncSchedule,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save sync preferences');
      }

      const data = await response.json();
      setPreferences(data);
      setSuccess('Sync preferences saved successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save sync preferences'
      );
    } finally {
      setSaving(false);
    }
  };

  const formatLastSyncTime = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-96 mb-8" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
            <Skeleton className="h-10 w-32" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6 px-4 sm:px-6 lg:px-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Sync Settings</h1>
        <p className="text-muted-foreground mt-2">
          Configure automatic synchronization of your game data from gomafia.pro
        </p>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Sync Preferences Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            Automatic Synchronization
          </CardTitle>
          <CardDescription>
            Enable automatic sync to keep your analytics up-to-date without
            manual intervention
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div className="space-y-0.5 flex-1">
              <Label
                htmlFor="sync-enabled"
                className="text-base font-medium cursor-pointer"
              >
                Enable Automatic Sync
              </Label>
              <p className="text-sm text-muted-foreground">
                Automatically sync new game data on a schedule
              </p>
            </div>
            <Switch
              id="sync-enabled"
              checked={preferences.syncEnabled}
              onCheckedChange={(checked) =>
                setPreferences((prev) => ({ ...prev, syncEnabled: checked }))
              }
              aria-label="Enable automatic synchronization"
            />
          </div>

          {/* Schedule Selector */}
          {preferences.syncEnabled && (
            <div className="space-y-2">
              <Label htmlFor="sync-schedule" className="text-base font-medium">
                Sync Schedule
              </Label>
              <Select
                value={preferences.syncSchedule || 'daily'}
                onValueChange={(value) =>
                  setPreferences((prev) => ({ ...prev, syncSchedule: value }))
                }
              >
                <SelectTrigger id="sync-schedule" className="w-full">
                  <SelectValue placeholder="Select sync schedule" />
                </SelectTrigger>
                <SelectContent>
                  {SCHEDULE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Choose how often the system should check for new games
              </p>
            </div>
          )}

          {/* Last Sync Status */}
          <div className="pt-4 border-t space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">Last Sync:</span>
              <span className="font-medium">
                {formatLastSyncTime(preferences.lastSyncAt)}
              </span>
            </div>
            {syncStatus?.isRunning && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Sync in progress: {syncStatus.progress}%</span>
                {syncStatus.currentOperation && (
                  <span className="text-muted-foreground">
                    - {syncStatus.currentOperation}
                  </span>
                )}
              </div>
            )}
            {syncStatus?.lastError && (
              <div className="flex items-center gap-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4" />
                <span>Last error: {syncStatus.lastError}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2">
        <Button
          variant="outline"
          onClick={fetchSyncPreferences}
          disabled={saving}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
        <Button onClick={savePreferences} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}
