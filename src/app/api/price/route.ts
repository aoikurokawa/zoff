import { NextRequest, NextResponse } from "next/server";

const COINGECKO_ID = "jito-staked-sol";

export async function GET(request: NextRequest) {
  const days = request.nextUrl.searchParams.get("days") ?? "7";

  const url = new URL(
    `https://api.coingecko.com/api/v3/coins/${COINGECKO_ID}/market_chart`
  );
  url.searchParams.set("vs_currency", "usd");
  url.searchParams.set("days", days);

  try {
    const res = await fetch(url.toString(), {
      next: { revalidate: 60 },
    });

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `CoinGecko error: ${res.status} ${text}` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const prices: { time: number; value: number }[] = (
      data.prices as [number, number][]
    ).map(([ts, price]) => ({
      time: Math.floor(ts / 1000),
      value: price,
    }));

    if (prices.length === 0) {
      return NextResponse.json({ prices: [], currentPrice: 0, changePercent: 0 });
    }

    const currentPrice = prices[prices.length - 1].value;
    const firstPrice = prices[0].value;
    const changePercent =
      firstPrice > 0 ? ((currentPrice - firstPrice) / firstPrice) * 100 : 0;

    return NextResponse.json({ prices, currentPrice, changePercent });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
