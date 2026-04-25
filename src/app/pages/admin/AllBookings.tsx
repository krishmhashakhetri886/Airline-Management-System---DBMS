import Layout from '../../components/Layout';
import { Calendar, Search, CheckCircle, XCircle, Filter } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

type BookingRow = {
  booking_id: number;
  first_name: string;
  last_name: string;
  source: string;
  destination: string;
  departure_time: string;
  arrival_time: string;
  price: number;
  status: string | null;
  flight_status?: string | null;
  source_airport_status?: string | null;
  destination_airport_status?: string | null;
  airline_name?: string | null;
};

type BookingStatRow = {
  airline_name: string;
  total_bookings: number;
  total_passengers: number;
};

export default function AllBookings() {
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [bookingStats, setBookingStats] = useState<BookingStatRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'confirmed' | 'cancelled'>('all');

  useEffect(() => {
    setLoading(true);
    fetch('http://localhost:5000/all-bookings')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch bookings');
        }
        return data;
      })
      .then((data) => {
        setBookings(Array.isArray(data) ? data : []);
        setError('');
      })
      .catch((err: any) => {
        console.error('Error fetching all bookings:', err);
        setError(err.message || 'Error fetching bookings');
        setBookings([]);
      })
      .finally(() => {
        setLoading(false);
      });

    fetch('http://localhost:5000/booking-stats')
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Failed to fetch booking stats');
        }
        return data;
      })
      .then((data) => {
        setBookingStats(Array.isArray(data) ? data : []);
      })
      .catch((err: any) => {
        console.error('Error fetching booking stats:', err);
        setBookingStats([]);
      });
  }, []);

  const normalizedBookings = useMemo(
    () =>
      bookings.map((booking) => ({
        ...booking,
        isFlightCancelled:
          booking.flight_status?.toUpperCase() === 'INACTIVE' ||
          booking.source_airport_status?.toUpperCase() === 'INACTIVE' ||
          booking.destination_airport_status?.toUpperCase() === 'INACTIVE' ||
          !booking.airline_name,
        uiStatus:
          booking.flight_status?.toUpperCase() === 'INACTIVE' ||
          booking.source_airport_status?.toUpperCase() === 'INACTIVE' ||
          booking.destination_airport_status?.toUpperCase() === 'INACTIVE' ||
          !booking.airline_name
            ? 'cancelled'
            : booking.status?.toUpperCase() === 'CONFIRMED'
            ? 'confirmed'
            : 'cancelled',
        passengerName: `${booking.first_name || ''} ${booking.last_name || ''}`.trim(),
      })),
    [bookings]
  );

  const filteredBookings = normalizedBookings.filter(booking => {
    const lowerSearch = searchTerm.toLowerCase();
    const matchesSearch =
      String(booking.booking_id).includes(searchTerm) ||
      booking.passengerName.toLowerCase().includes(lowerSearch) ||
      `${booking.source} ${booking.destination}`.toLowerCase().includes(lowerSearch);
    const matchesStatus = statusFilter === 'all' || booking.uiStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">All Bookings</h1>
          <p className="text-gray-600">View and manage all passenger bookings</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Bookings</p>
                <p className="text-3xl font-bold text-gray-900">{bookings.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Confirmed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {normalizedBookings.filter(b => b.uiStatus === 'confirmed').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Cancelled</p>
                <p className="text-3xl font-bold text-gray-900">
                  {normalizedBookings.filter(b => b.uiStatus === 'cancelled').length}
                </p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by booking ID, passenger name or route..."
                className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
              />
            </div>

            <div className="relative">
              <Filter className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="pl-12 pr-8 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] appearance-none"
              >
                <option value="all">All Status</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>
        </div>


        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 mb-6">
            {error}
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Airline Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total Bookings</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Total Passengers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bookingStats.length === 0 ? (
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-500" colSpan={3}>No booking analytics available</td>
                  </tr>
                ) : (
                  bookingStats.map((stat) => (
                    <tr key={stat.airline_name} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm text-gray-900">{stat.airline_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stat.total_bookings}</td>
                      <td className="px-6 py-4 text-sm text-gray-900">{stat.total_passengers}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
            <p className="text-gray-500">Loading bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Bookings Found</h3>
            <p className="text-gray-500">No bookings match your search criteria</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Booking ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Passenger</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Departure Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Arrival Time</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Price</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.map(booking => {
                    return (
                      <tr key={booking.booking_id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-medium text-gray-900">{booking.booking_id}</p>
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{booking.passengerName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{booking.source} → {booking.destination}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{new Date(booking.departure_time).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm text-gray-900">{new Date(booking.arrival_time).toLocaleString()}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <p className="text-sm font-semibold text-gray-900">₹{booking.price}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${
                            booking.uiStatus === 'confirmed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }`}>
                            {booking.uiStatus === 'confirmed' ? (
                              <CheckCircle className="w-4 h-4" />
                            ) : (
                              <XCircle className="w-4 h-4" />
                            )}
                            <span className="capitalize">{booking.uiStatus === 'confirmed' ? 'Confirmed' : (booking.isFlightCancelled ? 'Flight Cancelled' : 'Cancelled')}</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
