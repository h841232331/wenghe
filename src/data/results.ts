import { MarketOverview, HotStock, SelectionResult, BacktestResult, StockScore, BacktestPerformance, BacktestTrade, DailyReturn } from '../types';
import { stocks } from './stocks';
import { getQuoteByCode } from './quotes';
import { getStrategyById } from './strategies';

// 模拟市场概览数据
export const marketOverview: MarketOverview = {
  totalStocks: 5023,
  upCount: 2856,
  downCount: 1953,
  flatCount: 214,
  totalVolume: 85600000000, // 856亿手
  totalAmount: 9800000000, // 980亿
  shIndex: 3158.52,
  shChange: 25.36,
  shChangePercent: 0.81,
  szIndex: 10328.65,
  szChange: 48.25,
  szChangePercent: 0.47,
};

// 模拟热门股票数据
export const hotStocks: HotStock[] = [
  {
    stock: stocks[0], // 贵州茅台
    quote: getQuoteByCode('600519')!,
    reason: '白酒板块强势反弹，资金大幅流入'
  },
  {
    stock: stocks[1], // 招商银行
    quote: getQuoteByCode('600036')!,
    reason: '银行股估值修复，外资持续增持'
  },
  {
    stock: stocks[15], // 五粮液
    quote: getQuoteByCode('000858')!,
    reason: '高端白酒需求恢复，业绩超预期'
  },
  {
    stock: stocks[16], // 美的集团
    quote: getQuoteByCode('000333')!,
    reason: '家电出口订单大幅增长，盈利能力提升'
  },
  {
    stock: stocks[25], // 宁德时代
    quote: getQuoteByCode('300750')!,
    reason: '新能源汽车销量超预期，电池需求旺盛'
  },
];

// 生成选股结果
const generateStockScore = (stock: typeof stocks[0], strategyId: string, baseScore: number): StockScore => {
  const quote = getQuoteByCode(stock.code)!;
  const factorScores: Record<string, number> = {
    '市盈率': Math.random() * 100,
    '市净率': Math.random() * 100,
    '净资产收益率': Math.random() * 100,
    '价格动量': Math.random() * 100,
    '成交量': Math.random() * 100,
  };

  const score = baseScore + (Math.random() - 0.5) * 20;
  return {
    stock,
    quote,
    score: Math.round(score * 100) / 100,
    rank: 0, // 后续设置
    factorScores,
  };
};

// 模拟选股结果
export const mockSelectionResults: SelectionResult[] = [
  {
    taskId: 'sel-001',
    strategyId: 'strategy-001',
    executedAt: '2024-05-23T14:30:00Z',
    totalCount: 15,
    stocks: stocks.slice(0, 15).map((stock, index) => {
      const scored = generateStockScore(stock, 'strategy-001', 80);
      scored.rank = index + 1;
      return scored;
    }),
  },
  {
    taskId: 'sel-002',
    strategyId: 'strategy-002',
    executedAt: '2024-05-22T15:45:00Z',
    totalCount: 12,
    stocks: stocks.slice(5, 17).map((stock, index) => {
      const scored = generateStockScore(stock, 'strategy-002', 75);
      scored.rank = index + 1;
      return scored;
    }),
  },
];

