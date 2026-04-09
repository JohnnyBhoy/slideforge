import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { verifyLSOrder } from '../../api/settings';
import { useGenerator } from '../../context/GeneratorContext';

const LSSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { updateQuota } = useGenerator();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');

  useEffect(() => {
    // LemonSqueezy appends ?order_id=xxx to the redirect URL
    const orderId = searchParams.get('order_id');
    const months = parseInt(searchParams.get('months') || '1', 10);

    if (!orderId) {
      toast.error('Invalid payment session.');
      navigate('/');
      return;
    }

    verifyLSOrder(orderId, months)
      .then((res) => {
        if (res.data.paid) {
          setStatus('success');
          updateQuota();
          toast.success('Subscription activated! You now have unlimited generations.');
        } else {
          setStatus('failed');
        }
      })
      .catch(() => {
        setStatus('failed');
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full p-8 text-center">
        {status === 'loading' && (
          <>
            <div className="flex justify-center mb-6">
              <svg className="animate-spin h-12 w-12 text-blue-700" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">Verifying Payment</h2>
            <p className="text-slate-500 text-sm">Please wait while we confirm your payment...</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
                <span className="text-4xl">✓</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Successful!</h2>
            <p className="text-slate-500 text-sm mb-6">
              Your subscription is now active. You have unlimited presentation generations.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold transition"
            >
              Start Generating →
            </button>
          </>
        )}

        {status === 'failed' && (
          <>
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center">
                <span className="text-4xl">✗</span>
              </div>
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Payment Not Confirmed</h2>
            <p className="text-slate-500 text-sm mb-6">
              We couldn't verify your payment. If you were charged, please contact support.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/')}
                className="flex-1 py-3 rounded-xl border border-slate-300 text-slate-600 font-medium hover:bg-slate-50 transition text-sm"
              >
                Go Home
              </button>
              <button
                onClick={() => navigate('/profile')}
                className="flex-1 py-3 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-semibold transition text-sm"
              >
                My Profile
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default LSSuccess;
