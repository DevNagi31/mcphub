/**
 * Multi-agent orchestrator.
 *
 * Pipeline of four specialized agents, each a separate Claude call with a
 * different system prompt and (in most cases) tool access. Output of one
 * stage becomes input to the next.
 *
 *   researcher  →  analyst  →  writer  →  fact_checker
 *   (search/   →  (calc/   →  (no    →  (search/
 *    fetch)        synth.)     tools)    fetch)
 *
 * Every step yields a typed TraceEvent so the UI can stream the run.
 */
import Anthropic from '@anthropic-ai/sdk';
import { getTool, listTools, type AgentRole } from '@/tools/registry';
import '@/tools/knowledge-base';
import '@/tools/compute';

const DEFAULT_MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-6';

type ContentBlock = Anthropic.Messages.ContentBlock;
type MessageParam = Anthropic.Messages.MessageParam;
type ToolUseBlock = Extract<ContentBlock, { type: 'tool_use' }>;

const SYSTEM_PROMPTS: Record<AgentRole, string> = {
  researcher: `You are the Researcher in a four-agent pipeline. Your job is to gather the most relevant material from the knowledge base.

Process:
1. Call search_kb to find candidate documents for the user's question.
2. Call fetch_doc on the top 2-3 results to read them in full.
3. Produce a structured findings memo with concrete quotes and source paths.

Be exhaustive but tight. The Analyst sees only your output, not the raw documents.`,

  analyst: `You are the Analyst. The Researcher gave you a findings memo. Synthesize, identify the key claims that answer the user's question, do any required arithmetic with the calculate tool, and call out tensions or open questions.

Output format:
- KEY CLAIMS (numbered list with evidence pointer)
- IMPLICATIONS (1-2 sentences)
- OPEN QUESTIONS (if any)`,

  writer: `You are the Writer. The Analyst gave you a structured analysis. Produce the final answer to the user's question.

Rules:
- Markdown.
- Lead with a one-sentence direct answer.
- Then 2-4 paragraphs of substance.
- Cite source paths inline like [mcp/overview.md] when you draw on specific material.
- Do NOT invent claims not in the analysis.`,

  fact_checker: `You are the Fact Checker. Compare the Writer's draft against the Researcher's source material (use search_kb / fetch_doc as needed).

For each substantive claim:
- ✓ SUPPORTED — claim is grounded in retrieved material
- ⚠ UNSUPPORTED — no direct evidence in the corpus
- ✗ CONTRADICTED — corpus disagrees

End with a verdict: SHIP / REVISE / BLOCK and one sentence of justification.`,
};

const TOOLS_PER_ROLE: Record<AgentRole, string[]> = {
  researcher: ['search_kb', 'fetch_doc'],
  analyst: ['calculate'],
  writer: [],
  fact_checker: ['search_kb', 'fetch_doc'],
};

export type TraceEvent =
  | { type: 'start'; role: AgentRole; input: string }
  | { type: 'thinking'; role: AgentRole; text: string }
  | { type: 'tool_call'; role: AgentRole; tool: string; input: unknown; id: string }
  | { type: 'tool_result'; role: AgentRole; tool: string; output: string; id: string }
  | { type: 'finish'; role: AgentRole; output: string }
  | { type: 'error'; role: AgentRole; message: string }
  | { type: 'done'; final: string };

export interface RunOptions {
  query: string;
  apiKey?: string;
  model?: string;
  maxToolIterations?: number;
}

export async function* runPipeline(opts: RunOptions): AsyncGenerator<TraceEvent> {
  const apiKey = opts.apiKey ?? process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    yield { type: 'error', role: 'researcher', message: 'ANTHROPIC_API_KEY is not set' };
    return;
  }
  const client = new Anthropic({ apiKey });
  const model = opts.model ?? DEFAULT_MODEL;

  let context = `User question:\n\n${opts.query}`;
  let finalOutput = '';

  const order: AgentRole[] = ['researcher', 'analyst', 'writer', 'fact_checker'];
  for (const role of order) {
    yield { type: 'start', role, input: context };
    try {
      const output = yield* runAgent(client, role, context, model, opts.maxToolIterations ?? 6);
      yield { type: 'finish', role, output };
      context = `Previous step (${role}) output:\n\n${output}\n\nOriginal user question: ${opts.query}`;
      if (role === 'writer') finalOutput = output;
    } catch (err) {
      yield { type: 'error', role, message: (err as Error).message };
      return;
    }
  }

  yield { type: 'done', final: finalOutput };
}

async function* runAgent(
  client: Anthropic,
  role: AgentRole,
  input: string,
  model: string,
  maxIterations: number,
): AsyncGenerator<TraceEvent, string> {
  const toolNames = TOOLS_PER_ROLE[role];
  const tools = toolNames
    .map((name) => getTool(name))
    .filter((t): t is NonNullable<typeof t> => !!t)
    .map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.input_schema,
    }));

  const messages: MessageParam[] = [{ role: 'user', content: input }];

  for (let i = 0; i < maxIterations; i++) {
    const response = await client.messages.create({
      model,
      max_tokens: 2048,
      system: SYSTEM_PROMPTS[role],
      tools: tools.length > 0 ? tools : undefined,
      messages,
    });

    const textBlocks = response.content
      .filter((b): b is Extract<ContentBlock, { type: 'text' }> => b.type === 'text')
      .map((b) => b.text)
      .join('\n')
      .trim();

    if (textBlocks) {
      yield { type: 'thinking', role, text: textBlocks };
    }

    if (response.stop_reason !== 'tool_use') {
      return textBlocks;
    }

    const toolUses = response.content.filter(
      (b): b is ToolUseBlock => b.type === 'tool_use',
    );

    // Echo tool calls + results back into the message history
    messages.push({ role: 'assistant', content: response.content });

    const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
    for (const use of toolUses) {
      yield {
        type: 'tool_call',
        role,
        tool: use.name,
        input: use.input,
        id: use.id,
      };
      const tool = getTool(use.name);
      const result = tool
        ? await tool.handler(use.input).catch((e) => ({ content: `Tool error: ${e.message}` }))
        : { content: `Unknown tool: ${use.name}` };
      yield {
        type: 'tool_result',
        role,
        tool: use.name,
        output: result.content,
        id: use.id,
      };
      toolResults.push({
        type: 'tool_result',
        tool_use_id: use.id,
        content: result.content,
      });
    }
    messages.push({ role: 'user', content: toolResults });
  }

  throw new Error(`Agent "${role}" exceeded ${maxIterations} tool iterations`);
}

export function getAvailableTools(): Array<{ name: string; description: string; role: AgentRole[] }> {
  return listTools().map((t) => ({
    name: t.name,
    description: t.description,
    role: (Object.keys(TOOLS_PER_ROLE) as AgentRole[]).filter((r) =>
      TOOLS_PER_ROLE[r].includes(t.name),
    ),
  }));
}
