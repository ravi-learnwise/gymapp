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
    <div className="flex min-h-screen items-center justify-center bg-canvas px-4">
      <div className="w-full max-w-md rounded-xl border border-line bg-white p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-brand-600 text-white">
            <Dumbbell className="h-6 w-6" strokeWidth={2} />
          </div>
          <h1 className="text-2xl font-semibold text-ink">GymApp</h1>
          <p className="mt-1 text-sm text-ink-muted">Sign in to your account</p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-lg border border-danger-border bg-danger-soft px-3 py-2.5 text-sm text-danger">
              {error}
            </div>
          )}
          <div>
            <label htmlFor="email" className="form-label flex items-center gap-1.5">
              <Mail className="h-4 w-4 text-ink-muted" />
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
            <label htmlFor="password" className="form-label">
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
        <p className="mt-4 text-center text-xs text-ink-muted">
          Demo: owner@gym.com / Owner@123
        </p>
      </div>
    </div>
  );
}
