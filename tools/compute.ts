/**
 * Compute MCP server.
 *
 * A safe arithmetic evaluator the analyst agent can use to do back-of-envelope
 * math without making Claude do the arithmetic in its head (which it's bad at).
 */
import { z } from 'zod';
import { defineTool, zodTool } from './registry';

/** Tiny, safe arithmetic evaluator. No identifiers, no function calls. */
function evalArithmetic(expr: string): number {
  // Allow: digits, decimal, whitespace, + - * / ( ) ^ %
  if (!/^[\d\s+\-*/().^%]+$/.test(expr)) {
    throw new Error('only arithmetic characters allowed');
  }
  // Replace ^ with ** for JS exponentiation.
  const safe = expr.replace(/\^/g, '**');
  // eslint-disable-next-line no-new-func
  const result = new Function(`return (${safe});`)();
  if (typeof result !== 'number' || !Number.isFinite(result)) {
    throw new Error('expression did not evaluate to a finite number');
  }
  return result;
}

defineTool(
  zodTool({
    name: 'calculate',
    description:
      'Evaluate a basic arithmetic expression. Supports + - * / ( ) ^ % and decimals. Use for any numerical reasoning — Claude is unreliable at arithmetic on its own.',
    schema: z.object({
      expression: z.string().describe('e.g. "(0.6 * 1000) / 8" or "(1.5 ** 0.5) * 100".'),
    }),
    async handler({ expression }) {
      try {
        const value = evalArithmetic(expression);
        return {
          content: `${expression} = ${value}`,
          data: { expression, value },
        };
      } catch (err) {
        return { content: `Could not evaluate "${expression}": ${(err as Error).message}` };
      }
    },
  }),
);
