import { useState, useEffect, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar';
import { PortfolioOverview } from './components/PortfolioOverview';
import { PortfolioChart } from './components/PortfolioChart';
import { HoldingsTable } from './components/HoldingsTable';
import { AssetAllocation } from './components/AssetAllocation';
import { AddAssetDialog } from './components/AddAssetDialog';
import { Button } from './components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { toast } from 'sonner';
import { Toaster } from './components/ui/sonner';
import { 
  PortfolioOverviewSkeleton, 
  PortfolioChartSkeleton, 
  AssetAllocationSkeleton, 
  HoldingsTableSkeleton,
  TabsSkeleton
} from './components/SkeletonLoaders';
import { PortfolioPerformanceChart } from './components/PortfolioPerformanceChart';
import { RiskAnalyticsDashboard } from './components/RiskAnalyticsDashboard';

// State management
import { usePortfolioStore, usePositions, useMetrics } from './store/portfolio';
import { useMarketStore } from './store/market';
import { useMockPriceUpdates } from './hooks/useWebSocket';
import { usePortfolioCalculations } from './hooks/useWebWorker';

// Lazy-loaded components for code splitting
const OrderBookVisualization = lazy(() => import('./components/trading/OrderBookVisualization').then(m => ({ default: m.OrderBookVisualization })));
const AdvancedOrderForm = lazy(() => import('./components/trading/AdvancedOrderForm').then(m => ({ default: m.AdvancedOrderForm })));
const RiskCalculator = lazy(() => import('./components/trading/RiskCalculator').then(m => ({ default: m.RiskCalculator })));
const VirtualizedPositionsList = lazy(() => import('./components/performance/VirtualizedPositionsList').then(m => ({ default: m.VirtualizedPositionsList })));
import {ChartPoint, CandlestickChart} from './types/portfolio'

// Convert Position type to be compatible with existing Holding interface
interface Holding {
  id: string;
  symbol: string;
  name: string;
  amount: number;
  currentPrice: number;
  averageBuyPrice: number;
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

// Mock data for demonstration
const generateMockHoldings = (): Holding[] => [
  {
    id: '1',
    symbol: 'btc',
    name: 'Bitcoin',
    amount: 1.2547,
    currentPrice: 67420 + Math.random() * 2000 - 1000,
    averageBuyPrice: 45000,
    totalValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
  },
  {
    id: '2',
    symbol: 'eth',
    name: 'Ethereum',
    amount: 8.75,
    currentPrice: 3850 + Math.random() * 300 - 150,
    averageBuyPrice: 2800,
    totalValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
  },
  {
    id: '3',
    symbol: 'ada',
    name: 'Cardano',
    amount: 5420,
    currentPrice: 0.65 + Math.random() * 0.1 - 0.05,
    averageBuyPrice: 0.85,
    totalValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
  },
  {
    id: '4',
    symbol: 'sol',
    name: 'Solana',
    amount: 45.2,
    currentPrice: 145.32 + Math.random() * 20 - 10,
    averageBuyPrice: 120,
    totalValue: 0,
    dailyChange: 0,
    dailyChangePercent: 0,
    totalGainLoss: 0,
    totalGainLossPercent: 0,
  },
];

const generateChartData = (days: number): ChartPoint[] => {
  const data: ChartPoint[] = [];
  const baseValue = 120000;
  let currentValue = baseValue;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);

    const change = (Math.random() - 0.5) * 0.1; // +/- 5%
    currentValue *= (1 + change);

    data.push({
      timestamp: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(currentValue),
      date: date.toISOString().split('T')[0],
    });
  }
  
  return data;
};

// Generate candlestick data for individual assets based on current price
const generateAssetCandlestickData = (holding: Holding, days: number = 30) => {
  const data:CandlestickChart[] = [];
  const basePrice = holding.currentPrice;
  let currentPrice = basePrice * 0.9; // Start from 90% of current price to show growth
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const open = currentPrice;
    const volatility = 0.05; // 5% daily volatility for individual assets
    const trend = (basePrice - currentPrice) / (days * basePrice); // Trend toward current price
    
    // Generate realistic OHLC data
    const high = open * (1 + Math.random() * volatility);
    const low = open * (1 - Math.random() * volatility);
    const close = open * (1 + trend + (Math.random() - 0.5) * volatility * 0.3);
    
    currentPrice = close;
    
    data.push({
      timestamp: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: date.toISOString().split('T')[0],
      open: Math.max(0, open),
      high: Math.max(open, high, close),
      low: Math.min(open, low, close),
      close: Math.max(0, close),
      volume: Math.random() * 1000000 + 500000,
      value: Math.max(0, close),
    });
  }
  
  // Ensure the last data point matches current price
  if (data.length > 0) {
    data[data.length - 1].close = holding.currentPrice;
    data[data.length - 1].value = holding.currentPrice;
  }
  
  return data;
};

