import type { Worker, Order, MonthlyPerformance, WorkerWithScore, Customer, FollowUp, FollowUpType, CustomerProfile, WorkerUnavailability, CallbackReminder } from '../../shared/types';

const API_BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: '请求失败' }));
    throw new Error(error.error || '请求失败');
  }

  return response.json();
}

export const api = {
  workers: {
    list: (params?: { skill?: string; status?: string }) => {
      const query = new URLSearchParams();
      if (params?.skill) query.set('skill', params.skill);
      if (params?.status) query.set('status', params.status);
      const queryStr = query.toString();
      return request<Worker[]>(`/workers${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id: number) => request<Worker>(`/workers/${id}`),
    create: (data: Partial<Worker>) => request<Worker>('/workers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Worker>) => request<Worker>(`/workers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => request<{ message: string }>(`/workers/${id}`, {
      method: 'DELETE',
    }),
    available: (params: { serviceType: string; startTime: string; endTime: string; orderId?: number }) => {
      const query = new URLSearchParams();
      if (params.serviceType) query.set('serviceType', params.serviceType);
      if (params.startTime) query.set('startTime', params.startTime);
      if (params.endTime) query.set('endTime', params.endTime);
      if (params.orderId) query.set('orderId', String(params.orderId));
      return request<{ available: WorkerWithScore[]; unavailable: Array<WorkerUnavailability & { skills?: string[] }> }>(`/workers/available?${query.toString()}`);
    },
  },
  orders: {
    list: (params?: { status?: string; date?: string; workerId?: number; serviceType?: string }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.date) query.set('date', params.date);
      if (params?.workerId) query.set('workerId', String(params.workerId));
      if (params?.serviceType) query.set('serviceType', params.serviceType);
      const queryStr = query.toString();
      return request<Order[]>(`/orders${queryStr ? `?${queryStr}` : ''}`);
    },
    get: (id: number) => request<Order>(`/orders/${id}`),
    create: (data: Partial<Order>) => request<Order>('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Order>) => request<Order>(`/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => request<{ message: string }>(`/orders/${id}`, {
      method: 'DELETE',
    }),
    start: (id: number) => request<Order>(`/orders/${id}/start`, {
      method: 'POST',
    }),
    end: (id: number) => request<Order>(`/orders/${id}/end`, {
      method: 'POST',
    }),
    review: (id: number, data: { rating: string; comment?: string }) => request<Order>(`/orders/${id}/review`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    reassign: (id: number, workerId: number, reason?: string) => request<Order>(`/orders/${id}/reassign`, {
      method: 'POST',
      body: JSON.stringify({ workerId, reason }),
    }),
    cancel: (id: number, reason?: string) => request<Order>(`/orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
    followups: (id: number) => request<FollowUp[]>(`/orders/${id}/followups`),
    addFollowUp: (id: number, type: FollowUpType, content: string, createdBy?: string) => request<FollowUp>(`/orders/${id}/followups`, {
      method: 'POST',
      body: JSON.stringify({ type, content, createdBy }),
    }),
    editFollowUp: (orderId: number, followUpId: number, content: string) => request<FollowUp>(`/orders/${orderId}/followups/${followUpId}`, {
      method: 'PUT',
      body: JSON.stringify({ content }),
    }),
  },
  customers: {
    list: () => request<Customer[]>('/customers'),
    get: (id: number) => request<CustomerProfile & { orders: Order[]; followups: FollowUp[] }>(`/customers/${id}`),
    getByPhone: (phone: string) => request<CustomerProfile & { recentOrders?: Order[] }>(`/customers/phone/${encodeURIComponent(phone)}`),
    spendingTrend: (id: number) => request<Array<{ month: string; orders: number; hours: number; spending: number }>>(`/customers/${id}/spending-trend`),
    reminders: (id: number) => request<CallbackReminder[]>(`/customers/${id}/reminders`),
    addReminder: (id: number, data: { type: string; title: string; description?: string; dueDate: string; orderId?: number }) => request<CallbackReminder>(`/customers/${id}/reminders`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    updateReminder: (customerId: number, reminderId: number, data: { status?: string; title?: string; description?: string; dueDate?: string }) => request<CallbackReminder>(`/customers/${customerId}/reminders/${reminderId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    pendingReminders: () => request<(CallbackReminder & { customerName: string; customerPhone: string })[]>('/customers/reminders/pending'),
    create: (data: Partial<Customer>) => request<Customer>('/customers', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    update: (id: number, data: Partial<Customer>) => request<Customer>(`/customers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
    delete: (id: number) => request<{ message: string }>(`/customers/${id}`, {
      method: 'DELETE',
    }),
  },
  performance: {
    list: (month?: string) => {
      const query = month ? `?month=${month}` : '';
      return request<MonthlyPerformance[]>(`/performance${query}`);
    },
    getWorker: (id: number, month?: string) => {
      const query = month ? `?month=${month}` : '';
      return request<MonthlyPerformance & { orders: Order[] }>(`/performance/workers/${id}${query}`);
    },
  },
  insurance: {
    expiring: (days?: number) => {
      const query = days ? `?days=${days}` : '';
      return request<Array<{
        id: number;
        name: string;
        phone: string;
        insuranceExpiryDate: string;
        daysUntilExpiry: number;
        urgency: 'critical' | 'warning' | 'normal';
      }>>(`/insurance/expiring${query}`);
    },
  },
};
