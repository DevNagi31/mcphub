'use client';
import { motion } from 'framer-motion';
import {
  Search,
  Calculator,
  PenLine,
  ShieldCheck,
  Wrench,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

export type TraceEvent =
  | { type: 'start'; role: AgentRole; input: string }
  | { type: 'thinking'; role: AgentRole; text: string }
  | { type: 'tool_call'; role: AgentRole; tool: string; input: unknown; id: string }
  | { type: 'tool_result'; role: AgentRole; tool: string; output: string; id: string }
  | { type: 'finish'; role: AgentRole; output: string }
  | { type: 'error'; role: AgentRole; message: string }
  | { type: 'done'; final: string };

export type AgentRole = 'researcher' | 'analyst' | 'writer' | 'fact_checker';

const ROLE_META: Record<AgentRole, { label: string; color: string; Icon: typeof Search }> = {
  researcher: { label: 'Researcher', color: '#0071e3', Icon: Search },
  analyst: { label: 'Analyst', color: '#7e3bff', Icon: Calculator },
  writer: { label: 'Writer', color: '#0a7c2f', Icon: PenLine },
  fact_checker: { label: 'Fact Checker', color: '#b07b00', Icon: ShieldCheck },
};

const easing = [0.16, 1, 0.3, 1] as const;

export function TraceEventCard({ event, index }: { event: TraceEvent; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: easing, delay: Math.min(0.05, index * 0.005) }}
    >
      {renderEvent(event)}
    </motion.div>
  );
}

function renderEvent(event: TraceEvent): JSX.Element {
  if (event.type === 'done') {
    return (
      <div className="glass mt-2 p-6">
        <div className="mb-3 flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-ink-400">
          <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          Final answer
        </div>
        <div className="prose prose-sm max-w-none prose-headings:tracking-tightest prose-code:font-mono prose-code:bg-ink-100 prose-code:px-1 prose-code:rounded prose-a:text-accent">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.final}</ReactMarkdown>
        </div>
      </div>
    );
  }
  if (event.type === 'error') {
    return (
      <div className="card mt-2 border-l-4 border-danger p-4">
        <div className="flex items-center gap-2 text-[13px] font-medium text-danger">
          <AlertCircle className="h-4 w-4" /> {ROLE_META[event.role].label} failed
        </div>
        <pre className="mt-1 whitespace-pre-wrap text-[12px] text-ink-600">{event.message}</pre>
      </div>
    );
  }

  const meta = ROLE_META[event.role];

  if (event.type === 'start') {
    return (
      <div className="mt-4 flex items-center gap-3 px-1">
        <span
          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-white"
          style={{ background: meta.color }}
        >
          <meta.Icon className="h-3.5 w-3.5" />
        </span>
        <div className="text-[14px] font-semibold tracking-tight text-ink-800">{meta.label}</div>
        <ArrowRight className="h-3.5 w-3.5 text-ink-400" />
        <span className="text-[12px] text-ink-400">starting</span>
      </div>
    );
  }

  if (event.type === 'finish') {
    return (
      <div className="card border-l-4 p-4" style={{ borderLeftColor: meta.color }}>
        <div className="mb-2 flex items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-ink-400">
          <meta.Icon className="h-3 w-3" style={{ color: meta.color }} />
          {meta.label} output
        </div>
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{event.output}</ReactMarkdown>
        </div>
      </div>
    );
  }

  if (event.type === 'thinking') {
    return (
      <div className="ml-10 mr-1 my-1 text-[12px] italic text-ink-600">
        {event.text.length > 280 ? event.text.slice(0, 280) + '…' : event.text}
      </div>
    );
  }

  if (event.type === 'tool_call') {
    return (
      <div className="ml-10 mt-1 inline-flex items-center gap-2 rounded-full bg-ink-100 px-3 py-1 text-[12px]">
        <Wrench className="h-3 w-3 text-ink-600" />
        <span className="font-mono text-ink-800">{event.tool}</span>
        <span className="text-ink-400">{compactJson(event.input)}</span>
      </div>
    );
  }

  if (event.type === 'tool_result') {
    const preview = event.output.length > 220 ? event.output.slice(0, 220) + '…' : event.output;
    return (
      <div className="ml-10 mb-2 mt-1 rounded-lg bg-ink-50 p-3 font-mono text-[11px] text-ink-600 whitespace-pre-wrap">
        ← {preview}
      </div>
    );
  }

  return <></>;
}

function compactJson(v: unknown): string {
  try {
    const s = JSON.stringify(v);
    return s.length > 120 ? s.slice(0, 120) + '…' : s;
  } catch {
    return String(v);
  }
}
