// API适配器层 - 支持模拟数据和真实数据源切换
// 通过 apiConfig.useMockData 控制使用哪种数据源

import { Stock, StockQuote, Strategy, SelectionResult, BacktestResult, MarketOverview, DailyReturn, BacktestTrade, BacktestPerformance } from '../types';
import { stocks as mockStocks } from '../data/stocks';
import { getQuoteByCode, getTopGainers, getTopLosers, getTopVolume, quotes } from '../data/quotes';
import { strategies as mockStrategies } from '../data/strategies';
import { marketOverview, mockSelectionResults, mockBacktestResults } from '../data/results';
import { apiConfig, setUseMockData } from './config';
import { realApi } from './realApi';

// 模拟网络延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// ==================== 行情数据接口 ====================

/**
 * 获取股票实时行情
 * 对应a-stock-data: get_realtime_quote / tencent_quote
 * 数据源: mootdx / 腾讯财经
 * @param codes 股票代码列表
 */
export async function fetchQuotes(codes: string[]): Promise<StockQuote[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchQuotes(codes);
  }
  await delay(300);
  return codes.map(code => getQuoteByCode(code)!).filter(Boolean);
}

/**
 * 获取股票基本信息
 * 对应a-stock-data: stock_basic / get_stock_info
 * 数据源: 东财 / mootdx
 */
export async function fetchStockInfo(codes: string[]): Promise<Stock[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchStockInfo(codes);
  }
  await delay(200);
  return mockStocks.filter(stock => codes.includes(stock.code));
}

/**
 * 搜索股票
 * 对应a-stock-data: search_stock
 */
export async function searchStocks(keyword: string): Promise<Stock[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.searchStocks(keyword);
  }
  await delay(200);
  return mockStocks.filter(stock => 
    stock.code.includes(keyword) || 
    stock.name.includes(keyword) ||
    stock.industry.includes(keyword)
  );
}

/**
 * 获取市场概览数据
 * 对应a-stock-data: get_market_overview
 * 数据源: 东财 / 腾讯财经
 */
export async function fetchMarketOverview(): Promise<MarketOverview> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchMarketOverview();
  }
  await delay(300);
  return marketOverview;
}

/**
 * 获取涨幅榜
 * 对应a-stock-data: get_top_gainers / 行业排名
 */
export async function fetchTopGainers(limit: number = 10): Promise<StockQuote[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchTopGainers(limit);
  }
  await delay(200);
  return getTopGainers(limit);
}

/**
 * 获取跌幅榜
 * 对应a-stock-data: get_top_losers
 */
export async function fetchTopLosers(limit: number = 10): Promise<StockQuote[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchTopLosers(limit);
  }
  await delay(200);
  return getTopLosers(limit);
}

/**
 * 获取成交额排行
 */
export async function fetchTopVolume(limit: number = 10): Promise<StockQuote[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchTopVolume(limit);
  }
  await delay(200);
  return getTopVolume(limit);
}

/**
 * 获取K线数据
 * 对应a-stock-data: bars / get_kline
 * 数据源: mootdx / 百度K线
 * @param code 股票代码
 * @param frequency 频率: 1m/5m/15m/30m/60m/1d/1w/1M
 */
export async function fetchKline(
  code: string, 
  frequency: string = '1d',
  count: number = 100
): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchKline(code, frequency, count);
  }
  await delay(400);
  
  const quote = getQuoteByCode(code)!;
  const klines: { date: string; open: number; high: number; low: number; close: number; volume: number }[] = [];
  let price = quote.price * 0.8;
  const today = new Date();
  
  for (let i = count; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const change = (Math.random() - 0.48) * 0.03;
    const open = price;
    const close = price * (1 + change);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);
    const volume = Math.floor(Math.random() * 1000000 + 500000);
    
    klines.push({
      date: date.toISOString().split('T')[0],
      open: Math.round(open * 100) / 100,
      high: Math.round(high * 100) / 100,
      low: Math.round(low * 100) / 100,
      close: Math.round(close * 100) / 100,
      volume,
    });
    
    price = close;
  }
  
  return klines;
}

