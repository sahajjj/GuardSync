'use client';
import { useState, useEffect } from 'react';
import { useAuthStore } from '../../../store/authStore';
import { API_URL } from '../../../lib/constants';
import { UserPlus, Phone, Search, X, Pencil, Trash2 } from 'lucide-react';

export default function ClientsManagement() {
  const { token } = useAuthStore();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingClient, setEditingClient] = useState<any>(null);
  const [search, setSearch] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({ name: '', phone: '' });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/users`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const users = await res.json();
        setClients(users.filter((u: any) => u.role === 'CLIENT'));
      }
    } catch (e) {
      setError('Failed to load clients');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if(token) fetchClients(); }, [token]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData({ name: '', phone: '' });
    setShowModal(true);
    setError('');
  };

  const openEditModal = (client: any) => {
    setEditingClient(client);
    setFormData({ name: client.name, phone: client.phone });
    setShowModal(true);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.phone.length !== 10) {
      setError('Identifier must be exactly 10 digits');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        // Update existing client
        const res = await fetch(`${API_URL}/auth/users/${editingClient.id}`, {
          method: 'PUT',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            name: formData.name.trim(), 
            phone: formData.phone.trim()
          })
        });

        if (res.ok) {
          setSuccess(`[SYS_OK] Client "${formData.name.trim()}" updated successfully.`);
          setFormData({ name: '', phone: '' });
          setShowModal(false);
          setEditingClient(null);
          fetchClients();
          setTimeout(() => setSuccess(''), 4000);
        } else {
          const d = await res.json();
          setError(d.error || 'Update failed');
        }
      } else {
        // Create new client
        const res = await fetch(`${API_URL}/auth/register`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': `Bearer ${token}` 
          },
          body: JSON.stringify({ 
            name: formData.name.trim(), 
            phone: formData.phone.trim(), 
            role: 'CLIENT' 
          })
        });

        if (res.ok) {
          setSuccess(`[SYS_OK] Client Entity ${formData.name.trim()} Provisioned`);
          setFormData({ name: '', phone: '' });
          setShowModal(false);
          fetchClients();
          setTimeout(() => setSuccess(''), 4000);
        } else {
          const d = await res.json();
          setError(d.error || 'Provisioning sequence failed');
        }
      }
    } catch (e) {
      setError('Network Disconnected');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (client: any) => {
    if (!confirm(`⚠️ DELETE CLIENT "${client.name}"?\n\nThis will permanently remove this client entity and unlink all associated sites. This action cannot be undone.`)) return;

    try {
      const res = await fetch(`${API_URL}/auth/users/${client.id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        setSuccess(`[SYS_OK] Client "${client.name}" terminated.`);
        setTimeout(() => setSuccess(''), 4000);
        fetchClients();
      } else {
        setError('Failed to delete client');
      }
    } catch (e) {
      setError('Network error.');
    }
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    c.phone.includes(search)
  );

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-black/10 dark:border-white/10 pb-8">
        <div>
          <h1 className="text-3xl font-black uppercase tracking-tight text-black dark:text-white">Client <span className="text-black/30 dark:text-white/30">Entities</span></h1>
          <p className="text-[10px] text-black/50 dark:text-white/50 font-bold uppercase tracking-widest mt-2">Manage external operational stakeholders</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-sm hover:bg-black/80 dark:hover:bg-white/80 hover:-translate-y-0.5 shadow-lg shadow-black/10 dark:shadow-none transition-all font-bold text-xs uppercase tracking-widest"
        >
          + Provision Client
        </button>
      </div>

      {success && (
        <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 rounded-sm text-xs font-mono font-bold uppercase tracking-widest animate-in fade-in">
          {success}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-black/40 dark:text-white/40" size={18} />
        <input 
          type="text" 
          placeholder="QUERY BY DESIGNATION OR IDENTIFIER..." 
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-12 pr-4 py-4 bg-white dark:bg-black border border-black/10 dark:border-white/10 rounded-sm text-xs font-bold uppercase tracking-widest text-black dark:text-white focus:ring-0 focus:border-black dark:focus:border-white outline-none shadow-sm transition-colors placeholder-black/20 dark:placeholder-white/20"
        />
      </div>

      {/* Table */}
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
                <th className="px-6 py-4">Client Designation</th>
                <th className="px-6 py-4">Identifier / Telecom</th>
                <th className="px-6 py-4 hidden md:table-cell">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/5 dark:divide-white/5">
              {filteredClients.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-16 text-center text-[10px] font-bold uppercase tracking-widest text-black/40 dark:text-white/40">
                    No client entities match query.
                  </td>
                </tr>
              ) : (
                filteredClients.map(c => (
                  <tr key={c.id} className="hover:bg-[#f8f9fa] dark:hover:bg-[#111] transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-sm bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 text-black dark:text-white flex items-center justify-center font-bold text-xs">
                          {c.name.charAt(0)}
                        </div>
                        <p className="font-bold text-sm text-black dark:text-white uppercase">{c.name}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-black/70 dark:text-white/70">
                      {c.phone}
                    </td>
                    <td className="px-6 py-4 hidden md:table-cell">
                      <span className="px-2 py-1 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest rounded-sm">
                        Cleared
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => openEditModal(c)} 
                          className="p-2 rounded-sm border border-black/10 dark:border-white/10 hover:bg-black/5 dark:hover:bg-white/5 text-black/60 dark:text-white/60 hover:text-black dark:hover:text-white transition-colors"
                          title="Edit Client"
                        >
                          <Pencil size={14} />
                        </button>
                        <button 
                          onClick={() => handleDelete(c)} 
                          className="p-2 rounded-sm border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-950/30 text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors"
                          title="Delete Client"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white dark:bg-black p-8 rounded-sm shadow-2xl w-full max-w-md border border-black/10 dark:border-white/10 relative" onClick={e => e.stopPropagation()}>
            <div className={`absolute top-0 left-0 w-full h-1 ${editingClient ? 'bg-amber-500' : 'bg-black dark:bg-white'}`}></div>
            
            <h2 className="text-2xl font-black uppercase tracking-tight mb-2 text-black dark:text-white">{editingClient ? 'Modify Client' : 'Provision Client'}</h2>
            <p className="text-[10px] text-black/50 dark:text-white/50 mb-8 font-bold uppercase tracking-widest">{editingClient ? 'Update client entity parameters' : 'Establish access for external entity'}</p>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 rounded-sm text-xs font-mono font-bold uppercase">
                <span className="font-black mr-2">ERR:</span> {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Legal Designation</label>
                <input 
                  required 
                  placeholder="ACME CORPORATION" 
                  className="w-full p-4 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-medium uppercase text-black dark:text-white transition-colors placeholder-black/20 dark:placeholder-white/20" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-black/60 dark:text-white/60 mb-2">Telecom Identifier <span className="font-mono text-black/30 dark:text-white/30 ml-1">(10 DIGITS)</span></label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-black/30 dark:text-white/30" />
                  <input 
                    required 
                    type="tel" 
                    maxLength={10} 
                    placeholder="9876543210" 
                    className="w-full p-4 pl-12 bg-white dark:bg-black border border-black/20 dark:border-white/20 rounded-sm focus:ring-0 focus:border-black dark:focus:border-white outline-none font-mono tracking-wider text-black dark:text-white transition-colors placeholder-black/20 dark:placeholder-white/20" 
                    value={formData.phone} 
                    onChange={e => setFormData({...formData, phone: e.target.value.replace(/\D/g, '')})} 
                  />
                </div>
              </div>

              <div className="flex justify-end gap-4 mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                <button type="button" onClick={() => { setShowModal(false); setEditingClient(null); }} className="px-6 py-3 text-black/50 dark:text-white/50 font-bold uppercase tracking-widest text-[10px] hover:text-black dark:hover:text-white transition-colors">Abort</button>
                <button type="submit" disabled={submitting} className={`px-6 py-3 rounded-sm transition-all shadow-lg shadow-black/10 dark:shadow-none font-bold uppercase tracking-widest text-[10px] disabled:opacity-50 ${editingClient ? 'bg-amber-500 hover:bg-amber-600 text-white' : 'bg-black dark:bg-white text-white dark:text-black hover:bg-black/80 dark:hover:bg-white/80'}`}>
                  {submitting ? 'Executing...' : editingClient ? 'Update Client' : 'Provision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
