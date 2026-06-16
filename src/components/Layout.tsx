import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ClipboardList,
  CalendarDays,
  Clock,
  BarChart3,
  MessageSquare,
  Bell,
} from 'lucide-react';

const navItems = [
  { path: '/dashboard', label: '仪表盘', icon: LayoutDashboard },
  { path: '/workers', label: '阿姨管理', icon: Users },
  { path: '/orders', label: '预约派单', icon: ClipboardList },
  { path: '/schedule', label: '排班日历', icon: CalendarDays },
  { path: '/time-tracking', label: '工时打卡', icon: Clock },
  { path: '/performance', label: '绩效统计', icon: BarChart3 },
  { path: '/reviews', label: '评价管理', icon: MessageSquare },
];

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-stone-50">
      <aside className="w-60 bg-white border-r border-stone-200 flex flex-col">
        <div className="h-16 flex items-center px-6 border-b border-stone-200">
          <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
            家
          </div>
          <span className="ml-3 font-bold text-lg text-stone-800">家政管理</span>
        </div>

        <nav className="flex-1 py-4 px-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname.startsWith(item.path);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center px-4 py-3 rounded-lg mb-1 transition-all duration-200 ${
                  isActive
                    ? 'bg-primary-50 text-primary-600 font-medium'
                    : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
                }`}
              >
                <Icon className="w-5 h-5 mr-3" />
                {item.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-4 border-t border-stone-200">
          <div className="flex items-center p-3 bg-stone-50 rounded-lg">
            <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center text-primary-600 font-medium">
              管
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-stone-800">管理员</p>
              <p className="text-xs text-stone-500">调度中心</p>
            </div>
          </div>
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-stone-200 flex items-center justify-between px-6">
          <h1 className="text-lg font-semibold text-stone-800">
            {navItems.find(item => location.pathname.startsWith(item.path))?.label || '首页'}
          </h1>
          <button className="relative p-2 text-stone-500 hover:text-stone-700 hover:bg-stone-100 rounded-lg transition-colors">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>
        </header>

        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
