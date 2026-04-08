import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import { getUserById, updateUserStatus, resetQuota, subscribeUser } from '../../api/admin';
import { User, Generation } from '../../types';
import { formatDate } from '../../utils/format';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const UserDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [subscribeModal, setSubscribeModal] = useState(false);
  const [subMonths, setSubMonths] = useState(1);
  const [confirmReset, setConfirmReset] = useState(false);

  const load = async () => {
    if (!id) return;
    try {
      const res = await getUserById(id);
      setUser(res.data.user);
      setGenerations(res.data.generations);
    } catch {
      toast.error('Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [id]);

  if (loading) return <AdminLayout><p className="text-slate-500">Loading...</p></AdminLayout>;
  if (!user) return <AdminLayout><p className="text-red-500">User not found</p></AdminLayout>;

  const handleToggleActive = async () => {
    setActionLoading(true);
    try {
      await updateUserStatus(user._id, !user.isActive);
      toast.success('Status updated');
      load();
    } catch { toast.error('Failed'); }
    finally { setActionLoading(false); }
  };

  const handleResetQuota = async () => {
    setActionLoading(true);
    try {
      await resetQuota(user._id);
      toast.success('Quota reset');
      setConfirmReset(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setActionLoading(false); }
  };

  const handleSubscribe = async () => {
    setActionLoading(true);
    try {
      await subscribeUser(user._id, true, subMonths);
      toast.success('Subscription granted');
      setSubscribeModal(false);
      load();
    } catch { toast.error('Failed'); }
    finally { setActionLoading(false); }
  };

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-6">
        <Link to="/admin/users" className="text-slate-500 hover:text-blue-700 text-sm">← Users</Link>
        <span className="text-slate-300">/</span>
        <span className="text-sm text-slate-700 font-medium">{user.name}</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4 mb-4">
          <Avatar name={user.name} avatar={user.avatar} size="lg" />
          <div className="flex-1">
            <h1 className="text-xl font-bold text-slate-800">{user.name}</h1>
            <p className="text-slate-500">{user.email}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {user.isActive ? 'Active' : 'Inactive'}
              </span>
              {user.isSubscribed && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-medium">Subscribed</span>
              )}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-sm">
          {[
            { label: 'Generations', value: user.generationCount ?? 0 },
            { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : '—' },
            { label: 'Billing Start', value: user.billingCycleStart ? formatDate(user.billingCycleStart) : '—' },
            { label: 'Sub Expiry', value: user.subscriptionExpiry ? formatDate(user.subscriptionExpiry) : 'N/A' },
          ].map((s) => (
            <div key={s.label} className="bg-slate-50 rounded-lg p-3">
              <p className="text-xs text-slate-500">{s.label}</p>
              <p className="font-semibold text-slate-800 mt-1">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <button onClick={handleToggleActive} disabled={actionLoading} className="bg-amber-100 text-amber-700 hover:bg-amber-200 text-sm font-medium px-4 py-2 rounded-lg transition disabled:opacity-60">
            {user.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button onClick={() => setConfirmReset(true)} className="bg-slate-100 text-slate-600 hover:bg-slate-200 text-sm font-medium px-4 py-2 rounded-lg transition">
            Reset Quota
          </button>
          <button onClick={() => { setSubscribeModal(true); setSubMonths(1); }} className="bg-purple-100 text-purple-700 hover:bg-purple-200 text-sm font-medium px-4 py-2 rounded-lg transition">
            Grant Subscription
          </button>
        </div>
      </div>

      {/* Generation History */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100">
          <h2 className="font-semibold text-slate-700">Generation History ({generations.length})</h2>
        </div>
        {generations.length === 0 ? (
          <p className="text-center py-8 text-slate-500 text-sm">No generations yet</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left p-3 text-slate-500 font-medium">Topic</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden md:table-cell">Grade</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden lg:table-cell">Slides</th>
                <th className="text-left p-3 text-slate-500 font-medium">Date</th>
                <th className="text-left p-3 text-slate-500 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {generations.map((g) => {
                const fileUrl = g.fileUrl?.startsWith('http') ? g.fileUrl : `${serverUrl}/files/${g.fileName}`;
                return (
                  <tr key={g._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3 font-medium text-slate-800">{g.topic}</td>
                    <td className="p-3 text-slate-600 hidden md:table-cell">{g.gradeLevel}</td>
                    <td className="p-3 text-slate-500 hidden lg:table-cell">{g.slideCount}</td>
                    <td className="p-3 text-slate-500 text-xs">{formatDate(g.createdAt)}</td>
                    <td className="p-3">
                      <a href={fileUrl} download={g.fileName} className="text-green-600 hover:text-green-700 font-medium">⬇</a>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={confirmReset} onClose={() => setConfirmReset(false)}>
        <h2 className="text-lg font-bold text-slate-800 mb-2">Reset Quota</h2>
        <p className="text-slate-500 text-sm mb-4">Reset generation count for {user.name}?</p>
        <div className="flex gap-3">
          <button onClick={() => setConfirmReset(false)} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-600">Cancel</button>
          <button onClick={handleResetQuota} disabled={actionLoading} className="flex-1 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-60">
            {actionLoading ? 'Resetting...' : 'Reset'}
          </button>
        </div>
      </Modal>

      <Modal isOpen={subscribeModal} onClose={() => setSubscribeModal(false)}>
        <h2 className="text-lg font-bold text-slate-800 mb-4">Grant Subscription</h2>
        <div className="flex gap-3 mb-4">
          {[{ months: 1, label: '1 Month', price: '₱299' }, { months: 3, label: '3 Months', price: '₱799' }].map((opt) => (
            <button
              key={opt.months}
              onClick={() => setSubMonths(opt.months)}
              className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${subMonths === opt.months ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
            >
              {opt.label}<br/><span className="text-xs font-normal">{opt.price}</span>
            </button>
          ))}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setSubscribeModal(false)} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-600">Cancel</button>
          <button onClick={handleSubscribe} disabled={actionLoading} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60">
            {actionLoading ? 'Granting...' : 'Grant'}
          </button>
        </div>
      </Modal>
    </AdminLayout>
  );
};

export default UserDetail;
