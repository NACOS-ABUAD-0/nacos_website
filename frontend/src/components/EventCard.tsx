import { Link } from "react-router-dom";

// ✅ Correct Event type based on backend
export type EventStatus = "upcoming" | "ongoing" | "completed";

export interface Event {
  id: number;
  title: string;
  start_time: string;
  end_time?: string | null;
  location: string;
  is_remote: boolean;
  poster_url?: string;
  description?: string;
  registration_url?: string;
  contact_email?: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  status: EventStatus;
  media?: {
      poster?: string | null;
      };
}

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  // Icons
  const CalendarIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const LocationIcon = () => (
    <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );

  const ArrowRightIcon = () => (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group flex flex-col h-full">
      {/* Poster */}
      {event.poster_url ? (
        <div className="relative overflow-hidden aspect-square bg-gray-100">
          <img
            src={event.poster_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />

          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span
              className={`px-3 py-1.5 text-xs font-semibold rounded-full backdrop-blur-sm bg-white/90 shadow-sm ${
                event.status === "upcoming"
                  ? "text-green-700 border border-green-200"
                  : event.status === "ongoing"
                  ? "text-blue-700 border border-blue-200"
                  : "text-gray-600 border border-gray-200"
              }`}
            >
              {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
            </span>
          </div>
        </div>
      ) : (
        <div className="aspect-square flex items-center justify-center bg-gray-50">
          <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      )}

      {/* Content */}
      <div className="p-5 flex flex-col flex-grow bg-white">
        <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 tracking-tight">
          {event.title}
        </h3>

        {/* Date & Time */}
        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-1">
          <div className="flex items-center gap-1.5">
            <CalendarIcon />
            <span className="font-medium">
              {new Date(event.start_time).toLocaleDateString([], {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <ClockIcon />
            <span>
              {new Date(event.start_time).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        </div>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-gray-600 mb-4">
          <LocationIcon />
          <span className="truncate">
            {event.is_remote ? "Remote Event" : event.location}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between gap-3 mt-auto pt-1">
          <Link
            to={`/events/${event.id}`}
            className="text-green-600 hover:text-green-700 font-semibold text-sm inline-flex items-center gap-1 transition-all"
          >
            Learn More
            <ArrowRightIcon />
          </Link>

          {event.status === "upcoming" && (
            <Link
              to={`/register/${event.id}`}
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-teal-600 text-white text-xs font-bold rounded-lg hover:shadow-md hover:scale-105 transition-all tracking-wide whitespace-nowrap"
            >
              Register Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};