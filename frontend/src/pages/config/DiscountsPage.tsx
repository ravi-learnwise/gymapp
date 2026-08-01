import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

type Discount = {
  id: string;
  name: string;
  description: string | null;
  percentage: string | null;
  isActive: boolean;
};

export default function DiscountsPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Discount[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '', percentage: '' });
  const readOnly = user?.role === 'MANAGER';

  const load = () => api<Discount[]>('/config/discount-categories').then(setItems);
  useEffect(() => { load(); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || readOnly) return;
    await api('/config/discount-categories', { method: 'POST', body: JSON.stringify({ name }) });
    setName('');
    load();
  };

  const startEdit = (d: Discount) => {
    setEditingId(d.id);
    setEditForm({
      name: d.name,
      description: d.description ?? '',
      percentage: d.percentage ?? '',
    });
  };

  const save = async (id: string) => {
    await api(`/config/discount-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || undefined,
        percentage: editForm.percentage ? parseFloat(editForm.percentage) : undefined,
      }),
    });
    setEditingId(null);
    load();
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this discount category?')) return;
    await api(`/config/discount-categories/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Discount Categories</h2>
      {!readOnly && (
        <form onSubmit={add} className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Category name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
            Add
          </button>
        </form>
      )}
      <ul className="mt-6 space-y-2">
        {items.map((d) => (
          <li
            key={d.id}
            className={`rounded-lg border border-slate-200 bg-white px-4 py-3 ${!d.isActive ? 'opacity-50' : ''}`}
          >
            {editingId === d.id ? (
              <div className="space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded border px-3 py-2 text-sm font-medium" />
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" rows={2} className="w-full rounded border px-3 py-2 text-sm" />
                <input type="number" step="0.01" value={editForm.percentage} onChange={(e) => setEditForm({ ...editForm, percentage: e.target.value })} placeholder="Percentage off" className="w-32 rounded border px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => save(d.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">{d.name}</span>
                  {d.percentage && (
                    <span className="ml-2 text-sm text-slate-500">{Number(d.percentage)}% off</span>
                  )}
                  {d.description && <p className="text-sm text-slate-400">{d.description}</p>}
                  {!d.isActive && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                {!readOnly && d.isActive && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(d)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => deactivate(d.id)} className="text-sm text-red-600 hover:underline">Deactivate</button>
                  </div>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
