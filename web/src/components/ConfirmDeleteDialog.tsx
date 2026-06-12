// Confirmation dialog for destructive delete actions, replacing
// window.confirm. The parent conditionally mounts it and performs the actual
// deletion (including its own error handling) in onConfirm.
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { AppModal } from './AppModal';

interface ConfirmDeleteDialogProps {
  title: string;
  description: string;
  onConfirm: () => Promise<void> | void;
  onClose: () => void;
}

export function ConfirmDeleteDialog({
  title,
  description,
  onConfirm,
  onClose,
}: ConfirmDeleteDialogProps) {
  const [submitting, setSubmitting] = useState(false);

  async function handleConfirm() {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AppModal
      title={title}
      description={description}
      onClose={onClose}
      size="sm"
      footer={
        <>
          <Button variant="outline" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleConfirm} disabled={submitting}>
            {submitting ? 'Deleting…' : 'Delete'}
          </Button>
        </>
      }
    />
  );
}
