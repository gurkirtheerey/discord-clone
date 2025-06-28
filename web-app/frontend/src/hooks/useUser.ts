import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import type { User } from '../store/userStore';

interface ApiResponse {
  message: string;
  status: string;
  user?: User;
}

const fetchUserData = async (token: string): Promise<ApiResponse> => {
  const response = await fetch('http://localhost:8080/api/hello', {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  return response.json();
};

export const useUser = () => {
  const { token, setUser, logout, isLoading: storeLoading } = useUserStore();

  const query = useQuery({
    queryKey: ['user', token],
    queryFn: () => fetchUserData(token!),
    enabled: !!token && !storeLoading, // Wait for store to finish loading
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchOnWindowFocus: false,
  });

  // Handle success/error in useEffect since React Query v5 removed onSuccess/onError
  React.useEffect(() => {
    if (query.data?.user) {
      setUser(query.data.user);
    }
  }, [query.data, setUser]);

  React.useEffect(() => {
    if (query.error && query.error.message.includes('401')) {
      logout();
    }
  }, [query.error, logout]);

  return query;
};

export const useBackendStatus = () => {
  return useQuery({
    queryKey: ['backend-status'],
    queryFn: async (): Promise<ApiResponse> => {
      const response = await fetch('http://localhost:8080/api/hello', {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};