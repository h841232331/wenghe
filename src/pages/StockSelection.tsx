import React, { useState, useEffect } from 'react';
import ReactECharts from 'echarts-for-react';
import { Target, Play, Download, BarChart3, PieChart, Info, ChevronDown, X, Plus, TrendingUp, DollarSign, LineChart, BarChart, Filter } from 'lucide-react';
import { useAppStore } from '@/store';
import { Strategy as StrategyType, StrategyFilter } from '@/types';
import { getFilterFields, getFactorLibrary, runStockSelection } from '@/api';

// 策略类型标签配置
const typeConfig = {
  factor: { label: '多因子', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  technical: { label: '技术指标', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  fundamental: { label: '基本面', color: 'bg-green-100 text-green-700 border-green-200' },
  mixed: { label: '混合策略', color: 'bg-amber-100 text-amber-700 border-amber-200' },
};

// 策略卡片组件
const StrategyCard: React.FC<{
  strategy: StrategyType;
  isSelected: boolean;
  onClick: () => void;
  onShowFactorLibrary?: () => void;
}> = ({ strategy, isSelected, onClick, onShowFactorLibrary }) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-xl border-2 p-5 cursor-pointer transition-all duration-300 hover:shadow-lg group ${
        isSelected 
          ? 'border-amber-500 shadow-lg bg-amber-50/30' 
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <h3 className="text-lg font-semibold text-slate-800 group-hover:text-amber-600 transition-colors">
          {strategy.name}
        </h3>
        <span className={`px-2 py-1 rounded-md text-xs font-medium border ${typeConfig[strategy.type].color}`}>
          {typeConfig[strategy.type].label}
        </span>
      </div>
      <p className="text-sm text-slate-600 mb-4 line-clamp-2 leading-relaxed">
        {strategy.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-2">
            {strategy.factors.slice(0, 3).map((factor, idx) => (
              <div
                key={idx}
                className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-400 to-slate-500 flex items-center justify-center text-xs text-white border-2 border-white shadow-sm"
                title={factor.name}
              >
                {factor.name[0]}
              </div>
            ))}
            {strategy.factors.length > 3 && (
              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-600 border-2 border-white">
                +{strategy.factors.length - 3}
              </div>
            )}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onShowFactorLibrary?.();
            }}
            className="text-xs text-amber-500 hover:text-amber-600 flex items-center gap-1 transition-colors"
          >
            <Info className="w-3.5 h-3.5" />
            {strategy.factors.length}个因子
          </button>
        </div>
        <div className="text-xs text-slate-400 flex items-center gap-1">
          <Filter className="w-3.5 h-3.5" />
          {strategy.filters.length}个筛选
        </div>
      </div>
    </div>
  );
};

