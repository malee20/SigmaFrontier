// app/api/analyse/route.js
// Fetches real stock data directly from Yahoo Finance's public API.
// No third-party library needed — just plain HTTP requests.

import { NextResponse } from "next/server";

// ─── Financial Math ───
function mean(arr) {
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}

function sampleStdDev(arr) {
  const m = mean(arr);
  const variance =
    arr.reduce((sum, x) => sum + (x - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function pearsonCorrelation(x, y) {
  const mx = mean(x),
    my = mean(y);
  let num = 0,
    dx = 0,
    dy = 0;
  for (let i = 0; i < x.length; i++) {
    const a = x[i] - mx,
      b = y[i] - my;
    num += a * b;
    dx += a * a;
    dy += b * b;
  }
  const denom = Math.sqrt(dx) * Math.sqrt(dy);
  return denom === 0 ? 0 : num / denom;
}

function sampleCovariance(x, y) {
  const mx = mean(x),
    my = mean(y);
  let sum = 0;
  for (let i = 0; i < x.length; i++) sum += (x[i] - mx) * (y[i] - my);
  return sum / (x.length - 1);
}

// ─── Fetch weekly closing prices from Yahoo Finance public API ───
async function fetchWeeklyReturns(ticker) {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=1y&interval=1wk&includePrePost=false`;

  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch data for ${ticker} (status ${res.status})`);
  }

  const data = await res.json();
  const result = data?.chart?.result?.[0];

  if (!result) {
    throw new Error(`No data found for ticker "${ticker}". Check the symbol.`);
  }

  const closePrices = result.indicators?.quote?.[0]?.close;
  const name =
    result.meta?.shortName || result.meta?.longName || result.meta?.symbol || ticker;

  if (!closePrices || closePrices.length < 3) {
    throw new Error(`Not enough price data for ${ticker}`);
  }

  // Calculate weekly percentage returns from close prices
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

  if (weeklyReturns.length < 3) {
    throw new Error(`Not enough valid return data for ${ticker}`);
  }

  return { ticker, name, weeklyReturns };
}

// ─── Fetch risk-free rate (13-week US Treasury bill yield) ───
async function fetchRiskFreeRate() {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/%5EIRX?range=5d&interval=1d`;
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
    });
    const data = await res.json();
    const price = data?.chart?.result?.[0]?.meta?.regularMarketPrice;
    if (price && price > 0) {
      return price / 100; // convert from percent to decimal
    }
    return 0.042; // fallback
  } catch {
    return 0.042; // fallback ~4.2%
  }
}

// ─── API Handler ───
export async function POST(request) {
  try {
    const body = await request.json();
    const { holdings } = body;

    if (!holdings || !Array.isArray(holdings) || holdings.length < 2) {
      return NextResponse.json(
        { error: "Please provide at least 2 holdings." },
        { status: 400 }
      );
    }

    for (const h of holdings) {
      if (!h.ticker || typeof h.amount !== "number" || h.amount <= 0) {
        return NextResponse.json(
          { error: `Invalid holding: ${JSON.stringify(h)}` },
          { status: 400 }
        );
      }
    }

    // Fetch all data in parallel
    const [riskFreeAnnual, ...tickerData] = await Promise.all([
      fetchRiskFreeRate(),
      ...holdings.map((h) => fetchWeeklyReturns(h.ticker.toUpperCase())),
    ]);

    // Align returns to same length
    const minLength = Math.min(
      ...tickerData.map((d) => d.weeklyReturns.length)
    );
    const alignedReturns = tickerData.map((d) =>
      d.weeklyReturns.slice(d.weeklyReturns.length - minLength)
    );

    const tickers = tickerData.map((d) => d.ticker);
    const totalValue = holdings.reduce((s, h) => s + h.amount, 0);
    const weights = holdings.map((h) => h.amount / totalValue);
    const n = tickers.length;

    // Weekly risk-free rate
    const rfWeekly = (Math.pow(1 + riskFreeAnnual, 1 / 52) - 1) * 100;

    // Per-security metrics
    const securityMetrics = tickerData.map((data, i) => {
      const r = alignedReturns[i];
      const avg = mean(r);
      const sd = sampleStdDev(r);
      const sharpe = sd > 0 ? (avg - rfWeekly) / sd : 0;
      const annualizedSharpe = sharpe * Math.sqrt(52);
      return {
        ticker: data.ticker,
        name: data.name,
        amount: holdings[i].amount,
        weight: weights[i],
        avgWeeklyReturn: avg,
        weeklyStdDev: sd,
        weeklySharpe: sharpe,
        annualizedSharpe,
      };
    });

    // Correlation matrix
    const corrMatrix = [];
    for (let i = 0; i < n; i++) {
      corrMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        corrMatrix[i][j] =
          i === j ? 1 : pearsonCorrelation(alignedReturns[i], alignedReturns[j]);
      }
    }

    // Covariance matrix
    const covMatrix = [];
    for (let i = 0; i < n; i++) {
      covMatrix[i] = [];
      for (let j = 0; j < n; j++) {
        covMatrix[i][j] = sampleCovariance(alignedReturns[i], alignedReturns[j]);
      }
    }

    // Portfolio std dev: sqrt(w^T * Σ * w)
    let portfolioVariance = 0;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        portfolioVariance += weights[i] * weights[j] * covMatrix[i][j];
      }
    }
    const portfolioStdDev = Math.sqrt(portfolioVariance);

    // Portfolio average weekly return
    let portfolioAvgReturn = 0;
    for (let i = 0; i < n; i++)
      portfolioAvgReturn += weights[i] * mean(alignedReturns[i]);

    // Portfolio Sharpe ratio
    const portfolioSharpeWeekly =
      portfolioStdDev > 0
        ? (portfolioAvgReturn - rfWeekly) / portfolioStdDev
        : 0;
    const portfolioSharpeAnnualized = portfolioSharpeWeekly * Math.sqrt(52);

    return NextResponse.json({
      securityMetrics,
      corrMatrix,
      tickers,
      weights,
      totalValue,
      portfolioAvgReturn,
      portfolioStdDev,
      portfolioSharpeWeekly,
      portfolioSharpeAnnualized,
      rfWeekly,
      rfAnnual: riskFreeAnnual,
      dataPoints: minLength,
    });
  } catch (err) {
    console.error("Analysis error:", err);
    const message = err.message || "Something went wrong.";

    if (
      message.includes("Not enough") ||
      message.includes("No data found") ||
      message.includes("Check the symbol")
    ) {
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(
      { error: `Analysis failed: ${message}` },
      { status: 500 }
    );
  }
}
