import { DataSource, StockInfo, StockQuote, MarketOverview, KlineData, FinancialIndicators } from './index';

const stocks: StockInfo[] = [
  { code: '600519', name: '贵州茅台', industry: '食品饮料', market: 'SH', marketCap: 21500, pe: 32.5, pb: 10.2, roe: 28.5 },
  { code: '000858', name: '五粮液', industry: '食品饮料', market: 'SZ', marketCap: 6800, pe: 25.8, pb: 6.5, roe: 22.3 },
  { code: '601318', name: '中国平安', industry: '保险', market: 'SH', marketCap: 5200, pe: 8.2, pb: 0.9, roe: 11.5 },
  { code: '000333', name: '美的集团', industry: '家电', market: 'SZ', marketCap: 4800, pe: 14.5, pb: 3.2, roe: 20.1 },
  { code: '600036', name: '招商银行', industry: '银行', market: 'SH', marketCap: 9500, pe: 7.8, pb: 1.1, roe: 13.8 },
  { code: '000001', name: '平安银行', industry: '银行', market: 'SZ', marketCap: 2800, pe: 6.5, pb: 0.75, roe: 11.2 },
  { code: '601012', name: '隆基绿能', industry: '电力设备', market: 'SH', marketCap: 2200, pe: 12.3, pb: 2.8, roe: 18.5 },
  { code: '300750', name: '宁德时代', industry: '电力设备', market: 'SZ', marketCap: 8500, pe: 18.6, pb: 4.5, roe: 22.8 },
  { code: '002594', name: '比亚迪', industry: '汽车', market: 'SZ', marketCap: 7200, pe: 22.4, pb: 5.8, roe: 16.5 },
  { code: '600900', name: '长江电力', industry: '电力', market: 'SH', marketCap: 5600, pe: 18.2, pb: 2.5, roe: 12.8 },
  { code: '601899', name: '紫金矿业', industry: '有色金属', market: 'SH', marketCap: 3800, pe: 15.8, pb: 3.2, roe: 18.2 },
  { code: '000568', name: '泸州老窖', industry: '食品饮料', market: 'SZ', marketCap: 3200, pe: 28.6, pb: 8.5, roe: 26.4 },
  { code: '600809', name: '山西汾酒', industry: '食品饮料', market: 'SH', marketCap: 2800, pe: 35.2, pb: 12.8, roe: 32.1 },
  { code: '000725', name: '京东方A', industry: '电子', market: 'SZ', marketCap: 1600, pe: 18.5, pb: 1.2, roe: 6.8 },
  { code: '002415', name: '海康威视', industry: '电子', market: 'SZ', marketCap: 3100, pe: 20.3, pb: 4.2, roe: 19.5 },
  { code: '300059', name: '东方财富', industry: '非银金融', market: 'SZ', marketCap: 2600, pe: 25.6, pb: 5.2, roe: 18.9 },
  { code: '600030', name: '中信证券', industry: '非银金融', market: 'SH', marketCap: 3200, pe: 15.2, pb: 1.5, roe: 9.8 },
  { code: '601888', name: '中国中免', industry: '商贸零售', market: 'SH', marketCap: 2400, pe: 32.8, pb: 6.8, roe: 19.2 },
  { code: '002304', name: '洋河股份', industry: '食品饮料', market: 'SZ', marketCap: 1800, pe: 22.5, pb: 4.8, roe: 20.1 },
  { code: '000651', name: '格力电器', industry: '家电', market: 'SZ', marketCap: 2100, pe: 9.8, pb: 2.1, roe: 21.5 },
];

const generateQuote = (stock: StockInfo): StockQuote => {
  const changePercent = (Math.random() - 0.48) * 6;
  const price = stock.marketCap * 100000000 / (Math.random() * 50 + 100) / 100000000;
  return {
    code: stock.code,
    name: stock.name,
    price: Math.round(price * 100) / 100,
    change: Math.round(price * changePercent / 100 * 100) / 100,
    changePercent: Math.round(changePercent * 100) / 100,
    volume: Math.floor(Math.random() * 5000000 + 100000),
    amount: Math.floor(Math.random() * 500000 + 5000),
    turnover: Math.round((Math.random() * 5 + 0.5) * 100) / 100,
    high: Math.round(price * (1 + Math.random() * 0.03) * 100) / 100,
    low: Math.round(price * (1 - Math.random() * 0.03) * 100) / 100,
    open: Math.round(price * (1 + (Math.random() - 0.5) * 0.02) * 100) / 100,
    preClose: Math.round(price / (1 + changePercent / 100) * 100) / 100,
  };
};

