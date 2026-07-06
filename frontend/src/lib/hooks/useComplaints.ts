// src/lib/hooks/useComplaints.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { complaintsAPI } from '../api';
import { extractPaginatedData } from '../utils/pagination';

export interface ComplaintData {
  id: number;
  subject: string;
  message: string;
  is_anonymous: boolean;
  status: 'new' | 'in_progress' | 'resolved' | 'dismissed';
  created_at: string;
}

export const useMyComplaints = () => {
  return useQuery<ComplaintData[]>({
    queryKey: ['my-complaints'],
    queryFn: async () => {
      const res = await complaintsAPI.getMyComplaints();
      return extractPaginatedData<ComplaintData>(res.data);
    },
  });
};

export const useSubmitComplaint = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      subject: string;
      message: string;
      is_anonymous: boolean;
    }) => {
      const res = await complaintsAPI.submit(payload);
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-complaints'] });
    },
  });
};
