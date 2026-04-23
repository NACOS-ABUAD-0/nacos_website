// src/lib/hooks/useCommittees.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { committeesAPI } from '../api';
import { extractPaginatedData } from '../utils/pagination';

export interface CommitteeData {
  id: number;
  name: string;
  description: string;
  created_at: string;
}

export interface CommitteeApplicationData {
  id: number;
  committee: CommitteeData;
  phone_number: string;
  reason: string;
  offer: string;
  status: 'pending' | 'approved' | 'rejected';
  admin_note: string;
  created_at: string;
}

export const useCommittees = () => {
  return useQuery<CommitteeData[]>({
    queryKey: ['committees'],
    queryFn: async () => {
      const res = await committeesAPI.getAll();
      return extractPaginatedData<CommitteeData>(res.data);
    },
  });
};

export const useCommitteeApplications = () => {
  return useQuery<CommitteeApplicationData[]>({
    queryKey: ['committee-applications'],
    queryFn: async () => {
      const res = await committeesAPI.getMyApplications();
      return extractPaginatedData<CommitteeApplicationData>(res.data);
    },
  });
};

export const useApplyCommittee = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      committee_id: number;
      phone_number: string;
      reason: string;
      offer: string;
    }) => {
      const res = await committeesAPI.apply(payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['committee-applications'] });
    },
  });
};