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
  getRemindersByCustomer,
  getPendingReminders,
  addReminder,
  updateReminder,
  getSpendingTrend,
} from '../db/index.js';
import type { ReminderType, ReminderStatus } from '../../shared/types.js';

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

router.get('/reminders/pending', (_req, res) => {
  const reminders = getPendingReminders();
  const enriched = reminders.map(r => {
    const customer = getCustomerById(r.customerId);
    return {
      ...r,
      customerName: customer?.name || '未知客户',
      customerPhone: customer?.phone || '',
    };
  });
  res.json(enriched);
});

router.get('/:id/spending-trend', (req, res) => {
  const id = parseInt(req.params.id);
  const customer = getCustomerById(id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  res.json(getSpendingTrend(customer.phone));
});

router.get('/:id/reminders', (req, res) => {
  const id = parseInt(req.params.id);
  const customer = getCustomerById(id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }
  res.json(getRemindersByCustomer(id));
});

router.post('/:id/reminders', (req, res) => {
  const id = parseInt(req.params.id);
  const customer = getCustomerById(id);
  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const { type, title, description, dueDate, orderId } = req.body;
  if (!type || !title || !dueDate) {
    return res.status(400).json({ error: '类型、标题和到期日期不能为空' });
  }

  const validTypes: ReminderType[] = ['post_service_callback', 'insurance_renewal', 'inactive_customer', 'custom'];
  if (!validTypes.includes(type as ReminderType)) {
    return res.status(400).json({ error: '无效的提醒类型' });
  }

  const reminder = addReminder({
    customerId: id,
    type: type as ReminderType,
    title,
    description,
    dueDate,
    status: 'pending',
    orderId,
    createdBy: '管理员',
  });

  res.status(201).json(reminder);
});

router.put('/:customerId/reminders/:reminderId', (req, res) => {
  const reminderId = parseInt(req.params.reminderId);
  const { status, title, description, dueDate } = req.body;

  if (status) {
    const validStatuses: ReminderStatus[] = ['pending', 'done', 'skipped'];
    if (!validStatuses.includes(status as ReminderStatus)) {
      return res.status(400).json({ error: '无效的状态' });
    }
  }

  const updates: any = {};
  if (status) updates.status = status;
  if (title) updates.title = title;
  if (description !== undefined) updates.description = description;
  if (dueDate) updates.dueDate = dueDate;
  if (status === 'done') updates.completedAt = new Date().toISOString();

  const updated = updateReminder(reminderId, updates);
  if (!updated) {
    return res.status(404).json({ error: '提醒不存在' });
  }

  res.json(updated);
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
