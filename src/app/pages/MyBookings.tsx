// import { useAuth } from '../context/AuthContext';
// import { useData } from '../context/DataContext';
// import Layout from '../components/Layout';
// import { Calendar, Plane, AlertCircle, XCircle, CheckCircle } from 'lucide-react';
// import { format } from 'date-fns';
// import { useState } from 'react';

// export default function MyBookings() {
//   const { user } = useAuth();
//   const { bookings, flights, airlines, airports, seats, cancelBooking } = useData();
//   const [cancellingId, setCancellingId] = useState<string | null>(null);

//   const userBookings = bookings.filter(b => b.userId === user?.id);

//   const handleCancelBooking = (bookingId: string) => {
//     if (confirm('Are you sure you want to cancel this booking?')) {
//       cancelBooking(bookingId);
//       setCancellingId(null);
//     }
//   };

//   const getBookingSeats = (seatIds: string[]) => {
//     return seats.filter(s => seatIds.includes(s.id));
//   };

//   return (
//     <Layout>
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
//           <p className="text-gray-600">View and manage your flight reservations</p>
//         </div>

//         {userBookings.length === 0 ? (
//           <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
//             <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
//             <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
//             <p className="text-gray-500 mb-6">You haven't made any flight reservations</p>
//             <a
//               href="/flights"
//               className="inline-block bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
//             >
//               Search Flights
//             </a>
//           </div>
//         ) : (
//           <div className="space-y-6">
//             <div className="flex items-center gap-4 text-sm">
//               <div className="flex items-center gap-2">
//                 <CheckCircle className="w-5 h-5 text-green-600" />
//                 <span className="text-gray-600">Confirmed ({userBookings.filter(b => b.status === 'confirmed').length})</span>
//               </div>
//               <div className="flex items-center gap-2">
//                 <XCircle className="w-5 h-5 text-red-600" />
//                 <span className="text-gray-600">Cancelled ({userBookings.filter(b => b.status === 'cancelled').length})</span>
//               </div>
//             </div>

//             {userBookings.map(booking => {
//               const flight = flights.find(f => f.id === booking.flightId);
//               if (!flight) return null;

//               const airline = airlines.find(a => a.id === flight.airlineId);
//               const departure = airports.find(a => a.id === flight.departureAirportId);
//               const arrival = airports.find(a => a.id === flight.arrivalAirportId);
//               const bookingSeats = getBookingSeats(booking.seatIds);

//               return (
//                 <div
//                   key={booking.id}
//                   className={`bg-white rounded-2xl p-6 shadow-sm border-2 transition-all duration-200 ${
//                     booking.status === 'confirmed'
//                       ? 'border-green-200 hover:border-green-300'
//                       : 'border-red-200 opacity-75'
//                   }`}
//                 >
//                   <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
//                     <div className="flex-1">
//                       <div className="flex items-center gap-3 mb-4">
//                         {booking.status === 'confirmed' ? (
//                           <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
//                             <CheckCircle className="w-6 h-6 text-green-600" />
//                           </div>
//                         ) : (
//                           <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
//                             <XCircle className="w-6 h-6 text-red-600" />
//                           </div>
//                         )}
//                         <div>
//                           <p className="font-semibold text-gray-900">Booking ID: {booking.id}</p>
//                           <p className="text-sm text-gray-500">
//                             Booked on {format(new Date(booking.bookingDate), 'MMM dd, yyyy')}
//                           </p>
//                         </div>
//                       </div>

//                       <div className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] rounded-xl p-4 text-white mb-4">
//                         <div className="flex items-center gap-3 mb-3">
//                           <div className="text-2xl">{airline?.logo}</div>
//                           <div>
//                             <p className="font-semibold">{flight.flightNumber}</p>
//                             <p className="text-xs text-white/80">{airline?.name}</p>
//                           </div>
//                         </div>

//                         <div className="flex items-center justify-between">
//                           <div>
//                             <p className="text-white/80 text-xs mb-1">Departure</p>
//                             <p className="text-xl font-bold">{departure?.code}</p>
//                             <p className="text-xs">{format(new Date(flight.departureTime), 'MMM dd, HH:mm')}</p>
//                           </div>
//                           <Plane className="w-6 h-6 rotate-90" />
//                           <div className="text-right">
//                             <p className="text-white/80 text-xs mb-1">Arrival</p>
//                             <p className="text-xl font-bold">{arrival?.code}</p>
//                             <p className="text-xs">{format(new Date(flight.arrivalTime), 'MMM dd, HH:mm')}</p>
//                           </div>
//                         </div>
//                       </div>