/**
 * 获取财务指标
 * 对应a-stock-data: fina_indicator / 财务指标
 * 数据源: 东财 / mootdx
 */
export async function fetchFinancialIndicators(code: string): Promise<{
  pe_ttm: number;
  pb: number;
  roe: number;
  revenue_growth: number;
  profit_growth: number;
  gross_margin: number;
  debt_ratio: number;
  cash_flow_per_share: number;
}> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchFinancialIndicators(code);
  }
  await delay(300);
  
  const stock = mockStocks.find(s => s.code === code)!;
  
  return {
    pe_ttm: stock.pe,
    pb: stock.pb,
    roe: stock.roe,
    revenue_growth: Math.round((Math.random() * 0.3 - 0.05) * 100) / 100,
    profit_growth: Math.round((Math.random() * 0.4 - 0.1) * 100) / 100,
    gross_margin: Math.round((Math.random() * 0.4 + 0.2) * 100) / 100,
    debt_ratio: Math.round((Math.random() * 0.5 + 0.2) * 100) / 100,
    cash_flow_per_share: Math.round(Math.random() * 5 * 100) / 100,
  };
}

// ==================== 选股接口 ====================

/**
 * 执行选股
 * 对应a-stock-data + 策略引擎
 * @param strategyId 策略ID
 * @param params 自定义参数
 */
export async function runStockSelection(
  strategyId: string,
  params?: Record<string, any>
): Promise<SelectionResult> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.runStockSelection(strategyId, params);
  }
  await delay(1500);
  
  const result = mockSelectionResults.find(r => r.strategyId === strategyId);
  
  if (result) {
    return {
      ...result,
      taskId: `sel-${Date.now()}`,
      executedAt: new Date().toISOString(),
    };
  }
  
  // 如果没有匹配的结果，生成一个新的
  const scoredStocks = mockStocks.slice(0, 12).map((stock, index) => {
    const quote = getQuoteByCode(stock.code)!;
    const factorScores: Record<string, number> = {
      '市盈率': Math.round(Math.random() * 100 * 100) / 100,
      '市净率': Math.round(Math.random() * 100 * 100) / 100,
      '净资产收益率': Math.round(Math.random() * 100 * 100) / 100,
      '价格动量': Math.round(Math.random() * 100 * 100) / 100,
      '成交量': Math.round(Math.random() * 100 * 100) / 100,
    };
    
    return {
      stock,
      quote,
      score: Math.round((60 + Math.random() * 35) * 100) / 100,
      rank: index + 1,
      factorScores,
    };
  }).sort((a, b) => b.score - a.score).map((item, index) => ({ ...item, rank: index + 1 }));

  return {
    taskId: `sel-${Date.now()}`,
    strategyId,
    stocks: scoredStocks,
    executedAt: new Date().toISOString(),
    totalCount: scoredStocks.length,
  };
}

// ==================== 回测接口 ====================

/**
 * 执行回测
 * 对应策略引擎 + a-stock-data历史数据
 * @param stockCode 股票代码
 * @param strategyId 策略ID
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @param initialCapital 初始资金
 */
