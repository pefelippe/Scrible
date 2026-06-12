// New-note dialog — plain textarea for note content.
// Audio or text input → optional AI enhancement with undo support.
import React, { useState } from 'react';
import { Activity, FileText, LayoutList, Loader2, Mic, Pill, RotateCcw, Scissors, Sparkles, Type } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { createNote, fetchPatients, generateSummary, transcribeAudio } from '@api/client';
import { useAsync } from '@hooks/useAsync';
import type { Note } from '@/types';
import { errorMessage } from '@lib/format';
import { AppModal } from '@components/AppModal';
import { StatusMessage } from '@components/StatusMessage';
import { AudioRecorder } from './AudioRecorder';
import { SoapSectionEditor } from './SoapSectionEditor';
import { PatientSearchSelect } from '@features/patients/PatientSearchSelect';

const CHAR_LIMIT = 2000;

// Raw clinical prompts — user fills these in and hits "Enhance" to generate SOAP
const TEMPLATES: { label: string; icon: React.ElementType; text: string }[] = [
  {
    label: 'General visit',
    icon: FileText,
    text: `Patient c/o shortness of breath and fatigue on exertion. BP 138/88, HR 92, SpO2 94%, Temp 37.1. Mild ankle edema bilaterally. Ambulating with walker. Fluid restriction reinforced. Medication schedule reviewed. Follow-up in 3 days.`,
  },
  {
    label: 'Wound assessment',
    icon: Scissors,
    text: `Wound right heel plantar surface, 2.5x1.8x0.3 cm. Pink granulation, scant serous exudate, no odor. Mild maceration at edges. Removed saturated foam dressing, applied non-adherent contact layer with foam secondary. Patient reports pain 3/10, manageable. Next dressing change in 3 days.`,
  },
  {
    label: 'Medication review',
    icon: Pill,
    text: `Reviewed Furosemide 40mg daily, Carvedilol 6.25mg BID, Lisinopril 10mg daily. Good adherence, pill organizer used correctly. Patient reports mild fatigue with Carvedilol, no dizziness. No meds administered. Educated on fluid overload signs. Furosemide refill due next week.`,
  },
  {
    label: 'Vital signs',
    icon: Activity,
    text: `BP 138/88, HR 92, RR 18, Temp 37.1, SpO2 94%, weight 72kg. Patient reports mild fatigue and occasional dizziness on standing. SpO2 slightly low. Weight stable. Monitor twice weekly.`,
  },
];

interface NoteCreateDialogProps {
  onCreated: (notes: Note[]) => void;
  onClose: () => void;
}

