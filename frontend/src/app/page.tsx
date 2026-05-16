'use client';
import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import Link from 'next/link';
import { ArrowUpRight, MapPin, Shield, Clock, FileText, ChevronRight, Activity, Sun, Moon, Languages, ArrowUp } from 'lucide-react';
import { useTheme } from './ThemeProvider';
import { useLanguage } from './LanguageContext';
function useOnScreen(threshold = 0.1) {
  const [ref, setRef] = useState<HTMLElement | null>(null);
  const [visible, setVisible] = useState(false);
  
  useEffect(() => {
    if (!ref) return;
    const obs = new IntersectionObserver(([entry]) => { 
      if (entry.isIntersecting) setVisible(true); 
    }, { threshold });
    obs.observe(ref);
    return () => obs.disconnect();
  }, [ref, threshold]);
  
  return { ref: setRef, visible };
}

// Typing effect for "AI" feel
function Typewriter({ text, delay = 0 }: { text: string; delay?: number }) {
  const [content, setContent] = useState('');
  const { ref, visible } = useOnScreen(0.5);
  
  useEffect(() => {
    if (!visible) return;
    let i = 0;
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setContent(text.slice(0, i + 1));
        i++;
        if (i >= text.length) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [text, visible, delay]);

  return (
    <span ref={ref}>
      {content}
      <span className="animate-pulse opacity-50 ml-1 inline-block w-2 h-4 bg-black dark:bg-white align-middle"></span>
    </span>
  );
}

export default function HomePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const { toggleLang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    setMounted(true);
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Section refs
  const hero = useOnScreen(0.1);
  const system = useOnScreen(0.2);
  const workflow = useOnScreen(0.2);
  const matrix = useOnScreen(0.2);
  const cta = useOnScreen(0.3);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!mounted) return <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#111]" />;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#111] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black relative overflow-x-hidden">
      {/* ─── Global Background Grid ─── */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      {/* ─── Content Frame ─── */}
      <div className="relative z-10 max-w-[1440px] mx-auto bg-white dark:bg-black min-h-screen border-x border-black/10 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-none">
        
        {/* ─── Navigation ─── */}
        <nav className="sticky top-0 w-full bg-white/90 dark:bg-black/90 backdrop-blur-md z-50 border-b border-black/10 dark:border-white/10 transition-all duration-300">
          <div className="px-6 md:px-8 h-20 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={scrollToTop}>
              <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center rounded-sm group overflow-hidden relative">
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-in-out"></div>
                <Shield size={16} className="text-white dark:text-black relative z-10 group-hover:scale-110 transition-transform" />
              </div>
              <span className="text-xl font-bold tracking-tight">GuardSync</span>
            </div>
            <div className="hidden md:flex gap-10 text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60">
              <a href="#system" className="hover:text-black dark:hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-black dark:after:bg-white hover:after:w-full after:transition-all">System</a>
              <a href="#workflow" className="hover:text-black dark:hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-black dark:after:bg-white hover:after:w-full after:transition-all">Workflow</a>
              <a href="#matrix" className="hover:text-black dark:hover:text-white transition-colors relative after:absolute after:bottom-[-4px] after:left-0 after:w-0 after:h-[2px] after:bg-black dark:after:bg-white hover:after:w-full after:transition-all">Matrix</a>
            </div>
            <div className="flex items-center gap-4">
              <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white transition-colors" title="Toggle Theme">
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
              </button>
              <button onClick={toggleLang} className="p-2 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white transition-colors" title="Toggle Language">
                <Languages size={16} />
              </button>
              <Link 
                href={user ? (user.role === 'GUARD' ? '/guard' : user.role === 'SUPERVISOR' ? '/supervisor' : user.role === 'CLIENT' ? '/client' : '/dashboard') : '/login'} 
                className="group flex items-center gap-2 px-6 py-2.5 bg-black dark:bg-white text-white dark:text-black text-sm font-bold rounded-sm hover:bg-black/80 dark:hover:bg-white/80 transition-all hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:-translate-y-0.5"
              >
                {user ? 'Portal' : 'Sign In'}
                <ArrowUpRight size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
          </div>
        </nav>

        {/* ─── Hero Section ─── */}
        <section className="px-6 md:px-8 pt-24 pb-16 border-b border-black/10 dark:border-white/10 relative overflow-hidden" ref={hero.ref}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end relative z-10">
            <div className={`lg:col-span-8 transition-all duration-1000 ${hero.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
              <div className="inline-flex items-center gap-3 px-3 py-1 bg-black/5 dark:bg-white/5 text-black dark:text-white border border-black/10 dark:border-white/10 rounded-full text-xs font-bold uppercase tracking-widest mb-8">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,1)] animate-pulse"></div>
                <Typewriter text="SYSTEM ONLINE // OPERATIONAL" delay={500} />
              </div>
              <h1 className="text-[3rem] sm:text-[4rem] md:text-[5rem] lg:text-[6.5rem] leading-[0.95] font-black tracking-tighter uppercase text-black dark:text-white">
                Security,<br />
                <span className="text-black/30 dark:text-white/30 bg-clip-text bg-gradient-to-r from-black/30 via-black to-black/30 dark:from-white/30 dark:via-white dark:to-white/30 bg-[length:200%_auto] animate-[gradient-x_4s_linear_infinite] hover:text-transparent transition-all duration-500">Synchronized.</span>
              </h1>
            </div>
            <div className={`lg:col-span-4 pb-4 transition-all duration-1000 delay-300 ${hero.visible ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-12'}`}>
              <div className="p-6 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm relative group hover:bg-white dark:hover:bg-black hover:shadow-xl dark:hover:shadow-white/5 transition-all duration-500">
                <div className="absolute top-0 left-0 w-2 h-full bg-black dark:bg-white rounded-l-sm group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 transition-colors duration-500"></div>
                <p className="text-lg font-medium leading-relaxed text-black/80 dark:text-white/80 pl-2">
                  A precise, geofence-backed deployment system built for the absolute realities of field operations.
                </p>
              </div>
            </div>
          </div>

          {/* Structured Hero Graphic with AI/Radar Effects */}
          <div className={`mt-16 w-full bg-[#f8f9fa] dark:bg-[#111] rounded-sm border border-black/10 dark:border-white/10 overflow-hidden relative transition-all duration-1000 delay-500 ${hero.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
            <div className="absolute top-4 left-4 flex gap-2">
              <div className="w-2.5 h-2.5 rounded-full border border-black/30 dark:border-white/30"></div>
              <div className="w-2.5 h-2.5 rounded-full border border-black/30 dark:border-white/30"></div>
            </div>
            <div className="absolute top-4 right-4 text-xs font-mono text-black/30 dark:text-white/30 flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> G-SYNC // DASHBOARD
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 h-full min-h-[400px]">
              <div className="p-8 border-r border-black/10 dark:border-white/10 flex flex-col justify-end bg-white/50 dark:bg-black/50 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-t from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-1000"></div>
                <div className="space-y-4 w-full relative z-10">
                  <div className="h-2 w-full bg-black/5 dark:bg-white/5 rounded-sm overflow-hidden">
                    <div className="h-full bg-black/20 dark:bg-white/20 w-1/2 animate-[shimmer_2s_infinite]"></div>
                  </div>
                  <div className="h-2 w-3/4 bg-black/5 dark:bg-white/5 rounded-sm"></div>
                  <div className="h-2 w-5/6 bg-black/5 dark:bg-white/5 rounded-sm"></div>
                  <div className="pt-4 mt-4 border-t border-black/10 dark:border-white/10">
                    <div className="text-4xl font-black">99.8%</div>
                    <div className="text-xs font-bold uppercase text-black/40 dark:text-white/40 tracking-widest mt-1 flex items-center gap-2">
                      Verification Rate <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="md:col-span-2 p-8 flex items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-80 dark:opacity-20">
                {/* Radar/Geofence abstraction */}
                <div className="w-64 h-64 border border-black/20 dark:border-white/20 rounded-full flex items-center justify-center relative bg-white dark:bg-black shadow-[0_0_40px_rgba(0,0,0,0.05)] hover:shadow-[0_0_60px_rgba(16,185,129,0.1)] transition-shadow duration-1000">
                  <div className="absolute inset-0 rounded-full border-t border-emerald-500/50 animate-[spin-slow_10s_linear_infinite]"></div>
                  <div className="w-48 h-48 border border-emerald-500/30 bg-emerald-500/5 rounded-full flex items-center justify-center relative">
                    <div className="absolute inset-0 rounded-full border border-emerald-500/50 animate-ping" style={{ animationDuration: '3s' }}></div>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_20px_rgba(16,185,129,0.8)]"></div>
                    {/* Simulated guards */}
                    <div className="absolute top-[20%] right-[30%] w-2 h-2 bg-black dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    <div className="absolute bottom-[25%] left-[20%] w-2 h-2 bg-black dark:bg-white rounded-full shadow-[0_0_10px_rgba(0,0,0,0.5)] dark:shadow-[0_0_10px_rgba(255,255,255,0.5)]"></div>
                    <div className="absolute top-[40%] left-[15%] w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Typography & Structure Section ─── */}
        <section id="system" className="px-6 md:px-8 py-24 border-b border-black/10 dark:border-white/10 bg-white dark:bg-black" ref={system.ref}>
          <div className="flex flex-col lg:flex-row gap-16">
            <div className={`lg:w-1/3 transition-all duration-1000 ${system.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight uppercase leading-none mb-6 relative inline-block">
                Engineered for <br/> Precision.
                <span className="absolute -bottom-2 left-0 w-1/3 h-1 bg-black dark:bg-white rounded-sm"></span>
              </h2>
              <p className="text-lg font-medium text-black/60 dark:text-white/60 leading-relaxed mt-6">
                We eliminated the noise. GuardSync focuses exclusively on verified presence, geographical boundaries, and structured field reporting.
              </p>
            </div>
            <div className="lg:w-2/3 grid grid-cols-1 md:grid-cols-2 gap-8">
              {[
                { 
                  icon: <MapPin size={24} strokeWidth={2} />, 
                  title: "Mathematical Geofencing", 
                  desc: "Utilizing strict coordinate radius checks. If personnel aren't physically on site, check-in is mathematically impossible." 
                },
                { 
                  icon: <Clock size={24} strokeWidth={2} />, 
                  title: "Temporal Integrity", 
                  desc: "Immutable server-side timestamps govern check-in flows, calculating exact shift durations without manual intervention." 
                },
                { 
                  icon: <FileText size={24} strokeWidth={2} />, 
                  title: "Evidence-Based Logs", 
                  desc: "Incident reports require live photographic proof. Built-in camera capture prevents gallery uploads." 
                },
                { 
                  icon: <Shield size={24} strokeWidth={2} />, 
                  title: "Stateless Security", 
                  desc: "JWT-based authentication ensures every single API request is cryptographically verified and strictly role-gated." 
                }
              ].map((f, i) => (
                <div 
                  key={i} 
                  className={`p-8 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm hover:shadow-xl hover:shadow-black/5 dark:hover:shadow-white/5 hover:-translate-y-1 transition-all duration-500 group ${system.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}
                  style={{ transitionDelay: `${i * 150}ms` }}
                >
                  <div className="mb-6 p-3 bg-black dark:bg-white text-white dark:text-black inline-flex rounded-sm shadow-md group-hover:bg-emerald-500 dark:group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                    {f.icon}
                  </div>
                  <h3 className="text-xl font-bold tracking-tight mb-3 group-hover:text-emerald-700 dark:group-hover:text-emerald-400 transition-colors">{f.title}</h3>
                  <p className="text-black/60 dark:text-white/60 leading-relaxed font-medium text-sm">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Operational Flow ─── */}
        <section id="workflow" className="px-6 md:px-8 py-24 border-b border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#111] relative overflow-hidden" ref={workflow.ref}>
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-black/5 dark:bg-white/5 rounded-full blur-[100px] pointer-events-none"></div>
          
          <h2 className={`text-4xl font-black uppercase tracking-tight mb-16 text-center transition-all duration-1000 ${workflow.visible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
            The Workflow
          </h2>
          
          <div className="max-w-5xl mx-auto relative z-10">
            <div className={`grid grid-cols-1 md:grid-cols-3 gap-0 border border-black/10 dark:border-white/10 rounded-sm overflow-hidden bg-white dark:bg-black shadow-xl shadow-black/5 dark:shadow-none transition-all duration-1000 delay-200 ${workflow.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
              {[
                { step: "01", name: "Deployment", desc: "Operations manager configures site boundaries, shift timings, and assigns security personnel to specific locations." },
                { step: "02", name: "Execution", desc: "Guard arrives on-site, authenticates via GPS validation and live selfie capture to officially commence the shift." },
                { step: "03", name: "Oversight", desc: "Administrators and clients monitor real-time attendance, active duty counts, and incident reports via live dashboards." }
              ].map((s, i) => (
                <div key={i} className="p-10 border-b md:border-b-0 md:border-r border-black/10 dark:border-white/10 last:border-0 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-1 bg-black/5 dark:bg-white/5 group-hover:bg-black dark:group-hover:bg-white transition-colors duration-500"></div>
                  {/* Hover gradient effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-black/5 dark:from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                  
                  <div className="text-5xl font-black text-black/10 dark:text-white/10 mb-6 group-hover:scale-110 group-hover:text-black/20 dark:group-hover:text-white/20 origin-left transition-all duration-500">{s.step}</div>
                  <h3 className="text-2xl font-bold mb-4 relative z-10">{s.name}</h3>
                  <p className="text-black/60 dark:text-white/60 font-medium leading-relaxed text-sm relative z-10">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Role Matrix ─── */}
        <section id="matrix" className="px-6 md:px-8 py-24 bg-white dark:bg-black border-b border-black/10 dark:border-white/10" ref={matrix.ref}>
          <div className="max-w-4xl mx-auto">
            <div className={`flex items-center gap-4 mb-12 transition-all duration-1000 ${matrix.visible ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-12'}`}>
              <h2 className="text-4xl font-black uppercase tracking-tight">Access Control Matrix</h2>
              <div className="flex-1 h-px bg-black/10 dark:bg-white/10 relative overflow-hidden">
                <div className="absolute top-0 left-0 h-full bg-black/50 dark:bg-white/50 w-1/4 animate-[shimmer_3s_infinite]"></div>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { role: "Administrator", level: "L5", desc: "Global system oversight, user management, and macro analytics." },
                { role: "Operations Manager", level: "L4", desc: "Site configuration, guard deployment, and schedule management." },
                { role: "Supervisor", level: "L3", desc: "Field reporting, incident logging, and quality assurance." },
                { role: "Security Guard", level: "L2", desc: "Attendance marking, GPS verification, and shift execution." },
                { role: "Client", level: "L1", desc: "Transparent viewing of assigned sites, logs, and dispute filing." }
              ].map((r, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col md:flex-row md:items-center p-6 border border-black/10 dark:border-white/10 rounded-sm hover:bg-[#f8f9fa] dark:hover:bg-[#111] hover:border-black/30 dark:hover:border-white/30 transition-all duration-300 group cursor-default ${matrix.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}
                  style={{ transitionDelay: `${i * 100}ms` }}
                >
                  <div className="w-16 mb-4 md:mb-0">
                    <span className="font-mono text-xs font-bold bg-black/5 dark:bg-white/5 px-2 py-1 rounded-sm text-black/50 dark:text-white/50 group-hover:bg-black dark:group-hover:bg-white group-hover:text-white dark:group-hover:text-black transition-colors duration-300 shadow-[0_0_0_rgba(0,0,0,0)] group-hover:shadow-[0_0_10px_rgba(0,0,0,0.2)] dark:group-hover:shadow-[0_0_10px_rgba(255,255,255,0.2)]">{r.level}</span>
                  </div>
                  <div className="w-64 font-bold text-lg group-hover:translate-x-2 transition-transform duration-300">{r.role}</div>
                  <div className="flex-1 text-black/60 dark:text-white/60 font-medium text-sm mt-2 md:mt-0">{r.desc}</div>
                  <div className="hidden md:block opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <Shield size={16} className="text-black/30 dark:text-white/30" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Final CTA ─── */}
        <section className="px-6 md:px-8 py-32 bg-[#f8f9fa] dark:bg-[#111] flex flex-col items-center text-center relative overflow-hidden" ref={cta.ref}>
          {/* Subtle AI background effects */}
          <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none">
            <div className={`w-[800px] h-[800px] border border-black/5 dark:border-white/5 rounded-full transition-all duration-[3000ms] ${cta.visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}></div>
            <div className={`absolute w-[600px] h-[600px] border border-black/5 dark:border-white/5 rounded-full transition-all duration-[2000ms] delay-300 ${cta.visible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}></div>
          </div>

          <div className={`relative z-10 transition-all duration-1000 ${cta.visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-16'}`}>
            <div className="w-16 h-16 bg-black dark:bg-white rounded-sm flex items-center justify-center mb-8 mx-auto shadow-xl shadow-black/20 dark:shadow-white/10 group hover:scale-110 transition-transform duration-500 cursor-pointer">
              <Shield size={32} className="text-white dark:text-black group-hover:text-emerald-400 dark:group-hover:text-emerald-600 transition-colors" />
            </div>
            <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 relative">
              Take Control.
              <span className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-24 h-1.5 bg-black dark:bg-white rounded-sm"></span>
            </h2>
            <p className="text-xl text-black/50 dark:text-white/50 font-medium mb-12 max-w-lg mx-auto mt-10">
              Deploy your digital infrastructure today. No proprietary hardware required.
            </p>
            <Link 
              href={user ? (user.role === 'GUARD' ? '/guard' : user.role === 'SUPERVISOR' ? '/supervisor' : user.role === 'CLIENT' ? '/client' : '/dashboard') : '/login'} 
              className="group relative inline-flex items-center justify-center gap-3 px-10 py-5 bg-black dark:bg-white text-white dark:text-black text-lg font-bold rounded-sm overflow-hidden shadow-2xl shadow-black/20 dark:shadow-white/10 hover:shadow-black/40 dark:hover:shadow-white/20 transition-all duration-500 hover:-translate-y-1"
            >
              {/* Button sheen effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 dark:via-black/20 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
              <span className="relative z-10">{user ? 'Access Portal' : 'Initialize System'}</span>
              <ChevronRight size={20} className="relative z-10 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </section>

        {/* ─── Minimal Footer ─── */}
        <footer className="px-6 md:px-8 py-8 border-t border-black/10 dark:border-white/10 bg-white dark:bg-black">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 group cursor-pointer" onClick={scrollToTop}>
              <div className="w-6 h-6 bg-black dark:bg-white flex items-center justify-center rounded-sm overflow-hidden relative">
                <div className="absolute inset-0 bg-white/20 dark:bg-black/20 -translate-y-full group-hover:translate-y-0 transition-transform"></div>
                <Shield size={12} className="text-white dark:text-black relative z-10" />
              </div>
              <span className="font-bold tracking-tight text-sm">GuardSync</span>
            </div>
            <div className="flex flex-col items-center">
              <p className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 text-center mb-1">
                Architecture for Security Operations. © 2026
              </p>
              <a href="https://github.com/sahajjj" target="_blank" rel="noopener noreferrer" className="text-[10px] font-bold uppercase tracking-widest text-black/30 dark:text-white/30 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                Engineered by Sahaj Sharma
              </a>
            </div>
            <div className="flex gap-6 text-xs font-bold uppercase tracking-widest">
              <Link href="/login" className="hover:text-black dark:hover:text-white transition-colors relative after:absolute after:bottom-[-2px] after:left-0 after:w-0 after:h-px after:bg-black dark:after:bg-white hover:after:w-full after:transition-all">Portal Access</Link>
            </div>
          </div>
        </footer>

      </div>

      {/* ─── Back to Top Button ─── */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-50 p-4 bg-black dark:bg-white text-white dark:text-black rounded-sm shadow-2xl transition-all duration-500 hover:scale-110 hover:shadow-[0_0_20px_rgba(0,0,0,0.3)] dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] ${
          showScrollTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'
        }`}
        title="Back to Top"
      >
        <ArrowUp size={20} />
      </button>
    </div>
  );
}
