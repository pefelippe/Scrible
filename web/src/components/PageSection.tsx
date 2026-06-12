// Shared page shell: heading row (title + optional right-aligned actions)
// above vertically stacked content.
interface PageSectionProps {
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function PageSection({ title, actions, children }: PageSectionProps) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="font-heading text-2xl font-bold tracking-tight">{title}</h2>
        {actions}
      </div>
      {children}
    </section>
  );
}
