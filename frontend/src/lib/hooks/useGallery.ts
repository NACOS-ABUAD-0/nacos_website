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
    mutationFn: (data: Omit<<GalleryImage, 'id' | 'resolved_url' | 'created_at' | 'updated_at'>) =>
      api.post('/gallery/', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['gallery'] });
    },
  });
};

export const useUpdateGalleryImage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Omit<<GalleryImage, 'id' | 'resolved_url' | 'created_at' | 'updated_at'>> }) =>
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