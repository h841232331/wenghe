import { Router } from 'express';
import { getDataSource } from '../datasources';

const router = Router();
const ds = () => getDataSource();

router.get('/quote', async (req, res, next) => {
  try {
    const codes = (req.query.codes as string)?.split(',') || [];
    const data = await ds().getQuotes(codes);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/info', async (req, res, next) => {
  try {
    const codes = (req.query.codes as string)?.split(',') || [];
    const data = await ds().getStockInfo(codes);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/search', async (req, res, next) => {
  try {
    const keyword = (req.query.keyword as string) || '';
    const data = await ds().searchStocks(keyword);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// POST 搜索（避免 URL 编码兼容性问题）
router.post('/search', async (req, res, next) => {
  try {
    const keyword = (req.body?.keyword as string) || '';
    const data = await ds().searchStocks(keyword);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/kline', async (req, res, next) => {
  try {
    const code = req.query.code as string;
    const frequency = (req.query.frequency as string) || '1d';
    const count = Number(req.query.count) || 100;
    const data = await ds().getKline(code, frequency, count);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/financial', async (req, res, next) => {
  try {
    const code = req.query.code as string;
    const data = await ds().getFinancialIndicators(code);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/industries', async (req, res, next) => {
  try {
    const data = await ds().getIndustries();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

// 股票概览：基础信息 + 最新行情 + 近期K线
router.get('/overview/:code', async (req, res, next) => {
  try {
    const code = req.params.code;
    const prefix = code.startsWith('6') || code.startsWith('9') ? 'sh' : 'sz';

    // 1. 获取最新行情（从腾讯API）
    let quote: any = null;
    try {
      const tencentCode = `${prefix}${code}`;
      const resp = await fetch(`https://qt.gtimg.cn/q=${tencentCode}`);
      const buffer = await resp.arrayBuffer();
      const text = new TextDecoder('gbk').decode(buffer);
      const match = text.match(/v_(\w+)="(.+)"/);
      if (match) {
        const fields = match[2].split('~');
        if (fields.length >= 35) {
          quote = {
            code: fields[2] || code,
            name: fields[1] || '',
            price: Number(fields[3]) || 0,
            change: Number(fields[31]) || 0,
            changePercent: Number(fields[32]) || 0,
            high: Number(fields[33]) || 0,
            low: Number(fields[34]) || 0,
            open: Number(fields[5]) || 0,
            preClose: Number(fields[4]) || 0,
            volume: Number(fields[6]) || 0,
            amount: Number(fields[37]) || 0,
            turnover: Number(fields[38]) || 0,
            pe: Number(fields[39]) || 0,
            marketCap: Number(fields[45]) || 0,
          };
        }
      }
    } catch (e) {
      console.warn(`[StockOverview] Quote fetch failed for ${code}:`, e);
    }

    // 2. 获取K线数据（最近60个交易日）
    let kline: any[] = [];
    try {
      const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${prefix}${code},day,,,60,qfq`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const json: any = await resp.json();
      const dayData = json?.data?.[`${prefix}${code}`]?.day || json?.data?.[`${prefix}${code}`]?.qfqday || [];
      kline = dayData
        .map((d: any[]) => ({
          date: d[0],
          open: Number(d[1]) || 0,
          close: Number(d[2]) || 0,
          high: Number(d[3]) || 0,
          low: Number(d[4]) || 0,
          volume: Number(d[5]) || 0,
        }))
        .sort((a: any, b: any) => a.date.localeCompare(b.date));
    } catch (e) {
      console.warn(`[StockOverview] Kline fetch failed for ${code}:`, e);
    }

    res.json({ success: true, data: { quote, kline } });
  } catch (error) {
    next(error);
  }
});

export const stockRoutes = router;
