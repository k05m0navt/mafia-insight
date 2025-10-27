'use client';

import React, { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Save,
  RotateCcw,
  Trash2,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { formPreservationService } from '@/lib/forms/preservation';

interface FormDataPreservationProps {
  formKey: string;
  onDataRestored?: (data: Record<string, unknown>) => void;
  onDataSaved?: (data: Record<string, unknown>) => void;
  className?: string;
}

export const FormDataPreservation: React.FC<FormDataPreservationProps> = ({
  formKey,
  onDataRestored,
  onDataSaved,
  className = '',
}) => {
  const [hasStoredData, setHasStoredData] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);

  // Check for stored data on mount
  useEffect(() => {
    const storedData = formPreservationService.getFormData(formKey);
    if (storedData) {
      setHasStoredData(true);
      onDataRestored?.(storedData);
    }
  }, [formKey, onDataRestored]);

  // Auto-save form data
  const _autoSave = (data: Record<string, unknown>) => {
    if (Object.keys(data).length === 0) return;

    setIsAutoSaving(true);
    try {
      formPreservationService.saveFormData(formKey, data);
      setHasStoredData(true);
      setLastSaved(new Date());
      onDataSaved?.(data);
    } catch (error) {
      console.error('Auto-save failed:', error);
    } finally {
      setIsAutoSaving(false);
    }
  };

  // Manual save
  const _handleSave = (data: Record<string, unknown>) => {
    if (Object.keys(data).length === 0) return;

    try {
      formPreservationService.saveFormData(formKey, data);
      setHasStoredData(true);
      setLastSaved(new Date());
      onDataSaved?.(data);
    } catch (error) {
      console.error('Manual save failed:', error);
    }
  };

  // Restore data
  const handleRestore = () => {
    const storedData = formPreservationService.getFormData(formKey);
    if (storedData) {
      onDataRestored?.(storedData);
    }
  };

  // Clear stored data
  const handleClear = () => {
    try {
      formPreservationService.removeFormData(formKey);
      setHasStoredData(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Clear failed:', error);
    }
  };

  // Clear all stored data
  const handleClearAll = () => {
    try {
      formPreservationService.clearAllFormData();
      setHasStoredData(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Clear all failed:', error);
    }
  };

  const formatLastSaved = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Save className="h-5 w-5" />
          Form Data Preservation
        </CardTitle>
        <CardDescription>
          Your form data is automatically saved and can be restored if needed.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasStoredData ? (
              <Badge variant="default" className="flex items-center gap-1">
                <CheckCircle className="h-3 w-3" />
                Data Saved
              </Badge>
            ) : (
              <Badge variant="outline" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                No Data
              </Badge>
            )}

            {isAutoSaving && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Saving...
              </Badge>
            )}
          </div>

          {lastSaved && (
            <span className="text-sm text-muted-foreground">
              Last saved: {formatLastSaved(lastSaved)}
            </span>
          )}
        </div>

        {hasStoredData && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Form data has been saved and can be restored if you encounter any
              issues.
            </p>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRestore}
                className="flex items-center gap-2"
              >
                <RotateCcw className="h-4 w-4" />
                Restore Data
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={handleClear}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear This Form
              </Button>
            </div>
          </div>
        )}

        <div className="pt-2 border-t">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearAll}
            className="text-muted-foreground hover:text-foreground"
          >
            Clear All Saved Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Hook for form data preservation
export const useFormDataPreservation = (formKey: string) => {
  const [hasStoredData, setHasStoredData] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  useEffect(() => {
    const storedData = formPreservationService.getFormData(formKey);
    setHasStoredData(!!storedData);
  }, [formKey]);

  const saveData = (data: Record<string, unknown>) => {
    if (Object.keys(data).length === 0) return;

    try {
      formPreservationService.saveFormData(formKey, data);
      setHasStoredData(true);
      setLastSaved(new Date());
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const restoreData = () => {
    return formPreservationService.getFormData(formKey);
  };

  const clearData = () => {
    try {
      formPreservationService.removeFormData(formKey);
      setHasStoredData(false);
      setLastSaved(null);
    } catch (error) {
      console.error('Clear failed:', error);
    }
  };

  return {
    hasStoredData,
    lastSaved,
    saveData,
    restoreData,
    clearData,
  };
};
