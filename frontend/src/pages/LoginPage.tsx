import { FormEvent, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Dumbbell, LogIn, Mail } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import PasswordInput from '../components/PasswordInput';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('owner@gym.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/dashboard" replace />;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-300 via-slate-200 to-brand-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200/90 bg-white p-8 shadow-2xl shadow-slate-400/25">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/30">
            <Dumbbell className="h-7 w-7" strokeWidth={2.5} />
          </div>
          <h1 className="text-2xl text-slate-900">GymApp</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">Sign in to your account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm font-semibold text-red-700">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="mb-1.5 flex items-center gap-1.5 text-sm font-bold text-slate-700">
              <Mail className="h-4 w-4 text-slate-400" />
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-bold text-slate-700">
              Password
            </label>
            <PasswordInput id="password" value={password} onChange={setPassword} required />
          </div>
          <Button type="submit" disabled={loading} className="w-full">
            <LogIn className="h-4 w-4" />
            {loading ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>

        <p className="mt-4 text-center text-sm">
          <Link to="/forgot-password" className="btn-link">
            Forgot password?
          </Link>
        </p>
        <p className="mt-4 text-center text-xs font-medium text-slate-400">
          Demo: owner@gym.com / Owner@123
        </p>
      </div>
    </div>
  );
}
