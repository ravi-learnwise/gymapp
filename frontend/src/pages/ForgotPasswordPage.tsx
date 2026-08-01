import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.forgotPassword(email);
      setMessage(res.message);
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="mt-1 text-sm text-slate-500">
          Enter your email and check the backend console for the reset link (dev mode).
        </p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-brand-600 py-2.5 text-sm font-medium text-white disabled:opacity-50"
          >
            {loading ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
        {message && <p className="mt-4 text-sm text-green-700">{message}</p>}
        <Link to="/login" className="mt-4 block text-center text-sm text-brand-600">
          Back to login
        </Link>
      </div>
    </div>
  );
}
