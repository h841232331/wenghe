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

export const stockRoutes = router;
