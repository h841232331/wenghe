import { apiConfig, markBackendDown } from './config';
import { Stock, StockQuote, Strategy, SelectionResult, BacktestResult, MarketOverview } from '../types';

interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

const request = async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
  const url = `${apiConfig.baseURL}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      signal: AbortSignal.timeout(apiConfig.timeout),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = (await response.json()) as ApiResponse<T>;

    if (!result.success) {
      throw new Error(result.message || '请求失败');
    }

    return result.data;
  } catch (error) {
    // 网络错误（后端不可用）→ 标记后端降级
    if (error instanceof TypeError && error.message.includes('fetch')) {
      markBackendDown();
    } else if (error instanceof DOMException && error.name === 'TimeoutError') {
      markBackendDown();
    }
    console.error(`API request failed: ${endpoint}`, error);
    throw error;
  }
};

export const realApi = {
  async fetchQuotes(codes: string[]): Promise<StockQuote[]> {
    return request<StockQuote[]>(`/stock/quote?codes=${codes.join(',')}`);
  },

  async fetchStockInfo(codes: string[]): Promise<Stock[]> {
    return request<Stock[]>(`/stock/info?codes=${codes.join(',')}`);
  },

  async searchStocks(keyword: string): Promise<Stock[]> {
    return request<Stock[]>(`/stock/search?keyword=${encodeURIComponent(keyword)}`);
  },

  async fetchMarketOverview(): Promise<MarketOverview> {
    return request<MarketOverview>('/market/overview');
  },

  async fetchTopGainers(limit: number = 10): Promise<StockQuote[]> {
    return request<StockQuote[]>(`/market/top-gainers?limit=${limit}`);
  },

  async fetchTopLosers(limit: number = 10): Promise<StockQuote[]> {
    return request<StockQuote[]>(`/market/top-losers?limit=${limit}`);
  },

  async fetchTopVolume(limit: number = 10): Promise<StockQuote[]> {
    return request<StockQuote[]>(`/market/top-volume?limit=${limit}`);
  },

  async fetchKline(code: string, frequency: string = '1d', count: number = 100): Promise<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]> {
    return request<{ date: string; open: number; high: number; low: number; close: number; volume: number }[]>(`/stock/kline?code=${code}&frequency=${frequency}&count=${count}`);
  },

  async fetchFinancialIndicators(code: string): Promise<{
    pe_ttm: number;
    pb: number;
    roe: number;
    revenue_growth: number;
    profit_growth: number;
    gross_margin: number;
    debt_ratio: number;
    cash_flow_per_share: number;
  }> {
    return request<{
      pe_ttm: number;
      pb: number;
      roe: number;
      revenue_growth: number;
      profit_growth: number;
      gross_margin: number;
      debt_ratio: number;
      cash_flow_per_share: number;
    }>(`/stock/financial?code=${code}`);
  },

  async fetchStrategies(): Promise<Strategy[]> {
    return request<Strategy[]>('/strategy');
  },

  async fetchStrategyById(id: string): Promise<Strategy> {
    return request<Strategy>(`/strategy/${id}`);
  },

  async runStockSelection(strategyId: string, params?: Record<string, any>): Promise<SelectionResult> {
    return request<SelectionResult>('/selection/run', {
      method: 'POST',
      body: JSON.stringify({ strategyId, ...params }),
    });
  },

  async runBacktest(
    stockCode: string,
    strategyId: string,
    startDate: string,
    endDate: string,
    initialCapital: number = 100000
  ): Promise<BacktestResult> {
    return request<BacktestResult>('/backtest/run', {
      method: 'POST',
      body: JSON.stringify({ stockCode, strategyId, startDate, endDate, initialCapital }),
    });
  },

  async fetchIndustries(): Promise<string[]> {
    return request<string[]>('/stock/industries');
  },
};
