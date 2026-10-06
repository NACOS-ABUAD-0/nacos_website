// src/pages/event-detail.tsx  — uses real API data
import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "react-hot-toast";
import {
  formatNaira,
  useEvent,
  useMyRegistration,
  useRegisterForEvent,
  useVerifyPayment,
} from "../lib/hooks/useEvents";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { optimizeImage } from "../lib/cloudinary";
import { EventDetailSkeleton } from "../components/home/Skeletons";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(id!);
  const { isAuthenticated } = useAuth();
  const { data: registration, isLoading: registrationLoading } = useMyRegistration(id!, isAuthenticated);
  const registerMutation = useRegisterForEvent();
  const verifyMutation = useVerifyPayment();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTypeId, setSelectedTypeId] = useState<number | null>(null);
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [justPaid, setJustPaid] = useState(false);
  const verifiedReference = useRef<string | null>(null);

  // Paystack sends the buyer back here with ?reference=...; confirm it with the server once.
  const returnedReference = searchParams.get("reference");
  useEffect(() => {
    if (!returnedReference || verifiedReference.current === returnedReference) return;
    verifiedReference.current = returnedReference;
    verifyMutation.mutate(
      { eventId: id!, reference: returnedReference },
      {
        onSuccess: (data) => {
          if (data.status === "confirmed") {
            toast.success("Payment successful! Check your email for your ticket.", { duration: 8000 });
            // Guests have no account to come back to, so take them to their ticket page.
            if (!isAuthenticated && data.token) navigate(`/tickets/${data.token}?paid=1`);
            else setJustPaid(true);
          } else if (data.payment_status === "failed" || data.payment_status === "abandoned")
            toast.error("The payment didn't go through. You can try again.");
          else toast("Payment is still processing. Refresh in a minute.", { icon: "⏳" });
        },
        onError: () => toast.error("We couldn't confirm the payment yet. Please refresh in a moment."),
        onSettled: () => setSearchParams({}, { replace: true }),
      }
    );
  }, [returnedReference, isAuthenticated, id, verifyMutation, setSearchParams, navigate]);

  if (isLoading) return <EventDetailSkeleton />;

  if (error || !event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F5F7FA]">
        <h2 className="text-2xl font-bold text-[#006E3A]">Event not found</h2>
        <button onClick={() => navigate("/events")} className="mt-4 text-gray-600 underline">
          Return to Events
        </button>
      </div>
    );
  }

  // Icons
  const CalendarIcon = () => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const LocationIcon = () => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const ticketTypes = event.ticket_types ?? [];
  const availableTypes = ticketTypes.filter((t) => !t.sold_out);
  const selectedType =
    ticketTypes.find((t) => t.id === selectedTypeId) ?? (availableTypes.length === 1 ? availableTypes[0] : null);
  const needsChoice = ticketTypes.length > 1 && !selectedType;
  const isClosed = event.status === "completed";
  const isSoldOut = event.sold_out || (ticketTypes.length > 0 && availableTypes.length === 0);

  const isOpenEvent = event.audience === "public";
  const isGuest = !isAuthenticated && isOpenEvent;

  const handleGetTicket = () => {
    if (needsChoice) return void toast.error("Choose a ticket type first.");
    if (isGuest) {
      if (guestName.trim().length < 2) return void toast.error("Enter your full name.");
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) return void toast.error("Enter a valid email address.");
    }
    registerMutation.mutate(
      {
        eventId: id!,
        ticketTypeId: selectedType?.id ?? null,
        ...(isGuest ? { name: guestName.trim(), email: guestEmail.trim() } : {}),
      },
      {
        onSuccess: (data) => {
          if (data.checkout_url) window.location.href = data.checkout_url;
          else if (isGuest && data.token) {
            toast.success("You're in! We've also emailed your ticket.");
            navigate(`/tickets/${data.token}`);
          } else toast.success("You're in! Your QR code is ready.");
        },
        onError: (error: unknown) => {
          const data = (error as { response?: { data?: { detail?: string; code?: string; name?: string[]; email?: string[] } } })
            ?.response?.data;
          const message = data?.detail ?? data?.name?.[0] ?? data?.email?.[0];
          toast.error(message ?? "Couldn't get your ticket. Please try again.", {
            duration: data?.code === "ticket_already_issued" ? 8000 : 4000,
          });
        },
      }
    );
  };

  const buttonLabel = () => {
    if (isClosed) return "Registration closed";
    if (isSoldOut) return "Sold out";
    if (registerMutation.isPending) return "Please wait…";
    if (selectedType && Number(selectedType.price) > 0) return `Pay ${formatNaira(Number(selectedType.price))}`;
    return ticketTypes.length ? "Get free ticket" : "Join Event";
  };

  const EmailIcon = () => (
    <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );

  return (
    <div className="min-h-screen flex flex-col bg-white">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row">
        {/* LEFT: details */}
        <section className="w-full lg:w-1/2 p-8 lg:p-20 bg-[#F9FAFB] flex flex-col justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#006E3A] font-medium mb-8 hover:-translate-x-1 transition-transform"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>

          <span
            className={`inline-block px-4 py-1.5 rounded-full text-xs font-bold mb-6 w-fit ${
              event.status === "upcoming"
                ? "bg-blue-50 text-blue-700 border border-blue-200"
                : event.status === "ongoing"
                ? "bg-green-50 text-green-700 border border-green-200"
                : "bg-gray-50 text-gray-600 border border-gray-200"
            }`}
          >
            {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
          </span>

          <h1 className="text-4xl lg:text-5xl xl:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
            {event.title}
          </h1>

          {event.description && (
            <p className="text-gray-600 mb-8 leading-relaxed text-lg">{event.description}</p>
          )}

          <div className="space-y-5 mb-12">
            <div className="flex items-center gap-4">
              <CalendarIcon />
              <p className="text-gray-700 font-medium">
                {new Date(event.start_time).toLocaleDateString(undefined, {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <ClockIcon />
              <p className="text-gray-700 font-medium">
                {new Date(event.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {event.end_time &&
                  ` – ${new Date(event.end_time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <LocationIcon />
              <p className="text-gray-700 font-medium">
                {event.is_remote ? "Remote / Online" : event.location}
              </p>
            </div>
            {event.contact_email && (
              <div className="flex items-center gap-4">
                <EmailIcon />
                <a
                  href={`mailto:${event.contact_email}`}
                  className="font-medium text-[#006E3A] hover:underline"
                >
                  {event.contact_email}
                </a>
              </div>
            )}
          </div>

          {/* Ticket types and prices */}
          {ticketTypes.length > 0 && !(registration && registration.status === "confirmed") && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Tickets</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {ticketTypes.map((t) => {
                  const selected = selectedType?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      disabled={t.sold_out || isClosed}
                      onClick={() => setSelectedTypeId(t.id)}
                      aria-pressed={selected}
                      className={`text-left rounded-xl border-2 px-4 py-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                        selected ? "border-[#006E3A] bg-green-50" : "border-gray-200 bg-white hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-gray-900">{t.name}</span>
                        <span className="font-bold text-[#006E3A]">{formatNaira(Number(t.price))}</span>
                      </div>
                      {t.venue && <p className="text-xs text-gray-600 mt-1">📍 {t.venue}</p>}
                      <p className="text-xs text-gray-500 mt-1">
                        {t.sold_out
                          ? "Sold out"
                          : t.tickets_remaining != null && t.tickets_remaining <= 20
                          ? `${t.tickets_remaining} left`
                          : "Available"}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* In-app ticket + QR check-in */}
          <div className="mt-2">
            {verifyMutation.isPending ? (
              <div className="flex items-center gap-3 text-gray-600">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-[#006E3A] rounded-full animate-spin" />
                <span>Confirming your payment…</span>
              </div>
            ) : !isAuthenticated && !isOpenEvent ? (
              <p className="text-gray-600">
                This event is for NACOS members.{" "}
                <Link to="/login" className="text-[#006E3A] font-semibold hover:underline">
                  Log in
                </Link>{" "}
                to get your ticket and QR code.
              </p>
            ) : isGuest ? (
              <div className="flex flex-col gap-3 w-full lg:max-w-md">
                <p className="text-sm text-gray-600">
                  No account needed. Enter your details and we'll email your ticket. One ticket per email address.
                </p>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Full name"
                  autoComplete="name"
                  disabled={isClosed || isSoldOut}
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#006E3A]"
                />
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="Email address"
                  autoComplete="email"
                  disabled={isClosed || isSoldOut}
                  className="border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:border-[#006E3A]"
                />
                <button
                  onClick={handleGetTicket}
                  disabled={registerMutation.isPending || isClosed || isSoldOut}
                  className="inline-flex items-center justify-center gap-2 w-full px-8 py-4 bg-[#006E3A] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all uppercase tracking-wide disabled:opacity-50"
                >
                  {buttonLabel()}
                </button>
                <p className="text-xs text-gray-500">
                  Have a NACOS account?{" "}
                  <Link to="/login" className="text-[#006E3A] font-semibold hover:underline">Log in</Link> instead.
                </p>
              </div>
            ) : registrationLoading ? (
              <div className="w-8 h-8 border-2 border-gray-300 border-t-[#006E3A] rounded-full animate-spin" />
            ) : registration && registration.status === "pending_payment" && registration.checkout_url ? (
              <div className="bg-white border border-amber-200 rounded-xl p-6 w-full lg:w-fit">
                <p className="font-semibold text-gray-900 mb-1">Payment pending</p>
                <p className="text-sm text-gray-600 mb-4">
                  Your {registration.ticket_type?.name ?? ""} ticket is held until{" "}
                  {new Date(registration.hold_expires_at!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}.
                  Complete the payment to get your QR code.
                </p>
                <a
                  href={registration.checkout_url}
                  className="inline-flex items-center justify-center px-6 py-3 bg-[#006E3A] text-white font-bold rounded-xl hover:shadow-md"
                >
                  Complete payment
                </a>
              </div>
            ) : registration && registration.status === "confirmed" && registration.token ? (
              <div className="flex flex-col gap-4 w-full lg:w-fit">
              {justPaid && (
                <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-5 py-4" role="status">
                  <p className="font-bold">Payment successful 🎉</p>
                  <p className="text-sm mt-1">
                    Check your email for your ticket. We've sent it to your inbox (look in spam if it isn't there).
                  </p>
                </div>
              )}
              <div className="bg-white border border-gray-200 rounded-xl p-6 w-fit">
                {registration.ticket_type && (
                  <div className="mb-3">
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#006E3A] text-white uppercase">
                      {registration.ticket_type.name}
                    </span>
                    {registration.ticket_type.venue && (
                      <p className="text-sm text-gray-700 mt-2">📍 {registration.ticket_type.venue}</p>
                    )}
                  </div>
                )}
                {registration.checked_in_at ? (
                  <span className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                    Checked in at{" "}
                    {new Date(registration.checked_in_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                ) : (
                  <p className="text-sm text-gray-600 mb-4">Show this QR code at the event for check-in.</p>
                )}
                <QRCodeSVG value={registration.token} size={180} />
                {registration.short_code && (
                  <p className="text-sm text-gray-500 mt-3 text-center">
                    Ticket code{" "}
                    <span className="font-mono font-bold tracking-widest text-gray-900">{registration.short_code}</span>
                  </p>
                )}
              </div>
              </div>
            ) : (
              <button
                onClick={handleGetTicket}
                disabled={registerMutation.isPending || isClosed || isSoldOut}
                className="inline-flex items-center justify-center gap-2 w-full lg:w-auto px-8 py-4 bg-[#006E3A] text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all uppercase tracking-wide disabled:opacity-50 disabled:hover:scale-100"
              >
                {buttonLabel()}
              </button>
            )}
          </div>
        </section>

        {/* RIGHT: poster */}
        <section className="w-full lg:w-1/2 min-h-[400px] lg:h-auto overflow-hidden bg-gray-100">
          {event.media?.poster ? (
            <img
              src={optimizeImage(event.media.poster, 1200)}
              className="w-full h-full object-cover"
              alt={event.title}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50">
              <svg className="w-20 h-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}