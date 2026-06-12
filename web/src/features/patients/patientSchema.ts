// Zod validation schema for the patient create/edit form.
import { z } from 'zod';

const today = new Date();
today.setHours(23, 59, 59, 999);

const minDob = new Date();
minDob.setFullYear(minDob.getFullYear() - 150);
minDob.setHours(0, 0, 0, 0);

export const patientSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'Max 100 characters'),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Max 100 characters'),
  dob: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d <= today;
    }, 'Date of birth cannot be in the future')
    .refine((val) => new Date(val) >= minDob, 'Cannot be more than 150 years ago'),
  gender: z.string().min(1, 'Gender is required'),
});
