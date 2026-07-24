/**
 * POST /api/run — start a pipeline run and stream trace events as SSE.
 *
 * Body: { query: string }
 * Response: text/event-stream where each event is a JSON-encoded TraceEvent.
 *
 * The client renders these as they arrive to show the agent thinking in real
 * time. No buffering — events flush as soon as Claude returns each step.
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { runPipeline } from '@/server/agent';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const Body = z.object({
  query: z.string().min(3).max(500),
});

function sse(event: string, payload: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(req: NextRequest) {
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { 'content-type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const enqueue = (data: string) => {
        try {
          controller.enqueue(encoder.encode(data));
        } catch {
          /* stream closed */
        }
      };

      try {
        for await (const ev of runPipeline({ query: body.query })) {
          enqueue(sse(ev.type, ev));
          if (ev.type === 'done' || ev.type === 'error') break;
        }
      } catch (err) {
        // Same shape as a pipeline-emitted error so the client can render it.
        enqueue(
          sse('error', {
            type: 'error',
            role: 'researcher',
            message: (err as Error).message,
          }),
        );
      } finally {
        try {
          controller.close();
        } catch {}
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
