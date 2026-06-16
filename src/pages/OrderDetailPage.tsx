import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  MapPin,
  Phone,
  User,
  Clock,
  Calendar,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Minus,
  Edit3,
  Save,
  Play,
  Square,
  CheckCircle,
  AlertCircle,
  UserCheck,
  MessageSquare,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Order, Worker, ReviewRating } from '../../shared/types';

export default function OrderDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const orderId = parseInt(id!);

  const [order, setOrder] = useState<Order | null>(null);
  const [worker, setWorker] = useState<Worker | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingReview, setEditingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState<{ rating: ReviewRating; comment: string }>({
    rating: 'positive',
    comment: '',
  });
  const [savingReview, setSavingReview] = useState(false);
  const [processingAction, setProcessingAction] = useState<string | null>(null);

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  async function loadOrder() {
    setLoading(true);
    try {
      const orderData = await api.orders.get(orderId);
      setOrder(orderData);
      
      if (orderData.workerId) {
        const workerData = await api.workers.get(orderData.workerId);
        setWorker(workerData);
      }

      if (orderData.review) {
        setReviewForm({
          rating: orderData.review.rating,
          comment: orderData.review.comment || '',
        });
      }
    } catch (e) {
      console.error('加载订单失败', e);
      alert('加载订单失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleStart() {
    if (!order) return;
    setProcessingAction('start');
    try {
      const updated = await api.orders.start(order.id);
      setOrder(updated);
    } catch (e: any) {
      alert(e.message || '操作失败');
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleEnd() {
    if (!order) return;
    setProcessingAction('end');
    try {
      const updated = await api.orders.end(order.id);
      setOrder(updated);
    } catch (e: any) {
      alert(e.message || '操作失败');
    } finally {
      setProcessingAction(null);
    }
  }

  async function handleSaveReview() {
    if (!order) return;
    setSavingReview(true);
    try {
      const updated = await api.orders.review(order.id, reviewForm);
      setOrder(updated);
      setEditingReview(false);
    } catch (e: any) {
      alert(e.message || '保存评价失败');
    } finally {
      setSavingReview(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: 'bg-warning-100 text-warning-600 border-warning-200',
      assigned: 'bg-primary-100 text-primary-600 border-primary-200',
      in_progress: 'bg-success-100 text-success-500 border-success-200',
      completed: 'bg-stone-100 text-stone-600 border-stone-200',
      cancelled: 'bg-stone-100 text-stone-400 border-stone-200',
    };
    const labels: Record<string, string> = {
      pending: '待派单',
      assigned: '已派单',
      in_progress: '进行中',
      completed: '已完成',
      cancelled: '已取消',
    };
    const icons: Record<string, any> = {
      pending: AlertCircle,
      assigned: UserCheck,
      in_progress: Play,
      completed: CheckCircle,
      cancelled: Minus,
    };
    const Icon = icons[status];
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border ${styles[status]}`}>
        {Icon && <Icon className="w-4 h-4" />}
        {labels[status]}
      </span>
    );
  };

  const getReviewBadge = (rating: ReviewRating) => {
    if (rating === 'positive') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-success-100 text-success-500">
          <ThumbsUp className="w-4 h-4" />
          好评
        </span>
      );
    } else if (rating === 'negative') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-600">
          <ThumbsDown className="w-4 h-4" />
          差评
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium bg-stone-100 text-stone-600">
        <Minus className="w-4 h-4" />
        一般
      </span>
    );
  };

  const formatDateTime = (str?: string) => {
    if (!str) return '--';
    return new Date(str).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (str?: string) => {
    if (!str) return '--:--';
    return new Date(str).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const calculateDuration = (start?: string, end?: string) => {
    if (!start || !end) return null;
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}小时${minutes}分钟`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-16">
        <p className="text-stone-500">订单不存在</p>
        <button
          onClick={() => navigate('/orders')}
          className="mt-4 text-primary-600 hover:text-primary-700"
        >
          返回订单列表
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button
        onClick={() => navigate('/orders')}
        className="flex items-center text-stone-600 hover:text-stone-900"
      >
        <ArrowLeft className="w-5 h-5 mr-2" />
        返回订单列表
      </button>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-stone-100">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-stone-800">
                  订单 #{order.id}
                </h1>
                {getStatusBadge(order.status)}
              </div>
              <p className="mt-2 text-lg text-stone-700">
                {order.customerName} - {order.serviceType}
              </p>
            </div>
            {(order.status === 'assigned' || order.status === 'in_progress') && (
              <div className="flex gap-2">
                {order.status === 'assigned' && (
                  <button
                    onClick={handleStart}
                    disabled={processingAction === 'start'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-success-500 text-white rounded-lg hover:bg-success-600 transition-colors font-medium disabled:opacity-50"
                  >
                    <Play className="w-5 h-5" />
                    {processingAction === 'start' ? '处理中...' : '开始服务'}
                  </button>
                )}
                {order.status === 'in_progress' && (
                  <button
                    onClick={handleEnd}
                    disabled={processingAction === 'end'}
                    className="flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                  >
                    <Square className="w-5 h-5" />
                    {processingAction === 'end' ? '处理中...' : '结束服务'}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-0">
          <div className="p-6 border-r border-stone-100">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
              客户信息
            </h3>
            <div className="space-y-4">
              <div className="flex items-start">
                <User className="w-5 h-5 text-stone-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-stone-500">客户姓名</p>
                  <p className="font-medium text-stone-800">{order.customerName}</p>
                </div>
              </div>
              <div className="flex items-start">
                <Phone className="w-5 h-5 text-stone-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-stone-500">联系电话</p>
                  <p className="font-medium text-stone-800">{order.customerPhone || '--'}</p>
                </div>
              </div>
              <div className="flex items-start">
                <MapPin className="w-5 h-5 text-stone-400 mt-0.5 mr-3" />
                <div>
                  <p className="text-sm text-stone-500">服务地址</p>
                  <p className="font-medium text-stone-800">{order.serviceAddress || '--'}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
              服务阿姨
            </h3>
            {worker ? (
              <Link to={`/workers/${worker.id}/edit`} className="block group">
                <div className="flex items-start p-4 bg-stone-50 rounded-lg group-hover:bg-primary-50 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 font-bold text-lg">
                    {worker.name.charAt(0)}
                  </div>
                  <div className="ml-4 flex-1">
                    <p className="font-semibold text-stone-800 group-hover:text-primary-600 transition-colors">
                      {worker.name}
                    </p>
                    <p className="text-sm text-stone-500 mt-0.5">{worker.phone}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {worker.skills.map(skill => (
                        <span
                          key={skill}
                          className={`px-2 py-0.5 rounded text-xs ${
                            skill === order.serviceType
                              ? 'bg-primary-100 text-primary-600 font-medium'
                              : 'bg-stone-200 text-stone-600'
                          }`}
                        >
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </Link>
            ) : (
              <div className="p-4 bg-stone-50 rounded-lg text-stone-500 text-center">
                暂未指派阿姨
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-stone-100 bg-stone-50">
          <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-4">
            时间记录
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">计划服务</span>
              </div>
              <p className="font-medium text-stone-800">
                {new Date(order.scheduledStartTime).toLocaleDateString('zh-CN')}
              </p>
              <p className="text-sm text-stone-500 mt-0.5">
                {formatTime(order.scheduledStartTime)} - {formatTime(order.scheduledEndTime)}
              </p>
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Play className="w-4 h-4" />
                <span className="text-sm">实际开始</span>
              </div>
              <p className="font-medium text-stone-800">
                {order.actualStartTime ? formatDateTime(order.actualStartTime) : '--'}
              </p>
              {order.actualStartTime && (
                <p className="text-xs text-success-600 mt-0.5">已出发打卡</p>
              )}
            </div>
            <div className="bg-white rounded-lg p-4">
              <div className="flex items-center gap-2 text-stone-500 mb-1">
                <Square className="w-4 h-4" />
                <span className="text-sm">实际结束</span>
              </div>
              <p className="font-medium text-stone-800">
                {order.actualEndTime ? formatDateTime(order.actualEndTime) : '--'}
              </p>
              {order.actualEndTime && (
                <div>
                  <p className="text-xs text-success-600 mt-0.5">已结束打卡</p>
                  <p className="text-sm font-semibold text-primary-600 mt-1">
                    工时：{order.workHours} 小时
                  </p>
                </div>
              )}
            </div>
          </div>

          {order.actualStartTime && order.actualEndTime && (
            <div className="mt-4 flex items-center justify-center gap-2 text-stone-600">
              <Clock className="w-4 h-4" />
              <span>
                实际服务时长：
                <span className="font-semibold text-primary-600">
                  {calculateDuration(order.actualStartTime, order.actualEndTime)}
                </span>
              </span>
            </div>
          )}
        </div>

        {order.notes && (
          <div className="p-6 border-t border-stone-100">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider mb-3">
              <span className="inline-flex items-center gap-1.5">
                <FileText className="w-4 h-4" />
                备注信息
              </span>
            </h3>
            <p className="text-stone-700 bg-stone-50 rounded-lg p-4">{order.notes}</p>
          </div>
        )}

        <div className="p-6 border-t border-stone-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">
              客户评价
            </h3>
            {order.status === 'completed' && !editingReview && (
              <button
                onClick={() => setEditingReview(true)}
                className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 font-medium"
              >
                <Edit3 className="w-4 h-4" />
                {order.review ? '修改评价' : '补录评价'}
              </button>
            )}
          </div>

          {editingReview ? (
            <div className="bg-stone-50 rounded-lg p-5">
              <p className="text-sm font-medium text-stone-700 mb-3">评价等级</p>
              <div className="flex gap-3 mb-4">
                {[
                  { value: 'positive' as ReviewRating, label: '好评', icon: ThumbsUp, color: 'success' },
                  { value: 'neutral' as ReviewRating, label: '一般', icon: Minus, color: 'stone' },
                  { value: 'negative' as ReviewRating, label: '差评', icon: ThumbsDown, color: 'red' },
                ].map(item => {
                  const Icon = item.icon;
                  const isSelected = reviewForm.rating === item.value;
                  const colorClasses = {
                    success: isSelected ? 'bg-success-500 text-white border-success-500' : 'bg-white text-success-600 border-stone-200 hover:border-success-300',
                    stone: isSelected ? 'bg-stone-500 text-white border-stone-500' : 'bg-white text-stone-600 border-stone-200 hover:border-stone-300',
                    red: isSelected ? 'bg-red-500 text-white border-red-500' : 'bg-white text-red-600 border-stone-200 hover:border-red-300',
                  };
                  return (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: item.value })}
                      className={`flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 font-medium transition-all ${colorClasses[item.color]}`}
                    >
                      <Icon className="w-4 h-4" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm font-medium text-stone-700 mb-2">评价内容（可选）</p>
              <textarea
                value={reviewForm.comment}
                onChange={e => setReviewForm({ ...reviewForm, comment: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white resize-none"
                placeholder="请输入评价内容..."
              />
              <div className="flex justify-end gap-3 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setEditingReview(false);
                    if (order.review) {
                      setReviewForm({
                        rating: order.review.rating,
                        comment: order.review.comment || '',
                      });
                    }
                  }}
                  className="px-5 py-2 border border-stone-200 text-stone-600 rounded-lg hover:bg-stone-50 transition-colors font-medium"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveReview}
                  disabled={savingReview}
                  className="flex items-center gap-2 px-5 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {savingReview ? '保存中...' : '保存评价'}
                </button>
              </div>
            </div>
          ) : order.review ? (
            <div className="bg-stone-50 rounded-lg p-5">
              <div className="flex items-start justify-between">
                {getReviewBadge(order.review.rating)}
              </div>
              {order.review.comment && (
                <p className="mt-3 text-stone-700">"{order.review.comment}"</p>
              )}
            </div>
          ) : (
            <div className="text-center py-8 text-stone-400 bg-stone-50 rounded-lg">
              {order.status === 'completed' ? (
                <>
                  <MessageSquare className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>暂无评价，点击右上角「补录评价」添加</p>
                </>
              ) : (
                <>
                  <Clock className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>服务完成后可录入评价</p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
