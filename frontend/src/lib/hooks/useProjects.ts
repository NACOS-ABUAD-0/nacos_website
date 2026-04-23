import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { projectsAPI, skillsAPI } from '../api';
import type { Project, Skill } from '../../types';

// Query hooks
export const useProjects = (params = {}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await projectsAPI.getProjects(params);
      // ✅ Normalize: always return the results array
      return res.data?.results ?? [];
    },
    placeholderData: keepPreviousData,
  });
};

// Separate hook for user's own projects (if API has dedicated endpoint)
export const useMyProjects = () => {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const res = await projectsAPI.getMyProjects();
      // ✅ Normalize to array
      return res.data?.results ?? [];
    },
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
  return useQuery<Skill[]>({
    queryKey: ['skills'],
    queryFn: () => skillsAPI.getSkills().then(res => res.data),
  });
};

// Mutation hooks
export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<Project>) =>
      projectsAPI.createProject(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<Project> }) =>
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
    mutationFn: (id: string | number) =>
      projectsAPI.deleteProject(id).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useLikeProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string | number) =>
      projectsAPI.likeProject(projectId).then(res => res.data),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};

export const useUnlikeProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string | number) =>
      projectsAPI.unlikeProject(projectId).then(res => res.data),
    onSuccess: (_, projectId) => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });
};