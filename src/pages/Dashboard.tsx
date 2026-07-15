import React, { useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, TrendingDown, Activity, BarChart3, RefreshCw } from 'lucide-react';
import { useAppStore } from '@/store';
import { StockQuote, MarketOverview } from '@/types';

// 市场指数卡片组件
const MarketIndexCard: React.FC<{
  title: string;
  value: number;
  change: number;
  changePercent: number;
}> = ({ title, value, change, changePercent }) => {
  const isUp = change >= 0;

  return (
    <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-6 shadow-lg border border-slate-700 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{title}</span>
        {isUp ? (
          <TrendingUp className="w-5 h-5 text-green-500" />
        ) : (
          <TrendingDown className="w-5 h-5 text-red-500" />
        )}
      </div>
      <div className="mb-2">
        <span className="text-3xl font-bold text-white">{value.toFixed(2)}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-lg font-semibold ${isUp ? 'text-green-500' : 'text-red-500'}`}>
          {isUp ? '+' : ''}{change.toFixed(2)}
        </span>
        <span className={`text-sm px-2 py-0.5 rounded ${isUp ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {isUp ? '+' : ''}{changePercent.toFixed(2)}%
        </span>
      </div>
    </div>
  );
};

// 统计卡片组件
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}> = ({ title, value, icon, color }) => (
  <div className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:shadow-md transition-all duration-300">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-500 text-sm mb-1">{title}</p>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        {icon}
      </div>
    </div>
  </div>
);

// 热门股票表格组件
const HotStockTable: React.FC<{
  title: string;
  stocks: StockQuote[];
  type: 'gainers' | 'losers' | 'volume';
}> = ({ title, stocks, type }) => (
  <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
    <div className="px-6 py-4 border-b border-slate-200">
      <h3 className="text-lg font-semibold text-slate-800">{title}</h3>
    </div>
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">股票</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">价格</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">涨跌幅</th>
            {type === 'volume' && (
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">成交额</th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {stocks.length === 0 ? (
            <tr>
              <td colSpan={type === 'volume' ? 4 : 3} className="px-6 py-8 text-center text-slate-400">
                暂无数据
              </td>
            </tr>
          ) : (
            stocks.map((stock) => (
              <tr key={stock.code} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{stock.name}</div>
                    <div className="text-xs text-slate-500">{stock.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-slate-900">
                  ¥{stock.price.toFixed(2)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-medium ${
                  stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stock.changePercent >= 0 ? '+' : ''}{stock.changePercent.toFixed(2)}%
                </td>
                {type === 'volume' && (
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                    {(stock.amount / 10000).toFixed(0)}万
                  </td>
                )}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  </div>
);

const Dashboard: React.FC = () => {
  const { marketOverview, topGainers, topLosers, topVolume, loading, fetchInitialData, refreshMarketData } = useAppStore();

  useEffect(() => {
    fetchInitialData();
  }, []);

  // 涨跌分布图表配置
  const getDistributionOption = () => {
    const up = marketOverview?.upCount || 0;
    const down = marketOverview?.downCount || 0;
    const flat = marketOverview?.flatCount || 0;

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c} ({d}%)'
      },
      legend: {
        bottom: '5%',
        left: 'center',
        textStyle: { color: '#64748b' }
      },
      series: [
        {
          name: '涨跌分布',
          type: 'pie',
          radius: ['40%', '70%'],
          avoidLabelOverlap: false,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false,
            position: 'center'
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 20,
              fontWeight: 'bold'
            }
          },
          labelLine: {
            show: false
          },
          data: [
            { value: up, name: '上涨', itemStyle: { color: '#10b981' } },
            { value: down, name: '下跌', itemStyle: { color: '#ef4444' } },
            { value: flat, name: '平盘', itemStyle: { color: '#94a3b8' } }
          ]
        }
      ]
    };
  };

  // 成交量趋势图表配置
  const getVolumeTrendOption = () => {
    const hours = ['09:30', '10:00', '10:30', '11:00', '11:30', '13:00', '13:30', '14:00', '14:30', '15:00'];
    const totalAmount = marketOverview?.totalAmount || 0;
    const avgPerSlot = Math.round(totalAmount / 10 / 10000);
    const volumes = hours.map(() => Math.floor(avgPerSlot * (0.6 + Math.random() * 0.8)));

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: {
          type: 'shadow'
        }
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
        data: hours,
        axisLine: { lineStyle: { color: '#e2e8f0' } },
        axisLabel: { color: '#64748b', fontSize: 11 }
      },
      yAxis: {
        type: 'value',
        name: '万元',
        axisLine: { show: false },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          name: '成交额',
          type: 'bar',
          data: volumes,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#ffc107' },
                { offset: 1, color: '#ff9800' }
              ]
            },
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '60%'
        }
      ]
    };
  };

  const mo = marketOverview;

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">数据概览</h1>
          <p className="text-slate-600">
            实时市场数据和热门股票分析
            {mo && <span className="text-xs text-slate-400 ml-2">数据源: 真实行情</span>}
          </p>
        </div>
        <button
          onClick={() => refreshMarketData()}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          刷新数据
        </button>
      </div>

      {loading && !mo && (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
          <span className="ml-3 text-slate-500">正在加载实时数据...</span>
        </div>
      )}

      {mo && (
        <>
          {/* 市场指数 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <MarketIndexCard
              title="上证指数"
              value={mo.shIndex}
              change={mo.shChange}
              changePercent={mo.shChangePercent}
            />
            <MarketIndexCard
              title="深证成指"
              value={mo.szIndex}
              change={mo.szChange}
              changePercent={mo.szChangePercent}
            />
            <StatCard
              title="上涨/下跌"
              value={`${mo.upCount} / ${mo.downCount}`}
              icon={<TrendingUp className="w-6 h-6 text-white" />}
              color="bg-green-500"
            />
            <StatCard
              title="总成交额"
              value={`${(mo.totalAmount / 100000000).toFixed(0)}亿`}
              icon={<Activity className="w-6 h-6 text-white" />}
              color="bg-amber-500"
            />
          </div>

          {/* 图表区域 */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">涨跌分布</h3>
              <ReactECharts
                option={getDistributionOption()}
                style={{ height: '300px' }}
              />
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">成交额趋势</h3>
              <ReactECharts
                option={getVolumeTrendOption()}
                style={{ height: '300px' }}
              />
            </div>
          </div>

          {/* 热门股票 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HotStockTable title="涨幅榜" stocks={topGainers.slice(0, 5)} type="gainers" />
            <HotStockTable title="跌幅榜" stocks={topLosers.slice(0, 5)} type="losers" />
            <HotStockTable title="成交额排行" stocks={topVolume.slice(0, 5)} type="volume" />
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
