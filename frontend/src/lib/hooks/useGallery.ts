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

export interface PaginatedGallery {
  count: number;
  results: GalleryImage[];
}

export type GalleryImagePayload = Omit<GalleryImage, 'id' | 'resolved_url' | 'created_at' | 'updated_at'>;

export const useGallery = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['gallery', params],
    queryFn: async (): Promise<PaginatedGallery> => {
      const r = await publicApi.get('/gallery/', { params });
      const data = r.data;
      if (Array.isArray(data)) {
        return { count: data.length, results: data };
      }
      return { count: data.count ?? 0, results: data.results ?? [] };
    },
    staleTime: 5 * 60 * 1000,
  });

export const useCreateGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
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