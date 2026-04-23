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

export const useLikedProjects = () => {
  return useQuery({
    queryKey: ['liked-projects'],
    queryFn: async () => {
      const res = await projectsAPI.getLiked();
      return (res.data.results || res.data) as LikedProject[];
    },
  });
};