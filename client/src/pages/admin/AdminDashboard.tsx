import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Link } from 'react-router-dom';
import AdminLayout from '../../components/admin/AdminLayout';
import { getStats, getDailyStats, getPayments, getPaymentStats, activatePayment, getAllGenerations, getUsers } from '../../api/admin';
import { PendingPayment, User, Generation } from '../../types';
import { formatDate, formatDateTime } from '../../utils/format';
import Modal from '../../components/common/Modal';

interface Stats {
  totalTeachers: number;
  activeTeachers: number;
  subscribedTeachers: number;
  totalGenerations: number;
  totalGuestGenerations: number;
}

interface PaymentStats {
  totalRevenuePHP: number;
  totalRevenueUSD: number;
  totalActivated: number;
  totalPending: number;
  gcashCount: number;
  stripeCount: number;
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [chartData, setChartData] = useState<{ date: string; generations: number }[]>([]);
  const [activateModal, setActivateModal] = useState<PendingPayment | null>(null);
  const [activateMonths, setActivateMonths] = useState(1);
  const [activating, setActivating] = useState(false);

  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const load = async () => {
    try {
      const [s, ps, p, daily, u, g] = await Promise.all([
        getStats(),
        getPaymentStats(),
        getPayments('pending'),
        getDailyStats(),
        getUsers({ limit: 5, page: 1 }),
        getAllGenerations({ limit: 10, page: 1 }),
      ]);
      setStats(s.data);
      setPaymentStats(ps.data);
      setPayments(p.data.payments);
      setChartData(daily.data.days);
      setRecentUsers(u.data.users);
      setRecentGenerations(g.data.generations);
    } catch {
      toast.error('Failed to load dashboard data');
    }
  };

  useEffect(() => { load(); }, []);

  const handleActivate = async () => {
    if (!activateModal) return;
    setActivating(true);
    try {
      await activatePayment(activateModal._id, activateMonths);
      toast.success('Subscription activated!');
      setActivateModal(null);
      load();
    } catch {
      toast.error('Failed to activate payment');
    } finally {
      setActivating(false);
    }
  };

  return (
    <AdminLayout>
      <h1 className="text-2xl font-bold text-slate-800 mb-6">Dashboard</h1>

      {/* Usage Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
          {[
            { label: 'Total Teachers', value: stats.totalTeachers, color: 'text-blue-700', icon: '👩‍🏫' },
            { label: 'Active', value: stats.activeTeachers, color: 'text-green-600', icon: '✅' },
            { label: 'Subscribed', value: stats.subscribedTeachers, color: 'text-purple-600', icon: '⭐' },
            { label: 'Total Generations', value: stats.totalGenerations, color: 'text-blue-700', icon: '📊' },
            { label: 'Guest Uses', value: stats.totalGuestGenerations, color: 'text-amber-600', icon: '👤' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center justify-between mb-1">
                <span className="text-lg">{s.icon}</span>
              </div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Revenue Cards */}
      {paymentStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-4 text-white">
            <p className="text-xs text-green-200 uppercase tracking-wide mb-1">PHP Revenue</p>
            <p className="text-2xl font-bold">₱{paymentStats.totalRevenuePHP.toLocaleString()}</p>
            <p className="text-xs text-green-200 mt-1">{paymentStats.gcashCount} GCash payments</p>
          </div>
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-4 text-white">
            <p className="text-xs text-blue-200 uppercase tracking-wide mb-1">USD Revenue</p>
            <p className="text-2xl font-bold">${paymentStats.totalRevenueUSD.toLocaleString()}</p>
            <p className="text-xs text-blue-200 mt-1">{paymentStats.stripeCount} Stripe payments</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Activated</p>
            <p className="text-2xl font-bold text-green-600">{paymentStats.totalActivated}</p>
            <p className="text-xs text-slate-400 mt-1">All-time subscriptions</p>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Pending</p>
            <p className="text-2xl font-bold text-amber-600">{paymentStats.totalPending}</p>
            <p className="text-xs text-slate-400 mt-1">Awaiting activation</p>
          </div>
        </div>
      )}

