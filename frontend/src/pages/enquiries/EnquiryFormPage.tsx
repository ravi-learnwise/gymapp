import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Dumbbell, UserRound } from 'lucide-react';
import { api } from '../../lib/api';
import { monthToDateRange } from '../../lib/date-range';
import { enquiryFormSchema } from '../../lib/validation/enquiry';
import {
  GENDER_LABELS,
  LEAD_SOURCE_LABELS,
  type Gender,
  type LeadSource,
} from '../../types/enquiry';

type ProgramDuration = { id: string; label: string; months: number; price: string; isActive: boolean };
type Program = { id: string; name: string; durations: ProgramDuration[] };
type Discount = { id: string; name: string };
type Offer = { id: string; name: string };

const emptyForm = {
  fullName: '',
  age: '',
  gender: '' as Gender | '',
  profession: '',
  familyDetails: '',
  mobileNumber: '',
  alternateContact: '',
  email: '',
  address: '',
  dateOfEnquiry: new Date().toISOString().slice(0, 10),
  preferredContactTime: '',
  leadSource: 'WALK_IN' as LeadSource,
  offeredProgramId: '',
  offeredProgramDurationId: '',
  offeredDiscountId: '',
  offeredFlatDiscount: '',
  offerCategoryId: '',
  offerValidTill: '',
  initialNote: '',
};

