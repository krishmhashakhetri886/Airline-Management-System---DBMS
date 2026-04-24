import { useState, useEffect } from 'react';
import Layout from '../../components/Layout';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';

type Airline = {
  airline_id: number;
  name: string;
};

type Aircraft = {
  aircraft_id: number;
  airline_id: number;
  model: string;
  total_seats: number;
};

type Airport = {
  airport_code: string;
  name: string;
  city: string;
  terminal: string;
};

type FlightFormData = {
  flight_id: string;
  departure_time: string;
  arrival_time: string;
  available_seats: string;
  economy_price: string;
  business_price: string;
  aircraft_id: string;
};

export default function ManageFlights() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingFlightId, setEditingFlightId] = useState<number | null>(null);

  // ✅ NEW STATE (FORM)
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<FlightFormData>({
    flight_id: '',
    departure_time: '',
    arrival_time: '',
    available_seats: '',
    economy_price: '',
    business_price: '',
    aircraft_id: ''
  });

  // ✅ NEW STATE (DROPDOWNS & DEPENDENCIES)
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [aircrafts, setAircrafts] = useState<Aircraft[]>([]);
  const [selectedAirline, setSelectedAirline] = useState<number | ''>('');
  const [selectedAircraft, setSelectedAircraft] = useState('');

  const [sourceCity, setSourceCity] = useState('');
  const [sourceAirport, setSourceAirport] = useState<Airport | null>(null);
  const [sourceTerminal, setSourceTerminal] = useState('');

  const [destinationCity, setDestinationCity] = useState('');
  const [destinationAirport, setDestinationAirport] = useState<Airport | null>(null);
  const [destinationTerminal, setDestinationTerminal] = useState('');

  // 🔥 FETCH
  const fetchFlights = () => {
    fetch("http://localhost:5000/admin-flights")
      .then(res => res.json())
      .then(data => {
        console.log("Flights API response:", data);
        setFlights(Array.isArray(data) ? data : (data?.flights || []));
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  };

  // 🔥 FETCH AIRLINES & AIRPORTS ON MOUNT
  const fetchDropdownData = () => {
    Promise.all([
      fetch("http://localhost:5000/airlines").then(res => res.json()),
      fetch("http://localhost:5000/airports").then(res => res.json())
    ])
      .then(([airlinesData, airportsData]) => {
        setAirlines(airlinesData);
        setAirports(airportsData);
      })
      .catch(err => {
        console.error("Error fetching dropdown data:", err);
      });
  };

  useEffect(() => {
    fetchFlights();
    fetchDropdownData();
  }, []);

  useEffect(() => {
    console.log("Flights Data:", flights);
  }, [flights]);

  const normalizeAircrafts = (data: any): Aircraft[] => {
    if (!Array.isArray(data)) return [];
    return data.map((item) => ({
      aircraft_id: Number(item.aircraft_id),
      airline_id: Number(item.airline_id ?? selectedAirline ?? 0),
      model: String(item.model || ''),
      total_seats: Number(item.total_seats ?? item.capacity ?? 0),
    }));
  };

  // 🔍 FILTER
  const filteredFlights = flights.filter(flight =>
    ((flight?.source || '') + (flight?.destination || ''))
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const uniqueCities = Array.from(new Set(airports.map((airport) => airport.city))).sort();

  const filteredDestinationCities = uniqueCities
    .filter((city) => city !== sourceCity);

  const sourceAirports = airports.filter((airport) => airport.city === sourceCity);
  const destinationAirports = airports.filter((airport) => airport.city === destinationCity);

  const parseTerminalOptions = (terminalValue: string | undefined) => {
    if (!terminalValue) return [];
    return terminalValue
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  };

  const sourceTerminalOptions = sourceAirport ? parseTerminalOptions(sourceAirport.terminal) : [];
  const destinationTerminalOptions = destinationAirport ? parseTerminalOptions(destinationAirport.terminal) : [];

  if (loading) {
    return <p>Loading flights...</p>;
  }

  if (!flights || flights.length === 0) {
    return <p>No flights found</p>;
  }

  const formatDateTimeForBackend = (value: string) => {
    if (!value) return '';
    return `${value.replace('T', ' ')}:00`;
  };

  const formatDateTimeForInput = (value: string) => {
    if (!value) return '';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const pad = (num: number) => String(num).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  // ✅ HANDLE INPUT
  const handleChange = (e: any) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // ✅ HANDLE AIRLINE CHANGE
  const handleAirlineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const airlineId = Number(e.target.value);
    if (!airlineId) {
      setSelectedAirline('');
      setAircrafts([]);
      setSelectedAircraft('');
      setFormData((prev) => ({
        ...prev,
        aircraft_id: '',
        available_seats: ''
      }));
      console.log('Selected Airline:', '');
      console.log('Aircrafts:', []);
      return;
    }

    setSelectedAirline(airlineId);
    setSelectedAircraft('');
    setFormData((prev) => ({
      ...prev,
      aircraft_id: '',
      available_seats: ''
    }));

    console.log('Selected Airline:', airlineId);

    fetch(`http://localhost:5000/aircrafts/${airlineId}`)
      .then(res => res.json())
      .then(data => {
        const normalized = normalizeAircrafts(data);
        setAircrafts(normalized);
        console.log('Aircrafts:', normalized);
      })
      .catch((error) => {
        console.error('Error fetching aircrafts:', error);
        setAircrafts([]);
      });
  };

  // ✅ HANDLE AIRCRAFT CHANGE & AUTO-FILL SEATS
  const handleAircraftChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const aircraftId = e.target.value;
    setSelectedAircraft(aircraftId);

    if (aircraftId) {
      const selected = aircrafts.find(ac => ac.aircraft_id === Number(aircraftId));
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          aircraft_id: aircraftId,
          available_seats: selected.total_seats.toString()
        }));
        console.log('[AddFlight] Aircraft selected', { aircraftId, total_seats: selected.total_seats });
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        aircraft_id: '',
        available_seats: ''
      }));
    }
  };

  const handleEdit = (flight: any) => {
    const sourceAirportData = airports.find((airport) => airport.airport_code === flight.source) || null;
    const destinationAirportData = airports.find((airport) => airport.airport_code === flight.destination) || null;

    setIsEditMode(true);
    setEditingFlightId(Number(flight.flight_id));
    setShowForm(true);
    setSelectedAirline(Number(flight.airline_id || 0));
    setSelectedAircraft(String(flight.aircraft_id || ''));
    setSourceCity(sourceAirportData?.city || '');
    setSourceAirport(sourceAirportData);
    setSourceTerminal(flight.source_terminal || '');
    setDestinationCity(destinationAirportData?.city || '');
    setDestinationAirport(destinationAirportData);
    setDestinationTerminal(flight.destination_terminal || '');
    setFormData({
      flight_id: String(flight.flight_id || ''),
      departure_time: formatDateTimeForInput(flight.departure_time),
      arrival_time: formatDateTimeForInput(flight.arrival_time),
      available_seats: String(flight.available_seats ?? ''),
      economy_price: String(flight.economy_price ?? ''),
      business_price: String(flight.business_price ?? ''),
      aircraft_id: String(flight.aircraft_id || '')
    });

    if (flight.airline_id) {
      fetch(`http://localhost:5000/aircrafts/${flight.airline_id}`)
        .then(res => res.json())
        .then(data => {
          const normalized = normalizeAircrafts(data);
          setAircrafts(normalized);
        })
        .catch((error) => {
          console.error('Error fetching aircrafts for edit:', error);
          setAircrafts([]);
        });
    }
  };

  const handleSourceCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    setSourceCity(city);
    setSourceAirport(null);
    setSourceTerminal('');
    setDestinationCity('');
    setDestinationAirport(null);
    setDestinationTerminal('');
    console.log('[AddFlight] Source city selected', { city });
  };

  const handleSourceAirportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const airportCode = e.target.value;
    const selected = sourceAirports.find((airport) => airport.airport_code === airportCode) || null;
    setSourceAirport(selected);
    setSourceTerminal('');
    console.log('[AddFlight] Source airport selected', { airportCode, terminal: selected?.terminal || '' });
  };

  const handleDestinationCityChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const city = e.target.value;
    if (city && city === sourceCity) {
      alert('Destination city cannot be same as source city');
      console.log('[AddFlight] Invalid destination city blocked', { city, sourceCity });
      return;
    }
    setDestinationCity(city);
    setDestinationAirport(null);
    setDestinationTerminal('');
    console.log('[AddFlight] Destination city selected', { city });
  };

  const handleDestinationAirportChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const airportCode = e.target.value;
    const selected = destinationAirports.find((airport) => airport.airport_code === airportCode) || null;
    setDestinationAirport(selected);
    setDestinationTerminal('');
    console.log('[AddFlight] Destination airport selected', { airportCode, terminal: selected?.terminal || '' });
  };

  const handleSourceTerminalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSourceTerminal(e.target.value);
  };

  const handleDestinationTerminalChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setDestinationTerminal(e.target.value);
  };

  // ✅ SUBMIT FORM
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    // ✅ VALIDATION
    if (!sourceCity || !sourceAirport || !sourceTerminal) {
      alert("Please complete source city, airport, and terminal selection");
      return;
    }

    if (!destinationCity || !destinationAirport || !destinationTerminal) {
      alert("Please complete destination city, airport, and terminal selection");
      return;
    }

    if (sourceCity === destinationCity) {
      alert("Source and destination city cannot be the same");
      return;
    }

    if (sourceAirport.airport_code === destinationAirport.airport_code) {
      alert("Please select source and destination airports");
      return;
    }

    if (!selectedAircraft) {
      alert("Please select an aircraft");
      return;
    }

    if (!formData.departure_time || !formData.arrival_time) {
      alert("Please fill in departure and arrival time");
      return;
    }

    if (!formData.economy_price || !formData.business_price) {
      alert("Please enter economy and business prices");
      return;
    }

    try {
      const payload = {
        source: sourceAirport.airport_code,
        destination: destinationAirport.airport_code,
        departure_time: formatDateTimeForBackend(formData.departure_time),
        arrival_time: formatDateTimeForBackend(formData.arrival_time),
        source_terminal: sourceTerminal,
        destination_terminal: destinationTerminal,
        available_seats: Number(formData.available_seats),
        economy_price: Number(formData.economy_price),
        business_price: Number(formData.business_price),
        aircraft_id: Number(formData.aircraft_id)
      };

      console.log('[AddFlight] Submitting payload', payload);

      const url = isEditMode && editingFlightId
        ? `http://localhost:5000/update-flight/${editingFlightId}`
        : "http://localhost:5000/add-flight";

      const res = await fetch(url, {
        method: isEditMode ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || (isEditMode ? "Error updating flight" : "Error adding flight"));
        return;
      }

      alert(isEditMode ? "Flight updated successfully ✅" : "Flight added successfully ✅");
      setShowForm(false);
      setIsEditMode(false);
      setEditingFlightId(null);
      setFormData({
        flight_id: '',
        departure_time: '',
        arrival_time: '',
        available_seats: '',
        economy_price: '',
        business_price: '',
        aircraft_id: ''
      });
      setSelectedAirline('');
      setSelectedAircraft('');
      setSourceCity('');
      setSourceAirport(null);
      setSourceTerminal('');
      setDestinationCity('');
      setDestinationAirport(null);
      setDestinationTerminal('');
      fetchFlights();

    } catch (err) {
      console.error(err);
      alert(isEditMode ? "Error updating flight" : "Error adding flight");
    }
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manage Flights</h1>
            <p className="text-gray-600">All flights from database</p>
          </div>

          {/* ✅ UPDATED BUTTON */}
          <button
            onClick={() => {
              setIsEditMode(false);
              setEditingFlightId(null);
              setShowForm(true);
            }}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Flight
          </button>
        </div>

        {/* ✅ MODAL FORM */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900">Add Flight</h2>
              <p className="text-sm text-gray-500 mt-1">
                {isEditMode ? 'Edit flight details' : 'Create a new flight'}
              </p>

              <form onSubmit={handleSubmit} className="space-y-5 mt-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Airline</label>
                    <select
                      value={selectedAirline}
                      onChange={handleAirlineChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    >
                      <option value="">Select Airline</option>
                      {airlines.map(airline => (
                        <option key={airline.airline_id} value={airline.airline_id}>
                          {airline.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Aircraft</label>
                    <select
                      value={selectedAircraft}
                      onChange={handleAircraftChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      disabled={!selectedAirline}
                      required
                    >
                      <option value="">{selectedAirline ? "Select Aircraft" : "Select Airline First"}</option>
                      {selectedAirline && aircrafts.length === 0 && (
                        <option value="" disabled>No aircraft available</option>
                      )}
                      {aircrafts.map(aircraft => (
                        <option key={aircraft.aircraft_id} value={aircraft.aircraft_id}>
                          {aircraft.model} ({aircraft.total_seats} seats)
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source City</label>
                    <select
                      value={sourceCity}
                      onChange={handleSourceCityChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    >
                      <option value="">Select Source City</option>
                      {uniqueCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source Airport</label>
                    <select
                      value={sourceAirport?.airport_code || ''}
                      onChange={handleSourceAirportChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      disabled={!sourceCity}
                      required
                    >
                      <option value="">{sourceCity ? "Select Source Airport" : "Select Source City First"}</option>
                      {sourceAirports.map((airport) => (
                        <option key={airport.airport_code} value={airport.airport_code}>
                          {airport.airport_code} - {airport.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Source Terminal</label>
                    <select
                      name="source_terminal"
                      value={sourceTerminal}
                      onChange={handleSourceTerminalChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      disabled={!sourceAirport}
                      required
                    >
                      <option value="">{sourceAirport ? 'Select Source Terminal' : 'Select Source Airport First'}</option>
                      {sourceTerminalOptions.map((terminal) => (
                        <option key={terminal} value={terminal}>
                          {terminal}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination City</label>
                    <select
                      value={destinationCity}
                      onChange={handleDestinationCityChange}
                      disabled={!sourceCity}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    >
                      <option value="">{sourceCity ? "Select Destination City" : "Select Source City First"}</option>
                      {filteredDestinationCities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination Airport</label>
                    <select
                      value={destinationAirport?.airport_code || ''}
                      onChange={handleDestinationAirportChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      disabled={!destinationCity}
                      required
                    >
                      <option value="">{destinationCity ? "Select Destination Airport" : "Select Destination City First"}</option>
                      {destinationAirports.map((airport) => (
                        <option key={airport.airport_code} value={airport.airport_code}>
                          {airport.airport_code} - {airport.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Destination Terminal</label>
                    <select
                      name="destination_terminal"
                      value={destinationTerminal}
                      onChange={handleDestinationTerminalChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      disabled={!destinationAirport}
                      required
                    >
                      <option value="">{destinationAirport ? 'Select Destination Terminal' : 'Select Destination Airport First'}</option>
                      {destinationTerminalOptions.map((terminal) => (
                        <option key={terminal} value={terminal}>
                          {terminal}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Departure Time</label>
                    <input
                      name="departure_time"
                      type="datetime-local"
                      value={formData.departure_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Arrival Time</label>
                    <input
                      name="arrival_time"
                      type="datetime-local"
                      value={formData.arrival_time}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Available Seats</label>
                    <input
                      name="available_seats"
                      type="number"
                      placeholder="Seats (Auto-filled from Aircraft)"
                      value={formData.available_seats}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      readOnly
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Economy Price</label>
                    <input
                      name="economy_price"
                      type="number"
                      placeholder="Economy Price"
                      value={formData.economy_price}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Business Price</label>
                    <input
                      name="business_price"
                      type="number"
                      placeholder="Business Price"
                      value={formData.business_price}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      required
                    />
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    {isEditMode ? 'Update Flight' : 'Add Flight'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SEARCH */}
        <div className="bg-white p-4 rounded-xl mb-6 shadow">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search flights..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full border p-2 rounded"
            />
          </div>
        </div>

        {/* LOADING */}
        {loading && <p>Loading flights...</p>}

        {/* TABLE */}
        {!loading && (
          <div className="bg-white rounded-xl shadow overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-3 text-left">Flight ID</th>
                  <th className="p-3 text-left">Route</th>
                  <th className="p-3 text-left">Airline / Aircraft</th>
                  <th className="p-3 text-left">Departure</th>
                  <th className="p-3 text-left">Arrival</th>
                  <th className="p-3 text-left">Pricing</th>
                  <th className="p-3 text-left">Seats</th>
                  <th className="p-3 text-left">Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredFlights.map(flight => (
                  <tr key={flight.flight_id} className="border-t">
                    <td className="p-3">{flight.flight_id}</td>
                    <td className="p-3">
                      <div>{flight?.source_city || "Unknown"} ({flight?.source_airport_name || "-"}) - {flight?.source_terminal || "-"}</div>
                      <div>→ {flight?.destination_city || "Unknown"} ({flight?.destination_airport_name || "-"}) - {flight?.destination_terminal || "-"}</div>
                    </td>
                    <td className="p-3">
                      <div>{flight?.airline_name || "-"}</div>
                      <div className="text-sm text-gray-500">{flight?.model || "-"}</div>
                    </td>
                    <td className="p-3">{new Date(flight?.departure_time || Date.now()).toLocaleString()}</td>
                    <td className="p-3">{new Date(flight?.arrival_time || Date.now()).toLocaleString()}</td>
                    <td className="p-3 font-semibold text-blue-700">
                      <div>Economy: ₹{flight?.economy_price || 0}</div>
                      <div>Business: ₹{flight?.business_price || 0}</div>
                    </td>
                    <td className="p-3">{flight?.economy_seats || 0} Economy / {flight?.business_seats || 0} Business</td>
                    <td className="p-3 flex gap-2">
                      <button onClick={() => handleEdit(flight)} className="text-blue-600"><Edit2 size={16} /></button>
                      <button className="text-red-600"><Trash2 size={16} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredFlights.length === 0 && (
              <p className="text-center p-6 text-gray-500">No flights found</p>
            )}
          </div>
        )}

      </div>
    </Layout>
  );
}