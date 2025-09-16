import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Percent, PieChart } from "lucide-react";

interface PortfolioStats {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalAssets: number;
  bestPerformer: string;
  worstPerformer: string;
}

interface PortfolioOverviewProps {
  stats: PortfolioStats;
}

export function PortfolioOverview({ stats }: PortfolioOverviewProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value > 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Portfolio Value</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{formatCurrency(stats.totalValue)}</div>
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            {stats.dailyChange >= 0 ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={stats.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}>
              {formatCurrency(stats.dailyChange)} ({formatPercent(stats.dailyChangePercent)})
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">24h Change</CardTitle>
          <Percent className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${stats.dailyChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(stats.dailyChangePercent)}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatCurrency(Math.abs(stats.dailyChange))} total change
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Assets</CardTitle>
          <PieChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{stats.totalAssets}</div>
          <div className="text-xs text-muted-foreground">
            Different cryptocurrencies
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Performance</CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Best:</span>
              <Badge variant="secondary" className="text-green-500">
                {stats.bestPerformer}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground">Worst:</span>
              <Badge variant="secondary" className="text-red-500">
                {stats.worstPerformer}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}