import { FormEvent, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
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

  const field = (
    label: string,
    key: keyof typeof form,
    type = 'text',
    required = false,
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-slate-700">
        {label}{required && ' *'}
      </label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        className={`w-full rounded-lg border px-3 py-2 text-sm ${fieldErrors[key] ? 'border-red-400' : 'border-slate-300'}`}
      />
      {fieldErrors[key] && <p className="mt-1 text-xs text-red-600">{fieldErrors[key]}</p>}
    </div>
  );

  return (
    <div className="max-w-2xl">
      <Link to={isEdit ? `/enquiries/${id}` : '/enquiries'} className="text-sm text-brand-600 hover:underline">
        ← Back
      </Link>
      <h2 className="mt-2 text-2xl font-bold">{isEdit ? 'Edit Enquiry' : 'New Enquiry'}</h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4 rounded-xl border border-slate-200 bg-white p-6">
        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="grid gap-4 sm:grid-cols-2">
          {field('Full Name', 'fullName', 'text', true)}
          {field('Mobile Number', 'mobileNumber', 'tel', true)}
          {field('Date of Enquiry', 'dateOfEnquiry', 'date', true)}
          <div>
            <label className="mb-1 block text-sm font-medium">Lead Source *</label>
            <select
              value={form.leadSource}
              onChange={(e) => set('leadSource', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
                <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          {field('Age', 'age', 'number')}
          <div>
            <label className="mb-1 block text-sm font-medium">Gender</label>
            <select
              value={form.gender}
              onChange={(e) => set('gender', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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

        <div>
          <label className="mb-1 block text-sm font-medium">Address</label>
          <textarea
            value={form.address}
            onChange={(e) => set('address', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium">Family Details</label>
          <textarea
            value={form.familyDetails}
            onChange={(e) => set('familyDetails', e.target.value)}
            rows={2}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Offered Program</label>
            <select
              value={form.offeredProgramId}
              onChange={(e) => set('offeredProgramId', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {programs.filter((p) => p.durations.some((d) => d.isActive)).map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Program Duration</label>
            <select
              value={form.offeredProgramDurationId}
              onChange={(e) => set('offeredProgramDurationId', e.target.value)}
              disabled={!form.offeredProgramId}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">—</option>
              {durations.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label} — ₹{Number(d.price).toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Discount Category (%)</label>
            <select
              value={form.offeredDiscountId}
              onChange={(e) => set('offeredDiscountId', e.target.value)}
              disabled={Boolean(form.offeredFlatDiscount)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:bg-slate-50"
            >
              <option value="">—</option>
              {discounts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
          {field('Flat Discount (₹)', 'offeredFlatDiscount', 'number')}
          <div>
            <label className="mb-1 block text-sm font-medium">Offer Category</label>
            <select
              value={form.offerCategoryId}
              onChange={(e) => set('offerCategoryId', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {offers.map((o) => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
            </select>
          </div>
          {field('Offer Valid Till', 'offerValidTill', 'date')}
        </div>

        {!isEdit && (
          <div>
            <label className="mb-1 block text-sm font-medium">Initial Note</label>
            <textarea
              value={form.initialNote}
              onChange={(e) => set('initialNote', e.target.value)}
              rows={3}
              placeholder="First conversation notes…"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-brand-600 px-6 py-2.5 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? 'Saving…' : isEdit ? 'Update Enquiry' : 'Create Enquiry'}
        </button>
      </form>
    </div>
  );
}
