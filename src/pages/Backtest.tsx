import React, { useState } from 'react';
import ReactECharts from 'echarts-for-react';
import { LineChart, Play, TrendingUp, TrendingDown, Target, Calendar, DollarSign } from 'lucide-react';
import { useAppStore } from '@/store';
import { Stock, Strategy } from '@/types';

// 绩效指标卡片组件
const PerformanceCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
}> = ({ title, value, subtitle, icon, color, trend }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-3">
      <div className={`p-2 rounded-lg ${color}`}>
        {icon}
      </div>
      {trend && (
        <span className={`flex items-center gap-1 text-xs font-medium ${
          trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-slate-600'
        }`}>
          {trend === 'up' && <TrendingUp className="w-3 h-3" />}
          {trend === 'down' && <TrendingDown className="w-3 h-3" />}
        </span>
      )}
    </div>
    <div className="text-2xl font-bold text-slate-800 mb-1">{value}</div>
    <div className="text-sm text-slate-500">{title}</div>
    {subtitle && <div className="text-xs text-slate-400 mt-1">{subtitle}</div>}
  </div>
);

// 股票搜索器组件
const StockSearcher: React.FC<{
  onSelect: (stock: Stock) => void;
}> = ({ onSelect }) => {
  const { stocks } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStocks = stocks.filter(stock => 
    stock.code.includes(searchTerm) || 
    stock.name.includes(searchTerm) ||
    stock.industry.includes(searchTerm)
  ).slice(0, 10);

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="搜索股票代码或名称..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
      />
      {searchTerm && filteredStocks.length > 0 && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border border-slate-200 max-h-64 overflow-y-auto">
          {filteredStocks.map(stock => (
            <div
              key={stock.code}
              onClick={() => {
                onSelect(stock);
                setSearchTerm('');
              }}
              className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex items-center justify-between"
            >
              <div>
                <div className="font-medium text-slate-900">{stock.name}</div>
                <div className="text-xs text-slate-500">{stock.code} · {stock.industry}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-medium text-slate-900">¥{stock.marketCap}亿</div>
                <div className="text-xs text-slate-500">市值</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Backtest: React.FC = () => {
  const { 
    stocks, 
    strategies, 
    selectedStock, 
    selectedStrategy, 
    currentBacktestResult, 
    loading,
    setSelectedStock,
    setSelectedStrategy,
    runBacktestAction
  } = useAppStore();

  const [dateRange, setDateRange] = useState({
    startDate: '2024-01-01',
    endDate: '2024-05-23'
  });
  const [initialCapital, setInitialCapital] = useState(100000);

  // 收益曲线图表
  const getPerformanceChartOption = () => {
    if (!currentBacktestResult || currentBacktestResult.dailyReturns.length === 0) {
      return {};
    }

    const dates = currentBacktestResult.dailyReturns.map(d => d.date);
    const values = currentBacktestResult.dailyReturns.map(d => d.value);
    const benchmarks = currentBacktestResult.dailyReturns.map(d => 
      100000 * (1 + d.benchmark / 100)
    );

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross' }
      },
      legend: {
        data: ['策略收益', '基准收益'],
        bottom: 0
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '15%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: { 
          color: '#64748b',
          rotate: 45,
          interval: 6
        }
      },
      yAxis: {
        type: 'value',
        name: '资产价值',
        axisLabel: { color: '#64748b', formatter: '{value}' },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          name: '策略收益',
          type: 'line',
          data: values,
          smooth: true,
          lineStyle: { width: 3, color: '#ffc107' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(255, 193, 7, 0.3)' },
                { offset: 1, color: 'rgba(255, 193, 7, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#ffc107' }
        },
        {
          name: '基准收益',
          type: 'line',
          data: benchmarks,
          smooth: true,
          lineStyle: { width: 2, color: '#94a3b8', type: 'dashed' },
          itemStyle: { color: '#94a3b8' }
        }
      ]
    };
  };

  // 回撤图表
  const getDrawdownChartOption = () => {
    if (!currentBacktestResult) return {};

    const dates = currentBacktestResult.dailyReturns.map(d => d.date);
    // 模拟回撤数据
    const drawdowns = currentBacktestResult.dailyReturns.map(() => 
      Math.random() * -15
    );

    return {
      tooltip: {
        trigger: 'axis',
        formatter: '{b}<br/>回撤: {c}%'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '10%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: dates,
        boundaryGap: false,
        axisLabel: { 
          color: '#64748b',
          rotate: 45,
          interval: 6
        }
      },
      yAxis: {
        type: 'value',
        name: '回撤(%)',
        axisLabel: { color: '#64748b', formatter: '{value}%' },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          name: '回撤',
          type: 'line',
          data: drawdowns,
          smooth: true,
          lineStyle: { width: 2, color: '#ef4444' },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(239, 68, 68, 0.3)' },
                { offset: 1, color: 'rgba(239, 68, 68, 0.05)' }
              ]
            }
          },
          itemStyle: { color: '#ef4444' }
        }
      ]
    };
  };

  const handleRunBacktest = () => {
    if (selectedStock && selectedStrategy) {
      runBacktestAction(selectedStock.code, selectedStrategy.id, dateRange.startDate, dateRange.endDate, initialCapital);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">回测分析</h1>
        <p className="text-slate-600">验证策略有效性，评估风险收益</p>
      </div>

      {/* 配置区域 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 股票选择 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">选择股票</h3>
          <StockSearcher onSelect={setSelectedStock} />
          {selectedStock && (
            <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
              <div className="font-medium text-amber-900">{selectedStock.name}</div>
              <div className="text-sm text-amber-700">{selectedStock.code} · {selectedStock.industry}</div>
            </div>
          )}
        </div>

        {/* 策略选择 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">选择策略</h3>
          <select
            value={selectedStrategy?.id || ''}
            onChange={(e) => {
              const strategy = strategies.find(s => s.id === e.target.value);
              setSelectedStrategy(strategy || null);
            }}
            className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
          >
            <option value="">请选择策略</option>
            {strategies.map(strategy => (
              <option key={strategy.id} value={strategy.id}>
                {strategy.name}
              </option>
            ))}
          </select>
          {selectedStrategy && (
            <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
              <div className="font-medium text-purple-900">{selectedStrategy.name}</div>
              <div className="text-sm text-purple-700 mt-1">{selectedStrategy.description}</div>
            </div>
          )}
        </div>

        {/* 参数配置 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">回测参数</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                开始日期
              </label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                结束日期
              </label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                <DollarSign className="w-4 h-4 inline mr-1" />
                初始资金
              </label>
              <input
                type="number"
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 执行按钮 */}
      <div className="flex justify-center">
        <button
          onClick={handleRunBacktest}
          disabled={!selectedStock || !selectedStrategy || loading}
          className={`flex items-center gap-2 px-8 py-4 rounded-lg font-medium text-lg transition-all ${
            selectedStock && selectedStrategy && !loading
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:scale-105'
              : 'bg-slate-300 text-slate-500 cursor-not-allowed'
          }`}
        >
          {loading ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              回测中...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              执行回测
            </>
          )}
        </button>
      </div>

      {/* 回测结果 */}
      {currentBacktestResult && (
        <>
          {/* 绩效指标 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <PerformanceCard
              title="总收益率"
              value={`${currentBacktestResult.performance.totalReturn.toFixed(2)}%`}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="bg-green-500"
              trend={currentBacktestResult.performance.totalReturn >= 0 ? 'up' : 'down'}
            />
            <PerformanceCard
              title="年化收益"
              value={`${currentBacktestResult.performance.annualReturn.toFixed(2)}%`}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="bg-blue-500"
              trend={currentBacktestResult.performance.annualReturn >= 0 ? 'up' : 'down'}
            />
            <PerformanceCard
              title="最大回撤"
              value={`${currentBacktestResult.performance.maxDrawdown.toFixed(2)}%`}
              icon={<TrendingDown className="w-5 h-5 text-white" />}
              color="bg-red-500"
              trend="down"
            />
            <PerformanceCard
              title="夏普比率"
              value={currentBacktestResult.performance.sharpeRatio.toFixed(2)}
              icon={<LineChart className="w-5 h-5 text-white" />}
              color="bg-purple-500"
            />
            <PerformanceCard
              title="胜率"
              value={`${currentBacktestResult.performance.winRate.toFixed(1)}%`}
              icon={<Target className="w-5 h-5 text-white" />}
              color="bg-amber-500"
            />
            <PerformanceCard
              title="盈亏比"
              value={currentBacktestResult.performance.profitLossRatio.toFixed(2)}
              icon={<DollarSign className="w-5 h-5 text-white" />}
              color="bg-teal-500"
            />
            <PerformanceCard
              title="Alpha"
              value={`${currentBacktestResult.performance.alpha.toFixed(2)}%`}
              icon={<TrendingUp className="w-5 h-5 text-white" />}
              color="bg-indigo-500"
            />
            <PerformanceCard
              title="Beta"
              value={currentBacktestResult.performance.beta.toFixed(2)}
              icon={<LineChart className="w-5 h-5 text-white" />}
              color="bg-gray-500"
            />
          </div>

          {/* 收益曲线 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <LineChart className="w-5 h-5 text-amber-500" />
              收益曲线
            </h3>
            <ReactECharts option={getPerformanceChartOption()} style={{ height: '400px' }} />
          </div>

          {/* 回撤曲线 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              回撤曲线
            </h3>
            <ReactECharts option={getDrawdownChartOption()} style={{ height: '300px' }} />
          </div>

          {/* 交易记录 */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200">
              <h3 className="text-lg font-semibold text-slate-800">交易记录</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">日期</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">类型</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">价格</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">股数</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase">金额</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase">原因</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {currentBacktestResult.trades.slice(0, 10).map((trade, index) => (
                    <tr key={index} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{trade.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          trade.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {trade.type === 'buy' ? '买入' : '卖出'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                        ¥{trade.price.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                        {trade.shares}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                        ¥{trade.amount.toFixed(0)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">
                        {trade.reason}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Backtest;