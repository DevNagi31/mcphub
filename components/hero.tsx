'use client';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Constellation } from './constellation';

const EASE = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const reduce = useReducedMotion();
  const rise = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.55, ease: EASE, delay },
  });

  return (
    <section className="relative pb-16 pt-20 md:pb-24 md:pt-28">
      <Constellation />

      <div className="relative z-10 mx-auto max-w-3xl px-6 text-center">
        <motion.h1
          {...rise(0)}
          className="text-[38px] font-semibold leading-[1.1] tracking-tightest text-ink-800 md:text-[52px]"
        >
          Four agents read the sources,
          <br className="hidden sm:block" /> argue, and check each other.
        </motion.h1>

        <motion.p
          {...rise(0.08)}
          className="mx-auto mt-6 max-w-[58ch] text-[16px] leading-[1.6] text-ink-600"
        >
          MCPHub runs a research question through a researcher, an analyst, a writer and a
          fact-checker. Each one is a separate Claude call with its own MCP-style tools, and you see
          every step as it streams.
        </motion.p>

        <motion.div {...rise(0.16)} className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#run" className="btn-primary">
            Run a query <ArrowRight className="ml-2 h-4 w-4" />
          </a>
          <a href="#pipeline" className="btn-ghost px-6 py-3">
            See the pipeline
          </a>
        </motion.div>

        <motion.p {...rise(0.24)} className="mt-6 font-mono text-[12px] text-ink-400">
          Next.js 15 · Claude Sonnet 4.6 · streaming over SSE
        </motion.p>
      </div>
    </section>
  );
}
