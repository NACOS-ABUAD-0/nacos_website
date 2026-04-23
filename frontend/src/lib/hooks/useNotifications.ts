// src/lib/hooks/useNotifications.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsAPI } from '../api';

export interface NotificationData {
  id: number;
  title: string;
  message: string;
  notification_type: 'committee' | 'system';
  is_read: boolean;
  data: Record<string, any>;
  created_at: string;
}

export const useNotifications = () => {
  return useQuery<NotificationData[]>({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res = await notificationsAPI.getAll();
      return res.data.results || res.data;
    },
  });
};

export const useMarkNotificationRead = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await notificationsAPI.markRead(id);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
};