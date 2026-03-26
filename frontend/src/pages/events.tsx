import { useUpcomingEvents } from "../lib/hooks/useHomepage";
import { EventCardSkeleton } from "../components/home/Skeletons";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import SectionHeader from "../components/SectionHeader";
import PageHeader from "../components/PageHeader";
import { EventCard } from "../components/EventCard";
import { useState, useEffect } from "react";

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

interface EventProps {
  isHome: boolean;
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

export default function Events({ isHome }: EventProps) {
  const { data: events, isLoading: eventsLoading } = useUpcomingEvents();

  // 1. States
  const [currentPage, setCurrentPage] = useState(1);
  const [filter, setFilter] = useState<
    "all" | "upcoming" | "ongoing" | "completed"
  >("all");
  const itemsPerPage = 6;

  // 2. Sorting & Filtering Logic
  const getDisplayData = () => {
    let dataSource = [...Mockevents];

    if (isHome) {
      // Sort by date (closest first) and take top 3
      return dataSource
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime(),
        )
        .slice(0, 3);
    }

    // Filter by Status
    if (filter !== "all") {
      dataSource = dataSource.filter((event) => event.status === filter);
    }

    // Paginate
    const startIndex = (currentPage - 1) * itemsPerPage;
    return dataSource.slice(startIndex, startIndex + itemsPerPage);
  };

  const displayData = getDisplayData();

  // Calculate total pages based on filtered data
  const filteredTotal =
    filter === "all"
      ? Mockevents.length
      : Mockevents.filter((e) => e.status === filter).length;

