import React, { memo, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ScrollArea } from '../ui/scroll-area';
import { useOrderBook, useMarketData } from '../../store/market';
import { designTokens } from '../../design-system/tokens';
import { TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

interface OrderBookVisualizationProps {
  symbol: string;
  maxEntries?: number;
  onPriceClick?: (price: number, side: 'buy' | 'sell') => void;
  className?: string;
}

// Memoized row component for performance
const OrderBookRow = memo<{
  entry: OrderBookEntry;
  side: 'bid' | 'ask';
  maxTotal: number;
  onPriceClick?: (price: number, side: 'buy' | 'sell') => void;
}>(({ entry, side, maxTotal, onPriceClick }) => {
  const percentage = (entry.total / maxTotal) * 100;
  const isBid = side === 'bid';
  
  const handleClick = useCallback(() => {
    onPriceClick?.(entry.price, isBid ? 'buy' : 'sell');
  }, [entry.price, isBid, onPriceClick]);

  return (
    <div
      className={`
        relative grid grid-cols-3 gap-2 py-1 px-2 text-xs cursor-pointer
        hover:bg-muted/50 transition-colors
        ${isBid ? 'hover:bg-green-500/10' : 'hover:bg-red-500/10'}
      `}
      onClick={handleClick}
      style={{ fontFamily: designTokens.typography.fontFamily.mono.join(', ') }}
    >
      {/* Background bar showing volume */}
      <div
        className={`
          absolute inset-0 transition-all duration-150
          ${isBid ? 'bg-green-500/10' : 'bg-red-500/10'}
        `}
        style={{
          width: `${percentage}%`,
          right: isBid ? 0 : 'auto',
          left: isBid ? 'auto' : 0,
        }}
      />
      
      {/* Price */}
      <div className={`relative z-10 text-right ${isBid ? 'text-green-500' : 'text-red-500'} font-medium`}>
        {entry.price.toFixed(2)}
      </div>
      
      {/* Amount */}
      <div className="relative z-10 text-right text-foreground">
        {entry.amount.toFixed(4)}
      </div>
      
      {/* Total */}
      <div className="relative z-10 text-right text-muted-foreground">
        {entry.total.toFixed(2)}
      </div>
    </div>
  );
});

OrderBookRow.displayName = 'OrderBookRow';

// Generate mock order book data for demonstration
const generateMockOrderBook = (symbol: string, marketPrice: number = 67420): { bids: OrderBookEntry[]; asks: OrderBookEntry[]; } => {
  const bids: OrderBookEntry[] = [];
  const asks: OrderBookEntry[] = [];
  
  let totalBid = 0;
  let totalAsk = 0;
  
  // Generate bids (below market price)
  for (let i = 0; i < 20; i++) {
    const price = marketPrice - (i + 1) * (marketPrice * 0.001); // 0.1% increments
    const amount = Math.random() * 5 + 0.1;
    totalBid += amount;
    
    bids.push({
      price,
      amount,
      total: totalBid,
    });
  }
  
  // Generate asks (above market price)
  for (let i = 0; i < 20; i++) {
    const price = marketPrice + (i + 1) * (marketPrice * 0.001); // 0.1% increments
    const amount = Math.random() * 5 + 0.1;
    totalAsk += amount;
    
    asks.push({
      price,
      amount,
      total: totalAsk,
    });
  }
  
  return { bids, asks };
};

export const OrderBookVisualization: React.FC<OrderBookVisualizationProps> = memo(({
  symbol,
  maxEntries = 15,
  onPriceClick,
  className = '',
}) => {
  const orderBook = useOrderBook(symbol);
  const marketData = useMarketData(symbol);
  
  // Generate mock data if no real data available
  const mockData = useMemo(() => {
    return generateMockOrderBook(symbol, marketData?.price || 67420);
  }, [symbol, marketData?.price]);
  
  const { bids, asks } = orderBook || mockData;
  
  // Limit entries and calculate totals for visualization
  const limitedBids = useMemo(() => bids.slice(0, maxEntries), [bids, maxEntries]);
  const limitedAsks = useMemo(() => asks.slice(0, maxEntries), [asks, maxEntries]);
  
  const maxBidTotal = useMemo(() => Math.max(...limitedBids.map(b => b.total), 0), [limitedBids]);
  const maxAskTotal = useMemo(() => Math.max(...limitedAsks.map(a => a.total), 0), [limitedAsks]);
  const maxTotal = Math.max(maxBidTotal, maxAskTotal);
  
  // Calculate spread
  const bestBid = limitedBids[0]?.price || 0;
  const bestAsk = limitedAsks[0]?.price || 0;
  const spread = bestAsk - bestBid;
  const spreadPercent = bestBid > 0 ? (spread / bestBid) * 100 : 0;
  
  const currentPrice = marketData?.price || bestBid + (spread / 2);
  const priceChange = marketData?.changePercent24h || 0;

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{symbol.toUpperCase()} Order Book</CardTitle>
          <div className="flex items-center space-x-2">
            <Badge variant="outline" className="text-xs">
              <Activity className="h-3 w-3 mr-1" />
              Live
            </Badge>
          </div>
        </div>
        
        {/* Current Price & Spread */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm text-muted-foreground">Last Price:</span>
              <span 
                className={`font-mono font-semibold ${priceChange >= 0 ? 'text-green-500' : 'text-red-500'}`}
              >
                ${currentPrice.toFixed(2)}
              </span>
              {priceChange >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
            </div>
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Spread: ${spread.toFixed(2)} ({spreadPercent.toFixed(3)}%)</span>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => console.log('Refresh order book')}
            >
              Refresh
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Header */}
        <div className="grid grid-cols-3 gap-2 px-2 py-2 text-xs font-medium text-muted-foreground border-b">
          <div className="text-right">Price (USD)</div>
          <div className="text-right">Amount</div>
          <div className="text-right">Total</div>
        </div>

        <div className="flex flex-col h-[500px]">
          {/* Asks (Sell Orders) */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div className="flex flex-col-reverse">
                {limitedAsks.map((ask, index) => (
                  <OrderBookRow
                    key={`ask-${index}`}
                    entry={ask}
                    side="ask"
                    maxTotal={maxTotal}
                    onPriceClick={onPriceClick}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Spread Indicator */}
          <div className="py-2 px-2 border-y bg-muted/30">
            <div className="flex items-center justify-center space-x-4 text-xs">
              <span className="text-green-500 font-mono">{bestBid.toFixed(2)}</span>
              <span className="text-muted-foreground">Spread: {spread.toFixed(2)}</span>
              <span className="text-red-500 font-mono">{bestAsk.toFixed(2)}</span>
            </div>
          </div>

          {/* Bids (Buy Orders) */}
          <div className="flex-1">
            <ScrollArea className="h-full">
              <div>
                {limitedBids.map((bid, index) => (
                  <OrderBookRow
                    key={`bid-${index}`}
                    entry={bid}
                    side="bid"
                    maxTotal={maxTotal}
                    onPriceClick={onPriceClick}
                  />
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

OrderBookVisualization.displayName = 'OrderBookVisualization';