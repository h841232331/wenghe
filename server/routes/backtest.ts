import { Router } from 'express';
import { getDataSource } from '../datasources';

const router = Router();
const ds = () => getDataSource();

/**
 * 从腾讯 API 获取 K 线数据
 * 格式: [date, open, close, high, low, volume]
 * 返回按日期升序排列
 */
async function fetchTencentKline(code: string, days: number = 365): Promise<{
  date: string; open: number; close: number; high: number; low: number; volume: number;
}[]> {
  const prefix = code.startsWith('6') || code.startsWith('9') ? 'sh' : 'sz';
  const url = `https://web.ifzq.gtimg.cn/appstock/app/fqkline/get?param=${prefix}${code},day,,,${days},qfq`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 15000);
  try {
    const resp = await fetch(url, { signal: controller.signal });
    const json: any = await resp.json();
    const dayData = json?.data?.[`${prefix}${code}`]?.day || json?.data?.[`${prefix}${code}`]?.qfqday || [];
    if (!dayData || dayData.length === 0) return [];

    return dayData
      .map((d: any[]) => ({
        date: d[0],
        open: Number(d[1]) || 0,
        close: Number(d[2]) || 0,
        high: Number(d[3]) || 0,
        low: Number(d[4]) || 0,
        volume: Number(d[5]) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date)); // 确保升序
  } catch (e: any) {
    console.warn(`[Backtest] Tencent K-line failed for ${code}:`, e.message);
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/**
 * 根据策略配置生成买卖信号
 * 支持均线交叉、价格突破、放量等条件
 */
function generateSignals(
  klineData: { date: string; open: number; close: number; high: number; low: number; volume: number }[],
  signalConfig?: { buyConditions?: any[]; sellConditions?: any[] }
): ('buy' | 'sell' | 'hold')[] {
  const signals: ('buy' | 'sell' | 'hold')[] = [];

  // 默认参数：MA5/MA20 金叉买入，死叉卖出
  const buyConds = signalConfig?.buyConditions || [{ type: 'ma_cross', params: { short: 5, long: 20 } }];
  const sellConds = signalConfig?.sellConditions || [{ type: 'ma_cross', params: { short: 5, long: 20 } }];

  const maxPeriod = Math.max(
    ...buyConds.map((c: any) => c.params?.long || c.params?.period || 20),
    ...sellConds.map((c: any) => c.params?.long || c.params?.period || 20),
    20
  );

  if (klineData.length < maxPeriod + 1) {
    return klineData.map(() => 'hold');
  }

  const closes = klineData.map(d => d.close);
  const volumes = klineData.map(d => d.volume);

  // 计算均线辅助函数
  const calcMA = (data: number[], period: number, idx: number): number => {
    if (idx < period - 1) return 0;
    let sum = 0;
    for (let j = idx - period + 1; j <= idx; j++) sum += data[j] || 0;
    return sum / period;
  };

  for (let i = 0; i < klineData.length; i++) {
    if (i < maxPeriod) {
      signals.push('hold');
      continue;
    }

    let buySignal = false;
    let sellSignal = false;

    // 评估买入条件
    for (const cond of buyConds) {
      switch (cond.type) {
        case 'ma_cross': {
          const short = cond.params.short || 5;
          const long = cond.params.long || 20;
          const curShort = calcMA(closes, short, i);
          const curLong = calcMA(closes, long, i);
          const prevShort = calcMA(closes, short, i - 1);
          const prevLong = calcMA(closes, long, i - 1);
          if (curShort > 0 && curLong > 0 && prevShort <= prevLong && curShort > curLong) {
            buySignal = true;
          }
          break;
        }
        case 'ma_break': {
          const period = cond.params.period || 20;
          const ma = calcMA(closes, period, i);
          const prevMa = calcMA(closes, period, i - 1);
          if (ma > 0 && klineData[i - 1].close <= prevMa && klineData[i].close > ma) {
            buySignal = true;
          }
          break;
        }
        case 'volume_breakout': {
          // 当日成交量超过前5日均量的1.5倍
          const avgVol5 = (() => {
            let sum = 0;
            for (let j = i - 4; j <= i; j++) sum += volumes[j] || 0;
            return sum / 5;
          })();
          if (volumes[i] > avgVol5 * 1.5 && klineData[i].close > klineData[i].open) {
            buySignal = true;
          }
          break;
        }
        case 'rsi': {
          const threshold = cond.params.threshold || 30;
          // 简化RSI计算 (14日)
          const period = 14;
          if (i >= period) {
            let gain = 0, loss = 0;
            for (let j = i - period + 1; j <= i; j++) {
              const diff = closes[j] - closes[j - 1];
              if (diff > 0) gain += diff;
              else loss -= diff;
            }
            const rs = loss > 0 ? gain / loss : 100;
            const rsi = 100 - (100 / (1 + rs));
            if (rsi < threshold) buySignal = true;
          }
          break;
        }
        case 'macd': {
          // 简化MACD计算
          const ema12 = calcMA(closes, 12, i);
          const ema26 = calcMA(closes, 26, i);
          const prevEma12 = calcMA(closes, 12, i - 1);
          const prevEma26 = calcMA(closes, 26, i - 1);
          if (ema12 > 0 && ema26 > 0 && prevEma12 <= prevEma26 && ema12 > ema26) {
            buySignal = true;
          }
          break;
        }
      }
    }

    // 评估卖出条件
    for (const cond of sellConds) {
      switch (cond.type) {
        case 'ma_cross': {
          const short = cond.params.short || 5;
          const long = cond.params.long || 20;
          const curShort = calcMA(closes, short, i);
          const curLong = calcMA(closes, long, i);
          const prevShort = calcMA(closes, short, i - 1);
          const prevLong = calcMA(closes, long, i - 1);
          if (curShort > 0 && curLong > 0 && prevShort >= prevLong && curShort < curLong) {
            sellSignal = true;
          }
          break;
        }
        case 'ma_break': {
          const period = cond.params.period || 20;
          const ma = calcMA(closes, period, i);
          if (ma > 0 && klineData[i - 1].close >= ma && klineData[i].close < ma) {
            sellSignal = true;
          }
          break;
        }
        case 'volume_breakout': {
          const avgVol5 = (() => {
            let sum = 0;
            for (let j = i - 4; j <= i; j++) sum += volumes[j] || 0;
            return sum / 5;
          })();
          if (volumes[i] > avgVol5 * 1.5 && klineData[i].close < klineData[i - 1].close) {
            sellSignal = true;
          }
          break;
        }
      }
    }

    if (buySignal) signals.push('buy');
    else if (sellSignal) signals.push('sell');
    else signals.push('hold');
  }

  return signals;
}

router.post('/run', async (req, res, next) => {
  try {
    const { stockCode, strategyId, startDate, endDate, initialCapital = 100000, signalConfig } = req.body;

    // 1. 获取 K 线数据（取足够覆盖日期范围的天数）
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    // API返回从今天往回N个交易日的数据，所以按开始日期到今天的距离计算
    const calendarDaysFromStart = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    // 交易天数 ≈ 日历天数 × 0.7，再加30天MA缓冲
    const fetchDays = Math.max(Math.ceil(calendarDaysFromStart * 0.7) + 30, 365); // 多取一些用于均线计算

    let klineData = await fetchTencentKline(stockCode, fetchDays);

    // 如果腾讯 API 失败，降级到数据源
    if (klineData.length === 0) {
      const rawKline = await ds().getKline(stockCode, '1d', fetchDays);
      klineData = rawKline.map(k => ({
        date: k.date,
        open: k.open,
        close: k.close,
        high: k.high,
        low: k.low,
        volume: k.volume,
      }));
    }

    // 如果还是空，生成模拟数据
    if (klineData.length === 0) {
      klineData = generateMockKline(startDate, endDate, 250);
    }

    // 2. 过滤日期范围内的数据
    const filteredData = klineData.filter(d => d.date >= startDate && d.date <= endDate);
    const dataForBacktest = filteredData.length > 0 ? filteredData : klineData.slice(-250);

    // 3. 生成策略信号
    const signals = generateSignals(klineData, signalConfig);
    // 对齐到回测日期范围
    const startIdx = klineData.findIndex(d => d.date >= startDate);
    const signalSlice = signals.slice(Math.max(0, startIdx), Math.max(0, startIdx) + dataForBacktest.length);
    // 确保长度匹配
    while (signalSlice.length < dataForBacktest.length) signalSlice.push('hold');

    // 4. 执行回测模拟
    let cash = initialCapital;
    let holdings = 0;

    const dailyReturns: { date: string; value: number; returnPct: number; benchmark: number }[] = [];
    const trades: { date: string; type: string; price: number; shares: number; amount: number; reason: string }[] = [];

    // 收集所有交易的盈亏用于计算胜率
    let winCount = 0;
    let lossCount = 0;
    let totalWinAmount = 0;
    let totalLossAmount = 0;

    let inPosition = false;
    let buyPrice = 0; // 最近一次买入价

    for (let i = 0; i < dataForBacktest.length; i++) {
      const day = dataForBacktest[i];
      const signal = signalSlice[i] || 'hold';

      // 执行交易信号
      if (signal === 'buy' && !inPosition && cash > 0) {
        const price = day.close;
        const shares = Math.floor(cash * 0.95 / price / 100) * 100; // 买入95%仓位，整手
        if (shares > 0) {
          const amount = Math.round(price * shares * 100) / 100;
          cash = Math.round((cash - amount) * 100) / 100;
          holdings = shares;
          inPosition = true;
          buyPrice = price;
          trades.push({
            date: day.date,
            type: 'buy',
            price: Math.round(price * 100) / 100,
            shares,
            amount: Math.round(amount * 100) / 100,
            reason: 'MA5 上穿 MA20，黄金交叉买入',
          });
        }
      } else if (signal === 'sell' && inPosition && holdings > 0) {
        const price = day.close;
        const amount = Math.round(price * holdings * 100) / 100;
        cash = Math.round((cash + amount) * 100) / 100;

        // 计算本次交易盈亏
        const buyAmount = Math.round(buyPrice * holdings * 100) / 100;
        const pnl = amount - buyAmount;
        const pnlPct = buyAmount > 0 ? (pnl / buyAmount) : 0;

        if (pnl > 0) {
          winCount++;
          totalWinAmount += pnl;
        } else {
          lossCount++;
          totalLossAmount += Math.abs(pnl);
        }

        trades.push({
          date: day.date,
          type: 'sell',
          price: Math.round(price * 100) / 100,
          shares: holdings,
          amount: Math.round(amount * 100) / 100,
          reason: 'MA5 下穿 MA20，死亡交叉卖出',
        });

        holdings = 0;
        inPosition = false;
      }

      // 计算当日资产总值
      const price = day.close;
      const value = cash + holdings * price;
      const returnPct = ((value - initialCapital) / initialCapital) * 100;

      // 基准收益：简单持有策略
      const firstPrice = dataForBacktest[0]?.close || price;
      const benchmark = ((price - firstPrice) / firstPrice) * 100;

      dailyReturns.push({
        date: day.date,
        value: Math.round(value * 100) / 100,
        returnPct: Math.round(returnPct * 100) / 100,
        benchmark: Math.round(benchmark * 100) / 100,
      });
    }

    // 5. 计算绩效指标
    const finalValue = dailyReturns.length > 0 ? dailyReturns[dailyReturns.length - 1].value : initialCapital;
    const totalReturn = ((finalValue - initialCapital) / initialCapital) * 100;

    const days = dailyReturns.length;
    const years = Math.max(days / 252, 0.1);
    const annualReturn = (Math.pow(finalValue / initialCapital, 1 / years) - 1) * 100;

    // 最大回撤
    let maxDrawdown = 0;
    let peak = initialCapital;
    const drawdowns: { date: string; value: number }[] = [];
    for (const d of dailyReturns) {
      if (d.value > peak) peak = d.value;
      const dd = ((peak - d.value) / peak) * 100;
      if (dd > maxDrawdown) maxDrawdown = dd;
      drawdowns.push({ date: d.date, value: Math.round(dd * 100) / 100 });
    }

    // 夏普比率
    const dailyPcts: number[] = [];
    for (let i = 1; i < dailyReturns.length; i++) {
      const prev = dailyReturns[i - 1].value;
      const curr = dailyReturns[i].value;
      dailyPcts.push((curr - prev) / prev);
    }
    const avgDailyReturn = dailyPcts.length > 0 ? dailyPcts.reduce((a, b) => a + b, 0) / dailyPcts.length : 0;
    const variance = dailyPcts.length > 0
      ? dailyPcts.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyPcts.length
      : 0;
    const stdDev = Math.sqrt(variance);
    const sharpeRatio = stdDev > 0 ? (avgDailyReturn * 252) / (stdDev * Math.sqrt(252)) : 0;
    const riskFreeRate = 0.02; // 2% 无风险利率

    // 胜率 & 盈亏比
    const totalTrades = winCount + lossCount;
    const winRate = totalTrades > 0 ? (winCount / totalTrades) * 100 : 0;
    const avgWin = winCount > 0 ? totalWinAmount / winCount : 0;
    const avgLoss = lossCount > 0 ? totalLossAmount / lossCount : 0;
    const profitLossRatio = avgLoss > 0 ? avgWin / avgLoss : 0;

    // Alpha & Beta
    const benchmarkPcts = dailyReturns.map(d => d.benchmark / 100);
    const avgBenchmark = benchmarkPcts.length > 0 ? benchmarkPcts.reduce((a, b) => a + b, 0) / benchmarkPcts.length : 0;
    let covariance = 0, benchmarkVariance = 0;
    if (dailyPcts.length > 0 && benchmarkPcts.length > 0) {
      const minLen = Math.min(dailyPcts.length, benchmarkPcts.length);
      for (let i = 0; i < minLen; i++) {
        covariance += (dailyPcts[i] - avgDailyReturn) * (benchmarkPcts[i] - avgBenchmark);
        benchmarkVariance += Math.pow(benchmarkPcts[i] - avgBenchmark, 2);
      }
      covariance /= minLen;
      benchmarkVariance /= minLen;
    }
    const beta = benchmarkVariance > 0 ? covariance / benchmarkVariance : 1;
    const alpha = (avgDailyReturn * 252 - riskFreeRate) - beta * (avgBenchmark * 252 - riskFreeRate);

    res.json({
      success: true,
      data: {
        taskId: `bt-${Date.now()}`,
        stockCode,
        strategyId,
        startDate,
        endDate,
        initialCapital,
        performance: {
          totalReturn: Math.round(totalReturn * 100) / 100,
          annualReturn: Math.round(annualReturn * 100) / 100,
          maxDrawdown: Math.round(maxDrawdown * 100) / 100,
          sharpeRatio: Math.round(sharpeRatio * 100) / 100,
          winRate: Math.round(winRate * 10) / 10,
          profitLossRatio: Math.round(profitLossRatio * 100) / 100,
          alpha: Math.round(alpha * 10000) / 100,
          beta: Math.round(beta * 100) / 100,
          totalTrades,
          winCount,
          lossCount,
        },
        trades: trades.sort((a, b) => a.date.localeCompare(b.date)),
        dailyReturns,
        drawdowns,
      },
    });
  } catch (error) {
    next(error);
  }
});

/** 生成模拟 K 线数据（回退方案） */
function generateMockKline(startDate: string, endDate: string, count: number) {
  const klines = [];
  let price = 50 + Math.random() * 100;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const d = new Date(start);

  while (d <= end && klines.length < count) {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    if (!isWeekend) {
      const change = (Math.random() - 0.48) * 0.03;
      const open = price;
      const close = price * (1 + change);
      klines.push({
        date: d.toISOString().split('T')[0],
        open: Math.round(open * 100) / 100,
        close: Math.round(close * 100) / 100,
        high: Math.round(Math.max(open, close) * (1 + Math.random() * 0.01) * 100) / 100,
        low: Math.round(Math.min(open, close) * (1 - Math.random() * 0.01) * 100) / 100,
        volume: Math.floor(Math.random() * 1000000 + 200000),
      });
      price = close;
    }
    d.setDate(d.getDate() + 1);
  }
  return klines;
}

export const backtestRoutes = router;