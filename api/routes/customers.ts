import { Router } from 'express';
import {
  getCustomers,
  getCustomerById,
  getCustomerByPhone,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  getOrders,
} from '../db/index.js';

const router = Router();

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

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const customer = getCustomerById(id);

  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const customerOrders = getOrders().filter(o => o.customerPhone === customer.phone);

  res.json({
    ...customer,
    totalOrders: customerOrders.length,
    lastServiceDate: customerOrders.length > 0
      ? customerOrders.sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())[0].scheduledStartTime
      : customer.lastServiceDate,
  });
});

router.get('/phone/:phone', (req, res) => {
  const phone = req.params.phone;
  const customer = getCustomerByPhone(phone);

  if (!customer) {
    return res.status(404).json({ error: '客户不存在' });
  }

  const customerOrders = getOrders().filter(o => o.customerPhone === customer.phone);

  res.json({
    ...customer,
    totalOrders: customerOrders.length,
    lastServiceDate: customerOrders.length > 0
      ? customerOrders.sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())[0].scheduledStartTime
      : customer.lastServiceDate,
    recentOrders: customerOrders.sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()).slice(0, 5),
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
