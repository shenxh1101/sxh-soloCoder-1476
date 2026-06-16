import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  Clock,
  Plus,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Star,
  FileText,
  UserCheck,
  MessageSquare,
  TrendingUp,
  RefreshCw,
  XCircle,
  AlertCircle,
  User,
  Bell,
  BellRing,
  Check,
  SkipForward,
  Filter,
} from 'lucide-react';
import { api } from '../lib/api';
import type { CustomerProfile, Order, FollowUp, FollowUpType, CallbackReminder, ReminderType, ReminderStatus } from '../../shared/types';

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

const FOLLOWUP_LABELS: Record<string, string> = {
  phone_call: '电话跟进',
  time_change: '时间变更',
  worker_feedback: '阿姨反馈',
  reassign: '改派',
  cancel: '取消',
  callback: '回访',
  other: '其他',
};

const FOLLOWUP_COLORS: Record<string, string> = {
  phone_call: 'bg-blue-400',
  time_change: 'bg-amber-400',
  worker_feedback: 'bg-purple-400',
  reassign: 'bg-primary-400',
  cancel: 'bg-red-400',
  callback: 'bg-teal-400',
  other: 'bg-stone-400',
};

const FOLLOWUP_BADGE_COLORS: Record<string, string> = {
  phone_call: 'bg-blue-100 text-blue-700',
  time_change: 'bg-amber-100 text-amber-700',
  worker_feedback: 'bg-purple-100 text-purple-700',
  reassign: 'bg-primary-100 text-primary-700',
  cancel: 'bg-red-100 text-red-700',
  callback: 'bg-teal-100 text-teal-700',
  other: 'bg-stone-100 text-stone-700',
};

const FOLLOWUP_ICONS: Record<string, typeof Phone> = {
  phone_call: Phone,
  time_change: Clock,
  worker_feedback: UserCheck,
  reassign: RefreshCw,
  cancel: XCircle,
  callback: Phone,
  other: AlertCircle,
};

const REMINDER_TYPE_LABELS: Record<string, string> = {
  post_service_callback: '服务回访',
  insurance_renewal: '保险续约',
  inactive_customer: '沉睡客户',
  custom: '自定义',
};

const REMINDER_TYPE_COLORS: Record<string, string> = {
  post_service_callback: 'bg-blue-100 text-blue-700',
  insurance_renewal: 'bg-amber-100 text-amber-700',
  inactive_customer: 'bg-purple-100 text-purple-700',
  custom: 'bg-stone-100 text-stone-700',
};

