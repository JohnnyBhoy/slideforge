import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import Modal from '../../components/common/Modal';
import { getPayments, activatePayment } from '../../api/admin';
import { PendingPayment, User } from '../../types';
import { formatDateTime } from '../../utils/format';

const PendingPayments: React.FC = () => {
  const [payments, setPayments] = useState<PendingPayment[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [activateModal, setActivateModal] = useState<PendingPayment | null>(null);
  const [months, setMonths] = useState(1);
  const [activating, setActivating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getPayments(filter);
      setPayments(res.data.payments);
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
        <h1 className="text-2xl font-bold text-slate-800">Payments</h1>
        {pending.length > 0 && (
          <span className="bg-amber-100 text-amber-700 font-semibold text-sm px-3 py-1 rounded-full">
            {pending.length} pending
          </span>
        )}
      </div>

      <div className="mb-4 flex gap-2">
        {['', 'pending', 'activated', 'rejected'].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${filter === s ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
          >
            {s === '' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        {loading ? (
          <p className="text-center py-8 text-slate-500">Loading...</p>
        ) : payments.length === 0 ? (
          <p className="text-center py-8 text-slate-500">No payments found</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-slate-500 font-medium">Teacher</th>
                <th className="text-left p-3 text-slate-500 font-medium">Email</th>
                <th className="text-left p-3 text-slate-500 font-medium">Submitted</th>
                <th className="text-left p-3 text-slate-500 font-medium">Status</th>
                <th className="text-left p-3 text-slate-500 font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((p) => (
                <tr key={p._id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="p-3 font-medium text-slate-800">
                    {typeof p.userId === 'object' ? (p.userId as User).name : p.name}
                  </td>
                  <td className="p-3 text-slate-600">{p.email}</td>
                  <td className="p-3 text-slate-500 text-xs">{formatDateTime(p.submittedAt)}</td>
                  <td className="p-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      p.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                      p.status === 'activated' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {p.status === 'pending' && (
                      <button
                        onClick={() => { setActivateModal(p); setMonths(1); }}
                        className="bg-green-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-green-700 transition"
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal isOpen={!!activateModal} onClose={() => setActivateModal(null)}>
        {activateModal && (
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-2">Activate Subscription</h2>
            <p className="text-slate-500 text-sm mb-4">For {activateModal.name}</p>
            <div className="flex gap-3 mb-4">
              {[{ months: 1, label: '1 Month', price: '₱299' }, { months: 3, label: '3 Months', price: '₱799' }].map((opt) => (
                <button
                  key={opt.months}
                  onClick={() => setMonths(opt.months)}
                  className={`flex-1 py-3 rounded-xl border-2 text-sm font-semibold transition ${months === opt.months ? 'border-blue-700 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600'}`}
                >
                  {opt.label}<br/><span className="text-xs font-normal">{opt.price}</span>
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setActivateModal(null)} className="flex-1 py-2.5 rounded-lg border text-sm text-slate-600">Cancel</button>
              <button onClick={handleActivate} disabled={activating} className="flex-1 py-2.5 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-60">
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
