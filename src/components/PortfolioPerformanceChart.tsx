import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { ZoomIn, ZoomOut, RotateCcw, TrendingUp, TrendingDown } from "lucide-react";

interface CandlestickData {
  timestamp: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  value: number;
}

interface PerformanceChartProps {
  data: CandlestickData[];
  symbol?: string;
}

// Generate realistic OHLC data
const generateCandlestickData = (days: number, basePrice: number = 67000): CandlestickData[] => {
  const data: CandlestickData[] = [];
  let currentPrice = basePrice;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    const open = currentPrice;
    const volatility = 0.03; // 3% daily volatility
    const trend = (Math.random() - 0.5) * 0.02; // Small trend component
    
    const high = open * (1 + Math.random() * volatility);
    const low = open * (1 - Math.random() * volatility);
    const close = open * (1 + trend + (Math.random() - 0.5) * volatility * 0.5);
    
    currentPrice = close;
    
    data.push({
      timestamp: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      date: date.toISOString().split('T')[0],
      open,
      high: Math.max(open, high, close),
      low: Math.min(open, low, close),
      close,
      volume: Math.random() * 1000000 + 500000,
      value: close,
    });
  }
  
  return data;
};

const Candlestick = ({ payload, x, y, width, height }: any) => {
  if (!payload) return null;
  
  const { open, high, low, close } = payload;
  const isPositive = close >= open;
  const color = isPositive ? '#22c55e' : '#ef4444';
  const bodyHeight = Math.abs(close - open);
  const bodyY = Math.min(open, close);
  
  // Scale factors (these would normally come from the chart's scale)
  const priceRange = high - low;
  const pixelPerPrice = height / priceRange;
  
  const wickTop = (high - Math.max(open, close)) * pixelPerPrice;
  const wickBottom = (Math.min(open, close) - low) * pixelPerPrice;
  const candleBodyHeight = bodyHeight * pixelPerPrice;
  const candleBodyY = y + (high - Math.max(open, close)) * pixelPerPrice;
  
  return (
    <g>
      {/* Wick */}
      <line
        x1={x + width / 2}
        y1={y}
        x2={x + width / 2}
        y2={y + height}
        stroke={color}
        strokeWidth={1}
      />
      {/* Body */}
      <rect
        x={x + width * 0.2}
        y={candleBodyY}
        width={width * 0.6}
        height={Math.max(candleBodyHeight, 1)}
        fill={isPositive ? color : color}
        stroke={color}
        strokeWidth={1}
      />
    </g>
  );
};

