'use client';
import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight, Loader2 } from 'lucide-react';
import { StageOutput, TraceLine, type AgentRole, type TraceEvent } from './trace-event';

const SUGGESTIONS = [
  'How does MCP differ from a plain REST API for tools?',
  'Supervisor pattern or a fixed pipeline of agents?',
  'What chunking strategy gives the best RAG retrieval on prose?',
  'How do you make text-to-SQL safe for production?',
];

const EASE = [0.16, 1, 0.3, 1] as const;

interface Stamped {
  event: TraceEvent;
  stamp: string;
}

interface Props {
  apiKeyConfigured: boolean;
}

function clock(): string {
  return new Date().toTimeString().slice(0, 8);
}

export function RunForm({ apiKeyConfigured }: Props) {
  const [query, setQuery] = useState('');
  const [items, setItems] = useState<Stamped[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const logRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [items.length]);

  const finished = items.map((i) => i.event).filter(
    (e): e is Extract<TraceEvent, { type: 'finish' }> => e.type === 'finish',
  );
  const done = items.some((i) => i.event.type === 'done');
  const failed = items.some((i) => i.event.type === 'error');

  const status = running
    ? 'Processing'
    : failed
      ? 'Stopped'
      : done
        ? 'Complete'
        : 'Waiting for a query';

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() || running) return;
    setError(null);
    setItems([]);
    setRunning(true);
    try {
      const res = await fetch('/api/run', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ query: query.trim() }),
      });
      if (!res.ok || !res.body) {
        const text = await res.text();
        setError(`HTTP ${res.status}: ${text || 'no body'}`);
        setRunning(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const frames = buffer.split('\n\n');
        buffer = frames.pop() ?? '';
        for (const frame of frames) {
          const dataLine = frame.split('\n').find((l) => l.startsWith('data:'));
          if (!dataLine) continue;
          try {
            const parsed = JSON.parse(dataLine.slice(5).trim()) as TraceEvent;
            setItems((prev) => [...prev, { event: parsed, stamp: clock() }]);
          } catch {
            /* malformed frame; skip */
          }
        }
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setRunning(false);
    }
  }

  return (
    <div className="space-y-16">
      {/* Query box */}
      <section id="run" className="scroll-mt-24">
        <div className="panel p-6 md:p-8">
          <label htmlFor="query" className="text-[13px] font-medium text-ink-800">
            Ask the pipeline a question
          </label>
          <p className="mt-1 text-[13px] text-ink-400">
            Answers are grounded in the Markdown corpus shipped with the repo, so keep it to MCP,
            agent design or retrieval.
          </p>

          <form onSubmit={submit} className="mt-4 flex flex-col gap-3 sm:flex-row">
            <input
              id="query"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="What does an Agent Card actually contain?"
              className="h-11 flex-1 rounded-lg border border-ink-200 bg-white px-4 text-[15px] text-ink-800 placeholder:text-ink-400 transition-colors duration-150 focus:border-sage focus:outline-none focus:ring-2 focus:ring-sage/25"
              autoComplete="off"
              disabled={running}
            />
            <button type="submit" className="btn-primary" disabled={running || !query.trim()}>
              {running ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Running
                </>
              ) : (
                <>
                  Run pipeline <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setQuery(s)}
                disabled={running}
                className="chip"
              >
                {s}
              </button>
            ))}
          </div>

          {!apiKeyConfigured && (
            <p className="mt-5 rounded-lg border-l-2 border-warn bg-warn/5 px-4 py-3 text-[13px] text-ink-600">
              <strong className="font-medium text-ink-800">ANTHROPIC_API_KEY is not set.</strong>{' '}
              The run stops at the first agent. Add it to{' '}
              <code className="rounded bg-ink-100 px-1 font-mono text-[12px]">.env.local</code> and
              restart <code className="rounded bg-ink-100 px-1 font-mono text-[12px]">npm run dev</code>.
            </p>
          )}

          {error && (
            <p className="mt-4 rounded-lg border-l-2 border-danger bg-danger/5 px-4 py-3 text-[13px] text-danger">
              {error}
            </p>
          )}
        </div>
      </section>

      {/* Live trace */}
      <section id="trace" className="scroll-mt-24">
        <div className="text-center">
          <h2 className="text-[28px] font-semibold tracking-tightest text-ink-800 md:text-[32px]">
            Live trace
          </h2>
          <p className="mx-auto mt-3 max-w-[58ch] text-[15px] leading-[1.6] text-ink-600">
            Every tool call and handoff is streamed over server-sent events as it happens. Nothing
            is replayed after the fact.
          </p>
        </div>

        <motion.div
          initial={reduce ? false : { opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ duration: 0.5, ease: EASE }}
          className="mt-8 overflow-hidden rounded-2xl bg-ink-900 shadow-terminal"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-2 text-[12px] font-medium text-ink-200">
              <span
                className={`h-2 w-2 rounded-full ${running ? 'bg-sage animate-pulse-dot' : 'bg-ink-400'}`}
                aria-hidden="true"
              />
              {running ? 'Active' : 'Idle'}
            </span>
            <span className="rounded-md bg-white/10 px-2 py-1 font-mono text-[11px] text-ink-200">
              {status}
            </span>
          </div>

          <div ref={logRef} className="max-h-[420px] min-h-[176px] overflow-y-auto py-2">
            {items.length === 0 ? (
              <p className="px-6 py-12 text-center text-[13px] text-ink-400">
                Run a query above and the four agents will report here, line by line.
              </p>
            ) : (
              <ol>
                {items.map((it, i) => (
                  <TraceLine key={i} event={it.event} index={i} stamp={it.stamp} />
                ))}
              </ol>
            )}
          </div>
        </motion.div>

        {/* Stage outputs and the final answer */}
        {finished.length > 0 && (
          <div className="mt-8 space-y-4">
            {finished.map((e, i) => (
              <StageOutput
                key={i}
                role={e.role as AgentRole}
                output={e.output}
                highlight={e.role === 'writer'}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
