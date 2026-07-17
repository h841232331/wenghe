import { Router } from 'express';

const router = Router();

// 解析结果类型
interface ParsedStrategy {
  name: string;
  description: string;
  buyConditions: SignalCondition[];
  sellConditions: SignalCondition[];
  filters: ParsedFilter[];
  raw: string;
}

interface SignalCondition {
  type: string;
  params: Record<string, number>;
  desc: string;
}

interface ParsedFilter {
  field: string;
  label: string;
  operator: string;
  value: number | string;
  unit: string;
}

// ========== 中文关键词映射 ==========

// 均线金叉模式
const MA_CROSS_PATTERNS = [
  /(\d+)\s*日(?:均)?线?\s*[上金]穿\s*(\d+)\s*日(?:均)?线?/,
  /MA\s*(\d+)\s*[上金]穿\s*MA\s*(\d+)/i,
  /(\d+)\s*日(?:均)?线?\s*金叉\s*(\d+)\s*日(?:均)?线?/,
];

// 均线死叉模式
const MA_DEATH_PATTERNS = [
  /(\d+)\s*日(?:均)?线?\s*下穿\s*(\d+)\s*日(?:均)?线?/,
  /MA\s*(\d+)\s*下穿\s*MA\s*(\d+)/i,
  /(\d+)\s*日(?:均)?线?\s*死叉\s*(\d+)\s*日(?:均)?线?/,
];

// 通用筛选条件
const FILTER_PATTERNS: { pattern: RegExp; field: string; label: string; unit: string }[] = [
  { pattern: /(?:PE|市盈率)\s*[<＜]\s*(\d+\.?\d*)/, field: 'pe', label: '市盈率', unit: '倍' },
  { pattern: /(?:PE|市盈率)\s*(?:大于|＞|>)\s*(\d+\.?\d*)/, field: 'pe', label: '市盈率', unit: '倍' },
  { pattern: /(?:PE|市盈率)\s*(?:小于|＜|<)\s*(\d+\.?\d*)/, field: 'pe', label: '市盈率', unit: '倍' },
  { pattern: /(?:PB|市净率)\s*[<＜]\s*(\d+\.?\d*)/, field: 'pb', label: '市净率', unit: '倍' },
  { pattern: /(?:PB|市净率)\s*(?:小于|＜|<)\s*(\d+\.?\d*)/, field: 'pb', label: '市净率', unit: '倍' },
  { pattern: /(?:PB|市净率)\s*(?:大于|＞|>)\s*(\d+\.?\d*)/, field: 'pb', label: '市净率', unit: '倍' },
  { pattern: /ROE\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'roe', label: '净资产收益率', unit: '%' },
  { pattern: /净资产收益率\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'roe', label: '净资产收益率', unit: '%' },
  { pattern: /市值\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*亿/, field: 'marketCap', label: '总市值', unit: '亿' },
  { pattern: /市值\s*(?:小于|＜|<)\s*(\d+\.?\d*)\s*亿/, field: 'marketCap', label: '总市值', unit: '亿' },
  { pattern: /换手率\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'turnover', label: '换手率', unit: '%' },
  { pattern: /换手率\s*(?:小于|＜|<)\s*(\d+\.?\d*)\s*%?/, field: 'turnover', label: '换手率', unit: '%' },
  { pattern: /(?:排除|去掉).*?换手率.*?(?:低于|＜|<)\s*(\d+\.?\d*)\s*%?/, field: 'turnover', label: '换手率', unit: '%' },
  { pattern: /涨跌幅\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'changePercent', label: '涨跌幅', unit: '%' },
  { pattern: /涨跌幅\s*(?:小于|＜|<)\s*(\d+\.?\d*)\s*%?/, field: 'changePercent', label: '涨跌幅', unit: '%' },
  { pattern: /毛利率\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'grossMargin', label: '毛利率', unit: '%' },
  { pattern: /营收增长率\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'revenueGrowth', label: '营收增长率', unit: '%' },
  { pattern: /净利润增长率\s*(?:大于|＞|>)\s*(\d+\.?\d*)\s*%?/, field: 'profitGrowth', label: '净利润增长率', unit: '%' },
];

