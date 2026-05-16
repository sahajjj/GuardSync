'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Shield, ArrowLeft, UserPlus, Loader2, User, ChevronRight } from 'lucide-react';
import { API_URL } from '../../lib/constants';

export default function SignupPage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [photo, setPhoto] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      setLoading(false);
      return;
    }

    try {
      const fd = new FormData();
      fd.append('name', name);
      fd.append('phone', cleanPhone);
      if (photo) fd.append('photo', photo);

      const res = await fetch(`${API_URL}/auth/signup`, {
        method: 'POST',
        body: fd
      });
      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => router.push('/login'), 2000);
      } else {
        setError(data.error || 'Registration failed');
      }
    } catch (err) {
      setError('Cannot connect to server. Please ensure the backend is running.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-[#111] px-4 relative overflow-hidden font-sans text-black dark:text-white py-12">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <Link href="/login" className="absolute top-8 left-8 flex items-center gap-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-widest z-10 group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Authentication
      </Link>

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-none overflow-hidden rounded-sm">
          {/* Header */}
          <div className="bg-[#f8f9fa] dark:bg-[#111] border-b border-black/10 dark:border-white/10 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            <Link href="/" className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/10 hover:scale-110 transition-transform">
              <UserPlus size={24} />
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">System Setup</h1>
            <p className="text-black/50 dark:text-white/50 mt-2 text-sm font-medium">Register administrative profile</p>
          </div>

          {/* Form Content */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-sm animate-in slide-in-from-top-2">
                <span className="font-bold mr-2 text-red-700 dark:text-red-500">SYS_ERR:</span> {error}
              </div>
            )}

            {success ? (
              <div className="text-center py-8 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/10">
                  <Shield size={32} />
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight text-black dark:text-white mb-2">Registration Validated</h2>
                <p className="text-sm font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Routing to portal...</p>
              </div>
            ) : (
              <form onSubmit={handleSignup} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Biometric Data (Photo)</label>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 flex items-center justify-center text-black/30 dark:text-white/30 overflow-hidden relative group rounded-sm">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} />
                      )}
                    </div>
                    <label className="flex-1">
                      <div className="bg-white dark:bg-black border border-dashed border-black/20 dark:border-white/20 p-4 text-center cursor-pointer hover:bg-black/5 dark:hover:bg-white/5 transition-colors group relative overflow-hidden rounded-sm">
                        <span className="text-xs text-black/60 dark:text-white/60 font-bold uppercase tracking-widest group-hover:text-black dark:group-hover:text-white transition-colors">{photo ? 'Update Record' : 'Upload Image'}</span>
                      </div>
                      <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Legal Name</label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" size={18} />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full p-4 pl-12 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium transition-colors placeholder-black/20 dark:placeholder-white/20 rounded-sm"
                      placeholder="JOHN DOE"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Identifier (Phone)</label>
                  <input
                    type="tel"
                    inputMode="numeric"
                    maxLength={10}
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-mono text-lg tracking-wider transition-colors placeholder-black/20 dark:placeholder-white/20 rounded-sm"
                    placeholder="9876543210"
                  />
                  <p className="text-[10px] text-black/40 dark:text-white/40 mt-2 font-mono uppercase text-right">{phone.length}/10 digits</p>
                </div>

                <button
                  type="submit"
                  disabled={loading || phone.length !== 10 || !name.trim()}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest py-4 rounded-sm transition-all hover:bg-black/80 dark:hover:bg-white/80 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm flex items-center justify-center gap-3 group relative overflow-hidden mt-2"
                >
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Provisioning</> : <>Initialize Record <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              </form>
            )}
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest leading-relaxed px-4">
            <span className="text-emerald-600 dark:text-emerald-400 block mb-1">SYSTEM NOTE</span> 
            The initial registered profile is automatically provisioned with L5 (Super Admin) access clearance.
          </p>
        </div>
      </div>
    </div>
  );
}
