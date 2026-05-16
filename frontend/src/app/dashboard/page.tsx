'use client';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { 
  Users, MapPin, AlertTriangle, Clock, Camera, 
  TrendingUp, Calendar, Target, Shield, Download, 
  ChevronRight, Filter, RefreshCcw, MoreHorizontal, CheckCircle, Bell, X, LayoutDashboard
} from 'lucide-react';
import { API_URL, API_BASE_URL } from '../../lib/constants';

export default function Dashboard() {
  const { token } = useAuthStore();
  const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'performance'>('overview');
  
  // Data State
  const [summary, setSummary] = useState({ siteCount: 0, guardCount: 0, activeGuards: 0, todayIncidents: 0 });
  const [sitePerf, setSitePerf] = useState<any[]>([]);
  const [monthlyAtt, setMonthlyAtt] = useState<any[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [selectedSite, setSelectedSite] = useState<any | null>(null);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      const [sumRes, perfRes, monthRes, recRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/stats/summary`, { headers }),
        fetch(`${API_URL}/stats/site-performance`, { headers }),
        fetch(`${API_URL}/stats/monthly-attendance`, { headers }),
        fetch(`${API_URL}/attendance`, { headers }),
        fetch(`${API_URL}/notifications`, { headers })
      ]);
      
      if (sumRes.ok) setSummary(await sumRes.json());
      if (perfRes.ok) setSitePerf(await perfRes.json());
      if (monthRes.ok) setMonthlyAtt(await monthRes.json());
      if (recRes.ok) setRecentAttendance(await recRes.json());
      if (notifRes.ok) setNotifications(await notifRes.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {}
  };

  useEffect(() => { if (token) fetchData(); }, [token]);

  const exportToCSV = () => {
    try {
      if (!recentAttendance || recentAttendance.length === 0) {
        alert('No attendance data available to export.');
        return;
      }
      
      const headers = ['ID', 'Guard', 'Site', 'Check In', 'Check Out', 'Lat', 'Lng'];
      const rows = recentAttendance.map(a => [
        `"${a.id}"`,
        `"${a.guard?.name || 'Unknown'}"`,
        `"${a.site?.name || 'Unknown'}"`,
        `"${new Date(a.checkInTime).toLocaleString()}"`,
        `"${a.checkOutTime ? new Date(a.checkOutTime).toLocaleString() : 'N/A'}"`,
        a.checkInLat || 0,
        a.checkInLng || 0
      ]);

      const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
      const blob = new Blob(["\ufeff", csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `GuardSync_Audit_${new Date().toISOString().slice(0, 10)}.csv`;
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to generate report.');
    }
  };

  return (
    <div className="space-y-12 pb-20">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 dark:border-white/10 pb-8">
        <div>
          <div className="inline-flex items-center gap-2 px-2 py-1 bg-black/5 dark:bg-white/5 text-black dark:text-white text-[10px] font-bold uppercase tracking-widest mb-4">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>
            System Active
          </div>
          <h1 className="text-4xl font-black uppercase tracking-tight text-black dark:text-white">Operations <br/><span className="text-black/30 dark:text-white/30">Dashboard</span></h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Notification Bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-3 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black dark:text-white relative"
            >
              <Bell size={20} />
              {notifications.filter(n => !n.read).length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-black dark:bg-white text-white dark:text-black text-[10px] font-black rounded-full flex items-center justify-center">
                  {notifications.filter(n => !n.read).length}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-2xl dark:shadow-none z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="p-4 border-b border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#111] flex justify-between items-center">
                  <h3 className="font-bold text-xs uppercase tracking-widest text-black dark:text-white">Alerts Center</h3>
                  <button onClick={() => setShowNotifications(false)} className="text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white"><X size={16} /></button>
                </div>
                <div className="max-h-[400px] overflow-y-auto no-scrollbar">
                  {notifications.length === 0 ? (
                    <div className="p-8 text-center text-black/40 dark:text-white/40 text-xs font-bold uppercase tracking-widest">No active alerts.</div>
                  ) : (
                    notifications.map(notif => (
                      <div 
                        key={notif.id} 
                        onClick={() => markAsRead(notif.id)}
                        className={`p-4 border-b border-black/5 dark:border-white/5 cursor-pointer transition-colors ${notif.read ? 'opacity-50' : 'bg-black/5 dark:bg-white/5'}`}
                      >
                        <div className="flex gap-3">
                          <div className={`mt-1 ${notif.type === 'EMERGENCY' ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>
                            {notif.type === 'EMERGENCY' ? <AlertTriangle size={16} /> : <Bell size={16} />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-black dark:text-white leading-snug">{notif.message}</p>
                            <p className="text-[10px] text-black/50 dark:text-white/50 mt-2 font-mono uppercase">{new Date(notif.createdAt).toLocaleTimeString()}</p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          <button onClick={fetchData} className="p-3 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-black dark:text-white">
            <RefreshCcw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button 
            onClick={exportToCSV}
            className="flex items-center gap-2 px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-sm font-bold text-xs uppercase tracking-widest hover:bg-black/80 dark:hover:bg-white/80 transition-all hover:-translate-y-0.5 shadow-lg shadow-black/10 dark:shadow-none"
          >
            <Download size={16} /> Export Audit
          </button>
        </div>
      </div>

      {/* Primary Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Sites Managed', value: summary.siteCount, icon: MapPin },
          { label: 'Active Guards', value: summary.activeGuards, total: summary.guardCount, icon: Users },
          { label: 'Today Check-ins', value: recentAttendance.length, icon: Clock },
          { label: 'Site Incidents', value: summary.todayIncidents, icon: AlertTriangle, warning: summary.todayIncidents > 0 },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-black p-6 border border-black/10 dark:border-white/10 rounded-sm hover:shadow-xl dark:hover:shadow-white/5 hover:shadow-black/5 hover:-translate-y-1 transition-all group relative overflow-hidden">
            <div className={`absolute top-0 left-0 w-1 h-full ${stat.warning ? 'bg-red-500' : 'bg-black/10 dark:bg-white/10 group-hover:bg-black dark:group-hover:bg-white'} transition-colors`}></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`p-3 rounded-sm ${stat.warning ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-500' : 'bg-[#f8f9fa] dark:bg-[#111] text-black dark:text-white'} border border-black/5 dark:border-white/5 group-hover:scale-110 transition-transform`}>
                <stat.icon size={20} />
              </div>
            </div>
            <h3 className="text-black/50 dark:text-white/50 text-[10px] font-bold uppercase tracking-widest">{stat.label}</h3>
            <div className="flex items-baseline gap-2 mt-2">
              <p className={`text-4xl font-black ${stat.warning ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>{stat.value}</p>
              {stat.total !== undefined && <span className="text-xs text-black/40 dark:text-white/40 font-mono font-bold">/ {stat.total}</span>}
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="space-y-8">
        <div className="flex border-b border-black/10 dark:border-white/10 overflow-x-auto no-scrollbar">
          {[
            { id: 'overview', label: 'Live Stream' },
            { id: 'attendance', label: 'Attendance Matrix' },
            { id: 'performance', label: 'Site Diagnostics' },
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-4 text-xs font-bold uppercase tracking-widest whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id 
                ? 'border-black dark:border-white text-black dark:text-white' 
                : 'border-transparent text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              {/* Recent Activity List */}
              <div className="xl:col-span-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-sm shadow-xl dark:shadow-none shadow-black/5 overflow-hidden">
                <div className="p-6 border-b border-black/10 dark:border-white/10 flex justify-between items-center bg-[#f8f9fa] dark:bg-[#111]">
                  <h2 className="text-lg font-black uppercase tracking-tight text-black dark:text-white">Live Deployment Stream</h2>
                  <Filter size={18} className="text-black/40 dark:text-white/40 cursor-pointer hover:text-black dark:hover:text-white" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-white dark:bg-black border-b border-black/10 dark:border-white/10">
                      <tr>
                        <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Personnel</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Deployment Site</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Verification</th>
                        <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest text-right">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-black/5 dark:divide-white/5">
                      {recentAttendance.length === 0 && (
                        <tr><td colSpan={4} className="p-8 text-center text-xs font-bold uppercase text-black/40 dark:text-white/40">No recent deployments</td></tr>
                      )}
                      {recentAttendance.map((record) => (
                        <tr key={record.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#111] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-sm bg-black/5 dark:bg-white/5 text-black dark:text-white flex items-center justify-center font-bold text-xs border border-black/10 dark:border-white/10">
                                {record.guard?.name?.charAt(0) || '?'}
                              </div>
                              <div>
                                <p className="font-bold text-sm text-black dark:text-white leading-none">{record.guard?.name}</p>
                                <p className="text-[10px] text-black/40 dark:text-white/40 font-mono mt-1">ID: GS-{record.id.slice(0, 4)}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-black/70 dark:text-white/70">{record.site?.name}</td>
                          <td className="px-6 py-4">
                            <div className="flex gap-2">
                              {record.selfieUrl && (
                                <img 
                                  src={`${API_BASE_URL}${record.selfieUrl}`} 
                                  className="w-8 h-8 rounded-sm object-cover border border-black/20 dark:border-white/20 cursor-pointer hover:scale-150 origin-left transition-transform z-10" 
                                  onClick={() => setLightboxUrl(`${API_BASE_URL}${record.selfieUrl}`)}
                                />
                              )}
                              {record.checkOutSelfieUrl && (
                                <img 
                                  src={`${API_BASE_URL}${record.checkOutSelfieUrl}`} 
                                  className="w-8 h-8 rounded-sm object-cover border border-black/20 dark:border-white/20 cursor-pointer hover:scale-150 transition-transform z-10" 
                                  onClick={() => setLightboxUrl(`${API_BASE_URL}${record.checkOutSelfieUrl}`)}
                                />
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`px-3 py-1 border text-[9px] font-bold uppercase tracking-widest ${record.checkOutTime ? 'bg-black/5 dark:bg-white/5 border-black/10 dark:border-white/10 text-black/50 dark:text-white/50' : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400'}`}>
                              {record.checkOutTime ? 'Concluded' : 'Active Duty'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Sidebar: Distribution or Summary */}
              <div className="space-y-8">
                <div className="bg-black dark:bg-white border border-black dark:border-white rounded-sm p-8 text-white dark:text-black relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none opacity-50"></div>
                  <h3 className="text-sm font-bold uppercase tracking-widest text-white/50 dark:text-black/50 mb-8">Operations Health</h3>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-5xl font-black">94%</p>
                      </div>
                    </div>
                    <div className="w-full bg-white/10 dark:bg-black/10 h-1.5 rounded-sm overflow-hidden">
                      <div className="bg-white dark:bg-black w-[94%] h-full group-hover:bg-emerald-400 dark:group-hover:bg-emerald-500 transition-colors"></div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/50 dark:text-black/50">
                      <span>Deployment Efficiency</span>
                      <span>Target: 100%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-sm p-6 shadow-xl shadow-black/5 dark:shadow-none">
                  <div className="flex items-center justify-between mb-6 border-b border-black/10 dark:border-white/10 pb-4">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-black dark:text-white">Active Alerts</h3>
                    <AlertTriangle size={16} className={summary.todayIncidents > 0 ? "text-red-500" : "text-black/30 dark:text-white/30"} />
                  </div>
                  <div className="space-y-4">
                    {summary.todayIncidents > 0 ? (
                      <div className="p-4 bg-red-50 dark:bg-red-950/30 border border-red-100 dark:border-red-900/50 rounded-sm flex gap-4">
                        <AlertTriangle className="text-red-600 dark:text-red-500 mt-0.5" size={16} />
                        <div>
                          <p className="text-sm font-bold text-red-700 dark:text-red-400">{summary.todayIncidents} System Incident(s)</p>
                          <p className="text-[10px] text-red-600/70 dark:text-red-500/70 mt-1 uppercase font-bold tracking-widest">Requires Review</p>
                        </div>
                      </div>
                    ) : (
                      <div className="py-8 text-center">
                        <div className="w-12 h-12 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-full flex items-center justify-center mx-auto mb-3">
                          <CheckCircle size={20} className="text-emerald-500" />
                        </div>
                        <p className="text-[10px] text-black/40 dark:text-white/40 font-bold uppercase tracking-widest">Systems Nominal</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-sm shadow-xl shadow-black/5 dark:shadow-none overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="p-6 border-b border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#111]">
                <h2 className="text-lg font-black text-black dark:text-white uppercase tracking-tight">Performance Matrix</h2>
                <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-1">Monthly Personnel Utilization</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-white dark:bg-black border-b border-black/10 dark:border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Personnel</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest text-center">Days Active (MTD)</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest text-center">Total Shifts</th>
                      <th className="px-6 py-4 text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest text-right">Reliability Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/5 dark:divide-white/5">
                    {monthlyAtt.map(guard => {
                      const rate = Math.round((guard.daysWorked / 30) * 100);
                      return (
                        <tr key={guard.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#111] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center font-bold text-xs">
                                {guard.name.charAt(0)}
                              </div>
                              <p className="font-bold text-sm text-black dark:text-white">{guard.name}</p>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-center text-lg font-black text-black dark:text-white">{guard.daysWorked} <span className="text-[10px] text-black/40 dark:text-white/40 font-mono">/ 30</span></td>
                          <td className="px-6 py-4 text-center font-bold text-black/70 dark:text-white/70">{guard.totalShifts}</td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-4">
                              <div className="w-24 h-1.5 bg-black/10 dark:bg-white/10 rounded-sm overflow-hidden">
                                <div className="bg-black dark:bg-white h-full" style={{ width: `${rate}%` }}></div>
                              </div>
                              <span className="text-xs font-mono font-bold text-black dark:text-white">{rate}%</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'performance' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
              {sitePerf.map((site) => (
                <div key={site.id} className="bg-white dark:bg-black p-6 border border-black/10 dark:border-white/10 rounded-sm hover:shadow-2xl dark:hover:shadow-none hover:border-black/30 dark:hover:border-white/30 transition-all group flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-6 pb-4 border-b border-black/5 dark:border-white/5">
                      <div className="w-10 h-10 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm flex items-center justify-center group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors text-black dark:text-white">
                        <MapPin size={18} />
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">Site ID</p>
                        <p className="text-xs font-mono font-bold text-black dark:text-white">{site.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    
                    <h3 className="text-xl font-black text-black dark:text-white mb-8 tracking-tight uppercase line-clamp-1">{site.name}</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                      <div className="bg-[#f8f9fa] dark:bg-[#111] p-4 border border-black/5 dark:border-white/5 rounded-sm">
                        <p className="text-[9px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-1">Attendance</p>
                        <p className="text-2xl font-black text-black dark:text-white">{site.totalAttendance}</p>
                      </div>
                      <div className={`p-4 border rounded-sm ${site.totalIncidents > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50' : 'bg-[#f8f9fa] dark:bg-[#111] border-black/5 dark:border-white/5'}`}>
                        <p className={`text-[9px] font-bold uppercase tracking-widest mb-1 ${site.totalIncidents > 0 ? 'text-red-500' : 'text-black/50 dark:text-white/50'}`}>Incidents</p>
                        <p className={`text-2xl font-black ${site.totalIncidents > 0 ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>{site.totalIncidents}</p>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedSite(site)}
                    className="w-full py-3 border border-black dark:border-white text-black dark:text-white rounded-sm font-bold uppercase text-[10px] tracking-widest hover:bg-black dark:hover:bg-white hover:text-white dark:hover:text-black transition-all"
                  >
                    Load Diagnostics
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox for selfies */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-lg w-full scale-in-center p-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Security Verification" className="w-full object-cover aspect-square bg-[#f8f9fa] dark:bg-[#111]" />
            <div className="p-4 border-t border-black/10 dark:border-white/10 text-center">
              <p className="text-[10px] font-mono font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Biometric Capture Record</p>
            </div>
            <button
              onClick={() => setLightboxUrl(null)}
              className="absolute -top-4 -right-4 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-sm shadow-xl flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-500 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Site Detail Modal */}
      {selectedSite && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setSelectedSite(null)}>
          <div className="bg-white dark:bg-black p-8 border border-black/10 dark:border-white/10 rounded-sm shadow-2xl w-full max-w-2xl overflow-hidden relative" onClick={e => e.stopPropagation()}>
            {/* Top Border Accent */}
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            
            <div className="flex justify-between items-start mb-8 pb-6 border-b border-black/10 dark:border-white/10">
              <div>
                <h2 className="text-3xl font-black text-black dark:text-white uppercase tracking-tight">{selectedSite.name}</h2>
                <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-2">Diagnostic Audit Report</p>
              </div>
              <button onClick={() => setSelectedSite(null)} className="text-black/30 dark:text-white/30 hover:text-black dark:hover:text-white transition-colors">
                <X size={20} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className="bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 p-6 rounded-sm relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1 h-full bg-black/20 dark:bg-white/20 group-hover:bg-black dark:group-hover:bg-white transition-colors"></div>
                <p className="text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-2 pl-2">Engagement Rate</p>
                <p className="text-4xl font-black text-black dark:text-white pl-2">{(selectedSite.totalAttendance * 0.8).toFixed(1)}%</p>
              </div>
              <div className={`p-6 border rounded-sm relative overflow-hidden ${selectedSite.totalIncidents > 0 ? 'bg-red-50 dark:bg-red-950/30 border-red-100 dark:border-red-900/50' : 'bg-[#f8f9fa] dark:bg-[#111] border-black/10 dark:border-white/10'}`}>
                <div className={`absolute top-0 left-0 w-1 h-full ${selectedSite.totalIncidents > 0 ? 'bg-red-500' : 'bg-black/20 dark:bg-white/20'}`}></div>
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 pl-2 ${selectedSite.totalIncidents > 0 ? 'text-red-500' : 'text-black/50 dark:text-white/50'}`}>Security Status</p>
                <p className={`text-4xl font-black pl-2 ${selectedSite.totalIncidents > 0 ? 'text-red-600 dark:text-red-500' : 'text-black dark:text-white'}`}>{selectedSite.totalIncidents > 0 ? 'Review' : 'Nominal'}</p>
              </div>
            </div>

            <div className="border border-black/10 dark:border-white/10 rounded-sm p-6 mb-8">
              <h4 className="text-[10px] font-bold text-black/50 dark:text-white/50 uppercase tracking-widest mb-6 pb-2 border-b border-black/5 dark:border-white/5">Performance Metrics</h4>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between items-end mb-2">
                    <span className="text-xs font-bold text-black dark:text-white">Cumulative Deployments</span>
                    <span className="text-sm font-mono font-black text-black dark:text-white">{selectedSite.totalAttendance} units</span>
                  </div>
                  <div className="w-full bg-[#f8f9fa] dark:bg-[#111] border border-black/5 dark:border-white/5 h-2 rounded-sm overflow-hidden">
                    <div className="bg-black dark:bg-white h-full w-[70%]"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-black/10 dark:border-white/10">
              <button 
                onClick={() => setSelectedSite(null)}
                className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-sm font-bold text-[10px] uppercase tracking-widest hover:bg-black/80 dark:hover:bg-white/80 transition-colors"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
