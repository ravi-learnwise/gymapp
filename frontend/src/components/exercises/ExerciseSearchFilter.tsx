import { useEffect, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../../lib/api';
import { BODY_PARTS, type Exercise } from '../../types/training-card';

type ExerciseSearchFilterProps = {
  search: string;
  bodyPart: string;
  onSearchChange: (value: string) => void;
  onBodyPartChange: (value: string) => void;
  onSelectSuggestion?: (exercise: Exercise) => void;
  searchPlaceholder?: string;
  className?: string;
};

export default function ExerciseSearchFilter({
  search,
  bodyPart,
  onSearchChange,
  onBodyPartChange,
  onSelectSuggestion,
  searchPlaceholder = 'Search exercises by name, muscle, or equipment…',
  className = '',
}: ExerciseSearchFilterProps) {
  const [suggestions, setSuggestions] = useState<Exercise[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = search.trim();
    if (q.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(() => {
      setLoading(true);
      const params = new URLSearchParams({ search: q });
      if (bodyPart) params.set('bodyPart', bodyPart);
      api<Exercise[]>(`/exercises?${params}`)
        .then((items) => setSuggestions(items.slice(0, 8)))
        .catch(() => setSuggestions([]))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(timer);
  }, [search, bodyPart]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, []);

  const pick = (ex: Exercise) => {
    onSearchChange(ex.name);
    onSelectSuggestion?.(ex);
    setOpen(false);
  };

  return (
    <div className={`flex flex-wrap items-end gap-3 ${className}`}>
      <div ref={wrapRef} className="relative min-w-[16rem] flex-1">
        <label className="form-label" htmlFor="exercise-search">
          Search exercises
        </label>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted" />
          <input
            id="exercise-search"
            className="input-field !h-12 !pl-10"
            placeholder={searchPlaceholder}
            value={search}
            autoComplete="off"
            onChange={(e) => {
              onSearchChange(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
          />
        </div>
        {open && search.trim().length >= 2 && (
          <ul className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-lg border border-line bg-white py-1 shadow-lg">
            {loading && (
              <li className="px-4 py-2 text-sm text-ink-muted">Searching…</li>
            )}
            {!loading && !suggestions.length && (
              <li className="px-4 py-2 text-sm text-ink-muted">No matches</li>
            )}
            {suggestions.map((ex) => (
              <li key={ex.id}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-canvas"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => pick(ex)}
                >
                  {ex.imageUrl ? (
                    <img src={ex.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded border object-cover" />
                  ) : (
                    <div className="h-9 w-9 shrink-0 rounded border bg-canvas" />
                  )}
                  <span className="min-w-0">
                    <span className="block font-medium text-ink">{ex.name}</span>
                    <span className="block truncate text-xs text-ink-muted">
                      {[ex.bodyPart, ex.primaryMuscle].filter(Boolean).join(' · ')}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="w-full sm:w-48">
        <label className="form-label" htmlFor="body-part-filter">
          Body part
        </label>
        <select
          id="body-part-filter"
          className="select-field w-full !h-12"
          value={bodyPart}
          onChange={(e) => onBodyPartChange(e.target.value)}
        >
          <option value="">All body parts</option>
          {BODY_PARTS.map((bp) => (
            <option key={bp} value={bp}>
              {bp}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
