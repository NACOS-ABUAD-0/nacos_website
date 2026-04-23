// src/lib/hooks/useCollaboration.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { collaborationAPI } from '../api';
import type { CollaborationNeedData, CollaborationRequestData } from '../api';

export const useProjectsNeedingHelp = (skillType?: string) => {
  return useQuery({
    queryKey: ['projects-needing-help', skillType],
    queryFn: async () => {
      const res = await collaborationAPI.getProjectsNeedingHelp(skillType);
      return (res.data.results || res.data) as any[];
    },
  });
};

export const useMyCollaborations = () => {
  return useQuery({
    queryKey: ['my-collaborations'],
    queryFn: async () => {
      const res = await collaborationAPI.getMyCollaborations();
      return (res.data.results || res.data) as any[];
    },
  });
};

export const useApplyCollaboration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      projectId: number | string;
      need_id?: number | null;
      phone_number: string;
      message: string;
    }) => {
      const { projectId, ...data } = payload;
      const res = await collaborationAPI.apply(projectId, data);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-collaborations'] });
      qc.invalidateQueries({ queryKey: ['projects-needing-help'] });
    },
  });
};

export const useCollaborationRequests = (projectId?: number | string) => {
  return useQuery({
    queryKey: ['collaboration-requests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await collaborationAPI.getRequests(projectId);
      return (res.data.results || res.data) as CollaborationRequestData[];
    },
    enabled: !!projectId,
  });
};

export const useAcceptCollaborationRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, requestId }: { projectId: number | string; requestId: number }) => {
      const res = await collaborationAPI.acceptRequest(projectId, requestId);
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-collaborations'] });
    },
  });
};

export const useRejectCollaborationRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, requestId }: { projectId: number | string; requestId: number }) => {
      const res = await collaborationAPI.rejectRequest(projectId, requestId);
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
    },
  });
};