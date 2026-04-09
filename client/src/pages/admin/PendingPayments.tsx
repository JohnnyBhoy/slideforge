import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/common/Modal';
import { getPayments, activatePayment, getPaymentStats } from '../../api/admin';
import { PendingPayment, User } from '../../types';
import { formatDateTime } from '../../utils/format';

interface PaymentStats {
  totalRevenuePHP: number;
  totalRevenueUSD: number;
  totalActivated: number;
  totalPending: number;
  gcashCount: number;
  stripeCount: number;
}

const MethodBadge: React.FC<{ method?: string }> = ({ method }) => {
  if (method === 'stripe') {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-100 text-indigo-700 text-xs font-semibold px-2 py-0.5 rounded-full">
        💳 Stripe
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">
      📱 GCash
    </span>
  );
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, string> = {
    pending: 'bg-amber-100 text-amber-700',
    activated: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-600',
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${map[status] || 'bg-slate-100 text-slate-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
};

const PendingPayments: React.FC = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [activateModal, setActivateModal] = useState<PendingPayment | null>(null);
  const [months, setMonths] = useState(1);
  const [activating, setActivating] = useState(false);
  const [detailModal, setDetailModal] = useState<PendingPayment | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [p, s] = await Promise.all([getPayments(filter), getPaymentStats()]);
      setPayments(p.data.payments);
      setStats(s.data);
    } catch {
      toast.error('Failed to load payments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const handleActivate = async () => {
    if (!activateModal) return;
    setActivating(true);
    try {
      await activatePayment(activateModal._id, months);
      toast.success('Subscription activated!');
      setActivateModal(null);
      load();
    } catch {
      toast.error('Failed to activate');
    } finally {
      setActivating(false);
    }
  };

  const pending = payments.filter((p) => p.status === 'pending');

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Payment Logs</h1>
        {pending.length > 0 && (
          <span className="bg-amber-100 text-amber-700 font-semibold text-sm px-3 py-1 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Revenue Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
          {[
            { label: 'PHP Revenue', value: `₱${stats.totalRevenuePHP.toLocaleString()}`, color: 'text-green-700', bg: 'bg-green-50 border-green-200' },
            { label: 'USD Revenue', value: `$${stats.totalRevenueUSD.toLocaleString()}`, color: 'text-blue-700', bg: 'bg-blue-50 border-blue-200' },
            { label: 'Total Activated', value: stats.totalActivated, color: 'text-green-600', bg: 'bg-white border-slate-200' },
            { label: 'Pending', value: stats.totalPending, color: 'text-amber-600', bg: 'bg-white border-slate-200' },
            { label: 'GCash Payments', value: stats.gcashCount, color: 'text-emerald-600', bg: 'bg-white border-slate-200' },
            { label: 'Stripe Payments', value: stats.stripeCount, color: 'text-indigo-600', bg: 'bg-white border-slate-200' },
          ].map((s) => (
            <div key={s.label} className={`rounded-xl border p-4 ${s.bg}`}>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-slate-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filter tabs */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {['', 'pending', 'activated', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
              filter === s ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading...</p>
        ) : payments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-3xl mb-2">💳</p>
            <p className="text-slate-500">No payments found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  <th className="text-left p-3 text-slate-500 font-medium">Teacher</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Method</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Amount</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Plan</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Submitted</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Status</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Activated</th>
                  <th className="text-left p-3 text-slate-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <p className="font-medium text-slate-800">
                        {typeof p.userId === 'object' ? (p.userId as User).name : p.name}
                      </p>
                      <p className="text-xs text-slate-400">{p.email}</p>
                    </td>
                    <td className="p-3">
                      <MethodBadge method={p.paymentMethod} />
                    </td>
                    <td className="p-3 font-semibold text-slate-800">
                      {p.amount != null
                        ? `${p.currency === 'USD' ? '$' : '₱'}${p.amount.toLocaleString()}`
                        : <span className="text-slate-400 font-normal text-xs">—</span>
                      }
                    </td>
                    <td className="p-3 text-slate-600">
                      {p.months ? `${p.months} mo` : <span className="text-slate-400 text-xs">—</span>}
                    </td>
                    <td className="p-3 text-slate-500 text-xs">{formatDateTime(p.submittedAt)}</td>
                    <td className="p-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="p-3 text-slate-500 text-xs">
                      {p.activatedAt ? formatDateTime(p.activatedAt) : <span className="text-slate-300">—</span>}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setDetailModal(p)}
                          className="text-blue-600 hover:text-blue-700 text-xs underline"
                        >
                          Details
                        </button>
                        {p.status === 'pending' && (
                          <button
                            onClick={() => { setActivateModal(p); setMonths(p.months || 1); }}
                            className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700 transition"
                          >
                            Activate
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <Modal isOpen={!!detailModal} onClose={() => setDetailModal(null)}>
        {detailModal && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4">Payment Details</h2>
            <div className="grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Teacher</p>
                <p className="font-semibold text-slate-800">{detailModal.name}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Email</p>
                <p className="text-slate-700 break-all text-xs">{detailModal.email}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Payment Method</p>
                <MethodBadge method={detailModal.paymentMethod} />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Status</p>
                <StatusBadge status={detailModal.status} />
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Amount</p>
                <p className="font-bold text-slate-800 text-lg">
                  {detailModal.amount != null
                    ? `${detailModal.currency === 'USD' ? '$' : '₱'}${detailModal.amount.toLocaleString()}`
                    : '—'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Plan</p>
                <p className="text-slate-700">{detailModal.months ? `${detailModal.months} month${detailModal.months > 1 ? 's' : ''}` : '—'}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Submitted</p>
                <p className="text-slate-600 text-xs">{formatDateTime(detailModal.submittedAt)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-xs uppercase tracking-wide mb-0.5">Activated</p>
                <p className="text-slate-600 text-xs">{detailModal.activatedAt ? formatDateTime(detailModal.activatedAt) : '—'}</p>
              </div>
            </div>
            {detailModal.stripeSessionId && (
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 mt-4">
                <p className="text-xs text-indigo-500 uppercase tracking-wide mb-1">Stripe Session ID</p>
                <p className="font-mono text-xs text-indigo-800 break-all">{detailModal.stripeSessionId}</p>
              </div>
            )}
            <button
              onClick={() => setDetailModal(null)}
              className="mt-5 w-full py-2.5 rounded-lg border border-slate-200 text-slate-600 text-sm hover:bg-slate-50 transition"
            >
              Close
            </button>
          </div>
        )}
      </Modal>

      {/* Activate Modal */}
      <Modal isOpen={!!activateModal} onClose={() => setActivateModal(null)}>
        {activateModal && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-1">Activate Subscription</h2>
            <p className="text-slate-500 text-sm mb-4">
              For <span className="font-semibold">{activateModal.name}</span>
              {activateModal.amount != null && (
                <span className="ml-1 text-green-600 font-semibold">
                  · {activateModal.currency === 'USD' ? '$' : '₱'}{activateModal.amount}
                </span>
              )}
            </p>
            <div className="flex gap-3 mb-4">
              {[
                { months: 1, label: '1 Month', price: '₱299' },
                { months: 3, label: '3 Months', price: '₱799' },
              ].map((opt) => (
                <button
                  key={opt.months}
                  onClick={() => setMonths(opt.months)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${
                    months === opt.months
                      ? 'border-blue-700 bg-blue-50 text-blue-700'
                      : 'border-slate-200 text-slate-600'
                  }`}
                >
                  {opt.label}<br/><span className="text-xs font-normal">{opt.price}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActivateModal(null)} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-600">
                Cancel
              </button>
              <button
                onClick={handleActivate}
                disabled={activating}
                className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60"
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

export default PendingPayments;
