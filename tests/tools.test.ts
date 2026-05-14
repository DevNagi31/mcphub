import { describe, it, expect } from 'vitest';
import '@/tools/knowledge-base';
import '@/tools/compute';
import { getTool } from '@/tools/registry';

describe('search_kb', () => {
  it('ranks the MCP overview doc highly for an MCP question', async () => {
    const tool = getTool('search_kb')!;
    const result = await tool.handler({ query: 'model context protocol overview' });
    expect(result.content).toContain('mcp/overview.md');
    const data = (result.data as Array<{ path: string; score: number }>);
    expect(data[0]?.path).toBe('mcp/overview.md');
  });

  it('returns a graceful empty result for nonsense', async () => {
    const tool = getTool('search_kb')!;
    const result = await tool.handler({ query: 'xyzzy-quxz' });
    expect(result.content.toLowerCase()).toContain('no documents matched');
  });

  it('respects the limit argument', async () => {
    const tool = getTool('search_kb')!;
    const result = await tool.handler({ query: 'agent claude tool', limit: 1 });
    const data = result.data as unknown[];
    expect(data.length).toBeLessThanOrEqual(1);
  });
});

describe('fetch_doc', () => {
  it('returns the full content for a known path', async () => {
    const tool = getTool('fetch_doc')!;
    const result = await tool.handler({ path: 'mcp/overview.md' });
    expect(result.content).toContain('Model Context Protocol');
  });

  it('lists available paths when the requested one is missing', async () => {
    const tool = getTool('fetch_doc')!;
    const result = await tool.handler({ path: 'does-not-exist.md' });
    expect(result.content).toMatch(/Available paths:/);
  });
});

describe('calculate', () => {
  it('evaluates basic arithmetic correctly', async () => {
    const tool = getTool('calculate')!;
    const result = await tool.handler({ expression: '(2 + 3) * 4' });
    expect(result.content).toContain('= 20');
  });

  it('handles exponents', async () => {
    const tool = getTool('calculate')!;
    const result = await tool.handler({ expression: '2 ^ 10' });
    expect(result.content).toContain('= 1024');
  });

  it('rejects code-injection attempts', async () => {
    const tool = getTool('calculate')!;
    const result = await tool.handler({ expression: 'process.exit(1)' });
    expect(result.content.toLowerCase()).toContain('only arithmetic');
  });

  it('rejects division-by-zero / non-finite results', async () => {
    const tool = getTool('calculate')!;
    const result = await tool.handler({ expression: '1 / 0' });
    expect(result.content.toLowerCase()).toContain('did not evaluate to a finite number');
  });
});
