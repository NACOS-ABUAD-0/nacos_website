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
  // null for guests on open events; name/email are always set.
  user: AdminEventRegistrationUser | null;
  name: string;
  email: string;
  short_code: string;
  status: 'pending_payment' | 'confirmed' | 'cancelled';
  ticket_type: { id: number; name: string; price: number; venue: string } | null;
  amount_paid: number;
  checked_in_at: string | null;
  checked_in_by: AdminEventRegistrationUser | null;
  created_at: string;
}

export interface CheckInResult {
  status: 'checked_in' | 'already_checked_in' | 'not_paid' | 'cancelled';
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

// Counts are tickets; money is in naira. "booked" = confirmed tickets (free and paid).
export interface SalesFigures {
  booked: number;
  checked_in: number;
  // Started checkout, seat held, payment not confirmed yet.
  awaiting_payment: number;
  // Successful Paystack payments, including duplicates not yet refunded.
  paid: number;
  revenue: number;
  fees: number;
  net: number;
  refunded: number;
  refunded_amount: number;
  needs_attention: number;
  capacity: number | null;
  remaining: number | null;
}

export interface TicketTypeSales extends SalesFigures {
  // null for "General admission" (no ticket types) or tickets whose type was deleted.
  id: number | null;
  name: string;
  price: number | null;
}

export interface EventSales {
  event: number;
  totals: SalesFigures;
  ticket_types: TicketTypeSales[];
  generated_at: string;
}

export const useEventSales = (eventId: string | number) =>
  useQuery({
    queryKey: ['event-sales', eventId],
    queryFn: () => adminAttendanceAPI.getSales(eventId).then(r => r.data as EventSales),
    enabled: !!eventId,
    // Same polling as the roster: a new booking or payment shows up within a few seconds.
    refetchInterval: 5000,
  });

export const useCheckIn = (eventId: string | number) => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (registrationId: number) =>
      adminAttendanceAPI.checkIn(registrationId).then(r => r.data as CheckInResult),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['event-registrations', eventId] });
      qc.invalidateQueries({ queryKey: ['event-sales', eventId] });
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
      qc.invalidateQueries({ queryKey: ['event-sales', eventId] });
    },
  });
};
