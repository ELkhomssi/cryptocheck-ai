// store/tokenStore.ts
// Global shared state — works across all pages/components
// Install: npm install zustand

import { create } from 'zustand';

interface TokenState {
  // Active token being scanned
  activeMint: string;
  activeToken: {
    name: string;
    symbol: string;
    price?: number;
    score?: number;
    level?: string;
  } | null;

  // Scan results
  scanResult: any | null;
  scanSignal: any | null;
  scanLoading: boolean;
  scanError: string;

  // Search
  globalSearch: string;

  // Actions
  setActiveMint: (mint: string, token?: any) => void;
  setScanResult: (result: any, signal: any) => void;
  setScanLoading: (loading: boolean) => void;
  setScanError: (error: string) => void;
  setGlobalSearch: (q: string) => void;
  clearScan: () => void;
}

export const useTokenStore = create<TokenState>((set) => ({
  activeMint: '',
  activeToken: null,
  scanResult: null,
  scanSignal: null,
  scanLoading: false,
  scanError: '',
  globalSearch: '',

  setActiveMint: (mint, token = null) => set({
    activeMint: mint,
    activeToken: token,
    scanResult: null,
    scanSignal: null,
    scanError: '',
  }),

  setScanResult: (result, signal) => set({
    scanResult: result,
    scanSignal: signal,
    scanLoading: false,
    scanError: '',
    activeToken: result?.token ? {
      name: result.token.name,
      symbol: result.token.symbol,
      score: result.score,
      level: result.level,
    } : null,
  }),

  setScanLoading: (loading) => set({ scanLoading: loading }),
  setScanError: (error) => set({ scanError: error, scanLoading: false }),
  setGlobalSearch: (q) => set({ globalSearch: q }),
  clearScan: () => set({ scanResult: null, scanSignal: null, scanError: '', scanLoading: false }),
}));
