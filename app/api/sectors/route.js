// app/api/sectors/route.js
// Compares user holdings against top-10 market-cap peers in each sector.
// Flags holdings whose Sharpe ratio falls below their sector average.

import { NextResponse } from "next/server";

// ─── Top 10 by market cap per sector (curated) ───
const SECTOR_TICKERS = {
  Technology: [
    "AAPL", "MSFT", "NVDA", "AVGO", "ORCL",
    "CRM", "AMD", "ADBE", "CSCO", "ACN",
  ],
  "Financial Services": [
    "BRK-B", "JPM", "V", "MA", "BAC",
    "WFC", "GS", "MS", "AXP", "SPGI",
  ],
  Healthcare: [
    "LLY", "UNH", "JNJ", "ABBV", "MRK",
    "TMO", "ABT", "DHR", "PFE", "AMGN",
  ],
  "Consumer Cyclical": [
    "AMZN", "TSLA", "HD", "MCD", "NKE",
    "LOW", "SBUX", "TJX", "BKNG", "CMG",
  ],
  "Consumer Defensive": [
    "WMT", "PG", "COST", "KO", "PEP",
    "PM", "MDLZ", "CL", "MO", "KHC",
  ],
  Industrials: [
    "GE", "CAT", "UNP", "RTX", "HON",
    "DE", "BA", "LMT", "UPS", "ADP",
  ],
  Energy: [
    "XOM", "CVX", "COP", "SLB", "EOG",
    "MPC", "PSX", "VLO", "OXY", "DVN",
  ],
  Utilities: [
    "NEE", "SO", "DUK", "CEG", "SRE",
    "D", "AEP", "EXC", "XEL", "ED",
  ],
  "Real Estate": [
    "PLD", "AMT", "EQIX", "CCI", "PSA",
    "SPG", "O", "VICI", "WELL", "DLR",
  ],
  "Communication Services": [
    "META", "GOOGL", "NFLX", "DIS", "CMCSA",
    "T", "VZ", "TMUS", "CHTR", "EA",
  ],
  "Basic Materials": [
    "LIN", "APD", "SHW", "ECL", "FCX",
    "NEM", "NUE", "VMC", "MLM", "DOW",
  ],
};

// Reverse lookup: ticker → sector
const TICKER_TO_SECTOR = {};
for (const [sector, tickers] of Object.entries(SECTOR_TICKERS)) {
  for (const t of tickers) TICKER_TO_SECTOR[t] = sector;
}

// Common ETFs — no meaningful single-sector comparison for Sharpe
const COMMON_ETFS = new Set([
  "SPY", "QQQ", "VTI", "VOO", "IVV", "BND", "AGG", "GLD", "SLV",
  "TLT", "IWM", "EEM", "VEA", "VWO", "SCHD", "VIG", "VYM", "DIA",
  "RSP", "ARKK", "ARKG", "XLF", "XLK", "XLE", "XLV", "XLI", "XLP",
  "XLY", "XLB", "XLU", "XLRE", "VNQ", "VXUS", "IEMG", "HYG", "LQD",
  "VCIT", "VCSH", "BSV", "BIV", "EMB", "GOVT", "SHY", "IEF", "TIPS",
]);

