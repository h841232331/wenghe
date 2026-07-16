import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Eye, Share2, Copy, Save, X, Info, HelpCircle } from 'lucide-react';
import { useAppStore } from '@/store';
import { Strategy as StrategyType, StrategyFactor, StrategyFilter } from '@/types';
import { getFactorLibrary, getFilterFields, saveStrategy, updateStrategy, deleteStrategy } from '@/api';

const typeColors = {
  factor: 'bg-blue-100 text-blue-700',
  technical: 'bg-purple-100 text-purple-700',
  fundamental: 'bg-green-100 text-green-700',
  mixed: 'bg-amber-100 text-amber-700',
};

const typeLabels = {
  factor: '多因子',
  technical: '技术指标',
  fundamental: '基本面',
  mixed: '混合策略',
};

const FactorLibraryModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSelectFactor?: (factor: { name: string; weight: number }) => void;
}> = ({ isOpen, onClose, onSelectFactor }) => {
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
          <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            策略因子库
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>
        <div className="flex">
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
          <div className="flex-1 p-6 overflow-y-auto h-[calc(80vh-72px)]">
            <div className="space-y-3">
              {activeFactors.map(factor => (
                <div key={factor.key} className="p-4 border border-slate-200 rounded-xl hover:border-amber-300 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold text-slate-800">{factor.name}</h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-md">
                        默认权重: {(factor.defaultWeight * 100).toFixed(0)}%
                      </span>
                      {onSelectFactor && (
                        <button
                          onClick={() => {
                            onSelectFactor({ name: factor.name, weight: factor.defaultWeight });
                            onClose();
                          }}
                          className="text-xs px-3 py-1 bg-amber-500 text-white rounded-md hover:bg-amber-600 transition-colors"
                        >
                          添加
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-slate-600 leading-relaxed mb-2">
                    {factor.description}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span>权重范围: {(factor.weightRange[0] * 100).toFixed(0)}% - {(factor.weightRange[1] * 100).toFixed(0)}%</span>
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

const StrategyDetailCard: React.FC<{
  strategy: StrategyType;
  onEdit: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}> = ({ strategy, onEdit, onDelete, onDuplicate }) => {
  const [showFactorLibrary, setShowFactorLibrary] = useState(false);

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h3 className="text-lg font-semibold text-slate-800">{strategy.name}</h3>
            <span className={`px-2 py-1 rounded text-xs font-medium ${typeColors[strategy.type]}`}>
              {typeLabels[strategy.type]}
            </span>
            {strategy.isPublic && (
              <span className="px-2 py-1 rounded text-xs font-medium bg-slate-100 text-slate-600 flex items-center gap-1">
                <Eye className="w-3 h-3" />
                公开
              </span>
            )}
          </div>
          <p className="text-sm text-slate-600 mb-3">{strategy.description}</p>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-2">
          策略因子
          <button
            onClick={() => setShowFactorLibrary(true)}
            className="text-amber-500 hover:text-amber-600 transition-colors"
            title="查看因子说明"
          >
            <Info className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {strategy.factors.map((factor, index) => (
            <div key={index} className="flex items-center gap-1 px-2 py-1 bg-slate-100 rounded text-xs group relative">
              <span className="font-medium text-slate-700">{factor.name}</span>
              <span className="text-slate-400">({(factor.weight * 100).toFixed(0)}%)</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs font-medium text-slate-500 mb-2">筛选条件</div>
        <div className="flex flex-wrap gap-2">
          {strategy.filters.map((filter, index) => {
            const fieldInfo = getFilterFields().find(f => f.key === filter.field);
            const opLabels: Record<string, string> = { gt: '大于', lt: '小于', eq: '等于', between: '区间' };
            return (
              <div key={index} className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded">
                {fieldInfo?.label || filter.field} {opLabels[filter.operator] || filter.operator}{' '}
                {Array.isArray(filter.value) ? `${filter.value[0]}~${filter.value[1]}` : filter.value}
                {fieldInfo?.unit || ''}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-slate-200">
        <div className="text-xs text-slate-400">
          创建于 {new Date(strategy.createdAt).toLocaleDateString()}
        </div>
        <div className="flex gap-2">
          <button
            onClick={onEdit}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            编辑
          </button>
          <button
            onClick={onDuplicate}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <Copy className="w-4 h-4" />
            复制
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-1 px-3 py-1.5 rounded text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            删除
          </button>
        </div>
      </div>

      <FactorLibraryModal isOpen={showFactorLibrary} onClose={() => setShowFactorLibrary(false)} />
    </div>
  );
};

const StrategyEditor: React.FC<{
  strategy: StrategyType | null;
  onSave: (strategy: StrategyType) => void;
  onCancel: () => void;
}> = ({ strategy, onSave, onCancel }) => {
  const [name, setName] = useState(strategy?.name || '');
  const [type, setType] = useState<StrategyType['type']>(strategy?.type || 'preset');
  const [description, setDescription] = useState(strategy?.description || '');
  const [isPublic, setIsPublic] = useState(strategy?.isPublic || false);
  const [factors, setFactors] = useState<StrategyFactor[]>(strategy?.factors || []);
  const [filters, setFilters] = useState<StrategyFilter[]>(strategy?.filters || []);
  const [showFactorLibrary, setShowFactorLibrary] = useState(false);

  const filterFields = getFilterFields();

  const handleSave = () => {
    if (!name.trim()) return;

    const newStrategy: StrategyType = {
      id: strategy?.id || `strategy-${Date.now()}`,
      name,
      type,
      description,
      factors,
      filters,
      isPublic,
      createdAt: strategy?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSave(newStrategy);
  };

  const addFactorFromLibrary = (factor: { name: string; weight: number }) => {
    setFactors([...factors, { id: factor.name, field: factor.name, label: factor.name, name: factor.name, weight: factor.weight, direction: "asc" as const, params: {} }]);
  };

  const updateFactor = (index: number, key: keyof StrategyFactor, value: any) => {
    const newFactors = [...factors];
    newFactors[index] = { ...newFactors[index], [key]: value };
    setFactors(newFactors);
  };

  const removeFactor = (index: number) => {
    setFactors(factors.filter((_, i) => i !== index));
  };

  const addFilter = () => {
    setFilters([...filters, { field: 'pe', label: '市盈率', operator: '小于', value: '20', value2: '', unit: '', id: String(Date.now()) }]);
  };

  const getDefaultValue = (field: string): number => {
    const defaults: Record<string, number> = {
      pe: 20, pb: 3, roe: 15, marketCap: 500,
      price: 50, changePercent: 3, turnover: 5,
      volume: 100000, amount: 10000, amplitude: 5, volumeRatio: 1.5,
      ps: 5, peg: 1, roa: 10, grossMargin: 30, netMargin: 15,
      debtRatio: 50, cashFlowRatio: 0.5,
      revenueGrowth: 20, profitGrowth: 20, roeGrowth: 15, grossMarginGrowth: 10,
      ma5: 50, ma10: 50, ma20: 50, ma60: 50,
      rsi: 50, macd: 0, kdj_k: 50, kdj_d: 50,
      boll_upper: 100, boll_lower: 50,
      ev_ebitda: 15, circulatingMarketCap: 200,
    };
    return defaults[field] || 0;
  };

  const handleFieldChange = (index: number, field: string) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], field, value: String(getDefaultValue(field)) };
    setFilters(newFilters);
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (index: number, key: keyof StrategyFilter, value: any) => {
    const newFilters = [...filters];
    newFilters[index] = { ...newFilters[index], [key]: value };
    setFilters(newFilters);
  };

  const updateFilterValue = (index: number, position: 'min' | 'max' | 'single', value: number) => {
    const filter = filters[index];
    if (filter.operator === 'between') {
      const currentValue = filter.value as unknown as [number, number];
      const newValue: [number, number] = position === 'min'
        ? [value, currentValue[1]]
        : position === 'max'
        ? [currentValue[0], value]
        : [value, value];
      updateFilter(index, 'value', newValue);
    } else {
      updateFilter(index, 'value', value);
    }
  };

  const handleOperatorChange = (index: number, op: StrategyFilter['operator']) => {
    if (op === 'between') {
      updateFilter(index, 'operator', 'between');
      updateFilter(index, 'value', [0, 100]);
    } else {
      updateFilter(index, 'operator', op);
      updateFilter(index, 'value', 0);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-xl font-semibold text-slate-800">
            {strategy ? '编辑策略' : '创建新策略'}
          </h2>
          <button
            onClick={onCancel}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">基本信息</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-600 mb-1">策略名称</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                  placeholder="输入策略名称"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-600 mb-1">策略类型</label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as StrategyType['type'])}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all"
                >
                  <option value="factor">多因子策略</option>
                  <option value="technical">技术指标策略</option>
                  <option value="fundamental">基本面策略</option>
                  <option value="mixed">混合策略</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-xs text-slate-600 mb-1">策略描述</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none transition-all resize-none"
                  rows={3}
                  placeholder="描述策略的核心逻辑和使用场景"
                />
              </div>
              <div className="col-span-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-sm text-slate-600">公开策略（其他用户可见）</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3 flex items-center gap-2">
              策略因子
              <button
                onClick={() => setShowFactorLibrary(true)}
                className="text-amber-500 hover:text-amber-600 transition-colors"
                title="查看因子库说明"
              >
                <HelpCircle className="w-4 h-4" />
              </button>
              <span className="text-xs text-slate-400 font-normal">
                （共 {factors.length} 个因子，总权重 {(factors.reduce((sum, f) => sum + f.weight, 0) * 100).toFixed(0)}%）
              </span>
            </h3>
            <div className="space-y-2">
              {factors.map((factor, index) => (
                <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <input
                    type="text"
                    value={factor.name}
                    onChange={(e) => updateFactor(index, 'name', e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
                    placeholder="因子名称"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={factor.weight}
                      onChange={(e) => updateFactor(index, 'weight', Number(e.target.value))}
                      className="w-20 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
                      min="0"
                      max="1"
                      step="0.05"
                    />
                    <span className="text-xs text-slate-500 w-8">权重</span>
                  </div>
                  <button
                    onClick={() => removeFactor(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <button
                  onClick={() => setFactors([...factors, { id: String(Date.now()), field: '', label: '', name: '', weight: 0.1, direction: 'asc' as const, params: {} }])}
                  className="flex-1 py-2.5 text-sm text-amber-600 hover:bg-amber-50 rounded-xl border border-amber-200 border-dashed transition-colors"
                >
                  + 手动添加因子
                </button>
                <button
                  onClick={() => setShowFactorLibrary(true)}
                  className="flex-1 py-2.5 text-sm text-blue-600 hover:bg-blue-50 rounded-xl border border-blue-200 border-dashed transition-colors"
                >
                  从因子库选择
                </button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-medium text-slate-700 mb-3">
              筛选条件
              <span className="text-xs text-slate-400 font-normal ml-2">
                （共 {filters.length} 个条件）
              </span>
            </h3>
            <div className="space-y-2">
              {filters.map((filter, index) => {
                const fieldInfo = filterFields.find(f => f.key === filter.field);
                return (
                  <div key={index} className="flex items-center gap-2 p-3 bg-slate-50 rounded-xl flex-wrap">
                    <select
                      value={filter.field}
                      onChange={(e) => handleFieldChange(index, e.target.value)}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none bg-white min-w-[140px]"
                    >
                      {filterFields.map(field => (
                        <option key={field.key} value={field.key}>{field.label}</option>
                      ))}
                    </select>

                    <select
                      value={filter.operator}
                      onChange={(e) => handleOperatorChange(index, e.target.value as StrategyFilter['operator'])}
                      className="px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none bg-white min-w-[100px]"
                    >
                      <option value="gt">大于</option>
                      <option value="lt">小于</option>
                      <option value="between">区间</option>
                    </select>

                    {filter.operator === 'between' ? (
                      <div className="flex items-center gap-2 flex-1 min-w-[280px]">
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-slate-500 whitespace-nowrap">最小值:</span>
                          <input
                            type="number"
                            value={(filter.value as unknown as [number, number])[0]}
                            onChange={(e) => updateFilterValue(index, 'min', Number(e.target.value))}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
                          />
                        </div>
                        <span className="text-slate-400 font-medium">~</span>
                        <div className="flex items-center gap-2 flex-1">
                          <span className="text-xs text-slate-500 whitespace-nowrap">最大值:</span>
                          <input
                            type="number"
                            value={(filter.value as unknown as [number, number])[1]}
                            onChange={(e) => updateFilterValue(index, 'max', Number(e.target.value))}
                            className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
                          />
                        </div>
                        <span className="text-sm text-slate-500 whitespace-nowrap">{fieldInfo?.unit}</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 flex-1 min-w-[150px]">
                        <input
                          type="number"
                          value={filter.value as unknown as number}
                          onChange={(e) => updateFilterValue(index, 'single', Number(e.target.value))}
                          className="flex-1 px-3 py-2 rounded-lg border border-slate-300 text-sm focus:border-amber-500 focus:ring-1 focus:ring-amber-500/20 outline-none"
                        />
                        <span className="text-sm text-slate-500 whitespace-nowrap">{fieldInfo?.unit}</span>
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
                className="w-full py-2.5 text-sm text-amber-600 hover:bg-amber-50 rounded-xl border border-amber-200 border-dashed transition-colors"
              >
                + 添加筛选条件
              </button>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors shadow-sm"
          >
            <Save className="w-4 h-4" />
            保存策略
          </button>
        </div>

        <FactorLibraryModal
          isOpen={showFactorLibrary}
          onClose={() => setShowFactorLibrary(false)}
          onSelectFactor={addFactorFromLibrary}
        />
      </div>
    </div>
  );
};

const Strategy: React.FC = () => {
  const { myStrategies, strategies, addMyStrategy, updateMyStrategy, deleteMyStrategy, fetchInitialData } = useAppStore();
  const [showEditor, setShowEditor] = useState(false);
  const [editingStrategy, setEditingStrategy] = useState<StrategyType | null>(null);
  const [showFactorLibrary, setShowFactorLibrary] = useState(false);

  // 确保策略数据已加载
  useEffect(() => { fetchInitialData(); }, []);

  const handleCreateNew = () => {
    setEditingStrategy(null);
    setShowEditor(true);
  };

  const handleEdit = (strategy: StrategyType) => {
    setEditingStrategy(strategy);
    setShowEditor(true);
  };

  const handleDuplicate = async (strategy: StrategyType) => {
    const newStrategy: StrategyType = {
      ...strategy,
      id: `user-${Date.now()}`,
      name: `${strategy.name} (副本)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    addMyStrategy(newStrategy);
    // 同步到服务端
    try { await saveStrategy(newStrategy); } catch {}
  };

  const handleDelete = async (strategyId: string) => {
    if (window.confirm('确定要删除这个策略吗？')) {
      deleteMyStrategy(strategyId);
      // 同步到服务端
      try { await deleteStrategy(strategyId); } catch {}
    }
  };

  const handleSave = async (strategy: StrategyType) => {
    if (editingStrategy) {
      updateMyStrategy(strategy);
      // 同步到服务端
      try { await updateStrategy(strategy.id, strategy); } catch {}
    } else {
      addMyStrategy(strategy);
      // 同步到服务端
      try { await saveStrategy(strategy); } catch {}
    }
    setShowEditor(false);
    setEditingStrategy(null);
  };

  const allMyStrategies = [...myStrategies];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">策略管理</h1>
          <p className="text-slate-600">
            创建和管理您的选股策略
            <button
              onClick={() => setShowFactorLibrary(true)}
              className="ml-3 text-amber-500 hover:text-amber-600 text-sm font-medium inline-flex items-center gap-1"
            >
              <HelpCircle className="w-4 h-4" />
              了解策略因子
            </button>
          </p>
        </div>
        <button
          onClick={handleCreateNew}
          className="flex items-center gap-2 px-5 py-2.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" />
          创建策略
        </button>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Share2 className="w-5 h-5 text-amber-500" />
          我的策略
        </h2>
        {allMyStrategies.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-10 text-center">
            <div className="text-slate-400 mb-4">
              <Share2 className="w-14 h-14 mx-auto opacity-50" />
            </div>
            <p className="text-slate-600 mb-2">您还没有创建任何策略</p>
            <p className="text-slate-400 text-sm mb-6">从公开策略复制或从零开始创建您的第一个策略</p>
            <div className="flex justify-center gap-3">
              <button
                onClick={handleCreateNew}
                className="px-5 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors"
              >
                创建策略
              </button>
              <button
                onClick={() => setShowFactorLibrary(true)}
                className="px-5 py-2 border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors"
              >
                了解因子
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {allMyStrategies.map(strategy => (
              <StrategyDetailCard
                key={strategy.id}
                strategy={strategy}
                onEdit={() => handleEdit(strategy)}
                onDelete={() => handleDelete(strategy.id)}
                onDuplicate={() => handleDuplicate(strategy)}
              />
            ))}
          </div>
        )}
      </div>

      <div>
        <h2 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-blue-500" />
          公开策略参考
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {strategies.map(strategy => (
            <div key={strategy.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-5 hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-slate-800">{strategy.name}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${typeColors[strategy.type]}`}>
                  {typeLabels[strategy.type]}
                </span>
              </div>
              <p className="text-sm text-slate-600 mb-3 line-clamp-2">{strategy.description}</p>
              <div className="flex flex-wrap gap-1 mb-3">
                {strategy.factors.slice(0, 4).map((f, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                    {f.name}
                  </span>
                ))}
                {strategy.factors.length > 4 && (
                  <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                    +{strategy.factors.length - 4}
                  </span>
                )}
              </div>
              <button
                onClick={() => handleDuplicate(strategy)}
                className="text-sm text-amber-600 hover:text-amber-700 font-medium flex items-center gap-1"
              >
                <Copy className="w-3.5 h-3.5" />
                复制此策略
              </button>
            </div>
          ))}
        </div>
      </div>

      {showEditor && (
        <StrategyEditor
          strategy={editingStrategy}
          onSave={handleSave}
          onCancel={() => {
            setShowEditor(false);
            setEditingStrategy(null);
          }}
        />
      )}

      <FactorLibraryModal isOpen={showFactorLibrary} onClose={() => setShowFactorLibrary(false)} />
    </div>
  );
};

export default Strategy;
