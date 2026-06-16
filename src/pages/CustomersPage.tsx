import { useState, useEffect } from 'react';
import { Users, Phone, MapPin, Calendar, Search, Plus, ChevronDown, ChevronUp, Star, ThumbsUp, ThumbsDown, Eye, Bell, BellRing, Check, SkipForward } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import { api } from '../lib/api';
import type { Customer, Order, CallbackReminder } from '../../shared/types';

const STATUS_LABELS: Record<string, string> = {
  pending: '待派单',
  assigned: '已派单',
  in_progress: '进行中',
  completed: '已完成',
  cancelled: '已取消',
};

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-warning-100 text-warning-600',
  assigned: 'bg-primary-100 text-primary-600',
  in_progress: 'bg-success-100 text-success-500',
  completed: 'bg-stone-100 text-stone-600',
  cancelled: 'bg-stone-100 text-stone-400',
};

export default function CustomersPage() {
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [reminders, setReminders] = useState<(CallbackReminder & { customerName: string; customerPhone: string })[]>([]);
  const [showReminders, setShowReminders] = useState(true);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [customersRes, ordersRes, remindersRes] = await Promise.all([
        api.customers.list(),
        api.orders.list(),
        api.customers.pendingReminders(),
      ]);
      setCustomers(customersRes);
      setOrders(ordersRes);
      setReminders(remindersRes);
    } catch (e) {
      console.error('加载客户数据失败', e);
    } finally {
      setLoading(false);
    }
  }

  const filteredCustomers = customers.filter(c =>
    c.name.includes(searchTerm) || c.phone.includes(searchTerm)
  );

  const getRecentOrders = (phone: string) => {
    return orders
      .filter(o => o.customerPhone === phone)
      .sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())
      .slice(0, 5);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const getWorkerName = (workerId?: number) => {
    if (!workerId) return '未指派';
    const worker = orders.find(o => o.workerId === workerId);
    return worker?.workerId ? `阿姨#${worker.workerId}` : '未指派';
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              placeholder="搜索客户姓名或手机号..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-80 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 text-stone-500">
          <Users className="w-5 h-5" />
          <span className="text-sm">共 {filteredCustomers.length} 位客户</span>
        </div>
      </div>

      {reminders.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
          <button
            onClick={() => setShowReminders(!showReminders)}
            className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <BellRing className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-stone-800">待办提醒 ({reminders.length})</span>
            </div>
            {showReminders ? (
              <ChevronUp className="w-5 h-5 text-stone-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-stone-400" />
            )}
          </button>
          {showReminders && (
            <div className="border-t border-stone-100 px-4 py-3 space-y-3">
              {reminders.map(r => {
                const dueDate = new Date(r.dueDate);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const dueDateStart = new Date(dueDate);
                dueDateStart.setHours(0, 0, 0, 0);
                const isOverdue = dueDateStart < today;
                const isToday = dueDateStart.getTime() === today.getTime();

                const typeConfig: Record<string, { label: string; style: string }> = {
                  post_service_callback: { label: '服务回访', style: 'bg-blue-100 text-blue-700' },
                  insurance_renewal: { label: '保险续约', style: 'bg-amber-100 text-amber-700' },
                  inactive_customer: { label: '沉睡客户', style: 'bg-purple-100 text-purple-700' },
                  custom: { label: '自定义', style: 'bg-stone-100 text-stone-600' },
                };
                const tc = typeConfig[r.type] || typeConfig.custom;

                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between bg-stone-50 rounded-lg p-3"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <span className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${tc.style}`}>
                        {tc.label}
                      </span>
                      <div className="min-w-0">
                        <div className="text-sm font-medium text-stone-800 truncate">{r.title}</div>
                        <div className="text-xs text-stone-500">
                          <Link
                            to={`/customers/${r.customerId}`}
                            className="hover:text-primary-600 transition-colors"
                          >
                            {r.customerName}
                          </Link>
                          <span className="ml-1.5">{r.customerPhone}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0 ml-3">
                      <span className={`text-xs font-medium ${isOverdue ? 'text-red-500' : isToday ? 'text-amber-500' : 'text-stone-500'}`}>
                        {isOverdue ? '已逾期' : isToday ? '今天' : ''} {dueDate.toLocaleDateString('zh-CN', { month: '2-digit', day: '2-digit' })}
                      </span>
                      <button
                        onClick={async () => {
                          await api.customers.updateReminder(r.customerId, r.id, { status: 'done' });
                          loadData();
                        }}
                        className="flex items-center px-2 py-1 bg-success-500 text-white rounded text-xs font-medium hover:bg-success-600 transition-colors"
                      >
                        <Check className="w-3 h-3 mr-0.5" />
                        完成
                      </button>
                      <button
                        onClick={async () => {
                          await api.customers.updateReminder(r.customerId, r.id, { status: 'skipped' });
                          loadData();
                        }}
                        className="flex items-center px-2 py-1 bg-stone-200 text-stone-600 rounded text-xs font-medium hover:bg-stone-300 transition-colors"
                      >
                        <SkipForward className="w-3 h-3 mr-0.5" />
                        跳过
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {filteredCustomers.length === 0 ? (
        <div className="text-center py-16 text-stone-400">
          暂无匹配的客户
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCustomers.map(customer => {
            const isExpanded = expandedId === customer.id;
            const recentOrders = isExpanded ? getRecentOrders(customer.phone) : [];

            return (
              <div
                key={customer.id}
                className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <Link to={`/customers/${customer.id}`} className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg flex-shrink-0 hover:bg-primary-200 transition-colors">
                        {customer.name.charAt(0)}
                      </Link>
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <Link to={`/customers/${customer.id}`} className="font-semibold text-stone-800 text-lg hover:text-primary-600 transition-colors">
                            {customer.name}
                          </Link>
                          <div className="flex items-center text-stone-500 text-sm">
                            <Phone className="w-4 h-4 mr-1" />
                            {customer.phone}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {customer.addresses.map((addr, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-2.5 py-1 bg-stone-50 text-stone-600 rounded text-xs"
                            >
                              <MapPin className="w-3 h-3 mr-1 text-stone-400" />
                              {addr}
                            </span>
                          ))}
                        </div>
                        <div className="flex items-center gap-5 text-sm text-stone-500">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1.5 text-stone-400" />
                            服务 {customer.totalOrders} 次
                          </span>
                          {customer.lastServiceDate && (
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1.5 text-stone-400" />
                              最近服务：{formatDate(customer.lastServiceDate)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        to={`/customers/${customer.id}`}
                        className="flex items-center px-3 py-1.5 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors text-sm font-medium"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        详情
                      </Link>
                      <button
                        onClick={() => navigate(`/orders/new?customerPhone=${customer.phone}&customerName=${encodeURIComponent(customer.name)}&serviceAddress=${encodeURIComponent(customer.addresses[0] || '')}&returnTo=/customers/${customer.id}`)}
                        className="flex items-center px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                      >
                        <Plus className="w-4 h-4 mr-1" />
                        新建预约
                      </button>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : customer.id)}
                        className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
                      >
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-stone-100 bg-stone-50 px-5 py-4">
                    <h4 className="text-sm font-medium text-stone-600 mb-3">最近订单记录</h4>
                    {recentOrders.length === 0 ? (
                      <p className="text-sm text-stone-400 py-2">暂无订单记录</p>
                    ) : (
                      <div className="space-y-2">
                        {recentOrders.map(order => (
                          <div
                            key={order.id}
                            className="bg-white rounded-lg border border-stone-200 p-3 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-4">
                              <span className="text-sm font-medium text-stone-700">
                                {order.serviceType}
                              </span>
                              <span className="text-sm text-stone-500">
                                {formatDate(order.scheduledStartTime)}
                              </span>
                              <span className="text-sm text-stone-500">
                                阿姨：{getWorkerName(order.workerId)}
                              </span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                                {STATUS_LABELS[order.status]}
                              </span>
                              {order.review && (
                                <span className={`inline-flex items-center gap-1 text-xs ${
                                  order.review.rating === 'positive'
                                    ? 'text-success-500'
                                    : order.review.rating === 'negative'
                                    ? 'text-red-500'
                                    : 'text-stone-500'
                                }`}>
                                  {order.review.rating === 'positive' && <ThumbsUp className="w-3 h-3" />}
                                  {order.review.rating === 'negative' && <ThumbsDown className="w-3 h-3" />}
                                  {order.review.rating === 'neutral' && <Star className="w-3 h-3" />}
                                  {order.review.rating === 'positive' ? '好评' : order.review.rating === 'negative' ? '差评' : '一般'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
