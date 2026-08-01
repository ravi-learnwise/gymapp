import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { GENDER_LABELS, type Gender } from '../../types/enquiry';
import { trainerName, type Member } from '../../types/member';
import {
  formatCurrency,
  PAYMENT_STATUS_COLORS,
  PAYMENT_STATUS_LABELS,
  type PaymentCommitmentSummary,
} from '../../types/payment';

export default function MemberDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [member, setMember] = useState<Member | null>(null);
  const [payments, setPayments] = useState<PaymentCommitmentSummary[]>([]);

  useEffect(() => {
    if (id) {
      api<Member>(`/members/${id}`).then(setMember);
      if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
        api<PaymentCommitmentSummary[]>(`/payments/member/${id}`).then(setPayments).catch(() => {});
      }
    }
  }, [id, user]);

  if (!member) return <p className="text-slate-500">Loading…</p>;

  const canEdit = user?.role === 'OWNER' || user?.role === 'MANAGER';

  return (
    <div className="max-w-4xl">
      <Link to="/members" className="text-sm text-brand-600 hover:underline">← All Members</Link>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">{member.fullName}</h2>
          <p className="text-sm text-slate-500">{member.memberNumber}</p>
        </div>
        {member.sourceEnquiry && (
          <Link
            to={`/enquiries/${member.sourceEnquiry.id}`}
            className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
          >
            Source: {member.sourceEnquiry.enquiryNumber}
          </Link>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Contact Details</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Mobile" value={member.mobileNumber} />
            <Row label="Alt. Contact" value={member.alternateContact} />
            <Row label="Email" value={member.email} />
            <Row label="Gender" value={member.gender ? GENDER_LABELS[member.gender as Gender] : null} />
            <Row label="Profession" value={member.profession} />
            <Row label="Address" value={member.address} />
            <Row label="DOB" value={member.dateOfBirth ? new Date(member.dateOfBirth).toLocaleDateString() : null} />
          </dl>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Health Profile</h3>
          <dl className="mt-3 space-y-2 text-sm">
            <Row label="Height" value={member.height ? `${member.height} cm` : null} />
            <Row label="Weight" value={member.weight ? `${member.weight} kg` : null} />
            <Row label="BMI" value={member.bmi} />
            <Row label="Diet Type" value={member.dietType} />
            <Row label="Allergies" value={member.allergies} />
            <Row label="Medical History" value={member.medicalHistory} />
            <Row label="Sports" value={member.sportsParticipation} />
            <Row label="Fitness Goals" value={member.fitnessGoals} />
          </dl>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="font-semibold">Memberships</h3>
        <ul className="mt-3 space-y-3">
          {member.memberships?.map((m) => (
            <li key={m.id} className="rounded-lg border px-4 py-3 text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{m.program.name}</span>
                <span className={`rounded-full px-2 py-0.5 text-xs ${m.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-slate-100'}`}>
                  {m.status}{m.isTrial ? ' · Trial' : ''}
                </span>
              </div>
              <p className="mt-1 text-slate-500">
                {m.programDuration?.label} · {new Date(m.startDate).toLocaleDateString()} → {new Date(m.endDate).toLocaleDateString()}
              </p>
              <p className="text-slate-500">Trainer: {trainerName(m.trainer)}</p>
            </li>
          ))}
          {!member.memberships?.length && <li className="text-slate-400">No memberships</li>}
        </ul>
      </div>

      {canEdit && payments.length > 0 && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
          <h3 className="font-semibold">Payments</h3>
          <ul className="mt-3 space-y-2">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between rounded-lg border px-4 py-3 text-sm">
                <div>
                  <Link to={`/payments/${p.id}`} className="font-medium text-brand-600 hover:underline">
                    {p.membership.program.name}
                  </Link>
                  <p className="text-slate-500">
                    {formatCurrency(p.amountPaid)} / {formatCurrency(p.finalAmount)} · Pending {formatCurrency(p.pendingAmount)}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs ${PAYMENT_STATUS_COLORS[p.status]}`}>
                  {PAYMENT_STATUS_LABELS[p.status]}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {member.enrollment && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5 text-sm">
          <h3 className="font-semibold">Enrollment</h3>
          <p className="mt-2 text-slate-600">
            {member.enrollment.enrollmentNumber} · enrolled{' '}
            {new Date(member.enrollment.enrolledAt).toLocaleString()} by{' '}
            {trainerName(member.enrollment.enrolledBy)}
          </p>
        </div>
      )}

      {!canEdit && (
        <p className="mt-4 text-xs text-slate-400">Trainer view — read only</p>
      )}
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
