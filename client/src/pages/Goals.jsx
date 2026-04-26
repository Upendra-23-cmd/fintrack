import { useEffect, useState } from 'react';
import api from '../api/axios';
import toast from 'react-hot-toast';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const COLORS = ['#0F6E56','#185FA5','#7C3ABE','#854F0B','#BE3A6E','#0E7490'];
const EMPTY  = { name: '', targetAmount: '', currentAmount: '0', deadline: '', color: '#0F6E56' };

export default function Goals() {
  const [goals, setGoals]         = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY);
  const [loading, setLoading]     = useState(false);

  const fetchGoals = () => api.get('/goals').then(r => setGoals(r.data));
  useEffect(() => { fetchGoals(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/goals', {
        ...form,
        targetAmount: parseFloat(form.targetAmount),
        currentAmount: parseFloat(form.currentAmount) || 0,
      });
      toast.success('Goal created!');
      setShowModal(false);
      setForm(EMPTY);
      fetchGoals();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this goal?')) return;
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      fetchGoals();
    } catch { toast.error('Failed'); }
  };

  const handleContribute = async (goal) => {
    const amt = parseFloat(prompt(`Add amount to "${goal.name}":`));
    if (!amt || isNaN(amt)) return;
    try {
      const newAmt = Math.min(parseFloat(goal.currentAmount) + amt, parseFloat(goal.targetAmount));
      await api.put(`/goals/${goal.id}`, { currentAmount: newAmt, isCompleted: newAmt >= parseFloat(goal.targetAmount) });
      toast.success(`Added ${fmt(amt)} to goal!`);
      fetchGoals();
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Savings Goals</h1>
          <p className="text-slate-500 text-sm mt-0.5">{goals.filter(g => !g.isCompleted).length} active goals</p>
        </div>
        <button onClick={() => setShowModal(true)} className="btn-primary">+ New Goal</button>
      </div>

      <div className="space-y-4">
        {goals.map((g) => {
          const pct = Math.min((parseFloat(g.currentAmount) / parseFloat(g.targetAmount)) * 100, 100);
          const remaining = parseFloat(g.targetAmount) - parseFloat(g.currentAmount);
          return (
            <div key={g.id} className={`card p-5 ${g.isCompleted ? 'border-brand-700/40' : ''}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  {g.isCompleted && <span className="text-xl">🎉</span>}
                  <div>
                    <h3 className="font-semibold text-slate-100">{g.name}</h3>
                    {g.deadline && (
                      <p className="text-xs text-slate-500 mt-0.5">
                        Deadline: {new Date(g.deadline).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!g.isCompleted && (
                    <button onClick={() => handleContribute(g)}
                      className="text-xs text-brand-400 hover:text-brand-300 border border-brand-700/40 px-2.5 py-1 rounded-lg transition-colors">
                      + Contribute
                    </button>
                  )}
                  <button onClick={() => handleDelete(g.id)}
                    className="text-slate-600 hover:text-red-400 transition-colors text-xs px-1">✕</button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-3">
                <div className="flex justify-between text-sm mb-2">
                  <span className="font-mono text-slate-200">{fmt(g.currentAmount)}</span>
                  <span className="text-slate-500">of {fmt(g.targetAmount)}</span>
                </div>
                <div className="h-2.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${pct}%`, background: g.color || '#0F6E56' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {g.isCompleted ? '✅ Goal reached!' : `${fmt(remaining)} remaining`}
                </span>
                <span className="font-mono font-medium" style={{ color: g.color || '#0F6E56' }}>
                  {pct.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}
        {goals.length === 0 && (
          <div className="card p-12 text-center">
            <p className="text-4xl mb-3">🎯</p>
            <p className="text-slate-400 font-medium">No goals yet</p>
            <p className="text-slate-600 text-sm mt-1">Set your first savings goal to start tracking</p>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="card p-6 w-full max-w-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold">New Savings Goal</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300 text-xl">✕</button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Goal Name</label>
                <input type="text" required className="input" placeholder="e.g. Emergency Fund"
                  value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target (₹)</label>
                  <input type="number" min="1" required className="input" placeholder="100000"
                    value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} />
                </div>
                <div>
                  <label className="label">Saved so far (₹)</label>
                  <input type="number" min="0" className="input" placeholder="0"
                    value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="label">Deadline (optional)</label>
                <input type="date" className="input" value={form.deadline}
                  onChange={(e) => setForm({ ...form, deadline: e.target.value })} />
              </div>
              <div>
                <label className="label">Color</label>
                <div className="flex gap-2 flex-wrap">
                  {COLORS.map((c) => (
                    <button type="button" key={c} onClick={() => setForm({ ...form, color: c })}
                      className="w-7 h-7 rounded-full border-2 transition-all"
                      style={{ background: c, borderColor: form.color === c ? '#fff' : 'transparent' }} />
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={loading} className="btn-primary flex-1">
                  {loading ? 'Creating…' : 'Create Goal'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
