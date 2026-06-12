// Structured SOAP section editor: 4 colored textareas, one per section.
// Parses/reconstructs the canonical "**S — Subjective:**\n..." markdown format.
import { useEffect, useRef, useState } from 'react';

export const SOAP_DEFS = [
  {
    key: 's' as const,
    letter: 'S',
    title: 'Subjective',
    color: '#d4960a',
    bg: '#fefbf0',
    border: '#fde68a',
    placeholder: "Patient's symptoms, complaints, and own report…",
  },
  {
    key: 'o' as const,
    letter: 'O',
    title: 'Objective',
    color: '#0e7faa',
    bg: '#f0f9fe',
    border: '#bae6fd',
    placeholder: 'Vitals, measurements, physical observations…',
  },
  {
    key: 'a' as const,
    letter: 'A',
    title: 'Assessment',
    color: '#1e8a4a',
    bg: '#f1fbf4',
    border: '#bbf7d0',
    placeholder: 'Clinical impression, diagnosis, progress evaluation…',
  },
  {
    key: 'p' as const,
    letter: 'P',
    title: 'Plan',
    color: '#7c3aed',
    bg: '#f8f4fe',
    border: '#ddd6fe',
    placeholder: 'Treatment strategy, interventions, follow-up…',
  },
] as const;

export type SoapKey = 's' | 'o' | 'a' | 'p';
export type SoapFields = Record<SoapKey, string>;

export function parseSoapFields(text: string): SoapFields {
  const fields: SoapFields = { s: '', o: '', a: '', p: '' };
  for (const { key, letter, title } of SOAP_DEFS) {
    const regex = new RegExp(
      `\\*\\*${letter}\\s*[—–-]\\s*${title}:\\*\\*([\\s\\S]*?)(?=\\*\\*[SOAP]\\s*[—–-]|$)`,
      'i',
    );
    const match = text.match(regex);
    if (match?.[1]) fields[key] = match[1].trim();
  }
  // Fall back: put plain text in S so the user can redistribute
  if (!Object.values(fields).some((v) => v !== '') && text.trim()) {
    fields.s = text.trim();
  }
  return fields;
}

export function soapFieldsToText(fields: SoapFields): string {
  return SOAP_DEFS.map(({ letter, title, key }) => `**${letter} — ${title}:**\n${fields[key]}`).join('\n\n');
}

interface SoapSectionEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  generating?: boolean;
}

export function SoapSectionEditor({ value, onChange, disabled, generating }: SoapSectionEditorProps) {
  const [fields, setFields] = useState<SoapFields>(() => parseSoapFields(value));
  // Track what we last emitted so we can distinguish parent-driven vs self-driven changes
  const lastEmitted = useRef(soapFieldsToText(parseSoapFields(value)));

  useEffect(() => {
    if (value !== lastEmitted.current) {
      setFields(parseSoapFields(value));
      lastEmitted.current = value;
    }
  }, [value]);

  function handleFieldChange(key: SoapKey, text: string) {
    const updated = { ...fields, [key]: text };
    setFields(updated);
    const reconstructed = soapFieldsToText(updated);
    lastEmitted.current = reconstructed;
    onChange(reconstructed);
  }

  return (
    <div className="relative flex flex-col gap-3">
      {/* AI generating overlay */}
      {generating && (
        <div className="absolute inset-0 z-10 flex flex-col gap-3 rounded-lg p-1">
          {SOAP_DEFS.map(({ key, bg, border, color }) => (
            <div key={key} className="flex flex-col gap-1.5">
              <div className="h-4 w-24 animate-pulse rounded bg-muted" />
              <div className="h-20 rounded-lg" style={{ background: bg, border: `1.5px solid ${border}`, borderLeft: `3px solid ${color}`, opacity: 0.5 }}>
                {[80, 65, 90].map((w, i) => (
                  <div key={i} className="mx-3 mt-3 h-2.5 animate-pulse rounded-sm bg-current/20" style={{ width: `${w}%`, animationDelay: `${i * 100}ms`, color }} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {SOAP_DEFS.map(({ key, letter, title, color, bg, border, placeholder }) => (
        <div key={key} className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <span className="font-heading text-sm font-black leading-none" style={{ color }}>{letter}</span>
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>{title}</span>
          </div>
          <textarea
            value={fields[key]}
            onChange={(e) => handleFieldChange(key, e.target.value)}
            disabled={disabled || generating}
            placeholder={placeholder}
            rows={3}
            className="w-full resize-none rounded-lg px-3 py-2.5 text-[13px] leading-relaxed placeholder:text-muted-foreground/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-60"
            style={{
              background: bg,
              border: `1.5px solid ${border}`,
              borderLeft: `3px solid ${color}`,
            }}
          />
        </div>
      ))}
    </div>
  );
}
