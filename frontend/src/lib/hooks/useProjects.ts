// frontend/src/hooks/useProjects.ts
import { keepPreviousData, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, skillsAPI } from '../api';
import type { Project, ProjectsResponse, Skill } from '../../types';

type ProjectFilters = {
  search?: string;
  tag_names?: string;
};

export const useProjects = (params: ProjectFilters = {}) => {
  return useQuery<ProjectsResponse>({
    queryKey: ['projects', params],
    queryFn: () => projectsAPI.getProjects(params).then(res => res.data),
    placeholderData: keepPreviousData,
  });
};

export const useProject = (id: string | number) => {
  return useQuery<Project>({
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
