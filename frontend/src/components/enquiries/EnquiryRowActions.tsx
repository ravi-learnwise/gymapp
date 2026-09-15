import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarClock, Eye, MoreHorizontal, Pencil, UserCheck } from 'lucide-react';
import type { Enquiry, EnquiryStatus } from '../../types/enquiry';

type Props = {
  enquiry: Enquiry;
};

const CLOSED: EnquiryStatus[] = ['CONVERTED', 'LOST'];

export default function EnquiryRowActions({ enquiry }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const isClosed = CLOSED.includes(enquiry.status);
  const canConvert = !isClosed && enquiry.status !== 'CONVERTED';

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-line bg-white text-ink-muted transition-colors hover:bg-brand-50 hover:text-ink"
        aria-label="Enquiry actions"
        aria-expanded={open}
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-line bg-white py-1 shadow-lg">
          <MenuLink
            to={`/enquiries/${enquiry.id}`}
            icon={Eye}
            label="View"
            onClick={() => setOpen(false)}
          />
          {!isClosed && (
            <MenuLink
              to={`/enquiries/${enquiry.id}/edit`}
              icon={Pencil}
              label="Edit"
              onClick={() => setOpen(false)}
            />
          )}
          {!isClosed && (
            <MenuButton
              icon={CalendarClock}
              label="Follow Up"
              onClick={() => {
                setOpen(false);
                navigate(`/enquiries/${enquiry.id}`);
              }}
            />
          )}
          {canConvert && (
            <MenuButton
              icon={UserCheck}
              label="Convert"
              onClick={() => {
                setOpen(false);
                navigate(`/enrollments/new?enquiryId=${enquiry.id}`);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MenuLink({
  to,
  icon: Icon,
  label,
  onClick,
}: {
  to: string;
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <Link
      to={to}
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-ink hover:bg-brand-50"
    >
      <Icon className="h-4 w-4 text-ink-muted" />
      {label}
    </Link>
  );
}

function MenuButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-ink hover:bg-brand-50"
    >
      <Icon className="h-4 w-4 text-ink-muted" />
      {label}
    </button>
  );
}
