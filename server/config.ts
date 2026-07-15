export const config = {
  port: Number(process.env.PORT) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  // 默认使用真实数据源（腾讯财经/东财 HTTP API），可通过环境变量切换回 mock
  dataSource: (process.env.DATA_SOURCE as 'mock' | 'real') || 'real',
  // 数据源失败时自动降级到 mock 数据
  fallbackToMock: process.env.FALLBACK_TO_MOCK !== 'false',
};
