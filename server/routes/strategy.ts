import { Router } from 'express';

const router = Router();

const strategies = [
  {
    id: 'strategy-001',
    name: '价值投资策略',
    type: 'factor',
    description: '基于市盈率、市净率、净资产收益率等价值因子，筛选被低估的优质股票',
    factors: [
      { name: '市盈率', weight: 0.3, params: { target: 'low' } },
      { name: '市净率', weight: 0.25, params: { target: 'low' } },
      { name: '净资产收益率', weight: 0.25, params: { target: 'high' } },
      { name: '市值', weight: 0.2, params: { target: 'medium' } },
    ],
    filters: [
      { field: 'pe', operator: 'lt', value: 20 },
      { field: 'pb', operator: 'lt', value: 3 },
      { field: 'roe', operator: 'gt', value: 10 },
      { field: 'marketCap', operator: 'between', value: [100, 5000] },
    ],
    isPublic: true,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'strategy-002',
    name: '成长动量策略',
    type: 'factor',
    description: '结合成长性指标和价格动量，捕捉具有持续上涨潜力的股票',
    factors: [
      { name: '价格动量', weight: 0.35, params: { period: 60 } },
      { name: '成交量', weight: 0.25, params: { target: 'increasing' } },
      { name: '换手率', weight: 0.2, params: { target: 'medium' } },
      { name: '市值', weight: 0.2, params: { target: 'small' } },
    ],
    filters: [
      { field: 'turnover', operator: 'between', value: [2, 10] },
      { field: 'marketCap', operator: 'lt', value: 1000 },
    ],
    isPublic: true,
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-04-15T14:20:00Z',
  },
  {
    id: 'strategy-003',
    name: '均线突破策略',
    type: 'technical',
    description: '基于均线系统，捕捉股价突破关键均线的机会，适合趋势跟踪',
    factors: [
      { name: 'MA5突破', weight: 0.3, params: { direction: 'up' } },
      { name: 'MA20突破', weight: 0.3, params: { direction: 'up' } },
      { name: '成交量配合', weight: 0.2, params: { target: 'high' } },
      { name: 'MACD金叉', weight: 0.2, params: { confirm: true } },
    ],
    filters: [
      { field: 'volume', operator: 'gt', value: 500000 },
    ],
    isPublic: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-05-10T16:45:00Z',
  },
  {
    id: 'strategy-004',
    name: 'RSI超卖反弹策略',
    type: 'technical',
    description: '利用RSI指标识别超卖股票，在市场恐慌时寻找反弹机会',
    factors: [
      { name: 'RSI指标', weight: 0.4, params: { target: 'oversold', period: 14 } },
      { name: '成交量', weight: 0.3, params: { target: 'low' } },
      { name: '价格偏离', weight: 0.3, params: { target: 'extreme' } },
    ],
    filters: [
      { field: 'changePercent', operator: 'lt', value: -5 },
    ],
    isPublic: true,
    createdAt: '2024-03-05T11:30:00Z',
    updatedAt: '2024-04-20T09:15:00Z',
  },
  {
    id: 'strategy-005',
    name: '基本面优质股策略',
    type: 'fundamental',
    description: '从财务指标出发，筛选盈利能力强、财务稳健的优质股票',
    factors: [
      { name: '净资产收益率', weight: 0.35, params: { target: 'high' } },
      { name: '净利润增长率', weight: 0.25, params: { target: 'high' } },
      { name: '资产负债率', weight: 0.2, params: { target: 'low' } },
      { name: '经营现金流', weight: 0.2, params: { target: 'positive' } },
    ],
    filters: [
      { field: 'roe', operator: 'gt', value: 15 },
      { field: 'pe', operator: 'lt', value: 30 },
    ],
    isPublic: true,
    createdAt: '2024-02-28T14:00:00Z',
    updatedAt: '2024-05-15T11:20:00Z',
  },
  {
    id: 'strategy-006',
    name: '行业龙头策略',
    type: 'mixed',
    description: '结合行业地位、市值规模和技术走势，捕捉各行业龙头股的机会',
    factors: [
      { name: '行业地位', weight: 0.3, params: { target: 'leader' } },
      { name: '市值规模', weight: 0.2, params: { target: 'large' } },
      { name: '技术走势', weight: 0.25, params: { trend: 'up' } },
      { name: '流动性', weight: 0.25, params: { target: 'high' } },
    ],
    filters: [
      { field: 'marketCap', operator: 'gt', value: 500 },
      { field: 'turnover', operator: 'gt', value: 1 },
    ],
    isPublic: true,
    createdAt: '2024-03-12T15:30:00Z',
    updatedAt: '2024-05-18T13:45:00Z',
  },
];

router.get('/', async (req, res) => {
  res.json({ success: true, data: strategies });
});

router.get('/:id', async (req, res) => {
  const strategy = strategies.find(s => s.id === req.params.id);
  if (!strategy) {
    return res.status(404).json({ success: false, message: '策略不存在' });
  }
  res.json({ success: true, data: strategy });
});

export const strategyRoutes = router;
