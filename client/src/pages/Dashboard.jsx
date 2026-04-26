import { useEffect, useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from 'recharts';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fmt = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const CATEGORY_COLORS = {
  food: '#0F6E56', housing: '#185FA5', transport: '#854F0B',
  utilities: '#993C1D', shopping: '#7C3ABE', health: '#0E7490',
  entertainment: '#BE3A6E', education: '#3A7CBE', other: '#5F5E5A',
};

export default function Dashboard() {
  const { user } = useAuth();
  const [summary, setSummary]           = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading]           = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/summary'),
      api.get('/transactions?limit=6'),
    ])
      .then(([s, t]) => {
        setSummary(s.data);
        setTransactions(t.data.transactions);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-full min-h-screen">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const stats = [
    { label: 'Net Worth',      value: fmt(summary?.netWorth || 0),        change: null,    color: 'text-brand-400' },
    { label: 'Monthly Income', value: fmt(summary?.monthlyIncome || 0),   change: '+',     color: 'text-emerald-400' },
    { label: 'Monthly Spend',  value: fmt(summary?.monthlyExpense || 0),  change: '-',     color: 'text-red-400' },
    { label: 'Savings Rate',   value: `${(summary?.savingsRate || 0).toFixed(1)}%`, change: null, color: 'text-sky-400' },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6 fade-up">
        <h1 className="text-2xl font-semibold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-400">{user?.name?.split(' ')[0]}</span>
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, color }, i) => (
          <div key={label} className={`stat-card fade-up-${i + 1}`}>
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">{label}</p>
            <p className={`text-2xl font-semibold font-mono ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Trend chart */}
        <div className="card p-5 lg:col-span-2 fade-up-2">
          <h2 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">6-Month Trend</h2>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={summary?.trend || []} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="incGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#0F6E56" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#0F6E56" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="month" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#64748b', fontSize: 10 }} axisLine={false} tickLine={false}
                tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`} width={45} />
              <Tooltip
                contentStyle={{ background: '#0f172a', border: '1px solid #334155', borderRadius: '10px', fontSize: '12px' }}
                formatter={(v) => fmt(v)}
              />
              <Area type="monotone" dataKey="income"  stroke="#0F6E56" fill="url(#incGrad)" strokeWidth={2} dot={false} />
              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="url(#expGrad)" strokeWidth={2} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex gap-4 mt-2 justify-end">
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-brand-600 inline-block" /> Income
            </span>
            <span className="flex items-center gap-1.5 text-xs text-slate-400">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" /> Expense
            </span>
          </div>
        </div>

        {/* Category breakdown */}
        <div className="card p-5 fade-up-3">
          <h2 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">Spending by Category</h2>
          <div className="space-y-3">
            {(summary?.categoryBreakdown || []).slice(0, 6).map(({ category, amount }) => {
              const max = summary.categoryBreakdown[0]?.amount || 1;
              const pct = (amount / max) * 100;
              return (
                <div key={category}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-300 capitalize">{category}</span>
                    <span className="text-slate-400 font-mono">{fmt(amount)}</span>
                  </div>
                  <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: CATEGORY_COLORS[category] || '#5F5E5A' }}
                    />
                  </div>
                </div>
              );
            })}
            {!summary?.categoryBreakdown?.length && (
              <p className="text-slate-600 text-sm text-center py-8">No expense data yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent transactions */}
      <div className="card p-5 fade-up-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Recent Transactions</h2>
          <a href="/transactions" className="text-xs text-brand-400 hover:text-brand-300">View all →</a>
        </div>
        {transactions.length === 0 ? (
          <p className="text-slate-600 text-sm text-center py-8">No transactions yet. Add your first one!</p>
        ) : (
          <div className="divide-y divide-slate-800/60">
            {transactions.map((t) => (
              <div key={t.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-semibold"
                    style={{
                      background: `${CATEGORY_COLORS[t.category] || '#5F5E5A'}22`,
                      color: CATEGORY_COLORS[t.category] || '#94a3b8',
                    }}
                  >
                    {t.description.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-200">{t.description}</p>
                    <p className="text-xs text-slate-500">
                      {t.Account?.name} · {new Date(t.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </div>
                <span className={`text-sm font-mono font-medium ${t.type === 'income' ? 'text-emerald-400' : 'text-red-400'}`}>
                  {t.type === 'income' ? '+' : '-'}{fmt(t.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
