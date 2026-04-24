// import { useNavigate } from 'react-router-dom';
// import { useData } from '../context/DataContext';
// import { Plane, Building2, MapPin, Calendar, DollarSign, TrendingUp, Users } from 'lucide-react';
// import Layout from '../components/Layout';
// import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

// export default function AdminDashboard() {
//   const { flights, airlines, airports, bookings, payments } = useData();
//   const navigate = useNavigate();

//   const totalRevenue = payments
//     .filter(p => p.status === 'completed')
//     .reduce((sum, p) => sum + p.amount, 0);

//   const confirmedBookings = bookings.filter(b => b.status === 'confirmed');

//   const stats = [
//     {
//       icon: Plane,
//       label: 'Total Flights',
//       value: flights.length,
//       color: 'from-blue-500 to-blue-600',
//       bgColor: 'bg-blue-50',
//       textColor: 'text-blue-600',
//     },
//     {
//       icon: Building2,
//       label: 'Airlines',
//       value: airlines.length,
//       color: 'from-purple-500 to-purple-600',
//       bgColor: 'bg-purple-50',
//       textColor: 'text-purple-600',
//     },
//     {
//       icon: MapPin,
//       label: 'Airports',
//       value: airports.length,
//       color: 'from-green-500 to-green-600',
//       bgColor: 'bg-green-50',
//       textColor: 'text-green-600',
//     },
//     {
//       icon: Calendar,
//       label: 'Total Bookings',
//       value: bookings.length,
//       color: 'from-orange-500 to-orange-600',
//       bgColor: 'bg-orange-50',
//       textColor: 'text-orange-600',
//     },
//     {
//       icon: DollarSign,
//       label: 'Total Revenue',
//       value: `$${totalRevenue.toLocaleString()}`,
//       color: 'from-emerald-500 to-emerald-600',
//       bgColor: 'bg-emerald-50',
//       textColor: 'text-emerald-600',
//     },
//     {
//       icon: TrendingUp,
//       label: 'Confirmed Bookings',
//       value: confirmedBookings.length,
//       color: 'from-cyan-500 to-cyan-600',
//       bgColor: 'bg-cyan-50',
//       textColor: 'text-cyan-600',
//     },
//   ];

//   const flightStatusData = [
//     { name: 'Scheduled', value: flights.filter(f => f.status === 'scheduled').length },
//     { name: 'Delayed', value: flights.filter(f => f.status === 'delayed').length },
//     { name: 'Cancelled', value: flights.filter(f => f.status === 'cancelled').length },
//   ];

//   const bookingTrends = airlines.map(airline => ({
//     name: airline.code,
//     bookings: bookings.filter(b => {
//       const flight = flights.find(f => f.id === b.flightId);
//       return flight?.airlineId === airline.id;
//     }).length,
//   }));

//   const quickActions = [
//     {
//       icon: Plane,
//       label: 'Manage Flights',
//       description: 'Add or edit flight schedules',
//       path: '/admin/flights',
//       color: 'from-[#1E3A8A] to-[#06B6D4]',
//     },
//     {
//       icon: Building2,
//       label: 'Manage Airlines',
//       description: 'Update airline information',
//       path: '/admin/airlines',
//       color: 'from-purple-500 to-purple-600',
//     },
//     {
//       icon: MapPin,
//       label: 'Manage Airports',
//       description: 'Add or modify airports',
//       path: '/admin/airports',
//       color: 'from-green-500 to-green-600',
//     },
//     {
//       icon: Calendar,
//       label: 'View All Bookings',
//       description: 'Monitor passenger bookings',
//       path: '/admin/bookings',
//       color: 'from-orange-500 to-orange-600',
//     },
//   ];

//   return (
//     <Layout>
//       <div className="max-w-7xl mx-auto">
//         <div className="mb-8">
//           <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
//           <p className="text-gray-600">Manage your airline operations</p>
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
//           {stats.map((stat, index) => {
//             const Icon = stat.icon;
//             return (
//               <div
//                 key={index}
//                 className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
//               >
//                 <div className="flex items-start justify-between">
//                   <div>
//                     <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
//                     <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
//                   </div>
//                   <div className={`w-12 h-12 ${stat.bgColor} rounded-xl flex items-center justify-center`}>
//                     <Icon className={`w-6 h-6 ${stat.textColor}`} />
//                   </div>
//                 </div>
//               </div>
//             );
//           })}
//         </div>

//         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
//             <h2 className="text-xl font-bold text-gray-900 mb-6">Flight Status Overview</h2>
//             <ResponsiveContainer width="100%" height={250}>
//               <BarChart data={flightStatusData}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="name" stroke="#9ca3af" />
//                 <YAxis stroke="#9ca3af" />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: 'white',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '8px'
//                   }}
//                 />
//                 <Bar dataKey="value" fill="#1E3A8A" radius={[8, 8, 0, 0]} />
//               </BarChart>
//             </ResponsiveContainer>
//           </div>

//           <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
//             <h2 className="text-xl font-bold text-gray-900 mb-6">Bookings by Airline</h2>
//             <ResponsiveContainer width="100%" height={250}>
//               <LineChart data={bookingTrends}>
//                 <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
//                 <XAxis dataKey="name" stroke="#9ca3af" />
//                 <YAxis stroke="#9ca3af" />
//                 <Tooltip
//                   contentStyle={{
//                     backgroundColor: 'white',
//                     border: '1px solid #e5e7eb',
//                     borderRadius: '8px'
//                   }}
//                 />
//                 <Line type="monotone" dataKey="bookings" stroke="#06B6D4" strokeWidth={3} dot={{ fill: '#06B6D4', r: 5 }} />
//               </LineChart>
//             </ResponsiveContainer>
//           </div>
//         </div>

