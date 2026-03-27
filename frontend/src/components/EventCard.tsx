// // components/EventCard.tsx
// import { Link } from "react-router-dom"

// interface EventCardProps {
//   event: Event;
// }

// export const EventCard: React.FC<EventCardProps> = ({ event }) => {
//   return (
//     <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group mb-7">

//       {/* Poster */}
//       {event.media.poster ? (
//         <div className="relative overflow-hidden aspect-[4/5]">
//           <img
//             src={event.media.poster}
//             alt={event.title}
//             className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//             loading="lazy"
//           />

//           {/* Status Badge */}
//           <div className="absolute top-3 right-3">
//             <span
//               className={`px-3 py-1 text-xs font-medium rounded-full text-white ${
//                 event.status === "upcoming"
//                   ? "bg-green-500"
//                   : event.status === "ongoing"
//                   ? "bg-blue-500"
//                   : "bg-gray-500"
//               }`}
//             >
//               {event.status}
//             </span>
//           </div>
//         </div>
//       ) : (
//         <div className="h-40 flex items-center justify-center bg-gray-100">
//           <span className="text-gray-400 text-sm">No Image</span>
//         </div>
//       )}

//       {/* Content */}
//       <div className="p-5 bg-[#E8F4F8]">
//         <h3 className="font-semibold text-lg text-black mb-2 line-clamp-2">
//           {event.title}
//         </h3>

//         <p className="text-sm text-gray-700 mb-2">
//           <span className="font-medium">Theme:</span> {event.theme}
//         </p>

//         <p className="text-sm text-gray-600 mb-3">
//           {new Date(event.start).toLocaleDateString()}
//         </p>

//         <p className="text-sm text-gray-600 mb-4">
//           {event.is_remote ? "Remote Event" : event.location}
//         </p>

//         <Link
//           to={`/events/${event.id}`}
//           className="text-green-600 hover:text-green-700 font-medium inline-flex items-center gap-1 group-hover:gap-2 transition-all"
//         >
//           Learn More →
//         </Link>
//       </div>
//     </div>
//   );
// };

// components/EventCard.tsx
import { Link } from "react-router-dom";

interface EventCardProps {
  event: Event;
}

export const EventCard: React.FC<EventCardProps> = ({ event }) => {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-all duration-300 group mb-7">
      {/* Poster */}
      {event.media.poster ? (
        <div className="relative overflow-hidden aspect-[4/5]">
          <img
            src={event.media.poster}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />

          {/* Status Badge */}
          <div className="absolute top-3 right-3">
            <span
              className={`px-3 py-1 text-xs font-medium rounded-full text-white ${
                event.status === "upcoming"
                  ? "bg-green-500"
                  : event.status === "ongoing"
                    ? "bg-blue-500"
                    : "bg-gray-500"
              }`}
            >
              {event.status}
            </span>
          </div>
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-gray-100">
          <span className="text-gray-400 text-sm">No Image</span>
        </div>
      )}

      {/* Content */}
      <div className="p-5 bg-[#E8F4F8]">
        <h3 className="font-semibold text-lg text-black mb-2 line-clamp-2">
          {event.title}
        </h3>

        {/* Date/Time output */}
        <p className="text-sm text-gray-600 mb-2 font-medium">
          {new Date(event.start_time).toLocaleDateString([], {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}{" "}
          |{" "}
          {new Date(event.start_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>

        <p className="text-sm text-gray-600 mb-6">
          {event.is_remote ? "Remote Event" : event.location}
        </p>

        {/* Buttons Container */}
        <div className="flex items-center justify-between gap-2">
          <Link
            to={`/events/${event.id}`}
            className="text-green-600 hover:text-green-700 font-bold text-sm inline-flex items-center gap-1 group-hover:gap-2 transition-all"
          >
            Learn More →
          </Link>

          {event.status === "upcoming" && (
            <Link
              to={`/register/${event.id}`}
              className="px-4 py-2 bg-[#006E3A] text-white text-xs font-bold rounded-lg hover:bg-green-700 hover:shadow-md transition-all tracking-wider"
            >
              Register Now
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};
