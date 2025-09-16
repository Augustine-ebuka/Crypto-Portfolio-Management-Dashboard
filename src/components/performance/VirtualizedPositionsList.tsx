import React, { memo, useMemo, useCallback, useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { ScrollArea } from '../ui/scroll-area';
import { usePositions } from '../../store/portfolio';
import { designTokens } from '../../design-system/tokens';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  MoreHorizontal,
  Filter,
  ArrowUpDown
} from 'lucide-react';

interface Position {
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
  lastUpdated: number;
}

interface VirtualizedPositionsListProps {
  height?: number;
  className?: string;
  onPositionClick?: (position: Position) => void;
  onPositionAction?: (position: Position, action: 'buy' | 'sell' | 'edit') => void;
}

// Custom virtualization hook
function useVirtualization(
  items: Position[], 
  containerHeight: number, 
  itemHeight: number = 56
) {
  const [scrollTop, setScrollTop] = useState(0);
  
  const startIndex = Math.floor(scrollTop / itemHeight);
  const endIndex = Math.min(
    startIndex + Math.ceil(containerHeight / itemHeight) + 1,
    items.length - 1
  );
  
  const visibleItems = items.slice(startIndex, endIndex + 1);
  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    startIndex,
    endIndex,
    onScroll: (scrollTop: number) => setScrollTop(scrollTop)
  };
}

// Memoized row component for optimal performance
const PositionRow = memo<{
  position: Position;
  onPositionClick?: (position: Position) => void;
  onPositionAction?: (position: Position, action: 'buy' | 'sell' | 'edit') => void;
}>(({ position, onPositionClick, onPositionAction }) => {
  // wrapped my function in callback to limit recalling of function
  const handleClick = useCallback(() => {
    onPositionClick?.(position);
  }, [position, onPositionClick]);

  const handleAction = useCallback((action: 'buy' | 'sell' | 'edit') => {
    onPositionAction?.(position, action);
  }, [position, onPositionAction]);

  const isPositive = position.totalGainLossPercent >= 0;
  const formatCurrency = (value: number) => 
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
  const formatPercent = (value: number) => 
    `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;

  return (
    <div 
      className="px-4 py-2 border-b hover:bg-muted/50 cursor-pointer transition-colors"
      style={{ height: '56px' }}
      onClick={handleClick}
    >
      <div className="grid grid-cols-12 gap-4 items-center text-sm h-full">
        {/* Symbol & Name */}
        <div className="col-span-2">
          <div className="font-medium">{position.symbol.toUpperCase()}</div>
          <div className="text-xs text-muted-foreground truncate">{position.name}</div>
        </div>

        {/* Amount */}
        <div className="col-span-1 text-right font-mono">
          {position.amount.toFixed(4)}
        </div>

        {/* Current Price */}
        <div className="col-span-2 text-right">
          <div className="font-mono">{formatCurrency(position.currentPrice)}</div>
          <div className={`text-xs ${position.dailyChangePercent >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {formatPercent(position.dailyChangePercent)}
          </div>
        </div>

        {/* Average Buy Price */}
        <div className="col-span-1 text-right font-mono text-muted-foreground">
          {formatCurrency(position.averageBuyPrice)}
        </div>

        {/* Total Value */}
        <div className="col-span-2 text-right">
          <div className="font-mono font-medium">{formatCurrency(position.totalValue)}</div>
        </div>

        {/* P&L */}
        <div className="col-span-2 text-right">
          <div className={`font-mono ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {formatCurrency(position.totalGainLoss)}
          </div>
          <div className={`text-xs flex items-center justify-end ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {formatPercent(position.totalGainLossPercent)}
          </div>
        </div>

        {/* Actions */}
        <div className="col-span-2 flex justify-end space-x-1">
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs text-green-600 hover:text-green-700"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('buy');
            }}
          >
            Buy
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('sell');
            }}
          >
            Sell
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 w-6 p-0"
            onClick={(e) => {
              e.stopPropagation();
              handleAction('edit');
            }}
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </div>
  );
});

PositionRow.displayName = 'PositionRow';

// Generate mock positions for demonstration
const generateMockPositions = (count: number): Position[] => {
  const symbols = ['BTC', 'ETH', 'ADA', 'SOL', 'DOT', 'LINK', 'MATIC', 'AVAX', 'ATOM', 'FTM'];
  const names = ['Bitcoin', 'Ethereum', 'Cardano', 'Solana', 'Polkadot', 'Chainlink', 'Polygon', 'Avalanche', 'Cosmos', 'Fantom'];
  const basePrice = [67420, 3850, 0.65, 145.32, 8.45, 18.92, 0.89, 42.18, 12.34, 0.67];
  
  return Array.from({ length: count }, (_, index) => {
    const symbolIndex = index % symbols.length;
    const currentPrice = basePrice[symbolIndex] * (1 + (Math.random() - 0.5) * 0.1);
    const averageBuyPrice = currentPrice * (0.8 + Math.random() * 0.4);
    const amount = Math.random() * 100 + 1;
    const totalValue = amount * currentPrice;
    const totalGainLoss = totalValue - (amount * averageBuyPrice);
    const totalGainLossPercent = ((currentPrice - averageBuyPrice) / averageBuyPrice) * 100;
    const dailyChangePercent = (Math.random() - 0.5) * 10;

    return {
      id: `position_${index}`,
      symbol: symbols[symbolIndex].toLowerCase(),
      name: names[symbolIndex],
      amount,
      currentPrice,
      averageBuyPrice,
      totalValue,
      dailyChange: currentPrice * dailyChangePercent / 100,
      dailyChangePercent,
      totalGainLoss,
      totalGainLossPercent,
      lastUpdated: Date.now(),
    };
  });
};

