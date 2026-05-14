'use client';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Loader2 } from 'lucide-react';
import { TraceEventCard, type TraceEvent } from './trace-event';

const SUGGESTIONS = [
  'How does Anthropic\'s MCP differ from a plain REST API for tools?',
  'When should I use a supervisor pattern vs a fixed pipeline of agents?',
  'What chunking strategy gives the best RAG retrieval F1 on prose?',
  'How do you make text-to-SQL safe for production?',
];

const easing = [0.16, 1, 0.3, 1] as const;

interface Props {
  apiKeyConfigured: boolean;
}

export function RunForm({ apiKeyConfigured }: Props) {
  const [query, setQuery] = useState('');
  const [events, setEvents] = useState<TraceEvent[]>([]);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const traceRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (traceRef.current) {
      traceRef.current.scrollTop = traceRef.current.scrollHeight;
    }
  }, [events.length]);

  async function submit(e?: React.FormEvent) {
    e?.preventDefault();
    if (!query.trim() || running) return;
    setError(null);
    setEvents([]);
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
            setEvents((prev) => [...prev, parsed]);
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
    <div className="mx-auto max-w-4xl px-6 py-12">
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easing }}
        className="text-center"
      >
        <h1 className="text-[44px] font-semibold leading-none tracking-tightest text-ink-800 md:text-[56px]">
          Four agents,{' '}
          <span className="bg-gradient-to-br from-accent to-violet-500 bg-clip-text text-transparent">
            one protocol.
          </span>
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-[16px] text-ink-600">
          A research pipeline on Anthropic's Model Context Protocol. Researcher →
          Analyst → Writer → Fact-Checker, each a separate Claude call with custom MCP-style
          tools. Watch the trace stream in real time.
        </p>
      </motion.section>

      <motion.form
        onSubmit={submit}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easing, delay: 0.1 }}
        className="glass mt-10 p-2"
      >
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Ask the agents something grounded in the knowledge base…"
            className="flex-1 bg-transparent px-4 py-3 text-[15px] text-ink-800 placeholder:text-ink-400 focus:outline-none"
            autoComplete="off"
            disabled={running}
          />
          <button type="submit" className="btn-primary" disabled={running || !query.trim()}>
            {running ? (
              <>
                <Loader2 className="mr-1 h-3.5 w-3.5 animate-spin" /> Running
              </>
            ) : (
              <>
                <Sparkles className="mr-1 h-3.5 w-3.5" /> Run pipeline
              </>
            )}
          </button>
        </div>
      </motion.form>

      {!apiKeyConfigured && (
        <div className="mt-4 rounded-2xl border-l-4 border-warn bg-warn/10 p-4 text-[13px] text-ink-600">
          <strong>ANTHROPIC_API_KEY not set.</strong> The run will fail at the first agent. Set it
          in <code className="rounded bg-ink-100 px-1 font-mono">.env.local</code> and restart{' '}
          <code className="rounded bg-ink-100 px-1 font-mono">npm run dev</code>.
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {SUGGESTIONS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setQuery(s)}
            disabled={running}
            className="rounded-full bg-ink-100 px-3 py-1 text-[11px] text-ink-600 transition hover:bg-ink-200 disabled:opacity-50"
          >
            {s}
          </button>
        ))}
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border-l-4 border-danger bg-danger/5 p-4 text-[13px] text-danger">
          {error}
        </div>
      )}

      <div ref={traceRef} className="mt-8 space-y-2">
        {events.map((event, i) => (
          <TraceEventCard key={i} event={event} index={i} />
        ))}
      </div>
    </div>
  );
}
