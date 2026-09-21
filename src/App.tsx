import React, { useEffect, useMemo, useState } from 'react';
import {
  Plus, List, MapPin, School as SchoolIcon, Loader2, Search,
  ArrowUpDown, Trash2, Check, X, Navigation, LocateFixed, Copy, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ParticleBackground from './components/ParticleBackground';
import { ToastStack, useToasts } from './components/Toast';

interface School {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance?: number;
}

type SortOption = 'distance' | 'name-asc' | 'name-desc';
type Unit = 'km' | 'mi';

const KM_TO_MI = 0.621371;

export default function App() {
  const [activeTab, setActiveTab] = useState<'add' | 'list'>('list');
  const [schools, setSchools] = useState<School[]>([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [unit, setUnit] = useState<Unit>('km');
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const { toasts, notify, dismiss } = useToasts();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    latitude: '',
    longitude: ''
  });

  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const requestLocation = (manual = false) => {
    if (manual) setLocating(true);

    const fallback = () => {
      setUserLocation({ lat: 51.5074, lng: -0.1278 });
      if (manual) notify('error', 'Could not access your location — using a default.');
      setLocating(false);
    };

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          if (manual) notify('success', 'Location updated');
          setLocating(false);
        },
        () => fallback()
      );
    } else {
      fallback();
    }
  };

  useEffect(() => {
    requestLocation(false);
  }, []);

  useEffect(() => {
    if (activeTab === 'list' && userLocation) {
      fetchSchools();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      notify('error', 'Failed to load schools');
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
        setMessage(null);
        notify('success', 'School added successfully!');
        setFormData({ name: '', address: '', latitude: '', longitude: '' });
        setActiveTab('list');
      } else {
        const text = Array.isArray(data.error) ? data.error[0].message : data.error;
        setMessage({ type: 'error', text });
        notify('error', text);
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add school' });
      notify('error', 'Failed to add school');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSchool = async (id: number) => {
    setDeletingId(id);
    try {
      const response = await fetch(`/schools/${id}`, { method: 'DELETE' });
      const data = await response.json();
      if (response.ok) {
        setSchools((prev) => prev.filter((s) => s.id !== id));
        notify('success', 'School removed');
      } else {
        notify('error', data.error || 'Failed to delete school');
      }
    } catch {
      notify('error', 'Failed to delete school');
    } finally {
      setDeletingId(null);
      setConfirmDeleteId(null);
    }
  };

  const handleCopyAddress = async (school: School) => {
    try {
      await navigator.clipboard.writeText(`${school.name}, ${school.address}`);
      notify('success', 'Address copied to clipboard');
    } catch {
      notify('error', 'Could not copy address');
    }
  };

  const formatDistance = (km?: number) => {
    if (km === undefined) return '—';
    const value = unit === 'km' ? km : km * KM_TO_MI;
    return value.toFixed(1);
  };

  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = q
      ? schools.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q))
      : [...schools];

    if (sortBy === 'name-asc') list.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === 'name-desc') list.sort((a, b) => b.name.localeCompare(a.name));
    else list.sort((a, b) => (a.distance ?? 0) - (b.distance ?? 0));

    return list;
  }, [schools, search, sortBy]);

  const nearestSchool = schools[0];

  return (
    <div className="min-h-screen relative font-sans text-slate-900 p-4 md:p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/60">
      <ParticleBackground />
      <ToastStack toasts={toasts} dismiss={dismiss} />

      <div className="max-w-4xl mx-auto relative z-10">
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
          <div className="bg-white/90 backdrop-blur-sm p-1 rounded-xl shadow-sm border border-slate-200 flex gap-1">
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
                className="bg-white/95 backdrop-blur-sm rounded-3xl p-8 shadow-xl border border-slate-100"
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
                        min={-90}
                        max={90}
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
                        min={-180}
                        max={180}
                        className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all bg-slate-50 focus:bg-white"
                        placeholder="e.g. 80.2707"
                        value={formData.longitude}
                        onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                      />
                    </div>
                  </div>

                  {userLocation && (
                    <button
                      type="button"
                      onClick={() => setFormData({
                        ...formData,
                        latitude: userLocation.lat.toFixed(6),
                        longitude: userLocation.lng.toFixed(6)
                      })}
                      className="text-xs font-semibold text-indigo-600 hover:underline flex items-center gap-1.5"
                    >
                      <LocateFixed className="w-3.5 h-3.5" />
                      Use my current coordinates
                    </button>
                  )}

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
                <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
                  <h2 className="text-2xl font-semibold">Nearest Schools</h2>
                  <div className="flex items-center gap-2 text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
                    <MapPin className="w-3 h-3" />
                    <span>{userLocation ? `${userLocation.lat.toFixed(4)}, ${userLocation.lng.toFixed(4)}` : 'Locating…'}</span>
                    <button
                      onClick={() => requestLocation(true)}
                      disabled={locating}
                      className="ml-1 text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                      title="Refresh my location"
                      aria-label="Refresh my location"
                    >
                      {locating ? <Loader2 className="w-3 h-3 animate-spin" /> : <Navigation className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* Stats bar */}
                {schools.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-6">
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><Users className="w-4 h-4" /></div>
                      <div>
                        <div className="text-lg font-bold leading-none">{schools.length}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">Registered</div>
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3 col-span-2 md:col-span-1">
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600"><MapPin className="w-4 h-4" /></div>
                      <div className="min-w-0">
                        <div className="text-sm font-bold leading-none truncate">{nearestSchool?.name ?? '—'}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">Closest to you</div>
                      </div>
                    </div>
                    <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-sm flex items-center gap-3">
                      <div className="bg-indigo-50 p-2 rounded-xl text-indigo-600 font-bold text-xs w-8 h-8 flex items-center justify-center">
                        {unit === 'km' ? 'KM' : 'MI'}
                      </div>
                      <div>
                        <div className="text-lg font-bold leading-none">{formatDistance(nearestSchool?.distance)}</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">Nearest distance</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controls: search, sort, unit */}
                <div className="flex flex-wrap gap-3 mb-6">
                  <div className="relative flex-1 min-w-[180px]">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      placeholder="Search by name or address…"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                  </div>

                  <div className="relative">
                    <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as SortOption)}
                      className="pl-8 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white/90 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm appearance-none cursor-pointer"
                    >
                      <option value="distance">Nearest first</option>
                      <option value="name-asc">Name (A–Z)</option>
                      <option value="name-desc">Name (Z–A)</option>
                    </select>
                  </div>

                  <div className="flex bg-white/90 backdrop-blur-sm rounded-xl border border-slate-200 p-1 text-sm font-medium">
                    <button
                      onClick={() => setUnit('km')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${unit === 'km' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      km
                    </button>
                    <button
                      onClick={() => setUnit('mi')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${unit === 'mi' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'}`}
                    >
                      mi
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                    <p className="text-slate-500">Scanning for nearby schools...</p>
                  </div>
                ) : schools.length === 0 ? (
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
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
                ) : filteredSchools.length === 0 ? (
                  <div className="bg-white/90 backdrop-blur-sm rounded-3xl p-12 text-center border-2 border-dashed border-slate-200">
                    <h3 className="text-xl font-semibold mb-2">No matches</h3>
                    <p className="text-slate-500 max-w-xs mx-auto">
                      No schools match "{search}". Try a different search.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredSchools.map((school, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: index * 0.04 }}
                        key={school.id}
                        className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow group"
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className="bg-slate-100 p-2.5 rounded-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                            <SchoolIcon className="w-5 h-5" />
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-indigo-600 leading-none">
                              {formatDistance(school.distance)}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold mt-1">{unit} away</div>
                          </div>
                        </div>
                        <h3 className="text-lg font-bold mb-1 truncate">{school.name}</h3>
                        <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                          <MapPin className="w-3 h-3 shrink-0" />
                          <span className="truncate">{school.address}</span>
                        </p>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex gap-2">
                            <div className="px-2 py-1 bg-slate-50 rounded-md text-[10px] font-mono text-slate-500">
                              LAT: {school.latitude}
                            </div>
                            <div className="px-2 py-1 bg-slate-50 rounded-md text-[10px] font-mono text-slate-500">
                              LNG: {school.longitude}
                            </div>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleCopyAddress(school)}
                              title="Copy address"
                              aria-label="Copy address"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={`https://www.google.com/maps/dir/?api=1&destination=${school.latitude},${school.longitude}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              title="Get directions"
                              aria-label="Get directions"
                              className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            >
                              <Navigation className="w-3.5 h-3.5" />
                            </a>

                            {confirmDeleteId === school.id ? (
                              <>
                                <button
                                  onClick={() => handleDeleteSchool(school.id)}
                                  disabled={deletingId === school.id}
                                  title="Confirm delete"
                                  aria-label="Confirm delete"
                                  className="p-1.5 rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                                >
                                  {deletingId === school.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                                </button>
                                <button
                                  onClick={() => setConfirmDeleteId(null)}
                                  title="Cancel"
                                  aria-label="Cancel delete"
                                  className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 transition-colors"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            ) : (
                              <button
                                onClick={() => setConfirmDeleteId(school.id)}
                                title="Delete school"
                                aria-label="Delete school"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
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
