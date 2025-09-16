import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartData {
  timestamp: string;
  value: number;
  date: string;
}

interface PortfolioChartProps {
  data: ChartData[];
  timeframe: string;
}

export function PortfolioChart({ data, timeframe }: PortfolioChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatTooltipValue = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const customTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-sm font-medium">
            Portfolio Value: {formatTooltipValue(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  // Calculate trend for line color
  const firstValue = data[0]?.value || 0;
  const lastValue = data[data.length - 1]?.value || 0;
  const isPositiveTrend = lastValue >= firstValue;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Portfolio Performance - {timeframe}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <defs>
                <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(139, 92, 246, 0.8)" />
                  <stop offset="50%" stopColor="rgba(139, 92, 246, 0.4)" />
                  <stop offset="100%" stopColor="rgba(139, 92, 246, 0.05)" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis 
                dataKey="timestamp" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <YAxis 
                tickFormatter={formatCurrency}
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={customTooltip} />
              <Area
                type="monotone"
                dataKey="value"
                stroke="#8b5cf6"
                strokeWidth={2}
                fill="url(#portfolioGradient)"
                dot={false}
                activeDot={{ 
                  r: 4, 
                  fill: "#8b5cf6",
                  stroke: "#ffffff",
                  strokeWidth: 2
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}