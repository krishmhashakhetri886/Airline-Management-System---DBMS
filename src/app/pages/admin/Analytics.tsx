import { useData } from '../../context/DataContext';
import Layout from '../../components/Layout';
import { TrendingUp, DollarSign, Users, Plane, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

export default function Analytics() {
  const { flights, airlines, airports, bookings, payments } = useData();

  const totalRevenue = payments
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const averageBookingValue = bookings.length > 0
    ? totalRevenue / bookings.filter(b => b.status === 'confirmed').length
    : 0;

  const stats = [
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `$${totalRevenue.toLocaleString()}`,
      change: '+12.5%',
      positive: true,
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      icon: Calendar,
      label: 'Total Bookings',
      value: bookings.length,
      change: '+8.2%',
      positive: true,
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: Plane,
      label: 'Active Flights',
      value: flights.filter(f => f.status === 'scheduled').length,
      change: '+3.1%',
      positive: true,
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: DollarSign,
      label: 'Avg Booking Value',
      value: `$${averageBookingValue.toFixed(0)}`,
      change: '+5.7%',
      positive: true,
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
  ];

  const revenueByAirline = airlines.map(airline => {
    const airlineFlights = flights.filter(f => f.airlineId === airline.id);
    const airlineBookings = bookings.filter(b => {
      const flight = flights.find(f => f.id === b.flightId);
      return flight?.airlineId === airline.id && b.status === 'confirmed';
    });
    const revenue = airlineBookings.reduce((sum, b) => sum + b.totalAmount, 0);

    return {
      name: airline.code,
      revenue,
      bookings: airlineBookings.length,
    };
  });

  const bookingStatusData = [
    { name: 'Confirmed', value: bookings.filter(b => b.status === 'confirmed').length, color: '#10B981' },
    { name: 'Cancelled', value: bookings.filter(b => b.status === 'cancelled').length, color: '#EF4444' },
  ];

  const popularRoutes = airports.slice(0, 5).map((airport, index) => {
    const departures = flights.filter(f => f.departureAirportId === airport.id).length;
    const arrivals = flights.filter(f => f.arrivalAirportId === airport.id).length;

    return {
      name: airport.code,
      departures,
      arrivals,
      total: departures + arrivals,
    };
  }).sort((a, b) => b.total - a.total);

  const monthlyRevenue = [
    { month: 'Jan', revenue: 45000 },
    { month: 'Feb', revenue: 52000 },
    { month: 'Mar', revenue: 48000 },
    { month: 'Apr', revenue: totalRevenue },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600">Monitor your airline performance metrics</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.textColor}`} />
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <TrendingUp className={`w-4 h-4 ${stat.positive ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={`text-sm font-medium ${stat.positive ? 'text-green-600' : 'text-red-600'}`}>
                    {stat.change}
                  </span>
                  <span className="text-sm text-gray-500">vs last month</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Revenue by Airline</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={revenueByAirline}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Bar dataKey="revenue" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Booking Status Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={bookingStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {bookingStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Monthly Revenue Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#06B6D4"
                  strokeWidth={3}
                  dot={{ fill: '#06B6D4', r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Popular Routes</h2>
            <div className="space-y-4">
              {popularRoutes.map((route, index) => (
                <div key={route.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[#1E3A8A] text-white rounded-lg flex items-center justify-center font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">{route.name}</p>
                      <p className="text-xs text-gray-500">
                        {route.departures} departures, {route.arrivals} arrivals
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#1E3A8A]">{route.total}</p>
                    <p className="text-xs text-gray-500">flights</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
          <h2 className="text-xl font-bold text-gray-900 mb-6">Key Performance Indicators</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
              <p className="text-sm text-blue-600 mb-2">Total Passengers</p>
              <p className="text-4xl font-bold text-blue-900">
                {bookings.reduce((sum, b) => sum + b.seatIds.length, 0)}
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
              <p className="text-sm text-green-600 mb-2">Seat Occupancy Rate</p>
              <p className="text-4xl font-bold text-green-900">
                {((flights.reduce((sum, f) => sum + (f.totalSeats - f.availableSeats), 0) /
                  flights.reduce((sum, f) => sum + f.totalSeats, 0)) * 100).toFixed(1)}%
              </p>
            </div>
            <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
              <p className="text-sm text-purple-600 mb-2">Payment Success Rate</p>
              <p className="text-4xl font-bold text-purple-900">
                {((payments.filter(p => p.status === 'completed').length / payments.length) * 100).toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
