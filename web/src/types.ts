// DTOs returned by the API. Dates arrive as ISO strings over JSON.
export interface Patient {
  id: string;
  mrn: string;
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
  createdAt: string;
  // Only present on the patient list endpoint.
  noteCount?: number;
}

export interface Stats {
  patients: number;
  notes: number;
  notesThisWeek: number;
  notesToday: number;
}

export interface Note {
  id: string;
  patientId: string;
  patient: Patient;
  sourceType: 'TEXT' | 'AUDIO';
  audioFilename: string | null;
  rawText: string;
  summary: string | null;
  createdAt: string;
}

export interface NotesPage {
  items: Note[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
}

export interface PatientInput {
  firstName: string;
  lastName: string;
  dob: string;
  gender: string;
}
