import React, { useState, useCallback, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form@7.55.0';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { Alert, AlertDescription } from '../ui/alert';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { usePortfolioStore } from '../../store/portfolio';
import { useMarketData } from '../../store/market';
import { designTokens } from '../../design-system/tokens';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Calculator, 
  Zap,
  Shield,
  Info
} from 'lucide-react';
import { toast } from 'sonner@2.0.3';

// Order validation schema
const orderSchema = z.object({
  symbol: z.string().min(1, 'Symbol is required'),
  side: z.enum(['buy', 'sell']),
  orderType: z.enum(['market', 'limit', 'stop', 'stop-limit']),
  amount: z.number().positive('Amount must be positive'),
  price: z.number().positive().optional(),
  stopPrice: z.number().positive().optional(),
  timeInForce: z.enum(['GTC', 'IOC', 'FOK']),
  reduceOnly: z.boolean().optional(),
  postOnly: z.boolean().optional(),
});

type OrderFormData = z.infer<typeof orderSchema>;

interface AdvancedOrderFormProps {
  symbol: string;
  onOrderSubmit?: (order: OrderFormData) => void;
  className?: string;
}

interface RiskMetrics {
  maxLoss: number;
  maxLossPercent: number;
  margin: number;
  leverage: number;
  liquidationPrice: number;
}

const PERCENTAGE_PRESETS = [25, 50, 75, 100];

