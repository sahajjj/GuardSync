'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import CameraCapture from '../../components/CameraCapture';
import { API_URL, API_BASE_URL } from '../../../lib/constants';
import { Trash2, AlertTriangle, X } from 'lucide-react';

export default function GuardsPage() {
  const { token } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', phone: '', role: 'GUARD' });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Delete state
  const [deleteTarget, setDeleteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Camera state
  const [photoBlob, setPhotoBlob] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  // Photo lightbox state
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users`);
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        setError('Failed to load personnel list');
      }
    } catch (e) {
      setError('Cannot connect to server. Make sure backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handlePhotoCapture = (blob: Blob) => {
    setPhotoBlob(blob);
    setPhotoPreview(URL.createObjectURL(blob));
  };

  const handlePhotoClear = () => {
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoBlob(null);
    setPhotoPreview(null);
  };

  const validateForm = (): string | null => {
    if (!formData.name.trim() || formData.name.trim().length < 2) {
      return 'Name must be at least 2 characters';
    }
    if (!/^\d{10}$/.test(formData.phone.trim())) {
      return 'Phone number must be exactly 10 digits';
    }
    if (users.some(u => u.phone === formData.phone.trim())) {
      return 'This phone number is already registered';
    }
    if (!photoBlob) {
      return 'Biometric profile photo is required.';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append('name', formData.name.trim());
      fd.append('phone', formData.phone.trim());
      fd.append('role', formData.role);
      if (photoBlob) {
        fd.append('photo', photoBlob, 'profile.jpg');
      }

      const res = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        body: fd,
      });
      if (res.ok) {
        setShowModal(false);
        setFormData({ name: '', phone: '', role: 'GUARD' });
        handlePhotoClear();
        setError('');
        setSuccess(`[SYS_OK] ${formData.name.trim()} provisioned as ${formData.role}`);
        setTimeout(() => setSuccess(''), 4000);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to register user.');
      }
    } catch (e) {
      setError('Network error. Is the backend server running?');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setError('');
    handlePhotoClear();
  };

  const handleDeleteUser = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API_URL}/auth/users/${deleteTarget.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSuccess(`[SYS_DEL] ${deleteTarget.name} record eradicated.`);
        setTimeout(() => setSuccess(''), 4000);
        setDeleteTarget(null);
        fetchUsers();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to delete user');
        setDeleteTarget(null);
      }
    } catch (e) {
      setError('Network error while deleting user');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 dark:border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Personnel <span className="text-black/30 dark:text-white/30">Registry</span></h1>
          <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-2">{users.length} Active Records</p>
        </div>
        <button onClick={() => { setShowModal(true); setError(''); }} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-sm hover:bg-black/80 dark:hover:bg-white/80 hover:-translate-y-0.5 shadow-lg shadow-black/10 dark:shadow-none transition-all font-bold text-xs uppercase tracking-widest">
          + Provision Personnel
        </button>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-sm text-xs font-mono font-bold uppercase tracking-widest animate-in fade-in">
          {success}
        </div>
      )}

      <div className="bg-white dark:bg-black rounded-sm shadow-xl shadow-black/5 dark:shadow-none border border-black/10 dark:border-white/10 overflow-hidden">
        {loading ? (
          <div className="px-6 py-20 text-center">
            <div className="animate-spin inline-block w-8 h-8 border-4 border-black dark:border-white border-t-transparent rounded-full mb-4"></div>
            <p className="text-xs font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Querying Database...</p>
          </div>
        ) : (
          <table className="w-full text-left text-sm text-black dark:text-white">
            <thead className="bg-[#f8f9fa] dark:bg-[#111] border-b border-black/10 dark:border-white/10 text-[10px] uppercase tracking-widest text-black/50 dark:text-white/50 font-bold">
              <tr>
                <th className="px-6 py-4">Biometric</th>
                <th className="px-6 py-4">Legal Name</th>
                <th className="px-6 py-4">Identifier</th>
                <th className="px-6 py-4">Clearance Level</th>
                <th className="px-6 py-4">Provisioned</th>
                <th className="px-6 py-4 text-center">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {users.length === 0 ? (
                <tr><td colSpan={6} className="px-6 py-16 text-center text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">Registry Empty. Provision initial personnel.</td></tr>
              ) : (
                users.map(u => (
                  <tr key={u.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#111] transition-colors group">
                    <td className="px-6 py-4">
                      {u.photoUrl ? (
                        <img
                          src={`${API_BASE_URL}${u.photoUrl}`}
                          alt={u.name}
                          className="w-10 h-10 rounded-sm object-cover border border-black/10 dark:border-white/10 cursor-pointer group-hover:border-black dark:group-hover:border-white transition-colors"
                          onClick={() => setLightboxUrl(`${API_BASE_URL}${u.photoUrl}`)}
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white font-bold text-sm">
                          {u.name?.charAt(0) || '?'}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-sm">{u.name}</td>
                    <td className="px-6 py-4 font-mono text-xs">{u.phone}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm text-[10px] font-mono font-bold tracking-widest text-black dark:text-white">
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-black/60 dark:text-white/60">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => setDeleteTarget(u)}
                        className="p-2 text-black/30 dark:text-white/30 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 border border-transparent hover:border-red-100 dark:hover:border-red-900/50 rounded-sm transition-all"
                        title={`Eradicate ${u.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Photo Lightbox */}
      {lightboxUrl && (
        <div className="fixed inset-0 bg-white/90 dark:bg-black/90 backdrop-blur-md flex items-center justify-center z-50 p-4" onClick={() => setLightboxUrl(null)}>
          <div className="relative max-w-lg w-full scale-in-center p-2 bg-white dark:bg-black border border-black/10 dark:border-white/10 shadow-2xl" onClick={e => e.stopPropagation()}>
            <img src={lightboxUrl} alt="Biometric Profile" className="w-full object-cover aspect-square bg-[#f8f9fa] dark:bg-[#111]" />
            <div className="p-4 border-t border-black/10 dark:border-white/10 text-center">
              <p className="text-[10px] font-mono font-bold text-black/50 dark:text-white/50 uppercase tracking-widest">Biometric Database Record</p>
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

      {/* Registration Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleCloseModal}>
          <div className="bg-white dark:bg-black p-8 rounded-sm shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto border border-black/10 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-black dark:bg-white"></div>
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">Provision Personnel</h2>
            <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mb-8">Add new record to central database</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-sm text-xs font-mono font-bold uppercase">
                <span className="font-black mr-2">ERR:</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="pb-6 border-b border-black/10 dark:border-white/10">
                <CameraCapture
                  onCapture={handlePhotoCapture}
                  onClear={handlePhotoClear}
                  capturedPreview={photoPreview}
                  label="Biometric Verification Data"
                  shape="square" // Override shape if supported, else circle
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Legal Name</label>
                <input
                  required
                  minLength={2}
                  placeholder="JOHN DOE"
                  className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-medium placeholder-black/20 dark:placeholder-white/20 transition-colors"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Identifier <span className="text-black/30 dark:text-white/30 font-mono ml-1">(10 DIGITS)</span></label>
                <input
                  required
                  type="tel"
                  pattern="\d{10}"
                  maxLength={10}
                  placeholder="9876543210"
                  className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-mono tracking-wider placeholder-black/20 dark:placeholder-white/20 transition-colors"
                  value={formData.phone}
                  onChange={e => {
                    const val = e.target.value.replace(/\D/g, '');
                    setFormData({...formData, phone: val});
                  }}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Clearance Level</label>
                <select 
                  className="w-full p-4 border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none bg-white dark:bg-black text-black dark:text-white font-mono text-sm tracking-widest uppercase transition-colors" 
                  value={formData.role} 
                  onChange={e => setFormData({...formData, role: e.target.value})}
                >
                  <option value="GUARD">L1 Guard</option>
                  <option value="SUPERVISOR">L2 Supervisor</option>
                  <option value="MANAGER">L3 Manager</option>
                  <option value="CLIENT">L4 Client</option>
                  <option value="ADMIN">L5 Admin</option>
                </select>
              </div>
              
              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <button type="button" onClick={handleCloseModal} className="px-6 py-3 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors">Abort</button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-black dark:bg-white text-white dark:text-black rounded-sm hover:bg-black/80 dark:hover:bg-white/80 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-bold uppercase text-[10px] tracking-widest shadow-lg shadow-black/10 dark:shadow-none"
                >
                  {submitting ? 'Executing...' : 'Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !deleting && setDeleteTarget(null)}>
          <div className="bg-white dark:bg-black p-8 rounded-sm shadow-2xl w-full max-w-sm border border-black/10 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
            <div className="absolute top-0 left-0 w-full h-1 bg-red-600"></div>
            
            <div className="flex items-start gap-4 mb-6">
              <div className="mt-1">
                <AlertTriangle size={24} className="text-red-600 dark:text-red-500" />
              </div>
              <div>
                <h3 className="text-xl font-black uppercase tracking-tight text-black dark:text-white">Confirm Eradication</h3>
                <p className="text-[10px] font-bold text-red-600 dark:text-red-500 uppercase tracking-widest mt-1">Irreversible Action</p>
              </div>
            </div>

            <div className="p-4 bg-[#f8f9fa] dark:bg-[#111] border border-black/10 dark:border-white/10 rounded-sm mb-6">
              <div className="flex items-center gap-4">
                {deleteTarget.photoUrl ? (
                  <img src={`${API_BASE_URL}${deleteTarget.photoUrl}`} alt="" className="w-12 h-12 rounded-sm object-cover border border-black/10 dark:border-white/10" />
                ) : (
                  <div className="w-12 h-12 rounded-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 flex items-center justify-center text-black dark:text-white font-bold text-sm">
                    {deleteTarget.name?.charAt(0) || '?'}
                  </div>
                )}
                <div>
                  <p className="font-bold text-sm text-black dark:text-white">{deleteTarget.name}</p>
                  <p className="text-[10px] text-black/50 dark:text-white/50 font-mono mt-1">{deleteTarget.phone}</p>
                </div>
              </div>
            </div>

            <p className="text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-8 leading-relaxed">
              All linked telemetry, attendance, and deployment logs for <span className="text-black dark:text-white">{deleteTarget.name}</span> will be permanently purged from the system.
            </p>

            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-6 py-3 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white font-bold uppercase text-[10px] tracking-widest transition-colors"
              >
                Abort
              </button>
              <button
                onClick={handleDeleteUser}
                disabled={deleting}
                className="px-6 py-3 bg-red-600 text-white rounded-sm hover:bg-red-700 transition-all shadow-lg shadow-red-600/20 dark:shadow-none font-bold uppercase text-[10px] tracking-widest disabled:opacity-50"
              >
                {deleting ? 'Executing...' : 'Eradicate'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
