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
            pb: Number(fields[46]) || 0,
            marketCap: Number(fields[44]) || 0,  // 总市值(亿)
          };
        }
      }
    } catch (e) {
      console.warn(`[StockOverview] Quote fetch failed for ${code}:`, e);
    }

    // 2. 获取K线数据（默认日线800条=3年，可通过period参数切换日/周/月）
    const period = (req.query.period as string) || 'day';
    const count = period === 'month' ? 200 : period === 'week' ? 800 : 800;
    const periodKey = period === 'month' ? 'month' : period === 'week' ? 'week' : 'day';
    const dataKey = period === 'month' ? 'qfqmonth' : period === 'week' ? 'qfqweek' : 'qfqday';
    let kline: any[] = [];
    try {
      const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${prefix}${code},${periodKey},,,${count},qfq`;
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000);
      const resp = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      const json: any = await resp.json();
      const dayData = json?.data?.[`${prefix}${code}`]?.[dataKey] || json?.data?.[`${prefix}${code}`]?.day || [];
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

// 获取日内分时图数据（含5档盘口）
router.get('/intraday/:code', async (req, res, next) => {
  try {
    const code = req.params.code;
    const prefix = code.startsWith('6') || code.startsWith('9') ? 'sh' : 'sz';
    const url = `https://web.ifzq.gtimg.cn/appstock/app/minute/query?code=${prefix}${code}`;
    
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10000);
    const resp = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    
    const json: any = await resp.json();
    const stockData = json?.data?.[`${prefix}${code}`];
    if (!stockData) {
      return res.json({ success: false, message: '未找到分时数据' });
    }

    const qt = stockData.qt?.[`${prefix}${code}`] || [];
    const minuteData = stockData.data?.data || [];
    const date = stockData.data?.date || '';
    const preClose = Number(qt[4]) || 0;

    // 解析分钟数据: "HHMM price volume amount"
    const points = minuteData.map((row: string) => {
      const parts = row.split(' ');
      const time = parts[0] || '';
      const price = Number(parts[1]) || 0;
      const volume = Number(parts[2]) || 0;
      const amount = Number(parts[3]) || 0;
      return {
        time: `${time.slice(0, 2)}:${time.slice(2, 4)}`,
        price,
        volume,
        amount,
        changePercent: preClose > 0 ? ((price - preClose) / preClose * 100) : 0,
      };
    });

    const qtInfo = qt.length >= 35 ? {
      name: qt[1] || '',
      price: Number(qt[3]) || 0,
      preClose: Number(qt[4]) || 0,
      changePercent: Number(qt[32]) || 0,
      high: Number(qt[33]) || 0,
      low: Number(qt[34]) || 0,
    } : null;

    // 获取5档盘口数据（从qt.gtimg.cn）
    let depth: any = null;
    try {
      const tencentCode = `${prefix}${code}`;
      const depthResp = await fetch(`https://qt.gtimg.cn/q=${tencentCode}`);
      const depthBuffer = await depthResp.arrayBuffer();
      const depthText = new TextDecoder('gbk').decode(depthBuffer);
      const depthMatch = depthText.match(/v_(\w+)="(.+)"/);
      if (depthMatch) {
        const fields = depthMatch[2].split('~');
        if (fields.length >= 29) {
          depth = {
            buy: [
              { price: Number(fields[9]) || 0, volume: Number(fields[10]) || 0 },
              { price: Number(fields[11]) || 0, volume: Number(fields[12]) || 0 },
              { price: Number(fields[13]) || 0, volume: Number(fields[14]) || 0 },
              { price: Number(fields[15]) || 0, volume: Number(fields[16]) || 0 },
              { price: Number(fields[17]) || 0, volume: Number(fields[18]) || 0 },
            ],
            sell: [
              { price: Number(fields[19]) || 0, volume: Number(fields[20]) || 0 },
              { price: Number(fields[21]) || 0, volume: Number(fields[22]) || 0 },
              { price: Number(fields[23]) || 0, volume: Number(fields[24]) || 0 },
              { price: Number(fields[25]) || 0, volume: Number(fields[26]) || 0 },
              { price: Number(fields[27]) || 0, volume: Number(fields[28]) || 0 },
            ],
          };
        }
      }
    } catch (e) {
      console.warn(`[Intraday] Depth fetch failed for ${code}:`, e);
    }

    res.json({ success: true, data: { date, qtInfo, points, depth } });
  } catch (error) {
    next(error);
  }
});

export const stockRoutes = router;
