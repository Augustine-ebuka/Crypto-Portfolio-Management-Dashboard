import { create } from 'zustand';
import { subscribeWithSelector, devtools } from 'zustand/middleware';
import { immer } from 'zustand/middleware/immer';

export interface Position {
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

export interface Order {
  id: string;
  symbol: string;
  type: 'buy' | 'sell';
  orderType: 'market' | 'limit' | 'stop';
  amount: number;
  price?: number;
  stopPrice?: number;
  status: 'pending' | 'filled' | 'cancelled' | 'rejected';
  timestamp: number;
}

export interface PortfolioMetrics {
  totalValue: number;
  dailyChange: number;
  dailyChangePercent: number;
  totalAssets: number;
  bestPerformer: string;
  worstPerformer: string;
  totalGainLoss: number;
  totalGainLossPercent: number;
}

export interface PortfolioState {
  // Data
  positions: Position[];
  orders: Order[];
  metrics: PortfolioMetrics;
  isLoading: boolean;
  lastUpdated: number;
  
  // WebSocket connection state
  connectionStatus: 'connected' | 'disconnected' | 'reconnecting';
  
  // Actions
  addPosition: (position: Position) => void;
  updatePosition: (id: string, updates: Partial<Position>) => void;
  removePosition: (id: string) => void;
  updatePrices: (priceUpdates: Record<string, number>) => void;
  
  // Orders
  addOrder: (order: Omit<Order, 'id' | 'timestamp'>) => void;
  updateOrder: (id: string, updates: Partial<Order>) => void;
  cancelOrder: (id: string) => void;
  
  // Optimistic updates
  optimisticTrade: (trade: { symbol: string; amount: number; price: number; type: 'buy' | 'sell' }) => void;
  revertOptimisticTrade: (tradeId: string) => void;
  
  // Metrics calculation
  recalculateMetrics: () => void;
  
  // Connection management
  setConnectionStatus: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
}

const calculateMetrics = (positions: Position[]): PortfolioMetrics => {
  const totalValue = positions.reduce((sum, p) => sum + p.totalValue, 0);
  const dailyChange = positions.reduce((sum, p) => sum + p.dailyChange * p.amount, 0);
  const totalGainLoss = positions.reduce((sum, p) => sum + p.totalGainLoss, 0);
  
  const bestPerformer = positions.reduce((best, p) => 
    p.dailyChangePercent > (best?.dailyChangePercent || -Infinity) ? p : best, 
    positions[0]
  );
  
  const worstPerformer = positions.reduce((worst, p) => 
    p.dailyChangePercent < (worst?.dailyChangePercent || Infinity) ? p : worst, 
    positions[0]
  );

  return {
    totalValue,
    dailyChange,
    dailyChangePercent: totalValue > 0 ? (dailyChange / totalValue) * 100 : 0,
    totalAssets: positions.length,
    bestPerformer: bestPerformer?.symbol.toUpperCase() || 'N/A',
    worstPerformer: worstPerformer?.symbol.toUpperCase() || 'N/A',
    totalGainLoss,
    totalGainLossPercent: totalValue > 0 ? (totalGainLoss / (totalValue - totalGainLoss)) * 100 : 0,
  };
};

export const usePortfolioStore = create<PortfolioState>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // Initial state
        positions: [],
        orders: [],
        metrics: {
          totalValue: 0,
          dailyChange: 0,
          dailyChangePercent: 0,
          totalAssets: 0,
          bestPerformer: 'N/A',
          worstPerformer: 'N/A',
          totalGainLoss: 0,
          totalGainLossPercent: 0,
        },
        isLoading: false,
        lastUpdated: Date.now(),
        connectionStatus: 'disconnected',

        // Position management
        addPosition: (position) => set((state) => {
          state.positions.push({
            ...position,
            lastUpdated: Date.now(),
          });
          state.metrics = calculateMetrics(state.positions);
          state.lastUpdated = Date.now();
        }),

