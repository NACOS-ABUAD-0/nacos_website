// src/pages/ticket.tsx — the holder's ticket (QR code), opened from the link in the ticket email.
// Works without signing in: the token in the URL is the ticket.
import { useParams, useSearchParams, Link } from "react-router-dom";
import { QRCodeSVG } from "qrcode.react";
import { useTicket } from "../lib/hooks/useEvents";
import Navbar from "../components/Navbar";
import { Footer } from "../components/Footer";
import { optimizeImage } from "../lib/cloudinary";

export default function TicketPage() {
  const { token } = useParams<{ token: string }>();
  const { data: ticket, isLoading, error } = useTicket(token!);
  // Set when Paystack has just sent the buyer here after a successful payment.
  const [searchParams] = useSearchParams();
  const justPaid = searchParams.get("paid") === "1";

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F7FA]">
      <Navbar />
      <main className="flex-grow flex items-start justify-center px-4 py-10">
        {isLoading ? (
          <div className="w-10 h-10 mt-20 border-2 border-gray-300 border-t-[#006E3A] rounded-full animate-spin" />
        ) : error || !ticket ? (
          <div className="text-center mt-20">
            <h1 className="text-2xl font-bold text-[#006E3A] mb-2">Ticket not found</h1>
            <p className="text-gray-600 mb-6">Check the link in your ticket email, or get a ticket from the event page.</p>
            <Link to="/events" className="text-[#006E3A] font-semibold underline">Browse events</Link>
          </div>
        ) : (
          <div className="w-full max-w-sm">
          {justPaid && (
            <div className="mb-4 bg-green-50 border border-green-200 text-green-800 rounded-2xl px-5 py-4" role="status">
              <p className="font-bold">Payment successful 🎉</p>
              <p className="text-sm mt-1">
                Check your email for your ticket. We've sent it to <strong>{ticket.email}</strong> (look in spam if it
                isn't there). You can also show the QR code below.
              </p>
            </div>
          )}
          <article className="w-full bg-white rounded-2xl shadow-md overflow-hidden">
            {ticket.event.poster && (
              <img src={optimizeImage(ticket.event.poster, 800)} alt="" className="w-full h-40 object-cover" />
            )}
            <div className="p-6 text-center">
              <h1 className="text-xl font-bold text-gray-900">{ticket.event.title}</h1>
              <p className="text-sm text-gray-600 mt-1">
                {new Date(ticket.event.start_time).toLocaleString(undefined, {
                  weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-600">
                📍 {ticket.ticket_type?.venue || (ticket.event.is_remote ? "Online" : ticket.event.location)}
              </p>

              {ticket.ticket_type && (
                <span className="inline-block mt-4 px-3 py-1 rounded-full text-xs font-bold tracking-wide bg-[#006E3A] text-white uppercase">
                  {ticket.ticket_type.name}
                </span>
              )}

              <div className="flex justify-center my-5">
                {ticket.token && <QRCodeSVG value={ticket.token} size={220} />}
              </div>

              {ticket.short_code && (
                <p className="text-sm text-gray-500">
                  Ticket code{" "}
                  <span className="font-mono text-base font-bold tracking-widest text-gray-900">{ticket.short_code}</span>
                </p>
              )}
              <p className="text-lg font-semibold text-gray-900 mt-2">{ticket.name}</p>
              {ticket.checked_in_at ? (
                <p className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-200">
                  Checked in at {new Date(ticket.checked_in_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">
                  Show this QR code at the entrance. It can only be scanned once, so don't share this page.
                </p>
              )}

              <Link to={`/events/${ticket.event.id}`} className="block mt-5 text-sm text-[#006E3A] font-semibold hover:underline">
                Event details
              </Link>
            </div>
          </article>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
