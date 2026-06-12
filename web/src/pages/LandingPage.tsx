import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileAudio, Mic, NotebookPen, Sparkles, Zap } from 'lucide-react';
import { loginRequest } from '@api/client';
import { setSession } from '@auth';
import { errorMessage } from '@lib/format';

/* ─── data ─── */

const FEATURES = [
  { icon: Mic,       title: 'Record in-browser',      desc: 'Hit record and speak naturally — live waveform feedback as you capture the visit.',          accent: '#f5c432' },
  { icon: FileAudio, title: 'Upload any audio file',   desc: 'Already recorded? Drop in MP3, M4A, WAV, WebM or FLAC. Any format, any device.',             accent: '#60c4f0' },
  { icon: Sparkles,  title: 'AI transcription',        desc: 'Powered by OpenAI Whisper. Clinical-grade accuracy across accents and medical terminology.', accent: '#7de8a0' },
  { icon: Zap,       title: 'Instant SOAP output',     desc: 'Raw speech becomes a fully structured SOAP note in seconds — ready to review and save.',     accent: '#c084fc' },
];

const STEPS = [
  { n: '1', title: 'Speak or upload', desc: 'Record your voice directly in Scribble or upload an existing audio file from your device.' },
  { n: '2', title: 'AI structures the note', desc: 'Whisper transcribes the speech. Our AI organises it into Subjective, Objective, Assessment and Plan.' },
  { n: '3', title: 'Review and save', desc: 'Edit, enhance with AI, then attach the note to the patient record.' },
];

const SOAP_CARDS = [
  { letter: 'S', word: 'Subjective', accent: '#f5c432', points: ["Patient's own report", 'Symptoms & mood', 'Concerns & quotes'] },
  { letter: 'O', word: 'Objective',  accent: '#60c4f0', points: ['Mental status exam', 'Behavioral observations', 'Clinical measurables'] },
  { letter: 'A', word: 'Assessment', accent: '#7de8a0', points: ['Diagnosis (DSM/ICD)', 'Progress note', 'Clinical impression'] },
  { letter: 'P', word: 'Plan',       accent: '#c084fc', points: ['Treatment strategy', 'Referrals & interventions', 'Follow-up details'] },
];

const NOTE_ROWS = [
  { letter: 'S', title: 'Subjective', color: '#d4960a', bg: '#fefbf0', border: '#fde68a', text: 'Patient reports increased shortness of breath and fatigue on exertion. Denies chest pain or fever.' },
  { letter: 'O', title: 'Objective',  color: '#0e7faa', bg: '#f0f9fe', border: '#bae6fd', text: 'BP: 138/88 mmHg · HR: 92 bpm · SpO₂: 94% · Temp: 37.1 °C\nMild bilateral ankle edema. Weight unchanged from last visit.' },
  { letter: 'A', title: 'Assessment', color: '#1e8a4a', bg: '#f1fbf4', border: '#bbf7d0', text: 'CHF exacerbation, clinically stable. SpO₂ trending slightly low. No signs of acute infection.' },
  { letter: 'P', title: 'Plan',       color: '#7c3aed', bg: '#f8f4fe', border: '#ddd6fe', text: 'Reinforce fluid restriction per cardiologist orders. Follow-up in 3 days. Contact PCP if SpO₂ drops below 92%.' },
];

/* ─── component ─── */

