'use client';
import { Fragment } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Search, BarChart3, PenLine, CheckCircle2, ChevronRight } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

const STAGES = [
  {
    key: 'researcher',
    label: 'Researcher',
    caption: 'Searches the corpus, reads the top documents in full',
    tools: 'search_kb, fetch_doc',
    tone: '#3f4a4f',
    Icon: Search,
  },
  {
    key: 'analyst',
    label: 'Analyst',
    caption: 'Pulls out key claims, runs the arithmetic, flags tensions',
    tools: 'calculate',
    tone: '#5d7a72',
    Icon: BarChart3,
  },
  {
    key: 'writer',
    label: 'Writer',
    caption: 'Drafts the answer in Markdown with inline source paths',
    tools: 'no tools',
    tone: '#8d7c52',
    Icon: PenLine,
  },
  {
    key: 'fact_checker',
    label: 'Fact-Checker',
    caption: 'Re-reads the sources and rules SHIP, REVISE or BLOCK',
    tools: 'search_kb, fetch_doc',
    tone: '#6f9187',
    Icon: CheckCircle2,
  },
];

function Hexagon({ tone, Icon }: { tone: string; Icon: typeof Search }) {
  return (
    <span className="relative inline-flex h-[104px] w-[92px] items-center justify-center">
      <svg viewBox="0 0 92 104" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <polygon
          points="46,3 88,27 88,77 46,101 4,77 4,27"
          fill="#ffffff"
          stroke={tone}
          strokeWidth="1.6"
        />
        <polygon
          points="46,12 80,32 80,72 46,92 12,72 12,32"
          fill="none"
          stroke={tone}
          strokeWidth="1"
          opacity="0.35"
        />
      </svg>
      <Icon className="relative h-7 w-7" style={{ color: tone }} strokeWidth={1.6} />
    </span>
  );
}

export function Pipeline() {
  const reduce = useReducedMotion();

  return (
    <section id="pipeline" className="scroll-mt-24">
      <div className="panel px-6 py-12 md:px-12 md:py-16">
        <div className="text-center">
          <p className="text-xs uppercase tracking-[0.14em] text-ink-400">How a run works</p>
          <h2 className="mt-3 text-[28px] font-semibold tracking-tightest text-ink-800 md:text-[32px]">
            Four agents, one handoff chain
          </h2>
          <p className="mx-auto mt-3 max-w-[60ch] text-[15px] leading-[1.6] text-ink-600">
            Each stage is its own Claude call with its own system prompt and its own tool
            allowlist. The output of one becomes the input of the next, so nothing is hidden in a
            single opaque prompt.
          </p>
        </div>

        <ol className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:flex lg:items-start lg:gap-0">
          {STAGES.map((s, i) => (
            <Fragment key={s.key}>
            <motion.li
              initial={reduce ? false : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-80px' }}
              transition={{ duration: 0.5, ease: EASE, delay: i * 0.08 }}
              className="flex flex-1 items-start gap-4 lg:flex-col lg:items-center"
            >
              <Hexagon tone={s.tone} Icon={s.Icon} />

              <div className="pt-3 lg:pt-4 lg:text-center">
                <h3 className="text-[13px] font-semibold uppercase tracking-[0.1em] text-ink-800">
                  {s.label}
                </h3>
                <p className="mt-2 max-w-[26ch] text-[13px] leading-[1.5] text-ink-600">
                  {s.caption}
                </p>
                <p className="mt-2 font-mono text-[11px] text-ink-400">{s.tools}</p>
              </div>
            </motion.li>
            {/* Flow arrow. The stacked layout below lg already implies order. */}
            {i < STAGES.length - 1 && (
              <li aria-hidden="true" className="hidden pt-10 lg:block">
                <ChevronRight className="h-4 w-4 text-ink-300" />
              </li>
            )}
            </Fragment>
          ))}
        </ol>

        <p className="mt-10 text-center text-[13px] text-ink-400">
          The fact-checker reads the same corpus the researcher pulled from, so a claim that never
          appeared in a source gets marked before you see it.
        </p>
      </div>
    </section>
  );
}
