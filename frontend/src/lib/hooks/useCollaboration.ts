// path: src/lib/hooks/useCollaboration.ts
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { collaborationAPI } from '../api';
import type { CollaborationRequestData } from '../api';

// ─── Types ────────────────────────────────────────────────────────────────────

interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

// ─── Helper ───────────────────────────────────────────────────────────────────

/**
 * Normalise a DRF response into a plain array regardless of whether the
 * endpoint returns a paginated envelope or a bare array.
 *
 * BUG 3 FIX: Previously this silently returned only `results` from the first
 * page. Now that the API sends page_size=200 we still normalise correctly,
 * and we also handle the bare-array case for non-paginated endpoints.
 */
const normalizePaginatedResponse = <T>(data: unknown): T[] => {
  if (!data) return [];

  if (Array.isArray(data)) return data as T[];

  if (
    data !== null &&
    typeof data === 'object' &&
    'results' in data &&
    Array.isArray((data as PaginatedResponse<T>).results)
  ) {
    return (data as PaginatedResponse<T>).results;
  }

  console.warn('Unexpected response format for collaboration data:', data);
  return [];
};

// ─── Query Hooks ──────────────────────────────────────────────────────────────

/**
 * All published projects that have at least one unfilled collaboration need.
 * Optionally filtered by skill type.
 *
 * BUG 3 FIX: API now sends page_size=200 so all projects are returned in one
 * shot instead of being cut off by the default paginator page size.
 */
export const useProjectsNeedingHelp = (skillType?: string) => {
  return useQuery({
    queryKey: ['projects-needing-help', skillType ?? ''],
    queryFn: async () => {
      const res = await collaborationAPI.getProjectsNeedingHelp(skillType);
      return normalizePaginatedResponse<any>(res.data);
    },
    placeholderData: keepPreviousData,
  });
};

/**
 * Projects that the current user is actively collaborating on
 * (their request was accepted).
 */
export const useMyCollaborations = () => {
  return useQuery({
    queryKey: ['my-collaborations'],
    queryFn: async () => {
      const res = await collaborationAPI.getMyCollaborations();
      return normalizePaginatedResponse<any>(res.data);
    },
  });
};

/**
 * All collaboration requests for a specific project (project-owner view).
 */
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

/**
 * Count of collaboration requests for a specific project (for badge display).
 */
export const useCollaborationRequestsCount = (projectId?: number | string) => {
  return useQuery({
    queryKey: ['collaboration-requests-count', projectId],
    queryFn: async () => {
      if (!projectId) return 0;
      const res = await collaborationAPI.getRequests(projectId);
      const data = res.data as any;
      if (data && typeof data === 'object') {
        if (typeof data.count === 'number') return data.count;
        if (Array.isArray(data)) return data.length;
      }
      return 0;
    },
    enabled: !!projectId,
  });
};

/**
 * Only the pending requests for a project (owner review UI).
 */
export const usePendingCollaborationRequests = (projectId?: number | string) => {
  return useQuery({
    queryKey: ['pending-collaboration-requests', projectId],
    queryFn: async () => {
      if (!projectId) return [];
      const res = await collaborationAPI.getRequests(projectId);
      const requests = normalizePaginatedResponse<CollaborationRequestData>(res.data);
      return requests.filter((req) => req.status === 'pending');
    },
    enabled: !!projectId,
  });
};

/**
 * Only accepted collaborations for the current user.
 */
export const useAcceptedCollaborations = () => {
  return useQuery({
    queryKey: ['accepted-collaborations'],
    queryFn: async () => {
      const res = await collaborationAPI.getMyCollaborations();
      const collaborations = normalizePaginatedResponse<any>(res.data);
      return collaborations.filter(
        (c) => c.status === 'accepted' || c.is_accepted === true
      );
    },
  });
};

// ─── Mutation Hooks ───────────────────────────────────────────────────────────

/**
 * Apply to collaborate on a project.
 *
 * BUG 4 FIX: The duplicate-application check on the backend is now scoped
 * to (project, applicant). A user can apply to as many different projects
 * as they like — only applying twice to the SAME project is blocked.
 */
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
    mutationFn: async ({
      projectId,
      requestId,
    }: {
      projectId: number | string;
      requestId: number;
    }) => {
      const res = await collaborationAPI.acceptRequest(projectId, requestId);
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['pending-collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['collaboration-requests-count', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-collaborations'] });
      qc.invalidateQueries({ queryKey: ['accepted-collaborations'] });
    },
  });
};

export const useRejectCollaborationRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      requestId,
    }: {
      projectId: number | string;
      requestId: number;
    }) => {
      const res = await collaborationAPI.rejectRequest(projectId, requestId);
      return res.data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['pending-collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['collaboration-requests-count', vars.projectId] });
    },
  });
};

/**
 * Accept multiple requests in parallel (batch owner action).
 */
export const useBatchAcceptCollaborationRequests = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      projectId,
      requestIds,
    }: {
      projectId: number | string;
      requestIds: number[];
    }) => {
      const results = await Promise.all(
        requestIds.map((id) => collaborationAPI.acceptRequest(projectId, id))
      );
      return results.map((r) => r.data);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['pending-collaboration-requests', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['collaboration-requests-count', vars.projectId] });
      qc.invalidateQueries({ queryKey: ['my-collaborations'] });
      qc.invalidateQueries({ queryKey: ['accepted-collaborations'] });
    },
  });
};