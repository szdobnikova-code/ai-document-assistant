import { usageTracker } from '@/lib/usage/tracker';

export async function GET() {
  return Response.json(usageTracker.getSummary(), {
    headers: { 'Cache-Control': 'no-store' },
  });
}
