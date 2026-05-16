'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { API_URL, API_BASE_URL } from '../../../lib/constants';
import { AlertCircle, FileText, Car, Clock, X } from 'lucide-react';

export default function ReportsPage() {
  const { token } = useAuthStore();
  const [reports, setReports] = useState<any[]>([]);
  const [visitors, setVisitors] = useState<any[]>([]);
  const [sites, setSites] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'reports' | 'visitors'>('reports');
  
  // Create Report State
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ type: 'GENERAL', content: '', siteId: '' });
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState('');

  const fetchData = async () => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [resReports, resVisitors, resSites] = await Promise.all([
        fetch(`${API_URL}/reports`, { headers }),
        fetch(`${API_URL}/visitors`, { headers }),
        fetch(`${API_URL}/sites`, { headers })
      ]);
      if (resReports.ok) setReports(await resReports.json());
      if (resVisitors.ok) setVisitors(await resVisitors.json());
      if (resSites.ok) {
        const sData = await resSites.json();
        setSites(sData);
        if (sData.length > 0) setFormData(prev => ({ ...prev, siteId: sData[0].id }));
      }
    } catch (e) {}
  };

  useEffect(() => { if(token) fetchData(); }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMsg('EXECUTING...');
    try {
      const res = await fetch(`${API_URL}/reports`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        setMsg('[SYS_OK] LOG COMMITTED');
        setFormData(prev => ({ ...prev, content: '' }));
        fetchData();
        setTimeout(() => { setShowModal(false); setMsg(''); }, 2000);
      } else {
        setMsg('[ERR] LOG SUBMISSION FAILED');
      }
    } catch (e) {
      setMsg('[ERR] NETWORK OFFLINE');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 dark:border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Logs & <span className="text-black/30 dark:text-white/30">Reports</span></h1>
          <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-2">Monitor site activity and intelligence</p>
        </div>
        
        <div className="flex gap-4 items-center">
          <div className="flex bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm p-1">
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'reports' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              Intelligence Logs
            </button>
            <button 
              onClick={() => setActiveTab('visitors')}
              className={`px-6 py-2 rounded-sm text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'visitors' ? 'bg-black dark:bg-white text-white dark:text-black shadow-sm' : 'text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5'}`}
            >
              Visitor Registry
            </button>
          </div>

          <button 
            onClick={() => setShowModal(true)}
            className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-sm hover:bg-black/80 dark:hover:bg-white/80 hover:-translate-y-0.5 shadow-lg shadow-black/10 dark:shadow-none transition-all font-bold text-[10px] uppercase tracking-widest flex items-center gap-2"
          >
            <FileText size={14} /> Submit Intel
          </button>
        </div>
      </div>

      {activeTab === 'reports' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {reports.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm border-dashed">
              <FileText size={32} className="mx-auto text-black/20 dark:text-white/20 mb-4" />
              <p className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">No Intelligence Logs Available.</p>
            </div>
          ) : (
            reports.map(r => (
              <div key={r.id} className="bg-white dark:bg-black p-8 rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white transition-colors relative overflow-hidden group">
                {r.type === 'INCIDENT' && <div className="absolute top-0 left-0 w-1 h-full bg-red-600 dark:bg-red-500"></div>}
                
                <div className="flex justify-between items-start mb-6 pb-6 border-b border-black/5 dark:border-white/5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-sm border ${r.type === 'INCIDENT' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500 border-red-100 dark:border-red-900/50' : 'bg-[#f8f9fa] dark:bg-[#111] text-black dark:text-white border-black/10 dark:border-white/10'}`}>
                      {r.type === 'INCIDENT' ? <AlertCircle size={20} /> : <FileText size={20} />}
                    </div>
                    <div>
                      <span className={`font-black uppercase tracking-widest ${r.type === 'INCIDENT' ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>{r.type.replace('_', ' ')}</span>
                      <p className="text-[10px] text-black/50 dark:text-white/50 mt-1 font-mono">{new Date(r.timestamp).toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-bold text-black dark:text-white uppercase tracking-widest">
                      {r.author.name}
                    </p>
                    <p className="text-[10px] font-mono text-black/40 dark:text-white/40 mt-1">{r.site.name}</p>
                  </div>
                </div>
                
                <p className="text-black/80 dark:text-white/80 font-medium leading-relaxed text-sm mb-6 whitespace-pre-wrap">{r.content}</p>
                
                {r.imageUrl && (
                  <div className="rounded-sm overflow-hidden border border-black/10 dark:border-white/10">
                    <img src={`${API_BASE_URL}${r.imageUrl}`} alt="Report Evidence" className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-700" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'visitors' && (
        <div className="bg-white dark:bg-black rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#f8f9fa] dark:bg-[#111] border-b border-black/10 dark:border-white/10">
                <th className="p-6 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Entity</th>
                <th className="p-6 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Declared Purpose</th>
                <th className="p-6 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Location / Operator</th>
                <th className="p-6 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Status / Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {visitors.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-16 text-center text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">No entries found in registry.</td>
                </tr>
              ) : (
                visitors.map(v => (
                  <tr key={v.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#111] transition-colors">
                    <td className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center font-bold text-sm">
                          {v.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-sm text-black dark:text-white uppercase">{v.name}</p>
                          {v.vehicleNum && (
                            <p className="text-[10px] text-black/50 dark:text-white/50 font-mono flex items-center gap-2 mt-1"><Car size={10} /> {v.vehicleNum}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="p-6 text-xs font-bold text-black/70 dark:text-white/70 uppercase">{v.purpose}</td>
                    <td className="p-6">
                      <p className="text-xs font-bold text-black dark:text-white">{v.site.name}</p>
                      <p className="text-[10px] text-black/40 dark:text-white/40 font-mono mt-1">OP: {v.guard.name}</p>
                    </td>
                    <td className="p-6">
                      <div className="flex flex-col gap-2">
                        <span className="text-[10px] font-mono font-bold text-black dark:text-white bg-black/5 dark:bg-white/5 px-2 py-1 rounded-sm border border-black/10 dark:border-white/10 w-max flex items-center gap-2">
                          <Clock size={10} /> IN: {new Date(v.checkInTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </span>
                        {v.checkOutTime ? (
                          <span className="text-[10px] font-mono font-bold text-black/50 dark:text-white/50 bg-[#f8f9fa] dark:bg-[#111] px-2 py-1 rounded-sm border border-black/5 dark:border-white/5 w-max flex items-center gap-2">
                            <Clock size={10} /> OUT: {new Date(v.checkOutTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 px-2 py-1 rounded-sm w-max">
                            ON-SITE
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-black p-8 rounded-sm shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            
            <h2 className="text-2xl font-black mb-2 text-black dark:text-white uppercase tracking-tight">Submit Intel Report</h2>
            <p className="text-[10px] text-black/50 dark:text-white/50 mb-8 font-bold uppercase tracking-widest">Document site activity or security incidents</p>

            {msg && (
              <div className={`mb-6 p-4 rounded-sm text-[10px] font-mono font-bold tracking-widest uppercase border ${msg.includes('[SYS_OK]') ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' : 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50'}`}>
                {msg}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2">Target Site</label>
                <select 
                  required
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-bold text-xs uppercase tracking-widest text-black dark:text-white transition-colors" 
                  value={formData.siteId} 
                  onChange={e => setFormData({...formData, siteId: e.target.value})}
                >
                  {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2">Report Designation</label>
                <select 
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-bold text-xs uppercase tracking-widest text-black dark:text-white transition-colors" 
                  value={formData.type} 
                  onChange={e => setFormData({...formData, type: e.target.value})}
                >
                  <option value="GENERAL">General Audit</option>
                  <option value="INCIDENT">Incident Report</option>
                  <option value="MAINTENANCE">Maintenance Log</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-black/60 dark:text-white/60 uppercase tracking-widest mb-2">Intel Data</label>
                <textarea 
                  required rows={5}
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium text-sm text-black dark:text-white resize-none transition-colors" 
                  placeholder="Describe situational parameters..."
                  value={formData.content} 
                  onChange={e => setFormData({...formData, content: e.target.value})} 
                />
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <button type="button" onClick={() => setShowModal(false)} className="px-6 py-3 text-black/50 dark:text-white/50 font-bold uppercase tracking-widest text-[10px] hover:text-black dark:hover:text-white transition-colors">Abort</button>
                <button type="submit" disabled={submitting} className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-sm hover:bg-black/80 dark:hover:bg-white/80 transition-all shadow-lg shadow-black/10 dark:shadow-none font-bold uppercase tracking-widest text-[10px] disabled:opacity-50">
                  {submitting ? 'Transmitting...' : 'Commit Intel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
