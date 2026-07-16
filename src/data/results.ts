import { Stock, StockQuote, MarketOverview, SelectionResult, StockScore, HotStock, BacktestResult, BacktestPerformance, DailyReturn, BacktestTrade } from '../types';
import { getStrategyById } from './strategies';

export const marketOverview: MarketOverview = {
  totalStocks: 5539,
  upCount: 2856,
  downCount: 1953,
  flatCount: 730,
  totalVolume: 85600000000,
  totalAmount: 9800,
  shIndex: 3916.13,
  shChange: -39.45,
  shChangePercent: -1.0,
  szIndex: 14608.13,
  szChange: -171.27,
  szChangePercent: -1.16,
};

const mockStocks: Stock[] = [];
const mockQuotes: StockQuote[] = [];

// Generate mock daily returns
export const generateDailyReturns = (startDate: string, endDate: string): DailyReturn[] => {
  const results: DailyReturn[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let value = 100000;
  const current = new Date(start);
  while (current <= end) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    if (!isWeekend) {
      const dailyReturn = (Math.random() - 0.48) * 0.02;
      value = value * (1 + dailyReturn);
      results.push({
        date: current.toISOString().split('T')[0],
        value: Math.round(value * 100) / 100,
        returnPct: Math.round(dailyReturn * 10000) / 100,
        benchmark: Math.round(dailyReturn * 50) / 100,
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return results;
};

// Generate mock trades
const generateTrades = (stockCode: string, startDate: string, endDate: string): BacktestTrade[] => {
  const trades: BacktestTrade[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let price = 100;
  let holding = false;
  const current = new Date(start);
  while (current <= end) {
    const isWeekend = current.getDay() === 0 || current.getDay() === 6;
    if (!isWeekend) {
      price = price * (1 + (Math.random() - 0.48) * 0.02);
      if (!holding && Math.random() > 0.7) {
        const shares = Math.floor(Math.random() * 10 + 1) * 100;
        trades.push({
          date: current.toISOString().split('T')[0],
          type: 'buy',
          price: Math.round(price * 100) / 100,
          shares,
          amount: Math.round(price * shares * 100) / 100,
          reason: 'MA5 上穿 MA20',
        });
        holding = true;
      } else if (holding && Math.random() > 0.7) {
        const shares = trades.filter(t => t.type === 'buy').reduce((sum, t) => sum + t.shares, 0);
        trades.push({
          date: current.toISOString().split('T')[0],
          type: 'sell',
          price: Math.round(price * 100) / 100,
          shares,
          amount: Math.round(price * shares * 100) / 100,
          reason: 'MA5 下穿 MA20',
        });
        holding = false;
      }
    }
    current.setDate(current.getDate() + 1);
  }
  return trades.sort((a, b) => a.date.localeCompare(b.date));
};

const generatePerformance = (): BacktestPerformance => ({
  totalTrades: 0,
  winCount: 0,
  lossCount: 0,
  totalReturn: Math.round((Math.random() * 0.4 + 0.1) * 10000) / 100,
  annualReturn: Math.round((Math.random() * 0.3 + 0.15) * 10000) / 100,
  maxDrawdown: Math.round((Math.random() * 0.15 + 0.05) * 10000) / 100,
  sharpeRatio: Math.round((Math.random() * 1.5 + 0.8) * 100) / 100,
  winRate: Math.round((Math.random() * 0.2 + 0.5) * 10000) / 100,
  profitLossRatio: Math.round((Math.random() * 0.5 + 1.0) * 100) / 100,
  alpha: Math.round((Math.random() * 0.1 + 0.05) * 10000) / 100,
  beta: Math.round((Math.random() * 0.5 + 0.7) * 100) / 100,
});

export const mockBacktest: BacktestResult[] = [
  {
    taskId: 'bt-001', stockCode: '600519', strategyId: 'strategy-001',
    startDate: '2024-01-01', endDate: '2024-05-23',
    initialCapital: 100000, drawdowns: [],
    performance: generatePerformance(),
    trades: generateTrades('600519', '2024-01-01', '2024-05-23'),
    dailyReturns: generateDailyReturns('2024-01-01', '2024-05-23'),
  },
  {
    taskId: 'bt-002', stockCode: '000858', strategyId: 'strategy-002',
    startDate: '2024-02-01', endDate: '2024-05-23',
    initialCapital: 100000, drawdowns: [],
    performance: generatePerformance(),
    trades: generateTrades('000858', '2024-02-01', '2024-05-23'),
    dailyReturns: generateDailyReturns('2024-02-01', '2024-05-23'),
  },
  {
    taskId: 'bt-003', stockCode: '300750', strategyId: 'strategy-003',
    startDate: '2024-03-01', endDate: '2024-05-23',
    initialCapital: 100000, drawdowns: [],
    performance: generatePerformance(),
    trades: generateTrades('300750', '2024-03-01', '2024-05-23'),
    dailyReturns: generateDailyReturns('2024-03-01', '2024-05-23'),
  },
];


export const mockSelectionResults: SelectionResult[] = [];
export const mockBacktestResults: BacktestResult[] = mockBacktest;
