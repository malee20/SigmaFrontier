// app/api/optimise/route.js
// Finds the portfolio weights that maximise the Sharpe Ratio
// using projected gradient ascent with box constraints.
//
// Algorithm: Projected Gradient Ascent
//   1. Compute the gradient of the Sharpe Ratio w.r.t. weights
//   2. Take a step in the gradient direction (with adaptive step size)
//   3. Project weights back onto the feasible set:
//      - Each weight between minW and maxW
//      - All weights sum to 1.0
//   4. Repeat until convergence
//   5. Multiple restarts to avoid local optima
//
// Pure math — no AI, no external API calls, zero cost.

import { NextResponse } from "next/server";

// ─── Core portfolio functions ───

function portfolioReturn(w, mu) {
  let r = 0;
  for (let i = 0; i < w.length; i++) r += w[i] * mu[i];
  return r;
}

function portfolioVariance(w, cov) {
  let v = 0;
  const n = w.length;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      v += w[i] * w[j] * cov[i][j];
    }
  }
  return v;
}

function portfolioStdDev(w, cov) {
  return Math.sqrt(Math.max(portfolioVariance(w, cov), 1e-12));
}

function sharpeRatio(w, mu, cov, rf) {
  const ret = portfolioReturn(w, mu);
  const std = portfolioStdDev(w, cov);
  return (ret - rf) / std;
}

// ─── Gradient of Sharpe Ratio ───
// ∂SR/∂w_i = (1/σ) * [μ_i - (SR/σ) * (Σw)_i]
// where σ = portfolio std dev, SR = Sharpe ratio, Σ = covariance matrix

function sharpeGradient(w, mu, cov, rf) {
  const n = w.length;
  const ret = portfolioReturn(w, mu);
  const sigma = portfolioStdDev(w, cov);
  const sr = (ret - rf) / sigma;

  // Compute Σw (covariance matrix times weight vector)
  const covW = new Array(n).fill(0);
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      covW[i] += cov[i][j] * w[j];
    }
  }

  // Gradient
  const grad = new Array(n);
  const srOverSigma = sr / sigma;
  for (let i = 0; i < n; i++) {
    grad[i] = (mu[i] - srOverSigma * covW[i]) / sigma;
  }

  return grad;
}

// ─── Project onto feasible set ───
// Constraints: sum(w) = 1, minW <= w_i <= maxW
// Uses iterative clamping with redistribution

function project(w, minW, maxW) {
  const n = w.length;
  const projected = [...w];

  // Iterative projection: clamp to bounds, then adjust to sum to 1
  // Repeat until stable (typically converges in 3-5 iterations)
  for (let iter = 0; iter < 50; iter++) {
    // Clamp to bounds
    for (let i = 0; i < n; i++) {
      projected[i] = Math.max(minW, Math.min(maxW, projected[i]));
    }

    // Check sum
    const sum = projected.reduce((a, b) => a + b, 0);
    const diff = sum - 1.0;

    if (Math.abs(diff) < 1e-10) break;

    // Find which indices can be adjusted (not clamped at a bound in the
    // direction we need to push them)
    const adjustable = [];
    for (let i = 0; i < n; i++) {
      if (diff > 0 && projected[i] > minW) adjustable.push(i);
      else if (diff < 0 && projected[i] < maxW) adjustable.push(i);
    }

    if (adjustable.length === 0) break;

    // Distribute the excess/deficit equally among adjustable weights
    const perWeight = diff / adjustable.length;
    for (const i of adjustable) {
      projected[i] -= perWeight;
    }
  }

  // Final clamp and normalise (safety net)
  for (let i = 0; i < n; i++) {
    projected[i] = Math.max(minW, Math.min(maxW, projected[i]));
  }
  const finalSum = projected.reduce((a, b) => a + b, 0);
  if (Math.abs(finalSum - 1.0) > 1e-8) {
    for (let i = 0; i < n; i++) projected[i] /= finalSum;
  }

  return projected;
}

// ─── Generate a feasible starting point ───

function feasibleStart(n, minW, maxW, seed) {
  const w = new Array(n);

  // Start at minimum, then distribute remaining weight
  for (let i = 0; i < n; i++) w[i] = minW;
  let remaining = 1.0 - n * minW;

  // Use seed for deterministic randomness across restarts
  let s = seed;
  const rand = () => {
    s = (s * 16807 + 12345) % 2147483647;
    return s / 2147483647;
  };

  // Randomly distribute remaining weight
  for (let i = 0; i < n && remaining > 1e-10; i++) {
    const idx = Math.floor(rand() * n);
    const maxAdd = Math.min(maxW - w[idx], remaining);
    const add = rand() * maxAdd;
    w[idx] += add;
    remaining -= add;
  }

  // Distribute any leftover evenly among those with room
  if (remaining > 1e-10) {
    for (let i = 0; i < n && remaining > 1e-10; i++) {
      const add = Math.min(maxW - w[i], remaining / (n - i));
      w[i] += add;
      remaining -= add;
    }
  }

  return project(w, minW, maxW);
}

// ─── Projected Gradient Ascent with adaptive step size ───

