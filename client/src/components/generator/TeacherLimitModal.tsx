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
      <h2 className="text-2xl font-bold text-slate-800 mb-2">
        You've used your 5 free generations!
      </h2>
      <p className="text-slate-500 mb-4 text-sm">Subscribe to continue generating unlimited presentations.</p>

      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <span className="font-bold text-blue-800 text-lg">Monthly Subscription</span>
          <span className="font-bold text-blue-700 text-xl">
            ₱{settings?.monthlyPrice || 299}/mo
          </span>
        </div>
        <ul className="text-sm text-slate-700 space-y-1 mb-4">
          <li>✅ Unlimited generations</li>
          <li>✅ Full history access</li>
          <li>✅ Priority support</li>
        </ul>

        <div className="bg-white rounded-lg p-3 border border-blue-100 text-sm">
          <p className="font-semibold text-slate-700 mb-1">GCash Payment Instructions:</p>
          <p className="text-slate-600">
            <span className="font-medium">Number:</span> {settings?.gcashNumber || '09XX-XXX-XXXX'}
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Account:</span> {settings?.gcashAccountName || 'Class Generator'}
          </p>
          <p className="text-slate-600">
            <span className="font-medium">Reference:</span>{' '}
            <span className="font-mono text-blue-700">{user?.email}</span>
          </p>
          <p className="text-slate-500 text-xs mt-2">
            After paying, click the button below to notify us.
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
          {notified ? '✓ Notified!' : notifying ? 'Sending...' : "I've Paid — Notify Admin"}
        </button>
      </div>
    </Modal>
  );
};

export default TeacherLimitModal;
