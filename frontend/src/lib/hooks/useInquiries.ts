// src/lib/hooks/useInquiries.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';

export type InquiryType = 'general' | 'sponsorship' | 'partnership' | 'recruitment';
export type InquiryStatus = 'new' | 'read' | 'responded' | 'archived';

export interface Inquiry {
  id: number;
  type: InquiryType;
  name: string;
  email: string;
  organization: string;
  subject: string;
  message: string;
  budget_range: string;
  package_interest: string;
  website_url: string;
  status: InquiryStatus;
  admin_notes: string;
  created_at: string;
  updated_at: string;
}

const toArray = (data: any): Inquiry[] =>
  Array.isArray(data) ? data : (data?.results ?? []);

// Public — submit an inquiry (no auth needed)
export const useSubmitInquiry = () =>
  useMutation({
    mutationFn: (data: Partial<Inquiry>) =>
      api.post('/inquiries/', data).then(r => r.data),
  });

// Admin — list all inquiries
export const useInquiries = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['inquiries', params],
    queryFn: () => api.get('/inquiries/', { params }).then(r => toArray(r.data)),
  });

// Admin — update status / notes
export const useUpdateInquiryStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, admin_notes }: { id: number; status: InquiryStatus; admin_notes?: string }) =>
      api.patch(`/inquiries/${id}/update_status/`, { status, admin_notes }).then(r => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiries'] }),
  });
};

// Admin — delete
export const useDeleteInquiry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.delete(`/inquiries/${id}/`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['inquiries'] }),
  });
};