// Route path constants shared by the router config and navigation calls.
export const ROUTES = {
  notes: '/notes',
  patients: '/patients',
  patientDetail: (id: string) => `/patients/${id}`,
} as const;
