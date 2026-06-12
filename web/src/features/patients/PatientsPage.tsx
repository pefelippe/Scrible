// Patient management page: lists all patients with edit handled in a dialog,
// plus delete with confirmation. Creation happens via the quick actions.
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Pencil, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deletePatient, fetchPatients } from '@api/client';
import { useAsync } from '@hooks/useAsync';
import { ROUTES } from '@/routes';
import type { Patient } from '@/types';
import { errorMessage, formatDate, patientFullName } from '@lib/format';
import { ConfirmDeleteDialog } from '@components/ConfirmDeleteDialog';
import { PageSection } from '@components/PageSection';
import { PatientFormDialog } from './PatientFormDialog';
import { StatusMessage } from '@components/StatusMessage';

export function PatientsPage() {
  const navigate = useNavigate();
  // location.key changes on every navigation, so adding a patient from the
  // quick actions while already on this page still triggers a refetch.
  const { key: locationKey } = useLocation();
  const { data: patients, error: loadError, reload: refreshPatients } = useAsync(
    fetchPatients,
    'Failed to load patients',
    [locationKey],
  );
  const [editingPatient, setEditingPatient] = useState<Patient | null>(null);
  const [patientToDelete, setPatientToDelete] = useState<Patient | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const error = loadError ?? actionError;

  async function handleDelete(patient: Patient) {
    setActionError(null);
    try {
      await deletePatient(patient.id);
      refreshPatients();
    } catch (err) {
      setActionError(errorMessage(err, 'Failed to delete patient'));
    }
  }

  return (
    <PageSection title="Patients">
      {error && <StatusMessage variant="error">{error}</StatusMessage>}

      {editingPatient && (
        <PatientFormDialog
          patient={editingPatient}
          onSaved={() => {
            setEditingPatient(null);
            refreshPatients();
          }}
          onClose={() => setEditingPatient(null)}
        />
      )}

      {patients === null ? (
        !error && <StatusMessage variant="muted">Loading…</StatusMessage>
      ) : patients.length === 0 ? (
        <StatusMessage variant="empty">
          No patients yet. Use the + button to add the first one.
        </StatusMessage>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Date of birth</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Notes</TableHead>
                <TableHead className="w-0" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow
                  key={patient.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => navigate(ROUTES.patientDetail(patient.id))}
                >
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {patient.mrn}
                  </TableCell>
                  <TableCell className="font-medium">{patientFullName(patient)}</TableCell>
                  <TableCell>{formatDate(patient.dob)}</TableCell>
                  <TableCell>{patient.gender}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{patient.noteCount ?? 0}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          setEditingPatient(patient);
                        }}
                        aria-label={`Edit ${patientFullName(patient)}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={(event) => {
                          event.stopPropagation();
                          setPatientToDelete(patient);
                        }}
                        aria-label={`Delete ${patientFullName(patient)}`}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
      {patientToDelete && (
        <ConfirmDeleteDialog
          title="Delete patient"
          description={`${patientFullName(patientToDelete)} (${patientToDelete.mrn}) and their notes will be permanently deleted.`}
          onConfirm={() => handleDelete(patientToDelete)}
          onClose={() => setPatientToDelete(null)}
        />
      )}
    </PageSection>
  );
}
