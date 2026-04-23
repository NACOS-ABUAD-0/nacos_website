// src/lib/hooks/useStudentProfile.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { studentAPI } from '../api';

export interface StudentProfileData {
  id: number;
  full_name: string;
  email: string;
  matric_number: string;
  department: string;
  level: string;
  phone_number: string;
  last_synced_at: string;
  created_at: string;
}

export const useStudentProfile = () => {
  return useQuery<StudentProfileData>({
    queryKey: ['student-profile'],
    queryFn: async () => {
      const res = await studentAPI.getProfile();
      return res.data;
    },
    staleTime: 5 * 60 * 1000,
  });
};

export const useUpdateStudentProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<StudentProfileData>) => {
      const res = await studentAPI.updateProfile(data);
      return res.data as StudentProfileData;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student-profile'] });
    },
  });
};