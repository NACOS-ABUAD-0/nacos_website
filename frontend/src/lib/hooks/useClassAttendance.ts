import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { classAttendanceAPI } from '../api';

export interface ClassAttendanceRecord {
  id: number;
  student: {
    id: number;
    email: string;
    full_name: string;
    matric_number: string | null;
    is_staff: boolean;
    role: string;
  };
  scanned_at: string;
}

export interface ClassSessionSummary {
  id: number;
  course_code: string;
  token: string;
  opened_at: string;
  closed_at: string | null;
  is_open: boolean;
  attendee_count: number;
}

export interface ClassSessionDetail extends ClassSessionSummary {
  attendances: ClassAttendanceRecord[];
}

export interface ScanResult {
  status: 'recorded' | 'already_recorded';
  course_code: string;
}

export const useClassSessions = (courseCode?: string) =>
  useQuery({
    queryKey: ['class-sessions', courseCode],
    queryFn: async () => {
      const response = await classAttendanceAPI.getSessions(courseCode);
      return (response.data as ClassSessionSummary[]) ?? [];
    },
  });

export const useClassSession = (id: string | number) =>
  useQuery({
    queryKey: ['class-session', id],
    queryFn: () => classAttendanceAPI.getSession(id).then(r => r.data as ClassSessionDetail),
    enabled: !!id,
    // Live "N scanned" count while the session is open — same polling
    // pattern used by the event check-in screen. Stops once closed.
    refetchInterval: (query) => (query.state.data?.is_open ? 5000 : false),
  });

export const useCreateClassSession = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (courseCode: string) =>
      classAttendanceAPI.createSession(courseCode).then(r => r.data as ClassSessionDetail),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['class-sessions'] });
    },
  });
};

export const useCloseClassSession = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string | number) =>
      classAttendanceAPI.closeSession(id).then(r => r.data as ClassSessionDetail),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: ['class-session', id] });
      qc.invalidateQueries({ queryKey: ['class-sessions'] });
    },
  });
};

export const useScanAttendance = () =>
  useMutation({
    mutationFn: (token: string) => classAttendanceAPI.scan(token).then(r => r.data as ScanResult),
  });
