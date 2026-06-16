import { useState, useEffect } from 'react';
import { ThumbsUp, ThumbsDown, Minus, Filter, User, Clock, MessageSquare } from 'lucide-react';
import { api } from '../lib/api';
import type { Order, Worker } from '../../shared/types';

export default function ReviewsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState('');
  const [workerFilter, setWorkerFilter] = useState('');

  useEffect(() => {
    loadData();
  }, [ratingFilter, workerFilter]);

  async function loadData() {
    setLoading(true);
    try {
      const [ordersRes, workersRes] = await Promise.all([
        api.orders.list(),
        api.workers.list(),
      ]);

      let filtered = ordersRes.filter(o => o.review);
      
      if (ratingFilter) {
        filtered = filtered.filter(o => o.review?.rating === ratingFilter);
      }
      
      if (workerFilter) {
        filtered = filtered.filter(o => o.workerId === parseInt(workerFilter));
      }

      setOrders(filtered);
      setWorkers(workersRes);
    } catch (e) {
      console.error('加载评价失败', e);
    } finally {
      setLoading(false);
    }
  }

  const getWorkerName = (workerId?: number) => {
    const worker = workers.find(w => w.id === workerId);
    return worker?.name || '未指派';
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const positiveCount = orders.filter(o => o.review?.rating === 'positive').length;
  const negativeCount = orders.filter(o => o.review?.rating === 'negative').length;
  const neutralCount = orders.filter(o => o.review?.rating === 'neutral').length;
  const positiveRate = orders.length > 0 ? ((positiveCount / orders.length) * 100).toFixed(1) : '0';

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
          <p className="text-sm text-stone-500">总评价数</p>
          <p className="text-2xl font-bold text-stone-800 mt-1">{orders.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">好评</p>
              <p className="text-2xl font-bold text-success-500 mt-1">{positiveCount}</p>
            </div>
            <ThumbsUp className="w-8 h-8 text-success-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">差评</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{negativeCount}</p>
            </div>
            <ThumbsDown className="w-8 h-8 text-red-500 opacity-20" />
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-stone-500">好评率</p>
              <p className="text-2xl font-bold text-primary-600 mt-1">{positiveRate}%</p>
            </div>
            <MessageSquare className="w-8 h-8 text-primary-500 opacity-20" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-stone-400" />
          <select
            value={ratingFilter}
            onChange={e => setRatingFilter(e.target.value)}
            className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
          >
            <option value="">全部评价</option>
            <option value="positive">好评</option>
            <option value="neutral">一般</option>
            <option value="negative">差评</option>
          </select>
        </div>
        <select
          value={workerFilter}
          onChange={e => setWorkerFilter(e.target.value)}
          className="px-4 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
        >
          <option value="">全部阿姨</option>
          {workers.map(w => (
            <option key={w.id} value={w.id}>{w.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-stone-100">
          {orders.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              暂无评价记录
            </div>
          ) : (
            orders.map(order => (
              <div key={order.id} className="p-5 hover:bg-stone-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      {order.review?.rating === 'positive' && (
                        <div className="w-10 h-10 rounded-full bg-success-100 flex items-center justify-center">
                          <ThumbsUp className="w-5 h-5 text-success-500" />
                        </div>
                      )}
                      {order.review?.rating === 'negative' && (
                        <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                          <ThumbsDown className="w-5 h-5 text-red-500" />
                        </div>
                      )}
                      {order.review?.rating === 'neutral' && (
                        <div className="w-10 h-10 rounded-full bg-stone-100 flex items-center justify-center">
                          <Minus className="w-5 h-5 text-stone-500" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-stone-800">{order.customerName}</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                            order.review?.rating === 'positive'
                              ? 'bg-success-100 text-success-500'
                              : order.review?.rating === 'negative'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-stone-100 text-stone-600'
                          }`}>
                            {order.review?.rating === 'positive' ? '好评' : order.review?.rating === 'negative' ? '差评' : '一般'}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 mt-1 text-sm text-stone-500">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {getWorkerName(order.workerId)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            {formatDate(order.actualEndTime || order.scheduledEndTime)}
                          </div>
                          <span className="text-primary-600">{order.serviceType}</span>
                        </div>
                      </div>
                    </div>
                    {order.review?.comment && (
                      <p className="mt-3 ml-13 text-stone-600 pl-13">
                        "{order.review.comment}"
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
