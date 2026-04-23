// src/lib/hooks/useCollaboration.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { collaborationAPI } from '../api';
import type { CollaborationRequestData } from '../api';

// Paginated response type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// Helper function to normalize paginated responses
const normalizePaginatedResponse = <T>(data: any): T[] => {
  if (!data) return [];

  // If it's already an array
  if (Array.isArray(data)) return data;

  // If it's a paginated object with results array
  if (data && typeof data === 'object' && 'results' in data && Array.isArray(data.results)) {
    return data.results;
  }

  // Fallback: return empty array
  console.warn('Unexpected response format for collaboration data:', data);
  return [];
};

// ✅ FIXED: Returns array of projects needing help
export const useProjectsNeedingHelp = (skillType?: string) => {
  return useQuery({
    queryKey: ['projects-needing-help', skillType],
    queryFn: async () => {
      const res = await collaborationAPI.getProjectsNeedingHelp(skillType);
      return normalizePaginatedResponse<any>(res.data);
    },
    placeholderData: keepPreviousData,
  });
};

// ✅ FIXED: Returns array of user's collaborations
export const useMyCollaborations = () => {
  return useQuery({
    queryKey: ['my-collaborations'],
    queryFn: async () => {
      const res = await collaborationAPI.getMyCollaborations();
      return normalizePaginatedResponse<any>(res.data);
    },
  });
};

// ✅ FIXED: Returns array of collaboration requests for a project
export const useCollaborationRequests = (projectId?: number | string) => {
  return useQuery({
    queryKey: ['collaboration-requests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await collaborationAPI.getRequests(projectId);
      return normalizePaginatedResponse<CollaborationRequestData>(res.data);
    },
    enabled: !!projectId,
  });
};

// ✅ ADDED: Hook for collaboration requests count (for badges/notifications)
export const useCollaborationRequestsCount = (projectId?: number | string) => {
  return useQuery({
    queryKey: ['collaboration-requests-count', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const res = await collaborationAPI.getRequests(projectId);

      // Try to get count from paginated response
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
    enabled: !!projectId,
  });
};

// ✅ ADDED: Hook for pending collaboration requests (for project owners)
export const usePendingCollaborationRequests = (projectId?: number | string) => {
  return useQuery({
    queryKey: ['pending-collaboration-requests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await collaborationAPI.getRequests(projectId);
      const requests = normalizePaginatedResponse<CollaborationRequestData>(res.data);
      // Filter for pending requests (assuming status field exists)
      return requests.filter(req => req.status === 'pending' || !req.status);
    },
    enabled: !!projectId,
  });
};

// ✅ ADDED: Hook for accepted collaborations only
export const useAcceptedCollaborations = () => {
  return useQuery({
    queryKey: ['accepted-collaborations'],
    queryFn: async () => {
      const res = await collaborationAPI.getMyCollaborations();
      const collaborations = normalizePaginatedResponse<any>(res.data);
      // Filter for accepted collaborations (assuming acceptance_status or similar)
      return collaborations.filter(collab => collab.status === 'accepted' || collab.is_accepted === true);
    },
  });
};

// Mutation hooks (unchanged - they work fine)
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

export const useAcceptCollaborationRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, requestId }: { projectId: number | string; requestId: number }) => {
      const res = await collaborationAPI.acceptRequest(projectId, requestId);
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['pending-collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-collaborations'] });
      qc.invalidateQueries({ queryKey: ['accepted-collaborations'] });
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
      qc.invalidateQueries({ queryKey: ['pending-collaboration-requests', vars.projectId] });
    },
  });
};

// ✅ ADDED: Bulk action hook for accepting multiple requests
export const useBatchAcceptCollaborationRequests = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, requestIds }: { projectId: number | string; requestIds: number[] }) => {
      const promises = requestIds.map(requestId =>
        collaborationAPI.acceptRequest(projectId, requestId)
      );
      const results = await Promise.all(promises);
      return results.map(r => r.data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['pending-collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-collaborations'] });
    },
  });
};