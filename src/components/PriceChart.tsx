"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  createChart,
  type IChartApi,
  AreaSeries,
  ColorType,
} from "lightweight-charts";

interface PricePoint {
  time: number;
  value: number;
}

interface PriceData {
  prices: PricePoint[];
  currentPrice: number;
  changePercent: number;
}

const TIME_RANGES = [
  { label: "1H", days: "0.04" },
  { label: "1D", days: "1" },
  { label: "1W", days: "7" },
  { label: "1M", days: "30" },
  { label: "1Y", days: "365" },
] as const;

export default function PriceChart() {
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const seriesRef = useRef<any>(null);

  const [activeRange, setActiveRange] = useState("7");
  const [data, setData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (days: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/price?days=${days}`);
      const json = await res.json();
      if (json.error) throw new Error(json.error);
      setData(json);
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(activeRange);
  }, [activeRange, fetchData]);

  useEffect(() => {
    if (!chartContainerRef.current) return;

    const chart = createChart(chartContainerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "transparent" },
        textColor: "#9ca3af",
        fontFamily: "system-ui, sans-serif",
      },
      grid: {
        vertLines: { visible: false },
        horzLines: { color: "#1f2937", style: 2 },
      },
      width: chartContainerRef.current.clientWidth,
      height: 300,
      rightPriceScale: {
        borderVisible: false,
      },
      timeScale: {
        borderVisible: false,
        timeVisible: true,
        secondsVisible: false,
      },
      crosshair: {
        horzLine: { color: "#4b5563", labelBackgroundColor: "#374151" },
        vertLine: { color: "#4b5563", labelBackgroundColor: "#374151" },
      },
    });

    const series = chart.addSeries(AreaSeries, {
      lineColor: "#ef4444",
      topColor: "rgba(239, 68, 68, 0.4)",
      bottomColor: "rgba(239, 68, 68, 0.02)",
      lineWidth: 2,
      crosshairMarkerBackgroundColor: "#ef4444",
      priceFormat: { type: "price", precision: 2, minMove: 0.01 },
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (chartContainerRef.current) {
        chart.applyOptions({ width: chartContainerRef.current.clientWidth });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !data?.prices.length) return;
    seriesRef.current.setData(
      data.prices.map((p) => ({ time: p.time as never, value: p.value }))
    );
    chartRef.current?.timeScale().fitContent();
  }, [data]);

  const isPositive = (data?.changePercent ?? 0) >= 0;

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 p-5 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm text-gray-400 mb-1">JitoSOL</p>
          {data && !loading ? (
            <>
              <p className="text-2xl font-bold">
                ${data.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p
                className={`text-sm ${isPositive ? "text-green-400" : "text-red-400"}`}
              >
                {isPositive ? "+" : ""}
                {data.changePercent.toFixed(2)}%
              </p>
            </>
          ) : (
            <p className="text-2xl font-bold text-gray-600">--</p>
          )}
        </div>

        <div className="flex gap-1">
          {TIME_RANGES.map((r) => (
            <button
              key={r.days}
              onClick={() => setActiveRange(r.days)}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                activeRange === r.days
                  ? "bg-gray-700 text-white"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div
        ref={chartContainerRef}
        className={`w-full ${loading ? "opacity-40" : ""} transition-opacity`}
      />
    </div>
  );
}
