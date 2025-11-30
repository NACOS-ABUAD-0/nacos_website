// frontend/src/hooks/useProjects.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { projectsAPI, skillsAPI } from '../api';

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