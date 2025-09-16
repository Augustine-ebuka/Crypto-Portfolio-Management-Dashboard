import React, { useState, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Slider } from '../ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { usePortfolioStore } from '../../store/portfolio';
import { useMarketData } from '../../store/market';
import { designTokens } from '../../design-system/tokens';
import { 
  Calculator, 
  AlertTriangle, 
  Shield, 
  Target, 
  TrendingUp, 
  TrendingDown,
  Info,
  DollarSign,
  Percent
} from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

interface RiskCalculatorProps {
  symbol: string;
  side: 'buy' | 'sell';
  className?: string;
  onCalculationChange?: (calculation: RiskCalculation) => void;
}

interface RiskCalculation {
  entryPrice: number;
  stopLoss: number;
  takeProfit: number;
  positionSize: number;
  riskAmount: number;
  riskPercent: number;
  rewardAmount: number;
  riskRewardRatio: number;
  portfolioImpact: number;
  maxLoss: number;
  maxGain: number;
  breakEvenPrice: number;
  marginRequired: number;
  isValid: boolean;
  warnings: string[];
}

const RISK_PRESETS = [
  { label: '1%', value: 1 },
  { label: '2%', value: 2 },
  { label: '3%', value: 3 },
  { label: '5%', value: 5 },
];

const POSITION_SIZE_METHODS = [
  { value: 'fixed', label: 'Fixed Amount' },
  { value: 'percent', label: 'Percent of Portfolio' },
  { value: 'risk-based', label: 'Risk-Based' },
];

