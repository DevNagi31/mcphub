import { describe, it, expect } from 'vitest';
import '@/tools/knowledge-base';
import '@/tools/compute';
import { getTool, listTools } from '@/tools/registry';

describe('tool registry', () => {
  it('lists every registered tool with valid JSON schema', () => {
    const tools = listTools();
    expect(tools.length).toBeGreaterThan(0);
    for (const t of tools) {
      expect(t.name).toMatch(/^[a-z_][a-z0-9_]*$/);
      expect(t.description.length).toBeGreaterThan(20);
      expect(t.input_schema.type).toBe('object');
      expect(typeof t.input_schema.properties).toBe('object');
    }
  });

  it('exposes the expected canonical tools', () => {
    expect(getTool('search_kb')).toBeDefined();
    expect(getTool('fetch_doc')).toBeDefined();
    expect(getTool('calculate')).toBeDefined();
  });

  it('zod validation rejects malformed input cleanly', async () => {
    const tool = getTool('calculate')!;
    const result = await tool.handler({ wrong_field: 'oops' });
    expect(result.content.toLowerCase()).toContain('error');
  });
});
