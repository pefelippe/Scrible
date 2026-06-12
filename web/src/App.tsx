// Root component: session gate plus the routed application shell
// (header navigation between the dashboard, notes, and patients pages).
import { useSyncExternalStore } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { getUser, onSessionChange } from '@auth';
import { ROUTES } from '@/routes';
import { TooltipProvider } from '@/components/ui/tooltip';
import { AppHeader } from '@features/layout/AppHeader';
import { LoginPage } from '@auth/LoginPage';
import { LandingPage } from '@/pages/LandingPage';
import { NotesPage } from '@features/notes/NotesPage';
import { PatientDetailPage } from '@features/patients/PatientDetailPage';
import { PatientsPage } from '@features/patients/PatientsPage';
import { QuickActions } from '@features/layout/QuickActions';

export function App() {
  // onSessionChange has the (listener) => unsubscribe shape useSyncExternalStore expects.
  const user = useSyncExternalStore(onSessionChange, getUser);
  const { pathname } = useLocation();

  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <TooltipProvider delayDuration={200}>
      <div className="min-h-screen bg-background text-foreground">
        <AppHeader user={user} />
        <main
          key={pathname}
          className="mx-auto max-w-[1080px] animate-in px-5 pt-8 pb-16 duration-300 fade-in slide-in-from-bottom-2"
        >
          <Routes>
            <Route path={ROUTES.notes} element={<NotesPage />} />
            <Route path={ROUTES.patients} element={<PatientsPage />} />
            <Route path="/patients/:id" element={<PatientDetailPage />} />
            <Route path="*" element={<Navigate to={ROUTES.notes} replace />} />
          </Routes>
        </main>
        <QuickActions />
      </div>
    </TooltipProvider>
  );
}

