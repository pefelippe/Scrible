// Typed fetch helpers for the AI Scribe API. All requests (except login)
// carry the JWT; a 401 clears the session so the app returns to login.
import { clearSession, getToken } from '../auth';
import type { AuthUser, Note, NotesPage, Patient, PatientInput, Stats } from '../types';

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (response.status === 401 && token) {
    clearSession();
  }
  if (!response.ok) {
    const body = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? `Request failed with status ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}

function jsonInit(method: string, body: unknown): RequestInit {
  return {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}

export function loginRequest(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  return request('/api/auth/login', jsonInit('POST', { email, password }));
}

export function fetchPatients(): Promise<Patient[]> {
  return request('/api/patients');
}

export function createPatient(input: PatientInput): Promise<Patient> {
  return request('/api/patients', jsonInit('POST', input));
}

export function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  return request(`/api/patients/${id}`, jsonInit('PUT', input));
}

export function deletePatient(id: string): Promise<void> {
  return request(`/api/patients/${id}`, { method: 'DELETE' });
}

export function fetchPatient(id: string): Promise<Patient> {
  return request(`/api/patients/${id}`);
}

export function fetchStats(): Promise<Stats> {
  return request('/api/stats');
}

export interface NotesQuery {
  page: number;
  pageSize: number;
  patientIds?: string[];
  sourceType?: 'TEXT' | 'AUDIO';
  q?: string;
}

export function fetchNotes(query: NotesQuery): Promise<NotesPage> {
  const params = new URLSearchParams({
    page: String(query.page),
    pageSize: String(query.pageSize),
  });
  if (query.patientIds && query.patientIds.length > 0) {
    params.set('patientId', query.patientIds.join(','));
  }
  if (query.sourceType) params.set('sourceType', query.sourceType);
  if (query.q?.trim()) params.set('q', query.q.trim());
  return request(`/api/notes?${params.toString()}`);
}

export function fetchNote(id: string): Promise<Note> {
  return request(`/api/notes/${id}`);
}

export function transcribeAudio(file: File): Promise<{ transcript: string }> {
  const formData = new FormData();
  formData.append('audio', file);
  return request('/api/notes/transcribe', { method: 'POST', body: formData });
}

export function generateSummary(text: string): Promise<{ summary: string }> {
  return request('/api/notes/generate-summary', jsonInit('POST', { text }));
}

export function createNote(input: {
  patientId: string;
  text?: string;
  summary?: string;
  audioFile?: File;
}): Promise<Note> {
  const formData = new FormData();
  formData.append('patientId', input.patientId);
  if (input.text) formData.append('text', input.text);
  if (input.summary) formData.append('summary', input.summary);
  if (input.audioFile) formData.append('audio', input.audioFile);
  return request('/api/notes', { method: 'POST', body: formData });
}

export function updateNote(id: string, summary: string): Promise<Note> {
  return request(`/api/notes/${id}`, jsonInit('PUT', { summary }));
}

export function deleteNote(id: string): Promise<void> {
  return request(`/api/notes/${id}`, { method: 'DELETE' });
}
