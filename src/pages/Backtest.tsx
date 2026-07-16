import React, { useState, useEffect, useCallback } from 'react';
import ReactECharts from 'echarts-for-react';
import { LineChart, Play, TrendingUp, TrendingDown, Target, Calendar, DollarSign, Info, BarChart3 } from 'lucide-react';
import { useAppStore } from '@/store';
import { Stock, Strategy } from '@/types';
import { searchStocks, fetchStockOverview, fetchIntraday } from '@/api';

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
      <div className={`p-2 rounded-lg ${color}`}>{icon}</div>
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

const StockSearcher: React.FC<{ onSelect: (stock: Stock) => void }> = ({ onSelect }) => {
  const { stocks: storeStocks } = useAppStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Stock[]>([]);
  const [searching, setSearching] = useState(false);

  const doSearch = useCallback(async (term: string) => {
    if (!term.trim()) { setSearchResults(storeStocks.slice(0, 10)); return; }
    setSearching(true);
    try {
      const results = await searchStocks(term);
      let final = results.slice(0, 10);
      if (final.length === 0) {
        final = storeStocks.filter(s => s.code.includes(term) || s.name.includes(term)).slice(0, 10);
      }
      if (final.length === 0 && /^\d{6}$/.test(term.trim())) {
        final = [{ code: term.trim(), name: term.trim(), industry: '未分类', market: term.trim().startsWith('6') ? 'SH' : 'SZ', marketCap: 0, pe: 0, pb: 0, roe: 0 }];
      }
      setSearchResults(final);
    } catch {
      setSearchResults(storeStocks.filter(s => s.code.includes(term) || s.name.includes(term)).slice(0, 10));
    } finally { setSearching(false); }
  }, [storeStocks]);

  useEffect(() => { const t = setTimeout(() => doSearch(searchTerm), 300); return () => clearTimeout(t); }, [searchTerm, doSearch]);

  return (
    <div className="relative">
      <input type="text" placeholder="搜索股票代码或名称..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none" />
      {searchTerm && (
        <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-lg border max-h-64 overflow-y-auto">
          {searching && <div className="px-4 py-3 text-sm text-slate-500 text-center">搜索中...</div>}
          {!searching && searchResults.length === 0 && <div className="px-4 py-3 text-sm text-slate-500 text-center">未找到匹配股票</div>}
          {!searching && searchResults.map(s => (
            <div key={s.code} onClick={() => { onSelect(s); setSearchTerm(''); }} className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between">
              <div><div className="font-medium">{s.name}</div><div className="text-xs text-slate-500">{s.code} · {s.industry}</div></div>
              <div className="text-right"><div className="text-sm font-medium">¥{s.marketCap}亿</div><div className="text-xs text-slate-500">市值</div></div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const Backtest: React.FC = () => {
  const { stocks, strategies, myStrategies, selectedStock, selectedStrategy, currentBacktestResult, loading, setSelectedStock, setSelectedStrategy, runBacktestAction, fetchInitialData } = useAppStore();
  const allStrategies = [...strategies, ...myStrategies.filter(ms => !strategies.find(s => s.id === ms.id))];
  const [dateRange, setDateRange] = useState({ startDate: '2024-01-01', endDate: '2024-05-23' });
  const [initialCapital, setInitialCapital] = useState(100000);

  // 确保策略和股票数据已加载
  useEffect(() => { fetchInitialData(); }, []);

  // 股票概览数据
  const [stockOverview, setStockOverview] = useState<{
    quote: any; kline: any[];
  } | null>(null);
  const [overviewLoading, setOverviewLoading] = useState(false);

  useEffect(() => {
    if (selectedStock) {
      setOverviewLoading(true);
      setChartMode('kline');
      fetchStockOverview(selectedStock.code)
        .then(data => setStockOverview(data))
        .catch(() => setStockOverview(null))
        .finally(() => setOverviewLoading(false));
    } else {
      setStockOverview(null);
    }
  }, [selectedStock]);

  // 图表模式: kline | intraday
  const [chartMode, setChartMode] = useState<'kline' | 'intraday'>('kline');
  const [intradayData, setIntradayData] = useState<{
    date: string; qtInfo: any; points: any[];
  } | null>(null);
  const [intradayLoading, setIntradayLoading] = useState(false);

  useEffect(() => {
    if (chartMode === 'intraday' && selectedStock) {
      setIntradayLoading(true);
      fetchIntraday(selectedStock.code)
        .then(data => setIntradayData(data))
        .catch(() => setIntradayData(null))
        .finally(() => setIntradayLoading(false));
    }
  }, [chartMode, selectedStock]);

  // 同花顺风格K线图配置
  const getMiniKlineOption = () => {
    const kline = stockOverview?.kline || [];
    if (kline.length === 0) return {};
    const dates = kline.map((k: any) => k.date);
    const values = kline.map((k: any) => [k.open, k.close, k.low, k.high]);
    const volumes = kline.map((k: any) => k.volume);

    // 计算MA均线
    const calcMA = (period: number) => {
      const ma: (number | null)[] = [];
      for (let i = 0; i < kline.length; i++) {
        if (i < period - 1) { ma.push(null); continue; }
        let sum = 0;
        for (let j = i - period + 1; j <= i; j++) sum += kline[j].close;
        ma.push(+(sum / period).toFixed(2));
      }
      return ma;
    };

    // 同花顺经典配色: MA5=白, MA10=黄, MA20=紫, MA60=绿
    const maConfigs = [
      { period: 5, color: '#ffffff', name: 'MA5' },
      { period: 10, color: '#ffcc00', name: 'MA10' },
      { period: 20, color: '#ff66ff', name: 'MA20' },
      { period: 60, color: '#00ff66', name: 'MA60' },
    ];

    const maSeries = maConfigs.map(cfg => ({
      name: cfg.name,
      type: 'line',
      data: calcMA(cfg.period),
      smooth: true,
      symbol: 'none',
      xAxisIndex: 0,
      yAxisIndex: 0,
      lineStyle: { width: 1, color: cfg.color, opacity: 0.8 },
    }));

    return {
      backgroundColor: '#1a1a2e',
      animation: false,
      grid: [
        { left: '10%', right: '2%', top: '3%', height: '60%' },
        { left: '10%', right: '2%', top: '70%', height: '18%' },
      ],
      xAxis: [
        {
          type: 'category', data: dates, gridIndex: 0,
          axisLine: { lineStyle: { color: '#333' } },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
        {
          type: 'category', data: dates, gridIndex: 1,
          axisLine: { lineStyle: { color: '#333' } },
          axisTick: { show: false },
          axisLabel: { color: '#888', fontSize: 10, interval: Math.floor(kline.length / 5) },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value', gridIndex: 0, scale: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#888', fontSize: 10 },
          splitLine: { lineStyle: { color: '#222' } },
          position: 'left',
        },
        {
          type: 'value', gridIndex: 1, scale: true,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
      ],
      dataZoom: [{
        type: 'slider', xAxisIndex: [0, 1],
        start: 0, end: 100,
        height: 20, bottom: 0,
        borderColor: '#333',
        backgroundColor: '#1a1a2e',
        dataBackground: {
          lineStyle: { color: '#444' },
          areaStyle: { color: '#333' },
        },
        selectedDataBackground: {
          lineStyle: { color: '#666' },
          areaStyle: { color: '#444' },
        },
        handleStyle: { color: '#888' },
        textStyle: { color: '#888' },
        fillerColor: 'rgba(255,255,255,0.05)',
      }],
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'cross', crossStyle: { color: '#666' } },
        backgroundColor: 'rgba(30,30,50,0.95)',
        borderColor: '#444',
        textStyle: { color: '#ccc', fontSize: 12 },
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const date = params[0].axisValue;
          const k = kline.find((d: any) => d.date === date);
          if (!k) return '';
          const color = k.close >= k.open ? '#ef4444' : '#22c55e';
          let s = `<div style="font-size:13px;font-weight:bold;margin-bottom:4px">${date}</div>`;
          s += `<div>开: <span style="color:#fff">${k.open.toFixed(2)}</span> 高: <span style="color:#ef4444">${k.high.toFixed(2)}</span> 低: <span style="color:#22c55e">${k.low.toFixed(2)}</span> 收: <span style="color:${color}">${k.close.toFixed(2)}</span></div>`;
          s += `<div>涨幅: <span style="color:${color}">${k.open > 0 ? ((k.close - k.open) / k.open * 100).toFixed(2) : 0}%</span> 成交量: ${(k.volume / 10000).toFixed(0)}万手</div>`;
          params.forEach((p: any) => {
            if (p.seriesName?.startsWith('MA')) {
              s += `<div style="color:${p.color}">${p.seriesName}: ${p.value?.toFixed(2) || '-'}</div>`;
            }
          });
          return s;
        },
      },
      series: [
        {
          name: 'K线', type: 'candlestick', data: values,
          xAxisIndex: 0, yAxisIndex: 0,
          itemStyle: {
            color: '#ef4444', color0: '#22c55e',
            borderColor: '#ef4444', borderColor0: '#22c55e',
          },
        },
        ...maSeries,
        {
          name: '成交量', type: 'bar', data: kline.map((k: any, i: number) => ({
            value: k.volume,
            itemStyle: {
              color: k.close >= k.open ? '#ef4444' : '#22c55e',
              opacity: 0.5,
            },
          })),
          xAxisIndex: 1, yAxisIndex: 1,
        },
      ],
    };
  };

  // 同花顺风格分时图配置
  const getIntradayOption = () => {
    const points = intradayData?.points || [];
    if (points.length === 0) return {};
    const preClose = intradayData?.qtInfo?.preClose || 0;
    const times = points.map((p: any) => p.time);
    const prices = points.map((p: any) => p.price);
    const volumes = points.map((p: any) => p.volume);
    const changes = points.map((p: any) => p.changePercent);
    const changePct = intradayData?.qtInfo?.changePercent || 0;
    const color = changePct >= 0 ? '#ef4444' : '#22c55e';

    // 价格范围：以昨收为基准，上下扩展当日振幅
    const allPrices = [...prices, preClose];
    const priceMin = Math.min(...allPrices);
    const priceMax = Math.max(...allPrices);
    const priceRange = priceMax - priceMin;
    // 振幅小于0.5%时用最小范围，否则留2%边距
    const pad = Math.max(priceRange * 0.02, preClose * 0.002);
    const yMin = priceMin - pad;
    const yMax = priceMax + pad;

    // 涨跌幅范围
    const changeMin = Math.min(...changes, 0);
    const changeMax = Math.max(...changes, 0);
    const changePad = Math.max((changeMax - changeMin) * 0.1, 0.1);

    // 时间轴标签：只显示整半小时
    const labelInterval = Math.max(1, Math.floor(times.length / 8));
    const timeLabels = times.map((t: string, i: number) => {
      if (i === 0 || i === times.length - 1) return t;
      if (i % labelInterval === 0) {
        const [h, m] = t.split(':').map(Number);
        if (m === 0 || m === 30) return t;
        return '';
      }
      return '';
    });

    return {
      backgroundColor: '#1a1a2e',
      animation: false,
      grid: [
        { left: '10%', right: '10%', top: '3%', height: '60%' },
        { left: '10%', right: '10%', top: '70%', height: '18%' },
      ],
      xAxis: [
        {
          type: 'category', data: times, gridIndex: 0,
          axisLine: { lineStyle: { color: '#333' } },
          axisTick: { show: false },
          axisLabel: { color: '#888', fontSize: 10, interval: labelInterval, formatter: (v: string) => v },
          splitLine: { show: false },
        },
        {
          type: 'category', data: times, gridIndex: 1,
          axisLine: { lineStyle: { color: '#333' } },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
      ],
      yAxis: [
        {
          type: 'value', gridIndex: 0,
          min: yMin, max: yMax,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#888', fontSize: 10, formatter: (v: number) => v.toFixed(2) },
          splitLine: { lineStyle: { color: '#222' } },
          position: 'left',
        },
        {
          type: 'value', gridIndex: 0,
          min: changeMin - changePad, max: changeMax + changePad,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { color: '#888', fontSize: 10, formatter: (v: number) => v.toFixed(2) + '%' },
          splitLine: { show: false },
          position: 'right',
        },
        {
          type: 'value', gridIndex: 1,
          axisLine: { show: false },
          axisTick: { show: false },
          axisLabel: { show: false },
          splitLine: { show: false },
        },
      ],
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(30,30,50,0.95)',
        borderColor: '#444',
        textStyle: { color: '#ccc', fontSize: 12 },
        formatter: (params: any) => {
          if (!params || params.length < 2) return '';
          const t = params[0].axisValue;
          const price = params[0].value;
          const chg = params[1].value;
          return `<div style="font-size:13px;font-weight:bold;margin-bottom:4px">${t}</div>
            <div>价格: <span style="color:${color}">${price?.toFixed(2)}</span></div>
            <div>涨跌幅: <span style="color:${color}">${chg?.toFixed(2)}%</span></div>`;
        },
      },
      series: [
        {
          name: '价格', type: 'line', data: prices, smooth: true,
          xAxisIndex: 0, yAxisIndex: 0,
          lineStyle: { width: 1.5, color },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color + '30' },
                { offset: 1, color: color + '03' },
              ],
            },
          },
          symbol: 'none',
          markLine: {
            silent: true, symbol: 'none',
            data: [{ yAxis: preClose, lineStyle: { color: '#ffcc00', type: 'solid', width: 1, opacity: 0.5 } }],
            label: { show: false },
          },
        },
        {
          name: '涨跌幅', type: 'line', data: changes, smooth: true,
          xAxisIndex: 0, yAxisIndex: 1,
          lineStyle: { width: 0.5, color },
          areaStyle: {
            color: {
              type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: color + '15' },
                { offset: 1, color: 'transparent' },
              ],
            },
          },
          symbol: 'none',
          show: false,
        },
        {
          name: '成交量', type: 'bar', data: volumes.map((v: number, i: number) => ({
            value: v,
            itemStyle: {
              color: changes[i] >= 0 ? '#ef4444' : '#22c55e',
              opacity: 0.4,
            },
          })),
          xAxisIndex: 1, yAxisIndex: 2,
        },
      ],
    };
  };

  const getPerformanceChartOption = () => {
    if (!currentBacktestResult || currentBacktestResult.dailyReturns.length === 0) {
      return { title: { text: '暂无收益数据', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }, xAxis: { show: false }, yAxis: { show: false }, series: [] };
    }
    const dates = currentBacktestResult.dailyReturns.map(d => d.date);
    const returnPcts = currentBacktestResult.dailyReturns.map(d => d.returnPct);
    const benchPcts = currentBacktestResult.dailyReturns.map(d => d.benchmark);
    const values = currentBacktestResult.dailyReturns.map(d => d.value);

    return {
      tooltip: {
        trigger: 'axis',
        formatter: (params: any) => {
          if (!params || params.length === 0) return '';
          const idx = params[0].dataIndex;
          let s = `<div style="font-weight:bold;margin-bottom:6px">${params[0].axisValue}</div>`;
          params.forEach((p: any) => {
            if (p.seriesName === '策略收益') s += `<div>${p.marker} 策略: <b>${p.value.toFixed(2)}%</b> (¥${values[idx].toFixed(0)})</div>`;
            else s += `<div>${p.marker} 基准: <b>${p.value.toFixed(2)}%</b></div>`;
          });
          return s;
        }
      },
      legend: { data: ['策略收益', '基准收益'], bottom: 0 },
      grid: { left: '3%', right: '4%', bottom: '15%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: dates, boundaryGap: false, axisLabel: { color: '#64748b', rotate: 45, interval: Math.max(1, Math.floor(dates.length / 8)) } },
      yAxis: { type: 'value', name: '收益率(%)', axisLabel: { color: '#64748b', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, splitNumber: 5 },
      series: [
        { name: '策略收益', type: 'line', data: returnPcts, smooth: true, lineStyle: { width: 3, color: '#ffc107' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(255,193,7,0.3)' }, { offset: 1, color: 'rgba(255,193,7,0.05)' }] } }, itemStyle: { color: '#ffc107' }, markLine: { silent: true, data: [{ yAxis: 0, label: { formatter: '成本基线' }, lineStyle: { color: '#64748b', type: 'dashed' } }] } },
        { name: '基准收益', type: 'line', data: benchPcts, smooth: true, lineStyle: { width: 2, color: '#94a3b8', type: 'dashed' }, itemStyle: { color: '#94a3b8' } }
      ]
    };
  };

  const getDrawdownChartOption = () => {
    const drawdowns = currentBacktestResult?.drawdowns || [];
    if (drawdowns.length === 0) {
      return { title: { text: '暂无回撤数据', left: 'center', top: 'center', textStyle: { color: '#94a3b8', fontSize: 14 } }, xAxis: { show: false }, yAxis: { show: false }, series: [] };
    }
    const dates = drawdowns.map(d => d.date);
    const values = drawdowns.map(d => -d.value);
    return {
      tooltip: { trigger: 'axis', formatter: (p: any) => p?.[0] ? `${p[0].axisValue}<br/>回撤: <b>${(-p[0].value).toFixed(2)}%</b>` : '' },
      grid: { left: '3%', right: '4%', bottom: '3%', top: '10%', containLabel: true },
      xAxis: { type: 'category', data: dates, boundaryGap: false, axisLabel: { color: '#64748b', rotate: 45, interval: Math.max(1, Math.floor(dates.length / 8)) } },
      yAxis: { type: 'value', name: '回撤(%)', axisLabel: { color: '#64748b', formatter: '{value}%' }, splitLine: { lineStyle: { color: '#f1f5f9' } }, splitNumber: 5 },
      series: [{ name: '回撤', type: 'line', data: values, smooth: true, lineStyle: { width: 2, color: '#ef4444' }, areaStyle: { color: { type: 'linear', x: 0, y: 0, x2: 0, y2: 1, colorStops: [{ offset: 0, color: 'rgba(239,68,68,0.3)' }, { offset: 1, color: 'rgba(239,68,68,0.05)' }] } }, itemStyle: { color: '#ef4444' } }]
    };
  };

  const handleRunBacktest = () => {
    if (selectedStock && selectedStrategy) {
      runBacktestAction(selectedStock.code, selectedStrategy.id, dateRange.startDate, dateRange.endDate, initialCapital);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="mb-6"><h1 className="text-2xl font-bold text-slate-800 mb-2">回测分析</h1><p className="text-slate-600">验证策略有效性，评估风险收益</p></div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">选择股票</h3>
          <StockSearcher onSelect={setSelectedStock} />
          {selectedStock && (
            <div className="mt-4 space-y-3">
              {overviewLoading ? (
                <div className="flex items-center justify-center py-4 text-sm text-slate-400">加载中...</div>
              ) : stockOverview?.quote ? (
                <>
                  <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-bold text-lg text-amber-900">{stockOverview.quote.name}</div>
                        <div className="text-sm text-amber-700">{selectedStock.code} · {selectedStock.industry}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-slate-800">¥{stockOverview.quote.price.toFixed(2)}</div>
                        <div className={`text-sm font-medium ${stockOverview.quote.changePercent >= 0 ? 'text-red-600' : 'text-green-600'}`}>
                          {stockOverview.quote.changePercent >= 0 ? '+' : ''}{stockOverview.quote.changePercent.toFixed(2)}%
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-amber-200">
                      <div className="text-center"><div className="text-xs text-slate-500">今开</div><div className="text-sm font-medium">¥{stockOverview.quote.open.toFixed(2)}</div></div>
                      <div className="text-center"><div className="text-xs text-slate-500">最高</div><div className="text-sm font-medium text-red-600">¥{stockOverview.quote.high.toFixed(2)}</div></div>
                      <div className="text-center"><div className="text-xs text-slate-500">最低</div><div className="text-sm font-medium text-green-600">¥{stockOverview.quote.low.toFixed(2)}</div></div>
                      <div className="text-center"><div className="text-xs text-slate-500">昨收</div><div className="text-sm font-medium">¥{stockOverview.quote.preClose.toFixed(2)}</div></div>
                    </div>
                    <div className="grid grid-cols-4 gap-2 mt-2 pt-2 border-t border-amber-100">
                      <div className="text-center"><div className="text-xs text-slate-500">PE(TTM)</div><div className="text-sm font-medium">{stockOverview.quote.pe > 0 ? stockOverview.quote.pe.toFixed(1) : '-'}</div></div>
                      <div className="text-center"><div className="text-xs text-slate-500">PB</div><div className="text-sm font-medium">{stockOverview.quote.pb > 0 ? stockOverview.quote.pb.toFixed(1) : '-'}</div></div>
                      <div className="text-center"><div className="text-xs text-slate-500">市值</div><div className="text-sm font-medium">{stockOverview.quote.marketCap > 0 ? stockOverview.quote.marketCap.toFixed(0) + '亿' : '-'}</div></div>
                      <div className="text-center"><div className="text-xs text-slate-500">换手率</div><div className="text-sm font-medium">{stockOverview.quote.turnover.toFixed(2)}%</div></div>
                    </div>
                  </div>
                  {stockOverview.kline.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1 text-xs text-slate-500">
                          <BarChart3 className="w-3 h-3" />
                          {chartMode === 'kline' ? '近60日K线' : `分时图 ${intradayData?.date || ''}`}
                        </div>
                        <div className="flex rounded border border-slate-200 overflow-hidden">
                          <button onClick={() => setChartMode('kline')} className={`px-2 py-0.5 text-xs ${chartMode === 'kline' ? 'bg-amber-100 text-amber-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>K线</button>
                          <button onClick={() => setChartMode('intraday')} className={`px-2 py-0.5 text-xs ${chartMode === 'intraday' ? 'bg-amber-100 text-amber-700 font-medium' : 'text-slate-500 hover:bg-slate-50'}`}>分时</button>
                        </div>
                      </div>
                      {chartMode === 'kline' ? (
                        <ReactECharts key="kline" option={getMiniKlineOption()} style={{ height: '320px' }} />
                      ) : intradayLoading ? (
                        <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">加载分时图...</div>
                      ) : intradayData?.points?.length ? (
                        <ReactECharts key="intraday" option={getIntradayOption()} style={{ height: '280px' }} />
                      ) : (
                        <div className="flex items-center justify-center h-[220px] text-sm text-slate-400">暂无分时数据（非交易时段）</div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="font-medium text-amber-900">{selectedStock.name}</div>
                  <div className="text-sm text-amber-700">{selectedStock.code} · {selectedStock.industry}</div>
                </div>
              )}
            </div>
          )}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">选择策略</h3>
          <select value={selectedStrategy?.id || ''} onChange={e => setSelectedStrategy(allStrategies.find(s => s.id === e.target.value) || null)} className="w-full px-4 py-3 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none">
            <option value="">请选择策略</option>
            {allStrategies.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          {selectedStrategy && <div className="mt-4 p-4 bg-purple-50 rounded-lg border border-purple-200"><div className="font-medium text-purple-900">{selectedStrategy.name}</div><div className="text-sm text-purple-700 mt-1">{selectedStrategy.description}</div></div>}
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4">回测参数</h3>
          <div className="space-y-4">
            <div><label className="block text-sm font-medium text-slate-700 mb-2"><Calendar className="w-4 h-4 inline mr-1" />开始日期</label><input type="date" value={dateRange.startDate} onChange={e => setDateRange({ ...dateRange, startDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2"><Calendar className="w-4 h-4 inline mr-1" />结束日期</label><input type="date" value={dateRange.endDate} onChange={e => setDateRange({ ...dateRange, endDate: e.target.value })} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 outline-none" /></div>
            <div><label className="block text-sm font-medium text-slate-700 mb-2"><DollarSign className="w-4 h-4 inline mr-1" />初始资金</label><input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 outline-none" /></div>
          </div>
        </div>
      </div>

      <div className="flex justify-center">
        <button onClick={handleRunBacktest} disabled={!selectedStock || !selectedStrategy || loading} className={`flex items-center gap-2 px-8 py-4 rounded-lg font-medium text-lg transition-all ${selectedStock && selectedStrategy && !loading ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:scale-105' : 'bg-slate-300 text-slate-500 cursor-not-allowed'}`}>
          {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />回测中...</> : <><Play className="w-5 h-5" />执行回测</>}
        </button>
      </div>

      {currentBacktestResult && (<>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
          <PerformanceCard title="总收益率" value={`${currentBacktestResult.performance.totalReturn.toFixed(2)}%`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-green-500" trend={currentBacktestResult.performance.totalReturn >= 0 ? 'up' : 'down'} />
          <PerformanceCard title="年化收益" value={`${currentBacktestResult.performance.annualReturn.toFixed(2)}%`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-blue-500" trend={currentBacktestResult.performance.annualReturn >= 0 ? 'up' : 'down'} />
          <PerformanceCard title="最大回撤" value={`${currentBacktestResult.performance.maxDrawdown.toFixed(2)}%`} icon={<TrendingDown className="w-5 h-5 text-white" />} color="bg-red-500" trend="down" />
          <PerformanceCard title="夏普比率" value={currentBacktestResult.performance.sharpeRatio.toFixed(2)} icon={<LineChart className="w-5 h-5 text-white" />} color="bg-purple-500" />
          <PerformanceCard title="胜率" value={`${currentBacktestResult.performance.winRate.toFixed(1)}%`} subtitle={`${currentBacktestResult.performance.winCount || 0}赢 / ${currentBacktestResult.performance.lossCount || 0}亏`} icon={<Target className="w-5 h-5 text-white" />} color="bg-amber-500" />
          <PerformanceCard title="盈亏比" value={currentBacktestResult.performance.profitLossRatio.toFixed(2)} icon={<DollarSign className="w-5 h-5 text-white" />} color="bg-teal-500" />
          <PerformanceCard title="Alpha" value={`${currentBacktestResult.performance.alpha.toFixed(2)}%`} icon={<TrendingUp className="w-5 h-5 text-white" />} color="bg-indigo-500" />
          <PerformanceCard title="Beta" value={currentBacktestResult.performance.beta.toFixed(2)} icon={<LineChart className="w-5 h-5 text-white" />} color="bg-gray-500" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><LineChart className="w-5 h-5 text-amber-500" />收益曲线（以初始资金为成本基线）</h3>
          <ReactECharts option={getPerformanceChartOption()} style={{ height: '400px' }} />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><TrendingDown className="w-5 h-5 text-red-500" />回撤曲线</h3>
          <ReactECharts option={getDrawdownChartOption()} style={{ height: '300px' }} />
        </div>

        {/* 核验明细 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2"><Info className="w-5 h-5 text-blue-500" />计算核验明细</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">回测区间</span><span className="font-medium">{currentBacktestResult.startDate} ~ {currentBacktestResult.endDate}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">交易日数</span><span className="font-medium">{currentBacktestResult.dailyReturns.length} 天</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">初始资金</span><span className="font-medium">¥{currentBacktestResult.initialCapital?.toLocaleString() || '100,000'}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">最终资产</span><span className="font-medium">¥{currentBacktestResult.dailyReturns.length > 0 ? currentBacktestResult.dailyReturns[currentBacktestResult.dailyReturns.length - 1].value.toFixed(2) : '-'}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">绝对收益</span><span className={`font-medium ${currentBacktestResult.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>¥{currentBacktestResult.dailyReturns.length > 0 ? (currentBacktestResult.dailyReturns[currentBacktestResult.dailyReturns.length - 1].value - (currentBacktestResult.initialCapital || 100000)).toFixed(2) : '-'}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">总收益率</span><span className={`font-medium ${currentBacktestResult.performance.totalReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>{currentBacktestResult.performance.totalReturn.toFixed(2)}%</span></div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">年化收益率</span><span className="font-medium">{currentBacktestResult.performance.annualReturn.toFixed(2)}%</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">最大回撤</span><span className="font-medium text-red-600">{currentBacktestResult.performance.maxDrawdown.toFixed(2)}%</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">夏普比率</span><span className="font-medium">{currentBacktestResult.performance.sharpeRatio.toFixed(2)}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">总交易次数</span><span className="font-medium">{currentBacktestResult.performance.totalTrades || 0}</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">胜率</span><span className="font-medium">{currentBacktestResult.performance.winRate.toFixed(1)}%</span></div>
              <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">盈亏比</span><span className="font-medium">{currentBacktestResult.performance.profitLossRatio.toFixed(2)}</span></div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
            <b>核验公式：</b>总收益率 = (最终资产 - 初始资金) / 初始资金 × 100%；年化收益率 = (最终资产/初始资金)^(1/年数) - 1；胜率 = 盈利交易数 / 总交易数；盈亏比 = 平均盈利 / 平均亏损
          </div>
        </div>

        {/* 交易记录 - 独立滚动 */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200">
          <div className="px-6 py-4 border-b border-slate-200 rounded-t-xl flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-800">交易记录</h3>
            <span className="text-xs text-slate-400">共 {currentBacktestResult.trades.length} 条</span>
          </div>
          <div className="overflow-y-auto rounded-b-xl trade-scroll" style={{ maxHeight: '500px' }}>
            <table className="w-full">
              <thead className="bg-slate-50 sticky top-0 z-10">
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
                {currentBacktestResult.trades.length === 0 ? (
                  <tr><td colSpan={6} className="px-6 py-8 text-center text-slate-400">暂无交易记录</td></tr>
                ) : currentBacktestResult.trades.map((trade, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">{trade.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap"><span className={`px-2 py-1 rounded text-xs font-medium ${trade.type === 'buy' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{trade.type === 'buy' ? '买入' : '卖出'}</span></td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">¥{trade.price.toFixed(2)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">{trade.shares}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">¥{trade.amount.toFixed(0)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600">{trade.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>)}
    </div>
  );
};

export default Backtest;