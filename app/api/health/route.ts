import { NextResponse } from 'next/server';
import { listTools } from '@/tools/registry';
import { listKbCorpus } from '@/tools/knowledge-base';
import '@/tools/compute';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json({
    ok: true,
    tools: listTools().map((t) => ({ name: t.name, description: t.description })),
    kb: listKbCorpus(),
    apiKeyConfigured: !!process.env.ANTHROPIC_API_KEY,
  });
}