//                       <div className="grid grid-cols-2 gap-4 mb-4">
//                         <div>
//                           <p className="text-sm text-gray-500 mb-1">Passenger</p>
//                           <p className="font-medium text-gray-900">{booking.passengerName}</p>
//                           <p className="text-xs text-gray-600">{booking.passengerEmail}</p>
//                         </div>
//                         <div>
//                           <p className="text-sm text-gray-500 mb-1">Seats</p>
//                           <div className="flex flex-wrap gap-1">
//                             {bookingSeats.map(seat => (
//                               <span
//                                 key={seat.id}
//                                 className="bg-[#1E3A8A] text-white px-2 py-1 rounded text-xs font-medium"
//                               >
//                                 {seat.seatNumber}
//                               </span>
//                             ))}
//                           </div>
//                         </div>
//                       </div>

//                       <div className="flex items-center justify-between pt-4 border-t border-gray-200">
//                         <div>
//                           <p className="text-sm text-gray-500 mb-1">Total Amount</p>
//                           <p className="text-2xl font-bold text-[#1E3A8A]">${booking.totalAmount}</p>
//                         </div>

//                         {booking.status === 'confirmed' && (
//                           <button
//                             onClick={() => handleCancelBooking(booking.id)}
//                             className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors font-medium text-sm"
//                           >
//                             Cancel Booking
//                           </button>
//                         )}

