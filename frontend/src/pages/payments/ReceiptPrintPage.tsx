import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../../lib/api';
import ReceiptSlip from '../../components/ReceiptSlip';
import type { Receipt } from '../../types/payment';

export default function ReceiptPrintPage() {
  const { id, transactionId } = useParams<{ id: string; transactionId: string }>();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id && transactionId) {
      api<Receipt>(`/payments/${id}/receipt/${transactionId}`)
        .then(setReceipt)
        .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load receipt'));
    }
  }, [id, transactionId]);

  const handlePrint = () => window.print();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-slate-500">Loading receipt…</p>
      </div>
    );
  }

  return (
    <div className="receipt-print-page min-h-screen bg-slate-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-4 flex max-w-md justify-center gap-2 print:hidden">
        <button
          type="button"
          onClick={handlePrint}
          className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          Print / Save as PDF
        </button>
        <button
          type="button"
          onClick={() => window.close()}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm hover:bg-slate-50"
        >
          Close
        </button>
      </div>
      <ReceiptSlip receipt={receipt} />
      <p className="mx-auto mt-4 max-w-md text-center text-xs text-slate-400 print:hidden">
        Tip: Choose &quot;Save as PDF&quot; in the print dialog to download a PDF copy.
      </p>
    </div>
  );
}
