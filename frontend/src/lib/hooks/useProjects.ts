// frontend/src/lib/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, skillsAPI } from '../api';

// Query hooks
export const useProjects = (params = {}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: () => projectsAPI.getProjects(params).then(res => res.data),
    keepPreviousData: true,
  });
};

export const useProject = (id: string | number) => {
  return useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsAPI.getProject(id).then(res => res.data),
    enabled: !!id,
  });
};

export const useSkills = () => {
  return useQuery({
    queryKey: ['skills'],
    queryFn: () => skillsAPI.getSkills().then(res => res.data),
  });
};

// Mutation hooks
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => projectsAPI.createProject(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: any }) =>
      projectsAPI.updateProject(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', variables.id] });
    },
  });
};

export const useDeleteProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) => projectsAPI.deleteProject(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

// Like/Unlike hooks
export const useLikeProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string | number) =>
      projectsAPI.likeProject(projectId).then(res => res.data),
    onSuccess: (_, projectId) => {
      // Update the specific project's like count in the cache
      queryClient.setQueryData(['project', projectId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            like_count: (oldData.like_count || 0) + 1,
            is_liked_by_user: true,
          };
        }
        return oldData;
      });

      // Also update the project in the projects list
      queryClient.setQueryData(['projects'], (oldData: any) => {
        if (oldData?.data) {
          return {
            ...oldData,
            data: oldData.data.map((project: any) =>
              project.id === projectId
                ? { ...project, like_count: (project.like_count || 0) + 1, is_liked_by_user: true }
                : project
            ),
          };
        }
        return oldData;
      });
    },
  });
};

export const useUnlikeProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string | number) =>
      projectsAPI.unlikeProject(projectId).then(res => res.data),
    onSuccess: (_, projectId) => {
      // Update the specific project's like count in the cache
      queryClient.setQueryData(['project', projectId], (oldData: any) => {
        if (oldData) {
          return {
            ...oldData,
            like_count: Math.max((oldData.like_count || 0) - 1, 0),
            is_liked_by_user: false,
          };
        }
        return oldData;
      });

      // Also update the project in the projects list
      queryClient.setQueryData(['projects'], (oldData: any) => {
        if (oldData?.data) {
          return {
            ...oldData,
            data: oldData.data.map((project: any) =>
              project.id === projectId
                ? { ...project, like_count: Math.max((project.like_count || 0) - 1, 0), is_liked_by_user: false }
                : project
            ),
          };
        }
        return oldData;
      });
    },
  });
};