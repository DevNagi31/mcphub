/**
 * Knowledge-base MCP server.
 *
 * Indexes a small set of in-repo Markdown docs and exposes two tools:
 *   search_kb(query)  → ranked snippets matching the query (lexical scoring)
 *   fetch_doc(path)   → the full contents of a doc by path
 *
 * Realistic enough for the multi-agent demo — the researcher agent uses
 * search_kb to find relevant material, then fetch_doc for full text.
 */
import { z } from 'zod';
import { defineTool, zodTool } from './registry';

interface Doc {
  path: string;
  title: string;
  content: string;
}

const CORPUS: Doc[] = [
  {
    path: 'mcp/overview.md',
    title: 'Model Context Protocol — Overview',
    content: `# Model Context Protocol (MCP)

MCP is Anthropic's open standard for connecting LLMs to external data and tools.
A **server** exposes tools (functions Claude can call) and resources (files
Claude can read). A **client** — typically an LLM-powered application — discovers
those tools via the protocol and decides which to invoke based on the
conversation.

Transports: stdio (local subprocess) and HTTP (server-sent events for streaming).

Key idea: tool discovery is dynamic. Any new MCP server is instantly usable by
every MCP-aware client without code changes on the client side.
`,
  },
  {
    path: 'mcp/agent-cards.md',
    title: 'MCP Agent Cards',
    content: `# MCP Agent Cards

An Agent Card is metadata an MCP server publishes describing the tools it
provides — name, description, JSON-schema input, optional examples. Claude
reads Agent Cards on connect and uses them to decide which tool fits the
current step.

The card is the entire contract. A well-named tool with a precise description
gets invoked correctly; a sloppy card produces silent miscalls.
`,
  },
  {
    path: 'agents/multi-agent-patterns.md',
    title: 'Multi-Agent Patterns',
    content: `# Multi-Agent Patterns

Four common patterns:

1. **Pipeline** — fixed sequence (researcher → analyst → writer → fact-checker).
   Predictable, easy to debug. Used in MCPHub.

2. **Supervisor** — a planning agent routes work to specialists dynamically.
   More flexible, harder to test.

3. **Swarm** — peer agents coordinate via shared state. Powerful, but emergent
   behavior is hard to constrain.

4. **Tool-use loop** — a single agent calls tools in a ReAct loop. Simplest;
   often sufficient.

For most product workflows, start with the pipeline pattern. Add supervisor
routing only when you've measured a need for it.
`,
  },
  {
    path: 'safety/grounded-generation.md',
    title: 'Grounded Generation Safety',
    content: `# Grounded Generation Safety

When an LLM emits claims attributed to retrieved context, three failure modes
matter:

- **Hallucination**: claim not present in context.
- **Misattribution**: claim is in context but attributed to wrong source.
- **Stale context**: claim was correct at index time but no longer holds.

Mitigations: chunk-level citations (force the model to point at a specific
fragment), faithfulness scoring (LLM-as-judge comparing claims to context),
and freshness metadata on retrieved chunks.
`,
  },
  {
    path: 'safety/text-to-sql-guardrails.md',
    title: 'Text-to-SQL Guardrails',
    content: `# Text-to-SQL Guardrails

Letting an LLM emit SQL against a real database needs three layers:

1. **Schema prompt** — show the model only the relations it's allowed to use.
2. **AST allow-list** — parse the generated SQL (e.g., pgsql-ast-parser) and
   reject anything that references a non-allow-listed table. Structural
   validation; not regex.
3. **Execution sandbox** — run on a read-only role with a strict statement
   timeout. Defense in depth.

Show the generated SQL to the user before executing — no black-box trust.
`,
  },
  {
    path: 'eval/llm-as-judge.md',
    title: 'LLM-as-Judge Evaluation',
    content: `# LLM-as-Judge Evaluation

A second LLM scores the first one's output against rubric criteria. Useful
when no programmatic check exists (e.g., "is this answer faithful to the
context?").

Pitfalls:
- **Self-consistency**: same model scoring its own output is biased.
- **Position bias**: judges prefer the first option in pairwise comparisons.
- **Rubric drift**: vague criteria → noisy scores.

Always validate the judge against a small human-annotated set before trusting
its absolute numbers.
`,
  },
  {
    path: 'rag/chunking.md',
    title: 'RAG Chunking Strategies',
    content: `# Chunking Strategies for RAG

Goal: each chunk is semantically coherent and small enough to fit in the
context window with headroom.

Approaches:
- **Fixed-size** (e.g., 512 tokens with 50-token overlap): simplest, decent baseline.
- **Recursive character splitter**: respects paragraph/sentence boundaries first.
- **Semantic chunking**: split at embedding-distance jumps. Best quality, most expensive.
- **Code-aware**: for source files, split on function/class boundaries.

For typical prose RAG, recursive splitter at ~500 tokens with ~80 overlap
beats fixed-size on retrieval F1 by 5–15 percentage points.
`,
  },
];

function score(query: string, doc: Doc): number {
  const q = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  if (q.length === 0) return 0;
  const hay = (doc.title + '\n' + doc.content).toLowerCase();
  let hits = 0;
  for (const term of q) {
    // Count occurrences (capped) — basic TF.
    const count = (hay.match(new RegExp(escapeRe(term), 'g')) ?? []).length;
    hits += Math.min(count, 5);
  }
  return hits / q.length;
}

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

defineTool(
  zodTool({
    name: 'search_kb',
    description:
      'Search the knowledge base. Returns ranked excerpts (title + path + snippet). Use this first to discover what material is available for a topic.',
    schema: z.object({
      query: z.string().describe('Search terms; can be multi-word.'),
      limit: z.number().optional().describe('Max results (default 4).'),
    }),
    async handler({ query, limit }) {
      const k = limit ?? 4;
      const ranked = CORPUS.map((d) => ({ d, s: score(query, d) }))
        .filter((r) => r.s > 0)
        .sort((a, b) => b.s - a.s)
        .slice(0, k);
      if (ranked.length === 0) {
        return { content: `No documents matched "${query}". Try different terms.` };
      }
      const lines = ranked.map(({ d, s }) => {
        const snippet = d.content.split('\n').filter((l) => l.trim()).slice(0, 3).join(' ');
        return `[${d.path}] (score ${s.toFixed(2)}) ${d.title}\n  ${snippet.slice(0, 240)}…`;
      });
      return {
        content: lines.join('\n\n'),
        data: ranked.map((r) => ({ path: r.d.path, title: r.d.title, score: r.s })),
      };
    },
  }),
);

defineTool(
  zodTool({
    name: 'fetch_doc',
    description:
      'Fetch the full contents of a knowledge-base document by its path. Use this after search_kb to read material in full.',
    schema: z.object({
      path: z.string().describe("Document path from search_kb results, e.g. 'mcp/overview.md'."),
    }),
    async handler({ path }) {
      const doc = CORPUS.find((d) => d.path === path);
      if (!doc) {
        return { content: `No such doc: ${path}. Available paths: ${CORPUS.map((d) => d.path).join(', ')}` };
      }
      return { content: doc.content, data: { path: doc.path, title: doc.title } };
    },
  }),
);

export const KB_TOOL_COUNT = 2;
export function listKbCorpus(): Array<{ path: string; title: string }> {
  return CORPUS.map((d) => ({ path: d.path, title: d.title }));
}
