import { FormEvent, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import {
  GENDER_LABELS,
  LEAD_SOURCE_LABELS,
  type Gender,
  type LeadSource,
} from '../../types/enquiry';

type Program = { id: string; name: string };
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
  preferredContactTime: '',
  leadSource: 'WALK_IN' as LeadSource,
  offeredProgramId: '',
  offeredDiscountId: '',
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
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Program[]>('/config/programs').then(setPrograms);
    api<Discount[]>('/config/discount-categories').then(setDiscounts);
    api<Offer[]>('/config/offer-categories').then(setOffers);
  }, []);

  useEffect(() => {
    if (id) {
      api<typeof form & { id: string; status: string }>(`/enquiries/${id}`).then((e) => {
        setForm({
          fullName: e.fullName || '',
          age: e.age?.toString() || '',
          gender: (e as { gender?: Gender }).gender || '',
          profession: (e as { profession?: string }).profession || '',
          familyDetails: (e as { familyDetails?: string }).familyDetails || '',
          mobileNumber: e.mobileNumber || '',
          alternateContact: (e as { alternateContact?: string }).alternateContact || '',
          email: (e as { email?: string }).email || '',
          address: (e as { address?: string }).address || '',
          preferredContactTime: (e as { preferredContactTime?: string }).preferredContactTime || '',
          leadSource: (e as { leadSource: LeadSource }).leadSource,
          offeredProgramId: (e as { offeredProgram?: { id: string } }).offeredProgram?.id || '',
          offeredDiscountId: (e as { offeredDiscount?: { id: string } }).offeredDiscount?.id || '',
          offerCategoryId: (e as { offerCategory?: { id: string } }).offerCategory?.id || '',
          offerValidTill: (e as { offerValidTill?: string }).offerValidTill
            ? (e as { offerValidTill: string }).offerValidTill.slice(0, 10)
            : '',
          initialNote: '',
        });
      });
    }
  }, [id]);

  const set = (key: keyof typeof form, value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const body = {
      ...form,
      age: form.age ? parseInt(form.age, 10) : undefined,
      gender: form.gender || undefined,
      offeredProgramId: form.offeredProgramId || undefined,
      offeredDiscountId: form.offeredDiscountId || undefined,
      offerCategoryId: form.offerCategoryId || undefined,
      offerValidTill: form.offerValidTill || undefined,
      initialNote: !isEdit ? form.initialNote : undefined,
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
      <label className="mb-1 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type={type}
        value={form[key]}
        onChange={(e) => set(key, e.target.value)}
        required={required}
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
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
          {field('Full Name *', 'fullName', 'text', true)}
          {field('Mobile Number *', 'mobileNumber', 'tel', true)}
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
            <label className="mb-1 block text-sm font-medium">Lead Source *</label>
            <select
              value={form.leadSource}
              onChange={(e) => set('leadSource', e.target.value)}
              required
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              {(Object.keys(LEAD_SOURCE_LABELS) as LeadSource[]).map((s) => (
                <option key={s} value={s}>{LEAD_SOURCE_LABELS[s]}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Offered Program</label>
            <select
              value={form.offeredProgramId}
              onChange={(e) => set('offeredProgramId', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Offered Discount</label>
            <select
              value={form.offeredDiscountId}
              onChange={(e) => set('offeredDiscountId', e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            >
              <option value="">—</option>
              {discounts.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </div>
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
