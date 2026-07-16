import { Strategy } from '../types';

export const strategies: any[] = [
  {
    id: 'strategy-001',
    name: '价值投资策略',
    type: 'preset',
    description: '基于市盈率、市净率、净资产收益率等价值因子',
    factors: [{ id: 'f1', field: 'pe', label: '市盈率', weight: 0.3, direction: 'asc' }, { id: 'f2', field: 'pb', label: '市净率', weight: 0.25, direction: 'asc' }, { id: 'f3', field: 'roe', label: 'ROE', weight: 0.25, direction: 'desc' }, { id: 'f4', field: 'marketCap', label: '市值', weight: 0.2, direction: 'asc' }],
    filters: [{ id: 'fl1', field: 'pe', label: '市盈率', operator: '小于', value: '20', value2: '', unit: '' }, { id: 'fl2', field: 'pb', label: '市净率', operator: '小于', value: '3', value2: '', unit: '' }, { id: 'fl3', field: 'roe', label: 'ROE', operator: '大于', value: '10', value2: '', unit: '%' }, { id: 'fl4', field: 'marketCap', label: '市值', operator: '区间', value: '100', value2: '5000', unit: '亿' }],
  },
  {
    id: 'strategy-002',
    name: '成长股策略',
    type: 'preset',
    description: '偏向高增长、高换手率的成长股',
    factors: [{ id: 'f1', field: 'roe', label: 'ROE', weight: 0.4, direction: 'desc' }, { id: 'f2', field: 'changePercent', label: '涨跌幅', weight: 0.3, direction: 'desc' }, { id: 'f3', field: 'turnover', label: '换手率', weight: 0.3, direction: 'desc' }],
    filters: [{ id: 'fl1', field: 'roe', label: 'ROE', operator: '大于', value: '15', value2: '', unit: '%' }, { id: 'fl2', field: 'turnover', label: '换手率', operator: '大于', value: '3', value2: '', unit: '%' }],
  },
  {
    id: 'strategy-003',
    name: '技术分析策略',
    type: 'preset',
    description: '基于均线、成交量等技术指标',
    factors: [{ id: 'f1', field: 'changePercent', label: '涨跌幅', weight: 0.35, direction: 'desc' }, { id: 'f2', field: 'volume', label: '成交量', weight: 0.35, direction: 'desc' }, { id: 'f3', field: 'turnover', label: '换手率', weight: 0.3, direction: 'desc' }],
    filters: [{ id: 'fl1', field: 'volume', label: '成交量', operator: '大于', value: '100000', value2: '', unit: '手' }, { id: 'fl2', field: 'changePercent', label: '涨跌幅', operator: '大于', value: '0', value2: '', unit: '%' }],
  },
  {
    id: 'strategy-004',
    name: '低估值策略',
    type: 'preset',
    description: '寻找PE、PB均处于历史低位的股票',
    factors: [{ id: 'f1', field: 'pe', label: '市盈率', weight: 0.4, direction: 'asc' }, { id: 'f2', field: 'pb', label: '市净率', weight: 0.4, direction: 'asc' }, { id: 'f3', field: 'roe', label: 'ROE', weight: 0.2, direction: 'desc' }],
    filters: [{ id: 'fl1', field: 'pe', label: '市盈率', operator: '小于', value: '15', value2: '', unit: '' }, { id: 'fl2', field: 'pb', label: '市净率', operator: '小于', value: '2', value2: '', unit: '' }],
  },
  {
    id: 'strategy-005',
    name: '高股息策略',
    type: 'preset',
    description: '侧重高分红、稳定盈利的蓝筹股',
    factors: [{ id: 'f1', field: 'roe', label: 'ROE', weight: 0.3, direction: 'desc' }, { id: 'f2', field: 'marketCap', label: '市值', weight: 0.3, direction: 'desc' }, { id: 'f3', field: 'pe', label: '市盈率', weight: 0.2, direction: 'asc' }, { id: 'f4', field: 'pb', label: '市净率', weight: 0.2, direction: 'asc' }],
    filters: [{ id: 'fl1', field: 'marketCap', label: '市值', operator: '大于', value: '500', value2: '', unit: '亿' }, { id: 'fl2', field: 'roe', label: 'ROE', operator: '大于', value: '8', value2: '', unit: '%' }],
  },
  {
    id: 'strategy-006',
    name: '动量策略',
    type: 'preset',
    description: '追逐强势股，跟随趋势',
    factors: [{ id: 'f1', field: 'changePercent', label: '涨跌幅', weight: 0.5, direction: 'desc' }, { id: 'f2', field: 'volume', label: '成交量', weight: 0.3, direction: 'desc' }, { id: 'f3', field: 'turnover', label: '换手率', weight: 0.2, direction: 'desc' }],
    filters: [{ id: 'fl1', field: 'changePercent', label: '涨跌幅', operator: '大于', value: '2', value2: '', unit: '%' }, { id: 'fl2', field: 'turnover', label: '换手率', operator: '大于', value: '5', value2: '', unit: '%' }],
  },
];

export function getStrategyById(id: string): Strategy | undefined {
  return strategies.find((s: Strategy) => s.id === id);
}