// ─── ETF SECTOR BREAKDOWNS ───────────────────────────────────────────
// HOW TO UPDATE (every 6 months or so):
//   1. Go to the ETF provider's website (links below each ETF)
//   2. Find the "Sector Breakdown" or "Sector Allocation" section
//   3. Update the percentages below (they should add up to ~1.0)
//
// Percentages are in decimal form: 0.30 = 30%
// Last updated: March 2026
// ─────────────────────────────────────────────────────────────────────
const ETF_SECTOR_BREAKDOWNS = {
  // ── S&P 500 ETFs ──
  // Source: https://www.ssga.com/us/en/intermediary/etfs/funds/spdr-sp-500-etf-trust-spy
  SPY: {
    Technology: 0.31, "Financial Services": 0.13, Healthcare: 0.12,
    "Consumer Cyclical": 0.10, "Communication Services": 0.09,
    Industrials: 0.08, "Consumer Defensive": 0.06, Energy: 0.04,
    Utilities: 0.03, "Real Estate": 0.02, "Basic Materials": 0.02,
  },
  VOO: { // Vanguard S&P 500 — same composition as SPY
    Technology: 0.31, "Financial Services": 0.13, Healthcare: 0.12,
    "Consumer Cyclical": 0.10, "Communication Services": 0.09,
    Industrials: 0.08, "Consumer Defensive": 0.06, Energy: 0.04,
    Utilities: 0.03, "Real Estate": 0.02, "Basic Materials": 0.02,
  },
  IVV: { // iShares S&P 500 — same composition as SPY
    Technology: 0.31, "Financial Services": 0.13, Healthcare: 0.12,
    "Consumer Cyclical": 0.10, "Communication Services": 0.09,
    Industrials: 0.08, "Consumer Defensive": 0.06, Energy: 0.04,
    Utilities: 0.03, "Real Estate": 0.02, "Basic Materials": 0.02,
  },
  // ── Nasdaq 100 ──
  // Source: https://www.invesco.com/qqq-etf/en/home.html
  QQQ: {
    Technology: 0.49, "Communication Services": 0.16,
    "Consumer Cyclical": 0.13, Healthcare: 0.07,
    "Consumer Defensive": 0.06, Industrials: 0.05,
    "Financial Services": 0.02, Utilities: 0.01, Energy: 0.01,
  },
  // ── Total Market ──
  // Source: https://investor.vanguard.com/investment-products/etfs/profile/vti
  VTI: {
    Technology: 0.30, "Financial Services": 0.13, Healthcare: 0.12,
    "Consumer Cyclical": 0.10, "Communication Services": 0.08,
    Industrials: 0.09, "Consumer Defensive": 0.06, Energy: 0.04,
    Utilities: 0.03, "Real Estate": 0.03, "Basic Materials": 0.02,
  },
  // ── Dividend / Value ──
  DIA: { // Dow Jones Industrial Average
    Technology: 0.20, "Financial Services": 0.15, Healthcare: 0.15,
    Industrials: 0.14, "Consumer Cyclical": 0.13,
    "Consumer Defensive": 0.08, Energy: 0.05,
    "Communication Services": 0.05, "Basic Materials": 0.03, Utilities: 0.02,
  },
  SCHD: {
    "Financial Services": 0.18, Healthcare: 0.16, "Consumer Defensive": 0.14,
    Industrials: 0.13, Technology: 0.12, Energy: 0.10,
    "Communication Services": 0.07, "Consumer Cyclical": 0.05,
    "Basic Materials": 0.03, Utilities: 0.02,
  },
  VIG: {
    Technology: 0.20, "Financial Services": 0.17, Healthcare: 0.15,
    Industrials: 0.14, "Consumer Defensive": 0.13,
    "Consumer Cyclical": 0.08, Energy: 0.05,
    "Communication Services": 0.04, "Basic Materials": 0.02, Utilities: 0.02,
  },
  VYM: {
    "Financial Services": 0.20, Healthcare: 0.14, "Consumer Defensive": 0.13,
    Industrials: 0.12, Energy: 0.11, Technology: 0.10,
    Utilities: 0.07, "Communication Services": 0.05,
    "Consumer Cyclical": 0.04, "Real Estate": 0.02, "Basic Materials": 0.02,
  },
  // ── Small Cap ──
  IWM: {
    Healthcare: 0.16, Industrials: 0.16, "Financial Services": 0.15,
    Technology: 0.13, "Consumer Cyclical": 0.10, Energy: 0.07,
    "Real Estate": 0.07, "Basic Materials": 0.04,
    "Consumer Defensive": 0.04, Utilities: 0.04, "Communication Services": 0.04,
  },
  // ── Sector-specific ETFs (100% one sector) ──
  XLK: { Technology: 1.0 },
  XLF: { "Financial Services": 1.0 },
  XLV: { Healthcare: 1.0 },
  XLY: { "Consumer Cyclical": 1.0 },
  XLP: { "Consumer Defensive": 1.0 },
  XLI: { Industrials: 1.0 },
  XLE: { Energy: 1.0 },
  XLU: { Utilities: 1.0 },
  XLRE: { "Real Estate": 1.0 },
  XLB: { "Basic Materials": 1.0 },
  VNQ: { "Real Estate": 1.0 },
  // ── Bond ETFs ──
  BND:  { "Fixed Income": 1.0 },
  AGG:  { "Fixed Income": 1.0 },
  TLT:  { "Fixed Income": 1.0 },
  HYG:  { "Fixed Income": 1.0 },
  LQD:  { "Fixed Income": 1.0 },
  VCIT: { "Fixed Income": 1.0 },
  VCSH: { "Fixed Income": 1.0 },
  BSV:  { "Fixed Income": 1.0 },
  BIV:  { "Fixed Income": 1.0 },
  EMB:  { "Fixed Income": 1.0 },
  GOVT: { "Fixed Income": 1.0 },
  SHY:  { "Fixed Income": 1.0 },
  IEF:  { "Fixed Income": 1.0 },
  TIPS: { "Fixed Income": 1.0 },
  // ── Commodity ETFs ──
  GLD: { Commodities: 1.0 },
  SLV: { Commodities: 1.0 },
  // ── International ──
  EEM:  { International: 1.0 },
  VEA:  { International: 1.0 },
  VWO:  { International: 1.0 },
  VXUS: { International: 1.0 },
  IEMG: { International: 1.0 },
  // ── Thematic ──
  ARKK: { Technology: 0.60, Healthcare: 0.25, "Communication Services": 0.10, "Financial Services": 0.05 },
  ARKG: { Healthcare: 0.85, Technology: 0.15 },
  RSP: { // Equal-weight S&P 500 — more evenly distributed
    Technology: 0.15, "Financial Services": 0.14, Healthcare: 0.13,
    Industrials: 0.13, "Consumer Cyclical": 0.11, "Consumer Defensive": 0.08,
    Energy: 0.05, Utilities: 0.05, "Real Estate": 0.05,
    "Communication Services": 0.04, "Basic Materials": 0.04,
  },
};

