import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { Building2, Plus, Edit2, Trash2, Search } from 'lucide-react';

type Airline = {
  airline_id: number;
  name: string;
  code: string;
};

type AircraftForm = {
  model: string;
  total_seats: string;
  economy_seats: string;
  business_seats: string;
};

type AircraftItem = {
  aircraft_id: number;
  model: string;
  total_seats: number;
  economy_seats: number;
  business_seats: number;
};

export default function ManageAirlines() {
  const [airlines, setAirlines] = useState<Airline[]>([]);
  const [aircraftByAirline, setAircraftByAirline] = useState<Record<number, AircraftItem[]>>({});
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [aircrafts, setAircrafts] = useState<AircraftForm[]>([
    { model: '', total_seats: '', economy_seats: '', business_seats: '' }
  ]);

  const [formData, setFormData] = useState({
    name: '',
  });

  const fetchAirlines = async () => {
    try {
      const res = await fetch('http://localhost:5000/airlines');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch airlines');
      }

      const airlineRows = Array.isArray(data) ? data : [];
      setAirlines(airlineRows);

      const aircraftEntries = await Promise.all(
        airlineRows.map(async (airline: Airline) => {
          try {
            const aircraftRes = await fetch(`http://localhost:5000/aircrafts/${airline.airline_id}`);
            const aircraftData = await aircraftRes.json();
            const normalizedAircrafts = Array.isArray(aircraftData)
              ? aircraftData.map((aircraft: any) => ({
                  aircraft_id: Number(aircraft.aircraft_id),
                  model: String(aircraft.model || ''),
                  total_seats: Number(aircraft.total_seats || 0),
                  economy_seats: Number(aircraft.economy_seats || 0),
                  business_seats: Number(aircraft.business_seats || 0),
                }))
              : [];

            return [airline.airline_id, normalizedAircrafts] as const;
          } catch {
            return [airline.airline_id, []] as const;
          }
        })
      );

      setAircraftByAirline(Object.fromEntries(aircraftEntries));
    } catch (error: any) {
      console.error('Error fetching airlines:', error);
      alert(error.message || 'Error fetching airlines');
    }
  };

  useEffect(() => {
    fetchAirlines();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      name: '',
    });
    setAircrafts([{ model: '', total_seats: '', economy_seats: '', business_seats: '' }]);
    setShowModal(true);
  };

  const handleAircraftChange = (
    index: number,
    field: 'model' | 'total_seats' | 'economy_seats' | 'business_seats',
    value: string
  ) => {
    setAircrafts((prev) => prev.map((aircraft, i) => (i === index ? { ...aircraft, [field]: value } : aircraft)));
  };

  const handleAddAircraft = () => {
    setAircrafts((prev) => [...prev, { model: '', total_seats: '', economy_seats: '', business_seats: '' }]);
  };

  const handleRemoveAircraft = (index: number) => {
    setAircrafts((prev) => {
      if (prev.length === 1) {
        return prev;
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const name = formData.name.trim();

    if (!name) {
      alert('Airline name is required');
      return;
    }

    const duplicate = airlines.some(
      (airline) => airline.name.toLowerCase() === name.toLowerCase()
    );

    if (duplicate) {
      alert('Airline already exists');
      return;
    }

    if (aircrafts.length === 0) {
      alert('At least one aircraft is required');
      return;
    }

    const normalizedAircrafts = aircrafts.map((aircraft) => ({
      model: aircraft.model.trim(),
      total_seats: Number(aircraft.total_seats),
      economy_seats: Number(aircraft.economy_seats),
      business_seats: Number(aircraft.business_seats),
    }));

    const invalidModel = normalizedAircrafts.some((aircraft) => !aircraft.model);
    if (invalidModel) {
      alert('Aircraft model cannot be empty');
      return;
    }

    const invalidSeats = normalizedAircrafts.some(
      (aircraft) => !Number.isInteger(aircraft.total_seats) || aircraft.total_seats <= 0
    );
    if (invalidSeats) {
      alert('Aircraft seats must be a valid positive number');
      return;
    }

    const invalidSplit = normalizedAircrafts.some(
      (aircraft) =>
        !Number.isInteger(aircraft.economy_seats) ||
        !Number.isInteger(aircraft.business_seats) ||
        aircraft.economy_seats < 0 ||
        aircraft.business_seats < 0 ||
        aircraft.economy_seats + aircraft.business_seats !== aircraft.total_seats
    );

    if (invalidSplit) {
      alert('Total seats must equal economy + business');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/add-airline', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add airline');
      }

      const airlineId = Number(data.airline_id);
      if (!airlineId) {
        throw new Error('Failed to get airline_id after creating airline');
      }

      for (const aircraft of normalizedAircrafts) {
        const aircraftRes = await fetch('http://localhost:5000/add-aircraft', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: aircraft.model,
            airline_id: airlineId,
            total_seats: aircraft.total_seats,
            economy_seats: aircraft.economy_seats,
            business_seats: aircraft.business_seats,
          }),
        });

        const aircraftData = await aircraftRes.json();
        if (!aircraftRes.ok) {
          throw new Error(aircraftData.error || 'Failed to add aircraft');
        }
      }

      setShowModal(false);
      setFormData({ name: '' });
      setAircrafts([{ model: '', total_seats: '', economy_seats: '', business_seats: '' }]);
      fetchAirlines();
    } catch (error: any) {
      console.error('Error adding airline:', error);
      alert(error.message || 'Error adding airline');
    }
  };

  const filteredAirlines = airlines.filter(airline =>
    airline.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airline.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Airlines</h1>
            <p className="text-gray-600">Add, edit, or remove airline information</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Airline
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search airlines..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAirlines.map(airline => (
            <div
              key={airline.airline_id}
              className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 bg-gradient-to-br from-[#1E3A8A] to-[#06B6D4] rounded-xl flex items-center justify-center text-3xl">
                    <Building2 className="w-7 h-7 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">{airline.name}</h3>
                    <p className="text-sm text-gray-500">{airline.code}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 text-sm text-gray-700">
                {(aircraftByAirline[airline.airline_id] || []).length === 0 ? (
                  <p className="text-gray-500">No aircraft added</p>
                ) : (
                  (aircraftByAirline[airline.airline_id] || []).map((aircraft) => (
                    <div key={aircraft.aircraft_id} className="border-t pt-2">
                      <p><span className="font-medium">Aircraft Model:</span> {aircraft.model}</p>
                      <p><span className="font-medium">Total Seats:</span> {aircraft.total_seats}</p>
                      <p><span className="font-medium">Economy Seats:</span> {aircraft.economy_seats}</p>
                      <p><span className="font-medium">Business Seats:</span> {aircraft.business_seats}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full max-h-[80vh] overflow-y-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add New Airline
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Airline Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    required
                    placeholder="American Airlines"
                  />
                </div>

                {aircrafts.map((aircraft, index) => (
                  <div key={index} className="border p-4 rounded-lg mb-4 space-y-3">
                    <label className="block text-sm font-medium text-gray-700">Aircraft {index + 1}</label>
                    <input
                      type="text"
                      value={aircraft.model}
                      onChange={(e) => handleAircraftChange(index, 'model', e.target.value)}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                      placeholder="Model (e.g. A320)"
                      required
                    />
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Seats</p>
                      <input
                        type="number"
                        min="1"
                        value={aircraft.total_seats}
                        onChange={(e) => handleAircraftChange(index, 'total_seats', e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                        placeholder="Total Seats"
                        required
                      />
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <input
                          type="number"
                          min="0"
                          value={aircraft.economy_seats}
                          onChange={(e) => handleAircraftChange(index, 'economy_seats', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                          placeholder="Economy Seats"
                          required
                        />
                        <input
                          type="number"
                          min="0"
                          value={aircraft.business_seats}
                          onChange={(e) => handleAircraftChange(index, 'business_seats', e.target.value)}
                          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                          placeholder="Business Seats"
                          required
                        />
                      </div>
                    </div>
                    {aircrafts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveAircraft(index)}
                        className="text-red-600 text-sm font-medium"
                      >
                        Remove Aircraft
                      </button>
                    )}
                  </div>
                ))}

                <button
                  type="button"
                  onClick={handleAddAircraft}
                  className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Add Aircraft
                </button>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 bg-gray-100 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 font-medium"
                  >
                    Add
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
