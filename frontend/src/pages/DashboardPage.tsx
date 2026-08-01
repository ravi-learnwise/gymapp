import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import type { EnquiryStats } from '../types/enquiry';

type EnrollmentStats = {
  totalMembers: number;
  activeMemberships: number;
  recentEnrollments: number;
};

type PaymentStats = {
  total: number;
  pending: number;
  partial: number;
  paid: number;
  outstandingAmount: number;
  dueReminders: number;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<EnquiryStats | null>(null);
  const [memberStats, setMemberStats] = useState<EnrollmentStats | null>(null);
  const [paymentStats, setPaymentStats] = useState<PaymentStats | null>(null);

  useEffect(() => {
    if (user?.role === 'OWNER' || user?.role === 'MANAGER') {
      api<EnquiryStats>('/enquiries/stats').then(setStats).catch(() => {});
      api<EnrollmentStats>('/enrollments/stats').then(setMemberStats).catch(() => {});
      api<PaymentStats>('/payments/stats').then(setPaymentStats).catch(() => {});
    }
  }, [user]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-slate-900">Dashboard</h2>
      <p className="mt-1 text-slate-500">
        Welcome back, {user?.firstName || user?.email}
      </p>

      {(user?.role === 'OWNER' || user?.role === 'MANAGER') && stats && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Enquiry Overview</h3>
            <Link to="/enquiries" className="text-sm text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Total Enquiries" value={stats.total} />
            <Card title="Open" value={stats.open} />
            <Card title="Converted" value={stats.converted} />
            <Card title="Conversion Rate" value={`${stats.conversionRate}%`} />
          </div>
        </div>
      )}

      {(user?.role === 'OWNER' || user?.role === 'MANAGER') && memberStats && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Members Overview</h3>
            <Link to="/members" className="text-sm text-brand-600 hover:underline">
              View all →
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Card title="Total Members" value={memberStats.totalMembers} />
            <Card title="Active Memberships" value={memberStats.activeMemberships} />
            <Card title="Enrollments (30d)" value={memberStats.recentEnrollments} />
          </div>
        </div>
      )}

      {(user?.role === 'OWNER' || user?.role === 'MANAGER') && paymentStats && (
        <div className="mt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-800">Payment Alerts</h3>
            <Link to="/payments?outstanding=true" className="text-sm text-brand-600 hover:underline">
              View outstanding →
            </Link>
          </div>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            <Card title="Outstanding Amount" value={`₹${paymentStats.outstandingAmount.toLocaleString('en-IN')}`} />
            <Card title="Pending / Partial" value={paymentStats.pending + paymentStats.partial} />
            <Card title="Due Reminders" value={paymentStats.dueReminders} note={paymentStats.dueReminders > 0 ? 'Action needed' : undefined} />
          </div>
        </div>
      )}

      {user?.role === 'MANAGER' && (
        <div className="mt-6 rounded-xl border border-brand-200 bg-brand-50 p-4">
          <Link to="/enquiries" className="font-medium text-brand-700 hover:underline">
            Go to Enquiries →
          </Link>
          <p className="mt-1 text-sm text-brand-600">Manage leads and follow-ups</p>
        </div>
      )}

      {user?.role === 'TRAINER' && (
        <div className="mt-6 rounded-xl border border-slate-200 bg-white p-6">
          <h3 className="font-semibold text-slate-900">Trainer Portal</h3>
          <p className="mt-2 text-sm text-slate-600">
            View members assigned to you.
          </p>
          <Link to="/members" className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline">
            My Members →
          </Link>
        </div>
      )}

      {user?.role === 'OWNER' && (
        <div className="mt-6">
          <Card title="Revenue Reports" value="—" note="Phase 7" />
        </div>
      )}
    </div>
  );
}

function Card({
  title,
  value,
  note,
}: {
  title: string;
  value: string | number;
  note?: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
      {note && <p className="mt-1 text-xs text-slate-400">{note}</p>}
    </div>
  );
}
