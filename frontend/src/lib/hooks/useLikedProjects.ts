import { useQuery } from '@tanstack/react-query';
import { projectsAPI } from '../api';

export interface LikedProject {
  id: number;
  title: string;
  description: string;
  tags: { name: string }[];
  like_count: number;
  is_liked_by_user: boolean;
  created_at: string;
}

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ✅ FIXED: Always returns an array, never a paginated object
export const useLikedProjects = () => {
  return useQuery({
    queryKey: ['liked-projects'],
    queryFn: async () => {
      const res = await projectsAPI.getLiked();

      // Handle both paginated and non-paginated responses
      if (res.data && typeof res.data === 'object') {
        // If it has a 'results' property (paginated response)
        if ('results' in res.data && Array.isArray(res.data.results)) {
          return res.data.results as LikedProject[];
        }
        // If it's directly an array
        if (Array.isArray(res.data)) {
          return res.data as LikedProject[];
        }
      }

      // Fallback: return empty array if something unexpected
      console.warn('Unexpected response format for liked projects:', res.data);
      return [];
    },
  });
};

// ✅ ADDED: Hook for liked projects count (useful for badges)
export const useLikedProjectsCount = () => {
  return useQuery({
    queryKey: ['liked-projects-count'],
    queryFn: async () => {
      const res = await projectsAPI.getLiked();

      // Handle paginated response
      if (res.data && typeof res.data === 'object') {
        if ('count' in res.data && typeof res.data.count === 'number') {
          return res.data.count;
        }
        if (Array.isArray(res.data)) {
          return res.data.length;
        }
      }

      return 0;
    },
  });
};

// ✅ ADDED: Check if a specific project is liked
export const useIsProjectLiked = (projectId: number) => {
  return useQuery({
    queryKey: ['liked-projects', projectId, 'is-liked'],
    queryFn: async () => {
      const res = await projectsAPI.getLiked();
      let projects: LikedProject[] = [];

      // Extract the array from response
      if (res.data && typeof res.data === 'object') {
        if ('results' in res.data && Array.isArray(res.data.results)) {
          projects = res.data.results;
        } else if (Array.isArray(res.data)) {
          projects = res.data;
        }
      }

      return projects.some(project => project.id === projectId);
    },
    enabled: !!projectId,
  });
};