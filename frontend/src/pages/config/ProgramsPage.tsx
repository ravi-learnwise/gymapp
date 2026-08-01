import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';

type Duration = {
  id: string;
  label: string;
  months: number;
  price: string;
  isActive: boolean;
};

type Program = {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  durations: Duration[];
};

const emptyDuration = { label: '', months: '', price: '' };

export default function ProgramsPage() {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ name: '', description: '' });
  const [addingDurationFor, setAddingDurationFor] = useState<string | null>(null);
  const [newDuration, setNewDuration] = useState(emptyDuration);
  const [editingDurationId, setEditingDurationId] = useState<string | null>(null);
  const [editDuration, setEditDuration] = useState(emptyDuration);
  const readOnly = user?.role === 'MANAGER';

  const load = () => api<Program[]>('/config/programs').then(setPrograms);
  useEffect(() => { load(); }, []);

  const addProgram = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    await api('/config/programs', { method: 'POST', body: JSON.stringify({ name }) });
    setName('');
    load();
  };

  const startEdit = (p: Program) => {
    setEditingId(p.id);
    setEditForm({ name: p.name, description: p.description ?? '' });
  };

  const saveProgram = async (id: string) => {
    await api(`/config/programs/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        name: editForm.name,
        description: editForm.description || undefined,
      }),
    });
    setEditingId(null);
    load();
  };

  const deactivateProgram = async (id: string) => {
    if (!confirm('Deactivate this program?')) return;
    await api(`/config/programs/${id}`, { method: 'DELETE' });
    load();
  };

  const addDuration = async (programId: string, e: FormEvent) => {
    e.preventDefault();
    await api(`/config/programs/${programId}/durations`, {
      method: 'POST',
      body: JSON.stringify({
        label: newDuration.label,
        months: parseInt(newDuration.months, 10),
        price: parseFloat(newDuration.price),
      }),
    });
    setAddingDurationFor(null);
    setNewDuration(emptyDuration);
    load();
  };

  const startEditDuration = (d: Duration) => {
    setEditingDurationId(d.id);
    setEditDuration({ label: d.label, months: String(d.months), price: d.price });
  };

  const saveDuration = async (id: string) => {
    await api(`/config/durations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        label: editDuration.label,
        months: parseInt(editDuration.months, 10),
        price: parseFloat(editDuration.price),
      }),
    });
    setEditingDurationId(null);
    load();
  };

  const deactivateDuration = async (id: string) => {
    if (!confirm('Deactivate this duration?')) return;
    await api(`/config/durations/${id}`, { method: 'DELETE' });
    load();
  };

  return (
    <div>
      <h2 className="text-2xl font-bold">Membership Programs</h2>
      {!readOnly && (
        <form onSubmit={addProgram} className="mt-4 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="New program name"
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
            Add
          </button>
        </form>
      )}
      <div className="mt-6 space-y-4">
        {programs.map((p) => (
          <div key={p.id} className={`rounded-xl border border-slate-200 bg-white p-4 ${!p.isActive ? 'opacity-60' : ''}`}>
            {editingId === p.id ? (
              <div className="space-y-2">
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full rounded-lg border px-3 py-2 text-sm font-semibold"
                />
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  placeholder="Description"
                  rows={2}
                  className="w-full rounded-lg border px-3 py-2 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={() => saveProgram(p.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-lg border px-3 py-1.5 text-sm">Cancel</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h3 className="font-semibold">{p.name}</h3>
                  {p.description && <p className="mt-1 text-sm text-slate-500">{p.description}</p>}
                  {!p.isActive && <span className="text-xs text-red-500">Inactive</span>}
                </div>
                {!readOnly && (
                  <div className="flex shrink-0 gap-2">
                    <button onClick={() => startEdit(p)} className="text-sm text-brand-600 hover:underline">Edit</button>
                    {p.isActive && (
                      <button onClick={() => deactivateProgram(p.id)} className="text-sm text-red-600 hover:underline">Deactivate</button>
                    )}
                  </div>
                )}
              </div>
            )}

            <table className="mt-3 w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500">
                  <th className="pb-1">Duration</th>
                  <th>Months</th>
                  <th>Price (₹)</th>
                  {!readOnly && <th />}
                </tr>
              </thead>
              <tbody>
                {p.durations.map((d) => (
                  <tr key={d.id} className={!d.isActive ? 'opacity-40' : ''}>
                    {editingDurationId === d.id ? (
                      <>
                        <td className="py-1 pr-2">
                          <input value={editDuration.label} onChange={(e) => setEditDuration({ ...editDuration, label: e.target.value })} className="w-full rounded border px-2 py-1" />
                        </td>
                        <td className="pr-2">
                          <input type="number" value={editDuration.months} onChange={(e) => setEditDuration({ ...editDuration, months: e.target.value })} className="w-16 rounded border px-2 py-1" />
                        </td>
                        <td className="pr-2">
                          <input type="number" step="0.01" value={editDuration.price} onChange={(e) => setEditDuration({ ...editDuration, price: e.target.value })} className="w-24 rounded border px-2 py-1" />
                        </td>
                        <td className="space-x-2">
                          <button onClick={() => saveDuration(d.id)} className="text-brand-600 hover:underline">Save</button>
                          <button onClick={() => setEditingDurationId(null)} className="text-slate-500 hover:underline">Cancel</button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-1">{d.label}</td>
                        <td>{d.months}</td>
                        <td>{Number(d.price).toLocaleString()}</td>
                        {!readOnly && d.isActive && (
                          <td className="space-x-2 text-right">
                            <button onClick={() => startEditDuration(d)} className="text-brand-600 hover:underline">Edit</button>
                            <button onClick={() => deactivateDuration(d.id)} className="text-red-600 hover:underline">Remove</button>
                          </td>
                        )}
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>

            {!readOnly && p.isActive && (
              addingDurationFor === p.id ? (
                <form onSubmit={(e) => addDuration(p.id, e)} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
                  <input value={newDuration.label} onChange={(e) => setNewDuration({ ...newDuration, label: e.target.value })} placeholder="Label" required className="rounded border px-2 py-1 text-sm" />
                  <input type="number" value={newDuration.months} onChange={(e) => setNewDuration({ ...newDuration, months: e.target.value })} placeholder="Months" required className="w-20 rounded border px-2 py-1 text-sm" />
                  <input type="number" step="0.01" value={newDuration.price} onChange={(e) => setNewDuration({ ...newDuration, price: e.target.value })} placeholder="Price" required className="w-24 rounded border px-2 py-1 text-sm" />
                  <button type="submit" className="rounded bg-brand-600 px-3 py-1 text-sm text-white">Add</button>
                  <button type="button" onClick={() => setAddingDurationFor(null)} className="rounded border px-3 py-1 text-sm">Cancel</button>
                </form>
              ) : (
                <button onClick={() => { setAddingDurationFor(p.id); setNewDuration(emptyDuration); }} className="mt-3 text-sm text-brand-600 hover:underline">
                  + Add duration
                </button>
              )
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