export function LandingPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  async function handleDemo() {
    setLoading(true);
    try {
      const { token, user } = await loginRequest('admin@scribe.local', 'admin123');
      setSession(token, user);
    } catch (err) {
      console.error(errorMessage(err, 'Demo login failed'));
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "'Geist Variable', sans-serif", background: '#f7f6f3' }}>
      <style>{`
        @keyframes waveform {
          0%,100% { transform: scaleY(0.25); }
          50%      { transform: scaleY(1); }
        }
        .wbar { animation: waveform 0.95s ease-in-out infinite; transform-origin: bottom; }
        @keyframes fade-up {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        .fi { opacity:0; animation: fade-up 0.55s cubic-bezier(.22,1,.36,1) forwards; }
        .btn-primary { background:#f5c432; color:#111; font-weight:700; border-radius:9999px; padding:12px 28px; font-size:14px; display:inline-flex; align-items:center; gap:8px; transition:opacity .15s; border:none; cursor:pointer; }
        .btn-primary:hover { opacity:.88; }
        .btn-primary:disabled { opacity:.5; cursor:not-allowed; }
        .btn-ghost  { background:transparent; color:#555; font-weight:500; border-radius:9999px; padding:12px 24px; font-size:14px; display:inline-flex; align-items:center; gap:8px; transition:color .15s; border:1.5px solid #ddd; cursor:pointer; }
        .btn-ghost:hover  { color:#111; border-color:#bbb; }
        .btn-ghost:disabled { opacity:.5; cursor:not-allowed; }
        .step-card { counter-increment: none; }
        .soap-col { transition: transform .2s ease; }
        .soap-col:hover { transform: translateY(-4px); }
      `}</style>

      {/* ──────────────── NAV ──────────────── */}
      <nav style={{ background: '#f7f6f3', borderBottom: '1px solid #e8e6e1', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 24px', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ width: 30, height: 30, borderRadius: 8, background: '#f5c432', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <NotebookPen size={15} strokeWidth={2.5} color="#111" />
            </span>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: 16, color: '#111', letterSpacing: '-0.01em' }}>Scribble</span>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <button onClick={handleDemo} disabled={loading} className="btn-ghost" style={{ fontSize: 13, padding: '8px 18px' }}>
              {loading ? 'Loading…' : 'Try demo'}
            </button>
            <button onClick={() => navigate('/login')} className="btn-primary" style={{ fontSize: 13, padding: '8px 18px' }}>
              Sign in <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </nav>

      {/* ──────────────── HERO ──────────────── */}
      <section style={{ maxWidth: 1100, margin: '0 auto', padding: '80px 24px 80px', textAlign: 'center' }}>

        {/* Badge */}
        <div className="fi" style={{ animationDelay: '0ms', marginBottom: 24 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#fff', border: '1px solid #e5e0d8', borderRadius: 9999, padding: '6px 14px', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#888' }}>
            <Sparkles size={10} color="#f5c432" /> AI-powered clinical documentation
          </span>
        </div>

        {/* Heading */}
        <h1 className="fi" style={{ animationDelay: '60ms', fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2.6rem, 6.5vw, 4.5rem)', fontWeight: 900, lineHeight: 1.03, letterSpacing: '-0.03em', color: '#0d0d0d', marginBottom: 20 }}>
          Clinical notes, <br />
          <span style={{ color: '#c49200' }}>written by AI.</span>
        </h1>

        {/* Subtitle */}
        <p className="fi" style={{ animationDelay: '120ms', fontSize: 17, lineHeight: 1.65, color: '#666', maxWidth: 480, margin: '0 auto 36px' }}>
          Speak into your mic or upload any audio file.
          Scribble transcribes and structures it into a SOAP note — in seconds.
        </p>

        {/* CTAs */}
        <div className="fi" style={{ animationDelay: '180ms', display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 56 }}>
          <button onClick={() => navigate('/login')} className="btn-primary">
            Get started <ArrowRight size={15} />
          </button>
          <button onClick={handleDemo} disabled={loading} className="btn-ghost">
            {loading ? 'Loading demo…' : 'Try live demo'}
          </button>
        </div>

        {/* ── Product mock card ── */}
        <div className="fi" style={{ animationDelay: '260ms', maxWidth: 780, margin: '0 auto', background: '#fff', borderRadius: 20, border: '1px solid #e5e2db', boxShadow: '0 4px 6px -2px rgba(0,0,0,0.05), 0 20px 60px -12px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

          {/* Card titlebar */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 18px', borderBottom: '1px solid #f0ede8', background: '#fafaf8' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', gap: 5 }}>
                {['#ff5f57','#febc2e','#28c840'].map((c) => (
                  <span key={c} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
                ))}
              </div>
              <span style={{ fontSize: 11, color: '#aaa', marginLeft: 6, letterSpacing: '0.02em' }}>Scribble — SOAP Note</span>
            </div>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 9999, padding: '3px 10px', fontSize: 10, fontWeight: 600, color: '#15803d' }}>
              <Sparkles size={8} /> AI generated
            </span>
          </div>

          {/* Audio input row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderBottom: '1px solid #f0ede8', background: '#fffdf7' }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, animation: 'waveform 1s ease-in-out infinite' }} />
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2.5, height: 22 }}>
              {[0.35,0.65,0.45,1,0.55,0.8,0.4,0.7,0.5,0.9,0.35,0.6,0.45,0.75,0.3,0.65,0.5,0.85].map((s, i) => (
                <div key={i} className="wbar" style={{ width: 2.5, height: Math.round(s * 22), borderRadius: 9999, background: '#f5c432', animationDelay: `${i * 55}ms` }} />
              ))}
            </div>
            <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#aaa' }}>00:23</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, color: '#bbb' }}>J. Davis · Jun 12, 2026</span>
          </div>

          {/* SOAP rows */}
          {NOTE_ROWS.map(({ letter, title, color, bg, border, text }) => (
            <div key={letter} style={{ margin: '10px 14px', borderRadius: 10, background: bg, border: `1px solid ${border}`, padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 13, color }}>{letter}</span>
                <span style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase', color }}>{title}</span>
              </div>
              <p style={{ fontSize: 12, lineHeight: 1.6, color: '#444', margin: 0, textAlign: 'left', whiteSpace: 'pre-line' }}>{text}</p>
            </div>
          ))}

          <div style={{ padding: '10px 18px', background: '#fafaf8' }}>
            <span style={{ fontSize: 11, color: '#ccc' }}>Note saved · 2 seconds ago</span>
          </div>
        </div>

        {/* Format strip */}
        <p className="fi" style={{ animationDelay: '340ms', marginTop: 24, fontSize: 12, color: '#bbb', letterSpacing: '0.05em' }}>
          MP3 · M4A · WAV · WebM · FLAC · OGG
        </p>
      </section>

      {/* ──────────────── FEATURES ──────────────── */}
      <section style={{ background: '#fff', borderTop: '1px solid #eceae5', borderBottom: '1px solid #eceae5', padding: '72px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: 10 }}>
              Everything you need.
            </h2>
            <p style={{ fontSize: 15, color: '#888', maxWidth: 400, margin: '0 auto' }}>
              Built for real clinical workflows — no setup, no training required.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {FEATURES.map(({ icon: Icon, title, desc, accent }) => (
              <div key={title} style={{ padding: '24px', borderRadius: 16, border: '1px solid #eceae5', background: '#fafaf8' }}>
                <div style={{ width: 40, height: 40, borderRadius: 12, background: `${accent}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                  <Icon size={18} color={accent} strokeWidth={1.75} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#111', marginBottom: 6 }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.6, color: '#777' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── HOW IT WORKS ──────────────── */}
      <section style={{ padding: '72px 24px', background: '#f7f6f3' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 3vw, 2.2rem)', fontWeight: 800, color: '#0d0d0d', letterSpacing: '-0.02em', marginBottom: 10 }}>
            How it works.
          </h2>
          <p style={{ fontSize: 15, color: '#888', marginBottom: 56 }}>Three steps from visit to structured note.</p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 2, position: 'relative' }}>
            {STEPS.map(({ n, title, desc }, i) => (
              <div key={n} style={{ position: 'relative', padding: '32px 28px', background: i === 1 ? '#0d0d0d' : '#fff', borderRadius: 18, border: '1px solid #eceae5' }}>
                <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f5c432', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Syne', sans-serif", fontWeight: 900, fontSize: 14, color: '#111', margin: '0 auto 16px' }}>
                  {n}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: i === 1 ? '#fff' : '#111', marginBottom: 8 }}>{title}</div>
                <div style={{ fontSize: 13, lineHeight: 1.65, color: i === 1 ? 'rgba(255,255,255,0.5)' : '#777' }}>{desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── SOAP ──────────────── */}
      <section style={{ background: '#0d0d0d', padding: '80px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <p style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
              The clinical standard
            </p>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(1.6rem, 3vw, 2.4rem)', fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 }}>
              What is a SOAP note?
            </h2>
            <p style={{ fontSize: 15, color: 'rgba(255,255,255,0.4)', maxWidth: 460, margin: '0 auto' }}>
              The four-part framework used by healthcare professionals to document patient encounters consistently.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {SOAP_CARDS.map(({ letter, word, accent, points }) => (
              <div key={letter} className="soap-col" style={{ padding: '28px 24px', borderRadius: 18, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.08)`, borderTop: `3px solid ${accent}` }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 42, fontWeight: 900, lineHeight: 1, color: accent }}>{letter}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{word}</span>
                </div>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {points.map((pt) => (
                    <li key={pt} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0 }} />
                      {pt}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ──────────────── CTA ──────────────── */}
      <section style={{ background: '#f5c432', padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#111', letterSpacing: '-0.03em', lineHeight: 1.05, marginBottom: 16 }}>
            Start documenting smarter.
          </h2>
          <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.55)', marginBottom: 36 }}>
            No credit card required. Try the demo and generate your first SOAP note live.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button onClick={() => navigate('/login')} style={{ background: '#111', color: '#fff', fontWeight: 700, borderRadius: 9999, padding: '14px 32px', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 8, border: 'none', cursor: 'pointer' }}>
              Get started <ArrowRight size={15} />
            </button>
            <button onClick={handleDemo} disabled={loading} style={{ background: 'rgba(0,0,0,0.1)', color: '#111', fontWeight: 600, borderRadius: 9999, padding: '14px 28px', fontSize: 14, border: '1.5px solid rgba(0,0,0,0.15)', cursor: 'pointer', opacity: loading ? 0.5 : 1 }}>
              {loading ? 'Loading…' : 'Try live demo'}
            </button>
          </div>
        </div>
        <p style={{ marginTop: 60, fontSize: 11, color: 'rgba(0,0,0,0.3)' }}>© 2026 Scribble · AI Clinical Documentation</p>
      </section>
    </div>
  );
}
