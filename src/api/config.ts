/**
 * API 配置
 * 默认走后端 API（后端会对接真实A股数据源），后端不可用时自动降级到前端 mock 数据
 */
export const apiConfig = {
  baseURL: '/api',
  timeout: 30000,
  // 是否直接使用 mock 数据（跳过后端），默认 false — 先走后端
  useMockData: import.meta.env.VITE_USE_MOCK === 'true' || false,
  // 后端不可用时是否自动降级到 mock 数据
  autoFallback: true,
  // 标记后端是否已检测为不可用（一旦检测到，后续请求直接走 mock）
  backendDown: false,
};

export const setUseMockData = (useMock: boolean) => {
  apiConfig.useMockData = useMock;
  if (useMock) {
    apiConfig.backendDown = false; // 手动切换 mock 时重置
  }
};

/** 标记后端不可用，后续请求自动走 mock */
export const markBackendDown = () => {
  if (apiConfig.autoFallback && !apiConfig.useMockData) {
    console.warn('[API] 后端不可用，自动降级到 mock 数据模式');
    apiConfig.backendDown = true;
  }
};

/** 检查后端健康状态，恢复后取消降级 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const resp = await fetch(`${apiConfig.baseURL}/health`, { signal: AbortSignal.timeout(3000) });
    if (resp.ok) {
      if (apiConfig.backendDown) {
        console.log('[API] 后端已恢复，切回真实数据模式');
        apiConfig.backendDown = false;
      }
      return true;
    }
  } catch {
    // 后端不可用
  }
  // 健康检查失败 → 标记后端降级
  if (apiConfig.autoFallback && !apiConfig.useMockData) {
    apiConfig.backendDown = true;
    console.warn('[API] 后端健康检查失败，降级到 mock 数据模式');
  }
  return false;
};
