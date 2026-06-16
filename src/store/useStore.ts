import { create } from 'zustand';
import type { Worker, Order, MonthlyPerformance } from '../../shared/types';
import { api } from '../lib/api';

interface AppState {
  workers: Worker[];
  orders: Order[];
  loading: boolean;
  error: string | null;
  
  fetchWorkers: () => Promise<void>;
  fetchOrders: (params?: { status?: string; date?: string; workerId?: number }) => Promise<void>;
  addWorker: (data: Partial<Worker>) => Promise<Worker>;
  updateWorker: (id: number, data: Partial<Worker>) => Promise<Worker>;
  deleteWorker: (id: number) => Promise<void>;
  addOrder: (data: Partial<Order>) => Promise<Order>;
  updateOrder: (id: number, data: Partial<Order>) => Promise<Order>;
  startOrder: (id: number) => Promise<Order>;
  endOrder: (id: number) => Promise<Order>;
  addReview: (id: number, data: { rating: string; comment?: string }) => Promise<Order>;
}

export const useStore = create<AppState>((set, get) => ({
  workers: [],
  orders: [],
  loading: false,
  error: null,

  fetchWorkers: async () => {
    set({ loading: true, error: null });
    try {
      const workers = await api.workers.list();
      set({ workers, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  fetchOrders: async (params) => {
    set({ loading: true, error: null });
    try {
      const orders = await api.orders.list(params);
      set({ orders, loading: false });
    } catch (e: any) {
      set({ error: e.message, loading: false });
    }
  },

  addWorker: async (data) => {
    set({ loading: true, error: null });
    try {
      const worker = await api.workers.create(data);
      set(state => ({ workers: [...state.workers, worker], loading: false }));
      return worker;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  updateWorker: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const worker = await api.workers.update(id, data);
      set(state => ({
        workers: state.workers.map(w => w.id === id ? worker : w),
        loading: false,
      }));
      return worker;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  deleteWorker: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.workers.delete(id);
      set(state => ({
        workers: state.workers.filter(w => w.id !== id),
        loading: false,
      }));
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  addOrder: async (data) => {
    set({ loading: true, error: null });
    try {
      const order = await api.orders.create(data);
      set(state => ({ orders: [order, ...state.orders], loading: false }));
      return order;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  updateOrder: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const order = await api.orders.update(id, data);
      set(state => ({
        orders: state.orders.map(o => o.id === id ? order : o),
        loading: false,
      }));
      return order;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  startOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const order = await api.orders.start(id);
      set(state => ({
        orders: state.orders.map(o => o.id === id ? order : o),
        loading: false,
      }));
      return order;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  endOrder: async (id) => {
    set({ loading: true, error: null });
    try {
      const order = await api.orders.end(id);
      set(state => ({
        orders: state.orders.map(o => o.id === id ? order : o),
        loading: false,
      }));
      return order;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },

  addReview: async (id, data) => {
    set({ loading: true, error: null });
    try {
      const order = await api.orders.review(id, data);
      set(state => ({
        orders: state.orders.map(o => o.id === id ? order : o),
        loading: false,
      }));
      return order;
    } catch (e: any) {
      set({ error: e.message, loading: false });
      throw e;
    }
  },
}));
