import { FormEvent, useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import IconAction from '../../components/ui/IconAction';
import {
  LIST_TABLE_4_COL,
  ListTable,
  ListTableBody,
  ListTableCols,
  ListTableEmpty,
  ListTableHead,
} from '../../components/ui/ListTable';

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
  const colCount = readOnly ? 3 : 4;
  const colWidths = readOnly ? LIST_TABLE_4_COL.slice(0, 3) : [...LIST_TABLE_4_COL];

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
    <div className="w-full min-w-0">
      <h2 className="text-2xl">Offer Categories</h2>
      {!readOnly && (
        <form onSubmit={add} className="list-table-toolbar flex gap-2">
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
      <ListTable>
        <ListTableCols widths={[...colWidths]} />
        <ListTableHead>
          <tr>
            <th>Name</th>
            <th>Description</th>
            <th>Status</th>
            {!readOnly && <th className="list-table-actions-header">Actions</th>}
          </tr>
        </ListTableHead>
        <ListTableBody>
          {items.length === 0 && <ListTableEmpty colSpan={colCount} />}
          {items.map((o) => (
            <tr key={o.id} className={!o.isActive ? 'opacity-50' : ''}>
              {editingId === o.id ? (
                <>
                  <td>
                    <input
                      value={editForm.name}
                      onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                      className="w-full rounded border border-slate-300 px-3 py-2 text-sm font-medium"
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
                  <td>{o.isActive ? 'Active' : 'Inactive'}</td>
                  {!readOnly && (
                    <td className="list-table-actions">
                      <div className="flex justify-end gap-2">
                        <button onClick={() => save(o.id)} className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm text-white">Save</button>
                        <button onClick={() => setEditingId(null)} className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm">Cancel</button>
                      </div>
                    </td>
                  )}
                </>
              ) : (
                <>
                  <td className="font-medium">{o.name}</td>
                  <td className="text-slate-600">{o.description || '—'}</td>
                  <td>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${o.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-700'}`}>
                      {o.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  {!readOnly && (
                    <td className="list-table-actions">
                      {o.isActive ? (
                        <div className="inline-flex items-center justify-end gap-1">
                          <IconAction variant="edit" onClick={() => startEdit(o)} />
                          <IconAction variant="deactivate" onClick={() => deactivate(o.id)} />
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
    </div>
  );
}
