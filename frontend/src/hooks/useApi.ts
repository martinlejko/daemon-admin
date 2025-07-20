/**
 * Custom hooks for API calls using React Query
 */

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { api } from '@/lib/axios';
import type {
  ApiError,
  Server,
  ServerConnectionTestResponse,
  ServerCreateRequest,
  ServerFilterParams,
  ServerListResponse,
  ServerStatsResponse,
  Service,
  ServiceControlRequest,
  ServiceControlResponse,
  ServiceDiscoveryResponse,
  ServiceFilterParams,
  ServiceListResponse,
  ServiceLogsRequest,
  ServiceLogsResponse,
  ServiceStatsResponse,
  ServiceUpdateRequest,
  ServiceUpdateResponse,
  ServiceRollbackRequest,
  LogLevel,
} from '@/types';

// Server API hooks
export const useServers = (params?: ServerFilterParams) => {
  return useQuery({
    queryKey: ['servers', params],
    queryFn: async (): Promise<ServerListResponse> => {
      const response = await api.get('/servers', { params });
      return response.data;
    },
    staleTime: 30_000, // 30 seconds
  });
};

export const useServer = (serverId: number) => {
  return useQuery({
    queryKey: ['server', serverId],
    queryFn: async (): Promise<Server> => {
      const response = await api.get(`/servers/${serverId}`);
      return response.data;
    },
    enabled: !!serverId,
  });
};

export const useCreateServer = () => {
  const queryClient = useQueryClient();

  return useMutation<Server, AxiosError<ApiError>, ServerCreateRequest>({
    mutationFn: async (data: ServerCreateRequest) => {
      const response = await api.post('/servers', data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['server-stats'] });
    },
  });
};

export const useUpdateServer = (serverId: number) => {
  const queryClient = useQueryClient();

  return useMutation<
    Server,
    AxiosError<ApiError>,
    Partial<ServerCreateRequest>
  >({
    mutationFn: async (data: Partial<ServerCreateRequest>) => {
      const response = await api.put(`/servers/${serverId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['server', serverId] });
      queryClient.invalidateQueries({ queryKey: ['server-stats'] });
    },
  });
};

export const useDeleteServer = () => {
  const queryClient = useQueryClient();

  return useMutation<void, AxiosError<ApiError>, number>({
    mutationFn: async (serverId: number) => {
      await api.delete(`/servers/${serverId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['servers'] });
      queryClient.invalidateQueries({ queryKey: ['server-stats'] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
    },
  });
};

export const useTestServerConnection = () => {
  return useMutation<
    ServerConnectionTestResponse,
    AxiosError<ApiError>,
    number
  >({
    mutationFn: async (serverId: number) => {
      const response = await api.post(`/servers/${serverId}/test-connection`);
      return response.data;
    },
  });
};

export const useGatherServerInfo = () => {
  const queryClient = useQueryClient();

  return useMutation<any, AxiosError<ApiError>, number>({
    mutationFn: async (serverId: number) => {
      const response = await api.post(`/servers/${serverId}/gather-info`);
      return response.data;
    },
    onSuccess: (_, serverId) => {
      queryClient.invalidateQueries({ queryKey: ['server', serverId] });
      queryClient.invalidateQueries({ queryKey: ['servers'] });
    },
  });
};

export const useServerStats = () => {
  return useQuery({
    queryKey: ['server-stats'],
    queryFn: async (): Promise<ServerStatsResponse> => {
      const response = await api.get('/servers/stats/overview');
      return response.data;
    },
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Refetch every minute
  });
};

// Service API hooks
export const useServices = (params?: ServiceFilterParams) => {
  return useQuery({
    queryKey: ['services', params],
    queryFn: async (): Promise<ServiceListResponse> => {
      const response = await api.get('/services', { params });
      return response.data;
    },
    staleTime: 15_000, // 15 seconds
  });
};

export const useService = (serviceId: number) => {
  return useQuery({
    queryKey: ['service', serviceId],
    queryFn: async (): Promise<Service> => {
      const response = await api.get(`/services/${serviceId}`);
      return response.data;
    },
    enabled: !!serviceId,
  });
};

export const useControlService = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceControlResponse,
    AxiosError<ApiError>,
    { serviceId: number; action: ServiceControlRequest['action'] }
  >({
    mutationFn: async ({ serviceId, action }) => {
      const response = await api.post(`/services/${serviceId}/control`, {
        action,
      });
      return response.data;
    },
    onSuccess: (_, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
    },
  });
};

export const useServiceLogs = () => {
  return useMutation<
    ServiceLogsResponse,
    AxiosError<ApiError>,
    { serviceId: number; lines?: number; since?: string; until?: string; priority?: string; grep?: string }
  >({
    mutationFn: async ({ serviceId, lines = 100, since, until, priority, grep }) => {
      const params: any = { lines };
      if (since) params.since = since;
      if (until) params.until = until;
      if (priority) params.priority = priority;
      if (grep) params.grep = grep;
      
      const response = await api.get(`/services/${serviceId}/logs`, { params });
      return response.data;
    },
  });
};

export const useDiscoverServices = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceDiscoveryResponse,
    AxiosError<ApiError>,
    { serverId: number; forceRefresh?: boolean }
  >({
    mutationFn: async ({ serverId, forceRefresh = false }) => {
      const response = await api.post(`/services/discover/${serverId}`, {
        force_refresh: forceRefresh,
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      queryClient.invalidateQueries({ queryKey: ['service-stats'] });
    },
  });
};

export const useServiceStats = () => {
  return useQuery({
    queryKey: ['service-stats'],
    queryFn: async (): Promise<ServiceStatsResponse> => {
      const response = await api.get('/services/stats/overview');
      return response.data;
    },
    staleTime: 60_000, // 1 minute
    refetchInterval: 60_000, // Refetch every minute
  });
};

// Service editing hooks
export const useUpdateService = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceUpdateResponse,
    AxiosError<ApiError>,
    { serviceId: number; updateData: ServiceUpdateRequest }
  >({
    mutationFn: async ({ serviceId, updateData }) => {
      const response = await api.put(`/services/${serviceId}`, updateData);
      return response.data;
    },
    onSuccess: (_, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useRollbackServiceConfiguration = () => {
  const queryClient = useQueryClient();

  return useMutation<
    ServiceUpdateResponse,
    AxiosError<ApiError>,
    { serviceId: number; rollbackData: ServiceRollbackRequest }
  >({
    mutationFn: async ({ serviceId, rollbackData }) => {
      const response = await api.post(`/services/${serviceId}/rollback`, rollbackData);
      return response.data;
    },
    onSuccess: (_, { serviceId }) => {
      queryClient.invalidateQueries({ queryKey: ['service', serviceId] });
      queryClient.invalidateQueries({ queryKey: ['services'] });
    },
  });
};

export const useValidateServiceUpdate = () => {
  return useMutation<
    ServiceUpdateResponse,
    AxiosError<ApiError>,
    { serviceId: number; updateData: ServiceUpdateRequest }
  >({
    mutationFn: async ({ serviceId, updateData }) => {
      const response = await api.put(`/services/${serviceId}`, {
        ...updateData,
        validate_only: true,
      });
      return response.data;
    },
  });
};

// Health check hook
export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/health');
      return response.data;
    },
    staleTime: 30_000, // 30 seconds
    refetchInterval: 30_000, // Refetch every 30 seconds
    retry: 1,
  });
};