function gradientAscent(mu, cov, rf, n, minW, maxW, startWeights) {
  let w = [...startWeights];
  let bestW = [...w];
  let bestSR = sharpeRatio(w, mu, cov, rf);

  let stepSize = 0.1;
  const minStep = 1e-8;
  let noImproveCount = 0;

  for (let iter = 0; iter < 2000; iter++) {
    const grad = sharpeGradient(w, mu, cov, rf);

    // Take gradient step
    const wNew = new Array(n);
    for (let i = 0; i < n; i++) {
      wNew[i] = w[i] + stepSize * grad[i];
    }

    // Project back to feasible set
    const wProj = project(wNew, minW, maxW);
    const newSR = sharpeRatio(wProj, mu, cov, rf);

    if (newSR > bestSR + 1e-10) {
      // Improvement — accept and try larger step
      bestSR = newSR;
      bestW = [...wProj];
      w = wProj;
      noImproveCount = 0;
      stepSize *= 1.1; // accelerate
    } else {
      // No improvement — shrink step size
      noImproveCount++;
      stepSize *= 0.5;
      w = [...bestW]; // reset to best known

      if (stepSize < minStep || noImproveCount > 50) {
        break; // converged
      }
    }
  }

  return { weights: bestW, sharpe: bestSR };
}

// ─── Main optimiser: gradient ascent with multiple restarts ───

function optimise(mu, cov, rf, n, minW, maxW, currentWeights) {
  let globalBestW = null;
  let globalBestSR = -Infinity;

  // Restart 1: start from current portfolio weights
  const fromCurrent = gradientAscent(mu, cov, rf, n, minW, maxW,
    project([...currentWeights], minW, maxW));
  if (fromCurrent.sharpe > globalBestSR) {
    globalBestSR = fromCurrent.sharpe;
    globalBestW = fromCurrent.weights;
  }

  // Restart 2: start from equal weights
  const equalW = new Array(n).fill(1 / n);
  const fromEqual = gradientAscent(mu, cov, rf, n, minW, maxW,
    project(equalW, minW, maxW));
  if (fromEqual.sharpe > globalBestSR) {
    globalBestSR = fromEqual.sharpe;
    globalBestW = fromEqual.weights;
  }

  // Restart 3: concentrate on highest-return asset (within bounds)
  const maxRetIdx = mu.indexOf(Math.max(...mu));
  const highRetW = new Array(n).fill(minW);
  highRetW[maxRetIdx] = maxW;
  const fromHighRet = gradientAscent(mu, cov, rf, n, minW, maxW,
    project(highRetW, minW, maxW));
  if (fromHighRet.sharpe > globalBestSR) {
    globalBestSR = fromHighRet.sharpe;
    globalBestW = fromHighRet.weights;
  }

  // Restart 4: concentrate on lowest-volatility asset (within bounds)
  const vols = [];
  for (let i = 0; i < n; i++) vols.push(Math.sqrt(cov[i][i]));
  const minVolIdx = vols.indexOf(Math.min(...vols));
  const lowVolW = new Array(n).fill(minW);
  lowVolW[minVolIdx] = maxW;
  const fromLowVol = gradientAscent(mu, cov, rf, n, minW, maxW,
    project(lowVolW, minW, maxW));
  if (fromLowVol.sharpe > globalBestSR) {
    globalBestSR = fromLowVol.sharpe;
    globalBestW = fromLowVol.weights;
  }

  // Restarts 5-14: random starting points
  for (let r = 0; r < 10; r++) {
    const startW = feasibleStart(n, minW, maxW, 42 + r * 7919);
    const result = gradientAscent(mu, cov, rf, n, minW, maxW, startW);
    if (result.sharpe > globalBestSR) {
      globalBestSR = result.sharpe;
      globalBestW = result.weights;
    }
  }

  return { weights: globalBestW, sharpe: globalBestSR };
}

// ─── API Handler ───

export async function POST(request) {
  try {
    const { means, covMatrix, rfWeekly, tickers, currentWeights, minWeight, maxWeight } =
      await request.json();

    const n = tickers.length;

    if (!means || !covMatrix || n < 2) {
      return NextResponse.json(
        { error: "Invalid portfolio data." },
        { status: 400 }
      );
    }

    // Validate constraints
    if (minWeight * n > 1.0 + 1e-9) {
      return NextResponse.json(
        { error: `Minimum weight ${(minWeight * 100).toFixed(0)}% × ${n} holdings = ${(minWeight * n * 100).toFixed(0)}% which exceeds 100%. Lower the minimum weight.` },
        { status: 400 }
      );
    }

    if (maxWeight * n < 1.0 - 1e-9) {
      return NextResponse.json(
        { error: `Maximum weight ${(maxWeight * 100).toFixed(0)}% × ${n} holdings = ${(maxWeight * n * 100).toFixed(0)}% which is less than 100%. Raise the maximum weight.` },
        { status: 400 }
      );
    }

    // Run optimisation
    const result = optimise(means, covMatrix, rfWeekly, n, minWeight, maxWeight, currentWeights);

    // Calculate current Sharpe for comparison
    const currentSharpe = sharpeRatio(currentWeights, means, covMatrix, rfWeekly);

    // Annualise
    const currentSharpeAnnual = currentSharpe * Math.sqrt(52);
    const optimisedSharpeAnnual = result.sharpe * Math.sqrt(52);

    const holdings = tickers.map((ticker, i) => ({
      ticker,
      currentWeight: currentWeights[i],
      optimisedWeight: result.weights[i],
    }));

    return NextResponse.json({
      holdings,
      currentSharpeAnnual,
      optimisedSharpeAnnual,
      improvement: optimisedSharpeAnnual - currentSharpeAnnual,
    });
  } catch (err) {
    console.error("Optimisation error:", err);
    return NextResponse.json(
      { error: `Optimisation failed: ${err.message}` },
      { status: 500 }
    );
  }
}