// 成交量模式
const VOLUME_PATTERNS = [
  { pattern: /放量突破/, type: 'volume_breakout' as const, desc: '放量突破' },
  { pattern: /放量上涨/, type: 'volume_breakout' as const, desc: '放量上涨' },
  { pattern: /缩量回调/, type: 'volume_breakout' as const, desc: '缩量回调' },
];

// 价格突破均线
const MA_BREAK_PATTERNS = [
  /价格突破\s*(\d+)\s*日(?:均)?线/,
  /站上\s*(\d+)\s*日(?:均)?线/,
  /跌破\s*(\d+)\s*日(?:均)?线/,
];

// RSI
const RSI_PATTERNS = [
  /RSI\s*(?:小于|＜|<)\s*(\d+)/,
  /RSI\s*(?:大于|＞|>)\s*(\d+)/,
  /RSI\s*[<＜]\s*(\d+)/,
];

// MACD
const MACD_PATTERNS = [
  /MACD金叉/,
  /MACD死叉/,
];

// ========== 运算符标准化 ==========
type StdOperator = 'gt' | 'lt' | 'gte' | 'lte' | 'eq' | 'ne';

function normalizeOperator(op: string): StdOperator {
  if (/大于等于|>=|≥|＞=|不低于/.test(op)) return 'gte';
  if (/小于等于|<=|≤|＜=|不高于/.test(op)) return 'lte';
  if (/大于|＞|>|高于/.test(op)) return 'gt';
  if (/小于|＜|<|低于/.test(op)) return 'lt';
  if (/排除|不等于|≠|不是/.test(op)) return 'ne';
  return 'eq';
}

const OP_LABEL: Record<string, string> = {
  gt: '大于', lt: '小于', gte: '大于等于', lte: '小于等于', eq: '等于', ne: '排除',
};

// ========== 解析函数 ==========

