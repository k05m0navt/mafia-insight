'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AvatarUpload } from './AvatarUpload';
import { useToast } from '@/components/hooks/use-toast';
import { Loader2, Edit } from 'lucide-react';
import { emailSchema } from '@/lib/auth/validation';
import { useRouter } from 'next/navigation';
import { useProfile, type ProfileUpdateData } from '@/hooks/useProfile';

// Profile edit form schema
const profileEditSchema = z.object({
  email: emailSchema, // RFC 5322 validation
  name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters'),
  themePreference: z.enum(['light', 'dark', 'system']),
  emailNotifications: z.boolean(),
  pushNotifications: z.boolean(),
});

type ProfileEditFormData = z.infer<typeof profileEditSchema>;

interface ProfileEditFormProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    themePreference?: string | null;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
  };
}

/**
 * ProfileEditForm component
 * Form for editing user profile information and preferences
 *
 * Features:
 * - Real-time validation feedback
 * - Email change requires verification flow
 * - Profile picture upload
 * - Theme preference selector
 * - Notification settings toggles
 * - WCAG 2.1 Level AA accessible
 * - Responsive design
 */
export function ProfileEditForm({ user: initialUser }: ProfileEditFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { profile, updateProfile, isLoading: isProfileLoading } = useProfile();
  const [isEmailEditing, setIsEmailEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Use profile from hook if available, otherwise use initial user prop
  const user = profile || initialUser;
  const isLoading = isProfileLoading || isSubmitting;

  const form = useForm<ProfileEditFormData>({
    resolver: zodResolver(profileEditSchema),
    defaultValues: {
      email: user.email,
      name: user.name,
      themePreference:
        (user.themePreference as 'light' | 'dark' | 'system') || 'system',
      emailNotifications: (user as any).emailNotifications ?? true,
      pushNotifications: (user as any).pushNotifications ?? false,
    } as ProfileEditFormData,
    mode: 'onChange', // Real-time validation
  });

  const onSubmit = async (data: ProfileEditFormData) => {
    setIsSubmitting(true);

    try {
      // Check if email changed - requires verification flow
      if (data.email !== user.email) {
        // Trigger email change verification flow
        const response = await fetch('/api/user/profile/email/request', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ newEmail: data.email }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to request email change');
        }

        toast({
          title: 'Verification Email Sent',
          description:
            'Please check your email to verify the new email address.',
        });

        setIsEmailEditing(false);
        form.reset({ ...data, email: user.email }); // Reset email to current
        return;
      }

      // Update profile (excluding email if unchanged)
      const updateData: ProfileUpdateData = {
        name: data.name,
        themePreference: data.themePreference,
        emailNotifications: data.emailNotifications,
        pushNotifications: data.pushNotifications,
      };

      const result = await updateProfile(updateData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update profile');
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });

      router.refresh();
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'Update Failed',
        description:
          error instanceof Error ? error.message : 'Failed to update profile',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEmailEdit = () => {
    setIsEmailEditing(true);
  };

  return (
    <div className="space-y-6">
      {/* Avatar Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Picture</CardTitle>
          <CardDescription>
            Upload a profile picture. Maximum file size is 5MB. Supported
            formats: JPG, PNG, WebP.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <AvatarUpload
            userId={user.id}
            currentAvatar={user.avatar}
            userName={user.name}
          />
        </CardContent>
      </Card>

      {/* Profile Edit Form */}
      <Card>
        <CardHeader>
          <CardTitle>Profile Information</CardTitle>
          <CardDescription>
            Update your personal information and preferences.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Email Field */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          disabled={!isEmailEditing || isLoading}
                          className="bg-muted"
                          aria-label="Email address"
                          aria-describedby="email-description email-message"
                        />
                      </FormControl>
                      {!isEmailEditing && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleEmailEdit}
                          disabled={isLoading}
                          aria-label="Edit email address"
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                      )}
                    </div>
                    <FormDescription id="email-description">
                      Email changes require verification. A verification email
                      will be sent to your new address.
                    </FormDescription>
                    <FormMessage id="email-message" />
                  </FormItem>
                )}
              />

              {/* Display Name Field */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Display Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="text"
                        placeholder="Your display name"
                        disabled={isLoading}
                        aria-label="Display name"
                        aria-describedby="name-description name-message"
                      />
                    </FormControl>
                    <FormDescription id="name-description">
                      This is the name that will be displayed across the
                      platform (2-50 characters).
                    </FormDescription>
                    <FormMessage id="name-message" />
                  </FormItem>
                )}
              />

              {/* Theme Preference */}
              <FormField
                control={form.control}
                name="themePreference"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Theme Preference</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      disabled={isLoading}
                    >
                      <FormControl>
                        <SelectTrigger aria-label="Theme preference">
                          <SelectValue placeholder="Select theme" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                        <SelectItem value="system">System</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Choose your preferred color theme for the interface.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notification Settings */}
              <div className="space-y-4">
                <div className="text-sm font-medium">Notification Settings</div>

                <FormField
                  control={form.control}
                  name="emailNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Email Notifications
                        </FormLabel>
                        <FormDescription>
                          Receive email notifications about important updates.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          aria-label="Enable email notifications"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="pushNotifications"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">
                          Push Notifications
                        </FormLabel>
                        <FormDescription>
                          Receive push notifications in your browser.
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                          aria-label="Enable push notifications"
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setIsEmailEditing(false);
                  }}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLoading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
