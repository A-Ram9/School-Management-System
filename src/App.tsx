import React, { useState, useEffect } from 'react';
import { Plus, List, MapPin, School as SchoolIcon, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface School {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    // Attempt to get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          // Default to a location if denied (e.g., London)
          setUserLocation({ lat: 51.5074, lng: -0.1278 });
        }
      );
    } else {
      setUserLocation({ lat: 51.5074, lng: -0.1278 });
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'list' && userLocation) {
      fetchSchools();
    }
  }, [activeTab, userLocation]);

  const fetchSchools = async () => {
    if (!userLocation) return;
    setLoading(true);
    try {
      const response = await fetch(`/listSchools?latitude=${userLocation.lat}&longitude=${userLocation.lng}`);
      const data = await response.json();
      setSchools(data);
    } catch (error) {
      console.error("Error fetching schools:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSchool = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const payload = {
      name: formData.name,
      address: formData.address,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude)
    };

    try {
      const response = await fetch('/addSchool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'School added successfully!' });
        setFormData({ name: '', address: '', latitude: '', longitude: '' });
      } else {
        setMessage({ type: 'error', text: Array.isArray(data.error) ? data.error[0].message : data.error });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add school' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12 text-center">
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-center gap-3 mb-4"
          >
            <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-200">
              <SchoolIcon className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900">EduDirectory</h1>
          </motion.div>
          <p className="text-slate-500 max-w-md mx-auto">
            Manage and discover educational institutions with precision location mapping.
          </p>
        </header>

        <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
            <button
              onClick={() => setActiveTab('list')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                activeTab === 'list' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <List className="w-4 h-4" />
              <span>Browse Schools</span>
            </button>
            <button
              onClick={() => setActiveTab('add')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-lg transition-all ${
                activeTab === 'add' 
                  ? 'bg-indigo-600 text-white shadow-md' 
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Plus className="w-4 h-4" />
              <span>Add New School</span>
            </button>
          </div>
        </div>

        <main>
          <AnimatePresence mode="wait">
            {activeTab === 'add' ? (
              <motion.div
                key="add-view"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-white rounded-3xl p-8 shadow-xl border border-slate-100"
              >
                <h2 className="text-2xl font-semibold mb-6">Register Institution</h2>
                <form onSubmit={handleAddSchool} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 ml-1">School Name</label>
                      <input
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="e.g. St. Xavier's Academy"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 ml-1">Address</label>
                      <input
                        required
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="e.g. 123 Education Lane"
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 ml-1">Latitude</label>
                      <input
                        required
                        type="number"
                        step="any"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="e.g. 13.0827"
                        value={formData.latitude}
                        onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-slate-700 ml-1">Longitude</label>
                      <input
                        required
                        type="number"
                        step="any"
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="e.g. 80.2707"
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      />
                    </div>
                  </div>

                  {message && (
                    <div className={`p-4 rounded-xl text-sm ${
                      message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-700 border border-red-100'
                    }`}>
                      {message.text}
                    </div>
                  )}

                  <button
                    disabled={loading}
                    type="submit"
                    className="w-full bg-indigo-600 text-white font-semibold py-4 rounded-xl hover:bg-indigo-700 transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-5 h-5" />}
                    <span>Confirm Registration</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="list-view"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
              >
                <div className="flex items-center justify-between mb-6 px-2">
                  <h2 className="text-2xl font-semibold">Nearest Schools</h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    <span>User Location: {userLocation?.lat.toFixed(4)}, {userLocation?.lng.toFixed(4)}</span>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-500">Scanning for nearby schools...</p>
                  </div>
                ) : schools.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {schools.map((school, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        key={school.id}
                        className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <SchoolIcon className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600 leading-none">
                              {school.distance?.toFixed(1)}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">km away</div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1 truncate">{school.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{school.address}</span>
                        </p>
                        <div className="flex gap-2">
                          <div className="px-2 py-1 bg-slate-50 rounded-md text-[10px] font-mono text-slate-500">
                            LAT: {school.latitude}
                          </div>
                          <div className="px-2 py-1 bg-slate-50 rounded-md text-[10px] font-mono text-slate-500">
                            LNG: {school.longitude}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                      <SchoolIcon className="w-8 h-8 text-slate-400" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No schools found</h3>
                    <p className="text-slate-500 max-w-xs mx-auto mb-6">
                      There are no institutions registered in our database yet.
                    </p>
                    <button
                      onClick={() => setActiveTab('add')}
                      className="text-indigo-600 font-bold hover:underline underline-offset-4"
                    >
                      Be the first to register one
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
