// Sidebar showing the patient metadata for the currently viewed note.
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Patient } from '@/types';
import { formatDate, patientFullName } from '@lib/format';

interface PatientPanelProps {
  patient: Patient;
}

export function PatientPanel({ patient }: PatientPanelProps) {
  const fields = [
    { label: 'Name', value: patientFullName(patient) },
    { label: 'MRN', value: patient.mrn },
    { label: 'Date of birth', value: formatDate(patient.dob) },
    { label: 'Gender', value: patient.gender },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Patient</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="flex flex-col gap-3">
          {fields.map(({ label, value }) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-sm font-medium">{value}</dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
