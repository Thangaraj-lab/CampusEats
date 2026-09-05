import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UtensilsCrossed, Lock, Mail, Loader2, AlertCircle, ArrowRight, ShieldCheck, Users, ChefHat } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      navigate('/student'); // Default redirect, auth context handles current role
    } else {
      setError(res.message || 'Login failed.');
    }
  };

  const handleFillDemo = (demoEmail: string, demoRole: string) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setError(null);
  };

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center p-4 bg-slate-50">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl max-w-md w-full p-8 animate-in fade-in zoom-in-95">
        <div className="text-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-orange-600 text-white flex items-center justify-center mx-auto mb-3 shadow-md shadow-orange-600/20">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Welcome Back</h2>
          <p className="text-xs text-slate-500 mt-1">Sign in to your Campus Eats account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="student@campuseats.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-orange-600 text-white font-bold text-sm hover:bg-orange-700 transition shadow-md shadow-orange-600/20 flex items-center justify-center gap-2 disabled:opacity-70 mt-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Autofill Credentials */}
        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block mb-2">
            Instant Seed Credentials (Click to fill)
          </span>
          <div className="grid grid-cols-3 gap-1.5 text-xs">
            <button
              type="button"
              onClick={() => handleFillDemo('student@campuseats.edu', 'student')}
              className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-orange-50 hover:text-orange-600 font-semibold text-slate-700 transition text-[11px] border border-slate-200"
            >
              Student
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('vendor1@campuseats.edu', 'vendor')}
              className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-600 font-semibold text-slate-700 transition text-[11px] border border-slate-200"
            >
              Vendor
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin@campuseats.edu', 'admin')}
              className="px-2 py-1.5 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 font-semibold text-slate-700 transition text-[11px] border border-slate-200"
            >
              Admin
            </button>
          </div>
        </div>

        <div className="mt-6 text-center text-xs text-slate-500 space-y-1">
          <p>
            New student?{' '}
            <Link to="/register/student" className="font-bold text-orange-600 hover:underline">
              Create Student Account
            </Link>
          </p>
          <p>
            Food Vendor?{' '}
            <Link to="/register/vendor" className="font-bold text-emerald-600 hover:underline">
              Apply as Campus Vendor
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
