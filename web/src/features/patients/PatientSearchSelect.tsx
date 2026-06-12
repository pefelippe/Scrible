// Searchable patient picker: type to filter by name or MRN, click to select.
// Single mode replaces the selection; multiple mode appends. Selected
// patients render as removable chips inside the search field and are hidden
// from the option list. The list opens on click/typing, not on focus, so
// dialogs that autofocus the field don't open it immediately.
import { useEffect, useRef, useState } from 'react';
import { Search, X } from 'lucide-react';
import type { Patient } from '@/types';
import { patientFullName } from '@lib/format';

interface PatientSearchSelectProps {
  id?: string;
  patients: Patient[] | null;
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  multiple?: boolean;
  placeholder?: string;
}

export function PatientSearchSelect({
  id,
  patients,
  selectedIds,
  onChange,
  multiple = false,
  placeholder = 'Search patients…',
}: PatientSearchSelectProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close the dropdown when the user clicks outside the component.
  useEffect(() => {
    if (!open) return;
    function handleMouseDown(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleMouseDown);
    return () => document.removeEventListener('mousedown', handleMouseDown);
  }, [open]);

  const selected = (patients ?? []).filter((patient) => selectedIds.includes(patient.id));
  const lowerQuery = query.trim().toLowerCase();
  const matches = (patients ?? []).filter(
    (patient) =>
      !selectedIds.includes(patient.id) &&
      (lowerQuery === '' ||
        patientFullName(patient).toLowerCase().includes(lowerQuery) ||
        patient.mrn.toLowerCase().includes(lowerQuery)),
  );

  function handlePick(patientId: string) {
    onChange(multiple ? [...selectedIds, patientId] : [patientId]);
    if (!multiple) {
      setOpen(false);
    }
    setQuery('');
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="flex h-10 w-full flex-nowrap items-center gap-1.5 overflow-x-auto rounded-md border border-input bg-transparent px-2.5 py-1.5 text-sm shadow-xs transition-[color,box-shadow] focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Search size={14} className="shrink-0 text-muted-foreground" />
        {selected.map((patient) => (
          <span
            key={patient.id}
            className="flex items-center gap-1 rounded-full bg-accent py-0.5 pr-1 pl-2.5 text-xs font-medium"
          >
            {patientFullName(patient)}
            <button
              type="button"
              onClick={() => onChange(selectedIds.filter((existing) => existing !== patient.id))}
              aria-label={`Remove ${patientFullName(patient)}`}
              className="cursor-pointer rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          id={id}
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onClick={() => setOpen(true)}
          placeholder={selected.length > 0 ? '' : patients ? placeholder : 'Loading…'}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          className="min-w-28 flex-1 bg-transparent outline-none placeholder:text-muted-foreground"
        />
      </div>
      {open && patients !== null && (
        <ul className="absolute top-full right-0 left-0 z-50 mt-1 max-h-56 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-md">
          {matches.length === 0 ? (
            <li className="px-2 py-2 text-sm text-muted-foreground">
              {selected.length > 0 && lowerQuery === ''
                ? 'All matching patients selected.'
                : 'No patients found.'}
            </li>
          ) : (
            matches.map((patient) => (
              <li key={patient.id}>
                <button
                  type="button"
                  onClick={() => handlePick(patient.id)}
                  className="flex w-full cursor-pointer items-center justify-between gap-3 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-muted"
                >
                  <span className="min-w-0">
                    <span className="block truncate">{patientFullName(patient)}</span>
                    <span className="block font-mono text-xs text-muted-foreground">
                      {patient.mrn}
                    </span>
                  </span>
                </button>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
