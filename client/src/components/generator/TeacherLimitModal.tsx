import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Modal from '../common/Modal';
import { getPaymentSettings, notifyPayment } from '../../api/settings';
import { useAuth } from '../../context/AuthContext';
import { PaymentSettings } from '../../types';

interface TeacherLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TeacherLimitModal: React.FC<TeacherLimitModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getPaymentSettings().then((res) => setSettings(res.data)).catch(() => {});
    }
  }, [isOpen]);

  const handleNotify = async () => {
    setNotifying(true);
    try {
      await notifyPayment();
      setNotified(true);
      toast.success("Thanks! We'll activate your account within 24 hours.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Failed to notify. Please try again.';
      toast.error(msg);
    } finally {
      setNotifying(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} dismissable={true}>
      <div className="text-center mb-4">
        <div className="text-4xl mb-2">🚀</div>
        <h2 className="text-xl font-bold text-slate-800">You've used your 5 free presentations!</h2>
        <p className="text-slate-500 text-sm mt-1">Subscribe to keep generating unlimited presentations.</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="font-bold text-blue-800 text-base">Monthly Subscription</p>
            <p className="text-xs text-blue-600">Unlimited presentations for teachers & students</p>
          </div>
          <span className="font-bold text-blue-700 text-xl">
            ₱{settings?.monthlyPrice || 299}<span className="text-sm font-normal">/mo</span>
          </span>
        </div>

        <ul className="text-sm text-slate-700 space-y-1.5 mb-4">
          <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Unlimited presentations</li>
          <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Full generation history</li>
          <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Download any past presentation</li>
          <li className="flex items-center gap-2"><span className="text-green-600">✓</span> Priority support</li>
        </ul>

        <div className="bg-white rounded-lg p-3 border border-blue-100 text-sm space-y-1.5">
          <p className="font-semibold text-slate-700 text-xs uppercase tracking-wide mb-2">GCash Payment</p>
          <div className="flex justify-between">
            <span className="text-slate-500">Number</span>
            <span className="font-mono font-semibold text-slate-800">{settings?.gcashNumber || '09XX-XXX-XXXX'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Account Name</span>
            <span className="font-semibold text-slate-800">{settings?.gcashAccountName || 'SlideForge'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Amount</span>
            <span className="font-semibold text-slate-800">₱{settings?.monthlyPrice || 299}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Reference</span>
            <span className="font-mono text-blue-700 text-xs">{user?.email}</span>
          </div>
          <p className="text-slate-400 text-xs pt-1 border-t border-slate-100 mt-2">
            After sending payment, click the button below to notify us.
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
        >
          Close
        </button>
        <button
          onClick={handleNotify}
          disabled={notifying || notified}
          className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60"
        >
          {notified ? '✓ Admin Notified!' : notifying ? 'Sending...' : "I've Paid — Notify Admin"}
        </button>
      </div>
    </Modal>
  );
};

export default TeacherLimitModal;