export const RiskCalculator: React.FC<RiskCalculatorProps> = ({
  symbol,
  side,
  className = '',
  onCalculationChange,
}) => {
  const [entryPrice, setEntryPrice] = useState<number>(0);
  const [stopLoss, setStopLoss] = useState<number>(0);
  const [takeProfit, setTakeProfit] = useState<number>(0);
  const [positionSize, setPositionSize] = useState<number>(0);
  const [riskPercent, setRiskPercent] = useState<number>(2);
  const [calculationMethod, setCalculationMethod] = useState<'fixed' | 'percent' | 'risk-based'>('risk-based');

  const metrics = usePortfolioStore(state => state.metrics);
  const marketData = useMarketData(symbol);
  
  const currentPrice = marketData?.price || 0;
  const portfolioValue = metrics.totalValue || 100000; // Default to 100k

  // Set default entry price when current price changes
  React.useEffect(() => {
    if (currentPrice > 0 && entryPrice === 0) {
      setEntryPrice(currentPrice);
    }
  }, [currentPrice, entryPrice]);

  const calculation = useMemo((): RiskCalculation => {
    const warnings: string[] = [];
    
    if (!entryPrice || !stopLoss) {
      return {
        entryPrice,
        stopLoss,
        takeProfit,
        positionSize,
        riskAmount: 0,
        riskPercent: 0,
        rewardAmount: 0,
        riskRewardRatio: 0,
        portfolioImpact: 0,
        maxLoss: 0,
        maxGain: 0,
        breakEvenPrice: entryPrice,
        marginRequired: 0,
        isValid: false,
        warnings,
      };
    }

    // Calculate risk per unit
    const riskPerUnit = Math.abs(entryPrice - stopLoss);
    const rewardPerUnit = takeProfit ? Math.abs(takeProfit - entryPrice) : 0;

    // Calculate position size based on method
    let calculatedPositionSize = positionSize;
    let riskAmount = 0;

    if (calculationMethod === 'risk-based' && riskPercent > 0) {
      riskAmount = (portfolioValue * riskPercent) / 100;
      calculatedPositionSize = riskPerUnit > 0 ? riskAmount / riskPerUnit : 0;
    } else if (calculationMethod === 'percent' && positionSize > 0) {
      calculatedPositionSize = (portfolioValue * positionSize) / (100 * entryPrice);
      riskAmount = calculatedPositionSize * riskPerUnit;
    } else {
      riskAmount = calculatedPositionSize * riskPerUnit;
    }

    const rewardAmount = calculatedPositionSize * rewardPerUnit;
    const riskRewardRatio = riskAmount > 0 ? rewardAmount / riskAmount : 0;
    const portfolioImpact = portfolioValue > 0 ? (riskAmount / portfolioValue) * 100 : 0;
    const maxLoss = riskAmount;
    const maxGain = rewardAmount;
    const marginRequired = calculatedPositionSize * entryPrice * 0.1; // 10% margin
    
    // Validation and warnings
    const isValidEntry = entryPrice > 0;
    const isValidStopLoss = stopLoss > 0 && stopLoss !== entryPrice;
    const isValidPositionSize = calculatedPositionSize > 0;
    
    if (side === 'buy' && stopLoss >= entryPrice) {
      warnings.push('Stop loss should be below entry price for buy orders');
    }
    if (side === 'sell' && stopLoss <= entryPrice) {
      warnings.push('Stop loss should be above entry price for sell orders');
    }
    if (takeProfit && side === 'buy' && takeProfit <= entryPrice) {
      warnings.push('Take profit should be above entry price for buy orders');
    }
    if (takeProfit && side === 'sell' && takeProfit >= entryPrice) {
      warnings.push('Take profit should be below entry price for sell orders');
    }
    if (portfolioImpact > 10) {
      warnings.push('High portfolio impact - consider reducing position size');
    }
    if (riskRewardRatio < 1) {
      warnings.push('Risk/reward ratio below 1:1 - consider adjusting targets');
    }
    if (calculatedPositionSize * entryPrice > portfolioValue * 0.5) {
      warnings.push('Position size exceeds 50% of portfolio value');
    }

    const breakEvenPrice = entryPrice; // Simplified - doesn't account for fees

    return {
      entryPrice,
      stopLoss,
      takeProfit,
      positionSize: calculatedPositionSize,
      riskAmount,
      riskPercent: portfolioImpact,
      rewardAmount,
      riskRewardRatio,
      portfolioImpact,
      maxLoss,
      maxGain,
      breakEvenPrice,
      marginRequired,
      isValid: isValidEntry && isValidStopLoss && isValidPositionSize && warnings.length === 0,
      warnings,
    };
  }, [
    entryPrice,
    stopLoss,
    takeProfit,
    positionSize,
    riskPercent,
    calculationMethod,
    side,
    portfolioValue,
  ]);

  // Notify parent of calculation changes
  React.useEffect(() => {
    onCalculationChange?.(calculation);
  }, [calculation, onCalculationChange]);

  const handleRiskPresetClick = useCallback((preset: number) => {
    setRiskPercent(preset);
    setCalculationMethod('risk-based');
  }, []);

  const getRiskColor = (risk: number): string => {
    if (risk <= 2) return 'text-green-500';
    if (risk <= 5) return 'text-yellow-500';
    if (risk <= 10) return 'text-orange-500';
    return 'text-red-500';
  };

  const getRiskLabel = (risk: number): string => {
    if (risk <= 2) return 'Low Risk';
    if (risk <= 5) return 'Moderate Risk';
    if (risk <= 10) return 'High Risk';
    return 'Very High Risk';
  };

  return (
    <Card className={`h-full ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Calculator className="h-5 w-5" />
          <span>Position Risk Calculator</span>
          <Badge variant="outline" className="ml-auto">
            {symbol.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Calculation Method */}
        <div>
          <Label className="text-sm font-medium">Position Sizing Method</Label>
          <Select 
            value={calculationMethod} 
            onValueChange={(value) => setCalculationMethod(value as any)}
          >
            <SelectTrigger className="mt-2">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {POSITION_SIZE_METHODS.map((method) => (
                <SelectItem key={method.value} value={method.value}>
                  {method.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Entry Price */}
        <div>
          <Label className="text-sm font-medium">Entry Price</Label>
          <div className="flex space-x-2 mt-2">
            <Input
              type="number"
              step="0.01"
              value={entryPrice || ''}
              onChange={(e) => setEntryPrice(parseFloat(e.target.value) || 0)}
              placeholder="0.00"
              className="font-mono"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setEntryPrice(currentPrice)}
              disabled={!currentPrice}
            >
              Market
            </Button>
          </div>
        </div>

        {/* Stop Loss */}
        <div>
          <Label className="text-sm font-medium">Stop Loss</Label>
          <Input
            type="number"
            step="0.01"
            value={stopLoss || ''}
            onChange={(e) => setStopLoss(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="mt-2 font-mono"
          />
        </div>

        {/* Take Profit */}
        <div>
          <Label className="text-sm font-medium">Take Profit (Optional)</Label>
          <Input
            type="number"
            step="0.01"
            value={takeProfit || ''}
            onChange={(e) => setTakeProfit(parseFloat(e.target.value) || 0)}
            placeholder="0.00"
            className="mt-2 font-mono"
          />
        </div>

        {/* Position Size or Risk Percent */}
        {calculationMethod === 'risk-based' ? (
          <div>
            <Label className="text-sm font-medium">Risk Percentage</Label>
            <div className="mt-2 space-y-3">
              <Slider
                value={[riskPercent]}
                onValueChange={(value) => setRiskPercent(value[0])}
                max={20}
                min={0.1}
                step={0.1}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>0.1%</span>
                <span className={getRiskColor(riskPercent)}>
                  {riskPercent.toFixed(1)}%
                </span>
                <span>20%</span>
              </div>
              <div className="flex space-x-2">
                {RISK_PRESETS.map((preset) => (
                  <Button
                    key={preset.value}
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRiskPresetClick(preset.value)}
                    className="text-xs"
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <Label className="text-sm font-medium">
              {calculationMethod === 'percent' ? 'Portfolio Percentage' : 'Position Size'}
            </Label>
            <Input
              type="number"
              step={calculationMethod === 'percent' ? '0.1' : '0.0001'}
              value={positionSize || ''}
              onChange={(e) => setPositionSize(parseFloat(e.target.value) || 0)}
              placeholder={calculationMethod === 'percent' ? '10.0' : '1.0000'}
              className="mt-2 font-mono"
            />
          </div>
        )}

        <Separator />

        {/* Results */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center">
            <Target className="h-4 w-4 mr-2" />
            Risk Analysis
          </h4>

          {/* Risk Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Position Size</span>
                <DollarSign className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className="font-mono font-medium mt-1">
                {calculation.positionSize.toFixed(4)}
              </div>
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Risk Amount</span>
                <AlertTriangle className="h-3 w-3 text-muted-foreground" />
              </div>
              <div className={`font-mono font-medium mt-1 ${getRiskColor(calculation.portfolioImpact)}`}>
                ${calculation.riskAmount.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Risk/Reward Metrics */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm">Portfolio Impact:</span>
              <div className="flex items-center space-x-2">
                <span className={`font-mono ${getRiskColor(calculation.portfolioImpact)}`}>
                  {calculation.portfolioImpact.toFixed(2)}%
                </span>
                <Badge 
                  variant={calculation.portfolioImpact <= 5 ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {getRiskLabel(calculation.portfolioImpact)}
                </Badge>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Risk/Reward Ratio:</span>
              <span className={`font-mono ${calculation.riskRewardRatio >= 2 ? 'text-green-500' : calculation.riskRewardRatio >= 1 ? 'text-yellow-500' : 'text-red-500'}`}>
                1:{calculation.riskRewardRatio.toFixed(2)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm">Max Loss:</span>
              <span className="font-mono text-red-500">
                -${calculation.maxLoss.toFixed(2)}
              </span>
            </div>

            {calculation.maxGain > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm">Max Gain:</span>
                <span className="font-mono text-green-500">
                  +${calculation.maxGain.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between items-center">
              <span className="text-sm">Margin Required:</span>
              <span className="font-mono">
                ${calculation.marginRequired.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Risk Progress Bar */}
          <div>
            <div className="flex justify-between text-xs mb-2">
              <span>Portfolio Risk</span>
              <span>{calculation.portfolioImpact.toFixed(1)}%</span>
            </div>
            <Progress 
              value={Math.min(calculation.portfolioImpact, 20)} 
              max={20}
              className="h-2"
            />
            <div className="flex justify-between text-xs mt-1 text-muted-foreground">
              <span>0%</span>
              <span>Conservative (2%)</span>
              <span>Aggressive (20%)</span>
            </div>
          </div>
        </div>

        {/* Warnings */}
        {calculation.warnings.length > 0 && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                {calculation.warnings.map((warning, index) => (
                  <div key={index} className="text-sm">
                    • {warning}
                  </div>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Validation Status */}
        <div className="flex items-center justify-center">
          <Badge 
            variant={calculation.isValid ? 'default' : 'destructive'}
            className="flex items-center space-x-1"
          >
            {calculation.isValid ? (
              <Shield className="h-3 w-3" />
            ) : (
              <AlertTriangle className="h-3 w-3" />
            )}
            <span>
              {calculation.isValid ? 'Valid Position' : 'Invalid Position'}
            </span>
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};