export const VirtualizedPositionsList: React.FC<VirtualizedPositionsListProps> = memo(({
  height = 600,
  className = '',
  onPositionClick,
  onPositionAction,
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [sortBy, setSortBy] = React.useState<'symbol' | 'value' | 'pnl'>('value');
  const [sortOrder, setSortOrder] = React.useState<'asc' | 'desc'>('desc');

  // Use real positions if available, otherwise generate mock data
  const realPositions = usePositions();
  const [mockPositions] = React.useState(() => generateMockPositions(10000));
  
  const positions = realPositions.length > 0 ? realPositions : mockPositions;

  // Filter and sort positions
  const filteredAndSortedPositions = useMemo(() => {
    let filtered = positions.filter(position =>
      position.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      position.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'symbol':
          comparison = a.symbol.localeCompare(b.symbol);
          break;
        case 'value':
          comparison = a.totalValue - b.totalValue;
          break;
        case 'pnl':
          comparison = a.totalGainLossPercent - b.totalGainLossPercent;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [positions, searchTerm, sortBy, sortOrder]);

  const handleSort = useCallback((newSortBy: 'symbol' | 'value' | 'pnl') => {
    if (sortBy === newSortBy) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(newSortBy);
      setSortOrder('desc');
    }
  }, [sortBy, sortOrder]);

  // Calculate totals for summary
  const totals = useMemo(() => {
    return filteredAndSortedPositions.reduce(
      (acc, position) => ({
        totalValue: acc.totalValue + position.totalValue,
        totalPnL: acc.totalPnL + position.totalGainLoss,
        winningPositions: acc.winningPositions + (position.totalGainLoss > 0 ? 1 : 0),
      }),
      { totalValue: 0, totalPnL: 0, winningPositions: 0 }
    );
  }, [filteredAndSortedPositions]);

  // Custom virtualization for large datasets
  const containerRef = useRef<HTMLDivElement>(null);
  const containerHeight = height - 200; // Account for header and footer
  const { visibleItems, totalHeight, offsetY, onScroll } = useVirtualization(
    filteredAndSortedPositions, 
    containerHeight
  );

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    onScroll(scrollTop);
  }, [onScroll]);

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle>Positions ({filteredAndSortedPositions.length.toLocaleString()})</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline">
              Total: ${totals.totalValue.toLocaleString()}
            </Badge>
            <Badge variant={totals.totalPnL >= 0 ? 'default' : 'destructive'}>
              P&L: {totals.totalPnL >= 0 ? '+' : ''}${totals.totalPnL.toFixed(2)}
            </Badge>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search positions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('symbol')}
              className="flex items-center space-x-1"
            >
              <span>Symbol</span>
              <ArrowUpDown className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('value')}
              className="flex items-center space-x-1"
            >
              <span>Value</span>
              <ArrowUpDown className="h-3 w-3" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSort('pnl')}
              className="flex items-center space-x-1"
            >
              <span>P&L</span>
              <ArrowUpDown className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header */}
        <div className="px-4 py-2 border-b bg-muted/30">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-muted-foreground">
            <div className="col-span-2">Asset</div>
            <div className="col-span-1 text-right">Amount</div>
            <div className="col-span-2 text-right">Current Price</div>
            <div className="col-span-1 text-right">Avg. Buy</div>
            <div className="col-span-2 text-right">Total Value</div>
            <div className="col-span-2 text-right">P&L</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
        </div>

        {/* Custom Virtualized List */}
        <div 
          ref={containerRef}
          className="relative overflow-auto"
          style={{ height: containerHeight }}
          onScroll={handleScroll}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map((position, index) => (
                <PositionRow
                  key={position.id}
                  position={position}
                  onPositionClick={onPositionClick}
                  onPositionAction={onPositionAction}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Footer Summary */}
        <div className="px-4 py-3 border-t bg-muted/30">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-4">
              <span>Showing {filteredAndSortedPositions.length} positions</span>
              <span className="text-muted-foreground">
                {totals.winningPositions} winning ({((totals.winningPositions / filteredAndSortedPositions.length) * 100).toFixed(1)}%)
              </span>
            </div>
            <div className="flex items-center space-x-4">
              <span>
                Total Value: <span className="font-mono">${totals.totalValue.toLocaleString()}</span>
              </span>
              <span className={totals.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}>
                Total P&L: <span className="font-mono">
                  {totals.totalPnL >= 0 ? '+' : ''}${totals.totalPnL.toFixed(2)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

VirtualizedPositionsList.displayName = 'VirtualizedPositionsList';