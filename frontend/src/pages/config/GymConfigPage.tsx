import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

type GymConfig = {
  id: string;
  name: string;
  address: string | null;
  gstNumber: string | null;
  logoUrl: string | null;
  attendanceEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
};

function gymConfigPatchBody(config: GymConfig) {
  return {
    name: config.name,
    address: config.address,
    gstNumber: config.gstNumber,
    logoUrl: config.logoUrl,
    attendanceEnabled: config.attendanceEnabled,
  };
}

export default function GymConfigPage() {
  const { user } = useAuth();
  const [config, setConfig] = useState<GymConfig | null>(null);
  const [message, setMessage] = useState('');
  const readOnly = user?.role === 'MANAGER';

  useEffect(() => {
    api<GymConfig>('/config/gym').then(setConfig);
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!config || readOnly) return;
    try {
      const updated = await api<GymConfig>('/config/gym', {
        method: 'PATCH',
        body: JSON.stringify(gymConfigPatchBody(config)),
      });
      setConfig(updated);
      setMessage('Saved successfully');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Save failed');
    }
  };

  if (!config) return <p className="text-slate-500">Loading…</p>;

  return (
    <div>
      <h2 className="text-2xl font-bold">Gym Information</h2>
      {readOnly && (
        <p className="mt-1 text-sm text-amber-600">Read-only (Manager access)</p>
      )}
      <form onSubmit={handleSubmit} className="mt-6 max-w-lg space-y-4">
        {['name', 'address', 'gstNumber', 'logoUrl'].map((field) => (
          <div key={field}>
            <label className="mb-1 block text-sm font-medium capitalize">
              {field === 'gstNumber' ? 'GST Number' : field === 'logoUrl' ? 'Logo URL' : field}
            </label>
            <input
              value={(config as Record<string, string | boolean | null>)[field] as string || ''}
              onChange={(e) => setConfig({ ...config, [field]: e.target.value })}
              disabled={readOnly}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            />
          </div>
        ))}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={config.attendanceEnabled}
            onChange={(e) =>
              setConfig({ ...config, attendanceEnabled: e.target.checked })
            }
            disabled={readOnly}
          />
          Attendance module enabled
        </label>
        {!readOnly && (
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
            Save
          </button>
        )}
        {message && <p className="text-sm text-green-600">{message}</p>}
      </form>
    </div>
  );
}
