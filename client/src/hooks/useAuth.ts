import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import type { User, LoginRequest, RegisterRequest } from '@shared/schema';

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();

  // Get current user
  const { data: response, isLoading, error } = useQuery<AuthResponse>({
    queryKey: ['/api/auth/me'],
    queryFn: async () => {
      console.log('Checking authentication status...');
      const sessionId = localStorage.getItem('sessionId');
      console.log('Session ID from localStorage:', sessionId ? 'present' : 'missing');
      
      const res = await fetch('/api/auth/me', {
        credentials: 'include',
        headers: {
          ...(sessionId ? { 'x-session-id': sessionId } : {}),
        },
      });
      
      console.log('Auth response status:', res.status);
      
      if (res.status === 401) {
        console.log('Not authenticated, clearing localStorage');
        localStorage.removeItem('sessionId');
        return null;
      }
      
      if (!res.ok) {
        console.log('Auth request failed:', res.statusText);
        throw new Error('Failed to fetch user');
      }
      
      const data = await res.json();
      console.log('User authenticated:', data.user?.username);
      return data;
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes cache
  });

  const user = response?.user;
  const isAuthenticated = !!user;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async (data: LoginRequest): Promise<AuthResponse> => {
      console.log('Attempting login...');
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Login failed' }));
        console.log('Login failed:', error);
        throw new Error(error.message || 'Login failed');
      }

      const result = await response.json();
      console.log('Login successful:', result.user?.username);
      
      // Store session ID in localStorage for manual session management
      if (result.sessionId) {
        localStorage.setItem('sessionId', result.sessionId);
        console.log('Session ID stored in localStorage');
      }
      
      return result;
    },
    onSuccess: (data) => {
      console.log('Setting auth data in cache');
      queryClient.setQueryData(['/api/auth/me'], data);
      // Force refresh of auth query after successful login
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: async (data: RegisterRequest): Promise<AuthResponse> => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        credentials: 'include',
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ message: 'Registration failed' }));
        throw new Error(error.message || 'Registration failed');
      }

      return response.json();
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['/api/auth/me'], data);
      // Force refresh of auth query after successful registration
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async (): Promise<{ message: string }> => {
      const response = await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Logout failed');
      }

      return response.json();
    },
    onSuccess: () => {
      queryClient.setQueryData(['/api/auth/me'], null);
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated,
    authError: error,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: logoutMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    loginError: loginMutation.error,
    registerError: registerMutation.error,
  };
}