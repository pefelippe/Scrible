// Dialog form to create a patient or edit an existing one. The MRN is
// assigned by the server, so it is never part of the form.
// Uses Zod for client-side field validation before submission.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createPatient, updatePatient } from '@api/client';
import type { Patient, PatientInput } from '@/types';
import { errorMessage } from '@lib/format';
import { AppModal } from '@components/AppModal';
import { StatusMessage } from '@components/StatusMessage';
import { patientSchema } from './patientSchema';

const EMPTY_FORM: PatientInput = { firstName: '', lastName: '', dob: '', gender: '' };

// Date bounds for the date-of-birth input.
const MAX_DOB = new Date().toISOString().slice(0, 10);
const MIN_DOB = (() => {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 150);
  return d.toISOString().slice(0, 10);
})();

interface PatientFormDialogProps {
  patient?: Patient;
  onSaved: (patient: Patient) => void;
  onClose: () => void;
}

export function PatientFormDialog({ patient, onSaved, onClose }: PatientFormDialogProps) {
  const [form, setForm] = useState<PatientInput>(
    patient
      ? {
          firstName: patient.firstName,
          lastName: patient.lastName,
          dob: patient.dob.slice(0, 10),
          gender: patient.gender,
        }
      : EMPTY_FORM,
  );
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof PatientInput, string>>>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const canSubmit =
    !submitting && Object.values(form).every((value) => value.trim().length > 0);

  function setField(field: keyof PatientInput, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    // Clear this field's error as soon as the user edits it.
    if (fieldErrors[field]) {
      setFieldErrors((current) => ({ ...current, [field]: undefined }));
    }
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setApiError(null);

    const result = patientSchema.safeParse(form);
    if (!result.success) {
      const errs: Partial<Record<keyof PatientInput, string>> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof PatientInput;
        if (field && !errs[field]) errs[field] = issue.message;
      }
      setFieldErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      const saved = patient ? await updatePatient(patient.id, form) : await createPatient(form);
      onSaved(saved);
    } catch (err) {
      setApiError(errorMessage(err, 'Failed to save patient'));
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      title={patient ? 'Edit patient' : 'New patient'}
      onClose={onClose}
      onSubmit={handleSubmit}
      size="sm"
      footer={
        <div className="flex w-full items-center justify-between">
          <p className="text-[11px] uppercase tracking-widest text-muted-foreground/60 font-medium">
            {patient ? 'Editing record' : 'New record'}
          </p>
          <div className="flex gap-2">
            <Button type="button" variant="ghost" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="min-w-[120px]"
            >
              {submitting ? 'Saving…' : patient ? 'Save changes' : 'Create patient'}
            </Button>
          </div>
        </div>
      }
    >
      <div className="rounded-xl bg-accent p-4 ring-1 ring-primary/20">
        <div className="grid grid-cols-2 gap-x-4 gap-y-5">
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="patient-first-name"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              First name
            </label>
            <Input
              id="patient-first-name"
              value={form.firstName}
              onChange={(e) => setField('firstName', e.target.value)}
              maxLength={100}
              aria-invalid={!!fieldErrors.firstName}
              className="bg-background shadow-none focus-visible:ring-1 focus-visible:ring-primary/70"
            />
            {fieldErrors.firstName && (
              <p className="text-xs text-destructive">{fieldErrors.firstName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="patient-last-name"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Last name
            </label>
            <Input
              id="patient-last-name"
              value={form.lastName}
              onChange={(e) => setField('lastName', e.target.value)}
              maxLength={100}
              aria-invalid={!!fieldErrors.lastName}
              className="bg-background shadow-none focus-visible:ring-1 focus-visible:ring-primary/70"
            />
            {fieldErrors.lastName && (
              <p className="text-xs text-destructive">{fieldErrors.lastName}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="patient-dob"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Date of birth
            </label>
            <Input
              id="patient-dob"
              type="date"
              value={form.dob}
              min={MIN_DOB}
              max={MAX_DOB}
              onChange={(e) => setField('dob', e.target.value)}
              aria-invalid={!!fieldErrors.dob}
              className="bg-background shadow-none [color-scheme:light] focus-visible:ring-1 focus-visible:ring-primary/70"
            />
            {fieldErrors.dob && (
              <p className="text-xs text-destructive">{fieldErrors.dob}</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="patient-gender"
              className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground"
            >
              Gender
            </label>
            <Select value={form.gender} onValueChange={(value) => setField('gender', value)}>
              <SelectTrigger
                id="patient-gender"
                className="w-full bg-background shadow-none focus:ring-1 focus:ring-primary/70"
                aria-invalid={!!fieldErrors.gender}
              >
                <SelectValue placeholder="Select…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Female">Female</SelectItem>
                <SelectItem value="Male">Male</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
            {fieldErrors.gender && (
              <p className="text-xs text-destructive">{fieldErrors.gender}</p>
            )}
          </div>
        </div>
      </div>
      {apiError && <StatusMessage variant="error">{apiError}</StatusMessage>}
    </AppModal>
  );
}
