// 股票基本信息
export interface Stock {
  code: string; // 股票代码
  name: string; // 股票名称
  industry: string; // 所属行业
  market: 'SH' | 'SZ'; // 上市市场
  marketCap: number; // 市值(亿)
  pe: number; // 市盈率
  pb: number; // 市净率
  roe: number; // 净资产收益率
}

// 股票行情数据
export interface StockQuote {
  code: string;
  name: string;
  price: number; // 当前价格
  change: number; // 涨跌幅
  changePercent: number; // 涨跌幅百分比
  volume: number; // 成交量(手)
  amount: number; // 成交额(万)
  turnover: number; // 换手率
  high: number; // 最高价
  low: number; // 最低价
  open: number; // 开盘价
  preClose: number; // 昨收价
}

// 选股策略
export interface Strategy {
  id: string;
  name: string;
  type: 'factor' | 'technical' | 'fundamental' | 'mixed';
  description: string;
  factors: StrategyFactor[];
  filters: StrategyFilter[];
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// 策略因子
export interface StrategyFactor {
  name: string;
  weight: number; // 因子权重 (0-1)
  params: Record<string, any>;
}

// 筛选条件
export interface StrategyFilter {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'between';
  value: number | [number, number];
}

// 选股结果
export interface SelectionResult {
  taskId: string;
  strategyId: string;
  stocks: StockScore[];
  executedAt: string;
  totalCount: number;
}

// 股票评分
export interface StockScore {
  stock: Stock;
  quote: StockQuote;
  score: number; // 综合得分
  rank: number; // 排名
  factorScores: Record<string, number>;
}

// 回测结果
export interface BacktestResult {
  taskId: string;
  stockCode: string;
  strategyId: string;
  startDate: string;
  endDate: string;
  performance: BacktestPerformance;
  trades: BacktestTrade[];
  dailyReturns: DailyReturn[];
}

// 回测绩效
export interface BacktestPerformance {
  totalReturn: number; // 总收益率
  annualReturn: number; // 年化收益率
  maxDrawdown: number; // 最大回撤
  sharpeRatio: number; // 夏普比率
  winRate: number; // 胜率
  profitLossRatio: number; // 盈亏比
  alpha: number; // Alpha
  beta: number; // Beta
}

// 交易记录
export interface BacktestTrade {
  date: string;
  type: 'buy' | 'sell';
  price: number;
  shares: number;
  amount: number;
  reason: string;
}

// 每日收益
export interface DailyReturn {
  date: string;
  value: number; // 资产价值
  return: number; // 日收益率
  benchmark: number; // 基准收益率
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// 市场概览数据
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

// 热门股票
export interface HotStock {
  stock: Stock;
  quote: StockQuote;
  reason: string; // 涨跌原因
}