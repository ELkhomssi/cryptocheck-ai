import { NextRequest, NextResponse } from 'next/server';
import { runEngine } from '@/lib/engine';

const cache = new Map<string, { data: unknown; ts: number }>();
const TTL = 30_000;

export async function GET(req: NextRequest) {
  const mint = req.nextUrl.searchParams.get('mint')?.trim();

  if (!mint) {
    return NextResponse.json(
      { success: false, error: { message: 'mint param required' } },
      { status: 400 }
    );
  }

  const cached = cache.get(mint);
  if (cached && Date.now() - cached.ts < TTL) {
    return NextResponse.json({ success: true, result: cached.data, cached: true });
  }

  try {
    const result = await runEngine(mint);
    cache.set(mint, { data: result, ts: Date.now() });
    if (cache.size > 200) {
      const firstKey = cache.keys().next().value;
      if (firstKey) cache.delete(firstKey);
    }
    return NextResponse.json({ success: true, result, cached: false });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json(
      { success: false, error: { message } },
      { status: 500 }
    );
  }
}