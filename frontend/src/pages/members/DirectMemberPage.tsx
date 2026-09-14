import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CreditCard, Dumbbell, HeartPulse, UserRound } from 'lucide-react';
import { api } from '../../lib/api';
import { GENDER_LABELS, type Gender } from '../../types/enquiry';
import { PAYMENT_MODE_LABELS, type PaymentMode } from '../../types/payment';
import {
  addMonthsToDate,
  calculateBmi,
  trainerName,
  type ProgramWithDurations,
  type Trainer,
} from '../../types/member';

type DirectResult = { member: { id: string } };

const empty = {
  fullName: '',
  mobileNumber: '',
  alternateContact: '',
  email: '',
  address: '',
  gender: '' as Gender | '',
  age: '',
  profession: '',
  familyDetails: '',
  dateOfBirth: '',
  existingMemberId: '',
  height: '',
  weight: '',
  medicalHistory: '',
  allergies: '',
  dietType: '',
  sportsParticipation: '',
  fitnessGoals: '',
  programId: '',
  programDurationId: '',
  trainerId: '',
  startDate: new Date().toISOString().slice(0, 10),
  endDate: '',
  discountAmount: '',
  amountPaid: '',
  paymentMode: 'CASH' as PaymentMode,
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentNotes: '',
};

export default function DirectMemberPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [programs, setPrograms] = useState<ProgramWithDurations[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<ProgramWithDurations[]>('/programs').then(setPrograms);
    api<Trainer[]>('/enrollments/trainers').then(setTrainers);
  }, []);

  const selectedProgram = programs.find((p) => p.id === form.programId);
  const selectedDuration = selectedProgram?.durations.find((d) => d.id === form.programDurationId);
  const computedEnd = useMemo(() => {
    if (!form.startDate || !selectedDuration) return '';
    return addMonthsToDate(form.startDate, selectedDuration.months);
  }, [form.startDate, selectedDuration]);
  const price = selectedDuration ? Number(selectedDuration.price) : 0;
  const discount = form.discountAmount ? Number(form.discountAmount) : 0;
  const finalAmount = Math.max(0, price - (Number.isFinite(discount) ? discount : 0));
  const bmi = useMemo(() => {
    const h = parseFloat(form.height);
    const w = parseFloat(form.weight);
    return calculateBmi(h, w);
  }, [form.height, form.weight]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'programId') next.programDurationId = '';
      return next;
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    if (!form.fullName.trim() || form.fullName.trim().length < 2) {
      setError('Full name is required');
      return;
    }
    if (!form.mobileNumber.trim()) {
      setError('Mobile number is required');
      return;
    }
    if (!form.programId || !form.programDurationId) {
      setError('Select a program and duration');
      return;
    }
    const amountPaid = form.amountPaid ? parseFloat(form.amountPaid) : 0;
    if (amountPaid > 0 && !form.paymentMode) {
      setError('Payment mode is required when amount paid is greater than 0');
      return;
    }
    setLoading(true);
    try {
      const result = await api<DirectResult>('/members/direct', {
        method: 'POST',
        body: JSON.stringify({
          fullName: form.fullName.trim(),
          mobileNumber: form.mobileNumber.trim(),
          alternateContact: form.alternateContact || undefined,
          email: form.email || undefined,
          address: form.address || undefined,
          gender: form.gender || undefined,
          age: form.age ? parseInt(form.age, 10) : undefined,
          profession: form.profession || undefined,
          familyDetails: form.familyDetails || undefined,
          dateOfBirth: form.dateOfBirth || undefined,
          existingMemberId: form.existingMemberId || undefined,
          height: form.height ? parseFloat(form.height) : undefined,
          weight: form.weight ? parseFloat(form.weight) : undefined,
          medicalHistory: form.medicalHistory || undefined,
          allergies: form.allergies || undefined,
          dietType: form.dietType || undefined,
          sportsParticipation: form.sportsParticipation || undefined,
          fitnessGoals: form.fitnessGoals || undefined,
          programId: form.programId,
          programDurationId: form.programDurationId,
          trainerId: form.trainerId || undefined,
          startDate: form.startDate,
          endDate: form.endDate || undefined,
          discountAmount: form.discountAmount ? parseFloat(form.discountAmount) : undefined,
          amountPaid: amountPaid > 0 ? amountPaid : undefined,
          paymentMode: amountPaid > 0 ? form.paymentMode : undefined,
          paymentDate: amountPaid > 0 ? form.paymentDate || undefined : undefined,
          paymentNotes: form.paymentNotes || undefined,
        }),
      });
      navigate(`/members/${result.member.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create member');
    } finally {
      setLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, type = 'text', required = false) => (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-ink">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className="input-field"
        required={required}
      />
    </div>
  );

  return (
    <div className="w-full">
      <Link to="/members" className="btn-link text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back to members
      </Link>
      <h2 className="mt-2 text-2xl text-ink">Add Member</h2>
      <p className="mt-1 text-sm font-medium text-ink-secondary">
        Creates an active member with a primary membership. An enquiry is recorded and converted automatically.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {error && (
          <p className="rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
            {error}
          </p>
        )}

        <div className="grid w-full gap-6 lg:grid-cols-2">
          <section className="page-section p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
              <div className="icon-accent-info rounded-xl p-2.5">
                <UserRound className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-lg text-ink">Member details</h3>
                <p className="text-xs font-medium text-ink-secondary">Contact and identity</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Full Name', 'fullName', 'text', true)}
              {field('Mobile Number', 'mobileNumber', 'tel', true)}
              {field('Existing Member ID', 'existingMemberId')}
              {field('Email', 'email', 'email')}
              {field('Alternate Contact', 'alternateContact', 'tel')}
              {field('Age', 'age', 'number')}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Gender</label>
                <select value={form.gender} onChange={(e) => set('gender', e.target.value)} className="select-field w-full">
                  <option value="">—</option>
                  {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                    <option key={g} value={g}>{GENDER_LABELS[g]}</option>
                  ))}
                </select>
              </div>
              {field('Date of Birth', 'dateOfBirth', 'date')}
              {field('Profession', 'profession')}
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Address</label>
                <textarea value={form.address} onChange={(e) => set('address', e.target.value)} rows={2} className="input-field resize-y" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Family Details</label>
                <textarea value={form.familyDetails} onChange={(e) => set('familyDetails', e.target.value)} rows={2} className="input-field resize-y" />
              </div>
            </div>
          </section>

          <section className="page-section p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
              <div className="icon-accent-warning rounded-xl p-2.5">
                <Dumbbell className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-lg text-ink">Primary membership</h3>
                <p className="text-xs font-medium text-ink-secondary">Current active program only</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-ink">Program *</label>
                <select
                  required
                  value={form.programId}
                  onChange={(e) => set('programId', e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">— Select program —</option>
                  {programs.filter((p) => p.enrollmentType !== 'ADD_ON' && p.durations.some((d) => d.isActive)).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-ink">Duration *</label>
                <select
                  required
                  value={form.programDurationId}
                  onChange={(e) => set('programDurationId', e.target.value)}
                  disabled={!form.programId}
                  className="select-field w-full disabled:cursor-not-allowed disabled:bg-neutral-soft"
                >
                  <option value="">— Select duration —</option>
                  {selectedProgram?.durations.filter((d) => d.isActive).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label} — ₹{Number(d.price).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Trainer</label>
                <select value={form.trainerId} onChange={(e) => set('trainerId', e.target.value)} className="select-field w-full">
                  <option value="">No trainer assigned</option>
                  {trainers.map((t) => (
                    <option key={t.id} value={t.id}>{trainerName(t)}</option>
                  ))}
                </select>
              </div>
              {field('Start Date', 'startDate', 'date', true)}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">End Date (optional override)</label>
                <input type="date" value={form.endDate} onChange={(e) => set('endDate', e.target.value)} className="input-field" />
                <p className="mt-1 text-xs text-ink-muted">Leave blank to use {computedEnd || 'start + duration'}</p>
              </div>
            </div>
          </section>
        </div>

        <div className="grid w-full gap-6 lg:grid-cols-2">
          <section className="page-section p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
              <div className="icon-accent-info rounded-xl p-2.5">
                <CreditCard className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-lg text-ink">Payment for current membership</h3>
                <p className="text-xs font-medium text-ink-secondary">Leave amount paid blank if still pending</p>
              </div>
            </div>
            <div className="mb-4 rounded-lg bg-canvas px-3 py-2 text-sm">
              Program fee ₹{price.toLocaleString('en-IN')} · Discount ₹{(Number.isFinite(discount) ? discount : 0).toLocaleString('en-IN')} ·
              Final <strong>₹{finalAmount.toLocaleString('en-IN')}</strong>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Discount Amount (₹)', 'discountAmount', 'number')}
              {field('Amount Paid (₹)', 'amountPaid', 'number')}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Payment Mode</label>
                <select value={form.paymentMode} onChange={(e) => set('paymentMode', e.target.value)} className="select-field w-full">
                  {(Object.keys(PAYMENT_MODE_LABELS) as PaymentMode[]).map((m) => (
                    <option key={m} value={m}>{PAYMENT_MODE_LABELS[m]}</option>
                  ))}
                </select>
              </div>
              {field('Payment Date', 'paymentDate', 'date')}
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-ink">Payment Notes</label>
                <input value={form.paymentNotes} onChange={(e) => set('paymentNotes', e.target.value)} className="input-field" />
              </div>
            </div>
          </section>

          <section className="page-section p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-line pb-4">
              <div className="icon-accent-info rounded-xl p-2.5">
                <HeartPulse className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-lg text-ink">Health profile (optional)</h3>
                <p className="text-xs font-medium text-ink-secondary">Stored on the member record</p>
              </div>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {field('Height (cm)', 'height', 'number')}
              {field('Weight (kg)', 'weight', 'number')}
              <div className="sm:col-span-2 rounded-lg bg-canvas px-3 py-2 text-sm">
                BMI: <strong>{bmi ?? '—'}</strong>
              </div>
              {field('Diet Type', 'dietType')}
            </div>
            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Medical History</label>
                <textarea value={form.medicalHistory} onChange={(e) => set('medicalHistory', e.target.value)} rows={2} className="input-field resize-y" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Allergies</label>
                <textarea value={form.allergies} onChange={(e) => set('allergies', e.target.value)} rows={2} className="input-field resize-y" />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-ink">Fitness Goals</label>
                <textarea value={form.fitnessGoals} onChange={(e) => set('fitnessGoals', e.target.value)} rows={2} className="input-field resize-y" />
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-line pt-5">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Creating member…' : 'Create Member'}
          </button>
          <Link to="/members" className="btn btn-secondary">Cancel</Link>
        </div>
      </form>
    </div>
  );
}