        updatePosition: (id, updates) => set((state) => {
          const index = state.positions.findIndex(p => p.id === id);
          if (index !== -1) {
            Object.assign(state.positions[index], updates, { lastUpdated: Date.now() });
            state.metrics = calculateMetrics(state.positions);
            state.lastUpdated = Date.now();
          }
        }),

        removePosition: (id) => set((state) => {
          state.positions = state.positions.filter(p => p.id !== id);
          state.metrics = calculateMetrics(state.positions);
          state.lastUpdated = Date.now();
        }),

        updatePrices: (priceUpdates) => set((state) => {
          state.positions.forEach(position => {
            if (priceUpdates[position.symbol]) {
              const newPrice = priceUpdates[position.symbol];
              const oldPrice = position.currentPrice;
              
              position.currentPrice = newPrice;
              position.totalValue = position.amount * newPrice;
              position.dailyChange = newPrice - oldPrice;
              position.dailyChangePercent = ((newPrice - oldPrice) / oldPrice) * 100;
              position.totalGainLoss = position.totalValue - (position.amount * position.averageBuyPrice);
              position.totalGainLossPercent = ((newPrice - position.averageBuyPrice) / position.averageBuyPrice) * 100;
              position.lastUpdated = Date.now();
            }
          });
          state.metrics = calculateMetrics(state.positions);
          state.lastUpdated = Date.now();
        }),

        // Order management
        addOrder: (orderData) => set((state) => {
          const order: Order = {
            ...orderData,
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          };
          state.orders.push(order);
        }),

        updateOrder: (id, updates) => set((state) => {
          const index = state.orders.findIndex(o => o.id === id);
          if (index !== -1) {
            Object.assign(state.orders[index], updates);
          }
        }),

        cancelOrder: (id) => set((state) => {
          const index = state.orders.findIndex(o => o.id === id);
          if (index !== -1) {
            state.orders[index].status = 'cancelled';
          }
        }),

        // Optimistic updates
        optimisticTrade: (trade) => set((state) => {
          const position = state.positions.find(p => p.symbol === trade.symbol);
          if (position) {
            if (trade.type === 'buy') {
              const newAmount = position.amount + trade.amount;
              const newAverageBuyPrice = 
                (position.amount * position.averageBuyPrice + trade.amount * trade.price) / newAmount;
              
              position.amount = newAmount;
              position.averageBuyPrice = newAverageBuyPrice;
              position.totalValue = position.amount * position.currentPrice;
              position.totalGainLoss = position.totalValue - (position.amount * position.averageBuyPrice);
              position.totalGainLossPercent = 
                ((position.currentPrice - position.averageBuyPrice) / position.averageBuyPrice) * 100;
            } else {
              position.amount = Math.max(0, position.amount - trade.amount);
              position.totalValue = position.amount * position.currentPrice;
              position.totalGainLoss = position.totalValue - (position.amount * position.averageBuyPrice);
            }
            position.lastUpdated = Date.now();
          }
          state.metrics = calculateMetrics(state.positions);
          state.lastUpdated = Date.now();
        }),

        revertOptimisticTrade: (tradeId) => set((state) => {
          // Implementation would track and revert specific trades
          // For now, this is a placeholder
          console.log('Reverting optimistic trade:', tradeId);
        }),

        recalculateMetrics: () => set((state) => {
          state.metrics = calculateMetrics(state.positions);
          state.lastUpdated = Date.now();
        }),

        setConnectionStatus: (status) => set((state) => {
          state.connectionStatus = status;
        }),
      }))
    ),
    { name: 'portfolio-store' }
  )
);

// Selectors for performance optimization
export const usePositions = () => usePortfolioStore(state => state.positions);
export const useMetrics = () => usePortfolioStore(state => state.metrics);
export const useOrders = () => usePortfolioStore(state => state.orders);
export const useConnectionStatus = () => usePortfolioStore(state => state.connectionStatus);