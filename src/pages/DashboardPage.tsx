import { useState, useEffect } from 'react';
import {
  ClipboardList,
  Clock,
  Users,
  AlertTriangle,
  ChevronRight,
  Play,
  CheckCircle,
  BarChart3,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Order, Worker } from '../../shared/types';
import { useNavigate } from 'react-router-dom';

export default function DashboardPage() {
  const navigate = useNavigate();
  const [todayOrders, setTodayOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [expiringInsurance, setExpiringInsurance] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [ordersRes, workersRes, insuranceRes] = await Promise.all([
        api.orders.list({ date: today }),
        api.workers.list(),
        api.insurance.expiring(30),
      ]);
      setTodayOrders(ordersRes);
      setWorkers(workersRes.filter(w => w.status === 'active'));
      setExpiringInsurance(insuranceRes);
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      setLoading(false);
    }
  }

  const stats = [
    {
      label: '今日订单',
      value: todayOrders.length,
      icon: ClipboardList,
      color: 'bg-primary-50 text-primary-600',
      bgColor: 'bg-primary-500',
    },
    {
      label: '进行中',
      value: todayOrders.filter(o => o.status === 'in_progress').length,
      icon: Clock,
      color: 'bg-success-50 text-success-500',
      bgColor: 'bg-success-500',
    },
    {
      label: '待派单',
      value: todayOrders.filter(o => o.status === 'pending').length,
      icon: AlertTriangle,
      color: 'bg-warning-50 text-warning-500',
      bgColor: 'bg-warning-500',
    },
    {
      label: '在职阿姨',
      value: workers.length,
      icon: Users,
      color: 'bg-stone-100 text-stone-600',
      bgColor: 'bg-stone-500',
    },
  ];

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning-100 text-warning-600',
      assigned: 'bg-primary-100 text-primary-600',
      in_progress: 'bg-success-100 text-success-500',
      completed: 'bg-stone-100 text-stone-600',
      cancelled: 'bg-stone-100 text-stone-400',
    };
    const labels: Record<string, string> = {
      pending: '待派单',
      assigned: '已派单',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    return (
      <span className={`px-2 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getWorkerName = (workerId?: number) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || '未指派';
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={index}
              className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-stone-500">{stat.label}</p>
                  <p className="text-2xl font-bold text-stone-800 mt-1">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        <div className="col-span-2 bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">今日订单</h2>
            <button
              onClick={() => navigate('/orders')}
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
            >
              查看全部
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>
          <div className="p-5 max-h-96 overflow-y-auto">
            {todayOrders.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>今日暂无订单</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todayOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center p-4 bg-stone-50 rounded-lg hover:bg-stone-100 transition-colors cursor-pointer"
                    onClick={() => navigate('/orders')}
                  >
                    <div className="w-2 h-2 rounded-full bg-primary-500 mr-4"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-stone-800">
                          {order.customerName} - {order.serviceType}
                        </span>
                        {getStatusBadge(order.status)}
                      </div>
                      <div className="flex items-center mt-1 text-sm text-stone-500">
                        <Clock className="w-4 h-4 mr-1" />
                        <span>
                          {formatTime(order.scheduledStartTime)} - {formatTime(order.scheduledEndTime)}
                        </span>
                        <span className="mx-2">·</span>
                        <span>{order.serviceAddress}</span>
                        <span className="mx-2">·</span>
                        <span>{getWorkerName(order.workerId)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between p-5 border-b border-stone-100">
            <h2 className="font-semibold text-stone-800">保险到期提醒</h2>
            <span className="text-xs text-stone-500">30天内到期</span>
          </div>
          <div className="p-5 max-h-96 overflow-y-auto">
            {expiringInsurance.length === 0 ? (
              <div className="text-center py-12 text-stone-400">
                <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50 text-success-500" />
                <p>暂无即将到期的保险</p>
              </div>
            ) : (
              <div className="space-y-3">
                {expiringInsurance.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${
                      item.urgency === 'critical'
                        ? 'bg-red-50 border-red-200'
                        : item.urgency === 'warning'
                        ? 'bg-warning-50 border-warning-200'
                        : 'bg-stone-50 border-stone-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-stone-800">{item.name}</span>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded ${
                          item.urgency === 'critical'
                            ? 'bg-red-100 text-red-600'
                            : item.urgency === 'warning'
                            ? 'bg-warning-100 text-warning-600'
                            : 'bg-stone-100 text-stone-600'
                        }`}
                      >
                        {item.daysUntilExpiry}天后到期
                      </span>
                    </div>
                    <p className="text-sm text-stone-500 mt-1">
                      到期日期：{item.insuranceExpiryDate}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <h2 className="font-semibold text-stone-800">快捷操作</h2>
        </div>
        <div className="p-5 grid grid-cols-4 gap-4">
          <button
            onClick={() => navigate('/orders/new')}
            className="flex flex-col items-center justify-center p-6 bg-primary-50 rounded-xl hover:bg-primary-100 transition-colors group"
          >
            <div className="w-14 h-14 bg-primary-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <ClipboardList className="w-7 h-7" />
            </div>
            <span className="font-medium text-stone-800">新建预约</span>
            <span className="text-sm text-stone-500 mt-1">录入客户订单</span>
          </button>
          <button
            onClick={() => navigate('/time-tracking')}
            className="flex flex-col items-center justify-center p-6 bg-success-50 rounded-xl hover:bg-success-50 transition-colors group"
          >
            <div className="w-14 h-14 bg-success-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7" />
            </div>
            <span className="font-medium text-stone-800">工时打卡</span>
            <span className="text-sm text-stone-500 mt-1">开始/结束服务</span>
          </button>
          <button
            onClick={() => navigate('/workers/new')}
            className="flex flex-col items-center justify-center p-6 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors group"
          >
            <div className="w-14 h-14 bg-stone-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <Users className="w-7 h-7" />
            </div>
            <span className="font-medium text-stone-800">添加阿姨</span>
            <span className="text-sm text-stone-500 mt-1">录入新员工信息</span>
          </button>
          <button
            onClick={() => navigate('/performance')}
            className="flex flex-col items-center justify-center p-6 bg-warning-50 rounded-xl hover:bg-warning-50 transition-colors group"
          >
            <div className="w-14 h-14 bg-warning-500 rounded-xl flex items-center justify-center text-white mb-3 group-hover:scale-110 transition-transform">
              <BarChart3 className="w-7 h-7" />
            </div>
            <span className="font-medium text-stone-800">绩效统计</span>
            <span className="text-sm text-stone-500 mt-1">查看月度报表</span>
          </button>
        </div>
      </div>
    </div>
  );
}
