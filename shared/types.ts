export type WorkerStatus = 'active' | 'inactive';

export interface Worker {
  id: number;
  name: string;
  phone: string;
  avatar?: string;
  skills: string[];
  hireDate: string;
  insuranceExpiryDate: string;
  status: WorkerStatus;
  hourlyRate: number;
  createdAt: string;
  updatedAt: string;
}

export type OrderStatus = 'pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export type ReviewRating = 'positive' | 'negative' | 'neutral';

export interface OrderReview {
  rating: ReviewRating;
  comment?: string;
}

export interface Order {
  id: number;
  customerName: string;
  customerPhone: string;
  serviceAddress: string;
  serviceType: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  actualStartTime?: string;
  actualEndTime?: string;
  workHours?: number;
  workerId?: number;
  status: OrderStatus;
  notes?: string;
  review?: OrderReview;
  createdAt: string;
  updatedAt: string;
}

export interface MonthlyPerformance {
  workerId: number;
  workerName: string;
  month: string;
  totalOrders: number;
  totalHours: number;
  positiveReviews: number;
  negativeReviews: number;
  baseSalary: number;
  bonus: number;
  totalSalary: number;
}

export interface WorkerWithScore extends Worker {
  matchScore: number;
}

export interface Customer {
  id: number;
  name: string;
  phone: string;
  addresses: string[];
  totalOrders: number;
  lastServiceDate?: string;
  createdAt: string;
  updatedAt: string;
}