// ─── Financial Math (same formulas as the main analyse route) ───
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sampleStdDev(arr) {
  const m = mean(arr);
  const variance =
    arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

// ─── Fetch 1-year weekly returns for a ticker ───
async function fetchWeeklyReturns(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(
    ticker
  )}?range=1y&interval=1wk&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) throw new Error(`Failed to fetch ${ticker}`);

  const data = await res.json();
  const result = data?.chart?.result?.[0];
  if (!result) throw new Error(`No data for ${ticker}`);

  const closePrices = result.indicators?.quote?.[0]?.close;
  const name =
    result.meta?.shortName ||
    result.meta?.longName ||
    result.meta?.symbol ||
    ticker;

  if (!closePrices || closePrices.length < 3)
    throw new Error(`Not enough data for ${ticker}`);

  const weeklyReturns = [];
  for (let i = 1; i < closePrices.length; i++) {
    const prev = closePrices[i - 1];
    const curr = closePrices[i];
    if (
      prev != null &&
      curr != null &&
      !isNaN(prev) &&
      !isNaN(curr) &&
      prev > 0
    ) {
      weeklyReturns.push(((curr - prev) / prev) * 100);
    }
  }

  if (weeklyReturns.length < 3)
    throw new Error(`Not enough returns for ${ticker}`);

  return { ticker, name, weeklyReturns };
}

// ─── Detect sector for a ticker not in curated list ───
async function detectSector(ticker) {
  // 1. Check curated reverse map (instant, no API call)
  if (TICKER_TO_SECTOR[ticker]) return TICKER_TO_SECTOR[ticker];

  // 2. Check common ETFs (instant, no API call)
  if (COMMON_ETFS.has(ticker)) return null;

  // 3. Try Yahoo Finance quoteSummary for sector info
  try {
    const url = `https://query2.finance.yahoo.com/v10/finance/quoteSummary/${encodeURIComponent(
      ticker
    )}?modules=assetProfile`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const sector =
      data?.quoteSummary?.result?.[0]?.assetProfile?.sector || null;
    // Only return sector if we have a curated comparison list for it
    return sector && SECTOR_TICKERS[sector] ? sector : null;
  } catch {
    return null;
  }
}

