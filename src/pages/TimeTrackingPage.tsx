import { useState, useEffect } from 'react';
import { Play, Square, Clock, MapPin, User, CheckCircle, XCircle } from 'lucide-react';
import { api } from '../lib/api';
import type { Order, Worker } from '../../shared/types';

export default function TimeTrackingPage() {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [todayCompleted, setTodayCompleted] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      const [ordersRes, workersRes] = await Promise.all([
        api.orders.list({ date: today }),
        api.workers.list(),
      ]);
      
      const active = ordersRes.filter(o => 
        o.status === 'assigned' || o.status === 'in_progress'
      );
      const completed = ordersRes.filter(o => o.status === 'completed');
      
      setActiveOrders(active);
      setTodayCompleted(completed);
      setWorkers(workersRes);
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleStart(orderId: number) {
    setProcessingId(orderId);
    try {
      await api.orders.start(orderId);
      loadData();
    } catch (e: any) {
      alert(e.message || '开始服务失败');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleEnd(orderId: number) {
    setProcessingId(orderId);
    try {
      await api.orders.end(orderId);
      loadData();
    } catch (e: any) {
      alert(e.message || '结束服务失败');
    } finally {
      setProcessingId(null);
    }
  }

  const getWorkerName = (workerId?: number) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || '未指派';
  };

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '--:--';
    return new Date(timeStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const calculateDuration = (start: string, end?: string) => {
    const startTime = new Date(start).getTime();
    const endTime = end ? new Date(end).getTime() : Date.now();
    const diff = endTime - startTime;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  const totalHoursToday = todayCompleted.reduce((sum, o) => sum + (o.workHours || 0), 0);

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
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <p className="text-sm text-stone-500">待开始服务</p>
          <p className="text-3xl font-bold text-stone-800 mt-2">
            {activeOrders.filter(o => o.status === 'assigned').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <p className="text-sm text-stone-500">进行中</p>
          <p className="text-3xl font-bold text-success-500 mt-2">
            {activeOrders.filter(o => o.status === 'in_progress').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <p className="text-sm text-stone-500">今日已完成</p>
          <p className="text-3xl font-bold text-stone-800 mt-2">{todayCompleted.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <p className="text-sm text-stone-500">今日总工时</p>
          <p className="text-3xl font-bold text-primary-600 mt-2">{totalHoursToday.toFixed(1)}h</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">待打卡 / 进行中</h2>
          {activeOrders.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
              <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无进行中的订单</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeOrders.map(order => (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl border shadow-sm overflow-hidden ${
                    order.status === 'in_progress' ? 'border-success-500' : 'border-stone-200'
                  }`}
                >
                  <div className={`h-1 ${
                    order.status === 'in_progress' ? 'bg-success-500' : 'bg-primary-500'
                  }`}></div>
                  <div className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-stone-800 text-lg">
                            {order.customerName}
                          </span>
                          <span className="px-2 py-0.5 bg-primary-100 text-primary-600 rounded text-xs font-medium">
                            {order.serviceType}
                          </span>
                        </div>
                        <div className="flex items-center mt-2 text-sm text-stone-500">
                          <User className="w-4 h-4 mr-1" />
                          {getWorkerName(order.workerId)}
                        </div>
                        <div className="flex items-center mt-1 text-sm text-stone-500">
                          <MapPin className="w-4 h-4 mr-1" />
                          {order.serviceAddress}
                        </div>
                      </div>
                      {order.status === 'in_progress' && (
                        <div className="text-right">
                          <p className="text-xs text-stone-500">已服务时长</p>
                          <p className="text-xl font-bold text-success-500 font-mono">
                            {calculateDuration(order.actualStartTime!)}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-6 mt-4 pt-4 border-t border-stone-100">
                      <div className="flex-1">
                        <p className="text-xs text-stone-500">计划时间</p>
                        <p className="text-sm font-medium text-stone-700">
                          {formatTime(order.scheduledStartTime)} - {formatTime(order.scheduledEndTime)}
                        </p>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs text-stone-500">
                          {order.status === 'in_progress' ? '实际开始' : '状态'}
                        </p>
                        <p className="text-sm font-medium text-stone-700">
                          {order.status === 'in_progress'
                            ? formatTime(order.actualStartTime)
                            : '待开始'}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4">
                      {order.status === 'assigned' ? (
                        <button
                          onClick={() => handleStart(order.id)}
                          disabled={processingId === order.id}
                          className="w-full flex items-center justify-center py-3 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium disabled:opacity-50"
                        >
                          <Play className="w-5 h-5 mr-2" />
                          {processingId === order.id ? '处理中...' : '开始服务'}
                        </button>
                      ) : (
                        <button
                          onClick={() => handleEnd(order.id)}
                          disabled={processingId === order.id}
                          className="w-full flex items-center justify-center py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                        >
                          <Square className="w-5 h-5 mr-2" />
                          {processingId === order.id ? '处理中...' : '结束服务'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold text-stone-800 mb-4">今日已完成</h2>
          {todayCompleted.length === 0 ? (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-12 text-center text-stone-400">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>今日暂无完成的订单</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
              <div className="divide-y divide-stone-100 max-h-[500px] overflow-y-auto">
                {todayCompleted.map(order => (
                  <div key={order.id} className="p-4 hover:bg-stone-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-success-500" />
                        </div>
                        <div className="ml-3">
                          <p className="font-medium text-stone-800">
                            {order.customerName} - {order.serviceType}
                          </p>
                          <p className="text-sm text-stone-500">
                            {getWorkerName(order.workerId)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-primary-600">
                          {order.workHours} 小时
                        </p>
                        <p className="text-xs text-stone-400">
                          {formatTime(order.actualStartTime)} - {formatTime(order.actualEndTime)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