// 因子详情模态框
const FactorDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
}> = ({ isOpen, onClose }) => {
  const factorLibrary = getFactorLibrary();
  const [activeCategory, setActiveCategory] = useState(factorLibrary[0]?.category || '');

  if (!isOpen) return null;

  const activeFactors = factorLibrary.find(c => c.category === activeCategory)?.factors || [];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={onClose}>
      <div 
        className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[80vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-slate-800">策略因子库</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex">
          {/* 左侧分类 */}
          <div className="w-48 border-r border-slate-200 py-4 bg-slate-50 h-[calc(80vh-72px)] overflow-y-auto">
            {factorLibrary.map(category => (
              <button
                key={category.category}
                onClick={() => setActiveCategory(category.category)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  activeCategory === category.category
                    ? 'bg-white text-amber-600 font-medium border-l-4 border-amber-500'
                    : 'text-slate-600 hover:bg-white/50 hover:text-slate-800'
                }`}
              >
                {category.category}
              </button>
            ))}
          </div>
          {/* 右侧因子列表 */}
          <div className="flex-1 p-6 overflow-y-auto h-[calc(80vh-72px)]">
            <div className="space-y-4">
              {activeFactors.map(factor => (
                <div key={factor.key} className="p-4 border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">{factor.name}</h4>
                    <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-md">
                      权重范围: {factor.weightRange[0] * 100}% - {factor.weightRange[1] * 100}%
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">
                    {factor.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>默认权重: {(factor.defaultWeight * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// 筛选条件配置面板
const FilterPanel: React.FC<{
  filters: StrategyFilter[];
  onFiltersChange: (filters: StrategyFilter[]) => void;
}> = ({ filters, onFiltersChange }) => {
  const filterFields = getFilterFields();
  const [isExpanded, setIsExpanded] = useState(true);

  const addFilter = () => {
    onFiltersChange([
      ...filters,
      { field: 'pe', operator: 'lt', value: 20 }
    ]);
  };

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: keyof StrategyFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    onFiltersChange(newFilters);
  };

  const updateValue = (index: number, position: 'min' | 'max', value: number) => {
    const filter = filters[index];
    if (filter.operator === 'between') {
      const currentValue = filter.value as [number, number];
      const newValue: [number, number] = position === 'min' 
        ? [value, currentValue[1]]
        : [currentValue[0], value];
      updateFilter(index, 'value', newValue);
    } else {
      updateFilter(index, 'value', value);
    }
  };

  const getFieldLabel = (field: string) => {
    return filterFields.find(f => f.key === field)?.label || field;
  };

  const getFieldUnit = (field: string) => {
    return filterFields.find(f => f.key === field)?.unit || '';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div 
        className="px-6 py-4 border-b border-slate-200 flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
          <BarChart className="w-5 h-5 text-blue-500" />
          筛选条件
          <span className="text-sm font-normal text-slate-500">({filters.length}个条件)</span>
        </h3>
        <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      {isExpanded && (
        <div className="p-6 space-y-3">
          {filters.length === 0 && (
            <div className="text-center py-8 text-slate-400">
              <p>暂无筛选条件，点击下方按钮添加</p>
            </div>
          )}
          
          {filters.map((filter, index) => {
            const fieldInfo = filterFields.find(f => f.key === filter.field);
            return (
              <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                <select
                  value={filter.field}
                  onChange={e => updateFilter(index, 'field', e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white min-w-[140px]"
                >
                  {filterFields.map(field => (
                    <option key={field.key} value={field.key}>{field.label}</option>
                  ))}
                </select>
                
                <select
                  value={filter.operator}
                  onChange={e => {
                    const op = e.target.value as StrategyFilter['operator'];
                    if (op === 'between') {
                      updateFilter(index, 'operator', 'between');
                      updateFilter(index, 'value', [0, 100]);
                    } else {
                      updateFilter(index, 'operator', op);
                      updateFilter(index, 'value', 0);
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none bg-white min-w-[100px]"
                >
                  <option value="gt">大于</option>
                  <option value="lt">小于</option>
                  <option value="between">区间</option>
                  <option value="eq">等于</option>
                </select>
                
                {filter.operator === 'between' ? (
                  <div className="flex items-center gap-2 flex-1">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-slate-500 whitespace-nowrap">最小值:</span>
                      <input
                        type="number"
                        value={(filter.value as [number, number])[0]}
                        onChange={e => updateValue(index, 'min', Number(e.target.value))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <span className="text-slate-400">~</span>
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-xs text-slate-500 whitespace-nowrap">最大值:</span>
                      <input
                        type="number"
                        value={(filter.value as [number, number])[1]}
                        onChange={e => updateValue(index, 'max', Number(e.target.value))}
                        className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 outline-none"
                      />
                    </div>
                    <span className="text-sm text-slate-500">{fieldInfo?.unit}</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="number"
                      value={filter.value as number}
                      onChange={e => updateFilter(index, 'value', Number(e.target.value))}
                      className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 outline-none"
                    />
                    <span className="text-sm text-slate-500">{fieldInfo?.unit}</span>
                  </div>
                )}
                
                <button
                  onClick={() => removeFilter(index)}
                  className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
          
          <button
            onClick={addFilter}
            className="w-full py-3 border-2 border-dashed border-slate-300 rounded-xl text-slate-500 hover:border-amber-400 hover:text-amber-500 hover:bg-amber-50/50 transition-all flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            添加筛选条件
          </button>
        </div>
      )}
    </div>
  );
};

// 选股结果表格组件
const ResultTable: React.FC = () => {
  const { currentSelectionResult } = useAppStore();

  if (!currentSelectionResult || currentSelectionResult.stocks.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
          <Target className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">暂无选股结果</h3>
        <p className="text-slate-500">请选择策略并点击"执行选股"按钮开始选股</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">选股结果</h3>
          <p className="text-sm text-slate-500 mt-1">
            共选出 <span className="font-semibold text-amber-600">{currentSelectionResult.totalCount}</span> 只股票
            <span className="ml-3">
              执行时间: {new Date(currentSelectionResult.executedAt).toLocaleString()}
            </span>
          </p>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm">
          <Download className="w-4 h-4" />
          导出结果
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50 sticky top-0">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">排名</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">股票</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">所属行业</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">综合得分</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">最新价</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">涨跌幅</th>
              <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">市盈率</th>
              <th className="px-6 py-3 text-center text-xs font-semibold text-slate-500 uppercase tracking-wider">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {currentSelectionResult.stocks.map((item, index) => (
              <tr key={item.stock.code} className="hover:bg-amber-50/30 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-sm font-bold ${
                    index === 0 ? 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-md' :
                    index === 1 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white shadow-sm' :
                    index === 2 ? 'bg-gradient-to-br from-amber-600 to-amber-700 text-white shadow-sm' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {item.rank}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{item.stock.name}</div>
                    <div className="text-xs text-slate-500 font-mono">{item.stock.code}</div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded-md">
                    {item.stock.industry}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                        style={{ width: `${item.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-bold text-amber-600 w-12 text-right">
                      {item.score.toFixed(1)}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-slate-900">
                  ¥{item.quote.price.toFixed(2)}
                </td>
                <td className={`px-6 py-4 whitespace-nowrap text-right text-sm font-semibold ${
                  item.quote.changePercent >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {item.quote.changePercent >= 0 ? '+' : ''}{item.quote.changePercent.toFixed(2)}%
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-slate-600">
                  {item.stock.pe.toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button className="text-amber-600 hover:text-amber-700 text-sm font-medium hover:underline">
                    加入回测
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const StockSelection: React.FC = () => {
  const { strategies, selectedStrategy, setSelectedStrategy, setCurrentSelectionResult, loading, setLoading } = useAppStore();
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showFactorModal, setShowFactorModal] = useState(false);
  const [customFilters, setCustomFilters] = useState<StrategyFilter[]>([]);

  const filteredStrategies = selectedType === 'all' 
    ? strategies 
    : strategies.filter(s => s.type === selectedType);

  useEffect(() => {
    if (selectedStrategy) {
      setCustomFilters([...selectedStrategy.filters]);
    }
  }, [selectedStrategy?.id]);

  // 行业分布图表
  const getIndustryDistributionOption = () => {
    const industryNames = ['银行', '食品饮料', '医药生物', '电子', '电力', '计算机', '机械设备'];
    const industries: Record<string, number> = {};
    industryNames.forEach(ind => {
      industries[ind] = Math.floor(Math.random() * 15) + 3;
    });

    return {
      tooltip: {
        trigger: 'item',
        formatter: '{b}: {c}只 ({d}%)'
      },
      legend: {
        bottom: 0,
        left: 'center',
        textStyle: { color: '#64748b', fontSize: 12 }
      },
      color: ['#ffc107', '#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#06b6d4'],
      series: [
        {
          name: '行业分布',
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['50%', '45%'],
          data: Object.entries(industries).map(([name, value]) => ({ name, value })),
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.3)'
            },
            scale: true,
            scaleSize: 5
          },
          itemStyle: {
            borderRadius: 8,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          labelLine: {
            show: false
          }
        }
      ]
    };
  };

  // 得分分布图表
  const getScoreDistributionOption = () => {
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: '{b}: {c}只'
      },
      grid: {
        left: '3%',
        right: '4%',
        bottom: '3%',
        top: '15%',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: ['60-70分', '70-75分', '75-80分', '80-85分', '85-90分', '90-95分'],
        axisLabel: { color: '#64748b', fontSize: 11 },
        axisLine: { lineStyle: { color: '#e2e8f0' } }
      },
      yAxis: {
        type: 'value',
        name: '股票数量',
        nameTextStyle: { color: '#94a3b8', fontSize: 12 },
        axisLabel: { color: '#64748b', fontSize: 11 },
        splitLine: { lineStyle: { color: '#f1f5f9' } }
      },
      series: [
        {
          name: '股票数量',
          type: 'bar',
          data: [2, 3, 4, 3, 2, 1],
          itemStyle: {
            color: {
              type: 'linear',
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: '#ffc107' },
                { offset: 1, color: '#ff9800' }
              ]
            },
            borderRadius: [6, 6, 0, 0]
          },
          barWidth: '55%'
        }
      ]
    };
  };

  const handleRunSelection = async () => {
    if (!selectedStrategy) return;
    
    setLoading(true);
    setCurrentSelectionResult(null);
    
    try {
      const result = await runStockSelection(selectedStrategy.id, {
        filters: customFilters
      });
      setCurrentSelectionResult(result);
    } catch (error) {
      console.error('选股失败:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* 页面标题 */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">选股中心</h1>
        <p className="text-slate-600">基于多因子策略的智能选股工具，挖掘A股投资机会</p>
      </div>

      {/* 策略选择区域 */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Target className="w-5 h-5 text-amber-500" />
            选择策略
            <button
              onClick={() => setShowFactorModal(true)}
              className="ml-2 inline-flex items-center gap-1.5 px-3 py-1 text-sm bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100 transition-colors border border-amber-200"
            >
              <Info className="w-4 h-4" />
              因子库说明
            </button>
          </h2>
          <div className="flex gap-2">
            {[
              { key: 'all', label: '全部' },
              { key: 'factor', label: '多因子' },
              { key: 'technical', label: '技术指标' },
              { key: 'fundamental', label: '基本面' },
              { key: 'mixed', label: '混合' },
            ].map(type => (
              <button
                key={type.key}
                onClick={() => setSelectedType(type.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  selectedType === type.key
                    ? 'bg-amber-500 text-white shadow-md shadow-amber-500/25'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* 策略卡片网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredStrategies.map(strategy => (
            <StrategyCard
              key={strategy.id}
              strategy={strategy}
              isSelected={selectedStrategy?.id === strategy.id}
              onClick={() => setSelectedStrategy(strategy)}
              onShowFactorLibrary={() => setShowFactorModal(true)}
            />
          ))}
        </div>
      </div>

      {/* 筛选条件配置 */}
      {selectedStrategy && (
        <FilterPanel
          filters={customFilters}
          onFiltersChange={setCustomFilters}
        />
      )}

      {/* 执行选股按钮 */}
      <div className="sticky bottom-6 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {selectedStrategy ? (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-400 to-amber-500 flex items-center justify-center">
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-semibold text-slate-800">{selectedStrategy.name}</div>
                    <div className="text-xs text-slate-500">
                      {selectedStrategy.factors.length}个因子 · {customFilters.length}个筛选条件
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-slate-500">请从上方选择一个策略</p>
            )}
          </div>
          <button
            onClick={handleRunSelection}
            disabled={!selectedStrategy || loading}
            className={`flex items-center gap-2 px-8 py-3 rounded-xl font-semibold text-lg transition-all ${
              selectedStrategy && !loading
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-xl hover:shadow-amber-500/30 hover:-translate-y-0.5'
                : 'bg-slate-300 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                智能选股中...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 fill-current" />
                执行选股
              </>
            )}
          </button>
        </div>
      </div>

      {/* 选股结果 */}
      <ResultTable />

      {/* 结果分析图表 */}
      {selectedStrategy && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-purple-500" />
              行业分布
            </h3>
            <ReactECharts option={getIndustryDistributionOption()} style={{ height: '320px' }} />
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-500" />
              得分分布
            </h3>
            <ReactECharts option={getScoreDistributionOption()} style={{ height: '320px' }} />
          </div>
        </div>
      )}

      {/* 因子详情模态框 */}
      <FactorDetailModal 
        isOpen={showFactorModal} 
        onClose={() => setShowFactorModal(false)} 
      />
    </div>
  );
};

export default StockSelection;