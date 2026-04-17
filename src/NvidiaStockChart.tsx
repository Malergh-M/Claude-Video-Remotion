import React from "react";
import {
  AbsoluteFill,
  interpolate,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { z } from "zod";

const pricePointSchema = z.object({
  time: z.string(),
  price: z.number(),
});

export const nvidiaStockSchema = z.object({
  currentPrice: z.number(),
  previousClose: z.number(),
  priceHistory: z.array(pricePointSchema),
  fetchedAt: z.string(),
  symbol: z.string().default("NVDA"),
});

export type NvidiaStockProps = z.infer<typeof nvidiaStockSchema>;

const NVIDIA_GREEN = "#76b900";
const CHART = { x: 120, y: 210, w: 1040, h: 350 };
const GRID_LINES = 5;

function buildPath(pts: Array<{ x: number; y: number }>): string {
  return pts
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(" ");
}

export const NVIDIA_DEFAULT_PROPS: NvidiaStockProps = {
  symbol: "NVDA",
  currentPrice: 135.42,
  previousClose: 132.8,
  fetchedAt: "14:30",
  priceHistory: [
    { time: "09:30", price: 132.5 },
    { time: "09:35", price: 133.1 },
    { time: "09:40", price: 133.8 },
    { time: "09:45", price: 134.2 },
    { time: "09:50", price: 133.9 },
    { time: "10:00", price: 134.5 },
    { time: "10:10", price: 134.9 },
    { time: "10:20", price: 135.0 },
    { time: "10:30", price: 134.6 },
    { time: "10:40", price: 135.1 },
    { time: "10:50", price: 135.4 },
    { time: "11:00", price: 135.42 },
  ],
};

export const NvidiaStockChart: React.FC<NvidiaStockProps> = ({
  currentPrice,
  previousClose,
  priceHistory,
  fetchedAt,
  symbol,
}) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const change = currentPrice - previousClose;
  const changePct = (change / previousClose) * 100;
  const isPos = change >= 0;
  const accentColor = isPos ? NVIDIA_GREEN : "#ff4444";

  const prices = priceHistory.map((p) => p.price);
  const minP = Math.min(...prices) * 0.9985;
  const maxP = Math.max(...prices) * 1.0015;
  const priceRange = maxP - minP || 1;

  const toPoint = (p: { price: number }, i: number) => ({
    x: CHART.x + (i / Math.max(priceHistory.length - 1, 1)) * CHART.w,
    y: CHART.y + CHART.h - ((p.price - minP) / priceRange) * CHART.h,
  });

  const points = priceHistory.map(toPoint);
  const linePath = buildPath(points);

  const revealProgress = interpolate(frame, [0, fps * 2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const prevCloseY =
    CHART.y + CHART.h - ((previousClose - minP) / priceRange) * CHART.h;

  const labelIndices = (() => {
    const count = Math.min(7, priceHistory.length);
    const step = Math.floor((priceHistory.length - 1) / Math.max(count - 1, 1));
    return Array.from({ length: count }, (_, i) =>
      Math.min(i * step, priceHistory.length - 1)
    );
  })();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: "#0a0a0f",
        fontFamily: "system-ui, -apple-system, sans-serif",
      }}
    >
      {/* NVIDIA green top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 5,
          background: NVIDIA_GREEN,
        }}
      />

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: 32,
          left: 120,
          right: 120,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <div>
          <div
            style={{
              color: NVIDIA_GREEN,
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 4,
              textTransform: "uppercase",
            }}
          >
            NVIDIA Corporation
          </div>
          <div
            style={{
              color: "#ffffff",
              fontSize: 78,
              fontWeight: 800,
              letterSpacing: -3,
              lineHeight: 1,
              marginTop: 4,
            }}
          >
            {symbol}
          </div>
          <div style={{ color: "#444", fontSize: 20, marginTop: 6 }}>
            NASDAQ · Real-time
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div
            style={{
              color: "#ffffff",
              fontSize: 80,
              fontWeight: 800,
              letterSpacing: -2,
              lineHeight: 1,
            }}
          >
            ${currentPrice.toFixed(2)}
          </div>
          <div
            style={{
              color: accentColor,
              fontSize: 30,
              fontWeight: 600,
              marginTop: 8,
            }}
          >
            {isPos ? "▲" : "▼"} {Math.abs(change).toFixed(2)} (
            {isPos ? "+" : ""}
            {changePct.toFixed(2)}%)
          </div>
          <div style={{ color: "#444", fontSize: 18, marginTop: 6 }}>
            Prev close: ${previousClose.toFixed(2)}
          </div>
        </div>
      </div>

      {/* SVG chart */}
      <svg
        style={{ position: "absolute", top: 0, left: 0 }}
        width={width}
        height={height}
      >
        <defs>
          <clipPath id="lineReveal">
            <rect
              x={CHART.x - 5}
              y={CHART.y - 10}
              width={(CHART.w + 10) * revealProgress}
              height={CHART.h + 20}
            />
          </clipPath>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={accentColor} stopOpacity="0.28" />
            <stop offset="100%" stopColor={accentColor} stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines + Y labels */}
        {Array.from({ length: GRID_LINES }).map((_, i) => {
          const gy = CHART.y + (i / (GRID_LINES - 1)) * CHART.h;
          const priceLabel = maxP - (i / (GRID_LINES - 1)) * priceRange;
          return (
            <g key={i}>
              <line
                x1={CHART.x}
                y1={gy}
                x2={CHART.x + CHART.w}
                y2={gy}
                stroke="#181828"
                strokeWidth={1}
              />
              <text
                x={CHART.x - 12}
                y={gy + 6}
                fill="#444"
                fontSize={18}
                textAnchor="end"
              >
                ${priceLabel.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Previous close dashed reference line */}
        {prevCloseY >= CHART.y && prevCloseY <= CHART.y + CHART.h && (
          <>
            <line
              x1={CHART.x}
              y1={prevCloseY}
              x2={CHART.x + CHART.w}
              y2={prevCloseY}
              stroke="#444"
              strokeWidth={1}
              strokeDasharray="6 5"
            />
            <text
              x={CHART.x + CHART.w + 8}
              y={prevCloseY + 5}
              fill="#555"
              fontSize={15}
            >
              Prev
            </text>
          </>
        )}

        {/* Area fill */}
        {points.length >= 2 && (
          <polygon
            points={[
              ...points.map((p) => `${p.x},${p.y}`),
              `${points[points.length - 1].x},${CHART.y + CHART.h}`,
              `${points[0].x},${CHART.y + CHART.h}`,
            ].join(" ")}
            fill="url(#areaGrad)"
            clipPath="url(#lineReveal)"
          />
        )}

        {/* Price line */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={accentColor}
            strokeWidth={3}
            strokeLinejoin="round"
            strokeLinecap="round"
            clipPath="url(#lineReveal)"
          />
        )}

        {/* Live dot */}
        {points.length > 0 && (
          <circle
            cx={points[points.length - 1].x}
            cy={points[points.length - 1].y}
            r={7}
            fill={accentColor}
            opacity={revealProgress}
          />
        )}

        {/* X-axis time labels */}
        {labelIndices.map((idx) => {
          const xPos =
            CHART.x + (idx / Math.max(priceHistory.length - 1, 1)) * CHART.w;
          return (
            <text
              key={idx}
              x={xPos}
              y={CHART.y + CHART.h + 34}
              fill="#444"
              fontSize={17}
              textAnchor="middle"
            >
              {priceHistory[idx].time}
            </text>
          );
        })}

        {/* Axis borders */}
        <line
          x1={CHART.x}
          y1={CHART.y}
          x2={CHART.x}
          y2={CHART.y + CHART.h}
          stroke="#2a2a3e"
          strokeWidth={1}
        />
        <line
          x1={CHART.x}
          y1={CHART.y + CHART.h}
          x2={CHART.x + CHART.w}
          y2={CHART.y + CHART.h}
          stroke="#2a2a3e"
          strokeWidth={1}
        />
      </svg>

      {/* Footer */}
      <div
        style={{
          position: "absolute",
          bottom: 28,
          left: 120,
          right: 120,
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div style={{ color: "#2a2a3e", fontSize: 17 }}>
          Source: Yahoo Finance
        </div>
        <div style={{ color: "#333", fontSize: 17 }}>
          Updated: {fetchedAt}
        </div>
      </div>
    </AbsoluteFill>
  );
};
