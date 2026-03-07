import { create } from 'zustand';

interface Token {
  address: string;
  name?: string;
  symbol?: string;
  price?: number;
  score?: number;
  level?: string;
}

interface TokenStore {
  mint: string;
  token: Token | null;
  scanResult: any;
  scanSignal: any;
  scanLoading: boolean;
  wsConnected: boolean;
  setMint: (mint: string, token?: Token) => void;
  setScanResult: (result: any, signal: any) => void;
  setScanLoading: (v: boolean) => void;
  setWsConnected: (v: boolean) => void;
  clearScan: () => void;
}

export const useTokenStore = create<TokenStore>((set) => ({
  mint: '',
  token: null,
  scanResult: null,
  scanSignal: null,
  scanLoading: false,
  wsConnected: true,
  setMint: (mint, token = null) => set({ mint, token, scanResult: null, scanSignal: null }),
  setScanResult: (scanResult, scanSignal) => set({ scanResult, scanSignal, scanLoading: false }),
  setScanLoading: (scanLoading) => set({ scanLoading }),
  setWsConnected: (wsConnected) => set({ wsConnected }),
  clearScan: () => set({ scanResult: null, scanSignal: null }),
}));
