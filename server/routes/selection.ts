import { Router } from 'express';
import { getDataSource } from '../datasources';

const router = Router();
const ds = () => getDataSource();

/** 筛选条件接口 */
interface FilterInput {
  field: string;
  operator: 'gt' | 'lt' | 'eq' | 'between';
  value: number | [number, number];
}

/** 判断单条股票是否满足筛选条件 */
function matchesFilter(stock: any, quote: any, filter: FilterInput): boolean {
  const { field, operator, value } = filter;

  // 从 stock 或 quote 中提取字段值
  let fieldValue: number | null = null;
  switch (field) {
    // 估值类 - 来自 StockInfo
    case 'pe': fieldValue = stock.pe; break;
    case 'pb': fieldValue = stock.pb; break;
    case 'marketCap': fieldValue = stock.marketCap; break;
    case 'roe': fieldValue = stock.roe; break;
    // 行情类 - 来自 StockQuote
    case 'price': fieldValue = quote.price; break;
    case 'changePercent': fieldValue = quote.changePercent; break;
    case 'volume': fieldValue = quote.volume; break;
    case 'amount': fieldValue = quote.amount; break;
    case 'turnover': fieldValue = quote.turnover; break;
    case 'high': fieldValue = quote.high; break;
    case 'low': fieldValue = quote.low; break;
    case 'open': fieldValue = quote.open; break;
    // 技术类指标 - 暂不支持，跳过筛选
    case 'ma5': case 'ma10': case 'ma20': case 'ma60':
    case 'rsi': case 'macd': case 'kdj_k': case 'kdj_d':
    case 'boll_upper': case 'boll_lower':
    case 'amplitude': case 'volumeRatio':
    case 'ps': case 'peg': case 'ev_ebitda':
    case 'roa': case 'grossMargin': case 'netMargin':
    case 'debtRatio': case 'cashFlowRatio':
    case 'revenueGrowth': case 'profitGrowth':
    case 'roeGrowth': case 'grossMarginGrowth':
    case 'circulatingMarketCap':
      return true; // 跳过不支持的技术/财务类字段
    default:
      return true; // 未知字段，不筛选
  }

  if (fieldValue === null) return true;

  switch (operator) {
    case 'gt': return fieldValue > (value as number);
    case 'lt': return fieldValue < (value as number);
    case 'eq': return Math.abs(fieldValue - (value as number)) < 0.01;
    case 'between': {
      const [min, max] = value as [number, number];
      return fieldValue >= min && fieldValue <= max;
    }
    default: return true;
  }
}

/** 根据策略因子计算综合得分 */
function calculateScore(stock: any, quote: any, factorNames: string[]): number {
  if (factorNames.length === 0) {
    // 默认评分：PE越低越好，市值适中，涨跌幅适中
    const peScore = stock.pe > 0 ? Math.min(1, 30 / Math.max(stock.pe, 1)) * 35 : 10;
    const pbScore = stock.pb > 0 ? Math.min(1, 5 / Math.max(stock.pb, 0.5)) * 25 : 10;
    const momentumScore = 20 + quote.changePercent * 2; // 涨跌幅影响
    const roeScore = Math.min(15, stock.roe * 0.5); // ROE 越高越好
    return Math.round(Math.min(100, peScore + pbScore + momentumScore + roeScore) * 100) / 100;
  }

  // 根据因子名计算得分
  let score = 0;
  const weights: Record<string, number> = {
    'pe': 0.15, 'pb': 0.15, 'roe': 0.15, 'marketCap': 0.1,
    'changePercent': 0.1, 'turnover': 0.1, 'price': 0.05,
    'volume': 0.05, 'amount': 0.05, 'ma5': 0.05, 'rsi': 0.05,
  };

  for (const name of factorNames) {
    const w = weights[name] || 0.05;
    switch (name) {
      case 'pe': score += w * (stock.pe > 0 ? Math.min(1, 30 / Math.max(stock.pe, 1)) * 100 : 30); break;
      case 'pb': score += w * (stock.pb > 0 ? Math.min(1, 5 / Math.max(stock.pb, 0.5)) * 100 : 30); break;
      case 'roe': score += w * Math.min(100, stock.roe * 3); break;
      case 'marketCap': score += w * (stock.marketCap > 0 ? Math.min(1, 5000 / Math.max(stock.marketCap, 100)) * 100 : 50); break;
      case 'changePercent': score += w * Math.max(0, 50 + quote.changePercent * 5); break;
      case 'turnover': score += w * Math.min(100, quote.turnover * 20); break;
      case 'price': score += w * Math.min(100, quote.price * 2); break;
      case 'volume': score += w * Math.min(100, Math.log10(quote.volume + 1) * 15); break;
      case 'amount': score += w * Math.min(100, Math.log10(quote.amount + 1) * 15); break;
      default: score += w * 50; break;
    }
  }

  return Math.round(Math.min(100, score) * 100) / 100;
}

router.post('/run', async (req, res, next) => {
  try {
    const { strategyId, filters = [] } = req.body;

    // 获取股票列表
    let allStocks = await ds().searchStocks('');

    // 如果真实数据源返回空，使用预设股票列表
    if (allStocks.length === 0) {
      const fallbackCodes = ['600519', '000858', '601318', '000333', '600036',
        '300750', '002594', '600900', '601899', '000568', '600809', '600030',
        '000725', '002415', '300059', '601012', '000651', '600036', '601888', '002304'];
      allStocks = await ds().getStockInfo(fallbackCodes);
    }

    // 获取所有股票的行情
    const codes = allStocks.map(s => s.code);
    const quotes = await ds().getQuotes(codes);

    // 构建股票-行情映射
    const quoteMap = new Map<string, any>();
    quotes.forEach(q => quoteMap.set(q.code, q));

    // 应用筛选条件
    const filtered: { stock: any; quote: any }[] = [];
    for (const stock of allStocks) {
      const quote = quoteMap.get(stock.code);
      if (!quote) continue;

      let passed = true;
      for (const filter of filters) {
        if (!matchesFilter(stock, quote, filter)) {
          passed = false;
          break;
        }
      }
      if (passed) {
        filtered.push({ stock, quote });
      }
    }

    // 如果过滤后没结果，返回前20个并标注
    const candidates = filtered.length > 0 ? filtered : allStocks.slice(0, 20).map(s => ({
      stock: s,
      quote: quoteMap.get(s.code) || { code: s.code, name: s.name, price: 0, change: 0, changePercent: 0, volume: 0, amount: 0, turnover: 0, high: 0, low: 0, open: 0, preClose: 0 },
    }));

    // 计算得分并排序
    const results = candidates.map((item, idx) => ({
      stock: item.stock,
      quote: item.quote,
      score: calculateScore(item.stock, item.quote, []),
      rank: idx + 1,
    }));

    results.sort((a, b) => b.score - a.score);
    results.forEach((r, i) => r.rank = i + 1);

    const top = results.slice(0, 20);

    res.json({
      success: true,
      data: {
        taskId: `sel-${Date.now()}`,
        strategyId,
        stocks: top,
        totalCount: results.length,
        executedAt: new Date().toISOString(),
        filteredCount: filtered.length,
        totalScanned: allStocks.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export const selectionRoutes = router;