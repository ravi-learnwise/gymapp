import { FormEvent, Fragment, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import IconAction from '../../components/ui/IconAction';
import {
  LIST_TABLE_4_COL,
  LIST_TABLE_DURATION_COL,
  ListTable,
  ListTableBody,
  ListTableCols,
  ListTableEmpty,
  ListTableHead,
} from '../../components/ui/ListTable';

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
  const programColCount = readOnly ? 3 : 4;
  const programColWidths = readOnly ? LIST_TABLE_4_COL.slice(0, 3) : [...LIST_TABLE_4_COL];
  const durationColWidths = readOnly ? LIST_TABLE_DURATION_COL.slice(0, 4) : [...LIST_TABLE_DURATION_COL];
  const durationColCount = readOnly ? 4 : 5;

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
    <div className="w-full min-w-0">
      <h2 className="text-2xl">Membership Programs</h2>
      {!readOnly && (
        <form onSubmit={addProgram} className="list-table-toolbar flex gap-2">
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

      <ListTable>
        <ListTableCols widths={[...programColWidths]} />
        <ListTableHead>
          <tr>
            <th>Program</th>
            <th>Description</th>
            <th>Status</th>
            {!readOnly && <th className="list-table-actions-header">Actions</th>}
          </tr>
        </ListTableHead>
        <ListTableBody>
          {programs.length === 0 && <ListTableEmpty colSpan={programColCount} />}
          {programs.map((p) => (
            <Fragment key={p.id}>
              <tr className={!p.isActive ? 'opacity-50' : ''}>
                {editingId === p.id ? (
                  <>
                    <td>
                      <input
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-semibold"
                      />
                    </td>
                    <td>
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Description"
                        rows={2}
                        className="w-full rounded border border-slate-300 px-3 py-2 text-sm"
                      />
                    </td>
                    <td>{p.isActive ? 'Active' : 'Inactive'}</td>
                    {!readOnly && (
                      <td className="list-table-actions">
                        <div className="flex justify-end gap-2">
                          <button onClick={() => saveProgram(p.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">Save</button>
                          <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Cancel</button>
                        </div>
                      </td>
                    )}
                  </>
                ) : (
                  <>
                    <td className="font-semibold">{p.name}</td>
                    <td className="text-slate-600">{p.description || '—'}</td>
                    <td>
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${p.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                        {p.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    {!readOnly && (
                      <td className="list-table-actions">
                        <div className="inline-flex items-center justify-end gap-1">
                          <IconAction variant="edit" onClick={() => startEdit(p)} />
                          {p.isActive && (
                            <IconAction variant="deactivate" onClick={() => deactivateProgram(p.id)} />
                          )}
                        </div>
                      </td>
                    )}
                  </>
                )}
              </tr>

              <tr className="list-table-detail">
                <td colSpan={programColCount}>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-slate-500">
                    {p.name} — Durations
                  </p>
                  <ListTable className="!mt-0">
                    <ListTableCols widths={[...durationColWidths]} />
                    <ListTableHead>
                      <tr>
                        <th>Duration</th>
                        <th>Months</th>
                        <th>Price (₹)</th>
                        <th>Status</th>
                        {!readOnly && <th className="list-table-actions-header">Actions</th>}
                      </tr>
                    </ListTableHead>
                    <ListTableBody>
                      {p.durations.length === 0 && (
                        <ListTableEmpty colSpan={durationColCount} message="No durations added" />
                      )}
                      {p.durations.map((d) => (
                        <tr key={d.id} className={!d.isActive ? 'opacity-40' : ''}>
                          {editingDurationId === d.id ? (
                            <>
                              <td>
                                <input value={editDuration.label} onChange={(e) => setEditDuration({ ...editDuration, label: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                              </td>
                              <td>
                                <input type="number" value={editDuration.months} onChange={(e) => setEditDuration({ ...editDuration, months: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                              </td>
                              <td>
                                <input type="number" step="0.01" value={editDuration.price} onChange={(e) => setEditDuration({ ...editDuration, price: e.target.value })} className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm" />
                              </td>
                              <td>—</td>
                              {!readOnly && (
                                <td className="list-table-actions">
                                  <div className="flex justify-end gap-2 text-sm">
                                    <button onClick={() => saveDuration(d.id)} className="font-medium text-brand-600 hover:underline">Save</button>
                                    <button onClick={() => setEditingDurationId(null)} className="text-slate-500 hover:underline">Cancel</button>
                                  </div>
                                </td>
                              )}
                            </>
                          ) : (
                            <>
                              <td>{d.label}</td>
                              <td>{d.months}</td>
                              <td>{Number(d.price).toLocaleString()}</td>
                              <td>
                                <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${d.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                                  {d.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </td>
                              {!readOnly && (
                                <td className="list-table-actions">
                                  {d.isActive ? (
                                    <div className="inline-flex items-center justify-end gap-1">
                                      <IconAction variant="edit" onClick={() => startEditDuration(d)} />
                                      <IconAction variant="remove" onClick={() => deactivateDuration(d.id)} />
                                    </div>
                                  ) : null}
                                </td>
                              )}
                            </>
                          )}
                        </tr>
                      ))}
                    </ListTableBody>
                  </ListTable>

                  {!readOnly && p.isActive && (
                    addingDurationFor === p.id ? (
                      <form onSubmit={(e) => addDuration(p.id, e)} className="mt-4 flex flex-wrap gap-2 border-t border-slate-300 pt-4">
                        <input value={newDuration.label} onChange={(e) => setNewDuration({ ...newDuration, label: e.target.value })} placeholder="Label" required className="rounded border border-slate-300 px-2 py-1.5 text-sm" />
                        <input type="number" value={newDuration.months} onChange={(e) => setNewDuration({ ...newDuration, months: e.target.value })} placeholder="Months" required className="w-24 rounded border border-slate-300 px-2 py-1.5 text-sm" />
                        <input type="number" step="0.01" value={newDuration.price} onChange={(e) => setNewDuration({ ...newDuration, price: e.target.value })} placeholder="Price" required className="w-28 rounded border border-slate-300 px-2 py-1.5 text-sm" />
                        <button type="submit" className="rounded bg-brand-600 px-3 py-1.5 text-sm text-white">Add</button>
                        <button type="button" onClick={() => setAddingDurationFor(null)} className="rounded border border-slate-300 px-3 py-1.5 text-sm">Cancel</button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => { setAddingDurationFor(p.id); setNewDuration(emptyDuration); }}
                        className="mt-4 text-sm font-medium text-brand-600 hover:underline"
                      >
                        + Add duration
                      </button>
                    )
                  )}
                </td>
              </tr>
            </Fragment>
          ))}
        </ListTableBody>
      </ListTable>
    </div>
  );
}
