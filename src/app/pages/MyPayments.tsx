import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { CreditCard, CheckCircle, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';

export default function MyPayments() {
  const { user } = useAuth();

  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 🔥 FETCH FROM BACKEND
  useEffect(() => {
    if (!user?.id) return;

    fetch(`http://localhost:5000/payments/${user.id}`)
      .then(res => res.json())
      .then(data => {
        console.log("PAYMENTS DATA:", data);
        const mapped = data.map((p: any) => {
          const status = p.status?.toUpperCase();

          // Map booking_status and flight_status to displayStatus
          let displayStatus = 'Completed'; // default

          if (p.booking_status === 'CANCELLED') {
            displayStatus = 'Refunded';
          } else if (p.flight_status === 'INACTIVE') {
            displayStatus = 'Refunded';
          }

          return {
            id: p.payment_id,
            bookingId: p.booking_id,
            amount: Number(p.amount),
            method: p.method || 'card',

            status:
              status === 'SUCCESS'
                ? 'completed'
                : status === 'PENDING'
                ? 'pending'
                : 'failed',

            displayStatus,

            paymentDate: new Date()
          };
        });

        setPayments(mapped);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, [user]);

  const userPayments = payments;

  const totalPaid = userPayments.reduce((sum, p) => sum + p.amount, 0);

  const refundedAmount = userPayments
    .filter(p => p.displayStatus === 'Refunded')
    .reduce((sum, p) => sum + p.amount, 0);

  const effectiveSpent = totalPaid - refundedAmount;

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return null;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'failed':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment History</h1>
          <p className="text-gray-600">Track all your transactions and payments</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Total Payments</p>
                <p className="text-3xl font-bold text-gray-900">{userPayments.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Completed</p>
                <p className="text-3xl font-bold text-gray-900">
                  {userPayments.filter(p => p.status === 'completed').length}
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
                <p className="text-gray-600 text-sm mb-1">Total Spent</p>
                <p className="text-3xl font-bold text-gray-900">₹{effectiveSpent}</p>
              </div>
              <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">Refunded</p>
                <p className="text-3xl font-bold text-gray-900">₹{refundedAmount}</p>
              </div>
              <div className="w-12 h-12 bg-red-50 rounded-xl flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : userPayments.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 shadow-sm border border-gray-200 text-center">
            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Yet</h3>
            <p className="text-gray-500">Your payment history will appear here</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Payment ID</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Booking</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Method</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {userPayments.map(payment => (
                    <tr key={payment.id}>
                      <td className="px-6 py-4">{payment.id}</td>
                      <td className="px-6 py-4">Booking: {payment.bookingId}</td>
                      <td className="px-6 py-4">
                        {format(new Date(payment.paymentDate), 'MMM dd, yyyy')}
                      </td>
                      <td className="px-6 py-4">{payment.method}</td>
                      <td className="px-6 py-4">₹{payment.amount}</td>
                      <td className="px-6 py-4">
                        <div className="px-3 py-1 rounded bg-gray-100 text-gray-800">
                          {payment.displayStatus}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>

              </table>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}