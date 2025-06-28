import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useUserStore } from '../store/userStore';
import type { User } from '../store/userStore';
import api from '../lib/api';

interface ApiResponse {
  message: string;
  status: string;
  user?: User;
}

const fetchUserData = async (): Promise<ApiResponse> => {
  const response = await api.get('/api/hello');
  return response.data;
};

export const useUser = () => {
  const { token, setUser, logout, isLoading: storeLoading } = useUserStore();

  const query = useQuery({
    queryKey: ['user', token],
    queryFn: fetchUserData,
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

const fetchBackendStatus = async (): Promise<ApiResponse> => {
  // Create a separate axios call without auth token for backend status
  const response = await api.get('/api/hello', {
    headers: {
      'Authorization': '', // Override auth interceptor
    },
  });
  return response.data;
};

export const useBackendStatus = () => {
  const { token } = useUserStore();
  
  return useQuery({
    queryKey: ['backend-status'],
    queryFn: fetchBackendStatus,
    enabled: !token, // Only run when user is NOT authenticated
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // Refetch every minute
  });
};