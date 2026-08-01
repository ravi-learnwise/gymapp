import { FormEvent, useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, authApi, type AuthUser, type UserRole } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function UsersPage() {
  const { user } = useAuth();
  const [users, setUsers] = useState<AuthUser[]>([]);
  const [form, setForm] = useState({
    email: '',
    password: '',
    role: 'MANAGER' as UserRole,
    firstName: '',
    lastName: '',
  });

  const load = () => api<AuthUser[]>('/users').then(setUsers);
  useEffect(() => { load(); }, []);

  if (user?.role !== 'OWNER') {
    return <Navigate to="/dashboard" replace />;
  }

  const create = async (e: FormEvent) => {
    e.preventDefault();
    await api('/users', { method: 'POST', body: JSON.stringify(form) });
    setForm({ email: '', password: '', role: 'MANAGER', firstName: '', lastName: '' });
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">User Management</h2>
      <form onSubmit={create} className="mt-4 grid max-w-lg gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <h3 className="font-medium">Add user</h3>
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
          minLength={6}
          className="rounded-lg border px-3 py-2 text-sm"
        />
        <select
          value={form.role}
          onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
          className="rounded-lg border px-3 py-2 text-sm"
        >
          <option value="MANAGER">Manager</option>
          <option value="TRAINER">Trainer</option>
          <option value="OWNER">Owner</option>
        </select>
        <button type="submit" className="rounded-lg bg-brand-600 py-2 text-sm text-white">
          Create user
        </button>
      </form>
      <table className="mt-6 w-full text-sm">
        <thead>
          <tr className="border-b text-left text-slate-500">
            <th className="pb-2">Email</th>
            <th>Role</th>
            <th>Name</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id} className="border-b border-slate-100">
              <td className="py-2">{u.email}</td>
              <td className="capitalize">{u.role.toLowerCase()}</td>
              <td>{[u.firstName, u.lastName].filter(Boolean).join(' ')}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    phone: user?.phone || '',
  });
  const [passwords, setPasswords] = useState({ current: '', newPass: '' });
  const [message, setMessage] = useState('');

  const saveProfile = async (e: FormEvent) => {
    e.preventDefault();
    await authApi.updateProfile(profile);
    await refreshUser();
    setMessage('Profile updated');
  };

  const changePassword = async (e: FormEvent) => {
    e.preventDefault();
    await authApi.changePassword(passwords.current, passwords.newPass);
    setPasswords({ current: '', newPass: '' });
    setMessage('Password changed');
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">My Profile</h2>
      <p className="text-sm text-slate-500">{user?.email} · {user?.role}</p>
      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}

      <form onSubmit={saveProfile} className="mt-6 max-w-md space-y-3">
        <h3 className="font-medium">Profile details</h3>
        {(['firstName', 'lastName', 'phone'] as const).map((f) => (
          <input
            key={f}
            placeholder={f}
            value={profile[f]}
            onChange={(e) => setProfile({ ...profile, [f]: e.target.value })}
            className="w-full rounded-lg border px-3 py-2 text-sm"
          />
        ))}
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
          Save profile
        </button>
      </form>

      <form onSubmit={changePassword} className="mt-8 max-w-md space-y-3">
        <h3 className="font-medium">Change password</h3>
        <input
          type="password"
          placeholder="Current password"
          value={passwords.current}
          onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <input
          type="password"
          placeholder="New password"
          value={passwords.newPass}
          onChange={(e) => setPasswords({ ...passwords, newPass: e.target.value })}
          minLength={6}
          className="w-full rounded-lg border px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
          Change password
        </button>
      </form>
    </div>
  );
}
