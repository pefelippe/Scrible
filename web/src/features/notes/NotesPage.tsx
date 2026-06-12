// Notes page: paginated list of all notes. Creation happens via
// the quick-actions button. Click a note to open the view modal.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { deleteNote, fetchNotes } from '@api/client';
import { useAsync } from '@hooks/useAsync';
import type { Note } from '@/types';
import { errorMessage, patientFullName } from '@lib/format';
import { ConfirmDeleteDialog } from '@components/ConfirmDeleteDialog';
import { NotesList } from './NotesList';
import { NoteViewModal } from './NoteViewModal';
import { PageSection } from '@components/PageSection';
import { StatusMessage } from '@components/StatusMessage';

const PAGE_SIZE = 10;

export function NotesPage() {
  const { key: locationKey } = useLocation();
  const [page, setPage] = useState(1);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: notesPage, error: notesError, reload: reloadNotes } = useAsync(
    () => fetchNotes({ page, pageSize: PAGE_SIZE }),
    'Failed to load notes',
    [page, locationKey],
  );

  const error = notesError ?? actionError;

  async function handleDeleteNote(note: Note) {
    setActionError(null);
    try {
      await deleteNote(note.id);
      setNoteToDelete(null);
      reloadNotes();
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to delete note'));
    }
  }

  return (
    <PageSection title="Notes">
      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {notesPage ? (
        <NotesList
          notesPage={notesPage}
          onChangePage={setPage}
          onSelectNote={setSelectedNoteId}
          onDeleteNote={setNoteToDelete}
        />
      ) : (
        !error && <StatusMessage variant="muted">Loading…</StatusMessage>
      )}
      {selectedNoteId && (
        <NoteViewModal
          noteId={selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
          onDeleted={() => {
            setSelectedNoteId(null);
            reloadNotes();
          }}
        />
      )}
      {noteToDelete && (
        <ConfirmDeleteDialog
          title="Delete note"
          description={`The note for ${patientFullName(noteToDelete.patient)} will be permanently deleted.`}
          onConfirm={() => handleDeleteNote(noteToDelete)}
          onClose={() => setNoteToDelete(null)}
        />
      )}
    </PageSection>
  );
}