export function NoteCreateDialog({ onCreated, onClose }: NoteCreateDialogProps) {
  const { data: patients, error: loadError } = useAsync(fetchPatients, 'Failed to load patients', []);
  const [patientIds, setPatientIds] = useState<string[]>([]);
  const [mode, setMode] = useState<'text' | 'audio'>('text');

  const [content, setContent] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [isAiContent, setIsAiContent] = useState(false);
  const [soapView, setSoapView] = useState(false);

  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [transcribed, setTranscribed] = useState(false);

  const [transcribing, setTranscribing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEmpty = content.trim() === '';
  const charCount = content.length;
  const overLimit = charCount > CHAR_LIMIT;
  const busy = transcribing || generating || submitting;
  const noPatients = patients !== null && patients.length === 0;
  const contentVisible = mode === 'text' || transcribed;
  const canSubmit = patientIds.length > 0 && contentVisible && !isEmpty && !busy;

  function handleUndo() {
    const prev = history[history.length - 1];
    if (prev === undefined) return;
    setContent(prev);
    setHistory((h) => h.slice(0, -1));
    setIsAiContent(false);
  }

  function handleAudioCaptured(file: File | null) {
    setAudioFile(file);
    if (!file) {
      setContent('');
      setHistory([]);
      setIsAiContent(false);
      setTranscribed(false);
    }
  }

  async function handleGenerateNote() {
    if (!audioFile) return;
    setTranscribing(true);
    setError(null);
    try {
      const { transcript } = await transcribeAudio(audioFile);
      setContent(transcript);
      setHistory([]);
      setIsAiContent(false);
      setTranscribed(true);
    } catch (err) {
      setError(errorMessage(err, 'Transcription failed'));
    } finally {
      setTranscribing(false);
    }
  }

  async function handleGenerateSummary() {
    if (!content.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const { summary } = await generateSummary(content);
      setHistory((h) => [...h, content]);
      setContent(summary);
      setIsAiContent(true);
    } catch (err) {
      setError(errorMessage(err, 'AI generation failed. Please try again.'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const originalText = isAiContent ? (history[0] ?? content) : content;
      const summary = isAiContent ? content : undefined;
      const notes = await Promise.all(
        patientIds.map((patientId) =>
          createNote({ patientId, text: originalText, summary }),
        ),
      );
      onCreated(notes);
    } catch (err) {
      setError(errorMessage(err, 'Failed to create note'));
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      title="New note"
      onClose={onClose}
      onSubmit={noPatients ? undefined : handleSubmit}
      size="md"
      footer={
        noPatients || !contentVisible ? undefined : (
          <>
            <Button type="button" variant="outline" onClick={onClose} disabled={busy}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSubmit}>
              {submitting ? (
                <>
                  <Loader2 size={14} className="animate-spin" />
                  Saving…
                </>
              ) : (
                'Create'
              )}
            </Button>
          </>
        )
      }
    >
      {noPatients ? (
        <StatusMessage variant="muted">
          Add a patient before creating your first note.
        </StatusMessage>
      ) : (
        <>
          {/* Patient + mode row */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="grid gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                Patient
              </label>
              <PatientSearchSelect
                id="note-patient"
                patients={patients}
                selectedIds={patientIds}
                onChange={setPatientIds}
                multiple
                placeholder="Search by name or MRN…"
              />
            </div>

            <div className="grid gap-1">
              <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                Input
              </label>
              <div
                className="flex h-10 items-center gap-0.5 rounded-lg bg-muted p-1"
                role="tablist"
                aria-label="Note input mode"
              >
                {([
                  { value: 'text', icon: Type, label: 'Text' },
                  { value: 'audio', icon: Mic, label: 'Audio' },
                ] as const).map(({ value, icon: Icon, label }) => (
                  <button
                    key={value}
                    type="button"
                    role="tab"
                    aria-selected={mode === value}
                    onClick={() => {
                      setMode(value);
                      setAudioFile(null);
                      setTranscribed(false);
                      setContent('');
                      setHistory([]);
                      setIsAiContent(false);
                      setSoapView(false);
                      setError(null);
                    }}
                    className={cn(
                      'flex h-8 items-center gap-1.5 rounded-md px-4 text-sm font-medium transition-all duration-150',
                      mode === value
                        ? 'bg-background text-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section divider */}
          <div className="h-px bg-border/50" />

          {/* Audio capture */}
          {mode === 'audio' && (
            <div className="grid gap-2">
              <AudioRecorder disabled={busy} onRecorded={handleAudioCaptured} />
              {audioFile && !transcribed && (
                <Button
                  type="button"
                  disabled={busy}
                  onClick={handleGenerateNote}
                  className="gap-2"
                >
                  {transcribing ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Sparkles size={13} />
                  )}
                  {transcribing ? 'Transcribing…' : 'Generate note'}
                </Button>
              )}
            </div>
          )}

          {/* Note content */}
          {contentVisible && <div className="grid gap-2">
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
                Note content
              </label>
              {isAiContent && (
                <span className="flex items-center gap-1 rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                  <Sparkles size={9} />
                  AI
                </span>
              )}
              {!isAiContent && (
                <button
                  type="button"
                  onClick={() => setSoapView((v) => !v)}
                  className={cn(
                    'flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-semibold transition-colors',
                    soapView
                      ? 'bg-primary/15 text-primary'
                      : 'text-muted-foreground/60 hover:text-muted-foreground hover:bg-muted',
                  )}
                >
                  <LayoutList size={10} />
                  SOAP
                </button>
              )}
              <span className={cn('ml-auto text-[11px] tabular-nums', overLimit ? 'text-destructive font-semibold' : 'text-muted-foreground/60')}>
                {charCount} / {CHAR_LIMIT}
              </span>
            </div>

            {/* Template chips — only shown before AI enhancement in text mode */}
            {isEmpty && mode === 'text' && (
              <div className="flex flex-wrap gap-1.5">
                {TEMPLATES.map(({ label, icon: Icon, text }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setContent(text)}
                    className="flex items-center gap-1.5 rounded-md border border-border/70 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/5 hover:text-foreground"
                  >
                    <Icon size={10} />
                    {label}
                  </button>
                ))}
              </div>
            )}

            {/* SOAP section editor (after AI enhance or toggled manually) */}
            {(isAiContent || soapView) ? (
              <SoapSectionEditor
                value={content}
                onChange={setContent}
                disabled={submitting}
                generating={generating}
              />
            ) : (
              <div className="relative">
                {generating && (
                  <div className="absolute inset-0 z-10 flex flex-col gap-2.5 rounded-md border border-primary/25 bg-accent/50 p-4">
                    {[78, 100, 62, 90, 55, 82, 68].map((w, i) => (
                      <div
                        key={i}
                        className="h-3 animate-pulse rounded-sm bg-primary/25"
                        style={{ width: `${w}%`, animationDelay: `${i * 90}ms` }}
                      />
                    ))}
                  </div>
                )}
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  disabled={submitting || generating}
                  placeholder={
                    mode === 'audio'
                      ? 'Transcript will appear here. Edit then generate SOAP.'
                      : 'Type raw visit notes here, then generate SOAP with AI…'
                  }
                  className="h-[180px] w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-[13px] leading-relaxed shadow-xs placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
                />
              </div>
            )}

            {/* AI action bar */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={isEmpty || busy || overLimit}
                onClick={handleGenerateSummary}
                className={cn(
                  'flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-semibold transition-all duration-150',
                  'bg-primary text-primary-foreground shadow-sm hover:brightness-110 hover:shadow-md',
                  'disabled:cursor-not-allowed disabled:opacity-40',
                )}
              >
                {generating ? (
                  <><Loader2 size={14} className="animate-spin" /><span>Enhancing…</span></>
                ) : (
                  <><Sparkles size={14} /><span>Enhance with AI</span></>
                )}
              </button>
              {history.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  disabled={busy}
                  onClick={handleUndo}
                  title="Undo last AI generation"
                  className="h-10 w-10 shrink-0 p-0"
                >
                  <RotateCcw size={13} />
                </Button>
              )}
            </div>
          </div>}

          {(loadError ?? error) && (
            <StatusMessage variant="error">{loadError ?? error}</StatusMessage>
          )}
        </>
      )}
    </AppModal>
  );
}
