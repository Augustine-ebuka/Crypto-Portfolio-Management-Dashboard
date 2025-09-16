export interface ChartPoint {
  timestamp: string;
  value: number;
  date: string;

}

export interface CandlestickChart extends ChartPoint{
  open:number;
  close:number;
  high:number;
  low:number;
  volume:number;
}
