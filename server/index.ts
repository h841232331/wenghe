import express from 'express';
import cors from 'cors';
import { config } from './config';
import { getDataSource, switchDataSource } from './datasources';
import { marketRoutes } from './routes/market';
import { stockRoutes } from './routes/stock';
import { strategyRoutes } from './routes/strategy';
import { selectionRoutes } from './routes/selection';
import { backtestRoutes } from './routes/backtest';
import { nlStrategyRoutes } from './routes/nl-strategy';

const app = express();

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    dataSource: config.dataSource,
    fallbackToMock: config.fallbackToMock,
    timestamp: new Date().toISOString(),
  });
});

// 数据源切换接口
app.get('/api/datasource', (req, res) => {
  res.json({ success: true, data: { dataSource: config.dataSource, fallbackToMock: config.fallbackToMock } });
});

app.post('/api/datasource', (req, res) => {
  const { source } = req.body;
  if (source === 'mock' || source === 'real') {
    switchDataSource(source);
    res.json({ success: true, data: { dataSource: config.dataSource } });
  } else {
    res.status(400).json({ success: false, message: '无效的数据源，可选: mock / real' });
  }
});

app.use('/api/market', marketRoutes);
app.use('/api/stock', stockRoutes);
app.use('/api/strategy', strategyRoutes);
app.use('/api/selection', selectionRoutes);
app.use('/api/backtest', backtestRoutes);
app.use('/api/nl-strategy', nlStrategyRoutes);

app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Server error:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
  });
});

app.listen(config.port, () => {
  console.log(`
========================================
  wenghe量化选股平台 - 后端服务
  端口: ${config.port}
  数据源: ${config.dataSource}
  环境: ${config.nodeEnv}
========================================
  API健康检查: http://localhost:${config.port}/api/health
========================================
  `);
});

export default app;
