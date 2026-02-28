"use client";

import { useEffect, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import { QuoteResult, MINTS, DECIMALS } from "@/types/quote";

const PriceChart = dynamic(() => import("@/components/PriceChart"), {
  ssr: false,
});

const DEFAULT_AMOUNT = "1";
const REFRESH_INTERVAL = 15000;

function formatAmount(raw: string, decimals: number): string {
  if (!raw || raw === "0") return "0";
  const str = raw.padStart(decimals + 1, "0");
  const intPart = str.slice(0, str.length - decimals) || "0";
  const fracPart = str.slice(str.length - decimals).replace(/0+$/, "");
  return fracPart ? `${intPart}.${fracPart}` : intPart;
}

function platformColor(platform: string): string {
  switch (platform) {
    case "jupiter":
      return "text-green-400";
    case "raydium":
      return "text-cyan-400";
    case "dflow":
      return "text-blue-400";
    case "titan":
      return "text-purple-400";
    default:
      return "text-gray-400";
  }
}

export default function Home() {
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = useCallback(async () => {
    const rawAmount = BigInt(
      Math.round(parseFloat(DEFAULT_AMOUNT) * 10 ** DECIMALS.SOL)
    ).toString();

    try {
      const params = new URLSearchParams({
        inputMint: MINTS.SOL,
        outputMint: MINTS.JitoSOL,
        amount: rawAmount,
        slippageBps: "50",
      });
      const res = await fetch(`/api/quote?${params}`);
      const data = await res.json();
      setQuotes(data.quotes ?? []);
    } catch {
      setQuotes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuotes();
    const interval = setInterval(fetchQuotes, REFRESH_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchQuotes]);

  const validQuotes = quotes.filter((q) => !q.error);
  const bestOutput =
    validQuotes.length > 0
      ? validQuotes.reduce((best, q) =>
          BigInt(q.outputAmount) > BigInt(best.outputAmount) ? q : best
        )
      : null;

  return (
    <main className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Zoff</h1>
      <p className="text-gray-400 text-center mb-10">
        JitoSOL prices across DEXs
      </p>

      <PriceChart />

      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-300">
          1 SOL → JitoSOL
        </h2>
        <span className="text-xs text-gray-500">
          {loading ? "Refreshing..." : "Auto-refreshes every 15s"}
        </span>
      </div>

      <div className="grid gap-3">
        {loading && quotes.length === 0 ? (
          <div className="text-gray-500 text-center py-12">
            Loading prices...
          </div>
        ) : quotes.length === 0 ? (
          <div className="text-gray-500 text-center py-12">
            No quotes available.
          </div>
        ) : (
          quotes.map((q) => {
            const isBest = bestOutput?.platform === q.platform && !q.error;
            return (
              <div
                key={q.platform}
                className={`bg-gray-900 rounded-xl p-5 border flex items-center justify-between ${
                  isBest
                    ? "border-indigo-500 ring-1 ring-indigo-500/30"
                    : "border-gray-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`font-semibold capitalize text-lg ${platformColor(
                      q.platform
                    )}`}
                  >
                    {q.platform}
                  </span>
                  {isBest && (
                    <span className="text-xs bg-indigo-600/30 text-indigo-300 px-2 py-0.5 rounded-full">
                      Best
                    </span>
                  )}
                  {q.error && (
                    <span className="text-xs text-red-400">Unavailable</span>
                  )}
                </div>

                {q.error ? (
                  <span className="text-sm text-gray-600">--</span>
                ) : (
                  <div className="text-right">
                    <p className="text-lg font-mono">
                      {formatAmount(q.outputAmount, DECIMALS.JitoSOL)} JitoSOL
                    </p>
                    <div className="flex items-center gap-3 justify-end text-sm text-gray-400">
                      {q.route && <span>{q.route}</span>}
                      <span>
                        Impact: {parseFloat(q.priceImpactPct).toFixed(4)}%
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </main>
  );
}
