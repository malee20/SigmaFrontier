// app/api/ai-analyse/route.js
// Sends computed portfolio data to Claude for plain-English analysis.
// Requires ANTHROPIC_API_KEY environment variable.

import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI analysis is not configured. Missing API key." },
        { status: 500 }
      );
    }

    const { portfolioData, sectorData } = await request.json();

    if (!portfolioData) {
      return NextResponse.json(
        { error: "No portfolio data provided." },
        { status: 400 }
      );
    }

    // ── Build the prompt with all available data ──
    const holdings = portfolioData.securityMetrics
      .map(
        (s) =>
          `${s.ticker} (${s.name}): weight ${(s.weight * 100).toFixed(1)}%, avg weekly return ${s.avgWeeklyReturn.toFixed(3)}%, weekly risk ${s.weeklyStdDev.toFixed(3)}%, annualised Sharpe ${s.annualizedSharpe.toFixed(2)}`
      )
      .join("\n");

    const correlationPairs = [];
    for (let i = 0; i < portfolioData.tickers.length; i++) {
      for (let j = i + 1; j < portfolioData.tickers.length; j++) {
        const val = portfolioData.corrMatrix[i][j];
        if (Math.abs(val) > 0.4) {
          correlationPairs.push(
            `${portfolioData.tickers[i]}-${portfolioData.tickers[j]}: ${val.toFixed(2)}`
          );
        }
      }
    }

    let sectorSection = "";
    if (sectorData && !sectorData.error) {
      if (sectorData.exposure && sectorData.exposure.length > 0) {
        sectorSection += `\nSector exposure:\n${sectorData.exposure.map((e) => `- ${e.sector}: ${e.percentage.toFixed(1)}%`).join("\n")}`;
      }
      if (sectorData.missingSectors && sectorData.missingSectors.length > 0) {
        sectorSection += `\nMissing sectors (no exposure): ${sectorData.missingSectors.join(", ")}`;
      }
      if (sectorData.alerts && sectorData.alerts.length > 0) {
        sectorSection += `\nFlagged holdings (below sector average Sharpe):\n${sectorData.alerts.map((a) => `- ${a.ticker}: Sharpe ${a.holdingSharpe.toFixed(2)} vs sector avg ${a.sectorAvgSharpe.toFixed(2)} (${a.sector})`).join("\n")}`;
      }
    }

    const prompt = `You are a portfolio analyst writing for an amateur retail investor who may not understand finance jargon. Analyse the following portfolio data and provide clear, actionable insights.

PORTFOLIO SUMMARY:
- Total value: $${portfolioData.totalValue.toLocaleString()}
- Number of holdings: ${portfolioData.tickers.length}
- Portfolio annualised Sharpe Ratio: ${portfolioData.portfolioSharpeAnnualized.toFixed(2)}
- Portfolio average weekly return: ${portfolioData.portfolioAvgReturn.toFixed(3)}%
- Portfolio weekly risk (std dev): ${portfolioData.portfolioStdDev.toFixed(3)}%
- Risk-free rate: ${(portfolioData.rfAnnual * 100).toFixed(2)}% annual

INDIVIDUAL HOLDINGS:
${holdings}

NOTABLE CORRELATIONS (|correlation| > 0.4):
${correlationPairs.length > 0 ? correlationPairs.join("\n") : "No notably high correlations."}
${sectorSection}

INSTRUCTIONS:
1. Start with a 1-2 sentence overall assessment of the portfolio's risk-adjusted performance.
2. Identify the key risks: concentration in any sector, high correlations between holdings, and any holdings that underperform their sector.
3. Highlight what's working well — strong performers, good diversification choices, etc.
4. Suggest 2-3 areas the investor might want to look into (WITHOUT recommending specific stocks to buy or sell).
5. Use plain English throughout. If you use a finance term, briefly explain it in parentheses.
6. Keep the entire analysis under 250 words.
7. Do NOT give specific buy, sell, or trade recommendations. This is educational analysis only.
8. Format with clear section headers using bold text.`;

    // ── Call Claude API ──
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-20250514",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Claude API error:", response.status, errBody);
      return NextResponse.json(
        { error: `AI analysis failed (status ${response.status}). Please try again.` },
        { status: 500 }
      );
    }

    const data = await response.json();
    const analysisText = data.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .filter(Boolean)
      .join("\n");

    return NextResponse.json({ analysis: analysisText });
  } catch (err) {
    console.error("AI analysis error:", err);
    return NextResponse.json(
      { error: `AI analysis failed: ${err.message}` },
      { status: 500 }
    );
  }
}
