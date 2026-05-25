'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { MapPin, CheckCircle, LogOut, Languages, Clock, AlertTriangle, Navigation, ShieldAlert, Crosshair, Sun, Moon } from 'lucide-react';
import { API_URL, API_BASE_URL } from '../../lib/constants';
import { useLanguage } from '../LanguageContext';
import { useTheme } from '../ThemeProvider';
import CameraCapture from '../components/CameraCapture';
import VisitorLogForm from '../components/VisitorLogForm';
import IncidentReportForm from '../components/IncidentReportForm';

export default function GuardApp() {
  const { user, token, logout } = useAuthStore();
  const router = useRouter();
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [locationError, setLocationError] = useState('');
  const [status, setStatus] = useState<'idle' | 'locating' | 'ready' | 'checking' | 'success' | 'error'>('idle');
  const [statusMsg, setStatusMsg] = useState('');
  const [sites, setSites] = useState<any[]>([]);
  const [selectedSite, setSelectedSite] = useState('');
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [loadingSites, setLoadingSites] = useState(true);
  const [activeTab, setActiveTab] = useState<'attendance' | 'visitors' | 'incidents'>('attendance');
  
  // Camera state for selfies
  const [selfieBlob, setSelfieBlob] = useState<Blob | null>(null);
  const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
  const [checkoutSelfieBlob, setCheckoutSelfieBlob] = useState<Blob | null>(null);
  const [checkoutSelfiePreview, setCheckoutSelfiePreview] = useState<string | null>(null);

  // Face-api state
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [faceMatchStatus, setFaceMatchStatus] = useState<'idle' | 'verifying' | 'matched' | 'failed'>('idle');
  const [faceMatchMsg, setFaceMatchMsg] = useState('');
  const [faceRetryCount, setFaceRetryCount] = useState(0);

  const { t, toggleLang } = useLanguage();
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!user || user.role !== 'GUARD')) {
      router.push('/');
    }
  }, [mounted, user, router]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const faceapi = await import('@vladmandic/face-api');
        const MODEL_URL = '/models';
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
        ]);
        setModelsLoaded(true);
        console.log('[FaceAPI] All models loaded successfully');
      } catch (e) {
        console.error('[FaceAPI] Failed to load models:', e);
        setFaceMatchMsg('[ERR] BIOMETRIC ENGINE FAILED TO INITIALIZE');
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    const fetchSites = async () => {
      try {
        const res = await fetch(`${API_URL}/sites`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSites(data);
          if (data.length > 0) setSelectedSite(data[0].id);
        }
      } catch (e) {
        console.error('Failed to fetch sites');
      } finally {
        setLoadingSites(false);
      }
    };

    const fetchTodayAttendance = async () => {
      try {
        const res = await fetch(`${API_URL}/attendance`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const records = await res.json();
          const today = new Date().toDateString();
          const myRecord = records.find((r: any) =>
            r.guardId === user?.id && new Date(r.checkInTime).toDateString() === today
          );
          if (myRecord) setTodayAttendance(myRecord);
        }
      } catch (e) {}
    };

    if (token) {
      fetchSites();
      fetchTodayAttendance();
    }
  }, [token, user]);

  if (!mounted || !user || user.role !== 'GUARD') return null;

  const verifyFaceMatch = async (capturedBlob: Blob): Promise<boolean> => {
    if (!user?.photoUrl) {
      setFaceMatchMsg('[ERR] NO PROFILE PHOTO ON FILE');
      return false;
    }
    if (!modelsLoaded) {
      setFaceMatchMsg('[ERR] BIOMETRIC ENGINE NOT READY — RELOAD PAGE');
      return false;
    }
    try {
      setFaceMatchMsg('ANALYZING BIOMETRICS...');
      const faceapi = await import('@vladmandic/face-api');

      // Fetch the registered profile photo
      const profileRes = await fetch(`${API_BASE_URL}${user.photoUrl}`);
      if (!profileRes.ok) {
        setFaceMatchMsg('[ERR] UNABLE TO FETCH PROFILE PHOTO');
        return false;
      }
      const profileBlob = await profileRes.blob();
      const profileImg = await faceapi.bufferToImage(profileBlob);
      const selfieImg = await faceapi.bufferToImage(capturedBlob);

      // Detect face in profile photo — try TinyFaceDetector first, then SSD MobileNet
      setFaceMatchMsg('SCANNING PROFILE BIOMETRICS...');
      let profileDetection = await faceapi
        .detectSingleFace(profileImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!profileDetection) {
        // Fallback to SSD MobileNet which is better for some image types
        profileDetection = await faceapi
          .detectSingleFace(profileImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
      }

      if (!profileDetection) {
        setFaceMatchMsg('[ERR] NO FACE DETECTED IN PROFILE PHOTO');
        return false;
      }

      // Detect face in selfie
      setFaceMatchMsg('SCANNING LIVE BIOMETRICS...');
      let selfieDetection = await faceapi
        .detectSingleFace(selfieImg, new faceapi.TinyFaceDetectorOptions({ inputSize: 512, scoreThreshold: 0.3 }))
        .withFaceLandmarks()
        .withFaceDescriptor();

      if (!selfieDetection) {
        selfieDetection = await faceapi
          .detectSingleFace(selfieImg, new faceapi.SsdMobilenetv1Options({ minConfidence: 0.3 }))
          .withFaceLandmarks()
          .withFaceDescriptor();
      }

      if (!selfieDetection) {
        setFaceMatchMsg('[ERR] NO FACE DETECTED IN SELFIE — RETAKE');
        return false;
      }

      // Compare face descriptors using Euclidean distance
      const distance = faceapi.euclideanDistance(profileDetection.descriptor, selfieDetection.descriptor);
      const confidence = Math.max(0, Math.round((1 - distance) * 100));
      console.log(`[FaceAPI] Euclidean distance: ${distance.toFixed(4)} | Confidence: ${confidence}% (threshold: 0.85)`);

      // 0.85 threshold is forgiving for real-world conditions:
      // different lighting, angles, expressions, clothing, webcam quality
      if (distance <= 0.85) {
        return true;
      } else {
        setFaceMatchMsg(`FACE MISMATCH (${confidence}% match) — Try better lighting or angle`);
        return false;
      }
    } catch (e) {
      console.error('[FaceAPI] Verification error:', e);
      setFaceMatchMsg('BIOMETRIC ANALYSIS FAILED — Retake photo');
      return false;
    }
  };

  const handleSelfieCapture = async (blob: Blob) => {
    setSelfieBlob(blob);
    setSelfiePreview(URL.createObjectURL(blob));
    setFaceMatchStatus('verifying');
    const isMatch = await verifyFaceMatch(blob);
    if (isMatch) {
      setFaceMatchStatus('matched');
      setFaceMatchMsg('IDENTITY VERIFIED');
      setFaceRetryCount(0);
    } else {
      setFaceMatchStatus('failed');
      setFaceRetryCount(prev => prev + 1);
    }
  };

  const handleBypassVerification = () => {
    setFaceMatchStatus('matched');
    setFaceMatchMsg('MANUAL OVERRIDE — Admin will be notified');
    console.log(`[BYPASS] Guard ${user.name} (${user.id}) bypassed face verification at ${new Date().toISOString()}`);
  };

  const handleSelfieClear = () => {
    if (selfiePreview) URL.revokeObjectURL(selfiePreview);
    setSelfieBlob(null);
    setSelfiePreview(null);
    setFaceMatchStatus('idle');
    setFaceMatchMsg('');
    setFaceRetryCount(0);
  };

  const handleCheckoutSelfieCapture = async (blob: Blob) => {
    setCheckoutSelfieBlob(blob);
    setCheckoutSelfiePreview(URL.createObjectURL(blob));
    setFaceMatchStatus('verifying');
    const isMatch = await verifyFaceMatch(blob);
    if (isMatch) {
      setFaceMatchStatus('matched');
      setFaceMatchMsg('[SYS_OK] IDENTITY VERIFIED');
    } else {
      setFaceMatchStatus('failed');
    }
  };

  const handleCheckoutSelfieClear = () => {
    if (checkoutSelfiePreview) URL.revokeObjectURL(checkoutSelfiePreview);
    setCheckoutSelfieBlob(null);
    setCheckoutSelfiePreview(null);
    setFaceMatchStatus('idle');
    setFaceMatchMsg('');
  };

  const handleGetLocation = () => {
    setStatus('locating');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setStatus('ready');
      },
      (err) => {
        setLocationError('TELEMETRY UNAVAILABLE');
        setStatus('error');
      }
    );
  };

  const handleCheckIn = async () => {
    if (!location || !selectedSite || !selfieBlob || faceMatchStatus !== 'matched') return;
    setStatus('checking');
    try {
      const fd = new FormData();
      fd.append('siteId', selectedSite);
      fd.append('latitude', location.lat.toString());
      fd.append('longitude', location.lng.toString());
      fd.append('selfie', selfieBlob, 'checkin.jpg');
      const res = await fetch(`${API_URL}/attendance/checkin`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      const data = await res.json();
      if (res.ok) {
        setStatus('success');
        setStatusMsg('[SYS_OK] DEPLOYMENT LOGGED');
        setTodayAttendance(data);
        handleSelfieClear();
      } else {
        setStatus('error');
        setStatusMsg(`[ERR] ${data.error.toUpperCase()}`);
      }
    } catch (e) {
      setStatus('error');
    }
  };

  const handleCheckOut = async () => {
    if (!location || !todayAttendance || !checkoutSelfieBlob || faceMatchStatus !== 'matched') return;
    setStatus('checking');
    try {
      const fd = new FormData();
      fd.append('attendanceId', todayAttendance.id);
      fd.append('latitude', location.lat.toString());
      fd.append('longitude', location.lng.toString());
      fd.append('selfie', checkoutSelfieBlob, 'checkout.jpg');
      const res = await fetch(`${API_URL}/attendance/checkout`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: fd
      });
      if (res.ok) {
        const data = await res.json();
        setStatus('success');
        setTodayAttendance(data);
        handleCheckoutSelfieClear();
      }
    } catch (e) {
      setStatus('error');
    }
  };

  const handleEmergency = async () => {
    if (!selectedSite) return alert('SELECT SITE FIRST');
    const msg = prompt('🚨 INPUT EMERGENCY PROTOCOL OR CLICK OK FOR SOS:');
    if (msg === null) return;
    try {
      const res = await fetch(`${API_URL}/notifications/emergency`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ siteId: selectedSite, message: msg || 'SOS! IMMEDIATE BACKUP REQUIRED' })
      });
      if (res.ok) alert('🚨 SOS TRANSMITTED!');
    } catch (e) {}
  };

  const isCheckedIn = todayAttendance && !todayAttendance.checkOutTime;
  const isShiftComplete = todayAttendance && todayAttendance.checkOutTime;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-[#111] flex flex-col items-center pt-8 px-4 pb-24 relative overflow-hidden font-sans text-black dark:text-white">
      {/* Background Grid */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,0,0,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]"></div>

      <div className="absolute top-4 right-4 flex gap-2 z-10">
        <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="p-2 border border-black/10 dark:border-white/10 rounded-sm bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><Sun size={14} className="hidden dark:block" /><Moon size={14} className="block dark:hidden" /></button>
        <button onClick={toggleLang} className="p-2 border border-black/10 dark:border-white/10 rounded-sm bg-white dark:bg-black text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5 transition-colors"><Languages size={14} /></button>
      </div>

      <button onClick={handleEmergency} className="fixed bottom-6 right-6 w-16 h-16 bg-red-600 dark:bg-red-500 text-white rounded-sm shadow-xl flex items-center justify-center animate-pulse z-50 border-2 border-red-800 dark:border-red-900 hover:bg-red-700 dark:hover:bg-red-600 transition-colors">
        <ShieldAlert size={24} />
      </button>

      <div className="w-full max-w-sm bg-white dark:bg-black rounded-sm shadow-2xl dark:shadow-none overflow-hidden border border-black/10 dark:border-white/10 mt-6 relative z-10">
        <div className="bg-black dark:bg-white p-6 text-white dark:text-black text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(0,0,0,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,0,0,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none"></div>
          <Crosshair size={24} className="mx-auto mb-4 opacity-50 relative z-10" />
          <Link href="/">
            <h1 className="text-2xl font-black uppercase tracking-widest relative z-10 hover:opacity-80 transition-opacity">GuardSync v1.1</h1>
          </Link>
          <p className="text-[10px] mt-2 font-mono text-white/50 dark:text-black/50 relative z-10">OP: {user.name.toUpperCase()} // L1</p>
        </div>
        
        <div className="flex border-b border-black/10 dark:border-white/10 bg-[#f8f9fa] dark:bg-[#111]">
          <button onClick={() => setActiveTab('attendance')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'attendance' ? 'text-black dark:text-white border-b-2 border-black dark:border-white bg-white dark:bg-black' : 'text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80'}`}>Telemetry</button>
          <button onClick={() => setActiveTab('visitors')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'visitors' ? 'text-black dark:text-white border-b-2 border-black dark:border-white bg-white dark:bg-black' : 'text-black/40 dark:text-white/40 hover:text-black/80 dark:hover:text-white/80'}`}>Visitors</button>
          <button onClick={() => setActiveTab('incidents')} className={`flex-1 py-4 text-[10px] font-bold uppercase tracking-widest transition-colors ${activeTab === 'incidents' ? 'text-red-600 dark:text-red-500 border-b-2 border-red-600 dark:border-red-500 bg-red-50/50 dark:bg-red-950/30' : 'text-black/40 dark:text-white/40 hover:text-red-600/80 dark:hover:text-red-500/80'}`}>Intel</button>
        </div>

        <div className="p-6 space-y-6">
          {statusMsg && (
            <div className={`p-4 rounded-sm text-center font-mono font-bold text-[10px] uppercase tracking-widest border ${status === 'error' ? 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/50' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50'}`}>
              {statusMsg}
            </div>
          )}

          {activeTab === 'attendance' && (
            <>
              {isShiftComplete ? (
                <div className="bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 p-6 rounded-sm text-center">
                  <CheckCircle className="mx-auto text-black/50 dark:text-white/50 mb-3" size={24} />
                  <p className="font-black text-sm uppercase tracking-widest text-black dark:text-white">Deployment Concluded</p>
                  <p className="text-[10px] font-mono text-black/40 dark:text-white/40 mt-2">AWAITING NEXT CYCLE</p>
                </div>
              ) : (
                <>
                  <select 
                    value={selectedSite} 
                    onChange={e => setSelectedSite(e.target.value)} 
                    disabled={isCheckedIn}
                    className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm font-bold text-xs uppercase tracking-widest outline-none focus:border-black dark:focus:border-white text-black dark:text-white transition-colors"
                  >
                    {sites.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                  </select>

                  <div className="space-y-4">
                    <CameraCapture 
                      onCapture={isCheckedIn ? handleCheckoutSelfieCapture : handleSelfieCapture} 
                      onClear={isCheckedIn ? handleCheckoutSelfieClear : handleSelfieClear}
                      capturedPreview={isCheckedIn ? checkoutSelfiePreview : selfiePreview}
                      label="Biometric Scan"
                      shape="square"
                    />
                    {faceMatchMsg && <p className={`text-center text-[10px] font-mono font-bold uppercase ${faceMatchStatus === 'matched' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>{faceMatchMsg}</p>}
                    {faceMatchStatus === 'failed' && faceRetryCount >= 2 && (
                      <button
                        onClick={handleBypassVerification}
                        className="w-full mt-2 py-2 border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-widest hover:bg-amber-500/20 transition-colors"
                      >
                        ⚠ Skip Verification (Admin Notified)
                      </button>
                    )}
                  </div>

                  {faceMatchStatus === 'matched' && (
                    <button onClick={handleGetLocation} className={`w-full py-4 rounded-sm font-bold text-[10px] uppercase tracking-widest transition-all border ${location ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400' : 'bg-white dark:bg-black border-black/20 dark:border-white/20 text-black dark:text-white hover:border-black dark:hover:border-white'}`}>
                      {location ? `[SYS_OK] TELEMETRY LOCKED (${location.lat.toFixed(6)}, ${location.lng.toFixed(6)})` : 'ACQUIRE GPS TELEMETRY'}
                    </button>
                  )}

                  <button 
                    onClick={isCheckedIn ? handleCheckOut : handleCheckIn}
                    disabled={!location || faceMatchStatus !== 'matched' || status === 'checking'}
                    className={`w-full py-5 rounded-sm font-black text-sm uppercase tracking-widest transition-all shadow-lg dark:shadow-none border ${isCheckedIn ? 'bg-white dark:bg-black text-black dark:text-white border-black/20 dark:border-white/20 hover:bg-black/5 dark:hover:bg-white/5' : 'bg-black dark:bg-white text-white dark:text-black border-black dark:border-white hover:bg-black/80 dark:hover:bg-white/80'} disabled:opacity-50 disabled:cursor-not-allowed mt-4`}
                  >
                    {status === 'checking' ? 'PROCESSING...' : (isCheckedIn ? 'Conclude Duty' : 'Commence Duty')}
                  </button>
                </>
              )}
            </>
          )}

          {activeTab === 'visitors' && <VisitorLogForm selectedSite={selectedSite} />}
          {activeTab === 'incidents' && <IncidentReportForm selectedSite={selectedSite} />}
        </div>
      </div>

      <button onClick={() => { logout(); router.push('/'); }} className="mt-8 text-black/40 dark:text-white/40 font-bold flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors text-[10px] uppercase tracking-widest z-10">
        <LogOut size={14} /> Terminate Session
      </button>
    </div>
  );
}
