'use client';
import { ReactNode, useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter, usePathname } from 'next/navigation';
import { LogOut, Home, Users, MapPin, FileText, Languages, Building, Shield, Sun, Moon, Menu, X } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeProvider';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();
  const { toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isSidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role === 'GUARD')) {
      router.push('/');
    }
  }, [mounted, user, router]);

  if (!mounted || !user || user.role === 'GUARD') {
    return null;
  }

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: <Home size={18} /> },
    { href: '/dashboard/clients', label: 'Clients', icon: <Building size={18} /> },
    { href: '/dashboard/sites', label: 'Sites', icon: <MapPin size={18} /> },
    { href: '/dashboard/guards', label: 'Guards', icon: <Users size={18} /> },
    { href: '/dashboard/reports', label: 'Reports', icon: <FileText size={18} /> },
  ];

  return (
    <div className="h-screen bg-[#f8f9fa] dark:bg-[#111] text-black dark:text-white font-sans selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black flex overflow-hidden relative">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      {/* Overlay for mobile sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — fixed full height */}
      <div className={`absolute inset-y-0 left-0 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-300 ease-in-out w-64 bg-white dark:bg-black flex flex-col border-r border-black/10 dark:border-white/10 h-screen shrink-0 z-50`}>
        <div className="p-6 md:p-8 border-b border-black/10 dark:border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-black dark:bg-white flex items-center justify-center rounded-sm">
              <Shield size={16} className="text-white dark:text-black" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-black dark:text-white">GuardSync</h2>
          </Link>
          <button className="md:hidden p-2" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href}
                href={item.href} 
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-sm transition-colors text-sm font-bold uppercase tracking-widest ${
                  isActive 
                    ? 'bg-black dark:bg-white text-white dark:text-black shadow-lg shadow-black/10 dark:shadow-none' 
                    : 'text-black/60 dark:text-white/60 hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white'
                }`}
              >
                {item.icon} {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#111]">
          <div className="mb-4">
            <div className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40 mb-1">Operator</div>
            <div className="font-bold text-sm truncate text-black dark:text-white">{user.name}</div>
            <div className="text-[10px] font-mono bg-black/5 dark:bg-white/5 inline-block px-2 py-0.5 mt-1 rounded-sm text-black/60 dark:text-white/60">
              {user.role}
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-700 dark:hover:text-red-300 border border-transparent hover:border-red-200 dark:hover:border-red-900/50 rounded-sm transition-all text-sm font-bold uppercase tracking-widest"
          >
            <LogOut size={16} /> Terminate Session
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden relative z-10">
        {/* Top Header */}
        <div className="h-20 bg-white dark:bg-black border-b border-black/10 dark:border-white/10 flex items-center justify-between px-4 md:px-8 shrink-0">
          <div className="flex items-center gap-4">
            <button className="md:hidden p-2 rounded-sm hover:bg-black/5 dark:hover:bg-white/5" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <div className="hidden sm:block text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
              System Status: <span className="text-emerald-600 dark:text-emerald-400 ml-1">Online</span>
            </div>
          </div>
          <div className="flex items-center gap-3 md:gap-4">
            <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white transition-colors" title="Toggle Theme">
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
            <button onClick={toggleLang} className="p-2 border border-black/10 dark:border-white/10 rounded-sm hover:bg-black/5 dark:hover:bg-white/5 text-black dark:text-white transition-colors" title="Toggle Language">
              <Languages size={16} />
            </button>
            <div className="w-px h-6 bg-black/10 dark:bg-white/10"></div>
            <div className="text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60">
              Level: <span className="text-black/50 dark:text-white/50 ml-1">{user.role}</span>
            </div>
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 p-4 md:p-8 overflow-y-auto">
          <div className="max-w-[1440px] mx-auto h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
