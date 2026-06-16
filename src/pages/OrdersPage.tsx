import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Clock, MapPin, User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import type { Order, Worker } from '../../shared/types';

const STATUS_FILTERS = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待派单' },
  { value: 'assigned', label: '已派单' },
  { value: 'in_progress', label: '进行中' },
  { value: 'completed', label: '已完成' },
  { value: 'cancelled', label: '已取消' },
];

export default function OrdersPage() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadData();
  }, [statusFilter, dateFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      if (dateFilter) params.date = dateFilter;

      const [ordersRes, workersRes] = await Promise.all([
        api.orders.list(params),
        api.workers.list(),
      ]);
      setOrders(ordersRes);
      setWorkers(workersRes);
    } catch (e) {
      console.error('加载订单失败', e);
    } finally {
      setLoading(false);
    }
  }

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
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const getWorkerName = (workerId?: number) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || '未指派';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatTime = (timeStr: string) => {
    return new Date(timeStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const filteredOrders = orders.filter(o =>
    o.customerName.includes(searchTerm) ||
    o.serviceAddress.includes(searchTerm) ||
    o.serviceType.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="搜索客户、地址或服务..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-stone-400" />
            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
            >
              {STATUS_FILTERS.map(f => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <input
              type="date"
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          新建预约
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-100">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              暂无订单记录
            </div>
          ) : (
            filteredOrders.map(order => (
              <div
                key={order.id}
                className="p-5 hover:bg-stone-50 transition-colors cursor-pointer"
                onClick={() => navigate(`/orders/${order.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-stone-800">
                        {order.customerName} - {order.serviceType}
                      </h3>
                      {getStatusBadge(order.status)}
                      {order.review && (
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          order.review.rating === 'positive'
                            ? 'bg-success-100 text-success-500'
                            : order.review.rating === 'negative'
                            ? 'bg-red-100 text-red-600'
                            : 'bg-stone-100 text-stone-600'
                        }`}>
                          {order.review.rating === 'positive' ? '好评' : order.review.rating === 'negative' ? '差评' : '一般'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-6 mt-3 text-sm text-stone-500">
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-2 text-stone-400" />
                        {formatDate(order.scheduledStartTime)} {formatTime(order.scheduledStartTime)} - {formatTime(order.scheduledEndTime)}
                      </div>
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-2 text-stone-400" />
                        {order.serviceAddress}
                      </div>
                      <div className="flex items-center">
                        <User className="w-4 h-4 mr-2 text-stone-400" />
                        {getWorkerName(order.workerId)}
                      </div>
                      {order.workHours !== undefined && (
                        <div className="text-primary-600 font-medium">
                          工时：{order.workHours}小时
                        </div>
                      )}
                    </div>
                    {order.notes && (
                      <p className="mt-2 text-sm text-stone-400">备注：{order.notes}</p>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-stone-400" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