export async function runBacktest(
  stockCode: string,
  strategyId: string,
  startDate: string,
  endDate: string,
  initialCapital: number = 100000
): Promise<BacktestResult> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.runBacktest(stockCode, strategyId, startDate, endDate, initialCapital);
  }
  await delay(2000);
  
  // 生成每日收益
  const dailyReturns: DailyReturn[] = [];
  let value = initialCapital;
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  while (start <= end) {
    const isWeekend = start.getDay() === 0 || start.getDay() === 6;
    if (!isWeekend) {
      const dailyReturn = (Math.random() - 0.45) * 0.025;
      const benchmark = (Math.random() - 0.48) * 0.02;
      
      value = value * (1 + dailyReturn);
      
      dailyReturns.push({
        date: start.toISOString().split('T')[0],
        value: Math.round(value),
        return: Math.round(dailyReturn * 10000) / 100,
        benchmark: Math.round(benchmark * 10000) / 100,
      });
    }
    start.setDate(start.getDate() + 1);
  }

  // 生成交易记录
  const trades: BacktestTrade[] = [];
  const stock = mockStocks.find(s => s.code === stockCode);
  const quote = getQuoteByCode(stockCode)!;
  const tradeCount = Math.floor(Math.random() * 10) + 5;
  let holdings = 0;
  let cash = initialCapital;
  
  for (let i = 0; i < tradeCount; i++) {
    const tradeDate = new Date(startDate);
    tradeDate.setDate(tradeDate.getDate() + Math.floor(Math.random() * 180));
    
    if (tradeDate > new Date(endDate)) break;
    
    const isBuy = i % 2 === 0;
    const tradePrice = quote.price * (1 + (Math.random() - 0.5) * 0.15);
    const shares = isBuy 
      ? Math.floor(cash * 0.3 / tradePrice / 100) * 100
      : Math.floor(holdings * 0.5 / 100) * 100;
    
    if (shares <= 0) continue;
    
    const amount = Math.round(tradePrice * shares);
    
    if (isBuy) {
      if (amount > cash) continue;
      cash -= amount;
      holdings += shares;
    } else {
      if (holdings < shares) continue;
      cash += amount;
      holdings -= shares;
    }
    
    trades.push({
      date: tradeDate.toISOString().split('T')[0],
      type: isBuy ? 'buy' : 'sell',
      price: Math.round(tradePrice * 100) / 100,
      shares,
      amount,
      reason: isBuy ? '策略信号触发：买入条件满足' : '策略信号触发：卖出条件满足',
    });
  }

  // 计算绩效指标
  const totalReturn = ((value - initialCapital) / initialCapital) * 100;
  const days = dailyReturns.length;
  const annualReturn = totalReturn / (days / 252);
  
  const returns = dailyReturns.map(d => d.return / 100);
  const avgReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
  const stdDev = Math.sqrt(variance);
  const sharpeRatio = (avgReturn * 252) / (stdDev * Math.sqrt(252));
  
  let maxValue = initialCapital;
  let maxDrawdown = 0;
  for (const d of dailyReturns) {
    if (d.value > maxValue) maxValue = d.value;
    const drawdown = (maxValue - d.value) / maxValue * 100;
    if (drawdown > maxDrawdown) maxDrawdown = drawdown;
  }
  
  const winTrades = trades.filter((t, i) => {
    if (t.type === 'sell' && i > 0) {
      const prevBuy = trades.slice(0, i).filter(bt => bt.type === 'buy').pop();
      if (prevBuy) return t.price > prevBuy.price;
    }
    return false;
  }).length;
  
  const sellTrades = trades.filter(t => t.type === 'sell').length;
  const winRate = sellTrades > 0 ? (winTrades / sellTrades) * 100 : 50;

  const performance: BacktestPerformance = {
    totalReturn: Math.round(totalReturn * 100) / 100,
    annualReturn: Math.round(annualReturn * 100) / 100,
    maxDrawdown: Math.round(maxDrawdown * 100) / 100,
    sharpeRatio: Math.round(sharpeRatio * 100) / 100,
    winRate: Math.round(winRate * 100) / 100,
    profitLossRatio: Math.round((Math.random() * 0.8 + 1.0) * 100) / 100,
    alpha: Math.round((Math.random() * 0.15 + 0.05) * 10000) / 100,
    beta: Math.round((Math.random() * 0.6 + 0.6) * 100) / 100,
  };

  return {
    taskId: `bt-${Date.now()}`,
    stockCode,
    strategyId,
    startDate,
    endDate,
    performance,
    trades: trades.sort((a, b) => a.date.localeCompare(b.date)),
    dailyReturns,
  };
}

// ==================== 策略接口 ====================

/**
 * 获取策略列表
 */
export async function fetchStrategies(): Promise<Strategy[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchStrategies();
  }
  await delay(200);
  return mockStrategies;
}

/**
 * 保存策略
 */
