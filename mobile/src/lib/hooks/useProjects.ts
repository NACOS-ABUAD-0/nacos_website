import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { collaborationAPI, CollaborationRequestData, ProjectData, projectsAPI } from '@/lib/api';

function normalizeList<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object' && Array.isArray((data as any).results)) {
    return (data as any).results;
  }
  return [];
}

export function useProjects(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ['projects', params],
    queryFn: async () => (await projectsAPI.getProjects(params)).data,
  });
}

export function useProject(id: number | string) {
  return useQuery({
    queryKey: ['project', id],
    queryFn: async () => (await projectsAPI.getProject(id)).data,
    enabled: !!id,
  });
}

export function useMyProjects() {
  return useQuery({
    queryKey: ['my-projects'],
    queryFn: async () => normalizeList<ProjectData>((await projectsAPI.getMyProjects()).data),
  });
}

export function useLikedProjects() {
  return useQuery({
    queryKey: ['liked-projects'],
    queryFn: async () => normalizeList<ProjectData>((await projectsAPI.getLiked()).data),
  });
}

export function useMyCollaborations() {
  return useQuery({
    queryKey: ['my-collaborations'],
    queryFn: async () => normalizeList<ProjectData>((await collaborationAPI.getMyCollaborations()).data),
  });
}

export function useToggleLike(id: number | string, isLiked: boolean) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => (isLiked ? projectsAPI.unlikeProject(id) : projectsAPI.likeProject(id)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', id] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['liked-projects'] });
    },
  });
}

export function useCollaborationRequests(projectId?: number | string) {
  return useQuery({
    queryKey: ['collaboration-requests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      return normalizeList<CollaborationRequestData>((await collaborationAPI.getRequests(projectId)).data);
    },
    enabled: !!projectId,
  });
}

export function useApplyCollaboration(projectId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { need_id?: number | null; phone_number: string; message: string }) =>
      collaborationAPI.apply(projectId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-collaborations'] }),
  });
}

export function useAcceptCollaborationRequest(projectId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => collaborationAPI.acceptRequest(projectId, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collaboration-requests', projectId] }),
  });
}

export function useRejectCollaborationRequest(projectId: number | string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: number) => collaborationAPI.rejectRequest(projectId, requestId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['collaboration-requests', projectId] }),
  });
}