  const totalPages = Math.ceil(filteredTotal / itemsPerPage);
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filter]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [currentPage]);

  return (
    <section className={isHome ? "mb-37.5" : ""}>
      {!isHome ? <Navbar /> : null}

      {isHome ? (
        <SectionHeader
          subtitle="Upcoming Events"
          title="Learn, Connect, and Grow"
        />
      ) : (
        <PageHeader
          title="NACOS EVENTS"
          subtitle="Our events are designed to empower students through knowledge sharing and collaboration."
        />
      )}

      {/* --- Filter Bar (Only on Events Page) --- */}
      {!isHome && (
        <div className="flex justify-center gap-2 md:gap-4 mt-8 px-4 flex-wrap">
          {["all", "upcoming", "ongoing", "completed"].map((type) => (
            <button
              key={type}
              onClick={() => setFilter(type as any)}
              className={`px-6 py-2 rounded-full text-sm font-bold transition-all cursor-pointer ${
                filter === type
                  ? "bg-[#006E3A] text-white"
                  : "bg-white text-gray-600 border border-gray-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      )}

      {eventsLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto mb-8">
          {[...Array(isHome ? 3 : 6)].map((_, i) => (
            <EventCardSkeleton key={i} />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto">
            {displayData.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
            {displayData.length === 0 && (
              <div className="col-span-full py-20 text-center text-gray-500 font-medium">
                No {filter} events found at the moment.
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isHome && totalPages > 1 && (
            <div className="flex flex-col items-center gap-6 mt-10 mb-20">
              <div className="flex items-center gap-2">
                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={currentPage === 1}
                  className="group p-3 rounded-full border border-gray-200 bg-white disabled:opacity-30 hover:border-green-600 transition-all"
                >
                  <svg
                    className="w-6 h-6 rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>

                <div className="flex items-center gap-2">
                  {pageNumbers.map((number) => (
                    <button
                      key={number}
                      onClick={() => setCurrentPage(number)}
                      className={`w-10 h-10 rounded-lg font-semibold transition-all ${
                        currentPage === number
                          ? "bg-gradient-to-r from-green-600 to-teal-600 text-white shadow-md scale-110"
                          : "text-gray-600 hover:bg-gray-100"
                      }`}
                    >
                      {number}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="group p-3 rounded-full bg-gradient-to-r from-green-600 to-teal-600 text-white disabled:opacity-30 transition-all"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7l5 5m0 0l-5 5m5-5H6"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Explore All (Home Only) */}
      {isHome && (
        <div className="w-full flex flex-col items-center gap-4 p-6 mb-20">
          <h1 className="font-bold text-2xl md:text-3xl lg:text-[32px] text-[#006E3A] text-center">
            Explore All Upcoming Events
          </h1>
          <Link
            to="/events"
            className="group inline-flex items-center gap-3 bg-gradient-to-r from-green-600 to-teal-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:scale-105 transition-all mt-5"
          >
            View All Events
            <svg
              className="w-5 h-5 group-hover:translate-x-1 transition-transform"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 7l5 5m0 0l-5 5m5-5H6"
              />
            </svg>
          </Link>
        </div>
      )}

      {!isHome ? <Footer /> : null}
    </section>
  );
}

//         // ) : eventsError ? (
//         //   <div className="text-center py-12">
//         //     <p className="text-gray-500 mb-4">Failed to load events</p>
//         //     <button
//         //       onClick={() => refetchEvents()}
//         //       className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
//         //     >
//         //       Try Again
//         //     </button>
//         //   </div>
//         // ) : events?.results?.length === 0 ? (
//         //   <div className="text-center py-12">
//         //     <p className="text-gray-500">No upcoming events scheduled</p>
//         //   </div>
//         <>
//           <section
//             className={`${isHome ? "grid grid-cols-1 lg:grid-cols-3 gap-2 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto" : "grid grid-cols-1 lg:grid-cols-4 gap-2 lg:gap-10 justify-items-center mt-10 p-3 lg:p-10 max-w-360 mx-auto"}`}
//             id="top"
//           >
//             {/* {displayData.map((exec) => (
//               <EventsCard key={exec.id} {...exec} />
//             ))} */}
//           </section>
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
//             {event?.slice(0, 3).map((event) => (
//               <div
//                 key={event.id}
//                 className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group"
//               >
//                 {event.media.poster ? (
//                   <div className="relative overflow-hidden w-full max-w-[500px] aspect-[426/463]">
//                     <img
//                       src={event.media.poster}
//                       alt={event.title}
//                       className="w-full h-full rounded-t-[10px] object-cover"
//                       loading="lazy"
//                     />
//                     {/* <div className="absolute top-4 right-4">
//                                   {event.is_remote ? (
//                                     <span className="bg-blue-500 text-white px-2 py-1 rounded-full text-xs font-medium">
//                                       Remote
//                                     </span>
//                                   ) : (
//                                     <span className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium">
//                                       In-person
//                                     </span>
//                                   )}
//                                 </div> */}
//                   </div>
//                 ) : (
//                   <div className="w-full h-40 bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
//                     <svg
//                       className="w-10 h-10 text-gray-400"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={1.5}
//                         d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                       />
//                     </svg>
//                   </div>
//                 )}

//                 <div className="p-6 bg-[#E8F4F8]">
//                   <h3 className="font-semibold text-xl md:text-2xl lg:text-[25px] leading-none tracking-normal text-black mb-4">
//                     Title: {event.title}
//                   </h3>
//                   <p className="font-medium text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] lg:text-[17px] lg:leading-[27px] tracking-normal text-[#000000BF]">
//                     Theme: {event.theme}
//                   </p>
//                   <p className="font-medium text-[15px] leading-[24px] md:text-[16px] md:leading-[26px] lg:text-[17px] lg:leading-[27px] tracking-normal text-[#000000BF]">
//                     Status: {event.status}
//                   </p>
//                   <div className="flex items-center text-sm text-gray-600 mb-3">
//                     {/* <svg
//                                   className="w-4 h-4 mr-2"
//                                   fill="none"
//                                   stroke="currentColor"
//                                   viewBox="0 0 24 24"
//                                 >
//                                   <path
//                                     strokeLinecap="round"
//                                     strokeLinejoin="round"
//                                     strokeWidth={2}
//                                     d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
//                                   />
//                                 </svg> */}
//                     {/* {new Date(event.start).toLocaleDateString()} */}
//                     {/* {event.title && (
//                                   <>
//                                     <svg
//                                       className="w-4 h-4 mx-2"
//                                       fill="none"
//                                       stroke="currentColor"
//                                       viewBox="0 0 24 24"
//                                     >
//                                       <path
//                                         strokeLinecap="round"
//                                         strokeLinejoin="round"
//                                         strokeWidth={2}
//                                         d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
//                                       />
//                                       <path
//                                         strokeLinecap="round"
//                                         strokeLinejoin="round"
//                                         strokeWidth={2}
//                                         d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
//                                       />
//                                     </svg>
//                                     {event.}
//                                   </>
//                                 )} */}
//                   </div>

//                   <Link
//                     to={`/events/${event.id}`}
//                     className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
//                   >
//                     Learn More
//                     <svg
//                       className="w-4 h-4"
//                       fill="none"
//                       stroke="currentColor"
//                       viewBox="0 0 24 24"
//                     >
//                       <path
//                         strokeLinecap="round"
//                         strokeLinejoin="round"
//                         strokeWidth={2}
//                         d="M9 5l7 7-7 7"
//                       />
//                     </svg>
//                   </Link>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </>
//       )}
