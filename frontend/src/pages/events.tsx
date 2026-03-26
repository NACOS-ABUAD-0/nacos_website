import { Section } from "../components/home/Section";
import { useUpcomingEvents } from "../lib/hooks/useHomepage";
import { EventCardSkeleton } from "../components/home/Skeletons";
import { Link } from "react-router-dom";

interface Event {
  id: string;
  title: string;
  theme: string;
  organizer: string;
  eventType: string;
  tagline: string;
  limits: number;
  status: "Open" | "Closed" | "Upcoming"; // better than plain string
  registration: {
    startDate: string; // ISO format: YYYY-MM-DD
    endDate: string;
    isOpenToEveryone: boolean;
    registrationLink: string;
    qrCode: string;
  };
  contact: {
    inquiries: string[];
  };
  media: {
    poster: string;
  };
}

interface EventProps {
  isHome: boolean; // The name of the prop and its type
}

const event: Event[] = [
  {
    id: "devcon-2026",
    title: "DEVCON 2026 Hackathon – Beyond the Boundaries",
    theme: "Beyond the Boundaries",
    organizer: "ACM ABUAD Chapter",
    eventType: "Hackathon",
    tagline: "Build, break barriers, and innovate beyond the conventional.",
    limits: 404,
    status: "Open",
    registration: {
      startDate: "2026-02-14",
      endDate: "2026-02-28",
      isOpenToEveryone: true,
      registrationLink: "https://devcon2026.netlify.app/",
      qrCode: "/images/devcon-qr.png",
    },
    contact: {
      inquiries: ["09068640110", "09038231348"],
    },
    media: {
      poster: "/events/dev.jpeg",
    },
  },
];

export default function Events({ isHome }: EventProps) {
  const {
    data: events,
    isLoading: eventsLoading,
    error: eventsError,
    refetch: refetchEvents,
  } = useUpcomingEvents();
  console.log(events);
  
  return (
    <Section
      title="Upcoming Events"
      subtitle="Workshops, hackathons, and networking opportunities"
      ctaText="See all events"
      ctaLink="/events"
      id="events"
    >
      {eventsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[...Array(3)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        // ) : eventsError ? (
        //   <div className="text-center py-12">
        //     <p className="text-gray-500 mb-4">Failed to load events</p>
        //     <button
        //       onClick={() => refetchEvents()}
        //       className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
        //     >
        //       Try Again
        //     </button>
        //   </div>
        // ) : events?.results?.length === 0 ? (
        //   <div className="text-center py-12">
        //     <p className="text-gray-500">No upcoming events scheduled</p>
        //   </div>
        <>
          <section
            className={`${isHome ? "grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto" : "grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto"}`}
            id="top"
          >
            {/* {displayData.map((exec) => (
              <EventsCard key={exec.id} {...exec} />
            ))} */}
          </section>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {event?.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
              >
                {event.media.poster ? (
                  <div className="relative overflow-hidden w-full max-w-[500px] aspect-[426/463]">
                    <img
                      src={event.media.poster}
                      alt={event.title}
                      className="w-full h-full rounded-t-[10px] object-cover"
                      loading="lazy"
                    />
                    {/* <div className="absolute top-4 right-4">
                                  {event.is_remote ? (
                                    <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                      Remote
                                    </span>
                                  ) : (
                                    <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                                      In-person
                                    </span>
                                  )}
                                </div> */}
                  </div>
                ) : (
                  <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
                    <svg
                      className="w-10 h-10 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                )}

                <div className="p-6 bg-[#E8F4F8]">
                  <h3 className="font-semibold text-xl md:text-2xl lg:text-[25px] leading-none tracking-normal text-black mb-4">
                    Title: {event.title}
                  </h3>
                  <p className="font-medium text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] lg:text-[17px] lg:leading-[27px] tracking-normal text-[#000000BF]">
                    Theme: {event.theme}
                  </p>
                  <p className="font-medium text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] lg:text-[17px] lg:leading-[27px] tracking-normal text-[#000000BF]">
                    Status: {event.status}
                  </p>
                  <div className="flex items-center text-sm text-gray-600 mb-3">
                    {/* <svg
                                  className="w-4 h-4 mr-2"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg> */}
                    {/* {new Date(event.start).toLocaleDateString()} */}
                    {/* {event.title && (
                                  <>
                                    <svg
                                      className="w-4 h-4 mx-2"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                                      />
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                                      />
                                    </svg>
                                    {event.}
                                  </>
                                )} */}
                  </div>

                  <Link
                    to={`/events/${event.id}`}
                    className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
                  >
                    Learn More
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </Section>
  );
}
