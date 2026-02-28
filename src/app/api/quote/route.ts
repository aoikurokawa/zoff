import { NextRequest, NextResponse } from "next/server";
import { QuoteResult } from "@/types/quote";

async function fetchJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: string
): Promise<QuoteResult> {
  try {
    const url = new URL("https://api.jup.ag/swap/v1/quote");
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippageBps", slippageBps);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });
    if (!res.ok) {
      const text = await res.text();
      return {
        platform: "jupiter",
        inputAmount: amount,
        outputAmount: "0",
        priceImpactPct: "0",
        route: "",
        error: `HTTP ${res.status}: ${text}`,
      };
    }

    const data = await res.json();
    const routeLabels =
      data.routePlan?.map(
        (step: { swapInfo?: { label?: string } }) => step.swapInfo?.label ?? "unknown"
      ) ?? [];

    return {
      platform: "jupiter",
      inputAmount: data.inAmount ?? amount,
      outputAmount: data.outAmount ?? "0",
      priceImpactPct: data.priceImpactPct ?? "0",
      route: routeLabels.join(" → ") || "direct",
    };
  } catch (err) {
    return {
      platform: "jupiter",
      inputAmount: amount,
      outputAmount: "0",
      priceImpactPct: "0",
      route: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function fetchRaydiumQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: string
): Promise<QuoteResult> {
  try {
    const url = new URL(
      "https://transaction-v1.raydium.io/compute/swap-base-in"
    );
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippageBps", slippageBps);
    url.searchParams.set("txVersion", "V0");

    const res = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      const text = await res.text();
      return {
        platform: "raydium",
        inputAmount: amount,
        outputAmount: "0",
        priceImpactPct: "0",
        route: "",
        error: `HTTP ${res.status}: ${text}`,
      };
    }

    const data = await res.json();
    const routeLabels =
      data.data?.routePlan?.map(
        (step: { poolInfoList?: { poolType?: string }[] }) =>
          step.poolInfoList?.[0]?.poolType ?? "unknown"
      ) ?? [];

    return {
      platform: "raydium",
      inputAmount: data.data?.inputAmount ?? amount,
      outputAmount: data.data?.outputAmount ?? "0",
      priceImpactPct: data.data?.priceImpactPct?.toString() ?? "0",
      route: routeLabels.join(" → ") || "direct",
    };
  } catch (err) {
    return {
      platform: "raydium",
      inputAmount: amount,
      outputAmount: "0",
      priceImpactPct: "0",
      route: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function fetchDflowQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: string
): Promise<QuoteResult | null> {
  const apiKey = process.env.DFLOW_API_KEY;
  if (!apiKey) return null;

  try {
    const url = new URL("https://quote-api.dflow.net/quote");
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippageBps", slippageBps);

    const res = await fetch(url.toString(), {
      headers: { "x-api-key": apiKey },
      signal: AbortSignal.timeout(10000),
    });

    if (!res.ok) {
      const text = await res.text();
      return {
        platform: "dflow",
        inputAmount: amount,
        outputAmount: "0",
        priceImpactPct: "0",
        route: "",
        error: `HTTP ${res.status}: ${text}`,
      };
    }

    const data = await res.json();
    const routeLabels =
      data.routePlan?.map(
        (step: { venue?: string }) => step.venue ?? "unknown"
      ) ?? [];

    return {
      platform: "dflow",
      inputAmount: data.inAmount ?? amount,
      outputAmount: data.outAmount ?? "0",
      priceImpactPct: data.priceImpactPct ?? "0",
      route: routeLabels.join(" → ") || "direct",
    };
  } catch (err) {
    return {
      platform: "dflow",
      inputAmount: amount,
      outputAmount: "0",
      priceImpactPct: "0",
      route: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function fetchTitanQuote(
  inputMint: string,
  outputMint: string,
  amount: string,
  slippageBps: string
): Promise<QuoteResult | null> {
  const titanUrl = process.env.TITAN_API_URL;
  if (!titanUrl) return null;

  try {
    const url = new URL(titanUrl);
    url.searchParams.set("inputMint", inputMint);
    url.searchParams.set("outputMint", outputMint);
    url.searchParams.set("amount", amount);
    url.searchParams.set("slippageBps", slippageBps);

    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(10000) });

    if (!res.ok) {
      const text = await res.text();
      return {
        platform: "titan",
        inputAmount: amount,
        outputAmount: "0",
        priceImpactPct: "0",
        route: "",
        error: `HTTP ${res.status}: ${text}`,
      };
    }

    const data = await res.json();
    return {
      platform: "titan",
      inputAmount: data.inAmount ?? amount,
      outputAmount: data.outAmount ?? "0",
      priceImpactPct: data.priceImpactPct ?? "0",
      route: data.route ?? "direct",
    };
  } catch (err) {
    return {
      platform: "titan",
      inputAmount: amount,
      outputAmount: "0",
      priceImpactPct: "0",
      route: "",
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const inputMint = searchParams.get("inputMint");
  const outputMint = searchParams.get("outputMint");
  const amount = searchParams.get("amount");
  const slippageBps = searchParams.get("slippageBps") ?? "50";

  if (!inputMint || !outputMint || !amount) {
    return NextResponse.json(
      { error: "Missing required params: inputMint, outputMint, amount" },
      { status: 400 }
    );
  }

  const results = await Promise.all([
    fetchJupiterQuote(inputMint, outputMint, amount, slippageBps),
    fetchRaydiumQuote(inputMint, outputMint, amount, slippageBps),
    fetchDflowQuote(inputMint, outputMint, amount, slippageBps),
    fetchTitanQuote(inputMint, outputMint, amount, slippageBps),
  ]);

  const quotes = results.filter((r): r is QuoteResult => r !== null);

  quotes.sort((a, b) => {
    if (a.error && !b.error) return 1;
    if (!a.error && b.error) return -1;
    return BigInt(b.outputAmount) > BigInt(a.outputAmount) ? 1 : -1;
  });

  return NextResponse.json({ quotes });
}
