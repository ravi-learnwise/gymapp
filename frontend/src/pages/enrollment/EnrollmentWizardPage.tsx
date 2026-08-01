import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../lib/api';
import { LEAD_SOURCE_LABELS, GENDER_LABELS, type Gender } from '../../types/enquiry';
import {
  addMonthsToDate,
  calculateBmi,
  type EnrollmentPrefill,
  type ProgramWithDurations,
  type Trainer,
} from '../../types/member';

const STEPS = ['Enquiry Review', 'Health Profile', 'Program Details', 'Confirm'];

export default function EnrollmentWizardPage() {
  const [searchParams] = useSearchParams();
  const enquiryId = searchParams.get('enquiryId') ?? '';
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [prefill, setPrefill] = useState<EnrollmentPrefill | null>(null);
  const [programs, setPrograms] = useState<ProgramWithDurations[]>([]);
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const [health, setHealth] = useState({
    dateOfBirth: '',
    height: '',
    weight: '',
    medicalHistory: '',
    allergies: '',
    dietType: '',
    sportsParticipation: '',
    fitnessGoals: '',
  });

  const [program, setProgram] = useState({
    programId: '',
    programDurationId: '',
    trainerId: '',
    isTrial: false,
    startDate: new Date().toISOString().slice(0, 10),
  });

  useEffect(() => {
    if (!enquiryId) return;
    api<EnrollmentPrefill>(`/enrollments/prefill/${enquiryId}`)
      .then((data) => {
        setPrefill(data);
        setProgram((p) => ({
          ...p,
          programId: data.suggestedProgramId ?? '',
          programDurationId: data.suggestedDurationId ?? '',
        }));
      })
      .catch((e) => setError(e.message));
    api<ProgramWithDurations[]>('/config/programs').then(setPrograms);
    api<Trainer[]>('/enrollments/trainers').then(setTrainers);
  }, [enquiryId]);

  const selectedProgram = programs.find((p) => p.id === program.programId);
  const selectedDuration = selectedProgram?.durations.find((d) => d.id === program.programDurationId);
  const bmi = useMemo(() => {
    const h = parseFloat(health.height);
    const w = parseFloat(health.weight);
    return calculateBmi(h, w);
  }, [health.height, health.weight]);

  const endDate = useMemo(() => {
    if (!program.startDate || !selectedDuration) return '';
    return addMonthsToDate(program.startDate, selectedDuration.months);
  }, [program.startDate, selectedDuration]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const result = await api<{ member: { id: string } }>('/enrollments', {
        method: 'POST',
        body: JSON.stringify({
          enquiryId,
          dateOfBirth: health.dateOfBirth || undefined,
          height: health.height ? parseFloat(health.height) : undefined,
          weight: health.weight ? parseFloat(health.weight) : undefined,
          medicalHistory: health.medicalHistory || undefined,
          allergies: health.allergies || undefined,
          dietType: health.dietType || undefined,
          sportsParticipation: health.sportsParticipation || undefined,
          fitnessGoals: health.fitnessGoals || undefined,
          programId: program.programId,
          programDurationId: program.programDurationId,
          trainerId: program.trainerId || undefined,
          isTrial: program.isTrial,
          startDate: program.startDate,
        }),
      });
      navigate(`/members/${result.member.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enrollment failed');
    } finally {
      setLoading(false);
    }
  };

  if (!enquiryId) {
    return (
      <div>
        <p className="text-red-600">Missing enquiryId. Start enrollment from an enquiry detail page.</p>
        <Link to="/enquiries" className="text-brand-600 hover:underline">← Enquiries</Link>
      </div>
    );
  }

  if (!prefill) {
    return <p className="text-slate-500">{error || 'Loading enrollment data…'}</p>;
  }

  const { enquiry } = prefill;

  return (
    <div className="max-w-3xl">
      <Link to={`/enquiries/${enquiryId}`} className="text-sm text-brand-600 hover:underline">
        ← Back to Enquiry
      </Link>
      <h2 className="mt-2 text-2xl font-bold">Enrollment Wizard</h2>
      <p className="text-sm text-slate-500">
        {enquiry.enquiryNumber} · {enquiry.fullName}
      </p>

      {/* Step indicator */}
      <ol className="mt-6 flex gap-2">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`flex-1 rounded-lg px-2 py-2 text-center text-xs font-medium ${
              i === step ? 'bg-brand-600 text-white' : i < step ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-500'
            }`}
          >
            {label}
          </li>
        ))}
      </ol>

      {error && step < 3 && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-6 space-y-6">
        {step === 0 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">Enquiry Data (read-only)</h3>
            <p className="mt-1 text-sm text-slate-500">
              All enquiry information is carried forward — no retyping required.
            </p>
            <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
              <Field label="Name" value={enquiry.fullName} />
              <Field label="Mobile" value={enquiry.mobileNumber} />
              <Field label="Email" value={enquiry.email} />
              <Field label="Age / Gender" value={[enquiry.age, enquiry.gender ? GENDER_LABELS[enquiry.gender as Gender] : null].filter(Boolean).join(' / ') || '—'} />
              <Field label="Profession" value={enquiry.profession} />
              <Field label="Address" value={enquiry.address} />
              <Field label="Lead Source" value={LEAD_SOURCE_LABELS[enquiry.leadSource]} />
              <Field label="Program Offered" value={enquiry.offeredProgram?.name} />
              <Field label="Discount" value={enquiry.offeredDiscount?.name} />
              <Field label="Offer Category" value={enquiry.offerCategory?.name} />
            </dl>
          </section>
        )}

        {step === 1 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="font-semibold">Additional Health Profile</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Date of Birth
                <input type="date" value={health.dateOfBirth} onChange={(e) => setHealth({ ...health, dateOfBirth: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <div />
              <label className="block text-sm">
                Height (cm)
                <input type="number" step="0.1" value={health.height} onChange={(e) => setHealth({ ...health, height: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="block text-sm">
                Weight (kg)
                <input type="number" step="0.1" value={health.weight} onChange={(e) => setHealth({ ...health, weight: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <div className="sm:col-span-2 rounded-lg bg-slate-50 px-3 py-2 text-sm">
                BMI: <strong>{bmi ?? '—'}</strong> {bmi && (bmi < 18.5 ? '(Underweight)' : bmi < 25 ? '(Normal)' : bmi < 30 ? '(Overweight)' : '(Obese)')}
              </div>
            </div>
            <TextArea label="Medical History" value={health.medicalHistory} onChange={(v) => setHealth({ ...health, medicalHistory: v })} />
            <TextArea label="Allergies" value={health.allergies} onChange={(v) => setHealth({ ...health, allergies: v })} />
            <label className="block text-sm">
              Diet Type
              <input value={health.dietType} onChange={(e) => setHealth({ ...health, dietType: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" placeholder="e.g. Vegetarian, Keto" />
            </label>
            <TextArea label="Sports Participation" value={health.sportsParticipation} onChange={(v) => setHealth({ ...health, sportsParticipation: v })} />
            <TextArea label="Fitness Goals" value={health.fitnessGoals} onChange={(v) => setHealth({ ...health, fitnessGoals: v })} />
          </section>
        )}

        {step === 2 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4">
            <h3 className="font-semibold">Program Details</h3>
            <label className="block text-sm">
              Program *
              <select
                required
                value={program.programId}
                onChange={(e) => setProgram({ ...program, programId: e.target.value, programDurationId: '' })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
              >
                <option value="">Select program…</option>
                {programs.filter((p) => p.durations.some((d) => d.isActive)).map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Duration *
              <select
                required
                value={program.programDurationId}
                onChange={(e) => setProgram({ ...program, programDurationId: e.target.value })}
                className="mt-1 w-full rounded-lg border px-3 py-2"
                disabled={!selectedProgram}
              >
                <option value="">Select duration…</option>
                {selectedProgram?.durations.filter((d) => d.isActive).map((d) => (
                  <option key={d.id} value={d.id}>{d.label} — {d.months} mo · ₹{d.price}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Trainer
              <select value={program.trainerId} onChange={(e) => setProgram({ ...program, trainerId: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2">
                <option value="">No trainer assigned</option>
                {trainers.map((t) => (
                  <option key={t.id} value={t.id}>
                    {[t.firstName, t.lastName].filter(Boolean).join(' ') || t.email}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={program.isTrial} onChange={(e) => setProgram({ ...program, isTrial: e.target.checked })} />
              Trial membership
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                Start Date *
                <input type="date" required value={program.startDate} onChange={(e) => setProgram({ ...program, startDate: e.target.value })} className="mt-1 w-full rounded-lg border px-3 py-2" />
              </label>
              <label className="block text-sm">
                End Date (auto)
                <input type="date" readOnly value={endDate} className="mt-1 w-full rounded-lg border bg-slate-50 px-3 py-2" />
              </label>
            </div>
          </section>
        )}

        {step === 3 && (
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="font-semibold">Confirm Enrollment</h3>
            <p className="mt-1 text-sm text-slate-500">
              This will create a member record, activate membership, and mark the enquiry as Converted.
            </p>
            <dl className="mt-4 space-y-2 text-sm">
              <Field label="Member" value={enquiry.fullName} />
              <Field label="Program" value={selectedProgram?.name} />
              <Field label="Duration" value={selectedDuration?.label} />
              <Field label="Trial" value={program.isTrial ? 'Yes' : 'No'} />
              <Field label="Period" value={`${program.startDate} → ${endDate}`} />
              <Field label="BMI" value={bmi?.toString()} />
            </dl>
            {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          </section>
        )}

        <div className="flex justify-between">
          <button
            type="button"
            disabled={step === 0}
            onClick={() => setStep((s) => s - 1)}
            className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40"
          >
            Back
          </button>
          {step < 3 ? (
            <button
              type="button"
              onClick={() => {
                if (step === 2 && (!program.programId || !program.programDurationId)) {
                  setError('Please select program and duration');
                  return;
                }
                setError('');
                setStep((s) => s + 1);
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white"
            >
              Next
            </button>
          ) : (
            <button type="submit" disabled={loading} className="rounded-lg bg-brand-600 px-4 py-2 text-sm text-white disabled:opacity-50">
              {loading ? 'Enrolling…' : 'Complete Enrollment'}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-slate-500">{label}</dt>
      <dd className="font-medium text-slate-800">{value || '—'}</dd>
    </div>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={2} className="mt-1 w-full rounded-lg border px-3 py-2" />
    </label>
  );
}
