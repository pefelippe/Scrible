// Paginated, presentational list of notes (patient, date/time, summary
// preview) with controls to change page, open a note, or delete one.
import { ChevronLeft, ChevronRight, Mic, Trash2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Note, NotesPage } from '@/types';
import { formatDateTime, patientFullName } from '@lib/format';
import { StatusMessage } from '@components/StatusMessage';

const PREVIEW_LENGTH = 130;

// Strip markdown syntax so preview text is plain readable prose.
function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .replace(/^#+\s*/gm, '')
    .replace(/`([^`]*)`/g, '$1')
    .replace(/\n+/g, ' ')
    .trim();
}

interface NotesListProps {
  notesPage: NotesPage;
  onChangePage: (page: number) => void;
  onSelectNote: (id: string) => void;
  onDeleteNote: (note: Note) => void;
}

export function NotesList({ notesPage, onChangePage, onSelectNote, onDeleteNote }: NotesListProps) {
  const { items, total, page, pageSize } = notesPage;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (items.length === 0) {
    return (
      <StatusMessage variant="empty">
        No notes yet. Use the + button to create the first one.
      </StatusMessage>
    );
  }

  return (
    <>
      <ul className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {items.map((note) => {
          const isAudio = note.sourceType === 'AUDIO';
          const preview = stripMarkdown(note.summary ?? note.rawText);
          return (
            <li key={note.id} className="group relative">
              <button
                onClick={() => onSelectNote(note.id)}
                className="flex h-full min-h-[180px] w-full flex-col gap-4 rounded-2xl border border-primary/20 bg-accent p-5 text-left outline-none transition-all hover:border-primary/50 hover:shadow-md hover:bg-accent/80 focus-visible:ring-2 focus-visible:ring-ring/50"
              >
                {/* Top row: source badge + date */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                      isAudio
                        ? 'bg-primary/30 text-amber-900'
                        : 'bg-primary/15 text-amber-800'
                    }`}
                  >
                    {isAudio ? <Mic size={9} /> : <FileText size={9} />}
                    {isAudio ? 'Audio' : 'Text'}
                  </span>
                  <span className="text-[10px] tabular-nums text-muted-foreground/70">
                    {formatDateTime(note.createdAt)}
                  </span>
                </div>

                {/* Patient name */}
                <strong className="font-heading text-sm font-semibold leading-snug">
                  {patientFullName(note.patient)}
                </strong>

                {/* Preview */}
                <p className="line-clamp-4 flex-1 text-xs leading-relaxed text-muted-foreground">
                  {preview.slice(0, PREVIEW_LENGTH)}
                  {preview.length > PREVIEW_LENGTH ? '…' : ''}
                </p>
              </button>

              <Button
                variant="ghost"
                size="icon-sm"
                className="absolute right-3 bottom-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:text-destructive focus-visible:opacity-100"
                onClick={() => onDeleteNote(note)}
                aria-label="Delete note"
              >
                <Trash2 size={13} />
              </Button>
            </li>
          );
        })}
      </ul>

      {/* Pagination */}
      <div className="flex items-center justify-between pt-1">
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onChangePage(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft size={14} />
          Previous
        </Button>
        <span className="text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          {page} / {totalPages}
          <span className="ml-2 font-normal normal-case tracking-normal">({total} notes)</span>
        </span>
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground"
          onClick={() => onChangePage(page + 1)}
          disabled={page >= totalPages}
        >
          Next
          <ChevronRight size={14} />
        </Button>
      </div>
    </>
  );
}
