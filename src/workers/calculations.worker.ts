// Web Worker for heavy calculations to keep UI thread responsive
// This worker handles complex portfolio calculations, risk analytics, and data processing

export interface WorkerMessage {
  id: string;
  type: 'CALCULATE_PORTFOLIO_METRICS' | 'CALCULATE_RISK_METRICS' | 'PROCESS_PRICE_DATA' | 'CALCULATE_CORRELATIONS';
  payload: any;
}

export interface WorkerResponse {
  id: string;
  type: string;
  result?: any;
  error?: string;
}

// Portfolio metrics calculation
interface Position {
  id: string;
  symbol: string;
  amount: number;
  currentPrice: number;
  averageBuyPrice: number;
  priceHistory?: number[];
}

interface PortfolioMetrics {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
  sharpeRatio: number;
  volatility: number;
  maxDrawdown: number;
  winRate: number;
  diversificationRatio: number;
}

// Calculate comprehensive portfolio metrics
function calculatePortfolioMetrics(positions: Position[]): PortfolioMetrics {
  if (positions.length === 0) {
    return {
      totalValue: 0,
      dailyChange: 0,
      dailyChangePercent: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      sharpeRatio: 0,
      volatility: 0,
      maxDrawdown: 0,
      winRate: 0,
      diversificationRatio: 0,
    };
  }

  // Basic metrics
  const totalValue = positions.reduce((sum, p) => sum + (p.amount * p.currentPrice), 0);
  const totalCost = positions.reduce((sum, p) => sum + (p.amount * p.averageBuyPrice), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;

  // Calculate daily change (simplified - would need historical data in real scenario)
  const dailyChange = positions.reduce((sum, p) => {
    const dailyPriceChange = p.currentPrice * 0.01 * (Math.random() - 0.5) * 2; // Mock daily change
    return sum + (p.amount * dailyPriceChange);
  }, 0);
  const dailyChangePercent = totalValue > 0 ? (dailyChange / totalValue) * 100 : 0;

  // Advanced metrics (simplified calculations)
  const returns = positions.map(p => ((p.currentPrice - p.averageBuyPrice) / p.averageBuyPrice));
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const volatility = Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility

  // Sharpe ratio (using risk-free rate of 2%)
  const riskFreeRate = 0.02;
  const excessReturn = avgReturn * 100 - riskFreeRate;
  const sharpeRatio = volatility > 0 ? excessReturn / volatility : 0;

  // Max drawdown calculation (simplified)
  const maxDrawdown = Math.max(...returns.map(r => Math.min(0, r))) * 100;

  // Win rate
  const winningPositions = positions.filter(p => p.currentPrice > p.averageBuyPrice).length;
  const winRate = (winningPositions / positions.length) * 100;

  // Diversification ratio (simplified)
  const weights = positions.map(p => (p.amount * p.currentPrice) / totalValue);
  const diversificationRatio = 1 / weights.reduce((sum, w) => sum + Math.pow(w, 2), 0);

  return {
    totalValue,
    dailyChange,
    dailyChangePercent,
    totalGainLoss,
    totalGainLossPercent,
    sharpeRatio,
    volatility,
    maxDrawdown,
    winRate,
    diversificationRatio,
  };
}

// Risk metrics calculation
interface RiskMetrics {
  var95: number;
  var99: number;
  expectedShortfall: number;
  beta: number;
  correlation: number;
  downsideDeviation: number;
  calmarRatio: number;
  sortinoRatio: number;
  informationRatio: number;
}

function calculateRiskMetrics(positions: Position[], marketData?: number[]): RiskMetrics {
  const returns = positions.map(p => ((p.currentPrice - p.averageBuyPrice) / p.averageBuyPrice));
  const sortedReturns = [...returns].sort((a, b) => a - b);
  
  // Value at Risk calculations
  const var95Index = Math.floor(sortedReturns.length * 0.05);
  const var99Index = Math.floor(sortedReturns.length * 0.01);
  const var95 = sortedReturns[var95Index] || 0;
  const var99 = sortedReturns[var99Index] || 0;

  // Expected Shortfall (CVaR)
  const worstReturns = sortedReturns.slice(0, var95Index + 1);
  const expectedShortfall = worstReturns.reduce((sum, r) => sum + r, 0) / worstReturns.length;

  // Beta calculation (simplified - would need market index data)
  const beta = 1.2 + (Math.random() - 0.5) * 0.4; // Mock beta between 0.8 and 1.6

  // Correlation with market (mock)
  const correlation = 0.7 + (Math.random() - 0.5) * 0.4; // Mock correlation

  // Downside deviation
  const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
  const downsideReturns = returns.filter(r => r < avgReturn);
  const downsideVariance = downsideReturns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / downsideReturns.length;
  const downsideDeviation = Math.sqrt(downsideVariance);

  // Advanced ratios
  const riskFreeRate = 0.02 / 252; // Daily risk-free rate
  const excessReturn = avgReturn - riskFreeRate;
  const calmarRatio = avgReturn / Math.abs(Math.min(...returns));
  const sortinoRatio = downsideDeviation > 0 ? excessReturn / downsideDeviation : 0;
  const informationRatio = 0.15; // Mock information ratio

  return {
    var95: var95 * 100,
    var99: var99 * 100,
    expectedShortfall: expectedShortfall * 100,
    beta,
    correlation,
    downsideDeviation: downsideDeviation * 100,
    calmarRatio,
    sortinoRatio,
    informationRatio,
  };
}

// Price data processing for charts
function processPriceData(rawData: any[], timeframe: string) {
  // Process and aggregate price data based on timeframe
  const processed = rawData.map(item => ({
    timestamp: item.timestamp,
    open: item.open || item.price,
    high: item.high || item.price * 1.02,
    low: item.low || item.price * 0.98,
    close: item.close || item.price,
    volume: item.volume || Math.random() * 1000000,
  }));

  // Apply smoothing and technical indicators
  const movingAverages = calculateMovingAverages(processed);
  const rsi = calculateRSI(processed);
  const macd = calculateMACD(processed);

  return {
    data: processed,
    indicators: {
      movingAverages,
      rsi,
      macd,
    },
  };
}

// Technical indicator calculations
function calculateMovingAverages(data: any[]) {
  const sma20 = [];
  const ema20 = [];
  
  for (let i = 0; i < data.length; i++) {
    if (i >= 19) {
      // Simple Moving Average (20 periods)
      const sum = data.slice(i - 19, i + 1).reduce((acc, item) => acc + item.close, 0);
      sma20.push(sum / 20);
      
      // Exponential Moving Average (20 periods)
      const multiplier = 2 / (20 + 1);
      const ema = i === 19 
        ? sma20[0] 
        : (data[i].close * multiplier) + (ema20[i - 1] * (1 - multiplier));
      ema20.push(ema);
    } else {
      sma20.push(null);
      ema20.push(null);
    }
  }
  
  return { sma20, ema20 };
}

function calculateRSI(data: any[], period = 14) {
  const rsi = [];
  const gains = [];
  const losses = [];
  
  for (let i = 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    gains.push(change > 0 ? change : 0);
    losses.push(change < 0 ? Math.abs(change) : 0);
    
    if (i >= period) {
      const avgGain = gains.slice(-period).reduce((sum, gain) => sum + gain, 0) / period;
      const avgLoss = losses.slice(-period).reduce((sum, loss) => sum + loss, 0) / period;
      const rs = avgGain / avgLoss;
      const rsiValue = 100 - (100 / (1 + rs));
      rsi.push(rsiValue);
    } else {
      rsi.push(null);
    }
  }
  
  return [null, ...rsi]; // Align with original data array
}

function calculateMACD(data: any[]) {
  const ema12 = [];
  const ema26 = [];
  const macd = [];
  const signal = [];
  const histogram = [];
  
  // Calculate EMAs
  for (let i = 0; i < data.length; i++) {
    if (i === 0) {
      ema12.push(data[i].close);
      ema26.push(data[i].close);
    } else {
      const multiplier12 = 2 / (12 + 1);
      const multiplier26 = 2 / (26 + 1);
      
      ema12.push((data[i].close * multiplier12) + (ema12[i - 1] * (1 - multiplier12)));
      ema26.push((data[i].close * multiplier26) + (ema26[i - 1] * (1 - multiplier26)));
    }
    
    // MACD line
    const macdValue = ema12[i] - ema26[i];
    macd.push(macdValue);
    
    // Signal line (EMA of MACD)
    if (i === 0) {
      signal.push(macdValue);
    } else {
      const signalMultiplier = 2 / (9 + 1);
      signal.push((macdValue * signalMultiplier) + (signal[i - 1] * (1 - signalMultiplier)));
    }
    
    // Histogram
    histogram.push(macdValue - signal[i]);
  }
  
  return { macd, signal, histogram };
}

// Correlation matrix calculation
function calculateCorrelations(positions: Position[]) {
  const correlationMatrix: Record<string, Record<string, number>> = {};
  
  positions.forEach(pos1 => {
    correlationMatrix[pos1.symbol] = {};
    positions.forEach(pos2 => {
      if (pos1.symbol === pos2.symbol) {
        correlationMatrix[pos1.symbol][pos2.symbol] = 1;
      } else {
        // Mock correlation calculation (would use price history in real scenario)
        const correlation = 0.3 + Math.random() * 0.4; // Random correlation between 0.3 and 0.7
        correlationMatrix[pos1.symbol][pos2.symbol] = correlation;
      }
    });
  });
  
  return correlationMatrix;
}

// Main message handler
self.onmessage = function(event: MessageEvent<WorkerMessage>) {
  const { id, type, payload } = event.data;
  
  try {
    let result;
    
    switch (type) {
      case 'CALCULATE_PORTFOLIO_METRICS':
        result = calculatePortfolioMetrics(payload.positions);
        break;
        
      case 'CALCULATE_RISK_METRICS':
        result = calculateRiskMetrics(payload.positions, payload.marketData);
        break;
        
      case 'PROCESS_PRICE_DATA':
        result = processPriceData(payload.data, payload.timeframe);
        break;
        
      case 'CALCULATE_CORRELATIONS':
        result = calculateCorrelations(payload.positions);
        break;
        
      default:
        throw new Error(`Unknown message type: ${type}`);
    }
    
    const response: WorkerResponse = {
      id,
      type,
      result,
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: WorkerResponse = {
      id,
      type,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    
    self.postMessage(response);
  }
};

// Export types for TypeScript support
export type {
  Position,
  PortfolioMetrics,
  RiskMetrics,
};