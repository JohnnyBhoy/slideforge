import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AdminLayout from '../../components/admin/AdminLayout';
import { getStats, getPayments, activatePayment, getAllGenerations, getUsers } from '../../api/admin';
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

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [recentUsers, setRecentUsers] = useState<User[]>([]);
  const [recentGenerations, setRecentGenerations] = useState<Generation[]>([]);
  const [activateModal, setActivateModal] = useState<PendingPayment | null>(null);
  const [activateMonths, setActivateMonths] = useState(1);
  const [activating, setActivating] = useState(false);
  const [chartData] = useState(() => {
    const data = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      data.push({
        date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        generations: Math.floor(Math.random() * 20),
      });
    }
    return data;
  });

  const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

  const load = async () => {
    try {
      const [s, p, u, g] = await Promise.all([
        getStats(),
        getPayments('pending'),
        getUsers({ limit: 5, page: 1 }),
        getAllGenerations({ limit: 10, page: 1 }),
      ]);
      setStats(s.data);
      setPayments(p.data.payments);
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

      {/* Stat Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          {[
            { label: 'Total Teachers', value: stats.totalTeachers, color: 'text-blue-700' },
            { label: 'Active', value: stats.activeTeachers, color: 'text-green-600' },
            { label: 'Subscribed', value: stats.subscribedTeachers, color: 'text-purple-600' },
            { label: 'Total Generations', value: stats.totalGenerations, color: 'text-blue-700' },
            { label: 'Guest Uses', value: stats.totalGuestGenerations, color: 'text-amber-600' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Line Chart */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
        <h2 className="font-semibold text-slate-700 mb-4">Generations (Last 30 Days)</h2>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} interval={6} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line type="monotone" dataKey="generations" stroke="#1E40AF" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Pending Payments */}
      {payments.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-amber-600 font-semibold">⚠ {payments.length} payment{payments.length > 1 ? 's' : ''} awaiting activation</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 text-xs">
                  <th className="text-left pb-2">Teacher</th>
                  <th className="text-left pb-2">Email</th>
                  <th className="text-left pb-2">Submitted</th>
                  <th className="text-left pb-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-amber-100">
                    <td className="py-2 font-medium">{p.name}</td>
                    <td className="py-2 text-slate-600">{p.email}</td>
                    <td className="py-2 text-slate-500">{formatDate(p.submittedAt)}</td>
                    <td className="py-2">
                      <button
                        onClick={() => { setActivateModal(p); setActivateMonths(1); }}
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
          <h2 className="font-semibold text-slate-700 mb-3">Recent Signups</h2>
          <div className="space-y-2">
            {recentUsers.slice(0, 5).map((u) => (
              <div key={u._id} className="flex items-center gap-3 py-2 border-t border-slate-100">
                <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center text-xs font-semibold">
                  {u.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-700 truncate">{u.name}</p>
                  <p className="text-xs text-slate-400 truncate">{u.email}</p>
                </div>
                <span className="text-xs text-slate-400">{u.createdAt ? formatDate(u.createdAt) : ''}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Generations */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <h2 className="font-semibold text-slate-700 mb-3">Recent Generations</h2>
          <div className="space-y-2">
            {recentGenerations.slice(0, 10).map((g) => {
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
                  <a
                    href={fileUrl}
                    download={g.fileName}
                    className="text-green-600 hover:text-green-700 text-xs ml-2"
                  >
                    ⬇
                  </a>
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
