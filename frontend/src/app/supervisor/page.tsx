'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Camera, FileText, CheckCircle, LogOut, Languages, Crosshair, Sun, Moon } from 'lucide-react';
import { API_URL } from '../../lib/constants';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeProvider';

export default function SupervisorApp() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [type, setType] = useState('SUPERVISOR_DOR');
  const [image, setImage] = useState<File | null>(null);
  const [status, setStatus] = useState<string>('');
  
  const { t, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'SUPERVISOR')) {
      router.push('/');
    }
  }, [mounted, user, router]);

  if (!mounted || !user || user.role !== 'SUPERVISOR') {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('TRANSMITTING...');
    
    const formData = new FormData();
    formData.append('content', content);
    formData.append('type', type);
    // Hardcoding a demo site ID for MVP
    formData.append('siteId', '123e4567-e89b-12d3-a456-426614174000');
    if (image) formData.append('image', image);

    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });
      
      if (res.ok) {
        setStatus('[SYS_OK] REPORT COMMITTED');
        setContent('');
        setImage(null);
        setTimeout(() => setStatus(''), 3000);
      } else {
        setStatus('[ERR] TRANSMISSION FAILED');
      }
    } catch (e) {
      setStatus('[ERR] NETWORK OFFLINE');
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#111] flex flex-col items-center pt-8 px-4 relative pb-12 overflow-hidden font-sans text-black dark:text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="absolute top-4 right-4 flex gap-3 z-10">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border border-black/10 dark:border-white/10 rounded-sm bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Sun size={14} className="hidden dark:block" />
          <Moon size={14} className="block dark:hidden" />
        </button>
        <button onClick={toggleLang} className="p-2 border border-black/10 dark:border-white/10 rounded-sm bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
          <Languages size={14} />
        </button>
      </div>

      <div className="w-full max-w-md bg-white dark:bg-black rounded-sm shadow-2xl dark:shadow-none overflow-hidden border border-black/10 dark:border-white/10 mt-8 relative z-10">
        <div className="bg-black dark:bg-white p-8 text-white dark:text-black text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
          <Crosshair size={24} className="mx-auto mb-4 opacity-50 relative z-10" />
          <Link href="/">
            <h1 className="text-2xl font-black tracking-widest uppercase relative z-10 hover:opacity-80 transition-opacity">Supervisor</h1>
          </Link>
          <div className="mt-2 relative z-10">
            <p className="font-bold text-sm uppercase tracking-widest">{user.name}</p>
            <span className="inline-block bg-white/10 dark:bg-black/10 px-3 py-1 rounded-sm text-[10px] font-mono font-bold uppercase tracking-widest mt-2 border border-white/20 dark:border-black/20">L2 CLEARANCE</span>
          </div>
        </div>
        
        <div className="p-8">
          <h2 className="text-sm font-black uppercase tracking-widest text-black dark:text-white mb-6 border-b border-black/10 dark:border-white/10 pb-2">Submit Field Report</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Report Designation</label>
              <select 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm bg-white dark:bg-black focus:ring-0 focus:border-black dark:focus:border-white outline-none font-bold text-xs uppercase tracking-widest text-black dark:text-white transition-colors"
              >
                <option value="SUPERVISOR_DOR">Daily Operations Report</option>
                <option value="INCIDENT">Security Incident Log</option>
                <option value="GENERAL">General Observation</option>
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Intel Data</label>
              <textarea 
                required
                rows={5}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm bg-white dark:bg-black focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium text-sm text-black dark:text-white resize-none transition-colors"
                placeholder={type === 'SUPERVISOR_DOR' ? "DOCUMENT SHIFT ACTIVITY AND SITE METRICS..." : "DESCRIBE SITUATION SPECIFICS..."}
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Visual Evidence <span className="font-mono text-black/30 dark:text-white/30 ml-1">(OPTIONAL)</span></label>
              <div className="flex items-center justify-center w-full">
                <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-black/20 dark:border-white/20 rounded-sm cursor-pointer bg-white dark:bg-black hover:bg-[#f8f9fa] dark:hover:bg-[#111] hover:border-black dark:hover:border-white transition-all group">
                  <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <Camera className="w-6 h-6 mb-3 text-black/30 dark:text-white/30 group-hover:text-black dark:group-hover:text-white transition-colors" />
                    <p className="mb-2 text-[10px] text-black dark:text-white font-bold uppercase tracking-widest">{image ? image.name : 'ATTACH VISUAL FILE'}</p>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => setImage(e.target.files?.[0] || null)} />
                </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={status.includes('TRANSMITTING')}
              className="w-full mt-8 bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black font-bold py-4 rounded-sm flex items-center justify-center gap-2 text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-black/10 dark:shadow-none disabled:opacity-50"
            >
              {status.includes('TRANSMITTING') ? 'EXECUTING...' : 'COMMIT REPORT'}
            </button>
          </form>

          {status && (
            <div className={`mt-6 p-4 rounded-sm text-center font-mono font-bold text-[10px] uppercase tracking-widest border ${status.includes('[SYS_OK]') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : status.includes('[ERR]') ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' : 'bg-black/5 dark:bg-white/5 text-black dark:text-white border-black/10 dark:border-white/10'}`}>
              {status}
            </div>
          )}
        </div>
      </div>
      
      <button 
        onClick={() => { logout(); router.push('/'); }}
        className="mt-8 flex items-center gap-2 text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors font-bold text-[10px] uppercase tracking-widest z-10"
      >
        <LogOut size={14} /> Terminate Session
      </button>
    </div>
  );
}
