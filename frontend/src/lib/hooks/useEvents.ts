// src/lib/hooks/useEvents.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export interface Event {
  id: number;
  title: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  start_time: string;
  end_time: string | null;
  is_remote: boolean;
  location: string;
  poster_url: string;
  description: string;
  registration_url: string;
  contact_email: string;
  is_published: boolean;
  media: { poster: string | null };
  created_at: string;
  updated_at: string;
}

export const useEvents = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['events', params],
    queryFn: () => api.get('/events/', { params }).then(r => r.data),
  });

export const useEvent = (id: string | number) =>
  useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}/`).then(r => r.data),
    enabled: !!id,
  });

export const useCreateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Event>) =>
      api.post('/events/', data).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Event> }) =>
      api.patch(`/events/${id}/`, data).then(r => r.data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['events'] }),
  });
};