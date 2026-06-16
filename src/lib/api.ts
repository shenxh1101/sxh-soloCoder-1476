import type { Worker, Order, MonthlyPerformance, WorkerWithScore } from '../../shared/types';

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
    available: (params: { serviceType: string; startTime: string; endTime: string }) => {
      const query = new URLSearchParams(params);
      return request<WorkerWithScore[]>(`/workers/available?${query.toString()}`);
    },
  },
  orders: {
    list: (params?: { status?: string; date?: string; workerId?: number }) => {
      const query = new URLSearchParams();
      if (params?.status) query.set('status', params.status);
      if (params?.date) query.set('date', params.date);
      if (params?.workerId) query.set('workerId', String(params.workerId));
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
