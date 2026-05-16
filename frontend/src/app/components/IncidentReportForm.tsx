'use client';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { AlertTriangle } from 'lucide-react';
import { API_URL } from '../../lib/constants';
import CameraCapture from './CameraCapture';

export default function IncidentReportForm({ selectedSite }: { selectedSite: string }) {
  const { token } = useAuthStore();
  const [content, setContent] = useState('');
  const [incidentBlob, setIncidentBlob] = useState<Blob | null>(null);
  const [incidentPreview, setIncidentPreview] = useState<string | null>(null);
  
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');

  const handleCapture = (blob: Blob) => {
    setIncidentBlob(blob);
    setIncidentPreview(URL.createObjectURL(blob));
  };

  const handleClear = () => {
    if (incidentPreview) URL.revokeObjectURL(incidentPreview);
    setIncidentBlob(null);
    setIncidentPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSite) {
      setMsg('[ERR] SITE TELEMETRY NOT LOCKED');
      setStatus('error');
      return;
    }
    if (!content) {
      setMsg('[ERR] MISSING INTEL DATA');
      setStatus('error');
      return;
    }

    setStatus('submitting');
    setMsg('TRANSMITTING...');

    const fd = new FormData();
    fd.append('siteId', selectedSite);
    fd.append('type', 'INCIDENT');
    fd.append('content', content);
    if (incidentBlob) {
      fd.append('image', incidentBlob, 'incident.jpg');
    }

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: fd
      });

      if (res.ok) {
        setStatus('success');
        setMsg('[SYS_OK] INTEL LOGGED');
        setContent('');
        handleClear();
        setTimeout(() => { setStatus('idle'); setMsg(''); }, 3000);
      } else {
        setStatus('error');
        setMsg('[ERR] TRANSMISSION FAILED');
      }
    } catch (err) {
      setStatus('error');
      setMsg('[ERR] NETWORK OFFLINE');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      <h2 className="text-sm font-black text-red-600 dark:text-red-500 uppercase tracking-widest flex items-center gap-2 border-b border-red-100 dark:border-red-900/50 pb-2">
        <AlertTriangle size={16} /> Submit Intel / Incident
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Intel Details</label>
          <textarea 
            required 
            rows={4} 
            value={content} 
            onChange={e => setContent(e.target.value)} 
            className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm bg-white dark:bg-black text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none text-sm resize-none transition-colors" 
            placeholder="Document situation specifics..." 
          />
        </div>

        <div>
          <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Visual Evidence <span className="font-mono text-black/30 dark:text-white/30 ml-1">(OPTIONAL)</span></label>
          <CameraCapture
            onCapture={handleCapture}
            onClear={handleClear}
            capturedPreview={incidentPreview}
            label="Capture Incident"
            shape="square"
          />
        </div>

        <button 
          type="submit" 
          disabled={status === 'submitting'}
          className="w-full bg-red-600 dark:bg-red-500 hover:bg-red-700 dark:hover:bg-red-600 text-white font-bold py-4 rounded-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-red-600/20 dark:shadow-none disabled:opacity-50 mt-4"
        >
          {status === 'submitting' ? 'TRANSMITTING...' : 'COMMIT INTEL'}
        </button>

        {msg && (
          <div className={`p-4 rounded-sm text-center font-mono font-bold text-[10px] uppercase tracking-widest mt-2 border ${status === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
            {msg}
          </div>
        )}
      </form>
    </div>
  );
}
