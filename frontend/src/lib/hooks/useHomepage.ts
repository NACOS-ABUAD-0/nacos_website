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

  // ── Image field: Django REST Framework may return any of these depending
  //    on how the serializer is set up:
  //    • cover_image  — raw FileField / ImageField (most common in DRF)
  //    • cover_url    — SerializerMethodField or custom property
  //    • image        — generic fallback name
  //    • thumbnail    — some setups use this
  //
  //    The helper `getProjectImage()` below always tries them in order so
  //    the carousel and any other consumer never has to guess.
  cover_image?: string;
  cover_url?: string;
  image?: string;
  thumbnail?: string;

  links?: Record<string, string>;
  updated_at?: string;
  tags?: { id: number; name: string }[];
  is_featured?: boolean;
  description?: string;
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
  committees: number;
  committee_applications: number;
  gallery_images: number;
  inquiries: number;
  event_registrations: number;
  class_sessions: number;
  class_attendances: number;
  executives: number;
}

export interface FeaturedProjectsResult {
  results: ProjectItem[];
  count: number;
}

// ─── getProjectImage ──────────────────────────────────────────────────────────
//
// Resolves whichever image field the API populated.
// Import and use this anywhere you need to render a project image.
//
// Usage:
//   const src = getProjectImage(project);
//   if (src) <img src={src} ... />
// ─────────────────────────────────────────────────────────────────────────────
export function getProjectImage(project: ProjectItem): string | null {
  return (
    project.cover_image ||
    project.cover_url   ||
    project.image       ||
    project.thumbnail   ||
    null
  );
}

// ─── Helper: normalize any API shape to a plain ProjectItem array ─────────────
//
// The Django REST Framework endpoint may return either:
//   A) A paginated object: { count, next, previous, results: [...] }
//   B) A plain array:      [...]
//
// This helper always produces a ProjectItem[] regardless of which shape
// arrives, so callers never have to guard against undefined.
// ─────────────────────────────────────────────────────────────────────────────
function extractResults(data: unknown): ProjectItem[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as ProjectItem[];
  const paginated = data as { results?: ProjectItem[] };
  if (Array.isArray(paginated.results)) return paginated.results;
  return [];
}

// ─── useFeaturedProjects ──────────────────────────────────────────────────────
//
// Query key: ["featured-projects"]
//
// This key MUST match the invalidation call in the admin FeaturedProjects page
// (src/admin1/pages/FeaturedProjects.tsx) so that toggling a project's featured
// status in the admin immediately reflects on the homepage without a full reload.
//
// Try featured first; fall back to 6 most recent if none are featured.
// This ensures the homepage always shows projects even before an admin
// has manually featured any.
//
// Always returns { results: ProjectItem[], count: number } — never undefined
// arrays — so downstream components can safely call .length and .map.
// ─────────────────────────────────────────────────────────────────────────────
export const useFeaturedProjects = () => {
  return useQuery<FeaturedProjectsResult>({
    // ⚠️  Keep this key in sync with the invalidateQueries call in
    //     src/admin1/pages/FeaturedProjects.tsx
    queryKey: ['featured-projects'],
    queryFn: async () => {
      const featuredRes = await api.get('/projects/', {
        params: { is_featured: true, page_size: 6 },
      });

      const featuredResults = extractResults(featuredRes.data);

      if (featuredResults.length > 0) {
        return { results: featuredResults, count: featuredResults.length };
      }

      // Fallback: most recent published projects
      const recentRes = await api.get('/projects/', {
        params: { page_size: 6, ordering: '-created_at' },
      });

      const recentResults = extractResults(recentRes.data);
      return { results: recentResults, count: recentResults.length };
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpcomingEvents = () => {
  return useQuery({
    queryKey: ['events', 'upcoming'],
    queryFn: () =>
      api
        .get('/events/', { params: { upcoming: true, page_size: 3 } })
        .then(r => r.data),
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
      api.get('/gallery/', { params: { page_size: 12 } }).then(r => {
        const data = r.data;
        return Array.isArray(data) ? data : (data?.results ?? []);
      }),
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