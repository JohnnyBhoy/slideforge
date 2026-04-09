import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';
import { useGenerator } from '../../context/GeneratorContext';
import { logout as logoutApi } from '../../api/auth';
import { getGoogleAuthUrl } from '../../api/auth';
import { getPaymentSettings, notifyPayment, createLSCheckout } from '../../api/settings';
import { PaymentSettings } from '../../types';
import Avatar from './Avatar';

const Navbar: React.FC = () => {
  const { user, role, logout } = useAuth();
  const { isSubscribed } = useGenerator();
  const navigate = useNavigate();

  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<1 | 3>(1);
  const [currency, setCurrency] = useState<'PHP' | 'USD'>('PHP');
  const [notifying, setNotifying] = useState(false);
  const [notified, setNotified] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(false);
  const [lsLoading, setLsLoading] = useState(false);

  const openUpgrade = async () => {
    setNotified(false);
    setSelectedPlan(1);
    setShowUpgradeModal(true);
    if (!settings) {
      setLoadingSettings(true);
      try {
        const res = await getPaymentSettings();
        setSettings(res.data);
      } catch {
        toast.error('Could not load payment info');
      } finally {
        setLoadingSettings(false);
      }
    }
  };

  const handleLSCheckout = async () => {
    alert('Sorry, card payment is currently not available.');
    return;

    setLsLoading(true);
    try {
      const res = await createLSCheckout(selectedPlan);
      if (res.data.url) {
        window.location.href = res.data.url;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Could not start checkout. Please try again.';
      toast.error(msg);
      setLsLoading(false);
    }
  };

  const handleNotify = async () => {
    setNotifying(true);
    try {
      await notifyPayment(selectedPlan, planPrice, 'PHP');
      setNotified(true);
      toast.success("Thanks! We'll activate your account within 24 hours.");
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
        || 'Failed to send notification. Please try again.';
      toast.error(msg);
    } finally {
      setNotifying(false);
    }
  };

  const handleLogout = async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    logout();
    navigate('/');
  };

  const planPrice = currency === 'PHP'
    ? (selectedPlan === 1 ? settings?.monthlyPrice ?? 299 : settings?.threeMonthPrice ?? 799)
    : (selectedPlan === 1 ? settings?.monthlyPriceUsd ?? 5 : settings?.threeMonthPriceUsd ?? 13);

  return (
    <>
      <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
        <Link to="/" className="flex items-center gap-2 font-bold text-blue-700 text-lg">
          <img src='/slide_forge.png' alt="slideforge" className='h-12' />
          <span>Slide Forge</span>
        </Link>

        <div className="flex items-center gap-3">
          {/* Guest */}
          {!user && (
            <a
              href={getGoogleAuthUrl()}
              className="border border-blue-700 text-blue-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
            >
              Sign in
            </a>
          )}

          {/* Teacher */}
          {role === 'teacher' && user && (
            <>
              {!isSubscribed && (
                <button
                  onClick={openUpgrade}
                  className="flex items-center gap-1.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg transition shadow-sm"
                >
                  <span>⚡</span>
                  <span>Upgrade</span>
                </button>
              )}
              {isSubscribed && (
                <span className="hidden md:flex items-center gap-1 bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">
                  ✓ Subscribed
                </span>
              )}
              <Link
                to="/dashboard"
                className="text-slate-600 hover:text-blue-700 text-sm font-medium hidden md:block"
              >
                My History
              </Link>
              <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-700">
                <Avatar name={user.name} avatar={user.avatar} size="sm" />
                <span className="hidden md:block font-medium">{user.name}</span>
              </Link>
              <button
                onClick={handleLogout}
                className="text-sm text-slate-500 hover:text-red-600 transition hidden md:block"
              >
                Logout
              </button>
            </>
          )}

          {/* Admin */}
          {role === 'admin' && (
            <Link to="/admin" className="text-blue-700 font-medium text-sm">
              Admin Panel
            </Link>
          )}
        </div>
      </nav>

      {/* Upgrade Modal */}
      {showUpgradeModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
          onClick={() => setShowUpgradeModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-700 to-blue-600 px-6 py-5 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold">Upgrade to Premium</h2>
                  <p className="text-blue-200 text-sm mt-0.5">Unlimited presentations, no limits</p>
                </div>
                <button
                  onClick={() => setShowUpgradeModal(false)}
                  className="text-blue-200 hover:text-white text-2xl leading-none"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              {loadingSettings ? (
                <div className="text-center py-6 text-slate-400 text-sm">Loading payment info...</div>
              ) : (
                <>
                  {/* Currency toggle */}
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-semibold text-slate-600 uppercase tracking-wide">Choose your plan</p>
                    <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
                      <button
                        onClick={() => setCurrency('PHP')}
                        className={`px-3 py-1.5 transition ${currency === 'PHP' ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        ₱ PHP
                      </button>
                      <button
                        onClick={() => setCurrency('USD')}
                        className={`px-3 py-1.5 transition ${currency === 'USD' ? 'bg-blue-700 text-white' : 'text-slate-500 hover:bg-slate-100'}`}
                      >
                        $ USD
                      </button>
                    </div>
                  </div>

                  {/* Plan cards */}
                  <div className="grid grid-cols-2 gap-3 mb-5">
                    {([
                      {
                        months: 1 as const,
                        label: '1 Month',
                        phpPrice: settings?.monthlyPrice ?? 299,
                        usdPrice: settings?.monthlyPriceUsd ?? 5,
                        badge: null,
                      },
                      {
                        months: 3 as const,
                        label: '3 Months',
                        phpPrice: settings?.threeMonthPrice ?? 799,
                        usdPrice: settings?.threeMonthPriceUsd ?? 13,
                        badge: currency === 'PHP' ? 'Save ₱98' : 'Save $4',
                      },
                    ] as const).map((plan) => {
                      const price = currency === 'PHP' ? plan.phpPrice : plan.usdPrice;
                      const symbol = currency === 'PHP' ? '₱' : '$';
                      return (
                        <button
                          key={plan.months}
                          onClick={() => setSelectedPlan(plan.months)}
                          className={`relative rounded-xl border-2 p-4 text-left transition ${
                            selectedPlan === plan.months
                              ? 'border-blue-700 bg-blue-50'
                              : 'border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          {plan.badge && (
                            <span className="absolute -top-2.5 right-3 bg-green-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                              {plan.badge}
                            </span>
                          )}
                          <p className="font-semibold text-slate-800 text-sm">{plan.label}</p>
                          <p className={`text-xl font-bold mt-1 ${selectedPlan === plan.months ? 'text-blue-700' : 'text-slate-700'}`}>
                            {symbol}{price}
                          </p>
                          <p className="text-xs text-slate-400 mt-0.5">
                            {symbol}{Math.round(price / plan.months)}/mo
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  {/* What you get */}
                  <ul className="text-sm text-slate-600 space-y-1.5 mb-5">
                    {[
                      'Unlimited presentation generations',
                      'Full history — re-download anytime',
                      'Topic-matched images on every slide',
                      'Built-in quiz + speaker notes',
                      'Priority support',
                    ].map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span className="text-green-500 font-bold">✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>

                  {currency === 'PHP' ? (
                    <>
                      {/* GCash instructions */}
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">📱</span>
                          <p className="font-semibold text-slate-700 text-sm">Pay via GCash</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">GCash Number</span>
                            <span className="font-mono font-bold text-slate-800 text-base tracking-wide">
                              {settings?.gcashNumber ?? '09XX-XXX-XXXX'}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Account Name</span>
                            <span className="font-semibold text-slate-800">{settings?.gcashAccountName ?? 'SlideForge'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Amount</span>
                            <span className="font-bold text-blue-700 text-base">₱{planPrice}</span>
                          </div>
                          <div className="flex justify-between items-start">
                            <span className="text-slate-500">Reference / Note</span>
                            <span className="font-mono text-xs text-blue-700 text-right max-w-[55%] break-all">
                              {user?.email}
                            </span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 border-t border-slate-200 pt-2">
                          Use your email as the GCash reference/note so we can identify your payment.
                        </p>
                      </div>
                      <div className="flex gap-3">
                        <button
                          onClick={() => setShowUpgradeModal(false)}
                          className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleNotify}
                          disabled={notifying || notified}
                          className="flex-1 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                          {notified ? '✓ Admin Notified!' : notifying ? 'Sending...' : "I've Paid — Notify Admin"}
                        </button>
                      </div>
                      {notified && (
                        <p className="text-center text-xs text-slate-400 mt-3">
                          We'll activate your account within 24 hours. Thank you! 🎉
                        </p>
                      )}
                    </>
                  ) : (
                    <>
                      {/* LemonSqueezy / Card payment */}
                      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 mb-5">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-lg">💳</span>
                          <p className="font-semibold text-slate-700 text-sm">Pay with Card (LemonSqueezy)</p>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Amount</span>
                            <span className="font-bold text-blue-700 text-base">${planPrice} USD</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Email</span>
                            <span className="text-slate-700 text-xs">{user?.email}</span>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3 border-t border-slate-200 pt-2">
                          You'll be redirected to a secure checkout. Your subscription activates instantly after payment.
                        </p>
                      </div>
                      {settings?.lsEnabled ? (
                        <div className="flex gap-3">
                          <button
                            onClick={() => setShowUpgradeModal(false)}
                            className="flex-1 py-2.5 rounded-lg border border-slate-300 text-slate-600 text-sm font-medium hover:bg-slate-50 transition"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={handleLSCheckout}
                            disabled={lsLoading}
                            className="flex-1 py-2.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition disabled:opacity-60 flex items-center justify-center gap-2"
                          >
                            {lsLoading ? (
                              <>
                                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Redirecting...
                              </>
                            ) : (
                              'Pay with Card →'
                            )}
                          </button>
                        </div>
                      ) : (
                        <p className="text-center text-xs text-amber-600 bg-amber-50 rounded-lg p-3">
                          Card payments are not available yet. Please use GCash (PHP) instead.
                        </p>
                      )}
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
