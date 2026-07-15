/**
 * 真实A股数据源实现
 * 基于 a-stock-data 项目架构，直连以下免费公开 HTTP API：
 *   - 腾讯财经 API（qt.gtimg.cn）：实时行情、PE/PB/市值/换手率，不封IP
 *   - 东财 push2 API（push2.eastmoney.com）：股票列表、行情排行、个股信息
 *   - 东财 push2his API（push2his.eastmoney.com）：K线数据
 *   - 东财 datacenter API（datacenter-web.eastmoney.com）：财务指标
 *   - 新浪财经 API（hq.sinajs.cn）：行情备用源
 *
 * 参考: https://github.com/simonlin1212/a-stock-data
 */

import { DataSource, StockInfo, StockQuote, MarketOverview, KlineData, FinancialIndicators } from './index';

// ── 工具函数 ────────────────────────────────────────────────────────

/** 6位股票代码 → 东财 secid（沪市 1.，深市/创业板 0.） */
function toSecid(code: string): string {
  if (code.startsWith('6') || code.startsWith('9')) return `1.${code}`;
  return `0.${code}`;
}

/** 6位股票代码 → 腾讯前缀格式 */
function toTencentCode(code: string): string {
  if (code.startsWith('6') || code.startsWith('9')) return `sh${code}`;
  if (code.startsWith('8')) return `bj${code}`;
  return `sz${code}`;
}

/** 6位代码 → 交易所后缀（用于东财datacenter） */
function toSecucode(code: string): string {
  if (code.startsWith('6') || code.startsWith('9')) return `${code}.SH`;
  return `${code}.SZ`;
}

/** 带超时的 fetch */
async function fetchWithTimeout(url: string, options: RequestInit = {}, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** 东财请求统一 UA + Referer */
const EM_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Referer': 'https://quote.eastmoney.com/',
};

// ── 东财字段映射 ────────────────────────────────────────────────────
// 东财 clist API 字段含义:
// f2=最新价 f3=涨跌幅 f4=涨跌额 f5=成交量(手) f6=成交额 f7=振幅
// f8=换手率 f9=动态市盈率 f10=量比 f12=代码 f14=名称
// f15=最高 f16=最低 f17=今开 f18=昨收 f20=总市值 f21=流通市值 f23=市净率
// f100=所属行业
const CLIST_FIELDS = 'f2,f3,f4,f5,f6,f7,f8,f9,f10,f12,f14,f15,f16,f17,f18,f20,f21,f23,f100';

// 东财 stock/get 字段:
// f57=代码 f58=名称 f43=最新价 f44=最高 f45=最低 f46=今开 f60=昨收
// f47=成交量 f48=成交额 f50=量比 f168=换手率 f162=PE(TTM) f167=PB
// f116=总市值 f117=流通市值 f127=所属行业 f173=ROE f187=涨跌幅 f170=涨跌额
const STOCK_GET_FIELDS = 'f57,f58,f43,f44,f45,f46,f60,f47,f48,f50,f168,f162,f167,f116,f117,f127,f173,f187,f170';

// ── 实现 ────────────────────────────────────────────────────────────

/** 通过东财 clist API 获取全市场股票列表+行情 */
async function fetchClist(page: number = 1, size: number = 20, sortField: string = 'f3', sortAsc: number = 0): Promise<any[]> {
  const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=${page}&pz=${size}&po=${sortAsc}&np=1&fltt=2&invt=2&fid=${sortField}&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=${CLIST_FIELDS}`;
  const resp = await fetchWithTimeout(url, { headers: EM_HEADERS });
  const json: any = await resp.json();
  return json?.data?.diff || [];
}

/** 解析东财 clist 行为 StockQuote */
function parseClistToQuote(row: any): StockQuote {
  const price = Number(row.f2) || 0;
  const preClose = Number(row.f18) || 0;
  return {
    code: String(row.f12 || ''),
    name: String(row.f14 || ''),
    price,
    change: Number(row.f4) || 0,
    changePercent: Number(row.f3) || 0,
    volume: Number(row.f5) || 0,
    amount: Number(row.f6) || 0,
    turnover: Number(row.f8) || 0,
    high: Number(row.f15) || 0,
    low: Number(row.f16) || 0,
    open: Number(row.f17) || 0,
    preClose,
  };
}

/** 解析东财 clist 行为 StockInfo */
function parseClistToStockInfo(row: any): StockInfo {
  return {
    code: String(row.f12 || ''),
    name: String(row.f14 || ''),
    industry: String(row.f100 || '未分类'),
    market: String(row.f12 || '').startsWith('6') ? 'SH' : 'SZ',
    marketCap: Math.round((Number(row.f20) || 0) / 1e8), // 转为亿元
    pe: Number(row.f9) || 0,
    pb: Number(row.f23) || 0,
    roe: 0, // clist 不含 ROE
  };
}

/** 通过东财 stock/get 获取个股详情 */
async function fetchStockDetail(code: string): Promise<any> {
  const secid = toSecid(code);
  const url = `https://push2.eastmoney.com/api/qt/stock/get?secid=${secid}&fields=${STOCK_GET_FIELDS}`;
  const resp = await fetchWithTimeout(url, { headers: EM_HEADERS });
  const json: any = await resp.json();
  return json?.data || {};
}

