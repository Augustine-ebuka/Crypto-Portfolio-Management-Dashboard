import { useRef, useCallback, useEffect } from 'react';
import type { WorkerMessage, WorkerResponse } from '../workers/calculations.worker';

interface UseWebWorkerOptions {
  onMessage?: (data: WorkerResponse) => void;
  onError?: (error: ErrorEvent) => void;
}

interface PendingRequest {
  resolve: (result: any) => void;
  reject: (error: Error) => void;
  timestamp: number;
}

export function useWebWorker(options: UseWebWorkerOptions = {}) {
  const workerRef = useRef<Worker | null>(null);
  const pendingRequestsRef = useRef<Map<string, PendingRequest>>(new Map());
  const requestIdCounterRef = useRef(0);

  // Initialize worker
  useEffect(() => {
    try {
      // Create worker from the calculations worker file
      workerRef.current = new Worker(
        new URL('../workers/calculations.worker.ts', import.meta.url),
        { type: 'module' }
      );

      workerRef.current.onmessage = (event: MessageEvent<WorkerResponse>) => {
        const { id, result, error } = event.data;
        
        // Handle pending request
        const pendingRequest = pendingRequestsRef.current.get(id);
        if (pendingRequest) {
          pendingRequestsRef.current.delete(id);
          
          if (error) {
            pendingRequest.reject(new Error(error));
          } else {
            pendingRequest.resolve(result);
          }
        }

        // Call external message handler
        options.onMessage?.(event.data);
      };

      workerRef.current.onerror = (error: ErrorEvent) => {
        console.error('Worker error:', error);
        options.onError?.(error);
        
        // Reject all pending requests
        pendingRequestsRef.current.forEach(({ reject }) => {
          reject(new Error('Worker error'));
        });
        pendingRequestsRef.current.clear();
      };

    } catch (error) {
      console.error('Failed to create worker:', error);
    }

    return () => {
      // Cleanup
      if (workerRef.current) {
        workerRef.current.terminate();
        workerRef.current = null;
      }
      
      // Reject all pending requests
      pendingRequestsRef.current.forEach(({ reject }) => {
        reject(new Error('Worker terminated'));
      });
      pendingRequestsRef.current.clear();
    };
  }, [options.onMessage, options.onError]);

  // Cleanup stale requests
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const staleTimeout = 30000; // 30 seconds
      
      pendingRequestsRef.current.forEach((request, id) => {
        if (now - request.timestamp > staleTimeout) {
          request.reject(new Error('Request timeout'));
          pendingRequestsRef.current.delete(id);
        }
      });
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, []);

  const postMessage = useCallback(<T = any>(
    type: WorkerMessage['type'],
    payload: any,
    timeout: number = 30000
  ): Promise<T> => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not available'));
        return;
      }

      const id = `req_${++requestIdCounterRef.current}_${Date.now()}`;
      
      // Store pending request
      pendingRequestsRef.current.set(id, {
        resolve,
        reject,
        timestamp: Date.now(),
      });

      // Set timeout
      setTimeout(() => {
        const pendingRequest = pendingRequestsRef.current.get(id);
        if (pendingRequest) {
          pendingRequestsRef.current.delete(id);
          reject(new Error('Request timeout'));
        }
      }, timeout);

      // Send message to worker
      const message: WorkerMessage = { id, type, payload };
      workerRef.current.postMessage(message);
    });
  }, []);

  const isAvailable = useCallback(() => {
    return workerRef.current !== null;
  }, []);

  const terminate = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    // Reject all pending requests
    pendingRequestsRef.current.forEach(({ reject }) => {
      reject(new Error('Worker terminated'));
    });
    pendingRequestsRef.current.clear();
  }, []);

  return {
    postMessage,
    isAvailable,
    terminate,
    pendingRequests: pendingRequestsRef.current.size,
  };
}

// Specific hooks for different calculation types
export function usePortfolioCalculations() {
  const { postMessage } = useWebWorker();

  const calculateMetrics = useCallback(async (positions: any[]) => {
    return postMessage('CALCULATE_PORTFOLIO_METRICS', { positions });
  }, [postMessage]);

  const calculateRiskMetrics = useCallback(async (positions: any[], marketData?: any[]) => {
    return postMessage('CALCULATE_RISK_METRICS', { positions, marketData });
  }, [postMessage]);

  const calculateCorrelations = useCallback(async (positions: any[]) => {
    return postMessage('CALCULATE_CORRELATIONS', { positions });
  }, [postMessage]);

  return {
    calculateMetrics,
    calculateRiskMetrics,
    calculateCorrelations,
  };
}

export function useChartCalculations() {
  const { postMessage } = useWebWorker();

  const processPriceData = useCallback(async (data: any[], timeframe: string) => {
    return postMessage('PROCESS_PRICE_DATA', { data, timeframe });
  }, [postMessage]);

  return {
    processPriceData,
  };
}

// Performance monitoring hook
export function useWorkerPerformance() {
  const startTime = useRef<number>(0);
  const measurements = useRef<number[]>([]);

  const startMeasurement = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endMeasurement = useCallback(() => {
    if (startTime.current > 0) {
      const duration = performance.now() - startTime.current;
      measurements.current.push(duration);
      
      // Keep only last 100 measurements
      if (measurements.current.length > 100) {
        measurements.current = measurements.current.slice(-100);
      }
      
      startTime.current = 0;
      return duration;
    }
    return 0;
  }, []);

  const getAverageTime = useCallback(() => {
    if (measurements.current.length === 0) return 0;
    return measurements.current.reduce((sum, time) => sum + time, 0) / measurements.current.length;
  }, []);

  const getMetrics = useCallback(() => {
    return {
      averageTime: getAverageTime(),
      totalMeasurements: measurements.current.length,
      lastMeasurement: measurements.current[measurements.current.length - 1] || 0,
      minTime: Math.min(...measurements.current),
      maxTime: Math.max(...measurements.current),
    };
  }, [getAverageTime]);

  return {
    startMeasurement,
    endMeasurement,
    getAverageTime,
    getMetrics,
  };
}