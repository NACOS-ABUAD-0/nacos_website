import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { notificationsAPI } from '@/lib/api';

export function useNotifications() {
  return useQuery({
    queryKey: ['notifications'],
    queryFn: async () => (await notificationsAPI.getAll()).data,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsAPI.markRead(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => notificationsAPI.deleteNotification(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] }),
  });
}
