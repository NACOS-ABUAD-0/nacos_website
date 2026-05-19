// src/lib/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { projectsAPI, skillsAPI } from '../api';
import type { Project, Skill } from '../../types';

// ─── Helper: normalize any API shape to a plain array ────────────────────────
function extractArray<T>(data: unknown): T[] {
  if (!data) return [];
  if (Array.isArray(data)) return data as T[];
  const paginated = data as { results?: T[] };
  if (Array.isArray(paginated.results)) return paginated.results;
  return [];
}

// ─── Query hooks ─────────────────────────────────────────────────────────────

export const useProjects = (params = {}) => {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => {
      const res = await projectsAPI.getProjects(params);
      return extractArray<<Project>(res.data);
    },
    placeholderData: keepPreviousData,
  });
};

export const useMyProjects = () => {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => {
      const res = await projectsAPI.getMyProjects();
      return extractArray<<Project>(res.data);
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
  return useQuery<<Skill[]>({
    queryKey: ['skills'],
    queryFn: async () => {
      const res = await skillsAPI.getSkills();
      return extractArray<<Skill>(res.data);
    },
  });
};

// ─── Mutation hooks ───────────────────────────────────────────────────────────

export const useCreateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Partial<<Project>) =>
      projectsAPI.createProject(data).then(res => res.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
};

export const useUpdateProject = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string | number; data: Partial<<Project> }) =>
      projectsAPI.updateProject(id, data).then(res => res.data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
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
      queryClient.invalidateQueries({ queryKey: ['my-projects'] });
    },
  });
};