// ─── API Handler ───
export async function POST(request) {
  try {
    const { holdings, rfAnnual } = await request.json();
    const rfWeekly = (Math.pow(1 + rfAnnual, 1 / 52) - 1) * 100;

    // ── Step 1: Detect sector for each holding ──
    const holdingsWithSector = await Promise.all(
      holdings.map(async (h) => ({
        ...h,
        sector: await detectSector(h.ticker),
      }))
    );

    // ── Step 2: Group holdings by sector ──
    const bySector = {};
    const skipped = [];

    for (const h of holdingsWithSector) {
      if (!h.sector) {
        skipped.push({
          ticker: h.ticker,
          reason: COMMON_ETFS.has(h.ticker)
            ? "ETF — spans multiple sectors"
            : "Sector data unavailable",
        });
        continue;
      }
      if (!bySector[h.sector]) bySector[h.sector] = [];
      bySector[h.sector].push(h);
    }

    // ── Step 3: For each sector, fetch comparison Sharpe ratios ──
    const alerts = [];
    const passing = []; // holdings that meet or exceed sector average

    for (const [sector, sectorHoldings] of Object.entries(bySector)) {
      const compTickers = SECTOR_TICKERS[sector];
      if (!compTickers) continue;

      // Fetch all comparison tickers in parallel
      const compResults = await Promise.all(
        compTickers.map(async (t) => {
          try {
            const data = await fetchWeeklyReturns(t);
            const avg = mean(data.weeklyReturns);
            const sd = sampleStdDev(data.weeklyReturns);
            const sharpe = sd > 0 ? (avg - rfWeekly) / sd : 0;
            return {
              ticker: t,
              name: data.name,
              annualizedSharpe: sharpe * Math.sqrt(52),
            };
          } catch {
            return null; // Skip tickers that fail to fetch
          }
        })
      );

      const validComps = compResults.filter(Boolean);
      if (validComps.length === 0) continue;

      // Sector average Sharpe (from the curated top-10 list)
      const sectorAvgSharpe =
        validComps.reduce((s, c) => s + c.annualizedSharpe, 0) /
        validComps.length;

      // Check each holding against sector average
      for (const h of sectorHoldings) {
        // Split comparison tickers into those that beat this holding vs those that don't
        const outperformers = validComps
          .filter((c) => c.annualizedSharpe > h.annualizedSharpe)
          .sort((a, b) => b.annualizedSharpe - a.annualizedSharpe);

        const underperformers = validComps
          .filter((c) => c.annualizedSharpe <= h.annualizedSharpe)
          .sort((a, b) => b.annualizedSharpe - a.annualizedSharpe);

        if (h.annualizedSharpe < sectorAvgSharpe) {
          // ⚠️ Flagged: below sector average
          alerts.push({
            ticker: h.ticker,
            name: h.name,
            holdingSharpe: h.annualizedSharpe,
            sector,
            sectorAvgSharpe,
            gap: h.annualizedSharpe - sectorAvgSharpe,
            outperformers,
            underperformers,
            totalComparisons: validComps.length,
          });
        } else {
          // ✓ Passing: at or above sector average
          passing.push({
            ticker: h.ticker,
            name: h.name,
            holdingSharpe: h.annualizedSharpe,
            sector,
            sectorAvgSharpe,
          });
        }
      }
    }

    // Sort alerts by gap (worst-performing first)
    alerts.sort((a, b) => a.gap - b.gap);

    // ── Sector Exposure Calculation ──
    // Break down the portfolio into sector percentages,
    // decomposing ETFs into their constituent sectors.
    const ALL_SECTORS = [
      "Technology", "Financial Services", "Healthcare",
      "Consumer Cyclical", "Consumer Defensive", "Industrials",
      "Energy", "Utilities", "Real Estate",
      "Communication Services", "Basic Materials",
      "Fixed Income", "Commodities", "International",
    ];

    const sectorExposure = {};
    const etfBreakdownUsed = []; // track which ETFs were decomposed
    const totalValue = holdings.reduce((s, h) => s + (h.amount || 0), 0);

    for (const h of holdings) {
      const ticker = h.ticker;
      const weight = (h.amount || 0) / totalValue;

      if (ETF_SECTOR_BREAKDOWNS[ticker]) {
        // ETF: distribute weight across constituent sectors
        const breakdown = ETF_SECTOR_BREAKDOWNS[ticker];
        for (const [sector, pct] of Object.entries(breakdown)) {
          sectorExposure[sector] = (sectorExposure[sector] || 0) + weight * pct;
        }
        etfBreakdownUsed.push(ticker);
      } else {
        // Individual stock: use detected sector
        const match = holdingsWithSector.find((hw) => hw.ticker === ticker);
        const sector = match?.sector || "Other";
        sectorExposure[sector] = (sectorExposure[sector] || 0) + weight;
      }
    }

    // Convert to sorted array of { sector, percentage }
    const exposure = Object.entries(sectorExposure)
      .map(([sector, pct]) => ({ sector, percentage: pct * 100 }))
      .sort((a, b) => b.percentage - a.percentage);

    // Find sectors with zero exposure (only from the core 11 equity sectors)
    const CORE_SECTORS = [
      "Technology", "Financial Services", "Healthcare",
      "Consumer Cyclical", "Consumer Defensive", "Industrials",
      "Energy", "Utilities", "Real Estate",
      "Communication Services", "Basic Materials",
    ];
    const missingSectors = CORE_SECTORS.filter(
      (s) => !sectorExposure[s] || sectorExposure[s] < 0.001
    );

    return NextResponse.json({
      alerts,
      passing,
      skipped,
      exposure,
      missingSectors,
      etfBreakdownUsed,
    });
  } catch (err) {
    console.error("Sector analysis error:", err);
    return NextResponse.json(
      { error: `Sector analysis failed: ${err.message}` },
      { status: 500 }
    );
  }
}
