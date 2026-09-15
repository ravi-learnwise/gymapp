import { FormEvent, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, FileSpreadsheet, Upload } from 'lucide-react';
import { apiDownload, apiUpload } from '../../lib/api';

type ImportRow = {
  row: number;
  fullName?: string;
  mobileNumber?: string;
  status: 'created' | 'failed';
  memberNumber?: string;
  memberId?: string;
  error?: string;
};

type ImportResult = {
  totalRows: number;
  created: number;
  failed: number;
  results: ImportRow[];
};

export default function MemberImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [downloading, setDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);

  const downloadTemplate = async () => {
    setError('');
    setDownloading(true);
    try {
      await apiDownload('/members/import-template', 'gym-active-members-import.xlsx');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not download template');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError('Choose an Excel file first');
      return;
    }
    setError('');
    setUploading(true);
    setResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const data = await apiUpload<ImportResult>('/members/import', fd);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="max-w-5xl">
      <Link to="/members" className="btn-link text-sm">
        <ArrowLeft className="h-4 w-4" />
        Back to members
      </Link>
      <h2 className="mt-2 text-2xl text-ink">Import members from Excel</h2>
      <p className="mt-1 text-sm font-medium text-ink-secondary">
        For currently active members only. Each row creates a member with a primary membership and optional payment.
        Past / expired members should not be included — treat them as new enquiries if they return.
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="page-section p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-accent-info rounded-xl p-2.5">
              <Download className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-lg text-ink">1. Download template</h3>
              <p className="text-xs font-medium text-ink-secondary">
                Includes Instructions, Members, and a Reference sheet of this gym’s programs
              </p>
            </div>
          </div>
          <button type="button" onClick={downloadTemplate} disabled={downloading} className="btn btn-secondary">
            <FileSpreadsheet className="h-4 w-4" />
            {downloading ? 'Preparing…' : 'Download Excel template'}
          </button>
        </section>

        <section className="page-section p-5 sm:p-6">
          <div className="mb-4 flex items-center gap-3">
            <div className="icon-accent-warning rounded-xl p-2.5">
              <Upload className="h-5 w-5" strokeWidth={2.25} />
            </div>
            <div>
              <h3 className="text-lg text-ink">2. Upload filled workbook</h3>
              <p className="text-xs font-medium text-ink-secondary">.xlsx only · max 5 MB · about 100 members is fine</p>
            </div>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="file"
              accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="block w-full text-sm"
            />
            <button type="submit" disabled={uploading || !file} className="btn btn-primary">
              {uploading ? 'Importing…' : 'Import members'}
            </button>
          </form>
        </section>
      </div>

      {error && (
        <p className="mt-6 rounded-xl border border-danger-border bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
          {error}
        </p>
      )}

      {result && (
        <section className="mt-6 page-section p-5 sm:p-6">
          <h3 className="text-lg text-ink">Import result</h3>
          <p className="mt-1 text-sm text-ink-secondary">
            {result.created} created · {result.failed} failed · {result.totalRows} rows processed
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-secondary">
                  <th className="py-2 pr-3">Row</th>
                  <th className="py-2 pr-3">Name</th>
                  <th className="py-2 pr-3">Mobile</th>
                  <th className="py-2 pr-3">Status</th>
                  <th className="py-2">Detail</th>
                </tr>
              </thead>
              <tbody>
                {result.results.map((r) => (
                  <tr key={r.row} className="border-b border-line/60">
                    <td className="py-2 pr-3">{r.row}</td>
                    <td className="py-2 pr-3">{r.fullName || '—'}</td>
                    <td className="py-2 pr-3">{r.mobileNumber || '—'}</td>
                    <td className="py-2 pr-3">
                      {r.status === 'created' ? (
                        <span className="badge badge-success">Created</span>
                      ) : (
                        <span className="badge badge-danger">Failed</span>
                      )}
                    </td>
                    <td className="py-2">
                      {r.status === 'created' && r.memberId ? (
                        <Link to={`/members/${r.memberId}`} className="text-brand-600 hover:underline">
                          {r.memberNumber}
                        </Link>
                      ) : (
                        <span className="text-danger">{r.error}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
