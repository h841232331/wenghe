import { Router } from 'express';
import { getDataSource } from '../datasources';

const router = Router();
const ds = () => getDataSource();

router.get('/overview', async (req, res, next) => {
  try {
    const data = await ds().getMarketOverview();
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/top-gainers', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await ds().getTopGainers(limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/top-losers', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await ds().getTopLosers(limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

router.get('/top-volume', async (req, res, next) => {
  try {
    const limit = Number(req.query.limit) || 10;
    const data = await ds().getTopVolume(limit);
    res.json({ success: true, data });
  } catch (error) {
    next(error);
  }
});

export const marketRoutes = router;
