'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { Sun, Moon, Monitor, Palette, Save, RotateCcw } from 'lucide-react';
import { Theme } from '@/types/theme';

interface ThemeConfiguration {
  theme: 'light' | 'dark' | 'system';
  customColors: Record<string, string>;
  lastUpdated: string;
}

export default function ThemeSettingsPage() {
  const [config, setConfig] = useState<ThemeConfiguration>({
    theme: 'system',
    customColors: {},
    lastUpdated: new Date().toISOString(),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchThemeConfig();
  }, []);

  const fetchThemeConfig = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch('/api/theme');

      if (!response.ok) {
        throw new Error('Failed to fetch theme configuration');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load theme settings'
      );
    } finally {
      setLoading(false);
    }
  };

  const saveThemeConfig = async () => {
    try {
      setSaving(true);
      setError(null);

      const response = await fetch('/api/theme', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error('Failed to save theme configuration');
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save theme settings'
      );
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = () => {
    setConfig({
      theme: 'system',
      customColors: {},
      lastUpdated: new Date().toISOString(),
    });
  };

  // Theme icon function not used in this implementation
  // const getThemeIcon = (theme: string) => {
  //   switch (theme) {
  //     case 'light':
  //       return <Sun className="h-5 w-5" />;
  //     case 'dark':
  //       return <Moon className="h-5 w-5" />;
  //     case 'system':
  //       return <Monitor className="h-5 w-5" />;
  //     default:
  //       return <Monitor className="h-5 w-5" />;
  //   }
  // };

  // Theme description function not used in this implementation
  // const getThemeDescription = (theme: string) => {
  //   switch (theme) {
  //     case 'light':
  //       return 'Always use light theme regardless of system preference';
  //     case 'dark':
  //       return 'Always use dark theme regardless of system preference';
  //     case 'system':
  //       return 'Follow your system theme preference';
  //     default:
  //       return 'Follow your system theme preference';
  //   }
  // };

  if (loading) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Theme Settings</h1>
        <p className="text-muted-foreground">
          Customize your theme preferences and appearance
        </p>
      </div>

      {/* Theme Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Theme Preference
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup
            value={config.theme}
            onValueChange={(value) =>
              setConfig((prev) => ({ ...prev, theme: value as Theme }))
            }
            className="space-y-4"
          >
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="light" id="light" />
              <Label
                htmlFor="light"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Sun className="h-5 w-5" />
                <div>
                  <div className="font-medium">Light</div>
                  <div className="text-sm text-muted-foreground">
                    Always use light theme regardless of system preference
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="dark" id="dark" />
              <Label
                htmlFor="dark"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Moon className="h-5 w-5" />
                <div>
                  <div className="font-medium">Dark</div>
                  <div className="text-sm text-muted-foreground">
                    Always use dark theme regardless of system preference
                  </div>
                </div>
              </Label>
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-muted/50 transition-colors">
              <RadioGroupItem value="system" id="system" />
              <Label
                htmlFor="system"
                className="flex items-center gap-3 cursor-pointer flex-1"
              >
                <Monitor className="h-5 w-5" />
                <div>
                  <div className="font-medium">System</div>
                  <div className="text-sm text-muted-foreground">
                    Follow your system theme preference
                  </div>
                </div>
              </Label>
            </div>
          </RadioGroup>

          {/* Quick Toggle */}
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium">Quick Toggle</h3>
                <p className="text-sm text-muted-foreground">
                  Use the toggle button for quick theme switching
                </p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Colors (Placeholder) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Custom Colors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <Palette className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Custom color customization coming soon</p>
            <p className="text-sm">
              You'll be able to customize accent colors and other theme elements
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={resetToDefault}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset to Default
        </Button>

        <div className="flex items-center gap-2">
          {error && <p className="text-sm text-red-600">{error}</p>}
          <Button onClick={saveThemeConfig} disabled={saving}>
            <Save className="h-4 w-4 mr-2" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>
    </div>
  );
}