/** 通过腾讯财经 API 获取实时行情（备用源，不封IP） */
async function fetchTencentQuotes(codes: string[]): Promise<StockQuote[]> {
  const tencentCodes = codes.map(toTencentCode).join(',');
  const url = `https://qt.gtimg.cn/q=${tencentCodes}`;
  const resp = await fetchWithTimeout(url, {});
  // 腾讯返回 GBK 编码的文本，需要用 TextDecoder 解码
  const buffer = await resp.arrayBuffer();
  const text = new TextDecoder('gbk').decode(buffer);

  const results: StockQuote[] = [];
  const lines = text.split(';').filter(l => l.trim());

  for (const line of lines) {
    const match = line.match(/v_(\w+)="(.+)"/);
    if (!match) continue;
    const fields = match[2].split('~');
    if (fields.length < 35) continue;

    results.push({
      code: fields[2] || '',
      name: fields[1] || '',
      price: Number(fields[3]) || 0,
      change: Number(fields[31]) || 0,
      changePercent: Number(fields[32]) || 0,
      volume: Number(fields[6]) || 0,     // 手
      amount: Number(fields[37]) || 0,     // 万元
      turnover: Number(fields[38]) || 0,   // %
      high: Number(fields[33]) || 0,
      low: Number(fields[34]) || 0,
      open: Number(fields[5]) || 0,
      preClose: Number(fields[4]) || 0,
    });
  }
  return results;
}

// ── DataSource 接口实现 ─────────────────────────────────────────────

