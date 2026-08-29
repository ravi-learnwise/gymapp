import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api';
import ConfirmDialog from '../../components/ui/ConfirmDialog';
import IconAction, { IconActionLink } from '../../components/ui/IconAction';
import {
  LIST_TABLE_4_COL,
  ListTable,
  ListTableBody,
  ListTableCols,
  ListTableEmpty,
  ListTableHead,
} from '../../components/ui/ListTable';
import { staffName } from '../../lib/plan-templates';
import type { TrainingPlanTemplateListItem } from '../../types/training-card';

export default function TrainingPlanTemplateListPage() {
  const [items, setItems] = useState<TrainingPlanTemplateListItem[]>([]);
  const [search, setSearch] = useState('');
  const [deactivateId, setDeactivateId] = useState<string | null>(null);
  const [message, setMessage] = useState('');

  const load = () =>
    api<TrainingPlanTemplateListItem[]>('/training-plan-templates').then(setItems);

  useEffect(() => {
    load();
  }, []);

  const deactivate = async () => {
    if (!deactivateId) return;
    try {
      await api(`/training-plan-templates/${deactivateId}/deactivate`, {
        method: 'POST',
        body: '{}',
      });
      setMessage('Template deactivated');
      setDeactivateId(null);
      load();
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Deactivate failed');
    }
  };

  const filtered = items.filter((t) =>
    t.name.toLowerCase().includes(search.trim().toLowerCase()),
  );

  return (
    <div className="max-w-5xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl">Training Plan Templates</h2>
          <p className="mt-1 text-sm text-ink-secondary">
            Gym-level weekly workout recipes. Trainers can apply these when assigning a member plan.
          </p>
        </div>
        <Link to="/config/training-templates/new" className="btn btn-primary">
          New template
        </Link>
      </div>

      <input
        className="input-field mt-6 !h-11 max-w-md"
        placeholder="Search by name"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="mt-4">
        <ListTable>
          <ListTableCols widths={[...LIST_TABLE_4_COL]} />
          <ListTableHead>
            <tr>
              <th>Name</th>
              <th>Description</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </ListTableHead>
          <ListTableBody>
            {filtered.map((t) => (
              <tr key={t.id}>
                <td>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-ink-muted">By {staffName(t.createdBy)}</p>
                </td>
                <td className="text-sm text-ink-secondary">{t.description || '—'}</td>
                <td>{t.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <div className="flex gap-2">
                    <IconActionLink variant="edit" to={`/config/training-templates/${t.id}/edit`} />
                    {t.isActive && (
                      <IconAction variant="deactivate" onClick={() => setDeactivateId(t.id)} />
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {!filtered.length && <ListTableEmpty colSpan={4} message="No training plan templates" />}
          </ListTableBody>
        </ListTable>
      </div>
      {message && <p className="mt-3 text-sm text-ink-secondary">{message}</p>}

      <ConfirmDialog
        open={!!deactivateId}
        title="Deactivate template?"
        message="It will no longer appear when assigning plans to members. Existing member plans are not changed."
        confirmLabel="Deactivate"
        onConfirm={deactivate}
        onCancel={() => setDeactivateId(null)}
      />
    </div>
  );
}
