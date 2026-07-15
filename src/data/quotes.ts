import { StockQuote } from '../types';

// 生成随机行情数据
const generateQuote = (code: string, name: string, basePrice: number): StockQuote => {
  const changePercent = (Math.random() - 0.5) * 0.1; // -5% ~ 5%
  const price = basePrice * (1 + changePercent);
  const change = price - basePrice;
  
  return {
    code,
    name,
    price: Math.round(price * 100) / 100,
    change: Math.round(change * 100) / 100,
    changePercent: Math.round(changePercent * 10000) / 100,
    volume: Math.floor(Math.random() * 5000000) + 100000,
    amount: Math.floor(Math.random() * 500000) + 10000,
    turnover: Math.round((Math.random() * 10 + 0.5) * 100) / 100,
    high: Math.round(price * 1.03 * 100) / 100,
    low: Math.round(price * 0.97 * 100) / 100,
    open: Math.round(price * (1 + (Math.random() - 0.5) * 0.02) * 100) / 100,
    preClose: basePrice,
  };
};

// 模拟真实股价数据
const basePrices: Record<string, number> = {
  '600519': 1850.00, // 贵州茅台
  '600036': 38.50,   // 招商银行
  '601318': 48.20,   // 中国平安
  '600276': 42.50,   // 恒瑞医药
  '600887': 32.80,   // 伊利股份
  '601899': 12.50,   // 紫金矿业
  '601398': 5.20,    // 工商银行
  '601288': 3.85,    // 农业银行
  '600030': 22.50,   // 中信证券
  '601166': 18.20,   // 兴业银行
  '601012': 45.80,   // 隆基绿能
  '600900': 25.50,   // 长江电力
  '601888': 115.50,  // 中国中免
  '600585': 28.50,   // 海螺水泥
  '600048': 12.50,   // 保利发展
  '000858': 148.50,  // 五粮液
  '000333': 62.50,   // 美的集团
  '000651': 38.50,   // 格力电器
  '000001': 12.50,   // 平安银行
  '000002': 12.80,   // 万科A
  '000063': 25.50,   // 中兴通讯
  '000568': 218.50,  // 泸州老窖
  '000538': 52.80,   // 云南白药
  '000625': 15.80,   // 长安汽车（修正代码）
  '000069': 5.85,    // 华侨城A
  '000060': 5.28,    // 中金岭南
  '000425': 6.85,    // 徐工机械（修正代码）
  '000792': 18.50,   // 盐湖股份
  '300750': 185.50,  // 宁德时代
  '300059': 18.50,   // 东方财富
  '300015': 28.50,   // 爱尔眼科
  '300347': 85.50,   // 泰格医药
  '300014': 58.50,   // 亿纬锂能
  '300274': 85.50,   // 阳光电源
  '300124': 65.50,   // 汇川技术
  '300496': 85.50,   // 中科创达
  '300033': 85.50,   // 同花顺
  '300454': 32.50,   // 深信服
};

const stockNames: Record<string, string> = {
  '600519': '贵州茅台',
  '600036': '招商银行',
  '601318': '中国平安',
  '600276': '恒瑞医药',
  '600887': '伊利股份',
  '601899': '紫金矿业',
  '601398': '工商银行',
  '601288': '农业银行',
  '600030': '中信证券',
  '601166': '兴业银行',
  '601012': '隆基绿能',
  '600900': '长江电力',
  '601888': '中国中免',
  '600585': '海螺水泥',
  '600048': '保利发展',
  '000858': '五粮液',
  '000333': '美的集团',
  '000651': '格力电器',
  '000001': '平安银行',
  '000002': '万科A',
  '000725': '京东方A',
  '000063': '中兴通讯',
  '000568': '泸州老窖',
  '000538': '云南白药',
  '000625': '长安汽车',
  '000069': '华侨城A',
  '000060': '中金岭南',
  '000425': '徐工机械',
  '000792': '盐湖股份',
  '300750': '宁德时代',
  '300059': '东方财富',
  '300015': '爱尔眼科',
  '300347': '泰格医药',
  '300014': '亿纬锂能',
  '300274': '阳光电源',
  '300124': '汇川技术',
  '300496': '中科创达',
  '300033': '同花顺',
  '300454': '深信服',
};

// 生成所有行情数据
export const quotes: StockQuote[] = Object.entries(basePrices).map(([code, basePrice]) => {
  return generateQuote(code, stockNames[code] || '未知', basePrice);
});

// 根据代码获取行情
export const getQuoteByCode = (code: string): StockQuote | undefined => {
  const basePrice = basePrices[code];
  const name = stockNames[code];
  if (!basePrice || !name) return undefined;
  return generateQuote(code, name, basePrice);
};

// 获取涨幅榜
export const getTopGainers = (limit: number = 10): StockQuote[] => {
  return [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, limit);
};

// 获取跌幅榜
export const getTopLosers = (limit: number = 10): StockQuote[] => {
  return [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, limit);
};

// 获取成交额排行
export const getTopVolume = (limit: number = 10): StockQuote[] => {
  return [...quotes].sort((a, b) => b.amount - a.amount).slice(0, limit);
};