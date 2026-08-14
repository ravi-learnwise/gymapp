import { FormEvent, useEffect, useState } from 'react';
import { Check, RotateCcw } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import IconAction, { IconActionLink } from '../../components/ui/IconAction';
import {
  LEAD_SOURCE_LABELS,
  NEXT_STATUSES,
  STATUS_COLORS,
  STATUS_LABELS,
  type EnquiryDetail,
  type EnquiryStatus,
} from '../../types/enquiry';

type Reminder = EnquiryDetail['reminders'][number];

export default function EnquiryDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [enquiry, setEnquiry] = useState<EnquiryDetail | null>(null);
  const [note, setNote] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [newStatus, setNewStatus] = useState<EnquiryStatus | ''>('');
  const [remindAt, setRemindAt] = useState('');
  const [reminderNote, setReminderNote] = useState('');
  const [message, setMessage] = useState('');
  const [editingReminder, setEditingReminder] = useState<Reminder | null>(null);
  const [editRemindAt, setEditRemindAt] = useState('');
  const [editReminderNote, setEditReminderNote] = useState('');

  const load = () => {
    if (id) api<EnquiryDetail>(`/enquiries/${id}`).then(setEnquiry);
  };

  useEffect(() => { load(); }, [id]);

  if (!enquiry) return <p className="text-slate-500">Loading…</p>;

  const isClosed = enquiry.status === 'CONVERTED' || enquiry.status === 'LOST';
  const nextStatuses = NEXT_STATUSES[enquiry.status];

  const discountDisplay = enquiry.offeredFlatDiscount
    ? `₹${enquiry.offeredFlatDiscount} (flat)`
    : enquiry.offeredDiscount?.name
      ? `${enquiry.offeredDiscount.name}${enquiry.offeredDiscount.percentage ? ` (${enquiry.offeredDiscount.percentage}%)` : ''}`
      : null;

  const addNote = async (e: FormEvent) => {
    e.preventDefault();
    if (!note.trim()) return;
    await api(`/enquiries/${id}/notes`, {
      method: 'POST',
      body: JSON.stringify({ content: note }),
    });
    setNote('');
    load();
  };

  const changeStatus = async (e: FormEvent) => {
    e.preventDefault();
    if (!newStatus) return;
    await api(`/enquiries/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus, note: statusNote || undefined }),
    });
    setNewStatus('');
    setStatusNote('');
    setMessage('Status updated');
    load();
  };

  const scheduleReminder = async (e: FormEvent) => {
    e.preventDefault();
    if (!remindAt) return;
    await api(`/enquiries/${id}/reminders`, {
      method: 'POST',
      body: JSON.stringify({ remindAt, note: reminderNote || undefined }),
    });
    setRemindAt('');
    setReminderNote('');
    load();
  };

  const completeReminder = async (reminderId: string) => {
    await api(`/enquiries/${id}/reminders/${reminderId}/complete`, { method: 'PATCH' });
    load();
  };

  const reopenReminder = async (reminderId: string) => {
    await api(`/enquiries/${id}/reminders/${reminderId}/reopen`, { method: 'PATCH' });
    load();
  };

  const deleteReminder = async (reminderId: string) => {
    if (!window.confirm('Delete this reminder?')) return;
    await api(`/enquiries/${id}/reminders/${reminderId}`, { method: 'DELETE' });
    load();
  };

  const startEditReminder = (r: Reminder) => {
    setEditingReminder(r);
    setEditRemindAt(r.remindAt.slice(0, 16));
    setEditReminderNote(r.note ?? '');
  };

  const saveEditReminder = async (e: FormEvent) => {
    e.preventDefault();
    if (!editingReminder) return;
    await api(`/enquiries/${id}/reminders/${editingReminder.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        remindAt: editRemindAt,
        note: editReminderNote || undefined,
      }),
    });
    setEditingReminder(null);
    load();
  };

  const timeline = [
    ...enquiry.statusHistory.map((h) => ({
      type: 'status' as const,
      date: h.createdAt,
      text: `${h.fromStatus ? STATUS_LABELS[h.fromStatus] : 'Created'} → ${STATUS_LABELS[h.toStatus]}`,
      by: h.changedBy,
    })),
    ...enquiry.notes.map((n) => ({
      type: 'note' as const,
      date: n.createdAt,
      text: n.content,
      by: n.createdBy,
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="max-w-4xl">
      <Link to="/enquiries" className="text-sm text-brand-600 hover:underline">← All Enquiries</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl">{enquiry.fullName}</h2>
            <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[enquiry.status]}`}>
              {STATUS_LABELS[enquiry.status]}
            </span>
          </div>
          <p className="text-sm text-slate-500">{enquiry.enquiryNumber}</p>
        </div>
        {!isClosed && (
          <div className="flex gap-2">
            <Link
              to={`/enrollments/new?enquiryId=${id}`}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white hover:bg-brand-700"
            >
              Start Enrollment
            </Link>
            <IconActionLink variant="edit" to={`/enquiries/${id}/edit`} />
          </div>
        )}
        {enquiry.status === 'CONVERTED' && enquiry.member && (
          <Link
            to={`/members/${enquiry.member.id}`}
            className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-sm text-green-800 hover:bg-green-100"
          >
            View Member ({enquiry.member.memberNumber})
          </Link>
        )}
      </div>

      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Contact Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Mobile" value={enquiry.mobileNumber} />
            <Row label="Alt. Contact" value={enquiry.alternateContact} />
            <Row label="Email" value={enquiry.email} />
            <Row label="Age / Gender" value={[enquiry.age, enquiry.gender].filter(Boolean).join(' / ') || '—'} />
            <Row label="Profession" value={enquiry.profession} />
            <Row label="Address" value={enquiry.address} />
            <Row label="Family" value={enquiry.familyDetails} />
            <Row label="Preferred Time" value={enquiry.preferredContactTime} />
            <Row label="Lead Source" value={LEAD_SOURCE_LABELS[enquiry.leadSource]} />
            <Row label="Enquiry Date" value={new Date(enquiry.dateOfEnquiry).toLocaleDateString()} />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold text-slate-900">Offer Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Program" value={enquiry.offeredProgram?.name} />
            <Row
              label="Duration"
              value={
                enquiry.offeredProgramDuration
                  ? `${enquiry.offeredProgramDuration.label} (${enquiry.offeredProgramDuration.months} mo · ₹${enquiry.offeredProgramDuration.price})`
                  : null
              }
            />
            <Row label="Discount" value={discountDisplay} />
            <Row label="Offer Category" value={enquiry.offerCategory?.name} />
            <Row
              label="Valid Till"
              value={enquiry.offerValidTill ? new Date(enquiry.offerValidTill).toLocaleDateString() : null}
            />
          </dl>

          {!isClosed && nextStatuses.length > 0 && (
            <form onSubmit={changeStatus} className="mt-4 space-y-2 border-t pt-4">
              <h4 className="text-sm font-medium">Update Status</h4>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as EnquiryStatus)}
                className="w-full rounded-lg border px-3 py-2 text-sm"
              >
                <option value="">Select next status…</option>
                {nextStatuses.map((s) => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </select>
              <input
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
                placeholder="Note (optional)"
                className="w-full rounded-lg border px-3 py-2 text-sm"
              />
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
                Update Status
              </button>
            </form>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Follow-up Reminders</h3>
        <ul className="mt-3 space-y-2">
          {enquiry.reminders.map((r) => (
            <li
              key={r.id}
              className={`flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm ${r.completed ? 'opacity-60' : ''}`}
            >
              <span className={r.completed ? 'line-through' : ''}>
                {new Date(r.remindAt).toLocaleString()}
                {r.note && ` — ${r.note}`}
              </span>
              <div className="flex items-center gap-1">
                {!r.completed && !isClosed && (
                  <>
                    <IconAction variant="edit" onClick={() => startEditReminder(r)} />
                    <button
                      type="button"
                      onClick={() => completeReminder(r.id)}
                      title="Mark done"
                      aria-label="Mark done"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-emerald-700 shadow-sm transition-colors hover:border-emerald-200 hover:bg-emerald-50"
                    >
                      <Check className="h-4 w-4" strokeWidth={2.25} />
                    </button>
                    <IconAction variant="delete" onClick={() => deleteReminder(r.id)} />
                  </>
                )}
                {r.completed && !isClosed && (
                  <button
                    type="button"
                    onClick={() => reopenReminder(r.id)}
                    title="Undo"
                    aria-label="Undo"
                    className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
                  >
                    <RotateCcw className="h-4 w-4" strokeWidth={2.25} />
                  </button>
                )}
              </div>
            </li>
          ))}
          {enquiry.reminders.length === 0 && (
            <li className="text-sm text-slate-400">No reminders scheduled</li>
          )}
        </ul>

        {editingReminder && !isClosed && (
          <form onSubmit={saveEditReminder} className="mt-3 flex flex-wrap gap-2 rounded-lg border border-brand-200 bg-brand-50 p-3">
            <input
              type="datetime-local"
              value={editRemindAt}
              onChange={(e) => setEditRemindAt(e.target.value)}
              required
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={editReminderNote}
              onChange={(e) => setEditReminderNote(e.target.value)}
              placeholder="Reminder note"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg bg-brand-600 px-3 py-2 text-sm text-white">Save</button>
            <button type="button" onClick={() => setEditingReminder(null)} className="rounded-lg border px-3 py-2 text-sm">Cancel</button>
          </form>
        )}

        {!isClosed && (
          <form onSubmit={scheduleReminder} className="mt-3 flex flex-wrap gap-2">
            <input
              type="datetime-local"
              value={remindAt}
              onChange={(e) => setRemindAt(e.target.value)}
              required
              className="rounded-lg border px-3 py-2 text-sm"
            />
            <input
              value={reminderNote}
              onChange={(e) => setReminderNote(e.target.value)}
              placeholder="Reminder note"
              className="flex-1 rounded-lg border px-3 py-2 text-sm"
            />
            <button type="submit" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">
              Schedule
            </button>
          </form>
        )}
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Timeline</h3>
        <ul className="mt-4 space-y-4">
          {timeline.map((item, i) => (
            <li key={i} className="flex gap-3 text-sm">
              <div className="mt-1 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
              <div>
                <p className="text-xs text-slate-400">
                  {new Date(item.date).toLocaleString()} ·{' '}
                  {[item.by.firstName, item.by.lastName].filter(Boolean).join(' ') || item.by.email}
                </p>
                <p className={item.type === 'status' ? 'font-medium text-slate-700' : 'text-slate-600'}>
                  {item.text}
                </p>
              </div>
            </li>
          ))}
        </ul>

        <form onSubmit={addNote} className="mt-4 flex gap-2 border-t pt-4">
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note…"
            className="flex-1 rounded-lg border px-3 py-2 text-sm"
          />
          <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">
            Add Note
          </button>
        </form>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex gap-2">
      <dt className="w-32 shrink-0 text-slate-500">{label}</dt>
      <dd className="text-slate-800">{value || '—'}</dd>
    </div>
  );
}
