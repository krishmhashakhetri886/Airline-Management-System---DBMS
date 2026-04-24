import { useEffect, useState } from 'react';
import Layout from '../../components/Layout';
import { MapPin, Plus, Edit2, Trash2, Search } from 'lucide-react';

type Airport = {
  airport_code: string;
  name: string;
  city: string;
  terminal: string;
};

export default function ManageAirports() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    airport_code: '',
    name: '',
    city: '',
    terminal: '',
  });

  const fetchAirports = async () => {
    try {
      const res = await fetch('http://localhost:5000/airports');
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch airports');
      }

      setAirports(Array.isArray(data) ? data : []);
    } catch (error: any) {
      console.error('Error fetching airports:', error);
      alert(error.message || 'Error fetching airports');
    }
  };

  useEffect(() => {
    fetchAirports();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      airport_code: '',
      name: '',
      city: '',
      terminal: '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.airport_code.trim()) {
      alert('airport_code required');
      return;
    }

    if (!formData.name.trim()) {
      alert('name required');
      return;
    }

    if (!formData.city.trim()) {
      alert('city required');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/add-airport', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          airport_code: formData.airport_code.trim().toUpperCase(),
          name: formData.name.trim(),
          city: formData.city.trim(),
          terminal: formData.terminal.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to add airport');
      }

      setShowModal(false);
      fetchAirports();
    } catch (error: any) {
      console.error('Error adding airport:', error);
      alert(error.message || 'Error adding airport');
    }
  };

  const filteredAirports = airports.filter(airport =>
    airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.airport_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.city.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Airports</h1>
            <p className="text-gray-600">Add, edit, or remove airport information</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="bg-gradient-to-r from-[#1E3A8A] to-[#06B6D4] text-white px-6 py-3 rounded-lg hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-medium"
          >
            <Plus className="w-5 h-5" />
            Add Airport
          </button>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-200 mb-6">
          <div className="relative">
            <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search airports..."
              className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Code</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Airport Name</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">City</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Terminals</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredAirports.map(airport => (
                  <tr key={airport.airport_code} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-[#1E3A8A]" />
                        <p className="font-bold text-gray-900">{airport.airport_code}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-medium text-gray-900">{airport.name}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{airport.city}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <p className="text-sm text-gray-900">{airport.terminal.split(',').map(t => t.trim()).join(' | ')}</p>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => alert('Edit airport logic not enabled in API flow yet')}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => alert('Delete airport logic not enabled in API flow yet')}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Add New Airport
              </h2>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Airport Code</label>
                  <input
                    type="text"
                    value={formData.airport_code}
                    onChange={(e) => setFormData({ ...formData, airport_code: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    required
                    maxLength={3}
                    placeholder="JFK"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Airport Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    required
                    placeholder="John F. Kennedy International Airport"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    required
                    placeholder="New York"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Terminals</label>
                  <input
                    type="text"
                    value={formData.terminal}
                    onChange={(e) => setFormData({ ...formData, terminal: e.target.value })}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]"
                    placeholder="T1,T2,T3"
                  />
                </div>

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
