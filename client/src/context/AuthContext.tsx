import React, { createContext, useContext, useState, useEffect } from 'react';
import { getMe } from '../api/auth';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  role: string | null;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  login: async () => {},
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = async () => {
    try {
      const res = await getMe();
      setUser(res.data.user);
      setRole(res.data.user.role);
    } catch {
      setUser(null);
      setRole(null);
      localStorage.removeItem('cg_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('cg_token');
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('cg_token', token);
    await fetchMe();
  };

  const handleLogout = () => {
    localStorage.removeItem('cg_token');
    setUser(null);
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ user, role, loading, login, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