export async function saveStrategy(strategy: Strategy): Promise<Strategy> {
  await delay(300);
  return {
    ...strategy,
    updatedAt: new Date().toISOString(),
  };
}

// ==================== 通用配置接口 ====================

/**
 * 获取所有行业列表
 */
export async function fetchIndustries(): Promise<string[]> {
  if (!apiConfig.useMockData && !apiConfig.backendDown) {
    return realApi.fetchIndustries();
  }
  await delay(100);
  return [...new Set(mockStocks.map(s => s.industry))];
}

/**
 * 获取所有可筛选字段
 */
export const getFilterFields = () => [
  { key: 'pe', label: '市盈率(PE-TTM)', unit: '倍', type: 'number', category: '估值' },
  { key: 'pb', label: '市净率(PB)', unit: '倍', type: 'number', category: '估值' },
  { key: 'ps', label: '市销率(PS)', unit: '倍', type: 'number', category: '估值' },
  { key: 'peg', label: 'PEG指标', unit: '倍', type: 'number', category: '估值' },
  { key: 'ev_ebitda', label: 'EV/EBITDA', unit: '倍', type: 'number', category: '估值' },
  { key: 'roe', label: '净资产收益率(ROE)', unit: '%', type: 'number', category: '质量' },
  { key: 'roa', label: '资产收益率(ROA)', unit: '%', type: 'number', category: '质量' },
  { key: 'grossMargin', label: '毛利率', unit: '%', type: 'number', category: '质量' },
  { key: 'netMargin', label: '净利率', unit: '%', type: 'number', category: '质量' },
  { key: 'debtRatio', label: '资产负债率', unit: '%', type: 'number', category: '质量' },
  { key: 'cashFlowRatio', label: '经营现金流比率', unit: '%', type: 'number', category: '质量' },
  { key: 'revenueGrowth', label: '营收增长率', unit: '%', type: 'number', category: '成长' },
  { key: 'profitGrowth', label: '净利润增长率', unit: '%', type: 'number', category: '成长' },
  { key: 'roeGrowth', label: 'ROE增长率', unit: '%', type: 'number', category: '成长' },
  { key: 'grossMarginGrowth', label: '毛利率增长率', unit: '%', type: 'number', category: '成长' },
  { key: 'marketCap', label: '总市值', unit: '亿', type: 'number', category: '市场' },
  { key: 'circulatingMarketCap', label: '流通市值', unit: '亿', type: 'number', category: '市场' },
  { key: 'price', label: '现价', unit: '元', type: 'number', category: '市场' },
  { key: 'changePercent', label: '涨跌幅', unit: '%', type: 'number', category: '市场' },
  { key: 'turnover', label: '换手率', unit: '%', type: 'number', category: '市场' },
  { key: 'volume', label: '成交量', unit: '手', type: 'number', category: '市场' },
  { key: 'amount', label: '成交额', unit: '万', type: 'number', category: '市场' },
  { key: 'amplitude', label: '振幅', unit: '%', type: 'number', category: '市场' },
  { key: 'volumeRatio', label: '量比', unit: '倍', type: 'number', category: '技术' },
  { key: 'ma5', label: '5日均线', unit: '元', type: 'number', category: '技术' },
  { key: 'ma10', label: '10日均线', unit: '元', type: 'number', category: '技术' },
  { key: 'ma20', label: '20日均线', unit: '元', type: 'number', category: '技术' },
  { key: 'ma60', label: '60日均线', unit: '元', type: 'number', category: '技术' },
  { key: 'rsi', label: 'RSI(14)', unit: '', type: 'number', category: '技术' },
  { key: 'macd', label: 'MACD', unit: '', type: 'number', category: '技术' },
  { key: 'kdj_k', label: 'KDJ-K值', unit: '', type: 'number', category: '技术' },
  { key: 'kdj_d', label: 'KDJ-D值', unit: '', type: 'number', category: '技术' },
  { key: 'boll_upper', label: '布林带上轨', unit: '元', type: 'number', category: '技术' },
  { key: 'boll_lower', label: '布林带下轨', unit: '元', type: 'number', category: '技术' },
];

/**
 * 获取策略因子库
 */
