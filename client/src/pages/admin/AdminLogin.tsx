import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { adminLogin } from '../../api/auth';
import { useAuth } from '../../context/AuthContext';

const schema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

const AdminLogin: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    try {
      const res = await adminLogin(data.email, data.password);
      await login(res.data.token);
      navigate('/admin', { replace: true });
    } catch {
      toast.error('Invalid email or password');
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/slide_forge.png" alt="Slide Forge" className="h-14 mx-auto mb-3" />
          <h1 className="text-2xl font-bold text-slate-800">Admin Login</h1>
          <p className="text-slate-500 text-sm mt-1">Slide Forge Administration Panel</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                {...register('email')}
                placeholder="admin@slideforge.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                {...register('password')}
                placeholder="••••••••"
                className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-blue-700 hover:bg-blue-800 text-white font-semibold py-3 rounded-lg transition disabled:opacity-60"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <div className="text-center mt-4">
          <Link to="/" className="text-sm text-slate-500 hover:text-blue-700">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
