import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import PassengerDashboard from './pages/PassengerDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Flights from './pages/Flights';
import BookFlight from './pages/BookFlight';
import MyBookings from './pages/MyBookings';
import MyPayments from './pages/MyPayments';

import ManageFlights from './pages/admin/ManageFlights';
import ManageAirlines from './pages/admin/ManageAirlines';
import ManageAirports from './pages/admin/ManageAirports';
import AllBookings from './pages/admin/AllBookings';

function DashboardRedirect() {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role === 'admin') {
    return <AdminDashboard />;
  }

  return <PassengerDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DataProvider>
          <Routes>
            <Route path="/login" element={<Login />} />

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardRedirect />
                </ProtectedRoute>
              }
            />

            <Route
              path="/flights"
              element={
                <ProtectedRoute allowedRoles={['passenger']}>
                  <Flights />
                </ProtectedRoute>
              }
            />

            <Route
              path="/book/:flightId"
              element={
                <ProtectedRoute allowedRoles={['passenger']}>
                  <BookFlight />
                </ProtectedRoute>
              }
            />

            <Route
              path="/bookings"
              element={
                <ProtectedRoute allowedRoles={['passenger']}>
                  <MyBookings />
                </ProtectedRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <ProtectedRoute allowedRoles={['passenger']}>
                  <MyPayments />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/flights"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageFlights />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/airlines"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageAirlines />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/airports"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <ManageAirports />
                </ProtectedRoute>
              }
            />

            <Route
              path="/admin/bookings"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <AllBookings />
                </ProtectedRoute>
              }
            />

            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </DataProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}