'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { API_URL } from '../../../lib/constants';

export default function SitesPage() {
  const { token } = useAuthStore();
  const [sites, setSites] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', address: '', latitude: '', longitude: '', radius: '50', clientId: '' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchSites = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/sites`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) {
        setSites(await res.json());
      } else {
        setError('Failed to load sites');
      }
    } catch (e) {
      setError('Cannot connect to server.');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const res = await fetch(`${API_URL}/auth/users`, { headers: { 'Authorization': `Bearer ${token}` }});
      if (res.ok) {
        const users = await res.json();
        setClients(users.filter((u: any) => u.role === 'CLIENT'));
      }
    } catch (e) {}
  };

  useEffect(() => { 
    if(token) {
      fetchSites(); 
      fetchClients();
    }
  }, [token]);

  const validateForm = (): string | null => {
    if (!formData.name.trim() || formData.name.trim().length < 2) return 'Site name must be at least 2 characters';
    if (!formData.address.trim()) return 'Address is required';
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (isNaN(lat) || lat < -90 || lat > 90) return 'Latitude must be between -90 and 90';
    if (isNaN(lng) || lng < -180 || lng > 180) return 'Longitude must be between -180 and 180';
    const radius = parseFloat(formData.radius);
    if (isNaN(radius) || radius < 10 || radius > 5000) return 'Radius must be between 10 and 5000 meters';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    try {
      const res = await fetch(`${API_URL}/sites`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          name: formData.name.trim(),
          address: formData.address.trim(),
          latitude: parseFloat(formData.latitude),
          longitude: parseFloat(formData.longitude),
          radius: parseFloat(formData.radius),
          clientId: formData.clientId || null
        })
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', address: '', latitude: '', longitude: '', radius: '50', clientId: '' });
        setError('');
        setSuccess(`[SYS_OK] Site "${formData.name.trim()}" established in database.`);
        setTimeout(() => setSuccess(''), 4000);
        fetchSites();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to create site');
      }
    } catch (e) {
      setError('Network error.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 dark:border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Geographic <span className="text-black/30 dark:text-white/30">Sites</span></h1>
          <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-2">{sites.length} Active Operational Zones</p>
        </div>
        <button onClick={() => { setShowModal(true); setError(''); }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-sm hover:bg-black/80 dark:hover:bg-white/80 hover:-translate-y-0.5 shadow-lg shadow-black/10 dark:shadow-none transition-all font-bold text-xs uppercase tracking-widest">
          + Initialize Site
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-sm text-xs font-mono font-bold uppercase tracking-widest animate-in fade-in">
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-black rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="px-6 py-20 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full mb-4"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Querying Database...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-black dark:text-white">
            <thead className="bg-[#f8f9fa] dark:bg-[#111] border-b border-black/10 dark:border-white/10 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">
              <tr>
                <th className="px-6 py-4">Site ID</th>
                <th className="px-6 py-4">Designation</th>
                <th className="px-6 py-4">Geographic Coordinates</th>
                <th className="px-6 py-4">Assigned Client</th>
                <th className="px-6 py-4">Geofence Radius</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {sites.length === 0 ? (
                <tr><td colSpan={5} className="px-6 py-16 text-center text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">No zones configured. Initialize first site.</td></tr>
              ) : (
                sites.map(s => (
                  <tr key={s.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#111] transition-colors group">
                    <td className="px-6 py-4 font-mono text-[10px] text-black/40 dark:text-white/40">#{s.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-6 py-4 font-bold text-sm">
                      {s.name}
                      <div className="text-[10px] font-mono text-black/40 dark:text-white/40 mt-1">{s.address}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {s.latitude}, {s.longitude}
                    </td>
                    <td className="px-6 py-4">
                      {s.clientId ? (
                        <span className="px-2 py-1 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 rounded-sm text-[10px] font-mono font-bold tracking-widest text-black dark:text-white">
                          {clients.find(c => c.id === s.clientId)?.name || 'UNKNOWN'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30">Unassigned</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs font-bold text-black/60 dark:text-white/60">{s.radius} METERS</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-black p-8 rounded-sm shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">Initialize Site</h2>
            <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mb-8">Establish geofenced operational zone</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-sm text-xs font-mono font-bold uppercase">
                <span className="font-black mr-2">ERR:</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Site Designation</label>
                <input required placeholder="HQ BUILDING ALPHA" className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-medium uppercase placeholder-black/20 dark:placeholder-white/20 transition-colors" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Physical Address</label>
                <input required placeholder="123 MAIN ST" className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-medium placeholder-black/20 dark:placeholder-white/20 transition-colors" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Latitude</label>
                  <input required type="number" step="any" min="-90" max="90" placeholder="28.4595" className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-mono tracking-wider placeholder-black/20 dark:placeholder-white/20 transition-colors" value={formData.latitude} onChange={e => setFormData({...formData, latitude: e.target.value})} />
                </div>
                <div className="flex-1">
                  <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Longitude</label>
                  <input required type="number" step="any" min="-180" max="180" placeholder="77.0266" className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-mono tracking-wider placeholder-black/20 dark:placeholder-white/20 transition-colors" value={formData.longitude} onChange={e => setFormData({...formData, longitude: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Geofence Radius <span className="font-mono text-black/30 dark:text-white/30 ml-1">(METERS)</span></label>
                <input required type="number" min="10" max="5000" placeholder="50" className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-mono tracking-wider transition-colors" value={formData.radius} onChange={e => setFormData({...formData, radius: e.target.value})} />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Assigned Client Entity</label>
                <select 
                  className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-mono text-sm tracking-widest uppercase transition-colors" 
                  value={formData.clientId} 
                  onChange={e => setFormData({...formData, clientId: e.target.value})}
                >
                  <option value="">-- NO ENTITY ASSIGNED --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.name} (ID: {c.phone.slice(-4)})</option>
                  ))}
                </select>
              </div>
              
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <button type="button" onClick={() => { setShowModal(false); setError(''); }} className="px-6 py-3 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">Abort</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-sm hover:bg-black/80 dark:hover:bg-white/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-black/10 dark:shadow-none">
                  {submitting ? 'Executing...' : 'Establish Site'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
