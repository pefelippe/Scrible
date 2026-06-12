// Display formatting helpers shared across components.
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { dateStyle: 'medium' });
}

export function patientFullName(patient: { firstName: string; lastName: string }): string {
  return `${patient.firstName} ${patient.lastName}`;
}

// Narrows an unknown caught error to a display message.
export function errorMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback;
}
