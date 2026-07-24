'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { Database, FileText, Calculator } from 'lucide-react';

const EASE = [0.16, 1, 0.3, 1] as const;

interface ToolCard {
  name: string;
  signature: string;
  blurb: string;
  usedBy: string;
  Icon: typeof Database;
}

const TOOLS: ToolCard[] = [
  {
    name: 'search_kb',
    signature: 'search_kb(query, limit?)',
    blurb:
      'Lexically ranks the in-repo Markdown corpus and returns scored snippets with their source path.',
    usedBy: 'Researcher, Fact-Checker',
    Icon: Database,
  },
  {
    name: 'fetch_doc',
    signature: 'fetch_doc(path)',
    blurb:
      'Returns one document in full, so a stage can quote exactly rather than work from a snippet.',
    usedBy: 'Researcher, Fact-Checker',
    Icon: FileText,
  },
  {
    name: 'calculate',
    signature: 'calculate(expression)',
    blurb:
      'A sandboxed arithmetic evaluator with no identifiers and no function calls, for the numbers a model should not do in its head.',
    usedBy: 'Analyst',
    Icon: Calculator,
  },
];

export function ToolsSection() {
  const reduce = useReducedMotion();

  return (
    <section id="tools" className="scroll-mt-24">
      <div className="max-w-[52ch]">
        <p className="text-xs uppercase tracking-[0.14em] text-ink-400">Tool registry</p>
        <h2 className="mt-3 text-[28px] font-semibold tracking-tightest text-ink-800 md:text-[32px]">
          Tools are declared once, then handed to whoever needs them
        </h2>
        <p className="mt-3 text-[15px] leading-[1.6] text-ink-600">
          Every tool declares a name, a Zod schema and a handler. The orchestrator turns that into
          the JSON schema Claude sees and gives each agent only the tools its role calls for.
        </p>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {TOOLS.map((t, i) => (
          <motion.article
            key={t.name}
            initial={reduce ? false : { opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.45, ease: EASE, delay: i * 0.08 }}
            whileHover={reduce ? undefined : { y: -4, transition: { duration: 0.2 } }}
            className="card flex flex-col p-6"
          >
            <t.Icon className="h-5 w-5 text-sage-deep" strokeWidth={1.6} aria-hidden="true" />
            <h3 className="mt-4 font-mono text-[14px] text-ink-800">{t.signature}</h3>
            <p className="mt-3 flex-1 text-[13px] leading-[1.55] text-ink-600">{t.blurb}</p>
            <p className="mt-4 border-t border-ink-100 pt-3 text-[12px] text-ink-400">
              Available to {t.usedBy}
            </p>
          </motion.article>
        ))}
      </div>
    </section>
  );
}
