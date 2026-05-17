import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';

/**
 * =========================
 * TYPES
 * =========================
 */

// What backend RETURNS
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

// What backend ACCEPTS on CREATE
export interface CreateEventDTO {
  title: string;
  start_time: string;
  end_time?: string | null;
  is_remote: boolean;
  location: string;
  poster_url: string;
  description: string;
  registration_url: string;
  contact_email: string;
  is_published: boolean;
}

// Pagination type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * =========================
 * QUERIES
 * =========================
 */

export const useEvents = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const response = await api.get('/events/', { params });
      return (response.data as PaginatedResponse<Event>)?.results ?? [];
    },
    placeholderData: keepPreviousData,
  });

export const useEvent = (id: string | number) =>
  useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}/`).then(r => r.data as Event),
    enabled: !!id,
  });

export const useUpcomingEvents = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['upcoming-events', params],
    queryFn: async () => {
      const response = await api.get('/events/', {
        params: { ...params, status: 'upcoming' },
      });
      return (response.data as PaginatedResponse<Event>)?.results ?? [];
    },
    placeholderData: keepPreviousData,
  });

/**
 * =========================
 * MUTATIONS
 * =========================
 */

export const useCreateEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDTO) =>
      api.post('/events/', data).then(r => r.data as Event),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEventDTO> }) =>
      api.patch(`/events/${id}/`, data).then(r => r.data as Event),

    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}/`),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
};