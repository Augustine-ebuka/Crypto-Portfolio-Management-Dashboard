import { useEffect, useRef, useCallback } from 'react';
import { usePortfolioStore } from '../store/portfolio';
import { useMarketStore } from '../store/market';

interface WebSocketMessage {
  type: 'price_update' | 'order_book' | 'trade_update' | 'error';
  data: any;
}

interface UseWebSocketOptions {
  url: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  enabled?: boolean;
}

export function useWebSocket({
  url,
  maxReconnectAttempts = 5,
  reconnectInterval = 3000,
  enabled = true,
}: UseWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isConnectingRef = useRef(false);

  const setConnectionStatus = usePortfolioStore(state => state.setConnectionStatus);
  const updatePrices = usePortfolioStore(state => state.updatePrices);
  const bulkUpdatePrices = useMarketStore(state => state.bulkUpdatePrices);
  const updateOrderBook = useMarketStore(state => state.updateOrderBook);
  const subscribedSymbols = useMarketStore(state => state.subscribedSymbols);

  const connect = useCallback(() => {
    if (!enabled || isConnectingRef.current || wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    isConnectingRef.current = true;
    setConnectionStatus('reconnecting');

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('WebSocket connected');
        isConnectingRef.current = false;
        reconnectAttemptsRef.current = 0;
        setConnectionStatus('connected');

        // Subscribe to all tracked symbols
        subscribedSymbols.forEach(symbol => {
          wsRef.current?.send(JSON.stringify({
            type: 'subscribe',
            symbol,
          }));
        });
      };

      wsRef.current.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      wsRef.current.onclose = (event) => {
        console.log('WebSocket closed:', event.code, event.reason);
        isConnectingRef.current = false;
        setConnectionStatus('disconnected');

        // Attempt to reconnect if not a clean close
        if (event.code !== 1000 && reconnectAttemptsRef.current < maxReconnectAttempts) {
          scheduleReconnect();
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        isConnectingRef.current = false;
        setConnectionStatus('disconnected');
      };

    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      isConnectingRef.current = false;
      setConnectionStatus('disconnected');
      scheduleReconnect();
    }
  }, [url, enabled, setConnectionStatus, subscribedSymbols, maxReconnectAttempts]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(reconnectInterval * Math.pow(2, reconnectAttemptsRef.current - 1), 30000);
    
    console.log(`Scheduling reconnection attempt ${reconnectAttemptsRef.current} in ${delay}ms`);
    
    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, maxReconnectAttempts, reconnectInterval]);

  const handleMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'price_update':
        if (message.data.prices) {
          // Bulk price update
          bulkUpdatePrices(message.data.prices);
          updatePrices(message.data.prices);
        } else if (message.data.symbol && message.data.price) {
          // Single price update
          const priceUpdate = { [message.data.symbol]: message.data.price };
          bulkUpdatePrices(priceUpdate);
          updatePrices(priceUpdate);
        }
        break;

      case 'order_book':
        if (message.data.symbol) {
          updateOrderBook(message.data.symbol, {
            bids: message.data.bids || [],
            asks: message.data.asks || [],
            lastUpdated: Date.now(),
          });
        }
        break;

      case 'trade_update':
        // Handle trade confirmations, order fills, etc.
        console.log('Trade update:', message.data);
        break;

      case 'error':
        console.error('WebSocket error message:', message.data);
        break;

      default:
        console.log('Unknown message type:', message.type);
    }
  }, [bulkUpdatePrices, updatePrices, updateOrderBook]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close(1000, 'Client disconnect');
      wsRef.current = null;
    }

    setConnectionStatus('disconnected');
    reconnectAttemptsRef.current = 0;
    isConnectingRef.current = false;
  }, [setConnectionStatus]);

  const send = useCallback((data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  const subscribe = useCallback((symbol: string) => {
    const success = send({
      type: 'subscribe',
      symbol,
    });
    
    if (success) {
      useMarketStore.getState().subscribeToSymbol(symbol);
    }
    
    return success;
  }, [send]);

  const unsubscribe = useCallback((symbol: string) => {
    const success = send({
      type: 'unsubscribe',
      symbol,
    });
    
    if (success) {
      useMarketStore.getState().unsubscribeFromSymbol(symbol);
    }
    
    return success;
  }, [send]);

  // Initialize connection
  useEffect(() => {
    if (enabled) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
  };
}

// Mock WebSocket server for development
export function createMockWebSocketServer(): string {
  // In a real implementation, this would return the actual WebSocket URL
  // For demo purposes, we'll simulate WebSocket messages
  return 'wss://mock-crypto-ws.example.com';
}

// Hook to simulate real-time price updates for development
export function useMockPriceUpdates(enabled: boolean = true) {
  const bulkUpdatePrices = useMarketStore(state => state.bulkUpdatePrices);
  const updatePrices = usePortfolioStore(state => state.updatePrices);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      const mockPrices = {
        'btc': 67420 + (Math.random() - 0.5) * 2000,
        'eth': 3850 + (Math.random() - 0.5) * 300,
        'ada': 0.65 + (Math.random() - 0.5) * 0.1,
        'sol': 145.32 + (Math.random() - 0.5) * 20,
        'dot': 8.45 + (Math.random() - 0.5) * 1,
        'link': 18.92 + (Math.random() - 0.5) * 3,
        'matic': 0.89 + (Math.random() - 0.5) * 0.15,
        'avax': 42.18 + (Math.random() - 0.5) * 8,
      };

      bulkUpdatePrices(mockPrices);
      updatePrices(mockPrices);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [enabled, bulkUpdatePrices, updatePrices]);
}