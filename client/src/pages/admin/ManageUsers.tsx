import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/common/Modal';
import Avatar from '../../components/common/Avatar';
import { getUsers, updateUserStatus, resetQuota, subscribeUser } from '../../api/admin';
import { User } from '../../types';
import { formatDate } from '../../utils/format';

const ManageUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{ type: string; user: User } | null>(null);
  const [subscribeModal, setSubscribeModal] = useState<User | null>(null);
  const [subMonths, setSubMonths] = useState(1);
  const [actionLoading, setActionLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page, limit: 10, search, filter });
      setUsers(res.data.users);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, filter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  const handleToggleActive = async (user: User) => {
    setActionLoading(true);
    try {
      await updateUserStatus(user._id, !user.isActive);
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`);
      setConfirmModal(null);
      load();
    } catch {
      toast.error('Failed to update user status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResetQuota = async (user: User) => {
    setActionLoading(true);
    try {
      await resetQuota(user._id);
      toast.success('Quota reset');
      setConfirmModal(null);
      load();
    } catch {
      toast.error('Failed to reset quota');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubscribe = async () => {
    if (!subscribeModal) return;
    setActionLoading(true);
    try {
      await subscribeUser(subscribeModal._id, true, subMonths);
      toast.success('Subscription granted!');
      setSubscribeModal(null);
      load();
    } catch {
      toast.error('Failed to grant subscription');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Manage Users</h1>
        <span className="text-sm text-slate-500">{total} teachers</span>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Search</button>
        </form>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="subscribed">Subscribed</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-slate-500 font-medium">Teacher</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden md:table-cell">Status</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden lg:table-cell">Generations</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden lg:table-cell">Joined</th>
                <th className="text-left p-3 text-slate-500 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-slate-500">No users found</td></tr>
              ) : users.map((u) => (
                <tr key={u._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.name} avatar={u.avatar} size="sm" />
                      <div>
                        <p className="font-medium text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-3 hidden md:table-cell">
                    <div className="flex flex-col gap-1">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full w-fit ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                      {u.isSubscribed && (
                        <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 w-fit">
                          Subscribed
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="p-3 hidden lg:table-cell text-slate-600">{u.generationCount ?? 0}</td>
                  <td className="p-3 hidden lg:table-cell text-slate-500 text-xs">{u.createdAt ? formatDate(u.createdAt) : '—'}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Link to={`/admin/users/${u._id}`} className="text-blue-600 hover:text-blue-800 text-xs font-medium">View</Link>
                      <button onClick={() => setConfirmModal({ type: 'toggle', user: u })} className="text-amber-600 hover:text-amber-800 text-xs font-medium">
                        {u.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => setConfirmModal({ type: 'reset', user: u })} className="text-slate-500 hover:text-slate-700 text-xs font-medium">
                        Reset
                      </button>
                      <button onClick={() => { setSubscribeModal(u); setSubMonths(1); }} className="text-purple-600 hover:text-purple-800 text-xs font-medium">
                        Subscribe
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-slate-100">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 rounded text-sm font-medium ${page === i + 1 ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Confirm Modal */}
      <Modal isOpen={!!confirmModal} onClose={() => setConfirmModal(null)}>
        {confirmModal && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">
              {confirmModal.type === 'toggle'
                ? `${confirmModal.user.isActive ? 'Deactivate' : 'Activate'} User`
                : 'Reset Quota'}
            </h2>
            <p className="text-slate-500 text-sm mb-4">
              {confirmModal.type === 'toggle'
                ? `Are you sure you want to ${confirmModal.user.isActive ? 'deactivate' : 'activate'} ${confirmModal.user.name}?`
                : `Reset generation count for ${confirmModal.user.name}?`}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmModal(null)} className="flex-1 py-2.5 rounded-lg border border-slate-200 text-sm text-slate-600">Cancel</button>
              <button
                onClick={() => confirmModal.type === 'toggle' ? handleToggleActive(confirmModal.user) : handleResetQuota(confirmModal.user)}
                disabled={actionLoading}
                className="flex-1 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold disabled:opacity-60"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Subscribe Modal */}
      <Modal isOpen={!!subscribeModal} onClose={() => setSubscribeModal(null)}>
        {subscribeModal && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Grant Subscription</h2>
            <p className="text-slate-500 text-sm mb-4">For {subscribeModal.name}</p>
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
              <button onClick={() => setSubscribeModal(null)} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-600">Cancel</button>
              <button onClick={handleSubscribe} disabled={actionLoading} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60">
                {actionLoading ? 'Granting...' : 'Grant'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </AdminLayout>
  );
};

export default ManageUsers;
