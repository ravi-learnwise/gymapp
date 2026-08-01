import { FormEvent, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  formatCurrency,
  PAYMENT_MODE_LABELS,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  type PaymentDetail,
  type PaymentMode,
  type Receipt,
} from '../../types/payment';

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [message, setMessage] = useState('');
  const [payForm, setPayForm] = useState({ amount: '', paymentMode: 'CASH' as PaymentMode, notes: '' });
  const [editForm, setEditForm] = useState({ discountAmount: '', gstPercent: '', commitmentNotes: '', commitmentDate: '' });
  const [remindAt, setRemindAt] = useState('');
  const [reminderNote, setReminderNote] = useState('');

  const load = () => {
    if (id) api<PaymentDetail>(`/payments/${id}`).then((p) => {
      setPayment(p);
      setEditForm({
        discountAmount: p.discountAmount,
        gstPercent: p.gstPercent ?? '',
        commitmentNotes: p.commitmentNotes ?? '',
        commitmentDate: p.commitmentDate ? p.commitmentDate.slice(0, 10) : '',
      });
    });
  };

  useEffect(() => { load(); }, [id]);

  if (!payment) return <p className="text-slate-500">Loading…</p>;

  const recordPayment = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/payments/${id}/transactions`, {
      method: 'POST',
      body: JSON.stringify({
        amount: parseFloat(payForm.amount),
        paymentMode: payForm.paymentMode,
        notes: payForm.notes || undefined,
      }),
    });
    setPayForm({ amount: '', paymentMode: 'CASH', notes: '' });
    setMessage('Payment recorded');
    load();
  };

  const updateCommitment = async (e: FormEvent) => {
    e.preventDefault();
    await api(`/payments/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        discountAmount: editForm.discountAmount ? parseFloat(editForm.discountAmount) : undefined,
        gstPercent: editForm.gstPercent ? parseFloat(editForm.gstPercent) : undefined,
        commitmentNotes: editForm.commitmentNotes || undefined,
        commitmentDate: editForm.commitmentDate || undefined,
      }),
    });
    setMessage('Commitment updated');
    load();
  };

  const scheduleReminder = async (e: FormEvent) => {
    e.preventDefault();
    if (!remindAt) return;
    await api(`/payments/${id}/reminders`, {
      method: 'POST',
      body: JSON.stringify({ remindAt, note: reminderNote || undefined }),
    });
    setRemindAt('');
    setReminderNote('');
    load();
  };

  const completeReminder = async (reminderId: string) => {
    await api(`/payments/${id}/reminders/${reminderId}/complete`, { method: 'PATCH' });
    load();
  };

  const viewReceipt = async (transactionId: string) => {
    const data = await api<Receipt>(`/payments/${id}/receipt/${transactionId}`);
    setReceipt(data);
  };

  const printReceipt = () => window.print();

  return (
    <div className="max-w-4xl">
      <Link to="/payments" className="text-sm text-brand-600 hover:underline">← All Payments</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{payment.member.fullName}</h2>
          <p className="text-sm text-slate-500">
            {payment.member.memberNumber} · {payment.membership.program.name}
          </p>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-medium ${PAYMENT_STATUS_COLORS[payment.status]}`}>
          {PAYMENT_STATUS_LABELS[payment.status]}
        </span>
      </div>

      {message && <p className="mt-2 text-sm text-green-600">{message}</p>}

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AmountCard label="Total Fee" value={formatCurrency(payment.totalFee)} />
        <AmountCard label="Discount" value={formatCurrency(payment.discountAmount)} />
        <AmountCard label="Final Amount" value={formatCurrency(payment.finalAmount)} />
        <AmountCard label="Pending" value={formatCurrency(payment.pendingAmount)} highlight />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {payment.status !== 'PAID' && (
          <form onSubmit={recordPayment} className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">Record Payment</h3>
            <div className="mt-3 space-y-3">
              <input type="number" step="0.01" required value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} placeholder={`Amount (max ${payment.pendingAmount})`} className="w-full rounded-lg border px-3 py-2 text-sm" />
              <select value={payForm.paymentMode} onChange={(e) => setPayForm({ ...payForm, paymentMode: e.target.value as PaymentMode })} className="w-full rounded-lg border px-3 py-2 text-sm">
                {Object.entries(PAYMENT_MODE_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
              <input value={payForm.notes} onChange={(e) => setPayForm({ ...payForm, notes: e.target.value })} placeholder="Notes (optional)" className="w-full rounded-lg border px-3 py-2 text-sm" />
              <button type="submit" className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Record & Generate Receipt</button>
            </div>
          </form>
        )}

        <form onSubmit={updateCommitment} className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Commitment Details</h3>
          <div className="mt-3 space-y-3">
            <label className="block text-sm">
              Discount (₹)
              <input type="number" step="0.01" value={editForm.discountAmount} onChange={(e) => setEditForm({ ...editForm, discountAmount: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              GST %
              <input type="number" step="0.01" value={editForm.gstPercent} onChange={(e) => setEditForm({ ...editForm, gstPercent: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <label className="block text-sm">
              Commitment Date
              <input type="date" value={editForm.commitmentDate} onChange={(e) => setEditForm({ ...editForm, commitmentDate: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2 text-sm" />
            </label>
            <textarea value={editForm.commitmentNotes} onChange={(e) => setEditForm({ ...editForm, commitmentNotes: e.target.value })} placeholder="Commitment notes" rows={2} className="w-full rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Update Commitment</button>
          </div>
        </form>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Payment History</h3>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-slate-500">
            <tr>
              <th className="pb-2">Receipt</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Amount</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {payment.transactions.map((t) => (
              <tr key={t.id} className="border-t">
                <td className="py-2 font-medium">{t.receiptNumber}</td>
                <td>{new Date(t.paymentDate).toLocaleDateString()}</td>
                <td>{PAYMENT_MODE_LABELS[t.paymentMode]}</td>
                <td>{formatCurrency(t.amount)}</td>
                <td>
                  <button onClick={() => viewReceipt(t.id)} className="text-brand-600 hover:underline">View Receipt</button>
                </td>
              </tr>
            ))}
            {payment.transactions.length === 0 && (
              <tr><td colSpan={5} className="py-4 text-slate-400">No payments recorded yet</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Due Reminders</h3>
        <ul className="mt-3 space-y-2">
          {payment.reminders.map((r) => (
            <li key={r.id} className={`flex items-center justify-between rounded-lg border px-3 py-2 text-sm ${r.completed ? 'opacity-50 line-through' : ''}`}>
              <span>{new Date(r.remindAt).toLocaleString()}{r.note && ` — ${r.note}`}</span>
              {!r.completed && (
                <button onClick={() => completeReminder(r.id)} className="text-brand-600 hover:underline">Done</button>
              )}
            </li>
          ))}
        </ul>
        {payment.status !== 'PAID' && (
          <form onSubmit={scheduleReminder} className="mt-3 flex flex-wrap gap-2 border-t pt-3">
            <input type="datetime-local" value={remindAt} onChange={(e) => setRemindAt(e.target.value)} required className="rounded-lg border px-3 py-2 text-sm" />
            <input value={reminderNote} onChange={(e) => setReminderNote(e.target.value)} placeholder="Reminder note" className="flex-1 rounded-lg border px-3 py-2 text-sm" />
            <button type="submit" className="rounded-lg border px-4 py-2 text-sm hover:bg-slate-50">Schedule</button>
          </form>
        )}
      </div>

      {receipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 print:relative print:inset-auto print:bg-transparent print:p-0">
          <div className="max-h-[90vh] w-full max-w-md overflow-auto rounded-xl bg-white p-6 shadow-xl print:max-h-none print:shadow-none">
            <div className="text-center">
              <h3 className="text-lg font-bold">{receipt.gym.name}</h3>
              {receipt.gym.address && <p className="text-xs text-slate-500">{receipt.gym.address}</p>}
              {receipt.gym.gstNumber && <p className="text-xs text-slate-500">GST: {receipt.gym.gstNumber}</p>}
            </div>
            <hr className="my-4" />
            <p className="text-center font-semibold">Payment Receipt</p>
            <p className="text-center text-sm text-slate-500">{receipt.receiptNumber}</p>
            <dl className="mt-4 space-y-1 text-sm">
              <Row label="Member" value={`${receipt.member.fullName} (${receipt.member.memberNumber})`} />
              <Row label="Program" value={receipt.program} />
              <Row label="Date" value={new Date(receipt.paymentDate).toLocaleString()} />
              <Row label="Mode" value={PAYMENT_MODE_LABELS[receipt.paymentMode]} />
              <Row label="Amount Paid" value={formatCurrency(receipt.amount)} />
              <Row label="Total Fee" value={formatCurrency(receipt.totalFee)} />
              <Row label="Discount" value={formatCurrency(receipt.discountAmount)} />
              <Row label="Final Amount" value={formatCurrency(receipt.finalAmount)} />
              <Row label="Balance" value={formatCurrency(receipt.pendingAmount)} />
              {Number(receipt.gstAmount) > 0 && <Row label="GST" value={formatCurrency(receipt.gstAmount)} />}
            </dl>
            <div className="mt-6 flex justify-end gap-2 print:hidden">
              <button onClick={() => setReceipt(null)} className="rounded-lg border px-4 py-2 text-sm">Close</button>
              <button onClick={printReceipt} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white">Print</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AmountCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className={`rounded-xl border p-4 ${highlight ? 'border-red-200 bg-red-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-1 text-lg font-bold">{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium">{value}</dd>
    </div>
  );
}
