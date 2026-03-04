export type RiskLevel = 'SAFE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type RiskCategory = 'AUTHORITY' | 'DISTRIBUTION' | 'LIQUIDITY' | 'METADATA' | 'PATTERN';
export interface TokenData {
  mint: string; name: string; symbol: string; decimals: number; supply: number;
  mintAuthority: string | null; freezeAuthority: string | null;
  top10Pct: number; top1Pct: number; holderCount: number;
  liquidityUSD: number; platform: 'raydium'|'pump.fun'|'orca'|'unknown'|'none';
  liquidityLocked: boolean; fetchMs: number;
}
export interface RiskFlag {
  id: string; category: RiskCategory; level: RiskLevel;
  title: string; detail: string; penalty: number; evidence?: string;
}
export interface CategoryScore {
  category: RiskCategory; label: string; score: number; weight: number;
}
export interface EngineResult {
  token: TokenData; score: number; level: RiskLevel;
  verdict: string; recommendation: string;
  flags: RiskFlag[]; categories: CategoryScore[];
  narrativeLines: string[]; analyzedAt: number;
}
async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const RPC = process.env.HELIUS_RPC_URL || process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.mainnet-beta.solana.com';
  const res = await fetch(RPC, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }) });
  const { result, error } = await res.json();
  if (error) throw new Error(error.message);
  return result as T;
}
async function fetchMintInfo(mint: string) {
  const result = await rpc<{ value: { data: { parsed: { info: { decimals: number; supply: string; mintAuthority: string | null; freezeAuthority: string | null } } } } }>('getAccountInfo', [mint, { encoding: 'jsonParsed' }]);
  const info = result?.value?.data?.parsed?.info;
  if (!info) throw new Error('Token not found');
  return info;
}
async function fetchMetadata(mint: string) {
  try {
    const KEY = process.env.HELIUS_API_KEY || process.env.NEXT_PUBLIC_HELIUS_API_KEY || '';
    const res = await fetch(`https://mainnet.helius-rpc.com/?api-key=${KEY}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'getAsset', params: { id: mint } }) });
    const { result } = await res.json();
    return { name: result?.content?.metadata?.name ?? 'Unknown Token', symbol: result?.content?.metadata?.symbol ?? '???' };
  } catch { return { name: 'Unknown Token', symbol: '???' }; }
}
async function fetchTopHolders(mint: string, supply: number) {
  try {
    const DEX = new Set(['675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8','JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4']);
    const result = await rpc<{ value: Array<{ address: string; uiAmount: number }> }>('getTokenLargestAccounts', [mint]);
    const real = (result?.value ?? []).filter(a => !DEX.has(a.address));
    const top10Pct = real.slice(0, 10).reduce((s, h) => s + (supply > 0 ? (h.uiAmount / supply) * 100 : 0), 0);
    return { top10Pct, top1Pct: real[0] ? (real[0].uiAmount / supply) * 100 : 0, holderCount: result?.value?.length ?? 0 };
  } catch { return { top10Pct: 50, top1Pct: 20, holderCount: 0 }; }
}
async function fetchLiquidity(mint: string) {
  try {
    const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${mint}`);
    const { pairs = [] } = await res.json();
    if (!pairs.length) return { liquidityUSD: 0, platform: 'none' as const, liquidityLocked: false };
    const sorted = [...pairs].sort((a, b) => (b.liquidity?.usd ?? 0) - (a.liquidity?.usd ?? 0));
    const dexId = sorted[0].dexId?.toLowerCase() ?? '';
    return { liquidityUSD: sorted.reduce((s, p) => s + (p.liquidity?.usd ?? 0), 0), platform: (dexId.includes('raydium') ? 'raydium' : dexId.includes('pump') ? 'pump.fun' : 'unknown') as TokenData['platform'], liquidityLocked: false };
  } catch { return { liquidityUSD: 0, platform: 'none' as const, liquidityLocked: false }; }
}
export async function fetchTokenData(mint: string): Promise<TokenData> {
  const t0 = Date.now();
  if (!/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(mint)) throw new Error('Invalid mint address');
  const [mintR, metaR] = await Promise.allSettled([fetchMintInfo(mint), fetchMetadata(mint)]);
  if (mintR.status === 'rejected') throw new Error('Token not found');
  const mintInfo = mintR.value;
  const meta = metaR.status === 'fulfilled' ? metaR.value : { name: 'Unknown', symbol: '???' };
  const supply = Number(mintInfo.supply) / Math.pow(10, mintInfo.decimals);
  const [holdersR, liqR] = await Promise.allSettled([fetchTopHolders(mint, supply), fetchLiquidity(mint)]);
  const holders = holdersR.status === 'fulfilled' ? holdersR.value : { top10Pct: 50, top1Pct: 20, holderCount: 0 };
  const liq = liqR.status === 'fulfilled' ? liqR.value : { liquidityUSD: 0, platform: 'none' as const, liquidityLocked: false };
  return { mint, name: meta.name, symbol: meta.symbol, decimals: mintInfo.decimals, supply, mintAuthority: mintInfo.mintAuthority, freezeAuthority: mintInfo.freezeAuthority, top10Pct: holders.top10Pct, top1Pct: holders.top1Pct, holderCount: holders.holderCount, liquidityUSD: liq.liquidityUSD, platform: liq.platform, liquidityLocked: liq.liquidityLocked, fetchMs: Date.now() - t0 };
}
export function analyzeRisk(token: TokenData): EngineResult {
  const flags: RiskFlag[] = [];
  if (token.mintAuthority) flags.push({ id: 'MINT', category: 'AUTHORITY', level: 'CRITICAL', title: 'Mint Authority Active', penalty: 45, detail: 'Dev can mint unlimited tokens.', evidence: token.mintAuthority.slice(0,12)+'...' });
  if (token.freezeAuthority) flags.push({ id: 'FREEZE', category: 'AUTHORITY', level: 'CRITICAL', title: 'Freeze Authority Enabled', penalty: 40, detail: 'Dev can freeze wallets.' });
  if (token.top10Pct > 80) flags.push({ id: 'CONC_X', category: 'DISTRIBUTION', level: 'CRITICAL', title: 'Extreme Concentration', penalty: 35, detail: `Top 10: ${token.top10Pct.toFixed(1)}%`, evidence: `${token.top10Pct.toFixed(1)}%` });
  else if (token.top10Pct > 60) flags.push({ id: 'CONC_H', category: 'DISTRIBUTION', level: 'HIGH', title: 'High Concentration', penalty: 20, detail: `Top 10: ${token.top10Pct.toFixed(1)}%` });
  if (token.liquidityUSD === 0) flags.push({ id: 'NO_LIQ', category: 'LIQUIDITY', level: 'CRITICAL', title: 'No Liquidity', penalty: 50, detail: 'No DEX pool found.' });
  else if (token.liquidityUSD < 5000) flags.push({ id: 'LOW_LIQ', category: 'LIQUIDITY', level: 'HIGH', title: 'Low Liquidity', penalty: 25, detail: `$${token.liquidityUSD.toLocaleString()} TVL` });
  if (!token.liquidityLocked && token.liquidityUSD > 0) flags.push({ id: 'UNLOCKED', category: 'LIQUIDITY', level: 'HIGH', title: 'Liquidity Not Locked', penalty: 20, detail: 'LP removable anytime.' });
  const cats: RiskCategory[] = ['AUTHORITY','DISTRIBUTION','LIQUIDITY','METADATA','PATTERN'];
  const W: Record<RiskCategory,number> = { AUTHORITY:0.30, DISTRIBUTION:0.25, LIQUIDITY:0.25, METADATA:0.10, PATTERN:0.10 };
  const categories: CategoryScore[] = [
    { category:'AUTHORITY', label:'Authority Control', score:0, weight:0.30 },
    { category:'DISTRIBUTION', label:'Holder Distribution', score:0, weight:0.25 },
    { category:'LIQUIDITY', label:'Liquidity Depth', score:0, weight:0.25 },
    { category:'METADATA', label:'Token Integrity', score:0, weight:0.10 },
    { category:'PATTERN', label:'Risk Patterns', score:0, weight:0.10 },
  ].map(c => ({ ...c, score: Math.max(0, 100 - flags.filter(f => f.category === c.category).reduce((s,f) => s+f.penalty, 0)) }));
  const score = Math.round(categories.reduce((s,c) => s + c.score * W[c.category], 0));
  const level: RiskLevel = score>=80?'SAFE':score>=60?'LOW':score>=40?'MEDIUM':score>=20?'HIGH':'CRITICAL';
  const verdicts: Record<RiskLevel,string> = { SAFE:'Clean Profile', LOW:'Proceed with Caution', MEDIUM:'High Risk', HIGH:'Dangerous', CRITICAL:'Likely Scam' };
  const crit = flags.filter(f => f.level === 'CRITICAL');
  const recommendation = crit.length > 0 ? `ABORT. ${crit.map(f=>f.title).join(' + ')}` : score < 60 ? 'Avoid.' : score < 80 ? 'Caution. 1-2% max.' : 'Safe. Standard DD.';
  const narrativeLines = [
    `> NEURAL ANALYSIS — ${token.symbol} [${token.mint.slice(0,8)}...]`,
    `> ${new Date().toISOString()}`, '',
    '> TOKEN', `  NAME    : ${token.name}`, `  SYMBOL  : ${token.symbol}`, `  PLATFORM: ${token.platform.toUpperCase()}`, `  TVL     : $${token.liquidityUSD.toLocaleString()}`, '',
    '> AUTHORITY', `  MINT  : ${token.mintAuthority ? '⚠ ACTIVE' : '✓ REVOKED'}`, `  FREEZE: ${token.freezeAuthority ? '⚠ ACTIVE' : '✓ DISABLED'}`, '',
    '> DISTRIBUTION', `  TOP 10: ${token.top10Pct.toFixed(2)}%`, '',
    `> FLAGS: ${flags.length}`, ...flags.map(f => `  [${f.level}] ${f.title}`), '',
    `> SCORE: ${score}/100 — ${level}`, '',
    level==='CRITICAL'?'  ██████ DO NOT TRADE ██████':level==='HIGH'?'  ▓▓▓░░░ HIGH RISK':level==='MEDIUM'?'  ▓▓▓▓░░ CAUTION':'  ▓▓▓▓▓▓ CLEAN', '',
    '> ANALYSIS COMPLETE — cryptocheck.ai',
  ];
  return { token, score, level, verdict: verdicts[level], recommendation, flags, categories, narrativeLines, analyzedAt: Date.now() };
}
export async function runEngine(mint: string): Promise<EngineResult> {
  return analyzeRisk(await fetchTokenData(mint));
}