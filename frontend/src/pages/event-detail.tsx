// src/pages/event-detail.tsx  — uses real API data
import { useParams, useNavigate } from "react-router-dom";
import { useEvent } from "../lib/hooks/useEvents";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { EventDetailSkeleton } from "../components/home/Skeletons";

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: event, isLoading, error } = useEvent(id!);

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

          {event.status === "upcoming" && event.registration_url && (
            <a
              href={event.registration_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 w-full lg:w-auto px-8 py-4 bg-gradient-to-r from-green-600 to-teal-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] transition-all uppercase tracking-wide"
            >
              Register for this event
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </a>
          )}
        </section>

        {/* RIGHT: poster */}
        <section className="w-full lg:w-1/2 min-h-[400px] lg:h-auto overflow-hidden bg-gray-100">
          {event.media?.poster ? (
            <img
              src={event.media.poster}
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