// 生成回测每日收益数据
const generateDailyReturns = (startDate: string, endDate: string): DailyReturn[] => {
  const returns: DailyReturn[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  let value = 100000; // 初始资金10万

  while (start <= end) {
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    if (!isWeekend) {
      const dailyReturn = (Math.random() - 0.45) * 0.03; // -1.35% ~ +1.65%
      const benchmark = (Math.random() - 0.48) * 0.025; // -1.2% ~ +1.3%
      
      value = value * (1 + dailyReturn);
      
      returns.push({
        date: start.toISOString().split('T')[0],
        value: Math.round(value),
        return: Math.round(dailyReturn * 10000) / 100,
        benchmark: Math.round(benchmark * 10000) / 100,
      });
    }
    start.setDate(start.getDate() + 1);
  }

  return returns;
};

// 生成交易记录
const generateTrades = (stockCode: string, startDate: string, endDate: string): BacktestTrade[] => {
  const trades: BacktestTrade[] = [];
  const stock = stocks.find(s => s.code === stockCode);
  const quote = getQuoteByCode(stockCode)!;
  const tradeCount = Math.floor(Math.random() * 8) + 4; // 4-12笔交易

  for (let i = 0; i < tradeCount; i++) {
    const isBuy = Math.random() > 0.5;
    const shares = Math.floor(Math.random() * 1000) + 100;
    
    trades.push({
      date: new Date(
        new Date(startDate).getTime() + 
        Math.random() * (new Date(endDate).getTime() - new Date(startDate).getTime())
      ).toISOString().split('T')[0],
      type: isBuy ? 'buy' : 'sell',
      price: Math.round(quote.price * (1 + (Math.random() - 0.5) * 0.1) * 100) / 100,
      shares,
      amount: Math.round(quote.price * shares),
      reason: isBuy ? '信号触发，逢低买入' : '信号触发，获利了结',
    });
  }

  return trades.sort((a, b) => a.date.localeCompare(b.date));
};

// 生成回测绩效指标
const generatePerformance = (): BacktestPerformance => {
  return {
    totalReturn: Math.round((Math.random() * 0.4 + 0.1) * 10000) / 100, // 10%-50%
    annualReturn: Math.round((Math.random() * 0.3 + 0.15) * 10000) / 100, // 15%-45%
    maxDrawdown: Math.round((Math.random() * 0.15 + 0.05) * 10000) / 100, // 5%-20%
    sharpeRatio: Math.round((Math.random() * 1.5 + 0.8) * 100) / 100, // 0.8-2.3
    winRate: Math.round((Math.random() * 0.2 + 0.5) * 10000) / 100, // 50%-70%
    profitLossRatio: Math.round((Math.random() * 0.5 + 1.0) * 100) / 100, // 1.0-1.5
    alpha: Math.round((Math.random() * 0.1 + 0.05) * 10000) / 100, // 5%-15%
    beta: Math.round((Math.random() * 0.5 + 0.7) * 100) / 100, // 0.7-1.2
  };
};

// 模拟回测结果
export const mockBacktestResults: BacktestResult[] = [
  {
    taskId: 'bt-001',
    stockCode: '600519',
    strategyId: 'strategy-001',
    startDate: '2024-01-01',
    endDate: '2024-05-23',
    performance: generatePerformance(),
    trades: generateTrades('600519', '2024-01-01', '2024-05-23'),
    dailyReturns: generateDailyReturns('2024-01-01', '2024-05-23'),
  },
  {
    taskId: 'bt-002',
    stockCode: '000858',
    strategyId: 'strategy-002',
    startDate: '2024-02-01',
    endDate: '2024-05-23',
    performance: generatePerformance(),
    trades: generateTrades('000858', '2024-02-01', '2024-05-23'),
    dailyReturns: generateDailyReturns('2024-02-01', '2024-05-23'),
  },
  {
    taskId: 'bt-003',
    stockCode: '300750',
    strategyId: 'strategy-003',
    startDate: '2024-03-01',
    endDate: '2024-05-23',
    performance: generatePerformance(),
    trades: generateTrades('300750', '2024-03-01', '2024-05-23'),
    dailyReturns: generateDailyReturns('2024-03-01', '2024-05-23'),
  },
];

// 获取选股结果
export const getSelectionResultById = (taskId: string): SelectionResult | undefined => {
  return mockSelectionResults.find(result => result.taskId === taskId);
};

// 获取回测结果
export const getBacktestResultById = (taskId: string): BacktestResult | undefined => {
  return mockBacktestResults.find(result => result.taskId === taskId);
};