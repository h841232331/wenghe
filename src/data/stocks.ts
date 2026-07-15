import { Stock } from '../types';

// 生成模拟股票数据
const industries = ['银行', '证券', '保险', '房地产', '医药生物', '食品饮料', '电子', '计算机', '通信', '传媒', '电力', '汽车', '机械设备', '化工', '建筑材料', '钢铁', '采掘', '有色金属', '家用电器', '商业贸易'];

const shStocks: Stock[] = [
  { code: '600519', name: '贵州茅台', industry: '食品饮料', market: 'SH', marketCap: 22000, pe: 35.2, pb: 12.5, roe: 31.2 },
  { code: '600036', name: '招商银行', industry: '银行', market: 'SH', marketCap: 9800, pe: 6.5, pb: 0.85, roe: 16.8 },
  { code: '601318', name: '中国平安', industry: '保险', market: 'SH', marketCap: 8500, pe: 8.2, pb: 1.05, roe: 15.3 },
  { code: '600276', name: '恒瑞医药', industry: '医药生物', market: 'SH', marketCap: 2800, pe: 45.6, pb: 8.2, roe: 22.5 },
  { code: '600887', name: '伊利股份', industry: '食品饮料', market: 'SH', marketCap: 2100, pe: 25.3, pb: 6.8, roe: 26.7 },
  { code: '601899', name: '紫金矿业', industry: '有色金属', market: 'SH', marketCap: 3200, pe: 15.8, pb: 2.1, roe: 18.5 },
  { code: '601398', name: '工商银行', industry: '银行', market: 'SH', marketCap: 18500, pe: 5.2, pb: 0.65, roe: 12.5 },
  { code: '601288', name: '农业银行', industry: '银行', market: 'SH', marketCap: 13500, pe: 4.8, pb: 0.55, roe: 11.8 },
  { code: '600030', name: '中信证券', industry: '证券', market: 'SH', marketCap: 2800, pe: 18.5, pb: 1.45, roe: 8.5 },
  { code: '601166', name: '兴业银行', industry: '银行', market: 'SH', marketCap: 3200, pe: 5.8, pb: 0.68, roe: 14.2 },
  { code: '601012', name: '隆基绿能', industry: '电力', market: 'SH', marketCap: 3500, pe: 22.5, pb: 4.2, roe: 25.8 },
  { code: '600900', name: '长江电力', industry: '电力', market: 'SH', marketCap: 5800, pe: 20.5, pb: 2.85, roe: 14.5 },
  { code: '601888', name: '中国中免', industry: '商业贸易', market: 'SH', marketCap: 3200, pe: 28.6, pb: 5.2, roe: 18.5 },
  { code: '600585', name: '海螺水泥', industry: '建筑材料', market: 'SH', marketCap: 1500, pe: 8.5, pb: 0.95, roe: 12.5 },
  { code: '600048', name: '保利发展', industry: '房地产', market: 'SH', marketCap: 1200, pe: 7.2, pb: 0.85, roe: 10.5 },
];

