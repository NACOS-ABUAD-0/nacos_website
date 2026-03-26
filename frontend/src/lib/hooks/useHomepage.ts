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

// ─── RULE ────────────────────────────────────────────────────────────────────
// `api` already has baseURL = "http://127.0.0.1:8000/api"
// Every path here must start with "/" but must NOT include "/api".
//
//   ❌  api.get('/api/projects/')   → .../api/api/projects/  (404)
//   ✅  api.get('/projects/')       → .../api/projects/      (200)
//
// Pass query params as the `params` option — never bake them into the
// URL string. Axios serialises them correctly and they're easy to change.
// ─────────────────────────────────────────────────────────────────────────────

export const useFeaturedProjects = () => {
  return useQuery({
    queryKey: ['projects', 'featured'],
    queryFn: () =>
      api
        .get('/projects/', { params: { is_featured: true, page_size: 6 } })
        .then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () =>
      api
        .get('/events/', { params: { upcoming: true, page_size: 3 } })
        .then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useExecutives = () => {
  return useQuery({
    queryKey: ['execs', 'list'],
    queryFn: () => api.get('/executives/').then(res => res.data),
    staleTime: 10 * 60 * 1000,
  });
};

export const useLatestResources = () => {
  return useQuery({
    queryKey: ['resources', 'latest'],
    queryFn: () =>
      api
        .get('/resources/', { params: { page_size: 6 } })
        .then(res => res.data),
    staleTime: 15 * 60 * 1000,
  });
};

export const useLatestGallery = () => {
  return useQuery({
    queryKey: ['gallery', 'latest'],
    queryFn: () =>
      api
        .get('/gallery/', { params: { page_size: 12 } })
        .then(res => res.data),
    staleTime: 15 * 60 * 1000,
  });
};

export const usePublicStats = () => {
  return useQuery({
    queryKey: ['stats', 'public'],
    queryFn: () => api.get('/admin/stats/').then(res => res.data),
    staleTime: 30 * 60 * 1000,
    retry: 1,
  });
};