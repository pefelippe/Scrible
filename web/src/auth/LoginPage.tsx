// Login form: exchanges email/password for a JWT session.
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, NotebookPen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { loginRequest } from '@api/client';
import { setSession } from '@auth';
import { errorMessage } from '@lib/format';
import { StatusMessage } from '@components/StatusMessage';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const { token, user } = await loginRequest(email, password);
      setSession(token, user);
    } catch (err) {
      setError(errorMessage(err, 'Login failed'));
      setSubmitting(false);
    }
  }

  async function handleDemoLogin() {
    setSubmitting(true);
    setError(null);
    try {
      const { token, user } = await loginRequest('admin@scribe.local', 'admin123');
      setSession(token, user);
    } catch (err) {
      setError(errorMessage(err, 'Demo login failed'));
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#f8f8f6] px-6">
      {/* Back link */}
      <button
        onClick={() => navigate('/')}
        className="absolute left-6 top-6 flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft size={14} />
        Back
      </button>

      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md">
            <NotebookPen size={20} strokeWidth={2.5} />
          </span>
          <span className="font-heading text-lg font-bold tracking-wide">Scribble</span>
        </div>

        <div className="rounded-2xl border border-border bg-white p-8 shadow-sm">
          <div className="mb-6">
            <h1 className="font-heading text-xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">Welcome back. Enter your credentials.</p>
          </div>

          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-1.5">
              <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
                placeholder="you@example.com"
                className="h-10"
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
              <Input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="••••••••"
                className="h-10"
              />
            </div>

            {error && <StatusMessage variant="error">{error}</StatusMessage>}

            <Button
              type="submit"
              disabled={submitting || !email || !password}
              className="mt-1 h-10 rounded-full font-semibold"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <button
          type="button"
          onClick={handleDemoLogin}
          disabled={submitting}
          className="mt-4 w-full text-center text-sm text-muted-foreground underline-offset-2 transition-colors hover:text-foreground hover:underline disabled:opacity-50"
        >
          Log in as demo admin
        </button>
      </div>
    </div>
  );
}
