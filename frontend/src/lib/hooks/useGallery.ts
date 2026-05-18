// src/hooks/useGallery.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { publicApi, api } from '../api';

export interface GalleryImage {
  id: number;
  image_url: string;
  resolved_url: string | null;
  caption: string;
  alt_text: string;
  category: 'Hackathons' | 'Workshops' | 'Socials' | 'Others';
  display_order: number;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export type GalleryImagePayload = Omit<GalleryImage, 'id' | 'resolved_url' | 'created_at' | 'updated_at'>;

const toArray = (data: any): GalleryImage[] =>
  Array.isArray(data) ? data : (data?.results ?? []);

export const useGallery = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['gallery', params],
    queryFn: () => publicApi.get('/gallery/', { params }).then(r => toArray(r.data)),
    staleTime: 5 * 60 * 1000,
  });

export const useCreateGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    // Send plain JSON — backend serializer expects `image_url` as a field,
    // NOT a multipart file upload. Using application/json avoids the
    // "Provide either an image file or an image URL." validation error.
    mutationFn: (payload: GalleryImagePayload) =>
      api.post('/gallery/', payload).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useUpdateGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<GalleryImagePayload> }) =>
      api.patch(`/gallery/${id}/`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useDeleteGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/gallery/${id}/`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};