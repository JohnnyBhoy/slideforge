import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import AdminLayout from '../../components/admin/AdminLayout';
import { getAllGenerations } from '../../api/admin';
import { Generation, User } from '../../types';
import { formatDate } from '../../utils/format';

const serverUrl = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';

const AllGenerations: React.FC = () => {
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await getAllGenerations({ page, limit: 20, search, type });
      setGenerations(res.data.generations);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages);
    } catch {
      toast.error('Failed to load generations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [page, type]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    load();
  };

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">All Generations</h1>
        <span className="text-sm text-slate-500">{total} total</span>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 mb-4 flex flex-wrap gap-3">
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            placeholder="Search by topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm">Search</button>
        </form>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value); setPage(1); }}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none"
        >
          <option value="">All</option>
          <option value="teacher">Teacher</option>
          <option value="guest">Guest</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left p-3 text-slate-500 font-medium">Type</th>
                <th className="text-left p-3 text-slate-500 font-medium">User</th>
                <th className="text-left p-3 text-slate-500 font-medium">Topic</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden md:table-cell">Grade</th>
                <th className="text-left p-3 text-slate-500 font-medium hidden lg:table-cell">Slides</th>
                <th className="text-left p-3 text-slate-500 font-medium">Date</th>
                <th className="text-left p-3 text-slate-500 font-medium">Download</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">Loading...</td></tr>
              ) : generations.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-slate-500">No generations found</td></tr>
              ) : generations.map((g) => {
                const isGuest = !!g.guestId;
                const userName = typeof g.userId === 'object' && g.userId !== null
                  ? (g.userId as User).name
                  : isGuest ? 'Guest' : 'Unknown';
                const fileUrl = `${serverUrl}/files/${g.fileName}`;
                return (
                  <tr key={g._id} className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="p-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${isGuest ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                        {isGuest ? 'Guest' : 'Teacher'}
                      </span>
                    </td>
                    <td className="p-3 text-slate-700">{userName}</td>
                    <td className="p-3 font-medium text-slate-800 max-w-xs truncate">{g.topic}</td>
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
        </div>

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
    </AdminLayout>
  );
};

export default AllGenerations;
