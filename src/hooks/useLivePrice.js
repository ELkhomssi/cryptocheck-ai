import { useState, useEffect, useRef, useCallback } from "react";

const priceCache = new Map();
const STALE_TIME = 10_000;

function getCachedPrice(address) {
  const entry = priceCache.get(address);
  if (!entry) return null;
  return { ...entry, isStale: Date.now() - entry.ts > STALE_TIME };
}

function setCachedPrice(address, data) {
  priceCache.set(address, { ...data, ts: Date.now() });
}

async function pollDexScreener(address) {
  const res = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${address}`);
  const json = await res.json();
  const pairs = json?.pairs || [];
  const best = pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0))[0];
  if (!best) return null;
  return {
    price: parseFloat(best.priceUsd || 0),
    priceChange1h: best.priceChange?.h1 || 0,
    priceChange24h: best.priceChange?.h24 || 0,
    priceChange5m: best.priceChange?.m5 || 0,
    volume24h: best.volume?.h24 || 0,
    liquidity: best.liquidity?.usd || 0,
    txns24h: (best.txns?.h24?.buys || 0) + (best.txns?.h24?.sells || 0),
    buys24h: best.txns?.h24?.buys || 0,
    sells24h: best.txns?.h24?.sells || 0,
    marketCap: best.marketCap || 0,
    pairAddress: best.pairAddress,
    dex: best.dexId,
    chain: best.chainId,
    name: best.baseToken?.name,
    symbol: best.baseToken?.symbol,
  };
}

export function useLivePrice(address, {
  chain = "solana",
  birdeyeApiKey = null,
  pollInterval = 15_000,
  enabled = true,
} = {}) {
  const [data, setData] = useState(() => getCachedPrice(address) || {});
  const [isLoading, setIsLoading] = useState(!getCachedPrice(address));
  const [isLive] = useState(false);
  const [error, setError] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);
  const pollRef = useRef(null);
  const mountedRef = useRef(true);

  const updateData = useCallback((newData) => {
    if (!mountedRef.current) return;
    setData(newData);
    setLastUpdated(Date.now());
    setCachedPrice(address, newData);
    setPriceHistory(prev => [...prev.slice(-59), { price: newData.price, time: Date.now() }]);
    setIsLoading(false);
    setError(null);
  }, [address]);

  useEffect(() => {
    if (!enabled || !address) return;
    mountedRef.current = true;
    const cached = getCachedPrice(address);
    if (cached) { setData(cached); setIsLoading(false); }

    const poll = async () => {
      try {
        const result = await pollDexScreener(address);
        if (result) updateData(result);
      } catch {
        if (mountedRef.current) setError("Failed to fetch price");
      }
    };
    poll();
    pollRef.current = setInterval(poll, pollInterval);
    return () => { mountedRef.current = false; clearInterval(pollRef.current); };
  }, [address, enabled, pollInterval, updateData]);

  return { ...data, isLive, isLoading, error, priceHistory, lastUpdated };
}
