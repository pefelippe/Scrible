// Modal view/edit of a note: editable content, AI enhancement, and delete.
import { useState } from 'react';
import { FileText, LayoutList, Loader2, Mic, Pencil, RotateCcw, Sparkles, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { deleteNote, fetchNote, generateSummary, updateNote } from '@api/client';
import { useAsync } from '@hooks/useAsync';
import type { Note } from '@/types';
import { errorMessage, formatDateTime, patientFullName } from '@lib/format';
import { AppModal } from '@components/AppModal';
import { StatusMessage } from '@components/StatusMessage';
import { SOAP_DEFS, SoapSectionEditor } from './SoapSectionEditor';

const CHAR_LIMIT = 2000;

interface NoteViewModalProps {
  noteId: string;
  onClose: () => void;
  onDeleted: () => void;
}

export function NoteViewModal({ noteId, onClose, onDeleted }: NoteViewModalProps) {
  const { data: note, error: loadError } = useAsync(
    () => fetchNote(noteId),
    'Failed to load note',
    [noteId],
  );

  return (
    <AppModal title="Note" onClose={onClose} size="md">
      {loadError && <StatusMessage variant="error">{loadError}</StatusMessage>}
      {!note && !loadError && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 size={14} className="animate-spin" />
          Loading…
        </div>
      )}
      {note && (
        <NoteEditor
          note={note}
          noteId={noteId}
          onClose={onClose}
          onDeleted={onDeleted}
        />
      )}
    </AppModal>
  );
}

interface NoteEditorProps {
  note: Note;
  noteId: string;
  onClose: () => void;
  onDeleted: () => void;
}

function parseSoapSections(text: string) {
  return SOAP_DEFS.map(({ letter, title, color, bg, border }) => {
    const regex = new RegExp(
      `\\*\\*${letter}\\s*[—–-]\\s*${title}:\\*\\*([\\s\\S]*?)(?=\\*\\*[SOAP]\\s*[—–-]|$)`,
      'i',
    );
    const match = text.match(regex);
    return match?.[1] ? { letter, title, content: match[1].trim(), color, bg, border } : null;
  }).filter((s): s is NonNullable<typeof s> => s !== null);
}

function NoteEditor({ note, noteId, onClose, onDeleted }: NoteEditorProps) {
  const displayContent = note.summary ?? note.rawText;
  const [content, setContent] = useState(displayContent);
  const [editing, setEditing] = useState(false);
  const [soapView, setSoapView] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const charCount = content.length;
  const overLimit = charCount > CHAR_LIMIT;
  const isEmpty = content.trim() === '';
  const busy = generating || saving || deleting;
  const isDirty = content !== displayContent;
  const soapSections = parseSoapSections(content);
  const hasSoap = soapSections.length > 0;

  function handleUndo() {
    const prev = history[history.length - 1];
    if (!prev) return;
    setContent(prev);
    setHistory((h) => h.slice(0, -1));
  }

  async function handleEnhance() {
    if (!content.trim()) return;
    setGenerating(true);
    setError(null);
    try {
      const { summary } = await generateSummary(content);
      setHistory((h) => [...h, content]);
      setContent(summary);
    } catch (err) {
      setError(errorMessage(err, 'Enhancement failed. Please try again.'));
    } finally {
      setGenerating(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      await updateNote(noteId, content);
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Failed to save note'));
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setError(null);
    try {
      await deleteNote(noteId);
      onDeleted();
      onClose();
    } catch (err) {
      setError(errorMessage(err, 'Failed to delete note'));
      setDeleting(false);
      setConfirming(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Metadata header */}
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted">
          {note.sourceType === 'AUDIO' ? (
            <Mic size={15} className="text-muted-foreground" />
          ) : (
            <FileText size={15} className="text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground">{patientFullName(note.patient)}</p>
          <p className="text-[12px] text-muted-foreground/70">
            {formatDateTime(note.createdAt)}
            {' · '}
            {note.sourceType === 'AUDIO' ? 'Audio recording' : 'Typed text'}
          </p>
        </div>
      </div>

      <div className="h-px bg-border/50" />

      {/* View mode */}
      {!editing && (
        <div className="flex flex-col gap-3">
          {hasSoap ? (
            soapSections.map(({ letter, title, content: text, color, bg, border }) => (
              <div key={letter} className="rounded-lg border p-3.5" style={{ background: bg, borderColor: border }}>
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="font-heading text-sm font-black" style={{ color }}>{letter}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color }}>{title}</span>
                </div>
                <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">{text}</p>
              </div>
            ))
          ) : (
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed text-foreground/80">
              {content || <span className="italic text-muted-foreground">No content</span>}
            </p>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="flex flex-col gap-2">
          {/* Editor header */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-muted-foreground/70">
              Editing
            </span>
            {!hasSoap && (
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

          {/* Editor body */}
          {(hasSoap || soapView) ? (
            <SoapSectionEditor
              value={content}
              onChange={setContent}
              disabled={saving}
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
                disabled={saving || generating}
                placeholder="Note content…"
                className="h-[140px] w-full resize-none rounded-md border border-input bg-background px-3 py-2.5 text-[13px] leading-relaxed shadow-xs placeholder:text-muted-foreground focus:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          )}

          {/* AI action bar */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isEmpty || busy || overLimit}
              onClick={handleEnhance}
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
              <Button type="button" variant="outline" disabled={busy} onClick={handleUndo} title="Undo" className="h-10 w-10 shrink-0 p-0">
                <RotateCcw size={13} />
              </Button>
            )}
          </div>
        </div>
      )}

      {error && <StatusMessage variant="error">{error}</StatusMessage>}

      {/* Footer */}
      <div className="h-px bg-border/50" />

      {confirming ? (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
          <span className="mr-auto text-sm text-muted-foreground">Delete permanently?</span>
          <Button variant="outline" size="sm" onClick={() => setConfirming(false)} disabled={deleting}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleting}>
            {deleting ? <><Loader2 size={13} className="animate-spin" /> Deleting…</> : 'Delete'}
          </Button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setConfirming(true)}
            disabled={busy}
            className="mr-auto flex items-center gap-1.5 text-[12px] font-medium text-muted-foreground/60 transition-colors hover:text-destructive disabled:opacity-40"
          >
            <Trash2 size={12} />
            Delete
          </button>
          {editing ? (
            <>
              <Button type="button" variant="outline" size="sm" onClick={() => { setEditing(false); setContent(displayContent); setHistory([]); setSoapView(false); }} disabled={busy}>
                Cancel
              </Button>
              <Button type="button" size="sm" onClick={handleSave} disabled={!isDirty || isEmpty || busy}>
                {saving ? <><Loader2 size={13} className="animate-spin" /> Saving…</> : 'Save'}
              </Button>
            </>
          ) : (
            <>
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Close</Button>
              <Button type="button" size="sm" onClick={() => setEditing(true)} className="gap-1.5">
                <Pencil size={12} />
                Edit
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
