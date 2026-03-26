// src/lib/hooks/useHomepage.ts
import { useQuery } from '@tanstack/react-query';
import api  from '../api';
import type { ProjectsResponse } from '../../types';

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

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Homepage data hooks
export const useFeaturedProjects = () => {
  return useQuery<ProjectsResponse>({
    queryKey: ['projects', 'featured'],
    queryFn: () => api.get('/api/projects/?featured=true&limit=6').then(res => res.data),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpcomingEvents = () => {
  return useQuery<PaginatedResponse<EventItem>>({
    queryKey: ['events', 'upcoming'],
    queryFn: () => api.get('/events/?upcoming=true&limit=3').then(res => res.data),
    staleTime: 5 * 60 * 1000,
  });
};

export const useExecutives = () => {
  return useQuery<PaginatedResponse<Exec>>({
    queryKey: ['execs', 'list'],
    queryFn: () => api.get('/executives/').then(res => res.data),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useLatestResources = () => {
  return useQuery<PaginatedResponse<ResourceItem>>({
    queryKey: ['resources', 'latest'],
    queryFn: () => api.get('/resources/?limit=6').then(res => res.data),
    staleTime: 15 * 60 * 1000,
  });
};

export const useLatestGallery = () => {
  return useQuery<PaginatedResponse<GalleryItem>>({
    queryKey: ['gallery', 'latest'],
    queryFn: () => api.get('/gallery/?limit=12').then(res => res.data),
    staleTime: 15 * 60 * 1000,
  });
};

export const usePublicStats = () => {
  return useQuery<Stats>({
    queryKey: ['stats', 'public'],
    queryFn: async () => {
      try {
        const res = await api.get('/admin/stats/');
        return res.data;
      } catch {
        console.warn('Stats endpoint not available, using fallback data');
        return { students: 0, projects: 0, skills: 0, events: 0, resources: 0 };
      }
    },
    staleTime: 30 * 60 * 1000, // 30 minutes
    retry: 1,
  });
};
