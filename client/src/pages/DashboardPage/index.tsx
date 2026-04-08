import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import Navbar from '../../components/common/Navbar';
import { getHistory } from '../../api/generator';
import { getQuota } from '../../api/generator';
import { Generation } from '../../types';
import { formatDate } from '../../utils/format';
import Loader from '../../components/common/Loader';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
const PAGE_SIZE = 12;

const DashboardPage: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [quota, setQuota] = useState<{ remainingTries: number | null; isSubscribed: boolean | null; subscriptionExpiry?: string } | null>(null);

  useEffect(() => {
    Promise.all([getHistory(), getQuota()])
      .then(([histRes, quotaRes]) => {
        setGenerations(histRes.data.generations);
        setQuota(quotaRes.data);
      })
      .catch(() => toast.error('Failed to load history'))
      .finally(() => setLoading(false));
  }, []);

  const paginated = generations.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPages = Math.ceil(generations.length / PAGE_SIZE);

  if (loading) return <Loader fullPage text="Loading your presentations..." />;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-800">My Presentations</h1>
          <Link
            to="/"
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2.5 rounded-lg font-medium text-sm transition"
          >
            + Generate New
          </Link>
        </div>

        {/* Quota Card */}
        {quota && (
          <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6 flex items-center justify-between flex-wrap gap-3">
            <div>
              {quota.isSubscribed ? (
                <div>
                  <span className="bg-green-100 text-green-700 text-xs font-semibold px-3 py-1 rounded-full">Active Subscriber</span>
                  {quota.subscriptionExpiry && (
                    <p className="text-slate-500 text-sm mt-1">Valid until {formatDate(quota.subscriptionExpiry)}</p>
                  )}
                </div>
              ) : (
                <p className="text-slate-600 text-sm">
                  <span className="font-semibold">{quota.remainingTries ?? 0}</span> of 5 free generations remaining this month
                </p>
              )}
            </div>
          </div>
        )}

        {generations.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📂</div>
            <p className="text-slate-500 text-lg mb-4">No presentations yet.</p>
            <Link to="/" className="bg-blue-700 text-white px-6 py-3 rounded-xl font-medium hover:bg-blue-800 transition">
              Generate your first one!
            </Link>
          </div>
        ) : (
          <>
            <div className="grid md:grid-cols-2 gap-4">
              {paginated.map((g) => {
                const fileUrl = g.fileUrl.startsWith('http') ? g.fileUrl : `${serverUrl}${g.fileUrl}`;
                return (
                  <div key={g._id} className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-md transition">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-slate-800 mb-1">{g.topic}</h3>
                        <div className="flex items-center gap-2">
                          <span className="bg-blue-100 text-blue-700 text-xs font-medium px-2 py-0.5 rounded-full">
                            {g.gradeLevel}
                          </span>
                          <span className="text-slate-400 text-xs">{g.slideCount} slides</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDate(g.createdAt)}</span>
                      <a
                        href={fileUrl}
                        download={g.fileName}
                        className="bg-green-600 hover:bg-green-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition"
                      >
                        ⬇ Download
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                {Array.from({ length: totalPages }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={`w-9 h-9 rounded-lg text-sm font-medium transition ${
                      page === i + 1 ? 'bg-blue-700 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
