import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminAttendanceAPI } from '../api';

export interface AdminEventRegistrationUser {
  id: number;
  email: string;
  full_name: string;
  matric_number: string | null;
  is_staff: boolean;
  role: string;
}

export interface AdminEventRegistration {
  id: number;
  user: AdminEventRegistrationUser;
  token: string;
  checked_in_at: string | null;
  checked_in_by: AdminEventRegistrationUser | null;
  created_at: string;
}

export interface CheckInResult {
  status: 'checked_in' | 'already_checked_in';
  registration: AdminEventRegistration;
}

export const useEventRegistrations = (eventId: string | number, search = '') =>
  useQuery({
    queryKey: ['event-registrations', eventId, search],
    queryFn: async () => {
      const response = await adminAttendanceAPI.getRegistrations(eventId, search);
      return (response.data as AdminEventRegistration[]) ?? [];
    },
    enabled: !!eventId,
    // Lightweight polling for a "live" checked-in count on the check-in screen —
    // no websocket/SSE infra exists anywhere else in this codebase.
    refetchInterval: 5000,
  });

export const useCheckIn = (eventId: string | number) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: number) =>
      adminAttendanceAPI.checkIn(registrationId).then(r => r.data as CheckInResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-registrations', eventId] });
    },
  });
};

export const useCheckInByToken = (eventId: string | number) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (token: string) =>
      adminAttendanceAPI.checkInByToken(eventId, token).then(r => r.data as CheckInResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-registrations', eventId] });
    },
  });
};
