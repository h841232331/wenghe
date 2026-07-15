import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Target,
  LineChart,
  Settings,
} from 'lucide-react';

const navItems = [
  { path: '/', label: '数据概览', icon: LayoutDashboard },
  { path: '/stock-selection', label: '选股中心', icon: Target },
  { path: '/backtest', label: '回测分析', icon: LineChart },
  { path: '/strategy', label: '策略管理', icon: Settings },
];

const Sidebar = () => {
  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-[#1a237e] flex flex-col text-white">
      {/* 品牌区域 */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center">
            <span className="text-xl font-bold text-[#1a237e]">W</span>
          </div>
          <div>
            <h1 className="text-lg font-bold text-white">wenghe量化</h1>
            <p className="text-xs text-gray-300">智能选股平台</p>
          </div>
        </div>
      </div>

      {/* 导航菜单 */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-white/10 text-[#ffc107] font-medium shadow-lg'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white hover:-translate-y-0.5'
                    }`
                  }
                >
                  <Icon className="w-5 h-5" />
                  <span>{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-gray-400 text-center">
          wenghe量化选股平台
        </p>
        <p className="text-xs text-gray-500 text-center mt-1">
          v1.0.0
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;