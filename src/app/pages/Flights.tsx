import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { Search, Plane, ArrowRight, AlertCircle } from 'lucide-react';

export default function Flights() {
  const navigate = useNavigate();

  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  // 🔥 FETCH FROM BACKEND
  useEffect(() => {
    fetch("http://localhost:5000/flights")
      .then(res => res.json())
      .then(data => {
        console.log("Flights API:", data);
        setFlights(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error fetching flights:", err);
        setLoading(false);
      });
  }, []);

  // 🔍 FILTER LOGIC
  const now = new Date();

  const filteredFlights = flights.filter(flight => {
    if (!flight.departure_time) return false;

    const departure = new Date(flight.departure_time);
    if (isNaN(departure.getTime()) || departure <= now) return false;

    const matchSource = !source || flight.source === source;
    const matchDestination = !destination || flight.destination === destination;
    return matchSource && matchDestination;
  });

  const handleBookFlight = (flightId: number) => {
    navigate(`/book/${flightId}`);
  };

  const withAirportDeletedLabel = (name: string, status?: string) => {
    if (!name) return name;
    return status === 'INACTIVE' ? `${name} (Airport Deleted)` : name;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

        <h1 className="text-3xl font-bold mb-6">Search Flights</h1>

        {/* FILTERS */}
        <div className="bg-white p-6 rounded-xl shadow mb-6 grid grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Source"
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="border p-2 rounded"
          />

          <input
            type="text"
            placeholder="Destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            className="border p-2 rounded"
          />

          <button className="bg-blue-600 text-white rounded px-4 py-2 flex items-center justify-center gap-2">
            <Search size={18} />
            Search
          </button>
        </div>

        {/* LOADING */}
        {loading && <p>Loading flights...</p>}

        {/* NO DATA */}
        {!loading && filteredFlights.length === 0 && (
          <div className="text-center mt-10">
            <AlertCircle className="mx-auto mb-2" />
            <p>No flights found</p>
          </div>
        )}

        {/* FLIGHTS LIST */}
        <div className="space-y-4">
          {filteredFlights.map((flight) => (
            <div key={flight.flight_id} className="bg-white p-5 rounded-xl shadow flex justify-between items-center">

              <div>
                {/* ✈️ ROUTE */}
                <p className="font-bold text-lg">
                  {flight.source} → {flight.destination}
                </p>

                {/* 🆕 AIRLINE */}
                {flight.airline_name && (
                  <p className="text-sm text-blue-600 font-medium">
                    {flight.airline_name}
                  </p>
                )}

                {/* 🆕 AIRPORT NAMES */}
                {(flight.source_airport || flight.destination_airport) && (
                  <p className="text-sm text-gray-500">
                    {withAirportDeletedLabel(flight.source_airport, flight.source_airport_status)} → {withAirportDeletedLabel(flight.destination_airport, flight.destination_airport_status)}
                  </p>
                )}

                <p className="text-sm text-gray-500">
                  Departure: {new Date(flight.departure_time).toLocaleString()}
                </p>

                <p className="text-sm text-gray-500">
                  Arrival: {new Date(flight.arrival_time).toLocaleString()}
                </p>

                <p className="text-sm">
                  Seats Available: {flight.available_seats}
                </p>
              </div>

              <div className="text-right">
                <p className="text-xl font-bold text-blue-700">
                  ₹{flight.economy_price || 0}
                </p>

                {flight.available_seats > 0 ? (
                  <button
                    onClick={() => handleBookFlight(flight.flight_id)}
                    className="mt-2 bg-blue-600 text-white px-4 py-2 rounded flex items-center gap-2"
                  >
                    Book
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button disabled className="mt-2 bg-gray-300 px-4 py-2 rounded">
                    Sold Out
                  </button>
                )}
              </div>

            </div>
          ))}
        </div>

      </div>
    </Layout>
  );
}