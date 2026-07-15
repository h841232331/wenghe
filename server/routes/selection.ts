import { Router } from 'express';
import { getDataSource } from '../datasources';

const router = Router();
const ds = () => getDataSource();

router.post('/run', async (req, res, next) => {
  try {
    const { strategyId, filters } = req.body;
    const allStocks = await ds().searchStocks('');
    const codes = allStocks.map(s => s.code).slice(0, 20);
    const quotes = await ds().getQuotes(codes);

    const results = allStocks.slice(0, 12).map((stock, idx) => ({
      stock,
      quote: quotes[idx] || quotes[0],
      score: Math.round((60 + Math.random() * 35) * 100) / 100,
      rank: idx + 1,
    }));

    res.json({
      success: true,
      data: {
        taskId: `sel-${Date.now()}`,
        strategyId,
        stocks: results,
        totalCount: results.length,
      },
    });
  } catch (error) {
    next(error);
  }
});

export const selectionRoutes = router;