const quotes: StockQuote[] = stocks.map(generateQuote);

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockDataSource: DataSource = {
  async getQuotes(codes: string[]): Promise<StockQuote[]> {
    await delay(200);
    return codes.map(code => quotes.find(q => q.code === code) || generateQuote(stocks[0])).filter(Boolean);
  },

  async getStockInfo(codes: string[]): Promise<StockInfo[]> {
    await delay(150);
    return stocks.filter(s => codes.includes(s.code));
  },

  async searchStocks(keyword: string): Promise<StockInfo[]> {
    await delay(200);
    return stocks.filter(s =>
      s.code.includes(keyword) ||
      s.name.includes(keyword) ||
      s.industry.includes(keyword)
    );
  },

  async getMarketOverview(): Promise<MarketOverview> {
    await delay(300);
    return {
      totalStocks: 5234,
      upCount: Math.floor(Math.random() * 2000 + 1500),
      downCount: Math.floor(Math.random() * 2000 + 1500),
      flatCount: Math.floor(Math.random() * 300 + 100),
      totalVolume: Math.floor(Math.random() * 500000000 + 300000000),
      totalAmount: Math.floor(Math.random() * 80000000 + 50000000),
      shIndex: Math.round((3000 + Math.random() * 200) * 100) / 100,
      shChange: Math.round((Math.random() - 0.48) * 50 * 100) / 100,
      shChangePercent: Math.round((Math.random() - 0.48) * 2 * 100) / 100,
      szIndex: Math.round((9500 + Math.random() * 500) * 100) / 100,
      szChange: Math.round((Math.random() - 0.48) * 150 * 100) / 100,
      szChangePercent: Math.round((Math.random() - 0.48) * 2 * 100) / 100,
    };
  },

  async getTopGainers(limit: number = 10): Promise<StockQuote[]> {
    await delay(200);
    return [...quotes].sort((a, b) => b.changePercent - a.changePercent).slice(0, limit);
  },

  async getTopLosers(limit: number = 10): Promise<StockQuote[]> {
    await delay(200);
    return [...quotes].sort((a, b) => a.changePercent - b.changePercent).slice(0, limit);
  },

  async getTopVolume(limit: number = 10): Promise<StockQuote[]> {
    await delay(200);
    return [...quotes].sort((a, b) => b.amount - a.amount).slice(0, limit);
  },

  async getKline(code: string, frequency: string = '1d', count: number = 100): Promise<KlineData[]> {
    await delay(400);
    const stock = stocks.find(s => s.code === code) || stocks[0];
    const klines: KlineData[] = [];
    let price = 50 + Math.random() * 100;
    const today = new Date();

    for (let i = count; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);

      if (date.getDay() === 0 || date.getDay() === 6) continue;

      const change = (Math.random() - 0.48) * 0.03;
      const open = price;
      const close = price * (1 + change);
      const high = Math.max(open, close) * (1 + Math.random() * 0.015);
      const low = Math.min(open, close) * (1 - Math.random() * 0.015);
      const volume = Math.floor(Math.random() * 1000000 + 200000);

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
  },

  async getFinancialIndicators(code: string): Promise<FinancialIndicators> {
    await delay(300);
    const stock = stocks.find(s => s.code === code) || stocks[0];
    return {
      pe_ttm: stock.pe,
      pb: stock.pb,
      roe: stock.roe,
      revenue_growth: Math.round((Math.random() * 0.4 - 0.05) * 100) / 100,
      profit_growth: Math.round((Math.random() * 0.5 - 0.1) * 100) / 100,
      gross_margin: Math.round((Math.random() * 0.5 + 0.2) * 100) / 100,
      debt_ratio: Math.round((Math.random() * 0.5 + 0.2) * 100) / 100,
      cash_flow_per_share: Math.round(Math.random() * 5 * 100) / 100,
    };
  },

  async getIndustries(): Promise<string[]> {
    await delay(100);
    return [...new Set(stocks.map(s => s.industry))];
  },
};
