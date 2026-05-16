'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import Link from 'next/link';
import { Shield, ArrowLeft, Fingerprint, Send, Loader2, CheckCircle, ChevronRight } from 'lucide-react';
import { API_URL } from '../../lib/constants';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpPreview, setOtpPreview] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const router = useRouter();
  const { login, user } = useAuthStore();

  useEffect(() => {
    if (user) {
      if (user.role === 'GUARD') router.push('/guard');
      else if (user.role === 'SUPERVISOR') router.push('/supervisor');
      else if (user.role === 'CLIENT') router.push('/client');
      else router.push('/dashboard');
    }
  }, [user, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const handleSendOTP = async () => {
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length !== 10) {
      setError('Phone number must be exactly 10 digits');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone })
      });
      const data = await res.json();

      if (res.ok) {
        setOtpSent(true);
        setOtpPreview(data.otp_preview || '');
        setCooldown(30); 
        setOtp(''); 
      } else {
        setError(data.error || 'Failed to send OTP');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanPhone = phone.replace(/\D/g, '');
    if (!otp.trim() || otp.length !== 6) {
      setError('Enter the 6-digit OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, otp: otp.trim() })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.user, data.token);
        if (data.user.role === 'GUARD') router.push('/guard');
        else if (data.user.role === 'SUPERVISOR') router.push('/supervisor');
        else if (data.user.role === 'CLIENT') router.push('/client');
        else router.push('/dashboard');
      } else {
        setError(data.error || 'Login failed.');
      }
    } catch (err) {
      setError('Cannot connect to server.');
    }
    setLoading(false);
  };

  const handleEditPhone = () => {
    setOtpSent(false);
    setOtpPreview('');
    setOtp('');
    setError('');
    setCooldown(0);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fa] dark:bg-[#111] px-4 relative overflow-hidden font-sans text-black dark:text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <Link href="/" className="absolute top-8 left-8 flex items-center gap-2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-widest z-10 group">
        <ArrowLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> System Root
      </Link>

      <div className="max-w-md w-full relative z-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-2xl shadow-black/5 dark:shadow-none overflow-hidden rounded-sm">
          {/* Header */}
          <div className="bg-[#f8f9fa] dark:bg-[#111] border-b border-black/10 dark:border-white/10 p-8 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            <Link href="/" className="w-12 h-12 bg-black dark:bg-white text-white dark:text-black flex items-center justify-center mx-auto mb-6 shadow-lg shadow-black/10 hover:scale-110 transition-transform">
              <Fingerprint size={24} />
            </Link>
            <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">{otpSent ? 'Verification' : 'Authentication'}</h1>
            <p className="text-black/50 dark:text-white/50 mt-2 text-sm font-medium">
              {otpSent
                ? `OTP deployed to +91 ${phone.slice(0, 3)}XXXX${phone.slice(7)}`
                : 'Secure system access portal'
              }
            </p>
          </div>

          {/* Form */}
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-sm font-medium rounded-sm animate-in slide-in-from-top-2">
                <span className="font-bold mr-2 text-red-700 dark:text-red-500">SYS_ERR:</span> {error}
              </div>
            )}

            {/* OTP Preview Banner (demo mode) */}
            {otpSent && otpPreview && (
              <div className="mb-8 p-6 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 text-center rounded-sm relative overflow-hidden group">
                <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500"></div>
                <p className="text-[10px] text-black/40 dark:text-white/40 mb-2 uppercase tracking-[0.2em] font-bold">Simulated Transmission</p>
                <p className="text-4xl font-black tracking-[0.3em] text-black dark:text-white mb-1">{otpPreview}</p>
                <p className="text-[10px] text-black/30 dark:text-white/30 uppercase tracking-widest font-medium">Network Bypass Enabled</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-6">
              {/* Phone Input */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Identifier (Phone)</label>
                <div className="relative">
                  <input
                    type="tel" inputMode="numeric" maxLength={10}
                    value={phone}
                    onChange={(e) => { if (!otpSent) setPhone(e.target.value.replace(/\D/g, '')); }}
                    readOnly={otpSent}
                    className={`w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-mono text-lg tracking-wider transition-colors placeholder-black/20 dark:placeholder-white/20 ${otpSent ? 'opacity-50 cursor-not-allowed bg-black/5 dark:bg-white/5' : ''}`}
                    placeholder="9876543210" required
                  />
                  {otpSent && (
                    <button type="button" onClick={handleEditPhone} className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] uppercase tracking-widest font-bold text-black/40 dark:text-white/40 hover:text-black dark:hover:text-white transition-colors bg-white dark:bg-black px-2 py-1 border border-black/10 dark:border-white/10">
                      Edit
                    </button>
                  )}
                </div>
                {!otpSent && <p className="text-[10px] text-black/40 dark:text-white/40 mt-2 font-mono uppercase text-right">{phone.length}/10 digits</p>}
              </div>

              {/* OTP Section */}
              {otpSent ? (
                <>
                  <div className="animate-in slide-in-from-bottom-4 duration-500">
                    <label className="block text-xs font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Access Code (OTP)</label>
                    <input
                      type="text" inputMode="numeric" maxLength={6}
                      value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none font-mono text-2xl tracking-[0.5em] text-center placeholder-black/10 dark:placeholder-white/10 transition-colors"
                      placeholder="------" required autoFocus
                    />
                    <div className="flex justify-between items-center mt-3">
                      <p className="text-[10px] text-black/40 dark:text-white/40 uppercase font-bold tracking-widest">Expires: 5m</p>
                      <button
                        type="button"
                        onClick={handleSendOTP}
                        disabled={cooldown > 0 || loading}
                        className="text-[10px] font-bold uppercase tracking-widest text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white disabled:text-black/20 dark:disabled:text-white/20 disabled:cursor-not-allowed transition-colors"
                      >
                        {cooldown > 0 ? `T-${cooldown}s` : 'Resend Code'}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit" disabled={loading || otp.length !== 6}
                    className="w-full bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest py-4 transition-all hover:bg-black/80 dark:hover:bg-white/80 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed text-sm flex items-center justify-center gap-3 group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-white/20 dark:bg-black/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                    {loading ? <><Loader2 size={16} className="animate-spin" /> Verifying</> : <><CheckCircle size={16} /> Authorize</>}
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading || phone.length !== 10}
                  className="w-full bg-black dark:bg-white text-white dark:text-black font-bold uppercase tracking-widest py-4 transition-all hover:bg-black/80 dark:hover:bg-white/80 hover:shadow-lg hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 text-sm flex items-center justify-center gap-3 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-white/20 dark:bg-black/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                  {loading ? <><Loader2 size={16} className="animate-spin" /> Transmitting</> : <>Request Access <ChevronRight size={16} className="group-hover:translate-x-1 transition-transform" /></>}
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Info box */}
        <div className="mt-6 text-center">
          <p className="text-xs text-black/40 dark:text-white/40 font-medium">
            Requires administrative provisioning?{' '}
            <Link href="/signup" className="text-black dark:text-white font-bold uppercase tracking-widest hover:underline underline-offset-4 ml-1">
              Initialize System
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
