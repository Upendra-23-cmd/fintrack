import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const TYPE_COLORS = {
  savings: '#0F6E56', current: '#185FA5', investment: '#7C3ABE',
  wallet: '#854F0B', credit: '#993C1D',
};

const EMPTY = { name: '', type: 'savings', balance: '', institution: '', color: '#185FA5' };

export default function Accounts() {
  const [accounts, setAccounts]   = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(false);

  const fetchAccounts = () => api.get('/accounts').then(r => setAccounts(r.data));
  useEffect(() => { fetchAccounts(); }, []);

  const netWorth = accounts.reduce((s, a) => s + parseFloat(a.balance), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/accounts', { ...form, balance: parseFloat(form.balance) });
      toast.success('Account added');
      setShowModal(false);
      setForm(EMPTY);
      fetchAccounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Remove this account?')) return;
    try {
      await api.delete(`/accounts/${id}`);
      toast.success('Account removed');
      fetchAccounts();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Accounts</h1>
          <p className="text-slate-500 text-sm mt-0.5">Net worth: <span className="text-brand-400 font-mono font-medium">{fmt(netWorth)}</span></p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add Account</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((a) => (
          <div key={a.id} className="card p-5 flex flex-col gap-3 group">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                  style={{ background: `${TYPE_COLORS[a.type] || '#5F5E5A'}22`, color: TYPE_COLORS[a.type] || '#94a3b8' }}>
                  {a.type === 'savings' ? '🏦' : a.type === 'investment' ? '📈' : a.type === 'wallet' ? '💳' : a.type === 'credit' ? '💰' : '🏢'}
                </div>
                <div>
                  <p className="font-semibold text-slate-100">{a.name}</p>
                  {a.institution && <p className="text-xs text-slate-500">{a.institution}</p>}
                </div>
              </div>
              <button onClick={() => handleDelete(a.id)}
                className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all text-xs">✕</button>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-0.5">Balance</p>
              <p className={`text-xl font-mono font-semibold ${parseFloat(a.balance) >= 0 ? 'text-slate-100' : 'text-red-400'}`}>
                {fmt(a.balance)}
              </p>
            </div>
            <span className="badge capitalize" style={{ background: `${TYPE_COLORS[a.type] || '#5F5E5A'}22`, color: TYPE_COLORS[a.type] || '#94a3b8' }}>
              {a.type}
            </span>
          </div>
        ))}
        {accounts.length === 0 && (
          <div className="col-span-3 card p-12 text-center">
            <p className="text-slate-600">No accounts yet. Add your first account to get started.</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Add Account</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Account Name</label>
                <input type="text" required className="input" placeholder="e.g. SBI Savings"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    {['savings','current','investment','wallet','credit'].map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label">Opening Balance (₹)</label>
                  <input type="number" step="0.01" required className="input" placeholder="0"
                    value={form.balance} onChange={(e) => setForm({ ...form, balance: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Institution (optional)</label>
                <input type="text" className="input" placeholder="e.g. HDFC Bank"
                  value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} />
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Adding…' : 'Add Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
