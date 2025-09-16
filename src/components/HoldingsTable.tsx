import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { TrendingUp, TrendingDown, MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu";

export interface Holding {
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

interface HoldingsTableProps {
  holdings: Holding[];
  onSellAsset?: (id: string) => void;
  onBuyMore?: (id: string) => void;
}

export function HoldingsTable({ holdings, onSellAsset, onBuyMore }: HoldingsTableProps) {
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

  const formatAmount = (amount: number, symbol: string) => {
    return `${amount.toLocaleString(undefined, { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 8 
    })} ${symbol}`;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Holdings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Asset</TableHead>
                <TableHead className="text-right">Holdings</TableHead>
                <TableHead className="text-right">Price</TableHead>
                <TableHead className="text-right">24h Change</TableHead>
                <TableHead className="text-right">Total Value</TableHead>
                <TableHead className="text-right">P&L</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.map((holding) => (
                <TableRow key={holding.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{holding.symbol.toUpperCase()}</div>
                      <div className="text-sm text-muted-foreground">{holding.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div>
                      <div>{formatAmount(holding.amount, holding.symbol.toUpperCase())}</div>
                      <div className="text-sm text-muted-foreground">
                        Avg: {formatCurrency(holding.averageBuyPrice)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(holding.currentPrice)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-1">
                      {holding.dailyChange >= 0 ? (
                        <TrendingUp className="h-3 w-3 text-green-500" />
                      ) : (
                        <TrendingDown className="h-3 w-3 text-red-500" />
                      )}
                      <div className={holding.dailyChange >= 0 ? 'text-green-500' : 'text-red-500'}>
                        <div>{formatPercent(holding.dailyChangePercent)}</div>
                        <div className="text-xs">{formatCurrency(holding.dailyChange)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {formatCurrency(holding.totalValue)}
                  </TableCell>
                  <TableCell className="text-right">
                    <Badge 
                      variant={holding.totalGainLoss >= 0 ? "default" : "destructive"}
                      className={holding.totalGainLoss >= 0 ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' : ''}
                    >
                      {formatPercent(holding.totalGainLossPercent)}
                    </Badge>
                    <div className={`text-xs mt-1 ${holding.totalGainLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                      {formatCurrency(holding.totalGainLoss)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => onBuyMore?.(holding.id)}>
                          Buy More
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onSellAsset?.(holding.id)}>
                          Sell
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}