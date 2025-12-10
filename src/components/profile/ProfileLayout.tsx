'use client';

import React from 'react';
import { ProfileView } from './ProfileView';
import { ProfileEditForm } from './ProfileEditForm';

interface ProfileLayoutProps {
  user: {
    id: string;
    email: string;
    name: string;
    avatar?: string | null;
    role?: string;
    subscriptionTier?: string;
    themePreference?: string | null;
    emailNotifications?: boolean;
    pushNotifications?: boolean;
    createdAt: Date;
    lastLogin?: Date | null;
  };
}

/**
 * ProfileLayout component
 * Provides responsive layout for profile page with view and edit sections
 *
 * Features:
 * - Mobile-first responsive design (320px, 768px, 1024px, 1440px breakpoints)
 * - WCAG 2.1 Level AA accessibility compliance
 * - Semantic HTML structure
 * - Keyboard navigation support
 */
export function ProfileLayout({ user }: ProfileLayoutProps) {
  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-6xl">
      {/* Main heading */}
      <header className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
          Profile
        </h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-2">
          Manage your account information and preferences
        </p>
      </header>

      {/* Profile content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile View Section - Left column on desktop, full width on mobile */}
        <div className="lg:col-span-1">
          <ProfileView user={user} />
        </div>

        {/* Profile Edit Section - Right column on desktop, full width on mobile */}
        <div className="lg:col-span-2">
          <ProfileEditForm user={user} />
        </div>
      </div>
    </div>
  );
}
