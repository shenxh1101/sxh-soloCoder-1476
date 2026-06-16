import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getOrders,
  getWorkers,
  getWorkerById,
  getFollowUpsByCustomerPhone,
} from '../db/index.js';

const router = Router();

function buildCustomerProfile(customer: any) {
  const customerOrders = getOrders().filter(o => o.customerPhone === customer.phone);
  const completedOrders = customerOrders.filter(o => o.status === 'completed');
  const sorted = [...customerOrders].sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime());

  const serviceTypeCount: Record<string, number> = {};
  const workerCount: Record<number, number> = {};
  let totalHours = 0;
  let totalSpending = 0;
  let positiveReviews = 0;
  let negativeReviews = 0;
  let neutralReviews = 0;

  for (const order of completedOrders) {
    serviceTypeCount[order.serviceType] = (serviceTypeCount[order.serviceType] || 0) + 1;
    if (order.workerId) {
      workerCount[order.workerId] = (workerCount[order.workerId] || 0) + 1;
    }
    if (order.workHours) {
      totalHours += order.workHours;
    }
    const worker = order.workerId ? getWorkerById(order.workerId) : null;
    if (worker && order.workHours) {
      totalSpending += order.workHours * worker.hourlyRate;
    }
    if (order.review) {
      if (order.review.rating === 'positive') positiveReviews++;
      else if (order.review.rating === 'negative') negativeReviews++;
      else neutralReviews++;
    }
  }

  let frequentServiceType: string | undefined;
  let frequentWorkerId: number | undefined;
  let frequentWorkerName: string | undefined;

  const sortedTypes = Object.entries(serviceTypeCount).sort((a, b) => b[1] - a[1]);
  if (sortedTypes.length > 0) frequentServiceType = sortedTypes[0][0];

  const sortedWorkers = Object.entries(workerCount).sort((a, b) => b[1] - a[1]);
  if (sortedWorkers.length > 0) {
    frequentWorkerId = parseInt(sortedWorkers[0][0]);
    const w = getWorkerById(frequentWorkerId);
    frequentWorkerName = w?.name;
  }

  return {
    ...customer,
    totalOrders: customerOrders.length,
    lastServiceDate: sorted.length > 0 ? sorted[0].scheduledStartTime : customer.lastServiceDate,
    frequentServiceType,
    frequentWorkerId,
    frequentWorkerName,
    totalHours: Math.round(totalHours * 10) / 10,
    totalSpending: Math.round(totalSpending),
    positiveReviews,
    negativeReviews,
    neutralReviews,
  };
}

router.get('/', (_req, res) => {
  const customers = getCustomers().map(c => {
    const customerOrders = getOrders().filter(o => o.customerPhone === c.phone);
    return {
      ...c,
      totalOrders: customerOrders.length,
      lastServiceDate: customerOrders.length > 0
        ? customerOrders.sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())[0].scheduledStartTime
        : c.lastServiceDate,
    };
  });
  res.json(customers);
});

router.get('/phone/:phone', (req, res) => {
  const phone = req.params.phone;
  const customer = getCustomerByPhone(phone);

  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const profile = buildCustomerProfile(customer);
  const customerOrders = getOrders().filter(o => o.customerPhone === customer.phone)
    .sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime());

  res.json({
    ...profile,
    recentOrders: customerOrders.slice(0, 5),
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customer = getCustomerById(id);

  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const profile = buildCustomerProfile(customer);
  const customerOrders = getOrders().filter(o => o.customerPhone === customer.phone)
    .sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime());
  const followups = getFollowUpsByCustomerPhone(customer.phone);

  res.json({
    ...profile,
    orders: customerOrders,
    followups,
  });
});

router.post('/', (req, res) => {
  const { name, phone, addresses } = req.body;

  if (!name || !phone) {
    return res.status(400).json({ error: '姓名和电话不能为空' });
  }

  const existing = getCustomerByPhone(phone);
  if (existing) {
    return res.status(409).json({ error: '该手机号已存在' });
  }

  const newCustomer = addCustomer({
    name,
    phone,
    addresses: addresses || [],
    totalOrders: 0,
  });

  res.status(201).json(newCustomer);
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;

  const updatedCustomer = updateCustomer(id, updates);

  if (!updatedCustomer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  res.json(updatedCustomer);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const success = deleteCustomer(id);

  if (!success) {
    return res.status(404).json({ error: '客户不存在' });
  }

  res.json({ message: '删除成功' });
});

export default router;
