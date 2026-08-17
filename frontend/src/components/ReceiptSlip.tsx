import { PAYMENT_MODE_LABELS, formatCurrency, type PaymentMode, type Receipt } from '../types/payment';

export default function ReceiptSlip({ receipt }: { receipt: Receipt }) {
  return (
    <div id="receipt-slip" className="receipt-slip mx-auto max-w-md bg-white p-8 text-ink">
      <div className="text-center">
        <h1 className="text-lg">{receipt.gym.name}</h1>
        {receipt.gym.address && <p className="mt-1 text-xs text-ink-secondary">{receipt.gym.address}</p>}
        {receipt.gym.gstNumber && <p className="text-xs text-ink-secondary">GST: {receipt.gym.gstNumber}</p>}
      </div>
      <hr className="my-4 border-line" />
      <p className="text-center font-semibold">Payment Receipt</p>
      <p className="text-center text-sm text-ink-secondary">{receipt.receiptNumber}</p>
      <dl className="mt-4 space-y-2 text-sm">
        <Row label="Member" value={`${receipt.member.fullName} (${receipt.member.memberNumber})`} />
        <Row label="Mobile" value={receipt.member.mobileNumber} />
        <Row label="Program" value={receipt.program} />
        <Row label="Date" value={new Date(receipt.paymentDate).toLocaleString()} />
        <Row label="Mode" value={PAYMENT_MODE_LABELS[receipt.paymentMode as PaymentMode]} />
        <Row label="Amount Paid" value={formatCurrency(receipt.amount)} />
        <Row label="Total Fee" value={formatCurrency(receipt.totalFee)} />
        <Row label="Discount" value={formatCurrency(receipt.discountAmount)} />
        <Row label="Final Amount" value={formatCurrency(receipt.finalAmount)} />
        <Row label="Balance" value={formatCurrency(receipt.pendingAmount)} />
        {Number(receipt.gstAmount) > 0 && <Row label="GST" value={formatCurrency(receipt.gstAmount)} />}
      </dl>
      {receipt.notes && <p className="mt-4 text-xs text-ink-secondary">Note: {receipt.notes}</p>}
      <p className="mt-6 text-center text-xs text-ink-muted">Thank you for your payment</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink-secondary">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}