export default function CustomerDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const customerId = parseInt(id!);

  const [profile, setProfile] = useState<(CustomerProfile & { orders: Order[]; followups: FollowUp[] }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'orders' | 'followups' | 'reminders'>('orders');
  const [reminders, setReminders] = useState<CallbackReminder[]>([]);
  const [showReminderForm, setShowReminderForm] = useState(false);
  const [reminderForm, setReminderForm] = useState({
    type: 'post_service_callback' as ReminderType,
    title: '',
    description: '',
    dueDate: '',
  });
  const [orderFilterType, setOrderFilterType] = useState('');
  const [orderFilterWorker, setOrderFilterWorker] = useState('');
  const [spendingTrend, setSpendingTrend] = useState<Array<{ month: string; orders: number; hours: number; spending: number }>>([]);
  const [followupFilter, setFollowupFilter] = useState<string>('');

  useEffect(() => {
    loadProfile();
  }, [customerId]);

  async function loadProfile() {
    setLoading(true);
    try {
      const data = await api.customers.get(customerId);
      setProfile(data);
      const [remindersData, trendData] = await Promise.all([
        api.customers.reminders(customerId),
        api.customers.spendingTrend(customerId),
      ]);
      setReminders(remindersData);
      setSpendingTrend(trendData);
    } catch (e) {
      console.error('加载客户详情失败', e);
    } finally {
      setLoading(false);
    }
  }

  async function handleReminderStatusUpdate(reminderId: number, status: ReminderStatus) {
    try {
      await api.customers.updateReminder(customerId, reminderId, { status });
      const remindersData = await api.customers.reminders(customerId);
      setReminders(remindersData);
    } catch (e) {
      console.error('更新提醒状态失败', e);
    }
  }

  async function handleSaveReminder() {
    try {
      await api.customers.addReminder(customerId, {
        type: reminderForm.type,
        title: reminderForm.title,
        description: reminderForm.description || undefined,
        dueDate: reminderForm.dueDate,
      });
      setShowReminderForm(false);
      setReminderForm({
        type: 'post_service_callback',
        title: '',
        description: '',
        dueDate: '',
      });
      const remindersData = await api.customers.reminders(customerId);
      setReminders(remindersData);
    } catch (e) {
      console.error('创建提醒失败', e);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getReviewBadge = (rating: string) => {
    if (rating === 'positive') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-success-500">
          <ThumbsUp className="w-3 h-3" />
          好评
        </span>
      );
    }
    if (rating === 'negative') {
      return (
        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-500">
          <ThumbsDown className="w-3 h-3" />
          差评
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-500">
        <Minus className="w-3 h-3" />
        一般
      </span>
    );
  };

  const getUrgencyIndicator = (dueDate: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    const diff = due.getTime() - today.getTime();
    if (diff < 0) return 'overdue';
    if (diff === 0) return 'today';
    return 'upcoming';
  };

  const getUrgencyStyle = (urgency: string) => {
    if (urgency === 'overdue') return 'border-l-4 border-l-red-500 bg-red-50';
    if (urgency === 'today') return 'border-l-4 border-l-amber-500 bg-amber-50';
    return 'border-l-4 border-l-blue-500 bg-blue-50';
  };

  const getUrgencyDot = (urgency: string) => {
    if (urgency === 'overdue') return 'bg-red-500';
    if (urgency === 'today') return 'bg-amber-500';
    return 'bg-blue-500';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500">客户不存在</p>
        <button
          onClick={() => navigate('/customers')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          返回客户列表
        </button>
      </div>
    );
  }

  const sortedOrders = [...profile.orders].sort(
    (a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()
  );

  const serviceTypes = [...new Set(profile.orders.map(o => o.serviceType))];
  const workerIds = [...new Set(profile.orders.filter(o => o.workerId).map(o => o.workerId!))];
  const workerNameMap: Record<number, string> = {};
  for (const order of profile.orders) {
    if (order.workerId && !workerNameMap[order.workerId]) {
      workerNameMap[order.workerId] = `阿姨#${order.workerId}`;
    }
  }

  const filteredOrders = sortedOrders.filter(order => {
    if (orderFilterType && order.serviceType !== orderFilterType) return false;
    if (orderFilterWorker && String(order.workerId) !== orderFilterWorker) return false;
    return true;
  });

  const sortedFollowups = [...profile.followups].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const filteredFollowups = followupFilter
    ? sortedFollowups.filter(fu => fu.type === followupFilter)
    : sortedFollowups;

  const pendingReminders = reminders.filter(r => r.status === 'pending');
  const completedReminders = reminders.filter(r => r.status !== 'pending');

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/customers')}
          className="flex items-center text-stone-600 hover:text-stone-900"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回客户列表
        </button>
        <button
          onClick={() => {
            const params = new URLSearchParams({
              customerPhone: profile.phone,
              customerName: profile.name,
              serviceAddress: profile.addresses[0] || '',
              returnTo: `/customers/${profile.id}`,
            });
            navigate(`/orders/new?${params.toString()}`);
          }}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" />
          新建预约
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-xl flex-shrink-0">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-xl font-bold text-stone-800">{profile.name}</h1>
              <div className="flex items-center text-stone-500 mt-1">
                <Phone className="w-4 h-4 mr-1.5" />
                <span>{profile.phone}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 p-6">
          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">最近服务</span>
            </div>
            <p className="font-semibold text-stone-800">
              {profile.lastServiceDate ? formatDate(profile.lastServiceDate) : '无'}
            </p>
          </div>

          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Star className="w-4 h-4" />
              <span className="text-xs font-medium">常用服务</span>
            </div>
            {profile.frequentServiceType ? (
              <span className="inline-flex px-2.5 py-1 bg-primary-100 text-primary-600 rounded text-sm font-medium">
                {profile.frequentServiceType}
              </span>
            ) : (
              <span className="text-stone-400 text-sm">无</span>
            )}
          </div>

          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <User className="w-4 h-4" />
              <span className="text-xs font-medium">常用阿姨</span>
            </div>
            {profile.frequentWorkerName ? (
              <span className="inline-flex px-2.5 py-1 bg-primary-100 text-primary-600 rounded text-sm font-medium">
                {profile.frequentWorkerName}
              </span>
            ) : (
              <span className="text-stone-400 text-sm">无</span>
            )}
          </div>

          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">累计工时</span>
            </div>
            <p className="font-semibold text-stone-800">{profile.totalHours} 小时</p>
          </div>

          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-xs font-medium">累计消费</span>
            </div>
            <p className="font-semibold text-stone-800">¥{profile.totalSpending}</p>
          </div>

          <div className="bg-stone-50 rounded-lg p-4">
            <div className="flex items-center gap-2 text-stone-500 mb-2">
              <MessageSquare className="w-4 h-4" />
              <span className="text-xs font-medium">评价趋势</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1 text-sm">
                <span className="w-2 h-2 rounded-full bg-success-500"></span>
                <span className="text-success-600 font-medium">{profile.positiveReviews}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                <span className="text-red-500 font-medium">{profile.negativeReviews}</span>
              </span>
              <span className="inline-flex items-center gap-1 text-sm">
                <span className="w-2 h-2 rounded-full bg-stone-400"></span>
                <span className="text-stone-500 font-medium">{profile.neutralReviews}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      {spendingTrend.length > 0 && (
        <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">消费趋势</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-stone-200">
                  <th className="text-left py-2.5 px-3 font-medium text-stone-500 border border-stone-200 bg-stone-50">月份</th>
                  <th className="text-right py-2.5 px-3 font-medium text-stone-500 border border-stone-200 bg-stone-50">订单数</th>
                  <th className="text-right py-2.5 px-3 font-medium text-stone-500 border border-stone-200 bg-stone-50">工时</th>
                  <th className="text-right py-2.5 px-3 font-medium text-stone-500 border border-stone-200 bg-stone-50">消费金额</th>
                </tr>
              </thead>
              <tbody>
                {spendingTrend.map((row, idx) => (
                  <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-stone-50/50'}>
                    <td className="py-2.5 px-3 border border-stone-200 font-medium text-stone-700">{row.month}</td>
                    <td className="py-2.5 px-3 border border-stone-200 text-right text-stone-600">{row.orders}</td>
                    <td className="py-2.5 px-3 border border-stone-200 text-right text-stone-600">{row.hours}h</td>
                    <td className="py-2.5 px-3 border border-stone-200 text-right text-stone-700 font-medium">¥{row.spending}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">客户信息</h3>
        <div className="space-y-3">
          <div>
            <p className="text-sm text-stone-500 mb-2">服务地址</p>
            <div className="flex flex-wrap gap-2">
              {profile.addresses.length > 0 ? (
                profile.addresses.map((addr, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center px-3 py-1.5 bg-stone-50 text-stone-600 rounded-lg text-sm border border-stone-200"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-stone-400" />
                    {addr}
                  </span>
                ))
              ) : (
                <span className="text-stone-400 text-sm">暂无地址</span>
              )}
            </div>
          </div>
          <div className="flex items-center text-sm text-stone-500">
            <Calendar className="w-4 h-4 mr-1.5 text-stone-400" />
            注册时间：{formatDate(profile.createdAt)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-stone-200">
          <button
            onClick={() => setActiveTab('orders')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'orders'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            历史订单
            <span className="ml-1.5 px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded text-xs">
              {profile.orders.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('followups')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'followups'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            跟进记录
            <span className="ml-1.5 px-1.5 py-0.5 bg-stone-100 text-stone-500 rounded text-xs">
              {profile.followups.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('reminders')}
            className={`flex-1 px-6 py-3.5 text-sm font-medium transition-colors ${
              activeTab === 'reminders'
                ? 'text-primary-600 border-b-2 border-primary-500 bg-primary-50/50'
                : 'text-stone-500 hover:text-stone-700 hover:bg-stone-50'
            }`}
          >
            <Bell className="w-4 h-4 inline mr-1.5 -mt-0.5" />
            回访提醒
            {pendingReminders.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 bg-red-100 text-red-600 rounded text-xs font-semibold">
                {pendingReminders.length}
              </span>
            )}
          </button>
        </div>

        <div className="p-6">
          {activeTab === 'orders' && (
            <>
              {sortedOrders.length > 0 && (
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-stone-100">
                  <Filter className="w-4 h-4 text-stone-400" />
                  <select
                    value={orderFilterType}
                    onChange={e => setOrderFilterType(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">全部服务</option>
                    {serviceTypes.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <select
                    value={orderFilterWorker}
                    onChange={e => setOrderFilterWorker(e.target.value)}
                    className="px-3 py-1.5 text-sm border border-stone-200 rounded-lg bg-white text-stone-700 focus:outline-none focus:ring-1 focus:ring-primary-500"
                  >
                    <option value="">全部阿姨</option>
                    {workerIds.map(wId => (
                      <option key={wId} value={String(wId)}>{workerNameMap[wId]}</option>
                    ))}
                  </select>
                </div>
              )}
              {filteredOrders.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>{sortedOrders.length === 0 ? '暂无历史订单' : '没有匹配的订单'}</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-200"></div>
                  <div className="space-y-4">
                    {filteredOrders.map(order => (
                      <div key={order.id} className="relative pl-10">
                        <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full bg-stone-300 border-2 border-white"></div>
                        <Link
                          to={`/orders/${order.id}`}
                          className="block bg-stone-50 rounded-lg border border-stone-200 p-4 hover:border-primary-300 hover:bg-primary-50/30 transition-colors"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <span className="text-sm font-semibold text-primary-600">
                                #{order.id}
                              </span>
                              <span className="text-sm font-medium text-stone-800">
                                {order.serviceType}
                              </span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                              {STATUS_LABELS[order.status]}
                            </span>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-stone-500">
                            <span className="flex items-center">
                              <Calendar className="w-3.5 h-3.5 mr-1" />
                              {formatDate(order.scheduledStartTime)}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3.5 h-3.5 mr-1" />
                              {formatTime(order.scheduledStartTime)} - {formatTime(order.scheduledEndTime)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 mt-2 text-sm text-stone-500">
                            <span className="flex items-center">
                              <User className="w-3.5 h-3.5 mr-1" />
                              {order.workerId ? (workerNameMap[order.workerId] || `阿姨#${order.workerId}`) : '未指派'}
                            </span>
                            {order.review && (
                              <span className="flex items-center">
                                {getReviewBadge(order.review.rating)}
                              </span>
                            )}
                          </div>
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'followups' && (
            <>
              {sortedFollowups.length > 0 && (
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-stone-100 flex-wrap">
                  <Filter className="w-4 h-4 text-stone-400" />
                  <button
                    onClick={() => setFollowupFilter('')}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                      followupFilter === '' ? 'bg-primary-100 text-primary-700' : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                    }`}
                  >
                    全部
                  </button>
                  {Object.entries(FOLLOWUP_LABELS).map(([key, label]) => {
                    const count = sortedFollowups.filter(fu => fu.type === key).length;
                    if (count === 0) return null;
                    return (
                      <button
                        key={key}
                        onClick={() => setFollowupFilter(followupFilter === key ? '' : key)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          followupFilter === key ? FOLLOWUP_BADGE_COLORS[key] : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {label}
                        <span className="ml-1 opacity-70">{count}</span>
                      </button>
                    );
                  })}
                </div>
              )}
              {filteredFollowups.length === 0 ? (
                <div className="text-center py-12 text-stone-400">
                  <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>{sortedFollowups.length === 0 ? '暂无跟进记录' : '没有匹配的跟进记录'}</p>
                </div>
              ) : (
                <div className="relative">
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-stone-200"></div>
                  <div className="space-y-4">
                    {filteredFollowups.map(fu => {
                      const FollowupIcon = FOLLOWUP_ICONS[fu.type] || AlertCircle;
                      return (
                        <div key={fu.id} className="relative pl-10">
                          <div className={`absolute left-2 top-3 w-4 h-4 rounded-full ${FOLLOWUP_COLORS[fu.type]} border-2 border-white`}></div>
                          <div className="bg-stone-50 rounded-lg border border-stone-200 p-4">
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <FollowupIcon className="w-4 h-4 text-stone-500" />
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${FOLLOWUP_BADGE_COLORS[fu.type]}`}>
                                  {FOLLOWUP_LABELS[fu.type]}
                                </span>
                                <Link
                                  to={`/orders/${fu.orderId}`}
                                  className="text-xs text-primary-600 hover:text-primary-700"
                                >
                                  订单#{fu.orderId}
                                </Link>
                              </div>
                              <span className="text-xs text-stone-400">
                                {formatDateTime(fu.createdAt)}
                              </span>
                            </div>
                            <p className="text-sm text-stone-600 mb-2">{fu.content}</p>
                            <p className="text-xs text-stone-400">
                              {fu.createdBy}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {activeTab === 'reminders' && (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-stone-700">待处理提醒</h3>
                <button
                  onClick={() => setShowReminderForm(true)}
                  className="flex items-center px-3 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium"
                >
                  <Plus className="w-3.5 h-3.5 mr-1.5" />
                  新建提醒
                </button>
              </div>

              {showReminderForm && (
                <div className="bg-stone-50 rounded-lg border border-stone-200 p-4 mb-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">提醒类型</label>
                      <div className="flex gap-2">
                        {([
                          { key: 'post_service_callback', label: '服务回访' },
                          { key: 'insurance_renewal', label: '保险续约' },
                          { key: 'inactive_customer', label: '沉睡客户' },
                          { key: 'custom', label: '自定义' },
                        ] as const).map(opt => (
                          <button
                            key={opt.key}
                            onClick={() => setReminderForm(f => ({ ...f, type: opt.key }))}
                            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              reminderForm.type === opt.key
                                ? 'bg-primary-500 text-white'
                                : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-100'
                            }`}
                          >
                            {opt.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">标题</label>
                      <input
                        type="text"
                        value={reminderForm.title}
                        onChange={e => setReminderForm(f => ({ ...f, title: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                        placeholder="输入提醒标题"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">描述</label>
                      <textarea
                        value={reminderForm.description}
                        onChange={e => setReminderForm(f => ({ ...f, description: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500 resize-none"
                        rows={2}
                        placeholder="输入提醒描述（可选）"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-stone-600 mb-1.5">到期日期</label>
                      <input
                        type="date"
                        value={reminderForm.dueDate}
                        onChange={e => setReminderForm(f => ({ ...f, dueDate: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-primary-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={handleSaveReminder}
                        disabled={!reminderForm.title || !reminderForm.dueDate}
                        className="px-4 py-1.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        保存
                      </button>
                      <button
                        onClick={() => {
                          setShowReminderForm(false);
                          setReminderForm({ type: 'post_service_callback', title: '', description: '', dueDate: '' });
                        }}
                        className="px-4 py-1.5 bg-white text-stone-600 rounded-lg border border-stone-200 hover:bg-stone-50 transition-colors text-sm font-medium"
                      >
                        取消
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {pendingReminders.length === 0 ? (
                <div className="text-center py-8 text-stone-400">
                  <BellRing className="w-10 h-10 mx-auto mb-3 opacity-50" />
                  <p>暂无待处理提醒</p>
                </div>
              ) : (
                <div className="space-y-3 mb-6">
                  {pendingReminders
                    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                    .map(reminder => {
                      const urgency = getUrgencyIndicator(reminder.dueDate);
                      return (
                        <div key={reminder.id} className={`rounded-lg p-4 ${getUrgencyStyle(urgency)}`}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`w-2 h-2 rounded-full ${getUrgencyDot(urgency)}`}></span>
                              <span className="text-sm font-semibold text-stone-800">{reminder.title}</span>
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${REMINDER_TYPE_COLORS[reminder.type]}`}>
                                {REMINDER_TYPE_LABELS[reminder.type]}
                              </span>
                            </div>
                            <span className="text-xs text-stone-500">
                              到期：{formatDate(reminder.dueDate)}
                            </span>
                          </div>
                          {reminder.description && (
                            <p className="text-sm text-stone-600 mb-3">{reminder.description}</p>
                          )}
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleReminderStatusUpdate(reminder.id, 'done')}
                              className="flex items-center gap-1 px-3 py-1 bg-success-500 text-white rounded text-xs font-medium hover:bg-success-600 transition-colors"
                            >
                              <Check className="w-3 h-3" />
                              完成
                            </button>
                            <button
                              onClick={() => handleReminderStatusUpdate(reminder.id, 'skipped')}
                              className="flex items-center gap-1 px-3 py-1 bg-stone-200 text-stone-600 rounded text-xs font-medium hover:bg-stone-300 transition-colors"
                            >
                              <SkipForward className="w-3 h-3" />
                              跳过
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}

              {completedReminders.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-3">已完成 / 已跳过</h4>
                  <div className="space-y-2">
                    {completedReminders.map(reminder => (
                      <div key={reminder.id} className="flex items-center justify-between rounded-lg bg-stone-50 border border-stone-100 px-4 py-2.5 opacity-60">
                        <div className="flex items-center gap-2">
                          {reminder.status === 'done' ? (
                            <Check className="w-3.5 h-3.5 text-success-500" />
                          ) : (
                            <SkipForward className="w-3.5 h-3.5 text-stone-400" />
                          )}
                          <span className="text-sm text-stone-500 line-through">{reminder.title}</span>
                          <span className={`px-1.5 py-0.5 rounded text-xs ${REMINDER_TYPE_COLORS[reminder.type]}`}>
                            {REMINDER_TYPE_LABELS[reminder.type]}
                          </span>
                        </div>
                        <span className="text-xs text-stone-400">
                          {reminder.status === 'done' ? '已完成' : '已跳过'}
                          {reminder.completedAt ? ` · ${formatDate(reminder.completedAt)}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