export const getFactorLibrary = () => [
  // 价值因子
  { category: '价值因子', factors: [
    { key: 'pe_ratio', name: '市盈率', description: '股价 / 每股收益，衡量股票估值高低', weightRange: [0, 0.5], defaultWeight: 0.25 },
    { key: 'pb_ratio', name: '市净率', description: '股价 / 每股净资产，反映市场对公司净资产的定价', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'peg', name: 'PEG指标', description: '市盈率 / 盈利增长率，兼顾估值与成长性', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'ev_ebitda', name: 'EV/EBITDA', description: '企业价值 / 息税折旧摊销前利润，适用于资本密集型行业', weightRange: [0, 0.5], defaultWeight: 0.15 },
  ]},
  // 成长因子
  { category: '成长因子', factors: [
    { key: 'revenue_growth', name: '营收增长率', description: '营业收入同比增速，反映公司业务扩张能力', weightRange: [0, 0.5], defaultWeight: 0.25 },
    { key: 'profit_growth', name: '净利润增长率', description: '净利润同比增速，反映公司盈利能力增长', weightRange: [0, 0.5], defaultWeight: 0.25 },
    { key: 'roe_growth', name: 'ROE增长率', description: '净资产收益率同比变化，反映盈利能力提升', weightRange: [0, 0.5], defaultWeight: 0.15 },
    { key: 'gross_margin_growth', name: '毛利率变化', description: '毛利率同比变化，反映成本控制和定价能力', weightRange: [0, 0.5], defaultWeight: 0.15 },
  ]},
  // 质量因子
  { category: '质量因子', factors: [
    { key: 'roe', name: '净资产收益率', description: '净利润 / 净资产，衡量股东资本回报率', weightRange: [0, 0.5], defaultWeight: 0.3 },
    { key: 'roa', name: '资产收益率', description: '净利润 / 总资产，反映资产利用效率', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'gross_margin', name: '毛利率', description: '毛利 / 营收，反映产品盈利能力和竞争壁垒', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'debt_ratio', name: '资产负债率', description: '总负债 / 总资产，反映财务杠杆和风险', weightRange: [0, 0.5], defaultWeight: 0.15 },
    { key: 'cash_flow_ratio', name: '经营现金流比率', description: '经营现金流 / 净利润，反映盈利质量', weightRange: [0, 0.5], defaultWeight: 0.15 },
  ]},
  // 动量因子
  { category: '动量因子', factors: [
    { key: 'momentum_20d', name: '20日动量', description: '过去20个交易日涨跌幅，捕捉短期趋势', weightRange: [0, 0.5], defaultWeight: 0.25 },
    { key: 'momentum_60d', name: '60日动量', description: '过去60个交易日涨跌幅，捕捉中期趋势', weightRange: [0, 0.5], defaultWeight: 0.25 },
    { key: 'momentum_250d', name: '250日动量', description: '过去250个交易日涨跌幅，捕捉长期趋势', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'volume_momentum', name: '成交量动量', description: '成交量变化趋势，反映资金关注度变化', weightRange: [0, 0.5], defaultWeight: 0.15 },
  ]},
  // 技术指标
  { category: '技术指标', factors: [
    { key: 'ma_golden_cross', name: '均线金叉', description: '短期均线上穿长期均线，趋势转强信号', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'macd_golden_cross', name: 'MACD金叉', description: 'MACD线上穿信号线，买入信号', weightRange: [0, 0.5], defaultWeight: 0.2 },
    { key: 'rsi_oversold', name: 'RSI超卖', description: 'RSI低于30，可能反弹机会', weightRange: [0, 0.5], defaultWeight: 0.15 },
    { key: 'bollinger_bounce', name: '布林带反弹', description: '价格触及下轨后反弹，短线信号', weightRange: [0, 0.5], defaultWeight: 0.15 },
    { key: 'volume_breakout', name: '放量突破', description: '成交量放大配合价格突破', weightRange: [0, 0.5], defaultWeight: 0.15 },
  ]},
];

export { setUseMockData, apiConfig };