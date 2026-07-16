import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 预设策略（不可删除）
const presetStrategies = [
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

// 用户策略存储文件
const USER_STRATEGIES_FILE = path.join(__dirname, '..', 'data', 'user-strategies.json');

// 读取用户策略
function loadUserStrategies(): any[] {
  try {
    if (fs.existsSync(USER_STRATEGIES_FILE)) {
      const raw = fs.readFileSync(USER_STRATEGIES_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[Strategy] Failed to load user strategies:', e);
  }
  return [];
}

// 保存用户策略
function saveUserStrategies(strategies: any[]): void {
  try {
    const dir = path.dirname(USER_STRATEGIES_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(USER_STRATEGIES_FILE, JSON.stringify(strategies, null, 2), 'utf-8');
  } catch (e) {
    console.error('[Strategy] Failed to save user strategies:', e);
  }
}

// 获取所有策略（预设 + 用户自建）
router.get('/', async (req: Request, res: Response) => {
  const userStrategies = loadUserStrategies();
  const all = [...presetStrategies, ...userStrategies];
  res.json({ success: true, data: all });
});

// 获取单个策略
router.get('/:id', async (req: Request, res: Response) => {
  const preset = presetStrategies.find(s => s.id === req.params.id);
  if (preset) return res.json({ success: true, data: preset });

  const userStrategies = loadUserStrategies();
  const user = userStrategies.find(s => s.id === req.params.id);
  if (user) return res.json({ success: true, data: user });

  res.status(404).json({ success: false, message: '策略不存在' });
});

// 创建用户策略
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, type, description, factors, filters, isPublic } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: '策略名称和类型不能为空' });
    }

    const newStrategy = {
      id: `user-${Date.now()}`,
      name,
      type,
      description: description || '',
      factors: factors || [],
      filters: filters || [],
      isPublic: isPublic || false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const userStrategies = loadUserStrategies();
    userStrategies.push(newStrategy);
    saveUserStrategies(userStrategies);

    res.json({ success: true, data: newStrategy });
  } catch (e) {
    res.status(500).json({ success: false, message: '创建策略失败' });
  }
});

// 更新用户策略
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const preset = presetStrategies.find(s => s.id === id);
    if (preset) {
      return res.status(400).json({ success: false, message: '预设策略不可修改' });
    }

    const userStrategies = loadUserStrategies();
    const index = userStrategies.findIndex(s => s.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, message: '策略不存在' });
    }

    userStrategies[index] = {
      ...userStrategies[index],
      ...req.body,
      id, // 保持ID不变
      updatedAt: new Date().toISOString(),
    };
    saveUserStrategies(userStrategies);

    res.json({ success: true, data: userStrategies[index] });
  } catch (e) {
    res.status(500).json({ success: false, message: '更新策略失败' });
  }
});

// 删除用户策略
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const preset = presetStrategies.find(s => s.id === id);
    if (preset) {
      return res.status(400).json({ success: false, message: '预设策略不可删除' });
    }

    const userStrategies = loadUserStrategies();
    const filtered = userStrategies.filter(s => s.id !== id);
    if (filtered.length === userStrategies.length) {
      return res.status(404).json({ success: false, message: '策略不存在' });
    }

    saveUserStrategies(filtered);
    res.json({ success: true, message: '删除成功' });
  } catch (e) {
    res.status(500).json({ success: false, message: '删除策略失败' });
  }
});

export const strategyRoutes = router;