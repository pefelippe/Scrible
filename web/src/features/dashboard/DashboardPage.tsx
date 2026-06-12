// Dashboard: an animated greeting with practice-wide stats, vertically
// centered, plus a recent-notes strip below the fold.
// Creation happens through the global quick-actions button.
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ArrowRight, CalendarDays, FileText, Mic, TrendingUp, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { fetchNotes, fetchStats } from '@api/client';
import { useAsync } from '@hooks/useAsync';
import { ROUTES } from '@/routes';
import type { AuthUser, Note } from '@/types';
import { formatDateTime, patientFullName } from '@lib/format';
import { NoteViewModal } from '@features/notes/NoteViewModal';
import { StatusMessage } from '@components/StatusMessage';

// Entrance animations should only play on the first visit of the session,
// not every time the user navigates back to the dashboard.
let hasPlayedIntro = false;

interface DashboardPageProps {
  user: AuthUser;
}

export function DashboardPage({ user }: DashboardPageProps) {
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  // location.key changes on every navigation, so creating a note or patient
  // from the quick actions while on this page still triggers a refetch.
  const { key: locationKey } = useLocation();
  const { data: stats, error } = useAsync(fetchStats, 'Failed to load dashboard', [locationKey]);
  const { data: recentNotesPage } = useAsync(
    () => fetchNotes({ page: 1, pageSize: 4 }),
    'Failed to load recent notes',
    [locationKey],
  );

  // Lazy initializer runs once on mount: captures the flag then sets it so
  // subsequent renders and navigations back to this page skip animations.
  const [animate] = useState(() => {
    const shouldAnimate = !hasPlayedIntro;
    hasPlayedIntro = true;
    return shouldAnimate;
  });

  const firstName = user.name.split(' ')[0];
  const summary = stats
    ? `You're caring for ${stats.patients} ${stats.patients === 1 ? 'patient' : 'patients'} with ${stats.notes} ${stats.notes === 1 ? 'note' : 'notes'} on file — ${stats.notesThisWeek} added this week.`
    : 'Capture patient visits by voice or text and let AI turn them into structured SOAP notes.';

  const recentNotes = recentNotesPage?.items ?? [];

  return (
    <div className="flex flex-col gap-16 pb-16">
      <section className="flex min-h-[calc(100vh-12rem)] flex-col justify-center gap-2">
        {error && <StatusMessage variant="error">{error}</StatusMessage>}

        <div className="grid items-center gap-12 md:grid-cols-2">
          <div className="flex flex-col gap-7">
            <h1 className="font-heading text-5xl leading-tight font-bold tracking-tight text-balance lg:text-6xl xl:text-7xl">
              <StaggeredWords text={`Hi ${firstName}, welcome back to`} animate={animate} />
              <span
                className={cn(
                  'inline-block rounded-lg bg-primary px-3 py-0.5',
                  animate &&
                    'animate-in fill-mode-backwards duration-700 fade-in slide-in-from-bottom-4',
                )}
                style={animate ? { animationDelay: '500ms' } : undefined}
              >
                Scribble
              </span>
              <span
                className={cn(
                  'inline-block',
                  animate && 'animate-in fill-mode-backwards duration-700 fade-in',
                )}
                style={animate ? { animationDelay: '650ms' } : undefined}
              >
                .
              </span>
            </h1>
            <p
              key={summary}
              className={cn(
                'max-w-xl text-base text-muted-foreground text-balance lg:text-lg',
                animate &&
                  'animate-in fill-mode-backwards duration-1000 fade-in slide-in-from-bottom-2',
              )}
              style={animate ? { animationDelay: '800ms' } : undefined}
            >
              {summary}
            </p>
            <div
              className={cn(
                'flex items-center gap-3',
                animate &&
                  'animate-in fill-mode-backwards duration-1000 fade-in slide-in-from-bottom-2',
              )}
              style={animate ? { animationDelay: '950ms' } : undefined}
            >
              <Button asChild size="lg" className="h-11 rounded-full px-7 text-sm font-semibold">
                <Link to={ROUTES.notes}>
                  View notes
                  <ArrowRight size={15} />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-11 rounded-full px-7 text-sm">
                <Link to={ROUTES.patients}>
                  View patients
                  <ArrowRight size={15} />
                </Link>
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <StatItem icon={<Users size={18} />} label="Patients" value={stats?.patients} delay={0} animate={animate} />
            <StatItem icon={<FileText size={18} />} label="Notes" value={stats?.notes} delay={100} animate={animate} />
            <StatItem icon={<TrendingUp size={18} />} label="This week" value={stats?.notesThisWeek} delay={200} animate={animate} />
            <StatItem icon={<CalendarDays size={18} />} label="Today" value={stats?.notesToday} delay={300} animate={animate} />
          </div>
        </div>
      </section>

      {recentNotes.length > 0 && (
        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-bold tracking-tight">Recent notes</h2>
            <Button asChild variant="ghost" size="sm" className="text-muted-foreground">
              <Link to={ROUTES.notes}>
                View all
                <ArrowRight size={14} />
              </Link>
            </Button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {recentNotes.map((note) => (
              <RecentNoteCard key={note.id} note={note} onClick={() => setSelectedNoteId(note.id)} />
            ))}
          </div>
        </section>
      )}
      {selectedNoteId && (
        <NoteViewModal
          noteId={selectedNoteId}
          onClose={() => setSelectedNoteId(null)}
          onDeleted={() => setSelectedNoteId(null)}
        />
      )}
    </div>
  );
}

