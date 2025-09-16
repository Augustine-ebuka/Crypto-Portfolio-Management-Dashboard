import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Progress } from "./ui/progress";
import { 
  LineChart, 
  Line, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { AlertTriangle, TrendingDown, Shield, Activity } from "lucide-react";

interface RiskMetrics {
  var95: number;
  var99: number;
  expectedShortfall: number;
  maxDrawdown: number;
  volatility: number;
  sharpeRatio: number;
  beta: number;
  correlation: number;
}

interface DrawdownData {
  date: string;
  portfolioValue: number;
  drawdown: number;
  peak: number;
  recovery: boolean;
}

interface VaRData {
  scenario: string;
  probability: number;
  loss: number;
  impact: 'Low' | 'Medium' | 'High' | 'Critical';
}

// Generate realistic drawdown data
const generateDrawdownData = (days: number): DrawdownData[] => {
  const data: DrawdownData[] = [];
  let portfolioValue = 100000;
  let peak = portfolioValue;
  
  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    
    // Simulate portfolio changes with occasional drawdowns
    const dailyReturn = (Math.random() - 0.45) * 0.05; // Slightly negative bias for realism
    portfolioValue *= (1 + dailyReturn);
    
    if (portfolioValue > peak) {
      peak = portfolioValue;
    }
    
    const drawdown = ((peak - portfolioValue) / peak) * 100;
    const recovery = portfolioValue >= peak * 0.95; // Within 5% of peak
    
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      portfolioValue,
      drawdown: -drawdown, // Negative for visualization
      peak,
      recovery,
    });
  }
  
  return data;
};

// Generate VaR scenarios
const generateVaRScenarios = (): VaRData[] => [
  { scenario: 'Market Crash (-20%)', probability: 5, loss: -25000, impact: 'Critical' },
  { scenario: 'Crypto Winter (-50%)', probability: 10, loss: -62500, impact: 'Critical' },
  { scenario: 'Regulation Impact (-15%)', probability: 15, loss: -18750, impact: 'High' },
  { scenario: 'Flash Crash (-10%)', probability: 25, loss: -12500, impact: 'Medium' },
  { scenario: 'Normal Volatility (-5%)', probability: 35, loss: -6250, impact: 'Low' },
  { scenario: 'Minor Correction (-2%)', probability: 60, loss: -2500, impact: 'Low' },
];

export function RiskAnalyticsDashboard() {
  const [activeTab, setActiveTab] = useState('overview');
  const [drawdownData, setDrawdownData] = useState<DrawdownData[]>([]);
  const [varScenarios, setVarScenarios] = useState<VaRData[]>([]);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics>({
    var95: -8500,
    var99: -15200,
    expectedShortfall: -18750,
    maxDrawdown: -23.5,
    volatility: 35.2,
    sharpeRatio: 1.45,
    beta: 1.2,
    correlation: 0.75,
  });

  useEffect(() => {
    setDrawdownData(generateDrawdownData(90));
    setVarScenarios(generateVaRScenarios());
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(Math.abs(value));
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getRiskLevel = (value: number, thresholds: [number, number, number]) => {
    if (Math.abs(value) <= thresholds[0]) return 'Low';
    if (Math.abs(value) <= thresholds[1]) return 'Medium';
    if (Math.abs(value) <= thresholds[2]) return 'High';
    return 'Critical';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-500';
      case 'Medium': return 'text-yellow-500';
      case 'High': return 'text-orange-500';
      case 'Critical': return 'text-red-500';
      default: return 'text-muted-foreground';
    }
  };

  const drawdownTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-muted-foreground mb-2">{label}</p>
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Portfolio Value:</span>
              <span className="font-medium">{formatCurrency(payload[0].payload.portfolioValue)}</span>
            </div>
            <div className="flex justify-between">
              <span>Drawdown:</span>
              <span className="font-medium text-red-500">{formatPercent(payload[0].payload.drawdown)}</span>
            </div>
            <div className="flex justify-between">
              <span>Peak:</span>
              <span className="font-medium">{formatCurrency(payload[0].payload.peak)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Risk Analytics Dashboard</h2>
        <Badge variant="outline" className="flex items-center space-x-1">
          <Shield className="h-3 w-3" />
          <span>Portfolio Health Check</span>
        </Badge>
      </div>

      {/* Risk Overview Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Value at Risk (95%)</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatCurrency(riskMetrics.var95)}</div>
            <p className="text-xs text-muted-foreground">
              1-day potential loss with 95% confidence
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Max Drawdown</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{formatPercent(riskMetrics.maxDrawdown)}</div>
            <p className="text-xs text-muted-foreground">
              Largest peak-to-trough decline
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
            <Activity className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatPercent(riskMetrics.volatility)}</div>
            <p className="text-xs text-muted-foreground">
              Annualized standard deviation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <Shield className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{riskMetrics.sharpeRatio}</div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted return measure
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Risk Overview</TabsTrigger>
          <TabsTrigger value="drawdown">Drawdown Analysis</TabsTrigger>
          <TabsTrigger value="var">VaR Scenarios</TabsTrigger>
          <TabsTrigger value="correlation">Correlation Matrix</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Risk Gauge */}
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Risk Level</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Risk Score</span>
                    <span className="font-medium">7.2/10</span>
                  </div>
                  <Progress value={72} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Conservative</span>
                    <span>Aggressive</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Concentration Risk</span>
                    <Badge variant="secondary" className="text-orange-500">Medium</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Liquidity Risk</span>
                    <Badge variant="secondary" className="text-green-500">Low</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Market Risk</span>
                    <Badge variant="secondary" className="text-red-500">High</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Expected Shortfall */}
            <Card>
              <CardHeader>
                <CardTitle>Expected Shortfall (CVaR)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-500 mb-2">
                  {formatCurrency(riskMetrics.expectedShortfall)}
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Average loss in worst 5% of scenarios
                </p>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>vs VaR 95%</span>
                    <span className="text-red-500">
                      {formatCurrency(riskMetrics.expectedShortfall - riskMetrics.var95)} worse
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>vs VaR 99%</span>
                    <span className="text-red-500">
                      {formatCurrency(riskMetrics.expectedShortfall - riskMetrics.var99)} worse
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="drawdown" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Drawdown Analysis - Last 90 Days</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={drawdownData}>
                    <defs>
                      <linearGradient id="drawdownGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="rgba(239, 68, 68, 0.1)" />
                        <stop offset="100%" stopColor="rgba(239, 68, 68, 0.6)" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                    <XAxis 
                      dataKey="date"
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${value}%`}
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={drawdownTooltip} />
                    <Area
                      type="monotone"
                      dataKey="drawdown"
                      stroke="#ef4444"
                      strokeWidth={2}
                      fill="url(#drawdownGradient)"
                    />
                    <ReferenceLine y={-10} stroke="#f59e0b" strokeDasharray="5 5" />
                    <ReferenceLine y={-20} stroke="#ef4444" strokeDasharray="5 5" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="var" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Value at Risk Scenarios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {varScenarios.map((scenario, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex-1">
                      <div className="font-medium">{scenario.scenario}</div>
                      <div className="text-sm text-muted-foreground">
                        {scenario.probability}% probability
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-bold text-red-500">
                        {formatCurrency(scenario.loss)}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={getRiskColor(scenario.impact)}
                      >
                        {scenario.impact}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="correlation" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Asset Correlation Heatmap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Correlation matrix visualization would be implemented here</p>
                <p className="text-sm">Showing relationships between portfolio assets</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}