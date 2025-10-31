'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/hooks/use-toast';
import { Loader2, Shield, AlertCircle } from 'lucide-react';

export function AdminBootstrapForm() {
  const router = useRouter();
  const { toast } = useToast();
  const [isAvailable, setIsAvailable] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    checkBootstrapAvailability();
  }, []);

  const checkBootstrapAvailability = async () => {
    try {
      const response = await fetch('/api/admin/bootstrap/check');
      const data = await response.json();

      setIsAvailable(data.available);

      if (!data.available) {
        setError(
          'Admin users already exist. Bootstrap is no longer available.'
        );
      }
    } catch (error) {
      console.error('Failed to check bootstrap availability:', error);
      setError('Failed to check bootstrap availability');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/bootstrap', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create admin user');
      }

      toast({
        title: 'Admin Created Successfully',
        description: 'You can now log in with your admin credentials.',
      });

      // Redirect to login page
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error) {
      console.error('Bootstrap error:', error);
      setError(
        error instanceof Error ? error.message : 'Failed to create admin user'
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAvailability) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-muted-foreground">
            Checking availability...
          </span>
        </CardContent>
      </Card>
    );
  }

  if (!isAvailable) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-destructive" />
            Bootstrap Not Available
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              Admin users already exist. Please log in or contact an existing
              administrator for access.
            </AlertDescription>
          </Alert>
          <Button className="w-full mt-4" onClick={() => router.push('/login')}>
            Go to Login
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Create First Admin
        </CardTitle>
        <CardDescription>
          Set up the first administrator account for Mafia Insight. This can
          only be done once.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Full Name</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Enter your full name"
              disabled={isLoading}
              required
            />
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="admin@example.com"
              disabled={isLoading}
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Minimum 8 characters"
              disabled={isLoading}
              required
              minLength={8}
            />
          </div>

          {/* Confirm Password */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleInputChange}
              placeholder="Re-enter your password"
              disabled={isLoading}
              required
            />
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating Admin...' : 'Create Admin Account'}
          </Button>

          <p className="text-xs text-center text-muted-foreground">
            This will create the first administrator account with full system
            access.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
