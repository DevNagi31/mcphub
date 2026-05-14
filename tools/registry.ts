/**
 * MCP-style tool registry.
 *
 * Each tool is a self-contained "MCP server" — it declares its schema and
 * implements a single handler. In a full Anthropic MCP deployment these would
 * live in separate processes (stdio or HTTP transport) and Claude would
 * discover them via Agent Cards. Here they're co-located for the demo, but
 * the contract — name, JSON-schema input, sandboxed handler — is identical.
 *
 * Adding a new tool is just `defineTool({ name, schema, handler })`. The
 * orchestrator picks them up automatically and exposes them to Claude.
 */
import { z } from 'zod';

export interface ToolDefinition {
  name: string;
  description: string;
  /** JSON schema that Claude sees when deciding whether to call this tool. */
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
  /** Server-side handler. Pure function over the JSON input. */
  handler: (input: unknown) => Promise<ToolResult>;
}

export interface ToolResult {
  /** Human-readable text Claude will see as the tool response. */
  content: string;
  /** Optional structured data the UI may render alongside the trace. */
  data?: unknown;
}

export type AgentRole = 'researcher' | 'analyst' | 'writer' | 'fact_checker';

const _tools = new Map<string, ToolDefinition>();

export function defineTool(def: ToolDefinition): void {
  if (_tools.has(def.name)) throw new Error(`tool already registered: ${def.name}`);
  _tools.set(def.name, def);
}

export function listTools(): ToolDefinition[] {
  return Array.from(_tools.values());
}

export function getTool(name: string): ToolDefinition | undefined {
  return _tools.get(name);
}

/** Convenience: validate input with zod, then run handler. */
export function zodTool<TSchema extends z.ZodTypeAny>(opts: {
  name: string;
  description: string;
  schema: TSchema;
  handler: (input: z.infer<TSchema>) => Promise<ToolResult>;
}): ToolDefinition {
  return {
    name: opts.name,
    description: opts.description,
    input_schema: zodToJsonSchema(opts.schema),
    async handler(raw: unknown) {
      const parsed = opts.schema.safeParse(raw);
      if (!parsed.success) {
        return { content: `Tool error: ${parsed.error.message}` };
      }
      return opts.handler(parsed.data);
    },
  };
}

/** Minimal zod → JSON-schema converter for the cases we use. */
function zodToJsonSchema(schema: z.ZodTypeAny): ToolDefinition['input_schema'] {
  if (schema instanceof z.ZodObject) {
    const shape = (schema as z.ZodObject<Record<string, z.ZodTypeAny>>).shape;
    const properties: Record<string, unknown> = {};
    const required: string[] = [];
    for (const [key, val] of Object.entries(shape)) {
      properties[key] = zodFieldToJsonSchema(val);
      if (!val.isOptional()) required.push(key);
    }
    return { type: 'object', properties, ...(required.length ? { required } : {}) };
  }
  return { type: 'object', properties: {} };
}

function zodFieldToJsonSchema(field: z.ZodTypeAny): Record<string, unknown> {
  const desc = field.description ? { description: field.description } : {};
  if (field instanceof z.ZodString) return { type: 'string', ...desc };
  if (field instanceof z.ZodNumber) return { type: 'number', ...desc };
  if (field instanceof z.ZodBoolean) return { type: 'boolean', ...desc };
  if (field instanceof z.ZodEnum)
    return { type: 'string', enum: (field as z.ZodEnum<[string, ...string[]]>).options, ...desc };
  if (field instanceof z.ZodOptional)
    return zodFieldToJsonSchema((field as z.ZodOptional<z.ZodTypeAny>).unwrap());
  if (field instanceof z.ZodArray)
    return {
      type: 'array',
      items: zodFieldToJsonSchema((field as z.ZodArray<z.ZodTypeAny>).element),
      ...desc,
    };
  return { type: 'string', ...desc };
}
