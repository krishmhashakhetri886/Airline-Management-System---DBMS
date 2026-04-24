import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Plane, Calendar, CreditCard } from 'lucide-react';
import Layout from '../components/Layout';
import { useEffect, useState } from 'react';

export default function PassengerDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState({
    totalBookings: 0,
    totalSpent: 0,
    upcomingFlights: []
  });

  const [loading, setLoading] = useState(true);

  // 🔥 FETCH FROM BACKEND
  useEffect(() => {
    if (!user?.id) return;

    fetch(`http://localhost:5000/passenger-dashboard/${user.id}`)
      .then(res => res.json())
      .then(data => {
        setStatsData({
          totalBookings: data.totalBookings || 0,
          totalSpent: Number(data.totalSpent || 0),
          upcomingFlights: data.upcomingFlights || []
        });
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const stats = [
    {
      icon: Calendar,
      label: 'Total Bookings',
      value: statsData.totalBookings,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: Plane,
      label: 'Upcoming Trips',
      value: statsData.upcomingFlights.length,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: CreditCard,
      label: 'Total Spent',
      value: `₹${statsData.totalSpent}`,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">Manage your flights and bookings</p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            {/* STATS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={index}
                    className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200"
                  >
                    <div className="flex justify-between">
                      <div>
                        <p className="text-gray-600 text-sm">{stat.label}</p>
                        <p className="text-3xl font-bold">{stat.value}</p>
                      </div>
                      <Icon className={`w-6 h-6 ${stat.textColor}`} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* UPCOMING FLIGHTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <div className="flex justify-between mb-6">
                  <h2 className="text-xl font-bold">Upcoming Flights</h2>
                  <button
                    onClick={() => navigate('/bookings')}
                    className="text-[#1E3A8A] text-sm"
                  >
                    View All
                  </button>
                </div>

                {statsData.upcomingFlights.length === 0 ? (
                  <div className="text-center py-12">
                    <Plane className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No upcoming flights</p>
                    <button
                      onClick={() => navigate('/flights')}
                      className="bg-[#1E3A8A] text-white px-6 py-2 rounded-lg"
                    >
                      Book a Flight
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {statsData.upcomingFlights.slice(0, 3).map((flight: any, i) => (
                      <div key={i} className="border p-4 rounded-xl">
                        <div className="flex justify-between">
                          <div>
                            <p className="font-bold">{flight.source}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(flight.departure_time).toLocaleTimeString()}
                            </p>
                          </div>

                          <Plane className="w-5 h-5" />

                          <div className="text-right">
                            <p className="font-bold">{flight.destination}</p>
                            <p className="text-sm text-gray-500">
                              {new Date(flight.departure_time).toLocaleTimeString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* QUICK ACTIONS (UNCHANGED) */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border">
                <h2 className="text-xl font-bold mb-6">Quick Actions</h2>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/flights')}
                    className="w-full bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white p-4 rounded-xl"
                  >
                    Search Flights
                  </button>

                  <button
                    onClick={() => navigate('/bookings')}
                    className="w-full border p-4 rounded-xl"
                  >
                    My Bookings
                  </button>

                  <button
                    onClick={() => navigate('/payments')}
                    className="w-full border p-4 rounded-xl"
                  >
                    Payment History
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}