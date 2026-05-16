'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Building, FileText, AlertTriangle, MessageSquare, 
  CheckCircle, LogOut, LayoutDashboard, Send,
  MapPin, Users, Languages, Crosshair, Sun, Moon
} from 'lucide-react';
import { API_URL, API_BASE_URL } from '../../lib/constants';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeProvider';

export default function ClientDashboard() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const { t, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'CLIENT')) {
      router.push('/');
    }
  }, [mounted, user, router]);

  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'complaints'>('overview');
  const [sites, setSites] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [complaints, setComplaints] = useState<any[]>([]);
  
  // Complaint Form State
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [compStatus, setCompStatus] = useState('');

  // Create Report State
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportForm, setReportForm] = useState({ type: 'GENERAL', content: '', siteId: '' });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportMsg, setReportMsg] = useState('');

  useEffect(() => {
    if (mounted && user?.role === 'CLIENT') {
      fetchDashboardData();
    }
  }, [mounted, user]);

  const fetchDashboardData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resSites, resReports, resComplaints] = await Promise.all([
        fetch(`${API_URL}/client/sites`, { headers }),
        fetch(`${API_URL}/client/reports`, { headers }),
        fetch(`${API_URL}/complaints`, { headers })
      ]);
      
      if (resSites.ok) {
        const data = await resSites.json();
        setSites(data);
        if (data.length > 0) {
          setSelectedSiteId(data[0].id);
          setReportForm(prev => ({ ...prev, siteId: data[0].id }));
        }
      }
      if (resReports.ok) setReports(await resReports.json());
      if (resComplaints.ok) setComplaints(await resComplaints.json());
    } catch (e) {}
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCompStatus('TRANSMITTING...');
    try {
      const res = await fetch(`${API_URL}/complaints`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ subject, content, siteId: selectedSiteId })
      });
      if (res.ok) {
        setCompStatus('[SYS_OK] TICKET LOGGED');
        setSubject('');
        setContent('');
        const newComp = await res.json();
        setComplaints([newComp, ...complaints]);
        setTimeout(() => setCompStatus(''), 3000);
      } else {
        setCompStatus('[ERR] TRANSMISSION FAILED');
      }
    } catch (e) {
      setCompStatus('[ERR] NETWORK OFFLINE');
    }
  };

  const handleReportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportMsg('TRANSMITTING...');
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(reportForm)
      });
      if (res.ok) {
        setReportMsg('[SYS_OK] REPORT LOGGED');
        setReportForm(prev => ({ ...prev, content: '' }));
        fetchDashboardData();
        setTimeout(() => { setShowReportModal(false); setReportMsg(''); }, 2000);
      } else {
        setReportMsg('[ERR] TRANSMISSION FAILED');
      }
    } catch (e) {
      setReportMsg('[ERR] NETWORK OFFLINE');
    } finally {
      setReportSubmitting(false);
    }
  };

  if (!mounted || !user || user.role !== 'CLIENT') return null;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#111] flex flex-col font-sans text-black dark:text-white selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
      {/* Header */}
      <header className="bg-white dark:bg-black border-b border-black/10 dark:border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 hover:opacity-80 transition-opacity">
            <div className="bg-black dark:bg-white p-3 rounded-sm text-white dark:text-black border border-black/20 dark:border-white/20">
              <Building size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight uppercase text-black dark:text-white">Client Entity</h1>
              <p className="text-[10px] text-black/50 dark:text-white/50 font-mono uppercase tracking-widest mt-1">ID: {user.name} // L4 CLEARANCE</p>
            </div>
          </Link>

          <div className="flex items-center gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-3 rounded-sm border border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Sun size={16} className="hidden dark:block" />
              <Moon size={16} className="block dark:hidden" />
            </button>
            <button onClick={toggleLang} className="p-3 rounded-sm border border-black/10 dark:border-white/10 bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
              <Languages size={16} />
            </button>
            <button onClick={() => { logout(); router.push('/'); }} className="flex items-center gap-2 p-3 px-6 rounded-sm bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 dark:shadow-none">
              <LogOut size={14} /> Terminate
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 flex flex-col lg:flex-row gap-8 relative z-10">
        {/* Background Grid */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

        {/* Sidebar Nav */}
        <nav className="w-full lg:w-64 flex flex-col gap-2 relative z-10">
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] transition-all border ${activeTab === 'overview' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg shadow-black/10 dark:shadow-none' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white'}`}
          >
            <span className="flex items-center gap-3"><LayoutDashboard size={14} /> Site Overview</span>
          </button>
          <button 
            onClick={() => setActiveTab('reports')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] transition-all border ${activeTab === 'reports' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg shadow-black/10 dark:shadow-none' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white'}`}
          >
            <span className="flex items-center gap-3"><FileText size={14} /> Intelligence Log</span>
          </button>
          <button 
            onClick={() => setActiveTab('complaints')}
            className={`w-full flex items-center justify-between px-6 py-4 rounded-sm font-bold uppercase tracking-widest text-[10px] transition-all border ${activeTab === 'complaints' ? 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white shadow-lg shadow-black/10 dark:shadow-none' : 'bg-white dark:bg-black text-black dark:text-white border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white'}`}
          >
            <span className="flex items-center gap-3"><AlertTriangle size={14} /> System Tickets</span>
          </button>
        </nav>

        {/* Content Area */}
        <div className="flex-1 space-y-8 relative z-10">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {sites.length === 0 ? (
                <div className="col-span-full p-16 text-center border border-black/10 dark:border-white/10 border-dashed rounded-sm bg-white dark:bg-black">
                   <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">NO SITES ASSIGNED TO YOUR ENTITY.</p>
                </div>
              ) : (
                sites.map(site => (
                  <div key={site.id} className="bg-white dark:bg-black p-8 rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white transition-all group">
                    <div className="flex justify-between items-start mb-6 pb-6 border-b border-black/10 dark:border-white/10">
                      <div className="bg-black/5 dark:bg-white/5 p-3 rounded-sm border border-black/10 dark:border-white/10 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors text-black dark:text-white">
                        <Crosshair size={20} />
                      </div>
                      <span className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold tracking-widest border ${site._count.attendances > 0 ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-[#f8f9fa] dark:bg-[#111] text-black/50 dark:text-white/50 border-black/10 dark:border-white/10'}`}>
                        {site._count.attendances > 0 ? 'ONLINE' : 'OFFLINE'}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-black dark:text-white uppercase tracking-tight mb-2">{site.name}</h3>
                    <p className="text-[10px] font-mono text-black/50 dark:text-white/50 mb-8 flex items-center gap-2"><MapPin size={10} /> {site.address}</p>
                    
                    <div className="flex items-center gap-4 bg-[#f8f9fa] dark:bg-[#111] p-4 rounded-sm border border-black/5 dark:border-white/5">
                      <div className="bg-white dark:bg-black p-2 rounded-sm border border-black/10 dark:border-white/10">
                        <Users size={16} className="text-black dark:text-white" />
                      </div>
                      <div>
                        <p className="text-xl font-black text-black dark:text-white leading-none">{site._count.attendances}</p>
                        <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-1">OPERATORS ACTIVE</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'reports' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-black/10 dark:border-white/10 pb-6">
                <div>
                  <h2 className="text-3xl font-black text-black dark:text-white tracking-tight uppercase">Intel <span className="text-black/30 dark:text-white/30">Feed</span></h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 mt-2">MONITOR DEPLOYED ASSETS</p>
                </div>
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black px-6 py-3 rounded-sm font-bold text-[10px] uppercase tracking-widest shadow-lg shadow-black/10 dark:shadow-none transition-all flex items-center gap-2"
                >
                  <FileText size={14} /> APPEND INTEL
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {reports.length === 0 ? (
                  <div className="col-span-full p-16 text-center bg-white dark:bg-black rounded-sm border border-black/10 dark:border-white/10 border-dashed">
                    <FileText size={32} className="mx-auto text-black/20 dark:text-white/20 mb-4" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">NO INTEL LOGGED IN REGISTRY.</p>
                  </div>
                ) : (
                  reports.map(r => (
                    <div key={r.id} className="bg-white dark:bg-black p-8 rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 relative overflow-hidden group hover:border-black dark:hover:border-white transition-colors">
                      {r.type === 'INCIDENT' && <div className="absolute top-0 left-0 w-1 h-full bg-red-600 dark:bg-red-500"></div>}
                      
                      <div className="flex justify-between items-start mb-6 pb-6 border-b border-black/5 dark:border-white/5">
                        <div className="flex items-center gap-4">
                          <div className={`p-3 rounded-sm border ${r.type === 'INCIDENT' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 border-red-200 dark:border-red-900/50' : 'bg-[#f8f9fa] dark:bg-[#111] text-black dark:text-white border-black/10 dark:border-white/10'}`}>
                            {r.type === 'INCIDENT' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
                          </div>
                          <div>
                            <p className={`font-black uppercase tracking-widest text-xs ${r.type === 'INCIDENT' ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>{r.type.replace('_', ' ')}</p>
                            <p className="text-[10px] font-mono text-black/50 dark:text-white/50 mt-1">{new Date(r.timestamp).toLocaleString()}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-black dark:text-white uppercase tracking-tight">{r.site.name}</p>
                          <p className="text-[10px] text-black/50 dark:text-white/50 font-mono mt-1 uppercase">OP: {r.author.name}</p>
                        </div>
                      </div>
                      
                      <p className="text-black/80 dark:text-white/80 text-sm leading-relaxed mb-6">{r.content}</p>
                      
                      {r.imageUrl && (
                        <div className="rounded-sm overflow-hidden border border-black/10 dark:border-white/10">
                          <img src={`${API_BASE_URL}${r.imageUrl}`} alt="Evidence" className="w-full h-56 object-cover group-hover:scale-105 transition-transform duration-700" />
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'complaints' && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 animate-in fade-in slide-in-from-right-4 duration-500">
              {/* Form */}
              <div className="bg-white dark:bg-black p-8 rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 h-fit">
                <h2 className="text-lg font-black text-black dark:text-white mb-6 tracking-widest uppercase flex items-center gap-3 border-b border-black/10 dark:border-white/10 pb-4">
                  <MessageSquare size={16} className="text-black/50 dark:text-white/50" /> Initiate Ticket
                </h2>
                
                <form onSubmit={handleComplaintSubmit} className="space-y-6">
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Target Node (Site)</label>
                    <select 
                      value={selectedSiteId} 
                      onChange={(e) => setSelectedSiteId(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-bold text-xs uppercase tracking-widest text-black dark:text-white transition-colors"
                    >
                      {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Subject Header</label>
                    <input 
                      required value={subject} onChange={e => setSubject(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium text-sm text-black dark:text-white transition-colors"
                      placeholder="BRIEF CLASSIFICATION..."
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Detailed Payload</label>
                    <textarea 
                      required rows={5} value={content} onChange={e => setContent(e.target.value)}
                      className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium text-sm text-black dark:text-white resize-none transition-colors"
                      placeholder="EXPAND ON TICKET DETAILS..."
                    />
                  </div>
                  
                  <button 
                    type="submit"
                    disabled={compStatus.includes('TRANSMITTING')}
                    className="w-full bg-black dark:bg-white hover:bg-black/80 dark:hover:bg-white/80 text-white dark:text-black font-bold py-4 rounded-sm flex items-center justify-center gap-3 shadow-lg shadow-black/10 dark:shadow-none transition-all text-[10px] uppercase tracking-widest disabled:opacity-50 mt-4"
                  >
                    <Send size={14} /> TRANSMIT TICKET
                  </button>
                  
                  {compStatus && (
                    <div className={`p-4 rounded-sm text-center font-mono font-bold text-[10px] uppercase tracking-widest mt-4 border ${compStatus.includes('[SYS_OK]') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
                      {compStatus}
                    </div>
                  )}
                </form>
              </div>

              {/* History */}
              <div className="space-y-6">
                <h2 className="text-lg font-black text-black dark:text-white tracking-widest uppercase mb-6 border-b border-black/10 dark:border-white/10 pb-4">Ticket Registry</h2>
                
                {complaints.length === 0 ? (
                  <p className="p-16 text-center text-black/40 dark:text-white/40 bg-white dark:bg-black rounded-sm border border-black/10 dark:border-white/10 border-dashed text-[10px] font-bold uppercase tracking-widest">REGISTRY EMPTY.</p>
                ) : (
                  <div className="space-y-4">
                    {complaints.map(c => (
                      <div key={c.id} className="bg-white dark:bg-black p-6 rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white transition-colors relative overflow-hidden">
                        {c.status === 'OPEN' && <div className="absolute top-0 left-0 w-1 h-full bg-amber-500"></div>}
                        
                        <div className="flex justify-between items-center mb-4 pb-4 border-b border-black/5 dark:border-white/5">
                          <span className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold tracking-widest border ${c.status === 'OPEN' ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-500 border-amber-200 dark:border-amber-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'}`}>
                            {c.status}
                          </span>
                          <p className="text-[10px] text-black/40 dark:text-white/40 font-mono">{new Date(c.createdAt).toLocaleDateString()}</p>
                        </div>
                        
                        <h4 className="font-bold text-sm text-black dark:text-white uppercase tracking-tight mb-2">{c.subject}</h4>
                        <p className="text-[10px] font-mono text-black/50 dark:text-white/50 mb-4 flex items-center gap-2"><MapPin size={10} /> {c.site.name}</p>
                        <p className="text-xs text-black/70 dark:text-white/70 leading-relaxed bg-[#f8f9fa] dark:bg-[#111] p-4 rounded-sm border border-black/5 dark:border-white/5">{c.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowReportModal(false)}>
          <div className="bg-white dark:bg-black p-8 rounded-sm shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            
            <h2 className="text-2xl font-black mb-2 text-black dark:text-white tracking-tight uppercase">Append Intel</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 mb-8">Document data to selected node</p>

            {reportMsg && (
              <div className={`mb-6 p-4 rounded-sm text-center font-mono font-bold text-[10px] uppercase tracking-widest border ${reportMsg.includes('[SYS_OK]') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
                {reportMsg}
              </div>
            )}

            <form onSubmit={handleReportSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Target Node</label>
                <select 
                  required
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-bold text-xs uppercase tracking-widest text-black dark:text-white transition-colors" 
                  value={reportForm.siteId} 
                  onChange={e => setReportForm({...reportForm, siteId: e.target.value})}
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Intel Designation</label>
                <select 
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-bold text-xs uppercase tracking-widest text-black dark:text-white transition-colors" 
                  value={reportForm.type} 
                  onChange={e => setReportForm({...reportForm, type: e.target.value})}
                >
                  <option value="GENERAL">General Log</option>
                  <option value="INCIDENT">Incident Warning</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Payload Data</label>
                <textarea 
                  required rows={5}
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium text-sm text-black dark:text-white resize-none transition-colors" 
                  placeholder="EXPAND ON DETAILS..."
                  value={reportForm.content} 
                  onChange={e => setReportForm({...reportForm, content: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <button type="button" onClick={() => setShowReportModal(false)} className="px-6 py-3 text-black/50 dark:text-white/50 font-bold hover:text-black dark:hover:text-white transition-colors text-[10px] uppercase tracking-widest">Abort</button>
                <button type="submit" disabled={reportSubmitting} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-sm hover:bg-black/80 dark:hover:bg-white/80 transition-all shadow-lg shadow-black/10 dark:shadow-none font-bold uppercase tracking-widest text-[10px] disabled:opacity-50">
                  {reportSubmitting ? 'TRANSMITTING...' : 'COMMIT INTEL'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
