import {
  calculatePortfolioMetrics,
  calculateRiskMetrics,
  processPriceData,
  calculateMovingAverages,
  calculateRSI,
  calculateMACD,
  calculateCorrelations,
  type Position,
} from "../calculations.worker";

describe("portfolioWorker calculations", () => {
  const mockPositions: Position[] = [
    { id: "1", symbol: "BTC", amount: 1, currentPrice: 50000, averageBuyPrice: 40000 },
    { id: "2", symbol: "ETH", amount: 10, currentPrice: 3000, averageBuyPrice: 2000 },
  ];

  it("calculates portfolio metrics correctly", () => {
    const metrics = calculatePortfolioMetrics(mockPositions);

    expect(metrics.totalValue).toBeGreaterThan(0);
    expect(metrics.totalGainLoss).toBeGreaterThan(0); 
    expect(metrics.winRate).toBe(100); 
  });

  it("calculates risk metrics", () => {
    const risk = calculateRiskMetrics(mockPositions);

    expect(risk.var95).toBeLessThanOrEqual(0); 
    expect(typeof risk.beta).toBe("number");
    expect(typeof risk.sortinoRatio).toBe("number");
  });

  it("processes price data", () => {
    const rawData = [
      { timestamp: "2025-01-01", price: 100 },
      { timestamp: "2025-01-02", price: 105 },
      { timestamp: "2025-01-03", price: 110 },
    ];
    const processed = processPriceData(rawData, "7D");

    expect(processed.data.length).toBe(rawData.length);
    expect(processed.indicators.movingAverages.sma20.length).toBe(rawData.length);
    expect(processed.indicators.rsi.length).toBe(rawData.length);
    expect(processed.indicators.macd.macd.length).toBe(rawData.length);
  });

  it("calculates moving averages", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({ close: 100 + i }));
    const { sma20, ema20 } = calculateMovingAverages(data);

    expect(sma20.length).toBe(30);
    expect(ema20.length).toBe(30);
    expect(sma20[19]).not.toBeNull(); // after 20th point SMA kicks in
  });

  it("calculates RSI", () => {
    const data = Array.from({ length: 20 }, (_, i) => ({ close: 100 + i }));
    const rsi = calculateRSI(data);

    expect(rsi.length).toBe(data.length);
    expect(rsi.some(v => v !== null)).toBe(true);
  });

  it("calculates MACD", () => {
    const data = Array.from({ length: 30 }, (_, i) => ({ close: 100 + i }));
    const { macd, signal, histogram } = calculateMACD(data);

    expect(macd.length).toBe(30);
    expect(signal.length).toBe(30);
    expect(histogram.length).toBe(30);
  });

  it("calculates correlations", () => {
    const correlations = calculateCorrelations(mockPositions);

    expect(correlations.BTC.BTC).toBe(1);
    expect(correlations.BTC.ETH).toBeGreaterThan(0);
    expect(correlations.ETH.BTC).toBe(correlations.BTC.ETH);
  });
});
