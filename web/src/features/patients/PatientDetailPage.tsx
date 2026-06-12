// Patient detail view: resolves the patient id from the URL, shows the
// patient metadata panel with edit/delete actions, and lists that patient's
// notes.
import { useState } from 'react';
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { deleteNote, deletePatient, fetchNotes, fetchPatient } from '@api/client';
import { useAsync } from '@hooks/useAsync';
import { ROUTES } from '@/routes';
import type { Note, NotesPage, Patient } from '@/types';
import { errorMessage, formatDate, patientFullName } from '@lib/format';
import { ConfirmDeleteDialog } from '@components/ConfirmDeleteDialog';
import { NotesList } from '@features/notes/NotesList';
import { NoteViewModal } from '@features/notes/NoteViewModal';
import { PatientFormDialog } from './PatientFormDialog';
import { StatusMessage } from '@components/StatusMessage';

const PAGE_SIZE = 10;

export function PatientDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  // location.key changes on every navigation, so creating a note from the
  // quick actions while on this page still triggers a refetch.
  const { key: locationKey } = useLocation();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(false);
  const [confirmingPatientDelete, setConfirmingPatientDelete] = useState(false);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [noteToDelete, setNoteToDelete] = useState<Note | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, error: loadError, reload: loadData } = useAsync(
    () =>
      Promise.all([
        fetchPatient(id!),
        fetchNotes({ page, pageSize: PAGE_SIZE, patientIds: [id!] }),
      ]),
    'Failed to load patient',
    [id, page, locationKey],
  );

  if (!id) {
    return <Navigate to={ROUTES.patients} replace />;
  }

  const patient: Patient | null = data?.[0] ?? null;
  const notesPage: NotesPage | null = data?.[1] ?? null;
  const error = loadError ?? actionError;

  async function handleDeletePatient(current: Patient) {
    setActionError(null);
    try {
      await deletePatient(current.id);
      navigate(ROUTES.patients);
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to delete patient'));
    }
  }

  async function handleDeleteNote(note: Note) {
    setActionError(null);
    try {
      await deleteNote(note.id);
      loadData();
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to delete note'));
    }
  }

  return (
    <section className="flex flex-col gap-6">
      {/* Back navigation */}
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
        onClick={() => navigate(ROUTES.patients)}
      >
        <ArrowLeft size={14} />
        Patients
      </Button>

      {error && <StatusMessage variant="error">{error}</StatusMessage>}
      {!patient && !error && <StatusMessage variant="muted">Loading…</StatusMessage>}

      {patient && editing && (
        <PatientFormDialog
          patient={patient}
          onSaved={() => {
            setEditing(false);
            loadData();
          }}
          onClose={() => setEditing(false)}
        />
      )}

      {patient && (
        <>
          {/* Header: avatar + name + actions */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Initials avatar */}
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary font-heading text-lg font-bold text-primary-foreground shadow-sm select-none">
                {patient.firstName[0]}{patient.lastName[0]}
              </div>
              <div>
                <h1 className="font-heading text-3xl font-bold tracking-tight leading-none">
                  {patientFullName(patient)}
                </h1>
                <p className="mt-1.5 font-mono text-[11px] tracking-wider text-muted-foreground">
                  {patient.mrn}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil size={14} />
                Edit
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmingPatientDelete(true)}
              >
                <Trash2 size={14} />
                Delete
              </Button>
            </div>
          </div>

          {/* Info chips */}
          <div className="flex flex-wrap gap-2">
            <div className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-1.5 ring-1 ring-border/60">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Birthday
              </span>
              <span className="text-sm font-medium">{formatDate(patient.dob)}</span>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-muted/60 px-4 py-1.5 ring-1 ring-border/60">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                Gender
              </span>
              <span className="text-sm font-medium">{patient.gender}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <h2 className="font-heading text-xl font-bold tracking-tight">Notes</h2>
              {notesPage && notesPage.total > 0 && (
                <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">
                  {notesPage.total}
                </span>
              )}
            </div>
            {notesPage ? (
              <NotesList
                notesPage={notesPage}
                onChangePage={setPage}
                onSelectNote={setSelectedNoteId}
                onDeleteNote={setNoteToDelete}
              />
            ) : (
              <StatusMessage variant="muted">Loading…</StatusMessage>
            )}
          </div>

          {confirmingPatientDelete && (
            <ConfirmDeleteDialog
              title="Delete patient"
              description={`${patientFullName(patient)} (${patient.mrn}) and their notes will be permanently deleted.`}
              onConfirm={() => handleDeletePatient(patient)}
              onClose={() => setConfirmingPatientDelete(false)}
            />
          )}
        </>
      )}

      {selectedNoteId && (
        <NoteViewModal
          noteId={selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
          onDeleted={() => { setSelectedNoteId(null); loadData(); }}
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
    </section>
  );
}
