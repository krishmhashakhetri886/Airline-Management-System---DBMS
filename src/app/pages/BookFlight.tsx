import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { ArrowLeft, ArrowRight, Plane, CreditCard, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

type BookingStep = 'details' | 'seats' | 'review' | 'payment' | 'success';

export default function BookFlight() {
  const { flightId } = useParams<{ flightId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [flight, setFlight] = useState<any>(null);
  const [bookedSeats, setBookedSeats] = useState<string[]>([]);

  const [step, setStep] = useState<BookingStep>('details');
  const [numTickets, setNumTickets] = useState(1);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [passengerName, setPassengerName] = useState(user?.name || '');
  const [passengerEmail, setPassengerEmail] = useState(user?.email || '');
  const [paymentMethod, setPaymentMethod] = useState('credit_card');
  const [cardNumber, setCardNumber] = useState('');
  const [bookingId, setBookingId] = useState('');
  const [paymentError, setPaymentError] = useState('');

  // ✅ FETCH FLIGHT
  useEffect(() => {
    fetch("http://localhost:5000/flights")
      .then(res => res.json())
      .then(data => {
        const f = data.find((x: any) => x.flight_id == flightId);
        if (!f) navigate('/flights');
        setFlight(f);
      });
  }, [flightId, navigate]);

  // ✅ FETCH BOOKED SEATS
  useEffect(() => {
    fetch(`http://localhost:5000/booked-seats/${flightId}`)
      .then(res => res.json())
      .then(data => {
        const seats = Array.isArray(data)
          ? data.map((s: any) => s.seat_number).filter(Boolean)
          : [];
        setBookedSeats(seats);
      })
      .catch(() => setBookedSeats([]));
  }, [flightId]);

  if (!flight) return null;
  console.log("Flight with seats:", flight);

  // ✅ GENERATE SEATS (UI SAME)
  const businessCount = Number(flight?.business_seats || 0);
  const economyCount = Number(flight?.economy_seats || 0);

  console.log('Seats count:', businessCount, economyCount);

  if (businessCount === 0 && economyCount === 0) {
    return <p>No seats available</p>;
  }

  const businessSeats = Array.from(
    { length: businessCount },
    (_, i) => `B${i + 1}`
  );

  const economySeats = Array.from(
    { length: economyCount },
    (_, i) => `E${i + 1}`
  );

  const seats = [...businessSeats, ...economySeats];

  const selectedSeat = selectedSeats[0];
  const selectedClass = selectedSeat?.startsWith('B') ? 'Business' : 'Economy';

  const price =
    selectedClass === 'Business'
      ? Number(flight.business_price || 0)
      : Number(flight.economy_price || 0);

  const totalAmount = selectedSeats.length * price;

  const handleSeatClick = (seatId: string, isBooked: boolean) => {
    if (isBooked) return;

    const seatClass = seatId.startsWith('B') ? 'Business' : 'Economy';

    if (selectedSeats.includes(seatId)) {
      const updatedSeats = selectedSeats.filter(s => s !== seatId);
      setSelectedSeats(updatedSeats);
      return;
    }

    if (selectedSeats.length >= numTickets) return;

    if (selectedSeats.length > 0) {
      const currentClass = selectedSeats[0].startsWith('B') ? 'Business' : 'Economy';
      if (currentClass !== seatClass) {
        alert('Please select seats from the same class');
        return;
      }
    }

    setSelectedSeats([...selectedSeats, seatId]);
  };

  // ✅ REAL PAYMENT
  const handlePayment = async () => {
  setPaymentError('');

  // 🔴 Card validation
  if (!cardNumber || cardNumber.length < 16) {
    setPaymentError('Please enter a valid card number');
    return;
  }

  // 🔴 Safety checks (IMPORTANT)
  if (!flight || !flight.flight_id) {
    setPaymentError("Invalid flight data");
    return;
  }

  if (!selectedSeats || selectedSeats.length === 0) {
    setPaymentError("Please select at least one seat");
    return;
  }

  if (!user?.id) {
    setPaymentError("Please login to continue booking");
    return;
  }

  try {
    const parseResponse = async (response: Response) => {
      const text = await response.text();
      if (!text) return {};
      try {
        return JSON.parse(text);
      } catch {
        return { message: text };
      }
    };

    // 🔥 BOOKING PAYLOAD (SAFE)
    const bookingPayload = {
      passenger_id: user?.id,
      flight_id: Number(flight.flight_id),
      seats: selectedSeats,
      amount: Number(totalAmount),
      class: selectedClass
    };

    console.log("[BOOKING] Payload:", bookingPayload);

    const bookingRes = await fetch("http://localhost:5000/booking", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(bookingPayload)
    });

    const bookingData = await parseResponse(bookingRes);

    console.log("[BOOKING] Status:", bookingRes.status);
    console.log("[BOOKING] Data:", bookingData);

    if (!bookingRes.ok) {
      throw new Error(bookingData.error || "Booking failed");
    }

    if (!bookingData.booking_id) {
      throw new Error("Booking ID not returned from server");
    }

    // 🔥 PAYMENT
    const paymentPayload = {
      booking_id: bookingData.booking_id,
      method: paymentMethod,
      status: "Success"
    };

    console.log("[PAYMENT] Payload:", paymentPayload);

    const paymentRes = await fetch("http://localhost:5000/payment", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(paymentPayload)
    });

    const paymentData = await parseResponse(paymentRes);

    console.log("[PAYMENT] Status:", paymentRes.status);
    console.log("[PAYMENT] Data:", paymentData);

    if (!paymentRes.ok) {
      throw new Error(paymentData.error || "Payment failed");
    }

    // ✅ SUCCESS
    setBookingId(String(bookingData.booking_id));
    setStep('success');

  } catch (err: any) {
    console.error("FINAL ERROR:", err);
    setPaymentError(err.message || "Payment failed");
  }
};

  // ⚠️ UI PART BELOW IS SAME (only small replacements)

  const renderStepIndicator = () => {
    const steps = [
      { key: 'details', label: 'Details' },
      { key: 'seats', label: 'Seats' },
      { key: 'review', label: 'Review' },
      { key: 'payment', label: 'Payment' },
    ];

    const currentIndex = steps.findIndex(s => s.key === step);

    return (
      <div className="flex items-center justify-between mb-8">
        {steps.map((s, index) => (
          <div key={s.key} className="flex items-center flex-1">
            <div className="flex flex-col items-center flex-1">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                index <= currentIndex ? 'bg-[#1E3A8A] text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {index + 1}
              </div>
              <p className={`text-xs mt-2 ${
                index <= currentIndex ? 'text-[#1E3A8A]' : 'text-gray-500'
              }`}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderDetails = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] rounded-2xl p-6 text-white">
        <h2 className="text-2xl font-bold">{flight.source} → {flight.destination}</h2>
        <p>{format(new Date(flight.departure_time), 'MMM dd, HH:mm')}</p>
        <p className="mt-2 text-sm text-white/90">
          Economy Price: ₹{Number(flight.economy_price || 0)}
        </p>
        <p className="text-sm text-white/90">
          Business Price: ₹{Number(flight.business_price || 0)}
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 border">
        <select
          value={numTickets}
          onChange={(e) => {
            setNumTickets(Number(e.target.value));
            setSelectedSeats([]);
          }}
          className="w-full p-3 border rounded"
        >
          {[1,2,3,4,5].map(n => <option key={n}>{n}</option>)}
        </select>

        <input
          value={passengerName}
          onChange={(e) => setPassengerName(e.target.value)}
          className="w-full p-3 border rounded mt-3"
        />

        <input
          value={passengerEmail}
          onChange={(e) => setPassengerEmail(e.target.value)}
          className="w-full p-3 border rounded mt-3"
        />

        <button onClick={() => setStep('seats')} className="mt-4 bg-blue-600 text-white p-3 w-full">
          Continue
        </button>
      </div>
    </div>
  );

  const renderSeats = () => (
    <div>
      <div className="grid grid-cols-6 gap-2">
        {seats.map(seat => {
          const isSelected = selectedSeats.includes(seat);
          const isBooked = bookedSeats.includes(seat);

          return (
            <button
              key={seat}
              onClick={() => handleSeatClick(seat, isBooked)}
              disabled={isBooked}
              className={`p-2 border ${
                isBooked
                  ? 'bg-gray-400 cursor-not-allowed'
                  : isSelected
                  ? 'bg-blue-600 text-white'
                  : 'bg-white'
              }`}
            >
              {seat}
            </button>
          );
        })}
      </div>

      <button
        onClick={() => {
          if (!selectedSeats || selectedSeats.length === 0) {
            alert("Please select a seat");
            return;
          }
          setStep('review');
        }}
        disabled={!selectedSeats || selectedSeats.length === 0}
        className="mt-4 bg-blue-600 text-white p-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Next
      </button>
    </div>
  );

  const renderReview = () => {
  const selectedSeatObjects = seats.filter(s => selectedSeats.includes(s));

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Review Your Booking</h3>

        <div className="space-y-4">
          <div className="border-b border-gray-200 pb-4">
            <p className="text-sm text-gray-500 mb-1">Flight</p>
            <p className="font-semibold text-gray-900">
              {flight.source} → {flight.destination}
            </p>
            <p className="text-sm text-gray-600">
              {format(new Date(flight.departure_time), 'MMM dd, yyyy HH:mm')}
            </p>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <p className="text-sm text-gray-500 mb-1">Passenger</p>
            <p className="font-semibold text-gray-900">{passengerName}</p>
            <p className="text-sm text-gray-600">{passengerEmail}</p>
          </div>

          <div className="border-b border-gray-200 pb-4">
            <p className="text-sm text-gray-500 mb-2">Selected Seats</p>
            <div className="flex flex-wrap gap-2">
              {selectedSeatObjects.map(seat => (
                <div
                  key={seat}
                  className="bg-[#1E3A8A] text-white px-3 py-1 rounded-lg text-sm font-medium"
                >
                  {seat}
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Price per ticket</span>
              <span className="font-medium text-gray-900">₹{price}</span>
            </div>
            <div className="flex justify-between mb-2">
              <span className="text-gray-600">Number of tickets</span>
              <span className="font-medium text-gray-900">{selectedSeats.length}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-gray-200">
              <span className="font-bold text-gray-900">Total Amount</span>
              <span className="font-bold text-2xl text-[#1E3A8A]">₹{totalAmount}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-4 mt-6">
          <button
            onClick={() => setStep('seats')}
            className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2 font-medium"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={() => setStep('payment')}
            disabled={!selectedSeats || selectedSeats.length === 0}
            className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Proceed to Payment
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

  const renderPayment = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h3 className="text-xl font-bold text-gray-900 mb-6">Payment Information</h3>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Payment Method</label>
          <select
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <option value="credit_card">Credit Card</option>
            <option value="debit_card">Debit Card</option>
            <option value="upi">UPI</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Card Number</label>
          <input
            type="text"
            value={cardNumber}
            onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, '').slice(0, 16))}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg"
            placeholder="1234 5678 9012 3456"
          />
        </div>

        {paymentError && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            {paymentError}
          </div>
        )}

        <div className="bg-[#F3F4F6] rounded-xl p-4">
          <div className="flex justify-between items-center">
            <span className="font-bold text-gray-900">Total Amount</span>
            <span className="font-bold text-2xl text-[#1E3A8A]">₹{totalAmount}</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-6">
        <button
          onClick={() => setStep('review')}
          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        <button
          onClick={handlePayment}
          className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 font-medium"
        >
          <CreditCard className="w-5 h-5" />
          Complete Payment
        </button>
      </div>
    </div>
  </div>
);

  const renderSuccess = () => (
  <div className="space-y-6">
    <div className="bg-white rounded-2xl p-8 border border-gray-200 text-center">

      {/* ICON */}
      <div className="flex justify-center mb-4">
        <div className="bg-green-100 p-4 rounded-full">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
      </div>

      {/* TITLE */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Booking Confirmed 🎉
      </h2>

      <p className="text-gray-600 mb-6">
        Your flight has been successfully booked.
      </p>

      {/* BOOKING DETAILS */}
      <div className="bg-[#F3F4F6] rounded-xl p-6 text-left space-y-4">

        <div className="flex justify-between">
          <span className="text-gray-500">Booking ID</span>
          <span className="font-bold text-[#1E3A8A]">
            {bookingId || "Generating..."}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Route</span>
          <span className="font-medium text-gray-900">
            {flight.source} → {flight.destination}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Seats</span>
          <span className="font-medium text-gray-900">
            {selectedSeats.join(", ")}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="text-gray-500">Total Paid</span>
          <span className="font-bold text-green-600">
            ₹{totalAmount}
          </span>
        </div>

      </div>

      {/* ACTION BUTTONS */}
      <div className="flex gap-4 mt-6">

        <button
          onClick={() => navigate('/flights')}
          className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200"
        >
          Book Another Flight
        </button>

        <button
          onClick={() => navigate('/my-bookings')}
          className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg font-medium"
        >
          View My Bookings
        </button>

      </div>

    </div>
  </div>
);

  return (
    <Layout>
      {renderStepIndicator()}
      {step === 'details' && renderDetails()}
      {step === 'seats' && renderSeats()}
      {step === 'review' && renderReview()}
      {step === 'payment' && renderPayment()}
      {step === 'success' && renderSuccess()}
    </Layout>
  );
}