const chartData7d = generateChartData(7);
const chartData30d = generateChartData(30);
const chartData90d = generateChartData(90);

export default function App() {
  const [activeTab, setActiveTab] = useState('portfolio');
  const [darkMode, setDarkMode] = useState(false);
  const [chartTimeframe, setChartTimeframe] = useState('7D');
  const [isLoading, setIsLoading] = useState(true);

  // Zustand store hooks
  const positions = usePositions();
  const metrics = useMetrics();
  const addPosition = usePortfolioStore(state => state.addPosition);
  const updatePrices = usePortfolioStore(state => state.updatePrices);
  
  // Web worker calculations
  const { calculateMetrics, calculateRiskMetrics } = usePortfolioCalculations();
  
  // Enable mock price updates for development
  useMockPriceUpdates(true);

  // Initialize portfolio with state management
  useEffect(() => {
    const loadData = async () => {
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate loading
      
      const initialPositions = generateMockHoldings().map(holding => ({
        id: holding.id,
        symbol: holding.symbol,
        name: holding.name,
        amount: holding.amount,
        currentPrice: holding.currentPrice,
        averageBuyPrice: holding.averageBuyPrice,
        totalValue: holding.amount * holding.currentPrice,
        dailyChange: holding.dailyChange,
        dailyChangePercent: holding.dailyChangePercent,
        totalGainLoss: holding.totalGainLoss,
        totalGainLossPercent: holding.totalGainLossPercent,
        lastUpdated: Date.now(),
      }));

      // Add positions to Zustand store
      initialPositions.forEach(position => addPosition(position));
      setIsLoading(false);
    };
    
    loadData();
  }, [addPosition]);

  // Performance optimization: Use web workers for heavy calculations
  useEffect(() => {
    if (positions.length > 0) {
      calculateMetrics(positions).then(calculatedMetrics => {
        console.log('Portfolio metrics calculated in worker:', calculatedMetrics);
      }).catch(error => {
        console.error('Worker calculation error:', error);
      });
    }
  }, [positions, calculateMetrics]);

  const updateHoldingsMetrics = (holdings: Holding[]) => {
    holdings.forEach(holding => {
      holding.totalValue = holding.amount * holding.currentPrice;
      holding.dailyChange = holding.currentPrice * (Math.random() - 0.5) * 0.1;
      holding.dailyChangePercent = (holding.dailyChange / holding.currentPrice) * 100;
      holding.totalGainLoss = holding.totalValue - (holding.amount * holding.averageBuyPrice);
      holding.totalGainLossPercent = ((holding.currentPrice - holding.averageBuyPrice) / holding.averageBuyPrice) * 100;
    });
  };

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (darkMode) {
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }
  };

  const handleAddAsset = (asset: { symbol: string; amount: number; purchasePrice: number }) => {
    const cryptoNames: Record<string, string> = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'ADA': 'Cardano',
      'DOT': 'Polkadot',
      'LINK': 'Chainlink',
      'SOL': 'Solana',
      'MATIC': 'Polygon',
      'AVAX': 'Avalanche'
    };

    const cryptoPrices: Record<string, number> = {
      'BTC': 67420,
      'ETH': 3850,
      'ADA': 0.65,
      'DOT': 8.45,
      'LINK': 18.92,
      'SOL': 145.32,
      'MATIC': 0.89,
      'AVAX': 42.18
    };

    const newPosition = {
      id: Date.now().toString(),
      symbol: asset.symbol.toLowerCase(),
      name: cryptoNames[asset.symbol] || asset.symbol,
      amount: asset.amount,
      currentPrice: cryptoPrices[asset.symbol] || asset.purchasePrice,
      averageBuyPrice: asset.purchasePrice,
      totalValue: asset.amount * (cryptoPrices[asset.symbol] || asset.purchasePrice),
      dailyChange: 0,
      dailyChangePercent: 0,
      totalGainLoss: 0,
      totalGainLossPercent: 0,
      lastUpdated: Date.now(),
    };

    addPosition(newPosition);
    toast.success(`Added ${asset.amount} ${asset.symbol} to your portfolio`);
  };

  // Use Zustand store metrics with fallback
  const portfolioStats = {
    totalValue: metrics.totalValue || 0,
    dailyChange: metrics.dailyChange || 0,
    dailyChangePercent: metrics.dailyChangePercent || 0,
    totalAssets: metrics.totalAssets || 0,
    bestPerformer: metrics.bestPerformer || 'N/A',
    worstPerformer: metrics.worstPerformer || 'N/A',
  };

  const allocationData = positions.map((position, index) => ({
    name: position.name,
    symbol: position.symbol,
    value: position.totalValue,
    percentage: portfolioStats.totalValue > 0 ? (position.totalValue / portfolioStats.totalValue) * 100 : 0,
    color: `hsl(var(--chart-${(index % 5) + 1}))`,
  }));

  const getChartData = () => {
    switch (chartTimeframe) {
      case '7D': return chartData7d;
      case '30D': return chartData30d;
      case '90D': return chartData90d;
      default: return chartData7d;
    }
  };

  const renderContent = () => {
    if (isLoading && activeTab === 'portfolio') {
      return (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1>Portfolio Dashboard</h1>
            <Button disabled>
              <div className="h-4 w-4 mr-2 bg-muted rounded animate-pulse" />
              Add Asset
            </Button>
          </div>
          
          <PortfolioOverviewSkeleton />
          
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <div className="mb-4">
                <TabsSkeleton />
              </div>
              <PortfolioChartSkeleton />
            </div>
            
            <AssetAllocationSkeleton />
          </div>
          
          <HoldingsTableSkeleton />
        </div>
      );
    }

    switch (activeTab) {
      case 'portfolio':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1>Portfolio Dashboard</h1>
              <AddAssetDialog onAddAsset={handleAddAsset} />
            </div>
            
            <PortfolioOverview stats={portfolioStats} />
            
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <div className="mb-4">
                  <Tabs value={chartTimeframe} onValueChange={setChartTimeframe}>
                    <TabsList>
                      <TabsTrigger value="7D">7D</TabsTrigger>
                      <TabsTrigger value="30D">30D</TabsTrigger>
                      <TabsTrigger value="90D">90D</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                <PortfolioChart data={getChartData()} timeframe={chartTimeframe} />
              </div>
              
              <AssetAllocation data={allocationData} />
            </div>
            
            <HoldingsTable 
              holdings={positions}
              onSellAsset={(id) => toast.info('Sell functionality would be implemented here')}
              onBuyMore={(id) => toast.info('Buy more functionality would be implemented here')}
            />
          </div>
        );
      
      case 'advanced-charts':
        const primaryPosition = positions[0] || {
          symbol: 'btc',
          name: 'Bitcoin',
          currentPrice: 67420,
          amount: 1,
          averageBuyPrice: 60000,
          totalValue: 67420,
          dailyChange: 0,
          dailyChangePercent: 0,
          totalGainLoss: 0,
          totalGainLossPercent: 0,
          id: 'default',
          lastUpdated: Date.now(),
        };
        
        const candlestickData = generateAssetCandlestickData(primaryPosition, 30);
        
        return (
          <div className="space-y-6">
            <h1>Advanced Trading Charts</h1>
            <PortfolioPerformanceChart 
              data={candlestickData} 
              symbol={primaryPosition.symbol.toUpperCase()} 
            />
          </div>
        );

      case 'trading':
        return (
          <div className="space-y-6">
            <h1>Trading Center</h1>
            <div className="grid gap-6 lg:grid-cols-3">
              <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
                <OrderBookVisualization 
                  symbol={positions[0]?.symbol || 'btc'}
                  onPriceClick={(price, side) => {
                    toast.info(`Clicked ${side} at ${price}`);
                  }}
                />
              </Suspense>
              
              <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
                <AdvancedOrderForm 
                  symbol={positions[0]?.symbol || 'btc'}
                  onOrderSubmit={(order) => {
                    toast.success(`Order submitted: ${order.side} ${order.amount} ${order.symbol.toUpperCase()}`);
                  }}
                />
              </Suspense>

              <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
                <RiskCalculator 
                  symbol={positions[0]?.symbol || 'btc'}
                  side="buy"
                  onCalculationChange={(calc) => {
                    console.log('Risk calculation updated:', calc);
                  }}
                />
              </Suspense>
            </div>
          </div>
        );
      
      case 'positions':
        return (
          <div className="space-y-6">
            <h1>All Positions</h1>
            <Suspense fallback={<div className="h-96 bg-muted animate-pulse rounded-lg" />}>
              <VirtualizedPositionsList 
                height={700}
                onPositionClick={(position) => {
                  toast.info(`Clicked position: ${position.symbol.toUpperCase()}`);
                }}
                onPositionAction={(position, action) => {
                  toast.info(`${action.toUpperCase()} action for ${position.symbol.toUpperCase()}`);
                }}
              />
            </Suspense>
          </div>
        );
      
      case 'risk-analytics':
        return <RiskAnalyticsDashboard />;
      
      default:
        return (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <h2 className="text-lg font-medium mb-2">Coming Soon</h2>
              <p className="text-muted-foreground">
                This section is under development
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-background">
      <Sidebar 
        activeTab={activeTab}
        onTabChange={setActiveTab}
        darkMode={darkMode}
        onToggleDarkMode={toggleDarkMode}
      />
      
      <main className="flex-1 overflow-auto">
        <div className="p-6">
          {renderContent()}
        </div>
      </main>
      
      <Toaster />
    </div>
  );
}