//                         {booking.status === 'cancelled' && (
//                           <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium text-sm">
//                             Cancelled
//                           </span>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               );
//             })}
//           </div>
//         )}
//       </div>
//     </Layout>
//   );
// }
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Calendar, Plane, XCircle, CheckCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH REAL BOOKINGS FROM BACKEND
  useEffect(() => {
    if (!user?.id) return;

    console.log(user.id);

    fetch(`http://localhost:5000/my-bookings/${user.id}`)
      .then(res => res.json())
      .then(data => {
        const normalized = (data || []).map((booking: any) => ({
          ...booking,
          flight: booking.flight ?? {
            source: booking.source,
            destination: booking.destination,
            status: booking.flight_status,
            source_city: booking.source_city,
            source_airport_name: booking.source_airport_name,
            source_airport_status: booking.source_airport_status,
            destination_city: booking.destination_city,
            destination_airport_name: booking.destination_airport_name,
            destination_airport_status: booking.destination_airport_status,
            source_terminal: booking.source_terminal,
            destination_terminal: booking.destination_terminal,
            departure_time: booking.departure_time,
            arrival_time: booking.arrival_time,
          },
        }));

        setBookings(normalized);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching bookings:", err);
        setLoading(false);
      });
  }, [user?.id]);

  const now = new Date();

  const isFlightDeleted = (booking: any) => booking.flight_id == null;
  const isInactiveFlight = (booking: any) =>
    booking.flight?.status === 'INACTIVE' || booking.flight_status === 'INACTIVE';
  const isInactiveAirport = (booking: any) =>
    booking.flight?.source_airport_status === 'INACTIVE' ||
    booking.source_airport_status === 'INACTIVE' ||
    booking.flight?.destination_airport_status === 'INACTIVE' ||
    booking.destination_airport_status === 'INACTIVE';
  const isAirlineMissing = (booking: any) => !booking.airline_name;
  const isDeletedBooking = (booking: any) =>
    isFlightDeleted(booking) || isInactiveFlight(booking) || isInactiveAirport(booking) || isAirlineMissing(booking);

  const deletedBookings = bookings.filter((b) =>
    isDeletedBooking(b)
  );

  const cancelledBookings = bookings.filter((b) =>
    b.status === 'CANCELLED' && !deletedBookings.some((d) => d.booking_id === b.booking_id)
  );

  const upcomingBookings = bookings.filter((b) => {
    if (deletedBookings.some((d) => d.booking_id === b.booking_id)) return false;
    if (b.status === 'CANCELLED') return false;
    return new Date(b.departure_time) > now;
  });

  const pastBookings = bookings.filter((b) => {
    if (deletedBookings.some((d) => d.booking_id === b.booking_id)) return false;
    if (b.status === 'CANCELLED') return false;
    return new Date(b.departure_time) <= now;
  });

  const formatDateTime = (value: string) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString();
  };

  const withDeletedAirportLabel = (name: string, status?: string) => {
    if (!name) return name;
    return status === 'INACTIVE' ? `${name} (Airport Deleted)` : name;
  };

  const routeWithTerminal = (booking: any) => {
    if (isFlightDeleted(booking)) {
      return 'Flight Cancelled';
    }

    const sourceTerminal = booking.flight.source_terminal || booking.source_terminal || '-';
    const destinationTerminal = booking.flight.destination_terminal || booking.destination_terminal || '-';
    const sourceAirportName = withDeletedAirportLabel(
      booking.flight.source_airport_name || booking.source_airport_name,
      booking.flight.source_airport_status || booking.source_airport_status
    );
    const destinationAirportName = withDeletedAirportLabel(
      booking.flight.destination_airport_name || booking.destination_airport_name,
      booking.flight.destination_airport_status || booking.destination_airport_status
    );
    const route = `${booking.flight.source_city || booking.source_city} (${sourceAirportName}) - ${sourceTerminal} → ${booking.flight.destination_city || booking.destination_city} (${destinationAirportName}) - ${destinationTerminal}`;
    return isDeletedBooking(booking) ? `${route} | Flight Cancelled` : route;
  };

  const renderBookingCard = (booking: any, isPast: boolean) => (
    <div
      key={booking.booking_id}
      className={`bg-white rounded-2xl p-6 shadow-sm border-2 ${
        booking.status === 'CONFIRMED'
          ? 'border-green-200'
          : 'border-red-200 opacity-75'
      }`}
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-4">
          {booking.status === 'CONFIRMED' ? (
            <CheckCircle className="w-6 h-6 text-green-600" />
          ) : (
            <XCircle className="w-6 h-6 text-red-600" />
          )}
          <div>
            <p className="font-semibold text-gray-900">
              Booking ID: {booking.booking_id}
            </p>
            <p className="text-sm text-gray-500">
              Airline: {booking.airline_name || '-'}
            </p>
            {isDeletedBooking(booking) && (
              <p className="text-sm text-gray-500">
                Status: Flight Cancelled
              </p>
            )}
            <p className="text-sm text-gray-500">
              {routeWithTerminal(booking)}
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] rounded-xl p-4 text-white">
          {isFlightDeleted(booking) ? (
            <p className="text-xl font-bold">Flight Cancelled</p>
          ) : (
            <div className="flex justify-between">
              <div>
                <p className="text-xl font-bold">
                  {booking.flight.source_city || booking.source_city} ({withDeletedAirportLabel(booking.flight.source_airport_name || booking.source_airport_name, booking.flight.source_airport_status || booking.source_airport_status)}) - {booking.flight.source_terminal || booking.source_terminal || '-'}
                </p>
                <p className="text-xs">{formatDateTime(booking.flight.departure_time || booking.departure_time)}</p>
              </div>
              <Plane className="w-6 h-6 rotate-90" />
              <div className="text-right">
                <p className="text-xl font-bold">
                  {booking.flight.destination_city || booking.destination_city} ({withDeletedAirportLabel(booking.flight.destination_airport_name || booking.destination_airport_name, booking.flight.destination_airport_status || booking.destination_airport_status)}) - {booking.flight.destination_terminal || booking.destination_terminal || '-'}
                </p>
                <p className="text-xs">{formatDateTime(booking.flight.arrival_time || booking.arrival_time)}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t border-gray-200">
          <div>
            <p className="text-sm text-gray-500">Amount</p>
            <p className="text-xl font-bold text-[#1E3A8A]">
              ₹{booking.amount}
            </p>
          </div>

          {booking.status === 'CANCELLED' ? (
            <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-medium text-sm">
              Cancelled
            </span>
          ) : isFlightDeleted(booking) ? (
            <button
              disabled
              className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
            >
              Flight Cancelled
            </button>
          ) : isDeletedBooking(booking) ? (
            <button
              disabled
              className="bg-gray-100 text-gray-400 px-4 py-2 rounded-lg cursor-not-allowed"
            >
              Flight Cancelled
            </button>
          ) : isPast ? (
            <span className="text-gray-500 px-4 py-2">Done</span>
          ) : (
            <button
              onClick={() => handleCancelBooking(booking.booking_id)}
              className="bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100"
            >
              Cancel Booking
            </button>
          )}
        </div>
      </div>
    </div>
  );

  const handleCancelBooking = async (bookingId: number) => {
    if (!confirm('Are you sure you want to cancel this booking?')) return;

    try {
      await fetch(`http://localhost:5000/cancel-booking/${bookingId}`, {
        method: "POST"
      });

      // refresh bookings
      setBookings(prev =>
        prev.map(b =>
          b.booking_id === bookingId ? { ...b, status: 'CANCELLED' } : b
        )
      );
    } catch (err) {
      console.error("Cancel failed", err);
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">View and manage your flight reservations</p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : bookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Yet</h3>
            <p className="text-gray-500 mb-6">You haven't made any flight reservations</p>
            <a
              href="/flights"
              className="inline-block bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
            >
              Search Flights
            </a>
          </div>
        ) : (
          <div className="space-y-6">
            {upcomingBookings.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Upcoming Bookings</h2>
                {upcomingBookings.map((booking) => renderBookingCard(booking, false))}
              </div>
            )}

            {pastBookings.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Past Bookings</h2>
                {pastBookings.map((booking) => renderBookingCard(booking, true))}
              </div>
            )}

            {cancelledBookings.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Cancelled Bookings</h2>
                {cancelledBookings.map((booking) => renderBookingCard(booking, true))}
              </div>
            )}

            {deletedBookings.length > 0 && (
              <div className="space-y-6">
                <h2 className="text-xl font-semibold text-gray-900">Deleted Flights</h2>
                {deletedBookings.map((booking) => renderBookingCard(booking, false))}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}