export default function EnquiryFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);
  const [form, setForm] = useState(emptyForm);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Program[]>('/config/programs').then(setPrograms);
    api<Discount[]>('/config/discount-categories').then(setDiscounts);
    api<Offer[]>('/config/offer-categories').then(setOffers);
  }, []);

  useEffect(() => {
    if (id) {
      api<Record<string, unknown>>(`/enquiries/${id}`).then((e) => {
        setForm({
          fullName: (e.fullName as string) || '',
          age: e.age?.toString() || '',
          gender: (e.gender as Gender) || '',
          profession: (e.profession as string) || '',
          familyDetails: (e.familyDetails as string) || '',
          mobileNumber: (e.mobileNumber as string) || '',
          alternateContact: (e.alternateContact as string) || '',
          email: (e.email as string) || '',
          address: (e.address as string) || '',
          dateOfEnquiry: e.dateOfEnquiry
            ? new Date(e.dateOfEnquiry as string).toISOString().slice(0, 10)
            : monthToDateRange().dateFrom,
          preferredContactTime: (e.preferredContactTime as string) || '',
          leadSource: e.leadSource as LeadSource,
          offeredProgramId: (e.offeredProgram as { id: string })?.id || '',
          offeredProgramDurationId: (e.offeredProgramDuration as { id: string })?.id || '',
          offeredDiscountId: (e.offeredDiscount as { id: string })?.id || '',
          offeredFlatDiscount: e.offeredFlatDiscount != null ? String(e.offeredFlatDiscount) : '',
          offerCategoryId: (e.offerCategory as { id: string })?.id || '',
          offerValidTill: e.offerValidTill
            ? new Date(e.offerValidTill as string).toISOString().slice(0, 10)
            : '',
          initialNote: '',
        });
      });
    }
  }, [id]);

  const durations = useMemo(() => {
    const program = programs.find((p) => p.id === form.offeredProgramId);
    return program?.durations.filter((d) => d.isActive) ?? [];
  }, [programs, form.offeredProgramId]);

  const set = (key: keyof typeof form, value: string) => {
    setForm((f) => {
      const next = { ...f, [key]: value };
      if (key === 'offeredProgramId') next.offeredProgramDurationId = '';
      if (key === 'offeredDiscountId' && value) next.offeredFlatDiscount = '';
      if (key === 'offeredFlatDiscount' && value) next.offeredDiscountId = '';
      return next;
    });
    setFieldErrors((errs) => ({ ...errs, [key]: '' }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    const parsed = enquiryFormSchema.safeParse(form);
    if (!parsed.success) {
      const errs: Record<string, string> = {};
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0]?.toString() ?? '_form';
        errs[key] = issue.message;
      });
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);

    const body = {
      ...parsed.data,
      gender: parsed.data.gender || undefined,
      offeredProgramId: parsed.data.offeredProgramId || undefined,
      offeredProgramDurationId: parsed.data.offeredProgramDurationId || undefined,
      offeredDiscountId: parsed.data.offeredDiscountId || undefined,
      offeredFlatDiscount: parsed.data.offeredFlatDiscount,
      offerCategoryId: parsed.data.offerCategoryId || undefined,
      offerValidTill: parsed.data.offerValidTill || undefined,
      initialNote: !isEdit ? parsed.data.initialNote : undefined,
    };

    try {
      if (isEdit) {
        const { initialNote: _, ...updateBody } = body;
        await api(`/enquiries/${id}`, { method: 'PATCH', body: JSON.stringify(updateBody) });
        navigate(`/enquiries/${id}`);
      } else {
        const created = await api<{ id: string }>('/enquiries', {
          method: 'POST',
          body: JSON.stringify(body),
        });
        navigate(`/enquiries/${created.id}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (key: keyof typeof form) =>
    `${fieldErrors[key] ? 'border-red-400 focus:border-red-500 focus:ring-red-500/25' : ''}`;

  const field = (
    label: string,
    key: keyof typeof form,
    type = 'text',
    required = false,
  ) => (
    <div>
      <label className="mb-1.5 block text-sm font-bold text-slate-700">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className={`input-field ${inputClass(key)}`}
      />
      {fieldErrors[key] && <p className="mt-1 text-xs font-medium text-red-600">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div className="w-full">
      <Link
        to={isEdit ? `/enquiries/${id}` : '/enquiries'}
        className="btn-link text-sm"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </Link>
      <h2 className="mt-2 text-2xl text-slate-900">
        {isEdit ? 'Edit Enquiry' : 'New Enquiry'}
      </h2>
      <p className="mt-1 text-sm font-medium text-slate-500">
        Capture lead information and program interest in one place.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 w-full space-y-6">
        {error && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
            {error}
          </p>
        )}

        <div className="grid w-full gap-6 lg:grid-cols-2">
          {/* ── Personal Details ── */}
          <section className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-sky-50/50 via-white to-amber-50/30 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-stone-200/80 pb-4">
              <div className="rounded-xl bg-sky-200/50 p-2.5 text-sky-700">
                <UserRound className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-lg text-slate-900">Personal Details</h3>
                <p className="text-xs font-medium text-slate-500">Contact and demographic information</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {field('Full Name', 'fullName', 'text', true)}
              {field('Mobile Number', 'mobileNumber', 'tel', true)}
              {field('Date of Enquiry', 'dateOfEnquiry', 'date', true)}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Lead Source *</label>
                <select
                  value={form.leadSource}
                  onChange={(e) => set('leadSource', e.target.value)}
                  className="select-field w-full"
                >
                  {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
                    <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {field('Age', 'age', 'number')}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Gender</label>
                <select
                  value={form.gender}
                  onChange={(e) => set('gender', e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">—</option>
                  {(Object.keys(GENDER_LABELS) as Gender[]).map((g) => (
                    <option key={g} value={g}>{GENDER_LABELS[g]}</option>
                  ))}
                </select>
              </div>
              {field('Email', 'email', 'email')}
              {field('Alternate Contact', 'alternateContact', 'tel')}
              {field('Profession', 'profession')}
              {field('Preferred Contact Time', 'preferredContactTime')}
            </div>

            <div className="mt-4 grid gap-4">
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Address</label>
                <textarea
                  value={form.address}
                  onChange={(e) => set('address', e.target.value)}
                  rows={2}
                  className="input-field resize-y"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Family Details</label>
                <textarea
                  value={form.familyDetails}
                  onChange={(e) => set('familyDetails', e.target.value)}
                  rows={2}
                  className="input-field resize-y"
                />
              </div>
              {!isEdit && (
                <div>
                  <label className="mb-1.5 block text-sm font-bold text-slate-700">Initial Note</label>
                  <textarea
                    value={form.initialNote}
                    onChange={(e) => set('initialNote', e.target.value)}
                    rows={3}
                    placeholder="First conversation notes…"
                    className="input-field resize-y"
                  />
                </div>
              )}
            </div>
          </section>

          {/* ── Program Details ── */}
          <section className="rounded-2xl border border-stone-200/80 bg-gradient-to-br from-amber-50/50 via-white to-orange-50/30 p-5 sm:p-6">
            <div className="mb-5 flex items-center gap-3 border-b border-stone-200/80 pb-4">
              <div className="rounded-xl bg-amber-200/50 p-2.5 text-amber-800">
                <Dumbbell className="h-5 w-5" strokeWidth={2.25} />
              </div>
              <div>
                <h3 className="text-lg text-slate-900">Program Details</h3>
                <p className="text-xs font-medium text-slate-500">Program, pricing, discounts and offers</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Offered Program</label>
                <select
                  value={form.offeredProgramId}
                  onChange={(e) => set('offeredProgramId', e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">— Select program —</option>
                  {programs.filter((p) => p.durations.some((d) => d.isActive)).map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Program Duration</label>
                <select
                  value={form.offeredProgramDurationId}
                  onChange={(e) => set('offeredProgramDurationId', e.target.value)}
                  disabled={!form.offeredProgramId}
                  className="select-field w-full disabled:cursor-not-allowed disabled:bg-stone-100"
                >
                  <option value="">— Select duration —</option>
                  {durations.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.label} — ₹{Number(d.price).toLocaleString('en-IN')}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Discount Category (%)</label>
                <select
                  value={form.offeredDiscountId}
                  onChange={(e) => set('offeredDiscountId', e.target.value)}
                  disabled={Boolean(form.offeredFlatDiscount)}
                  className="select-field w-full disabled:cursor-not-allowed disabled:bg-stone-100"
                >
                  <option value="">—</option>
                  {discounts.map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              {field('Flat Discount (₹)', 'offeredFlatDiscount', 'number')}
              <div>
                <label className="mb-1.5 block text-sm font-bold text-slate-700">Offer Category</label>
                <select
                  value={form.offerCategoryId}
                  onChange={(e) => set('offerCategoryId', e.target.value)}
                  className="select-field w-full"
                >
                  <option value="">—</option>
                  {offers.map((o) => (
                    <option key={o.id} value={o.id}>{o.name}</option>
                  ))}
                </select>
              </div>
              {field('Offer Valid Till', 'offerValidTill', 'date')}
            </div>
          </section>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-stone-200/80 pt-5">
          <button type="submit" disabled={loading} className="btn btn-primary">
            {loading ? 'Saving…' : isEdit ? 'Update Enquiry' : 'Create Enquiry'}
          </button>
          <Link
            to={isEdit ? `/enquiries/${id}` : '/enquiries'}
            className="btn btn-secondary"
          >
            Cancel
          </Link>
        </div>
      </form>
    </div>
  );
}
