'use client';
import { motion } from 'framer-motion';
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

export const ROLE_META: Record<AgentRole, { label: string; dot: string }> = {
  researcher: { label: 'Researcher', dot: '#8ea3ab' },
  analyst: { label: 'Analyst', dot: '#7fb3a3' },
  writer: { label: 'Writer', dot: '#c3ab74' },
  fact_checker: { label: 'Fact-Checker', dot: '#6f9187' },
};

const EASE = [0.16, 1, 0.3, 1] as const;

/** A single line in the dark trace log. */
export function TraceLine({
  event,
  index,
  stamp,
}: {
  event: TraceEvent;
  index: number;
  stamp: string;
}) {
  const line = describe(event);
  if (!line) return null;

  return (
    <motion.li
      initial={{ opacity: 0, x: -6 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.25, ease: EASE, delay: Math.min(0.06, index * 0.004) }}
      className="relative flex gap-3 py-[7px] pl-6 pr-4 text-[12.5px] leading-[1.5]"
    >
      <span
        className="absolute left-2 top-[13px] h-1.5 w-1.5 rounded-full"
        style={{ background: line.dot }}
        aria-hidden="true"
      />
      <span className="shrink-0 font-mono text-ink-400">[{stamp}]</span>
      <span className="min-w-0 text-ink-200">
        <span className="font-medium text-white">{line.label}</span>{' '}
        <span className="text-ink-300">{line.text}</span>
      </span>
    </motion.li>
  );
}

function describe(
  event: TraceEvent,
): { label: string; text: string; dot: string } | null {
  if (event.type === 'done') return null;

  if (event.type === 'error') {
    return {
      label: `${ROLE_META[event.role].label} failed`,
      text: event.message,
      dot: '#d4756c',
    };
  }

  const meta = ROLE_META[event.role];

  switch (event.type) {
    case 'start':
      return { label: `${meta.label} agent`, text: 'picked up the handoff.', dot: meta.dot };
    case 'thinking':
      return { label: meta.label, text: truncate(event.text, 180), dot: meta.dot };
    case 'tool_call':
      return {
        label: meta.label,
        text: `called ${event.tool} ${compactJson(event.input)}`,
        dot: meta.dot,
      };
    case 'tool_result':
      return {
        label: meta.label,
        text: `got back ${truncate(event.output.replace(/\s+/g, ' '), 140)}`,
        dot: meta.dot,
      };
    case 'finish':
      return { label: meta.label, text: 'handed off its output.', dot: meta.dot };
    default:
      return null;
  }
}

/** Long-form output from a stage, rendered outside the log. */
export function StageOutput({
  role,
  output,
  highlight = false,
}: {
  role: AgentRole;
  output: string;
  highlight?: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={highlight ? 'panel border-sage/60 p-6 md:p-8' : 'card p-6'}
    >
      <div className="mb-3 text-[11px] uppercase tracking-[0.12em] text-ink-400">
        {highlight ? 'Final answer' : `${ROLE_META[role].label} output`}
      </div>
      <div className="prose prose-sm max-w-none text-ink-800 prose-headings:tracking-tightest prose-a:text-sage-deep prose-code:rounded prose-code:bg-ink-100 prose-code:px-1 prose-code:font-mono">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{output}</ReactMarkdown>
      </div>
    </motion.div>
  );
}

function truncate(s: string, n: number): string {
  return s.length > n ? s.slice(0, n) + '...' : s;
}

function compactJson(v: unknown): string {
  try {
    const s = JSON.stringify(v);
    return s.length > 90 ? s.slice(0, 90) + '...' : s;
  } catch {
    return String(v);
  }
}
