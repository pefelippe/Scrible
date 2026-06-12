// Records an audio note with the microphone (MediaRecorder) or accepts a
// file upload. Emits the captured file via onRecorded. Shows a live timer
// while recording and a playback preview with the option to discard.
import { useEffect, useRef, useState } from 'react';
import { Mic, RotateCcw, Square, Upload } from 'lucide-react';
import { StatusMessage } from '@components/StatusMessage';

const TIMER_INTERVAL_MS = 1000;
const WAVEFORM_BARS = [0.4, 0.7, 0.55, 1, 0.45, 0.8, 0.5, 0.65, 0.35, 0.75, 0.5, 0.6, 0.4];

interface AudioRecorderProps {
  disabled: boolean;
  onRecorded: (file: File | null) => void;
}

type RecorderState =
  | { name: 'idle' }
  | { name: 'recording' }
  | { name: 'recorded'; previewUrl: string }
  | { name: 'unsupported' };

export function AudioRecorder({ disabled, onRecorded }: AudioRecorderProps) {
  const [state, setState] = useState<RecorderState>(() =>
    navigator.mediaDevices && 'MediaRecorder' in window ? { name: 'idle' } : { name: 'unsupported' },
  );
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function stopHardware() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (recorder && recorder.state !== 'inactive') {
      recorder.stop();
    }
    recorder?.stream.getTracks().forEach((track) => track.stop());
    recorderRef.current = null;
  }

  useEffect(() => () => stopHardware(), []);

  async function handleStart() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const extension = mimeType === 'audio/webm' ? 'webm' : 'm4a';
        const blob = new Blob(chunksRef.current, { type: mimeType });
        const file = new File([blob], `recording.${extension}`, { type: mimeType });
        setState({ name: 'recorded', previewUrl: URL.createObjectURL(blob) });
        onRecorded(file);
      };
      recorderRef.current = recorder;
      recorder.start();
      setSeconds(0);
      timerRef.current = window.setInterval(
        () => setSeconds((current) => current + 1),
        TIMER_INTERVAL_MS,
      );
      setState({ name: 'recording' });
    } catch {
      setError('Microphone access denied. Allow it in your browser settings to record.');
    }
  }

  function handleStop() {
    if (timerRef.current !== null) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
    recorderRef.current?.stop();
    recorderRef.current = null;
  }

  function handleDiscard() {
    if (state.name === 'recorded') {
      URL.revokeObjectURL(state.previewUrl);
    }
    onRecorded(null);
    setState({ name: 'idle' });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }

  function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    const previewUrl = URL.createObjectURL(file);
    setState({ name: 'recorded', previewUrl });
    onRecorded(file);
  }

  if (state.name === 'unsupported') {
    return (
      <StatusMessage variant="error">
        Audio recording is not supported in this browser.
      </StatusMessage>
    );
  }

  return (
    <>
      <style>{`
        @keyframes bar-bounce {
          0%, 100% { transform: scaleY(0.2); }
          50% { transform: scaleY(1); }
        }
        .rec-bar {
          animation: bar-bounce 0.9s ease-in-out infinite;
          transform-origin: bottom;
        }
        @keyframes ring-pulse {
          0% { transform: scale(1); opacity: 0.6; }
          100% { transform: scale(1.9); opacity: 0; }
        }
        .rec-ring {
          animation: ring-pulse 1.4s ease-out infinite;
        }
        .mic-btn {
          position: relative;
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }
        .mic-btn:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 0 6px hsl(var(--primary) / 0.12);
        }
        .mic-btn:active:not(:disabled) {
          transform: scale(0.97);
        }
      `}</style>

      <div className="relative overflow-hidden rounded-2xl border border-border bg-muted/30 p-5">

        {/* ── IDLE ── */}
        {state.name === 'idle' && (
          <div className="flex flex-col items-center gap-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              Capture audio
            </p>

            {/* Mic button */}
            <div className="relative flex items-center justify-center">
              <button
                type="button"
                onClick={handleStart}
                disabled={disabled}
                className="mic-btn relative z-10 flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Start recording"
              >
                <Mic size={22} strokeWidth={1.75} />
              </button>
            </div>

            {/* Divider */}
            <div className="flex w-full items-center gap-3">
              <div className="h-px flex-1 bg-border" />
              <span className="text-[10px] font-medium uppercase tracking-widest text-muted-foreground/60">or</span>
              <div className="h-px flex-1 bg-border" />
            </div>

            {/* Upload */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-background/50 px-4 py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/5 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Upload size={13} />
              Upload mp3, m4a, wav…
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".mp3,.m4a,.wav,.webm,.ogg,.flac,.mp4"
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        )}

        {/* ── RECORDING ── */}
        {state.name === 'recording' && (
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-destructive" aria-hidden="true" />
              <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive">
                Recording
              </span>
            </div>

            {/* Waveform */}
            <div className="flex h-10 items-end justify-center gap-[3px]" aria-hidden="true">
              {WAVEFORM_BARS.map((scale, i) => (
                <div
                  key={i}
                  className="rec-bar w-[3px] rounded-full bg-primary"
                  style={{
                    height: `${Math.round(scale * 40)}px`,
                    animationDelay: `${i * 65}ms`,
                    opacity: 0.5 + scale * 0.5,
                  }}
                />
              ))}
            </div>

            {/* Timer */}
            <span
              className="font-mono text-2xl font-light tabular-nums tracking-widest text-foreground"
              aria-live="polite"
            >
              {formatElapsed(seconds)}
            </span>

            {/* Stop button */}
            <button
              type="button"
              onClick={handleStop}
              className="flex items-center gap-2 rounded-full border border-destructive/30 bg-destructive/10 px-5 py-2 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/20"
            >
              <Square size={11} fill="currentColor" strokeWidth={0} />
              Stop recording
            </button>
          </div>
        )}

        {/* ── RECORDED ── */}
        {state.name === 'recorded' && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15">
                  <Mic size={11} className="text-primary" />
                </div>
                <span className="text-xs font-medium text-foreground">Audio captured</span>
              </div>
              <button
                type="button"
                onClick={handleDiscard}
                disabled={disabled}
                className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-40"
              >
                <RotateCcw size={11} />
                Discard
              </button>
            </div>
            <audio controls src={state.previewUrl} className="h-9 w-full" />
          </div>
        )}

        {error && (
          <div className="mt-3">
            <StatusMessage variant="error">{error}</StatusMessage>
          </div>
        )}
      </div>
    </>
  );
}

function formatElapsed(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}