      {/* Charts row */}
      <div className="grid md:grid-cols-3 gap-6 mb-6">
        {/* Line chart */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-700 mb-4">Generations — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
              <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
              <Tooltip />
              <Line type="monotone" dataKey="generations" stroke="#1E40AF" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment method bar */}
        {paymentStats && (
          <div className="bg-white rounded-xl border border-slate-200 p-4">
            <h2 className="font-semibold text-slate-700 mb-4">Payment Methods</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={[
                { name: 'GCash', count: paymentStats.gcashCount, fill: '#16A34A' },
                { name: 'Stripe', count: paymentStats.stripeCount, fill: '#4F46E5' },
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#1E40AF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Pending Payments Alert */}
      {payments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-amber-700 font-semibold text-sm">
              ⚠ {payments.length} payment{payments.length > 1 ? 's' : ''} awaiting activation
            </span>
            <Link to="/admin/payments" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs">
                  <th className="text-left pb-2">Teacher</th>
                  <th className="text-left pb-2">Method</th>
                  <th className="text-left pb-2">Amount</th>
                  <th className="text-left pb-2">Submitted</th>
                  <th className="text-left pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-amber-100">
                    <td className="py-2">
                      <p className="font-medium">{p.name}</p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </td>
                    <td className="py-2">
                      {p.paymentMethod === 'stripe'
                        ? <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-semibold">💳 Stripe</span>
                        : <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-semibold">📱 GCash</span>
                      }
                    </td>
                    <td className="py-2 font-semibold text-slate-800 text-sm">
                      {p.amount != null ? `${p.currency === 'USD' ? '$' : '₱'}${p.amount}` : '—'}
                    </td>
                    <td className="py-2 text-slate-500 text-xs">{formatDate(p.submittedAt)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => { setActivateModal(p); setActivateMonths(p.months || 1); }}
                        className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700 transition"
                      >
                        Activate
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Signups */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">Recent Signups</h2>
            <Link to="/admin/users" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-1">
            {recentUsers.slice(0, 5).map((u) => (
              <div key={u._id} className="flex items-center gap-3 py-2 border-t border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <div className="flex flex-col items-end gap-0.5">
                  {u.isSubscribed && (
                    <span className="text-xs bg-purple-100 text-purple-700 px-1.5 py-0.5 rounded font-medium">Pro</span>
                  )}
                  <span className="text-xs text-slate-400">{u.createdAt ? formatDate(u.createdAt) : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Generations */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-slate-700">Recent Generations</h2>
            <Link to="/admin/generations" className="text-xs text-blue-600 hover:underline">View all →</Link>
          </div>
          <div className="space-y-1">
            {recentGenerations.slice(0, 8).map((g) => {
              const fileUrl = g.fileUrl?.startsWith('http') ? g.fileUrl : `${serverUrl}${g.fileUrl}`;
              const userName = typeof g.userId === 'object' && g.userId !== null
                ? (g.userId as User).name
                : g.guestId ? 'Guest' : 'Unknown';
              return (
                <div key={g._id} className="flex items-center justify-between py-2 border-t border-slate-100 text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-700 truncate">{g.topic}</p>
                    <p className="text-xs text-slate-400">{userName} · {g.gradeLevel}</p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                    <span className="text-xs text-slate-400">{formatDate(g.createdAt)}</span>
                    <a href={fileUrl} download={g.fileName} className="text-green-600 hover:text-green-700 text-base">⬇</a>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Activate Modal */}
      <Modal isOpen={!!activateModal} onClose={() => setActivateModal(null)}>
        {activateModal && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Activate Subscription</h2>
            <p className="text-slate-500 text-sm mb-4">
              For <span className="font-semibold">{activateModal.name}</span> ({activateModal.email})
            </p>
            <div className="flex gap-3 mb-4">
              {[
                { months: 1, label: '1 Month', price: '₱299' },
                { months: 3, label: '3 Months', price: '₱799' },
              ].map((opt) => (
                <button
                  key={opt.months}
                  onClick={() => setActivateMonths(opt.months)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                    activateMonths === opt.months
                      ? 'border-blue-700 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600 hover:border-blue-300'
                  }`}
                >
                  {opt.label}<br/>
                  <span className="text-xs font-normal">{opt.price}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setActivateModal(null)}
                className="flex-1 py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 disabled:opacity-60"
              >
                {activating ? 'Activating...' : 'Activate'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default AdminDashboard;
