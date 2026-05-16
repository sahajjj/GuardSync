'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { UserPlus, Car, FileText, CheckCircle, Clock, LogOut } from 'lucide-react';
import { API_URL } from '../../lib/constants';

export default function VisitorLogForm({ selectedSite }: { selectedSite: string }) {
  const { token } = useAuthStore();
  const [name, setName] = useState('');
  const [purpose, setPurpose] = useState('');
  const [vehicleNum, setVehicleNum] = useState('');
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  
  const [currentVisitors, setCurrentVisitors] = useState<any[]>([]);

  const fetchVisitors = async () => {
    if (!selectedSite || !token) return;
    try {
      const res = await fetch(`${API_URL}/visitors?siteId=${selectedSite}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Only show visitors who haven't checked out
        setCurrentVisitors(data.filter((v: any) => !v.checkOutTime));
      }
    } catch (e) {}
  };

  useEffect(() => {
    fetchVisitors();
    const interval = setInterval(fetchVisitors, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [selectedSite, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      setMsg('[ERR] SITE TELEMETRY NOT LOCKED');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setMsg('LOGGING DATA...');

    try {
      const res = await fetch(`${API_URL}/visitors`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          siteId: selectedSite,
          name,
          purpose,
          vehicleNum
        })
      });

      if (res.ok) {
        setStatus('success');
        setMsg('[SYS_OK] VISITOR LOGGED');
        setName('');
        setPurpose('');
        setVehicleNum('');
        fetchVisitors();
        setTimeout(() => { setStatus('idle'); setMsg(''); }, 3000);
      } else {
        setStatus('error');
        setMsg('[ERR] LOGGING FAILED');
      }
    } catch (err) {
      setStatus('error');
      setMsg('[ERR] NETWORK OFFLINE');
    }
  };

  const handleCheckOut = async (visitorId: string) => {
    try {
      const res = await fetch(`${API_URL}/visitors/${visitorId}/checkout`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchVisitors();
      }
    } catch (e) {}
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <div className="space-y-4">
        <h2 className="text-sm font-black text-black dark:text-white uppercase tracking-widest flex items-center gap-2 border-b border-black/10 dark:border-white/10 pb-2">
          <UserPlus size={16} /> Append Visitor Log
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Visitor Name</label>
            <input required value={name} onChange={e => setName(e.target.value)} className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm bg-white dark:bg-black text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium uppercase placeholder-black/20 dark:placeholder-white/20 transition-colors" placeholder="JOHN DOE" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Purpose</label>
              <div className="relative">
                <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
                <input required value={purpose} onChange={e => setPurpose(e.target.value)} className="w-full p-4 pl-10 border border-black/20 dark:border-white/20 rounded-sm bg-white dark:bg-black text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium uppercase placeholder-black/20 dark:placeholder-white/20 transition-colors" placeholder="DELIVERY" />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Vehicle ID</label>
              <div className="relative">
                <Car size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
                <input value={vehicleNum} onChange={e => setVehicleNum(e.target.value)} className="w-full p-4 pl-10 border border-black/20 dark:border-white/20 rounded-sm bg-white dark:bg-black text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-mono uppercase tracking-widest placeholder-black/20 dark:placeholder-white/20 transition-colors" placeholder="ABC-123" />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={status === 'submitting'}
            className="w-full bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black font-bold py-4 rounded-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/10 dark:shadow-none mt-4 disabled:opacity-50"
          >
            {status === 'submitting' ? 'EXECUTING...' : 'COMMIT ENTRY'}
          </button>

          {msg && (
            <div className={`p-4 rounded-sm text-center font-mono font-bold text-[10px] uppercase tracking-widest mt-2 border ${status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
              {msg}
            </div>
          )}
        </form>
      </div>

      {currentVisitors.length > 0 && (
        <div className="pt-6 border-t border-black/10 dark:border-white/10">
          <h3 className="text-[10px] font-bold text-black dark:text-white uppercase tracking-widest mb-4 flex items-center gap-2">
            <Clock size={12} className="text-black/50 dark:text-white/50" /> Active Presences ({currentVisitors.length})
          </h3>
          <div className="space-y-2">
            {currentVisitors.map(v => (
              <div key={v.id} className="flex items-center justify-between p-4 bg-[#f8f9fa] dark:bg-[#111] rounded-sm border border-black/10 dark:border-white/10">
                <div>
                  <p className="text-sm font-bold text-black dark:text-white uppercase">{v.name}</p>
                  <p className="text-[10px] font-mono text-black/50 dark:text-white/50 mt-1 uppercase">{v.purpose} {v.vehicleNum ? `// ${v.vehicleNum}` : ''}</p>
                </div>
                <button 
                  onClick={() => handleCheckOut(v.id)}
                  className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-black text-black dark:text-white border border-black/20 dark:border-white/20 rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                  <LogOut size={12} /> EXIT
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
