import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import Navbar from '../../components/common/Navbar';
import Avatar from '../../components/common/Avatar';
import TeacherLimitModal from '../../components/generator/TeacherLimitModal';
import { useAuth } from '../../context/AuthContext';
import { getQuota } from '../../api/generator';
import { getHistory } from '../../api/generator';
import api from '../../api/axios';
import { formatDate } from '../../utils/format';

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [quota, setQuota] = useState<{ generationCount: number; isSubscribed: boolean | null; subscriptionExpiry?: string } | null>(null);
  const [totalGenerations, setTotalGenerations] = useState(0);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);

  useEffect(() => {
    Promise.all([getQuota(), getHistory()])
      .then(([q, h]) => {
        setQuota(q.data);
        setTotalGenerations(h.data.generations.length);
      })
      .catch(() => {});
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await api.put('/auth/profile', { name: name.trim() });
      toast.success('Profile updated!');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <div className="flex items-center gap-4 mb-6">
            <Avatar name={user.name} avatar={user.avatar} size="lg" />
            <div>
              <p className="font-bold text-slate-800 text-lg">{user.name}</p>
              <p className="text-slate-500 text-sm">{user.email}</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Display Name</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={handleSave}
                  disabled={saving || !name.trim()}
                  className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-800 disabled:opacity-60 transition"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Subscription Status */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6">
          <h2 className="font-bold text-slate-800 mb-4">Subscription</h2>
          {quota?.isSubscribed ? (
            <div>
              <span className="bg-green-100 text-green-700 font-semibold text-sm px-3 py-1 rounded-full">
                Active Subscriber
              </span>
              {quota.subscriptionExpiry && (
                <p className="text-slate-500 text-sm mt-2">
                  Valid until {formatDate(quota.subscriptionExpiry)}
                </p>
              )}
            </div>
          ) : (
            <div>
              <span className="bg-slate-100 text-slate-600 font-semibold text-sm px-3 py-1 rounded-full">
                Free Tier
              </span>
              <p className="text-slate-500 text-sm mt-2">
                {quota?.generationCount || 0} of 5 generations used
              </p>
              <button
                onClick={() => setShowSubscribeModal(true)}
                className="mt-3 bg-blue-700 hover:bg-blue-800 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
              >
                Subscribe — ₱299/month
              </button>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Total Presentations', value: totalGenerations },
            { label: 'Member Since', value: user.createdAt ? formatDate(user.createdAt) : '—' },
            { label: 'Generations Used', value: quota?.generationCount ?? 0 },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-xl border border-slate-200 p-4 text-center">
              <p className="text-xl font-bold text-blue-700">{stat.value}</p>
              <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <TeacherLimitModal isOpen={showSubscribeModal} onClose={() => setShowSubscribeModal(false)} />
    </div>
  );
};

export default ProfilePage;