// Splits text into words that fade-and-rise in one after another.
function StaggeredWords({ text, animate }: { text: string; animate: boolean }) {
  return (
    <>
      {text.split(' ').map((word, index) => (
        <span
          key={`${word}-${index}`}
          className={cn(
            'inline-block',
            animate && 'animate-in fill-mode-backwards duration-700 fade-in slide-in-from-bottom-4',
          )}
          style={animate ? { animationDelay: `${index * 90}ms` } : undefined}
        >
          {word}
          {'\u00A0'}
        </span>
      ))}
    </>
  );
}

interface StatItemProps {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  delay: number;
  animate: boolean;
}

function StatItem({ icon, label, value, delay, animate }: StatItemProps) {
  return (
    <div
      className={cn(
        'relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-5 sm:aspect-[4/3]',
        animate && 'animate-in fill-mode-backwards duration-700 fade-in slide-in-from-bottom-4',
      )}
      style={animate ? { animationDelay: `${400 + delay}ms` } : undefined}
    >
      {/* Gold top-accent bar */}
      <div className="absolute inset-x-0 top-0 h-[2px] bg-primary/80" />
      <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
        {icon}
      </span>
      <div className="mt-4">
        <span className="font-heading block text-5xl font-bold tracking-tight tabular-nums">
          {value ?? '—'}
        </span>
        <span className="mt-1 block text-xs font-medium uppercase tracking-widest text-muted-foreground">
          {label}
        </span>
      </div>
    </div>
  );
}

interface RecentNoteCardProps {
  note: Note;
  onClick: () => void;
}

function RecentNoteCard({ note, onClick }: RecentNoteCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col gap-3 rounded-lg border border-border bg-card p-4 text-left transition-all outline-none hover:-translate-y-0.5 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring/50"
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-sm font-semibold leading-tight">{patientFullName(note.patient)}</span>
        <Badge variant="secondary" className="shrink-0 text-xs">
          {note.sourceType === 'AUDIO' ? <Mic size={10} className="mr-1" /> : null}
          {note.sourceType === 'AUDIO' ? 'Audio' : 'Text'}
        </Badge>
      </div>
      <p className="line-clamp-3 text-xs text-muted-foreground">
        {note.summary}
      </p>
      <span className="text-xs text-muted-foreground/70">{formatDateTime(note.createdAt)}</span>
    </button>
  );
}
