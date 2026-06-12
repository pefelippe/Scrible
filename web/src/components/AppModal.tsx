// Shared application modal: fixed width, title header, content area and a
// fixed footer whose buttons are provided by the caller. When onSubmit is
// given the content + footer are wrapped in a form so Enter submits.
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AppModalProps {
  title: string;
  description?: string;
  footer?: React.ReactNode;
  onSubmit?: (event: React.FormEvent) => void;
  onClose: () => void;
  children?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

export function AppModal({
  title,
  description,
  footer,
  onSubmit,
  onClose,
  children,
  size,
}: AppModalProps) {
  const body = (
    <>
      {children}
      {footer && (
        <DialogFooter className="-mx-6 -mb-6 border-t border-border px-6 py-4">
          {footer}
        </DialogFooter>
      )}
    </>
  );

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className={`gap-6 p-6 ${size === 'sm' ? 'sm:max-w-md' : size === 'md' ? 'sm:max-w-[900px]' : 'sm:max-w-5xl'}`}>
        <DialogHeader className="-mx-6 border-b border-border px-6 pb-4">
          <DialogTitle className="text-xl">{title}</DialogTitle>
        </DialogHeader>
        {onSubmit ? (
          <form className="grid gap-6" onSubmit={onSubmit}>
            {description && <DialogDescription>{description}</DialogDescription>}
            {body}
          </form>
        ) : (
          <div className="grid gap-6">
            {description && <DialogDescription>{description}</DialogDescription>}
            {body}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