export const AdvancedOrderForm: React.FC<AdvancedOrderFormProps> = ({
  symbol,
  onOrderSubmit,
  className = '',
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'market' | 'limit' | 'stop' | 'stop-limit'>('market');
  const [showAdvanced, setShowAdvanced] = useState(false);

  const positions = usePortfolioStore(state => state.positions);
  const addOrder = usePortfolioStore(state => state.addOrder);
  const optimisticTrade = usePortfolioStore(state => state.optimisticTrade);
  const marketData = useMarketData(symbol);

  const currentPosition = positions.find(p => p.symbol === symbol);
  const currentPrice = marketData?.price || 0;
  const availableBalance = 50000; // Mock available balance

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isValid },
    reset,
  } = useForm<OrderFormData>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      symbol,
      side: 'buy',
      orderType: 'market',
      amount: 0,
      timeInForce: 'GTC',
      reduceOnly: false,
      postOnly: false,
    },
    mode: 'onChange',
  });

  const watchedValues = watch();
  const { amount, price } = watchedValues;

  // Calculate order value and risk metrics
  const orderValue = useMemo(() => {
    const effectivePrice = orderType === 'market' ? currentPrice : (price || currentPrice);
    return amount * effectivePrice;
  }, [amount, price, currentPrice, orderType]);

  const riskMetrics = useMemo((): RiskMetrics => {
    const effectivePrice = orderType === 'market' ? currentPrice : (price || currentPrice);
    const maxLoss = side === 'buy' ? orderValue : amount * effectivePrice;
    const maxLossPercent = availableBalance > 0 ? (maxLoss / availableBalance) * 100 : 0;
    
    return {
      maxLoss,
      maxLossPercent,
      margin: orderValue * 0.1, // 10% margin requirement
      leverage: 1, // No leverage for spot trading
      liquidationPrice: 0, // No liquidation for spot
    };
  }, [amount, price, currentPrice, orderType, side, orderValue, availableBalance]);

  const handlePercentageSelect = useCallback((percentage: number) => {
    if (side === 'buy') {
      const maxAmount = availableBalance / currentPrice;
      setValue('amount', (maxAmount * percentage) / 100);
    } else if (currentPosition) {
      setValue('amount', (currentPosition.amount * percentage) / 100);
    }
  }, [side, availableBalance, currentPrice, currentPosition, setValue]);

  const onSubmit = useCallback(async (data: OrderFormData) => {
    try {
      // Add optimistic update
      optimisticTrade({
        symbol: data.symbol,
        amount: data.amount,
        price: data.price || currentPrice,
        type: data.side,
      });

      // Add order to store
      addOrder({
        symbol: data.symbol,
        type: data.side,
        orderType: data.orderType,
        amount: data.amount,
        price: data.price,
        stopPrice: data.stopPrice,
        status: 'pending',
      });

      toast.success(`${data.side.toUpperCase()} order submitted successfully`);
      
      onOrderSubmit?.(data);
      reset();
      setCurrentStep(1);
    } catch (error) {
      toast.error('Failed to submit order');
      console.error('Order submission error:', error);
    }
  }, [optimisticTrade, addOrder, currentPrice, onOrderSubmit, reset]);

  const isStepValid = useCallback((step: number): boolean => {
    switch (step) {
      case 1:
        return !!watchedValues.symbol && !!watchedValues.side && !!watchedValues.orderType;
      case 2:
        return watchedValues.amount > 0 && (orderType === 'market' || (watchedValues.price || 0) > 0);
      case 3:
        return isValid;
      default:
        return false;
    }
  }, [watchedValues, orderType, isValid]);

  const getRiskColor = (percentage: number): string => {
    if (percentage <= 25) return 'text-green-500';
    if (percentage <= 50) return 'text-yellow-500';
    if (percentage <= 75) return 'text-orange-500';
    return 'text-red-500';
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Advanced Order</span>
          <Badge variant="outline" className="text-xs">
            Step {currentStep} of 3
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Step 1: Order Type & Side */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Order Side</Label>
                <Tabs 
                  value={side} 
                  onValueChange={(value) => {
                    setSide(value as 'buy' | 'sell');
                    setValue('side', value as 'buy' | 'sell');
                  }}
                  className="mt-2"
                >
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="buy" className="text-green-500">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      Buy
                    </TabsTrigger>
                    <TabsTrigger value="sell" className="text-red-500">
                      <TrendingDown className="h-4 w-4 mr-2" />
                      Sell
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              <div>
                <Label className="text-sm font-medium">Order Type</Label>
                <Controller
                  name="orderType"
                  control={control}
                  render={({ field }) => (
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        setOrderType(value as any);
                        field.onChange(value);
                      }}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="market">
                          <div className="flex items-center">
                            <Zap className="h-4 w-4 mr-2" />
                            Market Order
                          </div>
                        </SelectItem>
                        <SelectItem value="limit">
                          <div className="flex items-center">
                            <Calculator className="h-4 w-4 mr-2" />
                            Limit Order
                          </div>
                        </SelectItem>
                        <SelectItem value="stop">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            Stop Order
                          </div>
                        </SelectItem>
                        <SelectItem value="stop-limit">
                          <div className="flex items-center">
                            <Shield className="h-4 w-4 mr-2" />
                            Stop-Limit Order
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>

              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  {orderType === 'market' && 'Market orders execute immediately at the best available price.'}
                  {orderType === 'limit' && 'Limit orders only execute at your specified price or better.'}
                  {orderType === 'stop' && 'Stop orders become market orders when the stop price is reached.'}
                  {orderType === 'stop-limit' && 'Stop-limit orders become limit orders when the stop price is reached.'}
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Step 2: Amount & Price */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium">Amount</Label>
                <Controller
                  name="amount"
                  control={control}
                  render={({ field }) => (
                    <Input
                      {...field}
                      type="number"
                      step="0.00001"
                      placeholder="0.00"
                      className="mt-2 font-mono"
                      onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                    />
                  )}
                />
                {errors.amount && (
                  <p className="text-sm text-red-500 mt-1">{errors.amount.message}</p>
                )}

                {/* Percentage Presets */}
                <div className="flex space-x-2 mt-2">
                  {PERCENTAGE_PRESETS.map((percentage) => (
                    <Button
                      key={percentage}
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handlePercentageSelect(percentage)}
                      className="text-xs"
                    >
                      {percentage}%
                    </Button>
                  ))}
                </div>
              </div>

              {(orderType === 'limit' || orderType === 'stop-limit') && (
                <div>
                  <Label className="text-sm font-medium">Limit Price</Label>
                  <Controller
                    name="price"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder={currentPrice.toString()}
                        className="mt-2 font-mono"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500 mt-1">{errors.price.message}</p>
                  )}
                </div>
              )}

              {(orderType === 'stop' || orderType === 'stop-limit') && (
                <div>
                  <Label className="text-sm font-medium">Stop Price</Label>
                  <Controller
                    name="stopPrice"
                    control={control}
                    render={({ field }) => (
                      <Input
                        {...field}
                        type="number"
                        step="0.01"
                        placeholder={currentPrice.toString()}
                        className="mt-2 font-mono"
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    )}
                  />
                  {errors.stopPrice && (
                    <p className="text-sm text-red-500 mt-1">{errors.stopPrice.message}</p>
                  )}
                </div>
              )}

              <div className="p-3 bg-muted rounded-lg">
                <div className="flex justify-between text-sm">
                  <span>Order Value:</span>
                  <span className="font-mono">${orderValue.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span>Available Balance:</span>
                  <span className="font-mono">${availableBalance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Risk & Confirmation */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <div className="p-4 border rounded-lg">
                <h4 className="font-medium mb-3 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Risk Assessment
                </h4>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Max Loss:</span>
                    <span className={`font-mono ${getRiskColor(riskMetrics.maxLossPercent)}`}>
                      ${riskMetrics.maxLoss.toFixed(2)} ({riskMetrics.maxLossPercent.toFixed(1)}%)
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Portfolio Impact:</span>
                    <Badge variant={riskMetrics.maxLossPercent <= 25 ? 'default' : 'destructive'}>
                      {riskMetrics.maxLossPercent <= 25 ? 'Low Risk' : 'High Risk'}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Advanced Options</Label>
                  <Switch checked={showAdvanced} onCheckedChange={setShowAdvanced} />
                </div>

                {showAdvanced && (
                  <div className="space-y-3 p-3 border rounded-lg">
                    <Controller
                      name="timeInForce"
                      control={control}
                      render={({ field }) => (
                        <div>
                          <Label className="text-xs">Time in Force</Label>
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="GTC">Good Till Cancel (GTC)</SelectItem>
                              <SelectItem value="IOC">Immediate or Cancel (IOC)</SelectItem>
                              <SelectItem value="FOK">Fill or Kill (FOK)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    />

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Reduce Only</Label>
                      <Controller
                        name="reduceOnly"
                        control={control}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Post Only</Label>
                      <Controller
                        name="postOnly"
                        control={control}
                        render={({ field }) => (
                          <Switch 
                            checked={field.value} 
                            onCheckedChange={field.onChange}
                          />
                        )}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Symbol:</span>
                    <span className="font-mono">{symbol.toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Side:</span>
                    <span className={side === 'buy' ? 'text-green-500' : 'text-red-500'}>
                      {side.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Type:</span>
                    <span>{orderType.replace('-', ' ').toUpperCase()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount:</span>
                    <span className="font-mono">{amount}</span>
                  </div>
                  {price && (
                    <div className="flex justify-between">
                      <span>Price:</span>
                      <span className="font-mono">${price}</span>
                    </div>
                  )}
                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Total Value:</span>
                    <span className="font-mono">${orderValue.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex justify-between">
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep < 3 ? (
              <Button
                type="button"
                onClick={() => setCurrentStep(currentStep + 1)}
                disabled={!isStepValid(currentStep)}
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className={side === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
                disabled={!isValid}
              >
                Place {side.toUpperCase()} Order
              </Button>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
};