export const realDataSource: DataSource = {
  /**
   * 获取实时行情
   * 优先用东财 push2，失败降级腾讯
   */
  async getQuotes(codes: string[]): Promise<StockQuote[]> {
    if (codes.length === 0) return [];

    // 优先用腾讯 API（可靠，不封IP，数据准确）
    try {
      return await fetchTencentQuotes(codes);
    } catch (e) {
      console.error('[RealDataSource] 腾讯行情获取失败:', e);
    }

    // 降级：东财 stock/get（5只以内）
    try {
      if (codes.length <= 5) {
        const results = await Promise.all(codes.map(async code => {
          try {
            const detail = await fetchStockDetail(code);
            return {
              code: String(detail.f57 || code),
              name: String(detail.f58 || ''),
              price: (Number(detail.f43) || 0) / 100,
              change: Number(detail.f170) || 0,
              changePercent: Number(detail.f187) || 0,
              volume: Number(detail.f47) || 0,
              amount: Number(detail.f48) || 0,
              turnover: Number(detail.f168) || 0,
              high: (Number(detail.f44) || 0) / 100,
              low: (Number(detail.f45) || 0) / 100,
              open: (Number(detail.f46) || 0) / 100,
              preClose: (Number(detail.f60) || 0) / 100,
            } as StockQuote;
          } catch {
            return null;
          }
        }));
        const valid = results.filter(Boolean) as StockQuote[];
        if (valid.length > 0) return valid;
      }
    } catch (e2) {
      console.error('[RealDataSource] 东财行情也失败:', e2);
    }

    return [];
  },

  /**
   * 获取股票基本信息（行业、市值、PE、PB等）
   */
  async getStockInfo(codes: string[]): Promise<StockInfo[]> {
    if (codes.length === 0) return [];

    try {
      const results = await Promise.all(codes.map(async code => {
        const detail = await fetchStockDetail(code);
        return {
          code: String(detail.f57 || code),
          name: String(detail.f58 || ''),
          industry: String(detail.f127 || '未分类'),
          market: code.startsWith('6') ? 'SH' : 'SZ',
          marketCap: Math.round((Number(detail.f116) || 0) / 1e8),
          pe: Number(detail.f162) || 0,
          pb: Number(detail.f167) || 0,
          roe: Number(detail.f173) || 0,
        } as StockInfo;
      }));
      return results;
    } catch (e) {
      console.error('[RealDataSource] getStockInfo failed:', e);
      return [];
    }
  },

  /**
   * 搜索股票
   */
  async searchStocks(keyword: string): Promise<StockInfo[]> {
    try {
      if (!keyword) {
        // 无关键字时返回热门股票（按成交额降序取前20）
        const rows = await fetchClist(1, 20, 'f6', 0);
        return rows.map(parseClistToStockInfo);
      }

      // 用东财搜索接口
      const url = `https://searchapi.eastmoney.com/api/suggest/get?input=${encodeURIComponent(keyword)}&type=14&token=D43BF722C8E33BDC906FB84D85E326E8&count=20`;
      const resp = await fetchWithTimeout(url, { headers: EM_HEADERS });
      const json: any = await resp.json();
      const suggestions = json?.QuotationCodeTable?.Data || [];

      // 获取这些股票的详细信息
      const codes: string[] = suggestions.map((s: any) => s.Code).filter((c: string) => c && /^\d{6}$/.test(c));
      if (codes.length === 0) return [];

      // 用 stock/get 批量获取
      const results = await Promise.all(codes.slice(0, 20).map(async code => {
        try {
          const detail = await fetchStockDetail(code);
          return {
            code: String(detail.f57 || code),
            name: String(detail.f58 || ''),
            industry: String(detail.f127 || '未分类'),
            market: code.startsWith('6') ? 'SH' : 'SZ',
            marketCap: Math.round((Number(detail.f116) || 0) / 1e8),
            pe: Number(detail.f162) || 0,
            pb: Number(detail.f167) || 0,
            roe: Number(detail.f173) || 0,
          } as StockInfo;
        } catch {
          return null;
        }
      }));

      return results.filter(Boolean) as StockInfo[];
    } catch (e) {
      console.error('[RealDataSource] searchStocks failed:', e);
      // 降级：从 clist 中过滤
      try {
        const rows = await fetchClist(1, 100, 'f6', 0);
        const filtered = rows.filter(r =>
          String(r.f12).includes(keyword) || String(r.f14).includes(keyword)
        );
        return filtered.slice(0, 20).map(parseClistToStockInfo);
      } catch {
        return [];
      }
    }
  },

  /**
   * 获取市场概览
   * 指数数据优先用腾讯 API（更可靠，不封IP），涨跌统计用东财
   */
  async getMarketOverview(): Promise<MarketOverview> {
    let shIndex = 0, shChange = 0, shChangePercent = 0;
    let szIndex = 0, szChange = 0, szChangePercent = 0;
    let totalStocks = 0, upCount = 0, downCount = 0, flatCount = 0;
    let totalVolume = 0, totalAmount = 0;

    // 1. 用腾讯 API 获取指数数据（最可靠，不封IP）
    try {
      const tencentCodes = ['sh000001', 'sz399001'];
      const resp = await fetchWithTimeout(`https://qt.gtimg.cn/q=${tencentCodes.join(',')}`, {});
      const buffer = await resp.arrayBuffer();
      const text = new TextDecoder('gbk').decode(buffer);
      const lines = text.split(';').filter(l => l.trim());

      for (const line of lines) {
        const match = line.match(/v_(\w+)="(.+)"/);
        if (!match) continue;
        const fields = match[2].split('~');
        if (fields.length < 35) continue;

        // 腾讯字段: 0=未知, 1=名称, 2=代码, 3=当前价, 4=昨收, 5=今开,
        // 31=涨跌额, 32=涨跌幅(%), 33=最高, 34=最低
        const code = fields[2] || '';
        const price = Number(fields[3]) || 0;
        const changeVal = Number(fields[31]) || 0;
        const changePct = Number(fields[32]) || 0;

        if (code === '000001') {
          shIndex = price;
          shChange = changeVal;
          shChangePercent = changePct;
        } else if (code === '399001') {
          szIndex = price;
          szChange = changeVal;
          szChangePercent = changePct;
        }
      }
    } catch (e) {
      console.warn('[RealDataSource] 腾讯指数获取失败，降级到东财:', e);
    }

    // 2. 用东财 API 获取全市场涨跌统计
    try {
      const url = `https://push2.eastmoney.com/api/qt/clist/get?pn=1&pz=6000&po=1&np=1&fltt=2&invt=2&fid=f3&fs=m:0+t:6,m:0+t:80,m:1+t:2,m:1+t:23,m:0+t:81+s:2048&fields=f2,f3,f4,f5,f6,f12,f14`;
      const resp = await fetchWithTimeout(url, { headers: EM_HEADERS });
      const json: any = await resp.json();
      const stocks = json?.data?.diff || [];

      totalStocks = stocks.length;
      for (const s of stocks) {
        const pct = Number(s.f3) || 0;
        if (pct > 0) upCount++;
        else if (pct < 0) downCount++;
        else flatCount++;
        totalVolume += Number(s.f5) || 0;
        totalAmount += Number(s.f6) || 0;
      }
    } catch (e) {
      console.warn('[RealDataSource] 东财涨跌统计失败:', e);
    }

    // 3. 如果腾讯没拿到指数，用东财补充
    if (shIndex === 0 || szIndex === 0) {
      try {
        const shResp = await fetchWithTimeout(
          `https://push2.eastmoney.com/api/qt/stock/get?secid=1.000001&fields=f43,f170,f169`,
          { headers: EM_HEADERS }
        );
        const shJson: any = await shResp.json();
        if (shJson?.data) {
          // 东财 f43 返回厘为单位（396528 表示 3965.28），需除以 100
          shIndex = shIndex || Number(shJson.data.f43) / 100 || 0;
          shChange = shChange || Number(shJson.data.f170) || 0;
          shChangePercent = shChangePercent || Number(shJson.data.f169) || 0;
        }

        const szResp = await fetchWithTimeout(
          `https://push2.eastmoney.com/api/qt/stock/get?secid=0.399001&fields=f43,f170,f169`,
          { headers: EM_HEADERS }
        );
        const szJson: any = await szResp.json();
        if (szJson?.data) {
          szIndex = szIndex || Number(szJson.data.f43) / 100 || 0;
          szChange = szChange || Number(szJson.data.f170) || 0;
          szChangePercent = szChangePercent || Number(szJson.data.f169) || 0;
        }
      } catch (e) {
        console.warn('[RealDataSource] 东财指数补充也失败:', e);
      }
    }

    return {
      totalStocks: totalStocks || 5234,
      upCount, downCount, flatCount,
      totalVolume,
      totalAmount: Math.round(totalAmount / 1e4),
      shIndex,
      shChange,
      shChangePercent,
      szIndex,
      szChange,
      szChangePercent,
    };
  },

  /**
   * 涨幅榜
   */
  async getTopGainers(limit: number = 10): Promise<StockQuote[]> {
    try {
      const rows = await fetchClist(1, limit, 'f3', 0); // f3=涨跌幅 降序
      return rows.map(parseClistToQuote);
    } catch (e) {
      console.error('[RealDataSource] getTopGainers failed:', e);
      return [];
    }
  },

  /**
   * 跌幅榜
   */
  async getTopLosers(limit: number = 10): Promise<StockQuote[]> {
    try {
      const rows = await fetchClist(1, limit, 'f3', 1); // f3=涨跌幅 升序
      return rows.map(parseClistToQuote);
    } catch (e) {
      console.error('[RealDataSource] getTopLosers failed:', e);
      return [];
    }
  },

  /**
   * 成交额榜
   */
  async getTopVolume(limit: number = 10): Promise<StockQuote[]> {
    try {
      const rows = await fetchClist(1, limit, 'f6', 0); // f6=成交额 降序
      return rows.map(parseClistToQuote);
    } catch (e) {
      console.error('[RealDataSource] getTopVolume failed:', e);
      return [];
    }
  },

  /**
   * K线数据
   * 东财 push2his kline API
   * klt: 101=日K 102=周K 103=月K 5=15分 6=30分 7=60分
   * fqt: 0=不复权 1=前复权 2=后复权
   */
  async getKline(code: string, frequency: string = '1d', count: number = 100): Promise<KlineData[]> {
    try {
      const secid = toSecid(code);

      // 频率映射
      let klt = 101; // 默认日K
      switch (frequency) {
        case '1d': case 'day': klt = 101; break;
        case '1w': case 'week': klt = 102; break;
        case '1M': case 'month': klt = 103; break;
        case '15m': klt = 5; break;
        case '30m': klt = 6; break;
        case '60m': case '1h': klt = 7; break;
        case '5m': klt = 0; break;
      }

      const url = `https://push2his.eastmoney.com/api/qt/stock/kline/get?secid=${secid}&klt=${klt}&fqt=1&lmt=${count}&end=20500101&iscca=1&fields1=f1,f2,f3,f4,f5,f6&fields2=f51,f52,f53,f54,f55,f56,f57,f58,f59,f60,f61`;
      const resp = await fetchWithTimeout(url, { headers: EM_HEADERS });
      const json: any = await resp.json();
      const klines = json?.data?.klines || [];

      // 东财返回格式: "2024-01-15,100.5,101.2,102.0,99.8,123456,7890000,..."
      return klines.map((line: string) => {
        const parts = line.split(',');
        return {
          date: parts[0],
          open: Number(parts[1]) || 0,
          close: Number(parts[2]) || 0,
          high: Number(parts[3]) || 0,
          low: Number(parts[4]) || 0,
          volume: Number(parts[5]) || 0,
        } as KlineData;
      });
    } catch (e) {
      console.error('[RealDataSource] getKline failed:', e);
      return [];
    }
  },

  /**
   * 财务指标
   * 东财 datacenter API
   */
  async getFinancialIndicators(code: string): Promise<FinancialIndicators> {
    try {
      const secucode = toSecucode(code);
      const url = `https://datacenter-web.eastmoney.com/api/data/v1/get?reportName=RPT_LICO_FN_CPD&columns=ALL&filter=(SECUCODE="${secucode}")&pageNumber=1&pageSize=1&sortColumns=REPORTDATE&sortTypes=-1&source=WEB&client=WEB`;
      const resp = await fetchWithTimeout(url, { headers: EM_HEADERS });
      const json: any = await resp.json();
      const item = json?.result?.data?.[0];

      if (!item) {
        // 降级：用 stock/get 获取基本指标
        const detail = await fetchStockDetail(code);
        return {
          pe_ttm: Number(detail.f162) || 0,
          pb: Number(detail.f167) || 0,
          roe: Number(detail.f173) || 0,
          revenue_growth: 0,
          profit_growth: 0,
          gross_margin: 0,
          debt_ratio: 0,
          cash_flow_per_share: 0,
        };
      }

      return {
        pe_ttm: Number(item.PE_TTM) || 0,
        pb: Number(item.PB) || 0,
        roe: Number(item.ROE_DILUTED) || Number(item.ROE) || 0,
        revenue_growth: Number(item.TOTAL_OPERATE_INCOME_YOY) || 0,
        profit_growth: Number(item.PARENT_NETPROFIT_YOY) || 0,
        gross_margin: Number(item.GROSS_PROFIT_RATIO) || 0,
        debt_ratio: Number(item.DEBT_ASSET_RATIO) || 0,
        cash_flow_per_share: Number(item.OPERATE_CASH_FLOW_PS) || 0,
      };
    } catch (e) {
      console.error('[RealDataSource] getFinancialIndicators failed:', e);
      // 降级到 stock/get
      try {
        const detail = await fetchStockDetail(code);
        return {
          pe_ttm: Number(detail.f162) || 0,
          pb: Number(detail.f167) || 0,
          roe: Number(detail.f173) || 0,
          revenue_growth: 0,
          profit_growth: 0,
          gross_margin: 0,
          debt_ratio: 0,
          cash_flow_per_share: 0,
        };
      } catch {
        return {
          pe_ttm: 0, pb: 0, roe: 0,
          revenue_growth: 0, profit_growth: 0,
          gross_margin: 0, debt_ratio: 0, cash_flow_per_share: 0,
        };
      }
    }
  },

  /**
   * 获取行业列表
   */
  async getIndustries(): Promise<string[]> {
    try {
      // 用 clist 取一批股票提取行业字段
      const rows = await fetchClist(1, 200, 'f6', 0);
      const industries = new Set<string>();
      for (const r of rows) {
        if (r.f100) industries.add(String(r.f100));
      }
      return Array.from(industries).sort();
    } catch (e) {
      console.error('[RealDataSource] getIndustries failed:', e);
      return [];
    }
  },
};
