import { NavigationState, Page } from '@/types/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '/api/navigation';

export class NavigationService {
  private static instance: NavigationService;

  static getInstance(): NavigationService {
    if (!NavigationService.instance) {
      NavigationService.instance = new NavigationService();
    }
    return NavigationService.instance;
  }

  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token =
      typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;

    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Navigation request failed');
    }

    return response.json();
  }

  async getNavigationState(): Promise<NavigationState> {
    try {
      const response = await this.makeRequest<NavigationState>('/state');
      return response;
    } catch (error) {
      console.error('Failed to fetch navigation state:', error);
      // Return default state
      return {
        userId: null,
        activePage: '/',
        visiblePages: ['home'],
        lastUpdated: new Date(),
      };
    }
  }

  async updateNavigationState(activePage: string): Promise<NavigationState> {
    try {
      const response = await this.makeRequest<NavigationState>('/state', {
        method: 'PUT',
        body: JSON.stringify({ activePage }),
      });
      return response;
    } catch (error) {
      console.error('Failed to update navigation state:', error);
      throw error;
    }
  }

  async getAvailablePages(): Promise<Page[]> {
    try {
      const response = await this.makeRequest<{ pages: Page[] }>('/pages');
      return response.pages;
    } catch (error) {
      console.error('Failed to fetch available pages:', error);
      // Return default pages
      return [
        {
          id: 'home',
          name: 'Home',
          path: '/',
          icon: '🏠',
          requiresAuth: false,
          requiredPermissions: [],
        },
      ];
    }
  }

  // Client-side navigation state management
  private navigationState: NavigationState | null = null;
  private listeners: Set<(state: NavigationState) => void> = new Set();

  setNavigationState(state: NavigationState): void {
    this.navigationState = state;
    this.notifyListeners();
  }

  getCurrentNavigationState(): NavigationState | null {
    return this.navigationState;
  }

  addListener(listener: (state: NavigationState) => void): () => void {
    this.listeners.add(listener);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notifyListeners(): void {
    if (this.navigationState) {
      this.listeners.forEach((listener) => listener(this.navigationState!));
    }
  }

  // Utility methods
  isPageVisible(pageId: string, visiblePages: string[]): boolean {
    return visiblePages.includes(pageId);
  }

  getActivePageFromPath(path: string): string {
    const pathToPageMap: Record<string, string> = {
      '/': 'home',
      '/players': 'players',
      '/analytics': 'analytics',
      '/admin': 'admin',
      '/admin/permissions': 'admin',
      '/admin/users': 'admin',
    };

    return pathToPageMap[path] || 'home';
  }

  getPagePath(pageId: string): string {
    const pageToPathMap: Record<string, string> = {
      home: '/',
      players: '/players',
      analytics: '/analytics',
      admin: '/admin',
    };

    return pageToPathMap[pageId] || '/';
  }
}

export const navigationService = NavigationService.getInstance();
