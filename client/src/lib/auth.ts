import { apiRequest } from "@/lib/queryClient";

export interface User {
  id: string;
  email: string;
  name: string;
  preferences?: Record<string, any>;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthManager {
  private static instance: AuthManager;
  private authState: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };
  private listeners: Array<(state: AuthState) => void> = [];

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      const user = await this.getCurrentUser();
      this.updateAuthState({
        user,
        isAuthenticated: !!user,
        isLoading: false
      });
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
    }
  }

  private updateAuthState(newState: Partial<AuthState>) {
    this.authState = { ...this.authState, ...newState };
    this.listeners.forEach(listener => listener(this.authState));
  }

  subscribe(listener: (state: AuthState) => void): () => void {
    this.listeners.push(listener);
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  getAuthState(): AuthState {
    return this.authState;
  }

  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiRequest('GET', '/api/user/profile');
      const user = await response.json();
      return user;
    } catch (error) {
      console.error('Failed to get current user:', error);
      return null;
    }
  }

  async signOut(): Promise<void> {
    try {
      await apiRequest('POST', '/api/auth/signout');
      this.updateAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      // Clear any cached data
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('Failed to sign out:', error);
      throw error;
    }
  }

  initiateGoogleAuth(): void {
    if (typeof window !== 'undefined') {
      window.location.href = '/api/auth/google';
    }
  }

  async refreshUser(): Promise<User | null> {
    try {
      const user = await this.getCurrentUser();
      this.updateAuthState({
        user,
        isAuthenticated: !!user
      });
      return user;
    } catch (error) {
      console.error('Failed to refresh user:', error);
      this.updateAuthState({
        user: null,
        isAuthenticated: false
      });
      return null;
    }
  }

  isTokenExpired(): boolean {
    // In a real implementation, you would check JWT expiration
    // For now, we'll rely on API calls failing with 401
    return false;
  }

  async handleTokenRefresh(): Promise<boolean> {
    try {
      // This would typically refresh access tokens using refresh tokens
      const user = await this.refreshUser();
      return !!user;
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      return false;
    }
  }
}

export const authManager = AuthManager.getInstance();

// Hook for React components
export function useAuth() {
  const [authState, setAuthState] = React.useState<AuthState>(
    authManager.getAuthState()
  );

  React.useEffect(() => {
    const unsubscribe = authManager.subscribe(setAuthState);
    return unsubscribe;
  }, []);

  return {
    ...authState,
    signOut: () => authManager.signOut(),
    refreshUser: () => authManager.refreshUser(),
    initiateGoogleAuth: () => authManager.initiateGoogleAuth()
  };
}

// Utility functions
export function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };

  // Add authorization header if available
  const authState = authManager.getAuthState();
  if (authState.isAuthenticated && authState.user) {
    // In a real implementation, you would add the Bearer token
    // headers['Authorization'] = `Bearer ${accessToken}`;
  }

  return headers;
}

export function isAuthenticated(): boolean {
  return authManager.getAuthState().isAuthenticated;
}

export function requireAuth(): User {
  const authState = authManager.getAuthState();
  if (!authState.isAuthenticated || !authState.user) {
    throw new Error('User not authenticated');
  }
  return authState.user;
}

// React import (this should be at the top in a real file)
import React from 'react';
