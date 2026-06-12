// Floating action button (bottom-right, present on every page) that expands
// into the app's two create actions: new note and new patient.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, Plus, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ROUTES } from '@/routes';
import { NoteCreateDialog } from '@features/notes/NoteCreateDialog';
import { PatientFormDialog } from '@features/patients/PatientFormDialog';

type ActiveDialog = 'note' | 'patient' | null;

export function QuickActions() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [dialog, setDialog] = useState<ActiveDialog>(null);
  function openDialog(target: ActiveDialog) {
    setOpen(false);
    setDialog(target);
  }

  return (
    <>
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/5 backdrop-blur-[1px] transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="fixed right-6 bottom-6 z-50 flex flex-col items-end gap-3">
        <QuickAction
          open={open}
          delayClass="delay-75"
          label="Add patient"
          icon={<UserPlus size={18} />}
          onClick={() => openDialog('patient')}
        />
        <QuickAction
          open={open}
          delayClass="delay-150"
          label="Add note"
          icon={<FileText size={18} />}
          onClick={() => openDialog('note')}
        />
        <button
          type="button"
          aria-label={open ? 'Close quick actions' : 'Open quick actions'}
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
          className={cn(
            'flex size-14 cursor-pointer items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 transition-all duration-300 outline-none hover:shadow-xl hover:shadow-primary/30 focus-visible:ring-2 focus-visible:ring-ring/50 active:scale-95',
            open && 'rotate-45',
          )}
        >
          <Plus size={26} strokeWidth={2.5} />
        </button>
      </div>

      {dialog === 'note' && (
        <NoteCreateDialog
          onClose={() => setDialog(null)}
          onCreated={() => {
            setDialog(null);
            navigate(ROUTES.notes);
          }}
        />
      )}
      {dialog === 'patient' && (
        <PatientFormDialog
          onClose={() => setDialog(null)}
          onSaved={() => {
            setDialog(null);
            navigate(ROUTES.patients);
          }}
        />
      )}
    </>
  );
}

interface QuickActionProps {
  open: boolean;
  delayClass: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function QuickAction({ open, delayClass, label, icon, onClick }: QuickActionProps) {
  return (
    <button
      type="button"
      tabIndex={open ? 0 : -1}
      aria-hidden={!open}
      onClick={onClick}
      className={cn(
        'flex w-fit cursor-pointer items-center gap-2 self-end rounded-full border border-border bg-background py-2 pr-4 pl-3 text-sm font-medium shadow-md transition-all duration-300 outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/50',
        open
          ? cn('translate-y-0 scale-100 opacity-100', delayClass)
          : 'pointer-events-none translate-y-3 scale-90 opacity-0',
      )}
    >
      <span className="flex size-6 items-center justify-center rounded-full bg-accent text-foreground">
        {icon}
      </span>
      {label}
    </button>
  );
}
