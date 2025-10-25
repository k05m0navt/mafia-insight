export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM',
  CLUB = 'CLUB',
  ENTERPRISE = 'ENTERPRISE',
}

export interface SubscriptionLimits {
  maxPlayers: number;
  maxClubs: number;
  maxTournaments: number;
  analyticsRetentionDays: number;
  exportLimit: number;
  apiCallsPerHour: number;
  realTimeUpdates: boolean;
  advancedAnalytics: boolean;
  customReports: boolean;
  prioritySupport: boolean;
}

export interface UserSubscription {
  tier: SubscriptionTier;
  limits: SubscriptionLimits;
  expiresAt?: Date;
  isActive: boolean;
  features: string[];
}

class SubscriptionService {
  private tierLimits: Record<SubscriptionTier, SubscriptionLimits> = {
    [SubscriptionTier.FREE]: {
      maxPlayers: 5,
      maxClubs: 1,
      maxTournaments: 0,
      analyticsRetentionDays: 30,
      exportLimit: 10,
      apiCallsPerHour: 100,
      realTimeUpdates: false,
      advancedAnalytics: false,
      customReports: false,
      prioritySupport: false,
    },
    [SubscriptionTier.PREMIUM]: {
      maxPlayers: 50,
      maxClubs: 5,
      maxTournaments: 10,
      analyticsRetentionDays: 90,
      exportLimit: 100,
      apiCallsPerHour: 1000,
      realTimeUpdates: true,
      advancedAnalytics: true,
      customReports: false,
      prioritySupport: false,
    },
    [SubscriptionTier.CLUB]: {
      maxPlayers: 200,
      maxClubs: 20,
      maxTournaments: 50,
      analyticsRetentionDays: 180,
      exportLimit: 500,
      apiCallsPerHour: 5000,
      realTimeUpdates: true,
      advancedAnalytics: true,
      customReports: true,
      prioritySupport: true,
    },
    [SubscriptionTier.ENTERPRISE]: {
      maxPlayers: -1, // Unlimited
      maxClubs: -1, // Unlimited
      maxTournaments: -1, // Unlimited
      analyticsRetentionDays: 365,
      exportLimit: -1, // Unlimited
      apiCallsPerHour: -1, // Unlimited
      realTimeUpdates: true,
      advancedAnalytics: true,
      customReports: true,
      prioritySupport: true,
    },
  };

  // Get user subscription
  async getUserSubscription(userId: string): Promise<UserSubscription> {
    try {
      const response = await fetch(`/api/users/${userId}/subscription`);
      if (!response.ok) {
        throw new Error('Failed to fetch subscription');
      }

      const data = await response.json();
      return {
        tier: data.tier,
        limits: this.tierLimits[data.tier as SubscriptionTier],
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
        isActive: data.isActive,
        features: this.getTierFeatures(data.tier as SubscriptionTier),
      };
    } catch {
      // Return free tier as fallback
      return {
        tier: SubscriptionTier.FREE,
        limits: this.tierLimits[SubscriptionTier.FREE],
        isActive: true,
        features: this.getTierFeatures(SubscriptionTier.FREE),
      };
    }
  }

  // Check if user can perform action
  async canPerformAction(
    userId: string,
    action: keyof SubscriptionLimits,
    currentCount?: number
  ): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    const limit = subscription.limits[action];

    // Unlimited access
    if (limit === -1) return true;

    // Check current usage
    if (currentCount !== undefined && typeof limit === 'number') {
      return currentCount < limit;
    }

    return true;
  }

  // Check feature access
  async hasFeature(userId: string, feature: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    return subscription.features.includes(feature);
  }

  // Get tier features
  private getTierFeatures(tier: SubscriptionTier): string[] {
    const features: string[] = ['Basic Analytics'];

    switch (tier) {
      case SubscriptionTier.FREE:
        break;
      case SubscriptionTier.PREMIUM:
        features.push(
          'Advanced Analytics',
          'Real-time Updates',
          'Extended History'
        );
        break;
      case SubscriptionTier.CLUB:
        features.push(
          'Advanced Analytics',
          'Real-time Updates',
          'Extended History',
          'Custom Reports',
          'Priority Support',
          'Team Management'
        );
        break;
      case SubscriptionTier.ENTERPRISE:
        features.push(
          'Advanced Analytics',
          'Real-time Updates',
          'Extended History',
          'Custom Reports',
          'Priority Support',
          'Team Management',
          'Unlimited Players',
          'Unlimited Clubs',
          'Unlimited Tournaments',
          'API Access',
          'White-label Options'
        );
        break;
    }

    return features;
  }

  // Upgrade subscription
  async upgradeSubscription(
    userId: string,
    newTier: SubscriptionTier,
    paymentMethodId?: string
  ): Promise<boolean> {
    try {
      const response = await fetch('/api/subscriptions/upgrade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          tier: newTier,
          paymentMethodId,
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
      return false;
    }
  }

  // Cancel subscription
  async cancelSubscription(userId: string): Promise<boolean> {
    try {
      const response = await fetch('/api/subscriptions/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      return false;
    }
  }

  // Get usage statistics
  async getUsageStats(userId: string): Promise<{
    players: number;
    clubs: number;
    tournaments: number;
    exports: number;
    apiCalls: number;
  }> {
    try {
      const response = await fetch(`/api/users/${userId}/usage`);
      if (!response.ok) {
        throw new Error('Failed to fetch usage stats');
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to fetch usage stats:', error);
      return {
        players: 0,
        clubs: 0,
        tournaments: 0,
        exports: 0,
        apiCalls: 0,
      };
    }
  }

  // Check if user is approaching limits
  async isApproachingLimits(userId: string): Promise<{
    approaching: boolean;
    warnings: string[];
  }> {
    const subscription = await this.getUserSubscription(userId);
    const usage = await this.getUsageStats(userId);
    const warnings: string[] = [];

    // Check each limit
    if (
      subscription.limits.maxPlayers !== -1 &&
      usage.players >= subscription.limits.maxPlayers * 0.8
    ) {
      warnings.push('You are approaching your player limit');
    }

    if (
      subscription.limits.maxClubs !== -1 &&
      usage.clubs >= subscription.limits.maxClubs * 0.8
    ) {
      warnings.push('You are approaching your club limit');
    }

    if (
      subscription.limits.maxTournaments !== -1 &&
      usage.tournaments >= subscription.limits.maxTournaments * 0.8
    ) {
      warnings.push('You are approaching your tournament limit');
    }

    if (
      subscription.limits.exportLimit !== -1 &&
      usage.exports >= subscription.limits.exportLimit * 0.8
    ) {
      warnings.push('You are approaching your export limit');
    }

    if (
      subscription.limits.apiCallsPerHour !== -1 &&
      usage.apiCalls >= subscription.limits.apiCallsPerHour * 0.8
    ) {
      warnings.push('You are approaching your API call limit');
    }

    return {
      approaching: warnings.length > 0,
      warnings,
    };
  }

  // Get pricing information
  getPricing(): Record<
    SubscriptionTier,
    { price: number; currency: string; interval: string }
  > {
    return {
      [SubscriptionTier.FREE]: { price: 0, currency: 'USD', interval: 'month' },
      [SubscriptionTier.PREMIUM]: {
        price: 9.99,
        currency: 'USD',
        interval: 'month',
      },
      [SubscriptionTier.CLUB]: {
        price: 29.99,
        currency: 'USD',
        interval: 'month',
      },
      [SubscriptionTier.ENTERPRISE]: {
        price: 99.99,
        currency: 'USD',
        interval: 'month',
      },
    };
  }
}

export const subscriptionService = new SubscriptionService();