const szStocks: Stock[] = [
  { code: '000858', name: '五粮液', industry: '食品饮料', market: 'SZ', marketCap: 5800, pe: 28.5, pb: 8.5, roe: 28.5 },
  { code: '000333', name: '美的集团', industry: '家用电器', market: 'SZ', marketCap: 4200, pe: 14.5, pb: 3.8, roe: 25.2 },
  { code: '000651', name: '格力电器', industry: '家用电器', market: 'SZ', marketCap: 2100, pe: 8.2, pb: 1.85, roe: 20.5 },
  { code: '000001', name: '平安银行', industry: '银行', market: 'SZ', marketCap: 2200, pe: 6.8, pb: 0.72, roe: 12.5 },
  { code: '000002', name: '万科A', industry: '房地产', market: 'SZ', marketCap: 1500, pe: 8.5, pb: 0.95, roe: 11.2 },
  { code: '000725', name: '京东方A', industry: '电子', market: 'SZ', marketCap: 1800, pe: 12.5, pb: 1.45, roe: 8.5 },
  { code: '000063', name: '中兴通讯', industry: '通信', market: 'SZ', marketCap: 1200, pe: 18.5, pb: 2.1, roe: 12.8 },
  { code: '000568', name: '泸州老窖', industry: '食品饮料', market: 'SZ', marketCap: 3200, pe: 32.5, pb: 9.2, roe: 30.5 },
  { code: '000538', name: '云南白药', industry: '医药生物', market: 'SZ', marketCap: 950, pe: 35.2, pb: 5.8, roe: 16.5 },
  { code: '000725', name: '长安汽车', industry: '汽车', market: 'SZ', marketCap: 1500, pe: 15.8, pb: 1.85, roe: 10.5 },
  { code: '000069', name: '华侨城A', industry: '房地产', market: 'SZ', marketCap: 380, pe: 12.5, pb: 0.85, roe: 8.2 },
  { code: '000060', name: '中金岭南', industry: '有色金属', market: 'SZ', marketCap: 280, pe: 10.5, pb: 1.15, roe: 9.8 },
  { code: '000002', name: '徐工机械', industry: '机械设备', market: 'SZ', marketCap: 520, pe: 11.5, pb: 1.25, roe: 10.2 },
  { code: '000425', name: '徐工机械', industry: '机械设备', market: 'SZ', marketCap: 480, pe: 12.2, pb: 1.35, roe: 11.5 },
  { code: '000792', name: '盐湖股份', industry: '化工', market: 'SZ', marketCap: 950, pe: 18.5, pb: 2.5, roe: 15.8 },
];

const cybStocks: Stock[] = [
  { code: '300750', name: '宁德时代', industry: '电子', market: 'SZ', marketCap: 9500, pe: 45.2, pb: 8.5, roe: 22.5 },
  { code: '300059', name: '东方财富', industry: '证券', market: 'SZ', marketCap: 2800, pe: 35.5, pb: 5.2, roe: 18.5 },
  { code: '300015', name: '爱尔眼科', industry: '医药生物', market: 'SZ', marketCap: 1800, pe: 65.2, pb: 12.5, roe: 18.5 },
  { code: '300347', name: '泰格医药', industry: '医药生物', market: 'SZ', marketCap: 850, pe: 45.8, pb: 6.2, roe: 15.5 },
  { code: '300014', name: '亿纬锂能', industry: '电子', market: 'SZ', marketCap: 1200, pe: 35.5, pb: 5.8, roe: 20.5 },
  { code: '300274', name: '阳光电源', industry: '电力', market: 'SZ', marketCap: 1800, pe: 38.5, pb: 6.5, roe: 22.5 },
  { code: '300124', name: '汇川技术', industry: '机械设备', market: 'SZ', marketCap: 1500, pe: 32.5, pb: 5.5, roe: 21.5 },
  { code: '300496', name: '中科创达', industry: '计算机', market: 'SZ', marketCap: 650, pe: 55.5, pb: 8.2, roe: 16.5 },
  { code: '300033', name: '同花顺', industry: '计算机', market: 'SZ', marketCap: 850, pe: 42.5, pb: 7.5, roe: 25.5 },
  { code: '300454', name: '深信服', industry: '计算机', market: 'SZ', marketCap: 480, pe: 52.5, pb: 5.8, roe: 12.5 },
];

export const stocks: Stock[] = [...shStocks, ...szStocks, ...cybStocks];

// 根据代码获取股票
export const getStockByCode = (code: string): Stock | undefined => {
  return stocks.find(stock => stock.code === code);
};

// 根据行业获取股票
export const getStocksByIndustry = (industry: string): Stock[] => {
  return stocks.filter(stock => stock.industry === industry);
};

// 获取所有行业
export const getAllIndustries = (): string[] => {
  return [...new Set(stocks.map(stock => stock.industry))];
};