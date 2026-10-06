import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';
import { api } from '../api';

/**
 * =========================
 * TYPES
 * =========================
 */

export type EventAudience = 'nacos_only' | 'public';

// A kind of ticket (e.g. Regular, VIP). Price is in naira; 0 means free.
export interface TicketType {
  id: number;
  name: string;
  price: number;
  capacity: number | null;
  // Blank means the event's own location.
  venue: string;
  tickets_remaining: number | null;
  sold_out: boolean;
}

// What the admin form sends; omit id for a new type.
export interface TicketTypeInput {
  id?: number;
  name: string;
  price: number;
  capacity: number | null;
  venue: string;
}

// What backend RETURNS
export interface Event {
  id: number;
  title: string;
  status: 'upcoming' | 'ongoing' | 'completed';
  start_time: string;
  end_time: string | null;
  is_remote: boolean;
  location: string;
  poster_url: string;
  description: string;
  registration_url: string;
  contact_email: string;
  capacity: number | null;
  // nacos_only: must sign in. public: name + email, no account needed (one ticket per email).
  audience: EventAudience;
  ticket_types: TicketType[];
  is_paid: boolean;
  price_from: number;
  tickets_remaining: number | null;
  sold_out: boolean;
  is_published: boolean;
  media: { poster: string | null };
  created_at: string;
  updated_at: string;
}

// What backend ACCEPTS on CREATE
export interface CreateEventDTO {
  title: string;
  start_time: string;
  end_time?: string | null;
  is_remote: boolean;
  location: string;
  poster_url: string;
  description: string;
  contact_email: string;
  capacity: number | null;
  audience: EventAudience;
  ticket_types: TicketTypeInput[];
  is_published: boolean;
}

// Pagination type
interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

/**
 * =========================
 * QUERIES
 * =========================
 */

export const useEvents = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['events', params],
    queryFn: async () => {
      const response = await api.get('/events/', { params });
      return (response.data as PaginatedResponse<Event>)?.results ?? [];
    },
    placeholderData: keepPreviousData,
  });

export const useEvent = (id: string | number) =>
  useQuery({
    queryKey: ['event', id],
    queryFn: () => api.get(`/events/${id}/`).then(r => r.data as Event),
    enabled: !!id,
  });

export const useUpcomingEvents = (params: Record<string, unknown> = {}) =>
  useQuery({
    queryKey: ['upcoming-events', params],
    queryFn: async () => {
      const response = await api.get('/events/', {
        params: { ...params, status: 'upcoming' },
      });
      return (response.data as PaginatedResponse<Event>)?.results ?? [];
    },
    placeholderData: keepPreviousData,
  });

/**
 * =========================
 * MUTATIONS
 * =========================
 */

export const useCreateEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateEventDTO) =>
      api.post('/events/', data).then(r => r.data as Event),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
};

export const useUpdateEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CreateEventDTO> }) =>
      api.patch(`/events/${id}/`, data).then(r => r.data as Event),

    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['event', id] });
      qc.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
};

export const useDeleteEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.delete(`/events/${id}/`),

    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['events'] });
      qc.invalidateQueries({ queryKey: ['upcoming-events'] });
    },
  });
};

/**
 * =========================
 * ATTENDANCE (student-facing registration)
 * =========================
 */

export interface EventRegistration {
  id: number;
  // null until a paid ticket is paid for — no QR before then.
  token: string | null;
  // Typed at the gate if the QR won't scan, e.g. "K7QF-3M2P". null until paid.
  short_code: string | null;
  status: 'pending_payment' | 'confirmed';
  // venue is the ticket type's own venue, or the event location.
  ticket_type: { id: number; name: string; price: number; venue: string } | null;
  amount_paid: number;
  hold_expires_at: string | null;
  checked_in_at: string | null;
  created_at: string;
  // Paystack checkout to continue while payment is pending.
  checkout_url: string | null;
  reference: string | null;
  payment_status?: 'pending' | 'successful' | 'failed' | 'abandoned';
}

export const useMyRegistration = (eventId: string | number, enabled: boolean = true) =>
  useQuery({
    queryKey: ['event-registration', eventId],
    queryFn: async () => {
      try {
        const response = await api.get(`/events/${eventId}/my-registration/`);
        return response.data as EventRegistration;
      } catch (err: any) {
        if (err?.response?.status === 404) return null;
        throw err;
      }
    },
    enabled: !!eventId && enabled,
  });

export const useRegisterForEvent = () => {
  const qc = useQueryClient();

  return useMutation({
    // name/email are only read for guests on open events; signed-in users use their account.
    mutationFn: ({ eventId, ticketTypeId, name, email }: {
      eventId: string | number;
      ticketTypeId?: number | null;
      name?: string;
      email?: string;
    }) =>
      api
        .post(`/events/${eventId}/register/`, {
          ...(ticketTypeId ? { ticket_type: ticketTypeId } : {}),
          ...(name !== undefined ? { name, email } : {}),
        })
        .then(r => r.data as EventRegistration),

    onSuccess: (data, { eventId }) => {
      qc.setQueryData(['event-registration', eventId], data);
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
};

// Called when Paystack sends the buyer back to the event page with ?reference=...
export const useVerifyPayment = () => {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ reference }: { eventId: string | number; reference: string }) =>
      api
        .get(`/payments/paystack/verify/${encodeURIComponent(reference)}/`)
        .then(r => r.data as EventRegistration),

    onSuccess: (data, { eventId }) => {
      qc.setQueryData(['event-registration', eventId], data);
      qc.invalidateQueries({ queryKey: ['event', eventId] });
    },
  });
};

// The holder's ticket page, opened from the emailed link — no sign-in needed.
export interface EventTicket extends EventRegistration {
  name: string;
  email: string;
  event: {
    id: number;
    title: string;
    start_time: string;
    end_time: string | null;
    location: string;
    is_remote: boolean;
    poster: string | null;
  };
}

export const useTicket = (token: string) =>
  useQuery({
    queryKey: ['event-ticket', token],
    queryFn: () => api.get(`/event-tickets/${token}/`).then(r => r.data as EventTicket),
    enabled: !!token,
    retry: false,
  });

export const formatNaira = (amount: number): string =>
  amount > 0
    ? `₦${Number(amount).toLocaleString('en-NG', { maximumFractionDigits: 2 })}`
    : 'Free';