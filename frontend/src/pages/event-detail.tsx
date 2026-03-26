import { useParams, useNavigate } from "react-router-dom";
import { useUpcomingEvents } from "../lib/hooks/useHomepage";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { EventDetailSkeleton } from "../components/home/Skeletons";

export default function EventDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  interface Event {
    id: number;
    title: string;
    status: "upcoming" | "ongoing" | "completed";
    start_time: string; // ISO date string (e.g., "2026-04-10T10:00:00Z")
    end_time: string; // ISO date string
    is_remote: boolean;
    location: string;
    media: {
      poster: string | null;
    };
  }

  const Mockevents: Event[] = [
    {
      id: 1,
      title: "Tech Innovation Summit",
      status: "upcoming",
      start_time: "2026-04-10T10:00:00Z",
      end_time: "2026-04-10T16:00:00Z",
      is_remote: false,
      location: "ABUAD Main Auditorium",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 2,
      title: "Frontend Masterclass",
      status: "upcoming",
      start_time: "2026-04-18T14:00:00Z",
      end_time: "2026-04-18T17:00:00Z",
      is_remote: true,
      location: "Zoom",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 3,
      title: "Hackathon 2026",
      status: "upcoming",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 4,
      title: "Hackathon 2026",
      status: "upcoming",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 5,
      title: "Hackathon 2026",
      status: "upcoming",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 6,
      title: "Hackathon 2026",
      status: "upcoming",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 7,
      title: "Hackathon 2026",
      status: "completed",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 8,
      title: "Hackathon 2026",
      status: "completed",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
    {
      id: 9,
      title: "Hackathon 2026",
      status: "ongoing",
      start_time: "2026-05-02T09:00:00Z",
      end_time: "2026-05-04T18:00:00Z",
      is_remote: false,
      location: "Engineering Complex, ABUAD",
      media: {
        poster: "/events/dev.jpeg",
      },
    },
  ];

  // 1. Fetch data from your hook
  const { data: events, isLoading: eventsLoading } = useUpcomingEvents();

  // 2. Find specific event
  const event = Mockevents?.find((e: any) => e.id === Number(id));

  // 3. Loading State (Skeleton)
  if (eventsLoading) {
    return <EventDetailSkeleton />;
  }

  // 4. Error/Not Found State
  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#E8F4F8]">
        <h2 className="text-2xl font-bold text-[#006E3A]">Event not found</h2>
        <button
          onClick={() => navigate("/events")}
          className="mt-4 text-gray-600 underline"
        >
          Return to Events
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-grow flex flex-col lg:flex-row p-5 lg:p-10">
        {/* LEFT HALF: DETAILS */}
        <section className="w-full lg:w-1/2 p-8 lg:p-20 bg-[#E8F4F8] flex flex-col justify-center">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[#006E3A] font-bold mb-8 hover:translate-x-[-5px] transition-transform"
          >
            ← Back
          </button>

          <h1 className="text-4xl lg:text-6xl font-bold text-black mb-6 uppercase tracking-tight">
            {event.title}
          </h1>

          <div className="space-y-6 mb-10">
            <div className="flex items-center gap-4 text-gray-700">
              <span className="text-xl">📅</span>
              <p className="font-medium">
                {new Date(event.start_time).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-4 text-gray-700">
              <span className="text-xl">⏰</span>
              <p className="font-medium">
                {new Date(event.start_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" - "}
                {new Date(event.end_time).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <div className="flex items-center gap-4 text-gray-700">
              <span className="text-xl">📍</span>
              <p className="font-medium">
                {event.is_remote ? "Remote" : event.location}
              </p>
            </div>
          </div>

          {event.status === "upcoming" && (
            <button className="w-full lg:w-fit px-10 py-4 bg-[#006E3A] text-white font-bold rounded-xl shadow-lg hover:bg-green-800 transition-all uppercase">
              Register Now
            </button>
          )}
        </section>

        {/* RIGHT HALF: POSTER */}
        <section className="w-full lg:w-1/2 min-h-[400px] lg:h-auto overflow-hidden">
          <img
            src={event.media.poster || "/placeholder.jpg"}
            className="w-full h-full object-cover"
            alt="Event Poster"
          />
        </section>
      </main>
      <Footer />
    </div>
  );
}
