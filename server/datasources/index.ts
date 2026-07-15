import { config } from '../config';
import { mockDataSource } from './mock';
import { realDataSource } from './real';

export interface StockInfo {
  code: string;
  name: string;
  industry: string;
  market: string;
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

export interface KlineData {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface FinancialIndicators {
  pe_ttm: number;
  pb: number;
  roe: number;
  revenue_growth: number;
  profit_growth: number;
  gross_margin: number;
  debt_ratio: number;
  cash_flow_per_share: number;
}

export interface DataSource {
  getQuotes: (codes: string[]) => Promise<StockQuote[]>;
  getStockInfo: (codes: string[]) => Promise<StockInfo[]>;
  searchStocks: (keyword: string) => Promise<StockInfo[]>;
  getMarketOverview: () => Promise<MarketOverview>;
  getTopGainers: (limit?: number) => Promise<StockQuote[]>;
  getTopLosers: (limit?: number) => Promise<StockQuote[]>;
  getTopVolume: (limit?: number) => Promise<StockQuote[]>;
  getKline: (code: string, frequency?: string, count?: number) => Promise<KlineData[]>;
  getFinancialIndicators: (code: string) => Promise<FinancialIndicators>;
  getIndustries: () => Promise<string[]>;
}

/**
 * 包装真实数据源，当外部 API 不可达时自动降级到 mock 数据
 */
function createFallbackDataSource(): DataSource {
  const wrap = <T>(fnName: string, realFn: (...args: any[]) => Promise<T>, mockFn: (...args: any[]) => Promise<T>) => {
    return async (...args: any[]): Promise<T> => {
      try {
        const result = await realFn(...args);
        // 如果返回空数组且不是预期行为，降级
        if (Array.isArray(result) && result.length === 0 && config.fallbackToMock) {
          console.warn(`[DataSource] ${fnName} returned empty, falling back to mock`);
          return mockFn(...args);
        }
        return result;
      } catch (e) {
        if (config.fallbackToMock) {
          console.warn(`[DataSource] ${fnName} failed, falling back to mock:`, e instanceof Error ? e.message : e);
          return mockFn(...args);
        }
        throw e;
      }
    };
  };

  return {
    getQuotes: wrap('getQuotes', realDataSource.getQuotes, mockDataSource.getQuotes),
    getStockInfo: wrap('getStockInfo', realDataSource.getStockInfo, mockDataSource.getStockInfo),
    searchStocks: wrap('searchStocks', realDataSource.searchStocks, mockDataSource.searchStocks),
    getMarketOverview: wrap('getMarketOverview', realDataSource.getMarketOverview, mockDataSource.getMarketOverview),
    getTopGainers: wrap('getTopGainers', realDataSource.getTopGainers, mockDataSource.getTopGainers),
    getTopLosers: wrap('getTopLosers', realDataSource.getTopLosers, mockDataSource.getTopLosers),
    getTopVolume: wrap('getTopVolume', realDataSource.getTopVolume, mockDataSource.getTopVolume),
    getKline: wrap('getKline', realDataSource.getKline, mockDataSource.getKline),
    getFinancialIndicators: wrap('getFinancialIndicators', realDataSource.getFinancialIndicators, mockDataSource.getFinancialIndicators),
    getIndustries: wrap('getIndustries', realDataSource.getIndustries, mockDataSource.getIndustries),
  };
}

let _cachedSource: DataSource | null = null;

export const getDataSource = (): DataSource => {
  if (_cachedSource) return _cachedSource;

  if (config.dataSource === 'real') {
    console.log('[DataSource] 使用真实数据源（腾讯财经/东财 HTTP API），失败自动降级到 mock');
    _cachedSource = createFallbackDataSource();
  } else {
    console.log('[DataSource] 使用模拟数据源 (mock)');
    _cachedSource = mockDataSource;
  }
  return _cachedSource;
};

/** 运行时切换数据源 */
export const switchDataSource = (source: 'mock' | 'real'): void => {
  config.dataSource = source;
  _cachedSource = null; // 清除缓存，下次调用重新创建
  console.log(`[DataSource] 切换到: ${source}`);
};
