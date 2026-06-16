import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  User,
  AlertTriangle,
  Calendar as CalendarIcon,
} from 'lucide-react';
import { api } from '../lib/api';
import type { Order, Worker } from '../../shared/types';

const TIME_SLOTS = [
  '08:00', '09:00', '10:00', '11:00', '12:00',
  '13:00', '14:00', '15:00', '16:00', '17:00', '18:00',
];

const HOUR_HEIGHT = 72;

export default function ScheduleCalendarPage() {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  });
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const weekDates = useMemo(() => {
    const startOfWeek = new Date(currentDate);
    const dayOfWeek = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    startOfWeek.setDate(diff);

    const dates: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      dates.push(d);
    }
    return dates;
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [currentDate]);

  async function loadData() {
    setLoading(true);
    try {
      const [workersRes, allOrders] = await Promise.all([
        api.workers.list({ status: 'active' }),
        api.orders.list(),
      ]);

      const weekOrders = allOrders.filter(o => {
        const orderDate = new Date(o.scheduledStartTime).toDateString();
        return weekDates.some(d => d.toDateString() === orderDate) && o.status !== 'cancelled';
      });

      setWorkers(workersRes);
      setOrders(weekOrders);
    } catch (e) {
      console.error('加载数据失败', e);
    } finally {
      setLoading(false);
    }
  }

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const formatDateHeader = (date: Date) => {
    const weekdays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    const idx = (date.getDay() + 6) % 7;
    return weekdays[idx];
  };

  const getOrdersForSlot = (workerId: number, date: Date) => {
    return orders.filter(o => {
      if (o.workerId !== workerId) return false;
      const orderDate = new Date(o.scheduledStartTime).toDateString();
      return orderDate === date.toDateString();
    });
  };

  const getOrderPosition = (order: Order) => {
    const start = new Date(order.scheduledStartTime);
    const end = new Date(order.scheduledEndTime);
    
    const startMinutes = start.getHours() * 60 + start.getMinutes();
    const endMinutes = end.getHours() * 60 + end.getMinutes();
    
    const topOffset = Math.max(0, (startMinutes - 8 * 60) / 60) * HOUR_HEIGHT;
    const height = Math.max(40, ((endMinutes - startMinutes) / 60) * HOUR_HEIGHT - 4);
    
    return { top: topOffset, height };
  };

  const hasTimeConflict = (workerId: number, date: Date) => {
    const workerOrders = getOrdersForSlot(workerId, date);
    for (let i = 0; i < workerOrders.length; i++) {
      for (let j = i + 1; j < workerOrders.length; j++) {
        const aStart = new Date(workerOrders[i].scheduledStartTime).getTime();
        const aEnd = new Date(workerOrders[i].scheduledEndTime).getTime();
        const bStart = new Date(workerOrders[j].scheduledStartTime).getTime();
        const bEnd = new Date(workerOrders[j].scheduledEndTime).getTime();
        if (aStart < bEnd && bStart < aEnd) return true;
      }
    }
    return false;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-warning-100 border-warning-300 text-warning-700',
      assigned: 'bg-primary-100 border-primary-300 text-primary-700',
      in_progress: 'bg-success-100 border-success-300 text-success-700',
      completed: 'bg-stone-100 border-stone-300 text-stone-600',
    };
    return colors[status] || 'bg-stone-100 border-stone-300';
  };

  const goToPrevWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 7);
    setCurrentDate(d);
  };

  const goToNextWeek = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 7);
    setCurrentDate(d);
  };

  const goToToday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    setCurrentDate(today);
  };

  const createOrder = (date: Date, hour: number, workerId?: number) => {
    const dateStr = date.toISOString().split('T')[0];
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(hour + 2).padStart(2, '0')}:00`;
    
    const params = new URLSearchParams({
      date: dateStr,
      startTime,
      endTime,
      ...(workerId ? { workerId: String(workerId) } : {}),
    });
    
    navigate(`/orders/new?${params.toString()}`);
  };

  const formatTime = (str: string) => {
    return new Date(str).toLocaleTimeString('zh-CN', {
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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={goToPrevWeek}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-stone-600" />
          </button>
          <div>
            <h2 className="text-xl font-bold text-stone-800">
              {weekDates[0].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}
              {' - '}
              {weekDates[6].toLocaleDateString('zh-CN', { month: 'long', day: 'numeric', year: 'numeric' })}
            </h2>
          </div>
          <button
            onClick={goToNextWeek}
            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-stone-600" />
          </button>
          <button
            onClick={goToToday}
            className="ml-2 px-4 py-1.5 border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors"
          >
            今天
          </button>
        </div>
        <button
          onClick={() => navigate('/orders/new')}
          className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium"
        >
          <Plus className="w-5 h-5" />
          新建预约
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm flex-1 overflow-hidden flex flex-col">
        <div className="grid border-b border-stone-200 bg-stone-50" style={{ gridTemplateColumns: `140px repeat(${weekDates.length}, 1fr)` }}>
          <div className="p-3 border-r border-stone-200 flex items-center">
            <User className="w-4 h-4 text-stone-400 mr-2" />
            <span className="text-sm font-medium text-stone-500">阿姨 / 日期</span>
          </div>
          {weekDates.map((date, idx) => (
            <div
              key={idx}
              className={`p-3 text-center border-r border-stone-200 last:border-r-0 ${
                isToday(date) ? 'bg-primary-50' : ''
              }`}
            >
              <p className={`text-xs ${isToday(date) ? 'text-primary-600 font-semibold' : 'text-stone-500'}`}>
                {formatDateHeader(date)}
              </p>
              <p className={`text-lg font-bold mt-0.5 ${isToday(date) ? 'text-primary-600' : 'text-stone-800'}`}>
                {date.getDate()}
              </p>
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-auto">
          {workers.length === 0 ? (
            <div className="text-center py-16 text-stone-400">
              <CalendarIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无在职阿姨</p>
            </div>
          ) : (
            workers.map(worker => (
              <div
                key={worker.id}
                className="grid border-b border-stone-100 last:border-b-0"
                style={{ gridTemplateColumns: `140px repeat(${weekDates.length}, 1fr)`, minHeight: `${TIME_SLOTS.length * HOUR_HEIGHT + 20}px` }}
              >
                <div className="p-3 border-r border-stone-100 bg-stone-50 sticky left-0 z-10">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-600 text-sm font-medium">
                      {worker.name.charAt(0)}
                    </div>
                    <div className="ml-2 min-w-0">
                      <p className="font-medium text-stone-800 text-sm truncate">{worker.name}</p>
                      <p className="text-xs text-stone-400 truncate">¥{worker.hourlyRate}/h</p>
                    </div>
                  </div>
                </div>

                {weekDates.map((date, dateIdx) => {
                  const dayOrders = getOrdersForSlot(worker.id, date);
                  const hasConflict = hasTimeConflict(worker.id, date);

                  return (
                    <div
                      key={dateIdx}
                      className={`relative border-r border-stone-100 last:border-r-0 ${
                        isToday(date) ? 'bg-primary-50/30' : ''
                      }`}
                      style={{ minHeight: `${TIME_SLOTS.length * HOUR_HEIGHT}px` }}
                    >
                      {TIME_SLOTS.map((time, timeIdx) => {
                        const hour = parseInt(time.split(':')[0]);
                        return (
                          <div
                            key={timeIdx}
                            className="absolute w-full border-t border-stone-100 hover:bg-primary-50/50 cursor-pointer group"
                            style={{ top: `${timeIdx * HOUR_HEIGHT}px`, height: `${HOUR_HEIGHT}px` }}
                            onClick={() => createOrder(date, hour, worker.id)}
                          >
                            <div className="opacity-0 group-hover:opacity-100 absolute inset-0 flex items-center justify-center transition-opacity">
                              <div className="flex items-center gap-1 text-primary-500 text-xs font-medium bg-white px-2 py-1 rounded shadow-sm">
                                <Plus className="w-3 h-3" />
                                新建预约
                              </div>
                            </div>
                          </div>
                        );
                      })}

                      {hasConflict && (
                        <div className="absolute top-1 right-1 z-20" title="时间冲突">
                          <AlertTriangle className="w-4 h-4 text-red-500" />
                        </div>
                      )}

                      {dayOrders.map(order => {
                        const pos = getOrderPosition(order);
                        return (
                          <div
                            key={order.id}
                            className={`absolute left-1 right-1 z-10 rounded-lg border p-2 cursor-pointer overflow-hidden hover:shadow-md transition-shadow ${getStatusColor(order.status)}`}
                            style={{ top: `${pos.top}px`, height: `${pos.height}px` }}
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/orders/${order.id}`);
                            }}
                          >
                            <p className="text-xs font-semibold truncate">{order.serviceType}</p>
                            <p className="text-[10px] opacity-80 flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {formatTime(order.scheduledStartTime)}-{formatTime(order.scheduledEndTime)}
                            </p>
                            <p className="text-[10px] opacity-70 truncate mt-0.5">{order.customerName}</p>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="p-3 border-t border-stone-200 bg-stone-50 flex items-center gap-6 text-xs text-stone-500">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-warning-100 border border-warning-300"></div>
            <span>待派单</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary-100 border border-primary-300"></div>
            <span>已派单</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-success-100 border border-success-300"></div>
            <span>进行中</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-stone-100 border border-stone-300"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-1.5 ml-auto">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
            <span>时间冲突</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span>点击空白时段可快速新建预约</span>
          </div>
        </div>
      </div>
    </div>
  );
}
