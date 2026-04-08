import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { logout as logoutApi } from '../../api/auth';
import Avatar from './Avatar';
import { getGoogleAuthUrl } from '../../api/auth';

const Navbar: React.FC = () => {
  const { user, role } = useAuth();
  const { logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    logout();
    navigate('/');
  };

  return (
    <nav className="bg-white border-b border-slate-200 px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-40">
      <Link to="/" className="flex items-center gap-2 font-bold text-blue-700 text-lg">
        <span className="text-2xl">🎓</span>
        <span>Class Generator</span>
      </Link>

      <div className="flex items-center gap-3">
        {!user && (
          <a
            href={getGoogleAuthUrl()}
            className="border border-blue-700 text-blue-700 px-4 py-1.5 rounded-lg text-sm font-medium hover:bg-blue-50 transition"
          >
            Sign in
          </a>
        )}
        {role === 'teacher' && user && (
          <>
            <Link to="/dashboard" className="text-slate-600 hover:text-blue-700 text-sm font-medium">
              My History
            </Link>
            <Link to="/profile" className="flex items-center gap-2 text-sm text-slate-700 hover:text-blue-700">
              <Avatar name={user.name} avatar={user.avatar} size="sm" />
              <span className="hidden md:block font-medium">{user.name}</span>
            </Link>
            <button
              onClick={handleLogout}
              className="text-sm text-slate-500 hover:text-red-600 transition"
            >
              Logout
            </button>
          </>
        )}
        {role === 'admin' && (
          <Link to="/admin" className="text-blue-700 font-medium text-sm">
            Admin Panel
          </Link>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
