import { Router, Request, Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

// 预设策略（不可删除）- 每个策略都有详细说明，方便新手理解
const presetStrategies = [
  {
    id: 'strategy-001',
    name: '价值投资（低PE+高ROE）',
    type: 'factor',
    description: '寻找市盈率低、盈利能力强的好公司。PE<20表示股价没有被高估，ROE>15%表示公司盈利能力强。适合长期持有，风险较低。',
    factors: [
      { name: '市盈率（PE）', weight: 0.35 },
      { name: '净资产收益率（ROE）', weight: 0.35 },
      { name: '市净率（PB）', weight: 0.3 },
    ],
    filters: [
      { field: 'pe', operator: 'lt', value: 20 },
      { field: 'roe', operator: 'gt', value: 15 },
      { field: 'pb', operator: 'lt', value: 3 },
    ],
    isPublic: true,
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-20T10:30:00Z',
  },
  {
    id: 'strategy-002',
    name: '短线强势股（涨停板筛选）',
    type: 'technical',
    description: '筛选近期出现过涨停的活跃股票。涨停说明有主力资金关注，20日内出现3次以上涨停的股票通常处于强势阶段。适合短线交易，风险较高。',
    factors: [
      { name: '涨停次数', weight: 0.4 },
      { name: '换手率', weight: 0.3 },
      { name: '成交量', weight: 0.3 },
    ],
    filters: [
      { field: 'turnover', operator: 'gt', value: 5 },
      { field: 'isST', operator: '排除', value: 'true' },
    ],
    isPublic: true,
    createdAt: '2024-02-10T09:00:00Z',
    updatedAt: '2024-06-15T14:20:00Z',
  },
  {
    id: 'strategy-003',
    name: '均线金叉买入（5日/20日）',
    type: 'technical',
    description: '当5日均线从下方上穿20日均线时买入（金叉），这是最经典的趋势跟踪信号。金叉表示短期趋势转强，可能开启新一轮上涨。适合中短线交易。',
    factors: [
      { name: 'MA5趋势', weight: 0.35 },
      { name: 'MA20趋势', weight: 0.35 },
      { name: '成交量配合', weight: 0.3 },
    ],
    filters: [
      { field: 'volume', operator: 'gt', value: 100000 },
    ],
    isPublic: true,
    createdAt: '2024-01-20T10:00:00Z',
    updatedAt: '2024-05-10T16:45:00Z',
  },
  {
    id: 'strategy-004',
    name: '超跌反弹策略',
    type: 'technical',
    description: '寻找近期大幅下跌的股票，博取反弹机会。跌幅超过10%的股票可能被过度抛售，存在技术性反弹需求。注意：超跌不等于便宜，需结合基本面判断。',
    factors: [
      { name: '跌幅', weight: 0.4 },
      { name: '成交量', weight: 0.3 },
      { name: 'RSI超卖', weight: 0.3 },
    ],
    filters: [
      { field: 'changePercent', operator: 'lt', value: -10 },
    ],
    isPublic: true,
    createdAt: '2024-03-05T11:30:00Z',
    updatedAt: '2024-04-20T09:15:00Z',
  },
  {
    id: 'strategy-005',
    name: '基本面优质股（高增长+低负债）',
    type: 'fundamental',
    description: '筛选盈利能力强、成长性好、财务稳健的公司。ROE>15%说明赚钱效率高，净利润增长率>20%说明业务在成长，低负债意味着抗风险能力强。适合长期价值投资。',
    factors: [
      { name: '净资产收益率', weight: 0.3 },
      { name: '净利润增长率', weight: 0.3 },
      { name: '资产负债率', weight: 0.2 },
      { name: '毛利率', weight: 0.2 },
    ],
    filters: [
      { field: 'roe', operator: 'gt', value: 15 },
      { field: 'profitGrowth', operator: 'gt', value: 20 },
      { field: 'pe', operator: 'lt', value: 40 },
    ],
    isPublic: true,
    createdAt: '2024-02-28T14:00:00Z',
    updatedAt: '2024-05-15T11:20:00Z',
  },
  {
    id: 'strategy-006',
    name: '行业龙头+大市值',
    type: 'mixed',
    description: '选择各行业市值大、流动性好的龙头公司。市值>500亿的公司通常行业地位稳固，换手率>1%保证流动性。适合稳健型投资者，回撤相对较小。',
    factors: [
      { name: '市值规模', weight: 0.35 },
      { name: '行业地位', weight: 0.25 },
      { name: '流动性', weight: 0.2 },
      { name: '技术走势', weight: 0.2 },
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

// 获取所有策略（预设 + 用户自建，可选过滤）
router.get('/', async (req: Request, res: Response) => {
  const userStrategies = loadUserStrategies();
  const all = [...presetStrategies, ...userStrategies];
  res.json({ success: true, data: all });
});

// 仅获取公开策略（预设 + 用户公开的）
router.get('/public', async (req: Request, res: Response) => {
  const userPublic = loadUserStrategies().filter(s => s.isPublic === true);
  res.json({ success: true, data: [...presetStrategies, ...userPublic] });
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
    const { id: clientId, name, type, description, factors, filters, isPublic } = req.body;
    if (!name || !type) {
      return res.status(400).json({ success: false, message: '策略名称和类型不能为空' });
    }

    const newStrategy = {
      id: clientId || `user-${Date.now()}`,
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