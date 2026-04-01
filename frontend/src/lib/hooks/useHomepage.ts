// src/lib/hooks/useHomepage.ts
import { useQuery } from '@tanstack/react-query';
import api from '../api';

export interface Exec {
  id: number | string;
  name: string;
  role: string;
  photo_url: string;
  socials?: Record<string, string>;
  term?: string;
  priority?: number;
}

export interface EventItem {
  id: number | string;
  title: string;
  slug?: string;
  cover?: string;
  start: string;
  end?: string;
  venue?: string;
  is_remote?: boolean;
}

export interface ProjectItem {
  id: number | string;
  title: string;
  owner: { id: number | string; full_name?: string };
  skills?: string[];
  cover_url?: string;
  links?: Record<string, string>;
  updated_at?: string;
  tags?: { id: number; name: string }[];
  is_featured?: boolean;
}

export interface ResourceItem {
  id: number | string;
  title: string;
  url: string;
  course_code?: string;
  year?: string | number;
  tags?: string[];
}

export interface GalleryItem {
  id: number | string;
  title?: string;
  url: string;
  type: 'image' | 'video';
  event?: number | string | null;
}

export interface Stats {
  students: number;
  projects: number;
  skills: number;
  events: number;
  resources: number;
}

// useFeaturedProjects
// Try featured first; fall back to 6 most recent if none are featured.
// This ensures the homepage always shows projects even before an admin
// has manually featured any.
export const useFeaturedProjects = () => {
  return useQuery({
    queryKey: ['projects', 'homepage'],
    queryFn: async () => {
      const featuredRes = await api.get('/projects/', {
        params: { is_featured: true, page_size: 6 },
      });
      if (featuredRes.data?.results?.length > 0) return featuredRes.data;

      // Fallback: most recent published projects
      const recentRes = await api.get('/projects/', {
        params: { page_size: 6, ordering: '-created_at' },
      });
      return recentRes.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () =>
      api.get('/events/', { params: { upcoming: true, page_size: 3 } }).then(r => r.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useExecutives = () => {
  return useQuery({
    queryKey: ['execs', 'list'],
    queryFn: () => api.get('/executives/').then(r => r.data),
    staleTime: 10 * 60 * 1000,
  });
};

export const useLatestResources = () => {
  return useQuery({
    queryKey: ['resources', 'latest'],
    queryFn: () =>
      api.get('/resources/', { params: { page_size: 6 } }).then(r => r.data),
    staleTime: 15 * 60 * 1000,
  });
};


export const useLatestGallery = () => {
  return useQuery({
    queryKey: ['gallery', { page_size: 12 }],
    queryFn: () =>
      api.get('/gallery/', { params: { page_size: 12 } }).then(r =>
        Array.isArray(r.data) ? r.data : (r.data?.results ?? [])
      ),
    staleTime: 5 * 60 * 1000,
  });
};

export const usePublicStats = () => {
  return useQuery({
    queryKey: ['stats', 'public'],
    queryFn: () => api.get('/admin/stats/').then(r => r.data),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
};