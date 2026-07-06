import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { eventsAPI } from '@/lib/api';

export function useEvents(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['events', params],
    queryFn: async () => (await eventsAPI.getEvents(params)).data,
  });
}

export function useEvent(id: number | string) {
  return useQuery({
    queryKey: ['event', id],
    queryFn: async () => (await eventsAPI.getEvent(id)).data,
    enabled: !!id,
  });
}

export function useMyRegistration(id: number | string) {
  return useQuery({
    queryKey: ['event-registration', id],
    queryFn: async () => {
      try {
        return (await eventsAPI.getMyRegistration(id)).data;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!id,
  });
}

export function useRegisterForEvent(id: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => eventsAPI.register(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['event-registration', id] }),
  });
}