export function PortfolioPerformanceChart({ data: propData, symbol = 'BTC' }: PerformanceChartProps) {
  const [chartType, setChartType] = useState<'line' | 'candlestick'>('line');
  const [timeframe, setTimeframe] = useState('30D');
  const [zoomDomain, setZoomDomain] = useState<[number, number] | null>(null);
  const [data, setData] = useState<CandlestickData[]>([]);
  
  // Use provided data if available, otherwise generate mock data
  useEffect(() => {
    if (propData && propData.length > 0) {
      setData(propData);
    } else {
      const days = timeframe === '7D' ? 7 : timeframe === '30D' ? 30 : 90;
      const generatedData = generateCandlestickData(days);
      setData(generatedData);
    }
    setZoomDomain(null); // Reset zoom when data changes
  }, [propData, timeframe]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          {chartType === 'candlestick' ? (
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span>Open:</span>
                <span className="font-medium">{formatCurrency(data.open)}</span>
              </div>
              <div className="flex justify-between">
                <span>High:</span>
                <span className="font-medium text-green-500">{formatCurrency(data.high)}</span>
              </div>
              <div className="flex justify-between">
                <span>Low:</span>
                <span className="font-medium text-red-500">{formatCurrency(data.low)}</span>
              </div>
              <div className="flex justify-between">
                <span>Close:</span>
                <span className="font-medium">{formatCurrency(data.close)}</span>
              </div>
              <div className="flex justify-between">
                <span>Volume:</span>
                <span className="font-medium">{data.volume.toLocaleString()}</span>
              </div>
            </div>
          ) : (
            <p className="text-sm font-medium">
              Price: {formatCurrency(data.close)}
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  const handleZoom = (type: 'in' | 'out' | 'reset') => {
    if (type === 'reset') {
      setZoomDomain(null);
      return;
    }
    
    const currentDomain = zoomDomain || [0, data.length - 1];
    const center = (currentDomain[0] + currentDomain[1]) / 2;
    const range = currentDomain[1] - currentDomain[0];
    
    if (type === 'in') {
      const newRange = range * 0.7;
      const newStart = Math.max(0, center - newRange / 2);
      const newEnd = Math.min(data.length - 1, center + newRange / 2);
      setZoomDomain([newStart, newEnd]);
    } else {
      const newRange = Math.min(range * 1.4, data.length - 1);
      const newStart = Math.max(0, center - newRange / 2);
      const newEnd = Math.min(data.length - 1, center + newRange / 2);
      setZoomDomain([newStart, newEnd]);
    }
  };

  const currentPrice = data[data.length - 1]?.close || 0;
  const previousPrice = data[data.length - 2]?.close || 0;
  const priceChange = currentPrice - previousPrice;
  const priceChangePercent = (priceChange / previousPrice) * 100;

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <span>{symbol} Advanced Chart</span>
              {priceChange >= 0 ? (
                <TrendingUp className="h-4 w-4 text-green-500" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-500" />
              )}
            </CardTitle>
            <div className="flex items-center space-x-4 mt-2">
              <div className="text-2xl font-bold">{formatCurrency(currentPrice)}</div>
              <div className={`flex items-center space-x-1 ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                <span>{priceChange >= 0 ? '+' : ''}{formatCurrency(priceChange)}</span>
                <span>({priceChange >= 0 ? '+' : ''}{priceChangePercent.toFixed(2)}%)</span>
              </div>
            </div>
          </div>
          
          <div className="flex space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('in')}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('out')}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleZoom('reset')}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <Tabs value={timeframe} onValueChange={setTimeframe}>
            <TabsList>
              <TabsTrigger value="7D">7D</TabsTrigger>
              <TabsTrigger value="30D">30D</TabsTrigger>
              <TabsTrigger value="90D">90D</TabsTrigger>
            </TabsList>
          </Tabs>
          
          <Tabs value={chartType} onValueChange={(v) => setChartType(v as 'line' | 'candlestick')}>
            <TabsList>
              <TabsTrigger value="line">Line</TabsTrigger>
              <TabsTrigger value="candlestick">Candlestick</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="h-[500px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart
              data={data}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <defs>
                <linearGradient id="lineGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.1)" />
                </linearGradient>
              </defs>
              
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="timestamp"
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                domain={zoomDomain || ['dataMin', 'dataMax']}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
                domain={['dataMin - 1000', 'dataMax + 1000']}
              />
              <Tooltip content={customTooltip} />
              
              {chartType === 'line' ? (
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ 
                    r: 4, 
                    fill: "#8b5cf6",
                    stroke: "#ffffff",
                    strokeWidth: 2
                  }}
                />
              ) : (
                // Note: Recharts doesn't have built-in candlestick, this would need a custom implementation
                <Line
                  type="monotone"
                  dataKey="close"
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  dot={false}
                />
              )}
              
              {/* Support/Resistance levels */}
              <ReferenceLine 
                y={Math.max(...data.map(d => d.high))} 
                stroke="#ef4444" 
                strokeDasharray="5 5" 
                opacity={0.5}
              />
              <ReferenceLine 
                y={Math.min(...data.map(d => d.low))} 
                stroke="#22c55e" 
                strokeDasharray="5 5" 
                opacity={0.5}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}