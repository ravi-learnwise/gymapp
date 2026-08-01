import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

type Offer = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
};

export default function OffersPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<Offer[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const readOnly = user?.role === 'MANAGER';

  const load = () => api<Offer[]>('/config/offer-categories').then(setItems);
  useEffect(() => { load(); }, []);

  const add = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || readOnly) return;
    await api('/config/offer-categories', { method: 'POST', body: JSON.stringify({ name }) });
    setName('');
    load();
  };

  const startEdit = (o: Offer) => {
    setEditingId(o.id);
    setEditForm({ name: o.name, description: o.description ?? '' });
  };

  const save = async (id: string) => {
    await api(`/config/offer-categories/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || undefined,
      }),
    });
    setEditingId(null);
    load();
  };

  const deactivate = async (id: string) => {
    if (!confirm('Deactivate this offer category?')) return;
    await api(`/config/offer-categories/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Offer Categories</h2>
      {!readOnly && (
        <form onSubmit={add} className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Offer name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
            Add
          </button>
        </form>
      )}
      <ul className="mt-6 space-y-2">
        {items.map((o) => (
          <li
            key={o.id}
            className={`rounded-lg border border-slate-200 bg-white px-4 py-3 ${!o.isActive ? 'opacity-50' : ''}`}
          >
            {editingId === o.id ? (
              <div className="space-y-2">
                <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded border px-3 py-2 text-sm font-medium" />
                <textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} placeholder="Description" rows={2} className="w-full rounded border px-3 py-2 text-sm" />
                <div className="flex gap-2">
                  <button onClick={() => save(o.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="font-medium">{o.name}</span>
                  {o.description && <p className="text-sm text-slate-400">{o.description}</p>}
                  {!o.isActive && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                {!readOnly && o.isActive && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(o)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    <button onClick={() => deactivate(o.id)} className="text-sm text-red-600 hover:underline">Deactivate</button>
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
