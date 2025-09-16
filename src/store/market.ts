import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface MarketData {
  symbol: string;
  price: number;
  change24h: number;
  changePercent24h: number;
  volume24h: number;
  marketCap: number;
  lastUpdated: number;
}

export interface OrderBookEntry {
  price: number;
  amount: number;
  total: number;
}

export interface OrderBook {
  symbol: string;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  lastUpdated: number;
}

export interface MarketState {
  // Market data
  marketData: Record<string, MarketData>;
  orderBooks: Record<string, OrderBook>;
  
  // Real-time updates
  priceUpdates: Record<string, number>;
  lastPriceUpdate: number;
  
  // WebSocket management
  subscribedSymbols: Set<string>;
  connectionRetryCount: number;
  maxRetries: number;
  
  // Actions
  updateMarketData: (symbol: string, data: Partial<MarketData>) => void;
  updateOrderBook: (symbol: string, orderBook: Partial<OrderBook>) => void;
  updatePrice: (symbol: string, price: number) => void;
  bulkUpdatePrices: (updates: Record<string, number>) => void;
  
  // Subscriptions
  subscribeToSymbol: (symbol: string) => void;
  unsubscribeFromSymbol: (symbol: string) => void;
  
  // Connection management
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
}

export const useMarketStore = create<MarketState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        marketData: {},
        orderBooks: {},
        priceUpdates: {},
        lastPriceUpdate: 0,
        subscribedSymbols: new Set(),
        connectionRetryCount: 0,
        maxRetries: 5,

        updateMarketData: (symbol, data) => set((state) => {
          if (!state.marketData[symbol]) {
            state.marketData[symbol] = {
              symbol,
              price: 0,
              change24h: 0,
              changePercent24h: 0,
              volume24h: 0,
              marketCap: 0,
              lastUpdated: Date.now(),
            };
          }
          
          Object.assign(state.marketData[symbol], data, {
            lastUpdated: Date.now(),
          });
        }),

        updateOrderBook: (symbol, orderBook) => set((state) => {
          state.orderBooks[symbol] = {
            ...state.orderBooks[symbol],
            ...orderBook,
            symbol,
            bids: [],
            asks: [],
            lastUpdated: Date.now(),
          };
        }),

        updatePrice: (symbol, price) => set((state) => {
          state.priceUpdates[symbol] = price;
          state.lastPriceUpdate = Date.now();
          
          if (state.marketData[symbol]) {
            const oldPrice = state.marketData[symbol].price;
            state.marketData[symbol].price = price;
            state.marketData[symbol].change24h = price - oldPrice;
            state.marketData[symbol].changePercent24h = ((price - oldPrice) / oldPrice) * 100;
            state.marketData[symbol].lastUpdated = Date.now();
          }
        }),

        bulkUpdatePrices: (updates) => set((state) => {
          Object.entries(updates).forEach(([symbol, price]) => {
            state.priceUpdates[symbol] = price;
            
            if (state.marketData[symbol]) {
              const oldPrice = state.marketData[symbol].price;
              state.marketData[symbol].price = price;
              state.marketData[symbol].change24h = price - oldPrice;
              state.marketData[symbol].changePercent24h = ((price - oldPrice) / oldPrice) * 100;
              state.marketData[symbol].lastUpdated = Date.now();
            }
          });
          state.lastPriceUpdate = Date.now();
        }),

        subscribeToSymbol: (symbol) => set((state) => {
          state.subscribedSymbols.add(symbol);
        }),

        unsubscribeFromSymbol: (symbol) => set((state) => {
          state.subscribedSymbols.delete(symbol);
        }),

        incrementRetryCount: () => set((state) => {
          state.connectionRetryCount += 1;
        }),

        resetRetryCount: () => set((state) => {
          state.connectionRetryCount = 0;
        }),
      }))
    ),
    { name: 'market-store' }
  )
);

// Optimized selectors
export const useMarketData = (symbol?: string) => 
  useMarketStore(state => symbol ? state.marketData[symbol] : state.marketData);

export const useOrderBook = (symbol: string) => 
  useMarketStore(state => state.orderBooks[symbol]);

export const usePriceUpdates = () => 
  useMarketStore(state => state.priceUpdates);

export const useSubscribedSymbols = () => 
  useMarketStore(state => state.subscribedSymbols);