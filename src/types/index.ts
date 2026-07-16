// 股票基本信息
export interface Stock {
  code: string;
  name: string;
  industry: string;
  market: 'SH' | 'SZ' | 'BJ';
  marketCap: number;
  pe: number;
  pb: number;
  roe: number;
}

export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  amount: number;
  turnover: number;
  high: number;
  low: number;
  open: number;
  preClose: number;
}

export interface MarketOverview {
  totalStocks: number;
  upCount: number;
  downCount: number;
  flatCount: number;
  totalVolume: number;
  totalAmount: number;
  shIndex: number;
  shChange: number;
  shChangePercent: number;
  szIndex: number;
  szChange: number;
  szChangePercent: number;
}

export interface FilterCondition {
  id: string;
  field: string;
  label: string;
  operator: string;
  value: string;
  value2: string;
  unit: string;
}

export interface StrategyFactor {
  id: string;
  field: string;
  label: string;
  name: string;
  weight: number;
  direction: 'asc' | 'desc';
  params?: Record<string, any>;
}

export type StrategyFilter = FilterCondition;

export interface Strategy {
  id: string;
  name: string;
  description: string;
  type: 'preset' | 'custom';
  factors: StrategyFactor[];
  filters: FilterCondition[];
  isPublic?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface BacktestResult {
  taskId: string;
  stockCode: string;
  strategyId: string;
  startDate: string;
  endDate: string;
  initialCapital: number;
  performance: BacktestPerformance;
  trades: BacktestTrade[];
  dailyReturns: DailyReturn[];
  drawdowns: DayDrawdown[];
}

export interface BacktestPerformance {
  totalReturn: number;
  annualReturn: number;
  maxDrawdown: number;
  sharpeRatio: number;
  winRate: number;
  profitLossRatio: number;
  alpha: number;
  beta: number;
  totalTrades: number;
  winCount: number;
  lossCount: number;
}

export interface BacktestTrade {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  amount: number;
  reason: string;
}

export interface DailyReturn {
  date: string;
  value: number;
  returnPct: number;
  benchmark: number;
}

export interface DayDrawdown {
  date: string;
  value: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface KlineData {
  date: string;
  open: number;
  close: number;
  high: number;
  low: number;
  volume: number;
}

export interface SelectionResult {
  taskId: string;
  strategyId: string;
  stocks: StockScore[];
  executedAt: string;
  totalCount: number;
}

export interface StockScore {
  stock: Stock;
  quote: StockQuote;
  score: number;
  rank: number;
  factorScores: Record<string, number>;
}

export interface HotStock {
  stock: Stock;
  quote: StockQuote;
  reason: string;
}
