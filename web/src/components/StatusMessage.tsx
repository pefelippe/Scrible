// Standardized inline feedback: error text, loading text, and the dashed
// empty-state box, shared by pages and dialogs.
const VARIANT_CLASSES = {
  error: 'text-sm text-destructive',
  muted: 'text-sm text-muted-foreground',
  empty:
    'rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground',
} as const;

interface StatusMessageProps {
  variant: keyof typeof VARIANT_CLASSES;
  children: React.ReactNode;
}

export function StatusMessage({ variant, children }: StatusMessageProps) {
  return <p className={VARIANT_CLASSES[variant]}>{children}</p>;
}
