export interface QuoteResult {
  platform: "jupiter" | "raydium" | "dflow" | "titan";
  inputAmount: string;
  outputAmount: string;
  priceImpactPct: string;
  route: string;
  error?: string;
}

export const MINTS = {
  SOL: "So11111111111111111111111111111111111111112",
  JitoSOL: "J1toso1uCk3RLmjorhTtrVwY9HJ7X8V9yYac6Y7kGCPn",
} as const;

export const DECIMALS = {
  SOL: 9,
  JitoSOL: 9,
} as const;
