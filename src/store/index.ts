import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Stock, StockQuote, Strategy, SelectionResult, BacktestResult, MarketOverview } from '../types';
import {
  fetchMarketOverview,
  fetchTopGainers,
  fetchTopLosers,
  fetchTopVolume,
  fetchQuotes,
  searchStocks,
  fetchStrategies,
  runStockSelection,
  runBacktest,
} from '../api';

// 应用状态接口
interface AppState {
  // 股票和行情数据
  stocks: Stock[];
  quotes: StockQuote[];
  selectedStock: Stock | null;
  selectedStocks: Stock[];

  // 策略数据
  strategies: Strategy[];
  selectedStrategy: Strategy | null;
  myStrategies: Strategy[];

  // 选股相关
  selectionResults: SelectionResult[];
  currentSelectionResult: SelectionResult | null;

  // 回测相关
  backtestResults: BacktestResult[];
  currentBacktestResult: BacktestResult | null;

  // 市场数据
  marketOverview: MarketOverview | null;
  topGainers: StockQuote[];
  topLosers: StockQuote[];
  topVolume: StockQuote[];

  // UI状态
  loading: boolean;
  dataReady: boolean; // 首次数据加载完成标记

  // Actions
  setLoading: (loading: boolean) => void;

  setSelectedStock: (stock: Stock | null) => void;
  addSelectedStock: (stock: Stock) => void;
  removeSelectedStock: (stockCode: string) => void;
  clearSelectedStocks: () => void;

  setSelectedStrategy: (strategy: Strategy | null) => void;
  addMyStrategy: (strategy: Strategy) => void;
  updateMyStrategy: (strategy: Strategy) => void;
  deleteMyStrategy: (strategyId: string) => void;

  runSelection: (strategyId: string, filters?: any[]) => void;
  setCurrentSelectionResult: (result: SelectionResult | null) => void;

  runBacktestAction: (stockCode: string, strategyId: string, startDate: string, endDate: string, initialCapital?: number) => void;
  setCurrentBacktestResult: (result: BacktestResult | null) => void;

  refreshMarketData: () => void;
  fetchInitialData: () => void;
}

// 创建状态管理store
export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // 初始状态 - 全部为空，由API填充
      stocks: [],
      quotes: [],
      selectedStock: null,
      selectedStocks: [],

      strategies: [],
      selectedStrategy: null,
      myStrategies: [],

      selectionResults: [],
      currentSelectionResult: null,

      backtestResults: [],
      currentBacktestResult: null,

      marketOverview: null,
      topGainers: [],
      topLosers: [],
      topVolume: [],

      loading: false,
      dataReady: false,

      setLoading: (loading) => set({ loading }),

      // 股票选择相关Actions
      setSelectedStock: (stock) => set({ selectedStock: stock }),

      addSelectedStock: (stock) => set((state) => ({
        selectedStocks: state.selectedStocks.find(s => s.code === stock.code)
          ? state.selectedStocks
          : [...state.selectedStocks, stock]
      })),

      removeSelectedStock: (stockCode) => set((state) => ({
        selectedStocks: state.selectedStocks.filter(s => s.code !== stockCode)
      })),

      clearSelectedStocks: () => set({ selectedStocks: [] }),

      // 策略相关Actions
      setSelectedStrategy: (strategy) => set({ selectedStrategy: strategy }),

      addMyStrategy: (strategy) => set((state) => ({
        myStrategies: [...state.myStrategies, strategy]
      })),

      updateMyStrategy: (strategy) => set((state) => ({
        myStrategies: state.myStrategies.map(s =>
          s.id === strategy.id ? strategy : s
        )
      })),

      deleteMyStrategy: (strategyId) => set((state) => ({
        myStrategies: state.myStrategies.filter(s => s.id !== strategyId)
      })),

      // 选股相关Actions - 调用真实API
      runSelection: (strategyId, filters) => {
        set({ loading: true });
        runStockSelection(strategyId, { filters })
          .then((result) => {
            set({
              currentSelectionResult: result,
              loading: false,
            });
          })
          .catch(() => {
            set({ loading: false });
          });
      },

      setCurrentSelectionResult: (result) => set({ currentSelectionResult: result }),

      // 回测相关Actions - 调用真实API
      runBacktestAction: (stockCode, strategyId, startDate, endDate, initialCapital = 100000) => {
        set({ loading: true });
        runBacktest(stockCode, strategyId, startDate, endDate, initialCapital)
          .then((result) => {
            set({
              currentBacktestResult: result,
              loading: false,
            });
          })
          .catch(() => {
            set({ loading: false });
          });
      },

      setCurrentBacktestResult: (result) => set({ currentBacktestResult: result }),

      // 刷新市场数据 - 调用真实API
      refreshMarketData: async () => {
        set({ loading: true });
        try {
          const [overview, gainers, losers, volume] = await Promise.all([
            fetchMarketOverview(),
            fetchTopGainers(10),
            fetchTopLosers(10),
            fetchTopVolume(10),
          ]);
          set({
            marketOverview: overview,
            topGainers: gainers,
            topLosers: losers,
            topVolume: volume,
            loading: false,
            dataReady: true,
          });
        } catch {
          set({ loading: false });
        }
      },

      // 首次加载所有数据
      fetchInitialData: async () => {
        if (get().dataReady) return; // 已加载过则跳过
        set({ loading: true });
        try {
          const [overview, gainers, losers, volume, strategies] = await Promise.all([
            fetchMarketOverview().catch(() => null),
            fetchTopGainers(10).catch(() => []),
            fetchTopLosers(10).catch(() => []),
            fetchTopVolume(10).catch(() => []),
            fetchStrategies().catch(() => []),
          ]);
          set({
            marketOverview: overview,
            topGainers: gainers,
            topLosers: losers,
            topVolume: volume,
            strategies,
            loading: false,
            dataReady: true,
          });
        } catch {
          set({ loading: false });
        }
      },
    }),
    {
      name: 'wenghe-quant-storage',
      partialize: (state) => ({
        myStrategies: state.myStrategies,
        selectedStocks: state.selectedStocks,
      }),
    }
  )
);
