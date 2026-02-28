"use client";

import { useState } from "react";
import { QuoteResult, MINTS, DECIMALS } from "@/types/quote";

type Direction = "sol-to-jitosol" | "jitosol-to-sol";

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
    case "dflow":
      return "text-blue-400";
    case "titan":
      return "text-purple-400";
    default:
      return "text-gray-400";
  }
}

export default function Home() {
  const [amount, setAmount] = useState("1");
  const [direction, setDirection] = useState<Direction>("sol-to-jitosol");
  const [quotes, setQuotes] = useState<QuoteResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  const inputToken = direction === "sol-to-jitosol" ? "SOL" : "JitoSOL";
  const outputToken = direction === "sol-to-jitosol" ? "JitoSOL" : "SOL";

  async function handleFetchQuotes() {
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) return;

    const inputDecimals =
      direction === "sol-to-jitosol" ? DECIMALS.SOL : DECIMALS.JitoSOL;
    const rawAmount = BigInt(
      Math.round(parsedAmount * 10 ** inputDecimals)
    ).toString();

    const inputMint =
      direction === "sol-to-jitosol" ? MINTS.SOL : MINTS.JitoSOL;
    const outputMint =
      direction === "sol-to-jitosol" ? MINTS.JitoSOL : MINTS.SOL;

    setLoading(true);
    setFetched(false);
    try {
      const params = new URLSearchParams({
        inputMint,
        outputMint,
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
      setFetched(true);
    }
  }

  const validQuotes = quotes.filter((q) => !q.error);
  const bestOutput =
    validQuotes.length > 0
      ? validQuotes.reduce((best, q) =>
          BigInt(q.outputAmount) > BigInt(best.outputAmount) ? q : best
        )
      : null;

  const outputDecimals =
    direction === "sol-to-jitosol" ? DECIMALS.JitoSOL : DECIMALS.SOL;

  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold text-center mb-2">Zoff</h1>
      <p className="text-gray-400 text-center mb-10">
        Find the best route for trading JitoSOL
      </p>

      <div className="bg-gray-900 rounded-xl p-6 mb-8 border border-gray-800">
        <div className="flex items-center gap-4 mb-5">
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">Amount</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-lg focus:outline-none focus:border-gray-500"
              placeholder="1.0"
            />
          </div>
          <div className="flex-1">
            <label className="block text-sm text-gray-400 mb-1">
              Direction
            </label>
            <button
              onClick={() =>
                setDirection((d) =>
                  d === "sol-to-jitosol" ? "jitosol-to-sol" : "sol-to-jitosol"
                )
              }
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-lg hover:bg-gray-750 transition-colors cursor-pointer"
            >
              {inputToken} → {outputToken}
            </button>
          </div>
        </div>

        <button
          onClick={handleFetchQuotes}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:bg-gray-700 disabled:text-gray-500 rounded-lg py-3 font-medium text-lg transition-colors cursor-pointer"
        >
          {loading ? "Fetching quotes..." : "Find Best Route"}
        </button>
      </div>

      {fetched && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-gray-300 mb-4">Results</h2>

          {quotes.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No quotes available.
            </p>
          )}

          {quotes.map((q) => {
            const isBest = bestOutput?.platform === q.platform && !q.error;
            return (
              <div
                key={q.platform}
                className={`bg-gray-900 rounded-xl p-5 border ${
                  isBest
                    ? "border-indigo-500 ring-1 ring-indigo-500/30"
                    : "border-gray-800"
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`font-semibold capitalize ${platformColor(
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
                  </div>
                  {q.error && (
                    <span className="text-xs text-red-400">Error</span>
                  )}
                </div>

                {q.error ? (
                  <p className="text-sm text-red-400/80">{q.error}</p>
                ) : (
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">
                        You receive
                      </span>
                      <span className="text-lg font-mono">
                        {formatAmount(q.outputAmount, outputDecimals)}{" "}
                        {outputToken}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400 text-sm">
                        Price impact
                      </span>
                      <span className="text-sm text-gray-300">
                        {parseFloat(q.priceImpactPct).toFixed(4)}%
                      </span>
                    </div>
                    {q.route && (
                      <div className="flex justify-between">
                        <span className="text-gray-400 text-sm">Route</span>
                        <span className="text-sm text-gray-300">{q.route}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
