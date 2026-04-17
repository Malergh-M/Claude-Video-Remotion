#!/usr/bin/env node
/**
 * Fetches NVDA stock data from Yahoo Finance, writes props JSON,
 * then renders a Remotion still to out/nvidia-stock-latest.jpg.
 * Run directly: node scripts/nvidia-stock-routine.mjs
 */

import { execSync } from "child_process";
import { mkdirSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const OUT_DIR = resolve(ROOT, "out");
const PROPS_FILE = resolve(OUT_DIR, "nvidia-stock-data.json");
const IMAGE_OUT = resolve(OUT_DIR, "nvidia-stock-latest.jpg");
const SYMBOL = "NVDA";

async function fetchStock() {
  const url =
    `https://query1.finance.yahoo.com/v8/finance/chart/${SYMBOL}` +
    `?interval=5m&range=1d&includePrePost=false`;

  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });

  if (!res.ok) throw new Error(`Yahoo Finance HTTP ${res.status}`);

  const json = await res.json();
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error("Unexpected Yahoo Finance response shape");

  const { timestamp, indicators, meta } = result;
  const closes = indicators.quote[0].close;

  const priceHistory = timestamp
    .map((ts, i) => {
      const price = closes[i];
      if (price == null) return null;
      const d = new Date(ts * 1000);
      const time = d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      });
      return { time, price: Math.round(price * 100) / 100 };
    })
    .filter(Boolean);

  if (priceHistory.length === 0) throw new Error("No price data returned");

  const currentPrice =
    meta.regularMarketPrice ?? priceHistory[priceHistory.length - 1].price;
  const previousClose = meta.previousClose ?? meta.chartPreviousClose ?? currentPrice;

  const fetchedAt = new Date().toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

  return {
    symbol: SYMBOL,
    currentPrice: Math.round(currentPrice * 100) / 100,
    previousClose: Math.round(previousClose * 100) / 100,
    priceHistory,
    fetchedAt,
  };
}

function renderStill(propsFile, outputFile) {
  const cmd = [
    "npx remotion still",
    "NvidiaStockChart",
    `"${outputFile}"`,
    "--frame=90",
    `--props="${propsFile}"`,
    "--log=error",
  ].join(" ");

  execSync(cmd, { cwd: ROOT, stdio: "inherit" });
}

function printSummary(data) {
  const change = data.currentPrice - data.previousClose;
  const pct = ((change / data.previousClose) * 100).toFixed(2);
  const arrow = change >= 0 ? "▲" : "▼";
  const sign = change >= 0 ? "+" : "";
  console.log(
    `  ${data.symbol}  $${data.currentPrice.toFixed(2)}  ` +
    `${arrow} ${sign}${change.toFixed(2)} (${sign}${pct}%)  ` +
    `[${data.fetchedAt}]`
  );
}

async function run() {
  mkdirSync(OUT_DIR, { recursive: true });

  console.log(`[${new Date().toLocaleTimeString()}] Fetching ${SYMBOL} data…`);
  const data = await fetchStock();
  printSummary(data);

  writeFileSync(PROPS_FILE, JSON.stringify(data, null, 2));

  console.log("  Rendering chart…");
  renderStill(PROPS_FILE, IMAGE_OUT);

  console.log(`  ✓ Chart saved → ${IMAGE_OUT}`);

  // Open image on desktop if available (silent fail)
  try {
    execSync(`xdg-open "${IMAGE_OUT}" 2>/dev/null || open "${IMAGE_OUT}" 2>/dev/null`, {
      stdio: "ignore",
    });
  } catch {}
}

run().catch((err) => {
  console.error(`[ERROR] ${err.message}`);
  process.exit(1);
});