function parseNL(text: string): ParsedStrategy {
  const buyConditions: SignalCondition[] = [];
  const sellConditions: SignalCondition[] = [];
  const filters: ParsedFilter[] = [];

  // 1. 处理 "排除ST" / "排除ST股"
  if (/排除\s*ST\s*股?/i.test(text)) {
    filters.push({ field: 'isST', label: '排除ST股', operator: 'ne', value: 'ST', unit: '' });
  }

  // 1b. 处理其他布尔型排除/包含条件
  const boolPatterns: [RegExp, string, string, string][] = [
    [/排除\s*次新\s*股?/, 'isNewStock', '股票类型', '排除次新股'],
    [/排除\s*停牌\s*股?/, 'isSuspended', '股票类型', '排除停牌股'],
    [/属于\s*科创\s*板块?/, 'isKCB', '股票板块', '属于科创板'],
    [/属于\s*创业板/, 'isCYB', '股票板块', '属于创业板'],
    [/属于\s*北交\s*所?/, 'isBJ', '股票板块', '属于北交所'],
    [/属于\s*沪深\s*300/, 'isHS300', '股票板块', '属于沪深300'],
    [/属于\s*中证\s*500/, 'isZZ500', '股票板块', '属于中证500'],
  ];
  for (const [pattern, field, group, label] of boolPatterns) {
    if (pattern.test(text)) {
      if (!filters.find(f => f.field === field)) {
        filters.push({ field, label, operator: field.startsWith('isST') || field.startsWith('isNew') || field.startsWith('isSuspended') ? 'ne' : 'eq', value: 'true', unit: '' });
      }
    }
  }

  // 2. 处理 "N个交易日内涨停次数>=X" / "N日内涨停>=X" / "N天涨停>=X"
  const limitUpMatch = text.match(/(\d+)\s*(?:个)?(?:交易日|日|天)\s*(?:内)?\s*涨停(?:\s*次数)?\s*(?:>=|＞=|≥|＞|>)\s*(\d+)/);
  if (limitUpMatch) {
    filters.push({
      field: 'limitUpCount',
      label: '涨停次数',
      operator: 'gte',
      value: parseInt(limitUpMatch[2]),
      unit: `次(${limitUpMatch[1]}日内)`,
    });
    buyConditions.push({
      type: 'limit_up_count',
      params: { days: parseInt(limitUpMatch[1]), count: parseInt(limitUpMatch[2]) },
      desc: `${limitUpMatch[1]}个交易日内涨停≥${limitUpMatch[2]}次`,
    });
  }

  // 3. 处理 "排除N交易日换手率低于X%" / "排除N日换手率低于X%"
  const excludeTurnover = text.match(/(?:排除|去掉).*?(\d+)\s*(?:个)?(?:交易日|日|天)\s*(?:内)?\s*换手率\s*(?:低于|＜|<)\s*(\d+\.?\d*)\s*%?/);
  if (excludeTurnover) {
    filters.push({
      field: 'avgTurnover',
      label: '日均换手率',
      operator: 'gte',
      value: parseFloat(excludeTurnover[2]),
      unit: `%(${excludeTurnover[1]}日内)`,
    });
  }

  // 4. 处理 "换手率低于X%"（简单排除）
  const lowTurnover = text.match(/(?:排除|去掉).*?换手率\s*(?:低于|＜|<)\s*(\d+\.?\d*)\s*%?/);
  if (lowTurnover && !excludeTurnover) {
    if (!filters.find(f => f.field === 'turnover')) {
      filters.push({
        field: 'turnover',
        label: '换手率',
        operator: 'gte',
        value: parseFloat(lowTurnover[1]),
        unit: '%',
      });
    }
  }

  // ====== 买入/卖出描述提取 ======
  let buyPart = '';
  let sellPart = '';

  const buySuffix = text.match(/(.+?)(?:买入|买点|做多|开仓)/);
  if (buySuffix) {
    buyPart = buySuffix[1];
  } else {
    const buyPrefix = text.match(/(?:买入|买点|做多|开仓)[：:]*\s*(.+?)(?:卖出|卖点|做空|平仓|$)/);
    if (buyPrefix) buyPart = buyPrefix[1];
  }

  const sellSuffix = text.match(/(.+?)(?:卖出|卖点|做空|平仓)/);
  if (sellSuffix) {
    sellPart = sellSuffix[1];
  } else {
    const sellPrefix = text.match(/(?:卖出|卖点|做空|平仓)[：:]*\s*(.+?)(?:买入|买点|做多|开仓|$)/);
    if (sellPrefix) sellPart = sellPrefix[1];
  }

  // 整个文本（去掉了筛选条件后的部分）作为信号描述
  const signalText = buyPart || sellPart || text;

  // ====== 信号条件解析 ======

  // 均线金叉
  for (const pat of MA_CROSS_PATTERNS) {
    const match = signalText.match(pat);
    if (match) {
      buyConditions.push({
        type: 'ma_cross',
        params: { short: parseInt(match[1]), long: parseInt(match[2]) },
        desc: `${match[1]}日均线上穿${match[2]}日均线（金叉）`,
      });
      break;
    }
  }

  // 均线死叉
  for (const pat of MA_DEATH_PATTERNS) {
    const match = (sellPart || text).match(pat);
    if (match) {
      sellConditions.push({
        type: 'ma_cross',
        params: { short: parseInt(match[1]), long: parseInt(match[2]) },
        desc: `${match[1]}日均线下穿${match[2]}日均线（死叉）`,
      });
      break;
    }
  }

  // 对称卖出信号
  if (sellConditions.length === 0 && buyConditions.length > 0 && buyConditions[0].type === 'ma_cross') {
    const bc = buyConditions[0];
    sellConditions.push({
      type: 'ma_cross',
      params: { short: bc.params.short, long: bc.params.long },
      desc: `${bc.params.short}日均线下穿${bc.params.long}日均线（死叉）`,
    });
  }

  // 价格突破均线
  for (const pat of MA_BREAK_PATTERNS) {
    const match = signalText.match(pat);
    if (match) {
      buyConditions.push({
        type: 'ma_break',
        params: { period: parseInt(match[1]) },
        desc: `价格突破${match[1]}日均线`,
      });
      break;
    }
  }

  // 成交量信号
  for (const vp of VOLUME_PATTERNS) {
    if (vp.pattern.test(signalText)) {
      buyConditions.push({ type: vp.type, params: {}, desc: vp.desc });
      break;
    }
  }

  // RSI
  for (const pat of RSI_PATTERNS) {
    const match = signalText.match(pat);
    if (match) {
      buyConditions.push({
        type: 'rsi',
        params: { threshold: parseInt(match[1]) },
        desc: `RSI信号: ${match[0]}`,
      });
      break;
    }
  }

  // MACD
  for (const pat of MACD_PATTERNS) {
    if (pat.test(signalText)) {
      buyConditions.push({
        type: 'macd',
        params: {},
        desc: pat.source.includes('金叉') ? 'MACD金叉' : 'MACD死叉',
      });
      break;
    }
  }

  // 涨停板信号
  if (/涨停/.test(signalText) && !limitUpMatch) {
    const limitMatch = signalText.match(/(\d+)\s*(?:个)?(?:交易日|日|天)\s*(?:内)?\s*涨停/);
    if (limitMatch) {
      buyConditions.push({
        type: 'limit_up_count',
        params: { days: parseInt(limitMatch[1]), count: 1 },
        desc: `${limitMatch[1]}日内出现涨停`,
      });
    }
  }

  // ====== 通用筛选条件 ======
  for (const fp of FILTER_PATTERNS) {
    const match = text.match(fp.pattern);
    if (match) {
      const value = parseFloat(match[1]);
      const isLow = fp.pattern.source.includes('小于') || fp.pattern.source.includes('<') || fp.pattern.source.includes('＜') || fp.pattern.source.includes('低于') || fp.pattern.source.includes('排除');
      const operator: StdOperator = isLow ? 'lt' : 'gt';
      // 去重：avgTurnover / turnover 不重复添加；排除换手率已处理过则跳过
      if (fp.field === 'turnover' && filters.find(f => f.field === 'avgTurnover')) continue;
      if (fp.field === 'turnover' && filters.find(f => f.field === 'turnover')) continue;
      if (fp.field === 'pb' && isLow && filters.find(f => f.field === 'pb')) continue;
      if (!filters.find(f => f.field === fp.field && f.operator === operator)) {
        filters.push({ field: fp.field, label: fp.label, operator, value, unit: fp.unit });
      }
    }
  }

  // 无匹配结果
  if (buyConditions.length === 0 && sellConditions.length === 0 && filters.length === 0) {
    return { name: '', description: '', buyConditions: [], sellConditions: [], filters: [], raw: text };
  }

  // 生成名称
  const nameParts: string[] = [];
  if (buyConditions.length > 0) nameParts.push(buyConditions[0].desc);
  if (filters.length > 0) nameParts.push(`${filters.length}个筛选条件`);
  const name = nameParts.join(' + ') || '自定义策略';

  // 生成描述
  const descParts: string[] = [];
  if (buyConditions.length > 0) descParts.push('买入：' + buyConditions.map(c => c.desc).join('、'));
  if (sellConditions.length > 0) descParts.push('卖出：' + sellConditions.map(c => c.desc).join('、'));
  const boolFields = ['isST', 'isNewStock', 'isSuspended', 'isKCB', 'isCYB', 'isBJ', 'isHS300', 'isZZ500'];
  if (filters.length > 0) {
    descParts.push('筛选：' + filters.map(f => {
      if (boolFields.includes(f.field)) return f.label;
      return `${f.label}${OP_LABEL[f.operator] || f.operator}${f.value}${f.unit}`;
    }).join('，'));
  }

  return { name, description: descParts.join('；'), buyConditions, sellConditions, filters, raw: text };
}

// ========== API 端点 ==========

router.post('/parse', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || typeof text !== 'string' || !text.trim()) {
      return res.json({ success: false, message: '请输入策略描述' });
    }
    const result = parseNL(text.trim());
    if (result.buyConditions.length === 0 && result.sellConditions.length === 0 && result.filters.length === 0) {
      return res.json({
        success: false,
        message: '未能识别。请试试：\n"5日均线上穿20日均线买入，PE小于20"\n"20日内涨停>=3次，排除ST股"\n"10日线金叉30日线，市值大于100亿"',
        hint: '试试：20日内涨停>=3次，排除ST股，排除换手率低于5%',
      });
    }
    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || '解析失败' });
  }
});

export const nlStrategyRoutes = router;