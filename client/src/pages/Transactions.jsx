import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORIES = [
  'salary','freelance','investment','food','housing','transport',
  'utilities','shopping','health','entertainment','education','travel','other',
];

const EMPTY = { accountId: '', type: 'expense', amount: '', category: 'food', description: '', date: new Date().toISOString().split('T')[0], notes: '' };

export default function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts]         = useState([]);
  const [pagination, setPagination]     = useState({});
  const [page, setPage]                 = useState(1);
  const [filters, setFilters]           = useState({ type: '', category: '', search: '' });
  const [showModal, setShowModal]       = useState(false);
  const [form, setForm]                 = useState(EMPTY);
  const [loading, setLoading]           = useState(false);
  const [fetching, setFetching]         = useState(true);

  const fetchAll = async () => {
    setFetching(true);
    try {
      const params = new URLSearchParams({ page, limit: 15, ...Object.fromEntries(Object.entries(filters).filter(([,v]) => v)) });
      const [txRes, acRes] = await Promise.all([
        api.get(`/transactions?${params}`),
        api.get('/accounts'),
      ]);
      setTransactions(txRes.data.transactions);
      setPagination(txRes.data.pagination);
      setAccounts(acRes.data);
      if (!form.accountId && acRes.data.length) setForm((f) => ({ ...f, accountId: acRes.data[0].id }));
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => { fetchAll(); }, [page, filters]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.accountId) { toast.error('Select an account first'); return; }
    setLoading(true);
    try {
      await api.post('/transactions', { ...form, amount: parseFloat(form.amount) });
      toast.success('Transaction added');
      setShowModal(false);
      setForm(EMPTY);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add transaction');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this transaction?')) return;
    try {
      await api.delete(`/transactions/${id}`);
      toast.success('Deleted');
      fetchAll();
    } catch {
      toast.error('Delete failed');
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Transactions</h1>
          <p className="text-slate-500 text-sm mt-0.5">{pagination.total || 0} total records</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ Add</button>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="input w-48" placeholder="Search…"
          value={filters.search}
          onChange={(e) => { setFilters({ ...filters, search: e.target.value }); setPage(1); }}
        />
        <select className="select w-36" value={filters.type} onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}>
          <option value="">All types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select className="select w-40" value={filters.category} onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="card overflow-hidden">
        {fetching ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-slate-600 py-16">No transactions found</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="text-left px-5 py-3 font-medium">Description</th>
                <th className="text-left px-4 py-3 font-medium">Category</th>
                <th className="text-left px-4 py-3 font-medium">Account</th>
                <th className="text-left px-4 py-3 font-medium">Date</th>
                <th className="text-right px-5 py-3 font-medium">Amount</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {transactions.map((t) => (
                <tr key={t.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-5 py-3 text-slate-200 font-medium">{t.description}</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-slate-800 text-slate-300 capitalize">{t.category}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-400">{t.Account?.name}</td>
                  <td className="px-4 py-3 text-slate-400 font-mono text-xs">
                    {new Date(t.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className={`px-5 py-3 text-right font-mono font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => handleDelete(t.id)} className="text-slate-600 hover:text-red-400 transition-colors text-xs">✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-ghost text-sm px-3 py-1.5">← Prev</button>
          <span className="text-slate-500 text-sm">Page {page} of {pagination.pages}</span>
          <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="btn-ghost text-sm px-3 py-1.5">Next →</button>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">Add Transaction</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
            </div>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Type</label>
                  <select className="select" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                    <option value="transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="label">Amount (₹)</label>
                  <input type="number" step="0.01" min="0.01" required className="input" placeholder="0.00"
                    value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Description</label>
                <input type="text" required className="input" placeholder="e.g. Grocery run"
                  value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Category</label>
                  <select className="select" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Date</label>
                  <input type="date" required className="input" value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Account</label>
                <select className="select" value={form.accountId} onChange={(e) => setForm({ ...form, accountId: e.target.value })}>
                  {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Adding…' : 'Add Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
