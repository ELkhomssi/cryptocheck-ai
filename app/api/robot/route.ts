import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';
import { runEngine } from '@/lib/engine';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(req: NextRequest) {
  try {
    const { mint, action } = await req.json();

    if (action === 'analyze') {
      const result = await runEngine(mint);

      const prompt = `You are a Solana trading AI. Analyze this token and give a trading decision.

Token: ${result.token.name} (${result.token.symbol})
Risk Score: ${result.score}/100 (${result.level})
Liquidity: $${result.token.liquidityUSD.toLocaleString()}
Top 10 Holders: ${result.token.top10Pct.toFixed(1)}%
Mint Authority: ${result.token.mintAuthority ? 'ACTIVE ⚠️' : 'REVOKED ✅'}
Freeze Authority: ${result.token.freezeAuthority ? 'ACTIVE ⚠️' : 'DISABLED ✅'}
Flags: ${result.flags.map(f => f.title).join(', ') || 'None'}
Platform: ${result.token.platform}

Respond in JSON format only:
{
  "decision": "BUY" | "SELL" | "HOLD" | "AVOID",
  "confidence": 0-100,
  "reason": "brief reason in one sentence",
  "entry": "suggested entry strategy or null",
  "exit": "suggested exit strategy or null",
  "maxPosition": "max % of portfolio to risk (e.g. 1%)",
  "alerts": ["alert1", "alert2"]
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
      });

      const signal = JSON.parse(completion.choices[0].message.content ?? '{}');
      return NextResponse.json({ success: true, result, signal });
    }

    if (action === 'portfolio') {
      const { tokens } = await req.json();
      const analyses = await Promise.allSettled(
        tokens.map((m: string) => runEngine(m))
      );
      const results = analyses
        .filter((r): r is PromiseFulfilledResult<Awaited<ReturnType<typeof runEngine>>> => r.status === 'fulfilled')
        .map(r => r.value);

      const prompt = `Analyze this Solana portfolio and give recommendations:
${results.map(r => `- ${r.token.symbol}: Score ${r.score}, Level ${r.level}, TVL $${r.token.liquidityUSD}`).join('\n')}

Respond in JSON:
{
  "summary": "one sentence portfolio summary",
  "totalRisk": "LOW|MEDIUM|HIGH|CRITICAL",
  "recommendations": [{"token": "symbol", "action": "BUY|SELL|HOLD", "reason": "brief"}],
  "diversification": "score 0-100"
}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
        max_tokens: 500,
      });

      const analysis = JSON.parse(completion.choices[0].message.content ?? '{}');
      return NextResponse.json({ success: true, results, analysis });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Robot error';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
