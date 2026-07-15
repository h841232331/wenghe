import React from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store';
import Sidebar from './Sidebar';

// 路由配置映射
const routeTitles: Record<string, string> = {
  '/': '仪表盘',
  '/market': '市场概览',
  '/stocks': '股票列表',
  '/stock/': '股票详情',
  '/strategy': '策略管理',
  '/selection': '智能选股',
  '/backtest': '策略回测',
  '/portfolio': '投资组合',
};

const Layout: React.FC = () => {
  const location = useLocation();
  const refreshMarketData = useAppStore((state) => state.refreshMarketData);
  const loading = useAppStore((state) => state.loading);

  // 获取当前页面标题
  const getPageTitle = () => {
    const path = location.pathname;
    // 精确匹配
    if (routeTitles[path]) {
      return routeTitles[path];
    }
    // 前缀匹配
    for (const [route, title] of Object.entries(routeTitles)) {
      if (path.startsWith(route) && route !== '/') {
        return title;
      }
    }
    return '量化交易系统';
  };

  // 刷新数据
  const handleRefresh = () => {
    refreshMarketData();
  };

  return (
    <div className="flex h-screen bg-[#1a1a2e]">
      {/* 左侧导航栏 */}
      <Sidebar />

      {/* 右侧内容区域 */}
      <div className="flex-1 flex flex-col ml-[240px]">
        {/* 顶部标题栏 */}
        <header className="h-14 bg-[#1f1f3a] border-b border-[#2a2a4a] flex items-center justify-between px-6 flex-shrink-0">
          {/* 左侧标题 */}
          <div className="flex items-center">
            <h1 className="text-lg font-semibold text-white">
              {getPageTitle()}
            </h1>
          </div>

          {/* 右侧操作区 */}
          <div className="flex items-center gap-4">
            {/* 刷新数据按钮 */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                transition-all duration-200 flex items-center gap-2
                ${loading 
                  ? 'bg-[#3a3a5a] text-gray-400 cursor-not-allowed' 
                  : 'bg-[#4f46e5] hover:bg-[#4338ca] text-white hover:shadow-lg hover:shadow-[#4f46e5]/25'
                }
              `}
            >
              <svg 
                className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
                />
              </svg>
              <span>{loading ? '刷新中...' : '刷新数据'}</span>
            </button>

            {/* 用户信息 */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#4f46e5] to-[#7c3aed] flex items-center justify-center">
                <span className="text-white text-sm font-medium">W</span>
              </div>
              <div className="text-sm">
                <div className="text-white font-medium">WengHe</div>
                <div className="text-gray-400 text-xs">管理员</div>
              </div>
            </div>
          </div>
        </header>

        {/* 主内容区域 */}
        <main className="flex-1 overflow-y-auto bg-[#f5f5f7] p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;