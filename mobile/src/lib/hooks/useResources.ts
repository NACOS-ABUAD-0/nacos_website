import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { resourcesAPI } from '@/lib/api';

export function useResources(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['resources', params],
    queryFn: async () => (await resourcesAPI.getResources(params)).data,
  });
}

export function useResource(id: number | string) {
  return useQuery({
    queryKey: ['resource', id],
    queryFn: async () => (await resourcesAPI.getResource(id)).data,
    enabled: !!id,
  });
}

export function useDriveResources() {
  return useQuery({
    queryKey: ['drive-resources'],
    queryFn: async () => (await resourcesAPI.getDriveResources()).data,
  });
}

export function useResourceCategories() {
  return useQuery({
    queryKey: ['resource-categories'],
    queryFn: async () => (await resourcesAPI.getCategories()).data,
  });
}

export function useSubmitResource() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => resourcesAPI.submit(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['resources'] }),
  });
}