//         <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
//           <h2 className="text-xl font-bold text-gray-900 mb-6">Quick Actions</h2>
//           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
//             {quickActions.map((action, index) => {
//               const Icon = action.icon;
//               return (
//                 <button
//                   key={index}
//                   onClick={() => navigate(action.path)}
//                   className="bg-white border-2 border-gray-200 p-6 rounded-xl hover:border-[#06B6D4] hover:shadow-lg transition-all duration-200 text-left group"
//                 >
//                   <div className={`w-12 h-12 bg-gradient-to-r ${action.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
//                     <Icon className="w-6 h-6 text-white" />
//                   </div>
//                   <h3 className="font-semibold text-gray-900 mb-1">{action.label}</h3>
//                   <p className="text-xs text-gray-500">{action.description}</p>
//                 </button>
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </Layout>
//   );
// }
import { useNavigate } from 'react-router-dom';
import { Plane, Building2, MapPin, Calendar, DollarSign, TrendingUp } from 'lucide-react';
import Layout from '../components/Layout';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { useEffect, useState } from 'react';

export default function AdminDashboard() {
  const navigate = useNavigate();

  const [statsData, setStatsData] = useState({
    totalFlights: 0,
    totalBookings: 0,
    totalRevenue: 0,
    totalPassengers: 0
  });

  const [airlinesCount, setAirlinesCount] = useState(0);
  const [airportsCount, setAirportsCount] = useState(0);
  
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH FROM BACKEND
  useEffect(() => {
    Promise.all([
  fetch("http://localhost:5000/admin-stats").then(res => res.json()),
  fetch("http://localhost:5000/airlines").then(res => res.json()),
  fetch("http://localhost:5000/airports").then(res => res.json()),
  fetch("http://localhost:5000/admin-analytics").then(res => res.json())
])
.then(([stats, airlines, airports, analytics]) => {

  setStatsData({
    totalFlights: stats.totalFlights || 0,
    totalBookings: stats.totalBookings || 0,
    totalRevenue: Number(stats.totalRevenue || 0),
    totalPassengers: stats.totalPassengers || 0
  });

  setAirlinesCount(airlines.length || 0);
  setAirportsCount(airports.length || 0);

  // 📊 STATUS GRAPH
  setFlightStatusData(
    analytics.statusData.map((s: any) => ({
      name: s.status,
      value: Number(s.count)
    }))
  );

  // 📈 AIRLINE GRAPH
  setBookingTrends(
    analytics.airlineData.map((a: any) => ({
      name: a.name,
      bookings: Number(a.bookings)
    }))
  );

  setLoading(false);
});
  }, []);

  const stats = [
    {
      icon: Plane,
      label: 'Total Flights',
      value: statsData.totalFlights,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      icon: Building2,
      label: 'Airlines',
      value: airlinesCount, // ✅ FIXED
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      icon: MapPin,
      label: 'Airports',
      value: airportsCount, // ✅ FIXED
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      icon: Calendar,
      label: 'Total Bookings',
      value: statsData.totalBookings,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
    },
    {
      icon: DollarSign,
      label: 'Total Revenue',
      value: `₹${statsData.totalRevenue}`,
      color: 'from-emerald-500 to-emerald-600',
      bgColor: 'bg-emerald-50',
      textColor: 'text-emerald-600',
    },
    {
      icon: TrendingUp,
      label: 'Passengers',
      value: statsData.totalPassengers,
      color: 'from-cyan-500 to-cyan-600',
      bgColor: 'bg-cyan-50',
      textColor: 'text-cyan-600',
    },
  ];

  // ⚠️ Keep charts safe (we'll fix later)
  const [flightStatusData, setFlightStatusData] = useState<any[]>([]);
  const [bookingTrends, setBookingTrends] = useState<any[]>([]);

  const quickActions = [
    {
      icon: Plane,
      label: 'Manage Flights',
      description: 'Add or edit flight schedules',
      path: '/admin/flights',
      color: 'from-[#1E3A8A] to-[#06B6D4]',
    },
    {
      icon: Building2,
      label: 'Manage Airlines',
      description: 'Update airline information',
      path: '/admin/airlines',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: MapPin,
      label: 'Manage Airports',
      description: 'Add or modify airports',
      path: '/admin/airports',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Calendar,
      label: 'View All Bookings',
      description: 'Monitor passenger bookings',
      path: '/admin/bookings',
      color: 'from-orange-500 to-orange-600',
    },
  ];

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage your airline operations</p>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border">
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

            {/* Charts (leave as is, we fix next step) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Flight Status Overview</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={flightStatusData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#1E3A8A" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm">
                <h2 className="text-xl font-bold mb-4">Bookings by Airline</h2>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={bookingTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="bookings" stroke="#06B6D4" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Quick Actions unchanged */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border">
              <h2 className="text-xl font-bold mb-6">Quick Actions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <button
                      key={index}
                      onClick={() => navigate(action.path)}
                      className="border p-6 rounded-xl text-left hover:shadow-lg"
                    >
                      <Icon className="w-6 h-6 mb-2" />
                      <h3 className="font-semibold">{action.label}</h3>
                      <p className="text-xs text-gray-500">{action.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}