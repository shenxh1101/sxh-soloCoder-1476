import { Router } from 'express';
import {
  getOrders,
  getOrderById,
  addOrder,
  updateOrder,
  deleteOrder,
} from '../db/index.js';
import type { OrderStatus, ReviewRating } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  const { status, date, workerId } = req.query;
  let orders = getOrders();
  
  if (status && typeof status === 'string') {
    orders = orders.filter(o => o.status === status);
  }
  
  if (date && typeof date === 'string') {
    const targetDate = new Date(date).toDateString();
    orders = orders.filter(o => 
      new Date(o.scheduledStartTime).toDateString() === targetDate
    );
  }
  
  if (workerId && typeof workerId === 'string') {
    const wid = parseInt(workerId);
    orders = orders.filter(o => o.workerId === wid);
  }
  
  res.json(orders);
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const order = getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  res.json(order);
});

router.post('/', (req, res) => {
  const {
    customerName,
    customerPhone,
    serviceAddress,
    serviceType,
    scheduledStartTime,
    scheduledEndTime,
    workerId,
    notes,
  } = req.body;
  
  if (!customerName || !serviceType || !scheduledStartTime || !scheduledEndTime) {
    return res.status(400).json({ error: '缺少必要参数' });
  }
  
  const status: OrderStatus = workerId ? 'assigned' : 'pending';
  
  const newOrder = addOrder({
    customerName,
    customerPhone: customerPhone || '',
    serviceAddress: serviceAddress || '',
    serviceType,
    scheduledStartTime,
    scheduledEndTime,
    workerId,
    status,
    notes,
  });
  
  res.status(201).json(newOrder);
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  
  if (updates.workerId) {
    updates.status = 'assigned';
  }
  
  const updatedOrder = updateOrder(id, updates);
  
  if (!updatedOrder) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  res.json(updatedOrder);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const success = deleteOrder(id);
  
  if (!success) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  res.json({ message: '删除成功' });
});

router.post('/:id/start', (req, res) => {
  const id = parseInt(req.params.id);
  const order = getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.status !== 'assigned') {
    return res.status(400).json({ error: '订单状态不支持开始服务' });
  }
  
  const actualStartTime = new Date().toISOString();
  
  const updatedOrder = updateOrder(id, {
    status: 'in_progress',
    actualStartTime,
  });
  
  res.json(updatedOrder);
});

router.post('/:id/end', (req, res) => {
  const id = parseInt(req.params.id);
  const order = getOrderById(id);
  
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  if (order.status !== 'in_progress') {
    return res.status(400).json({ error: '订单状态不支持结束服务' });
  }
  
  const actualEndTime = new Date().toISOString();
  const start = new Date(order.actualStartTime!);
  const end = new Date(actualEndTime);
  const workHours = Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60) * 10) / 10;
  
  const updatedOrder = updateOrder(id, {
    status: 'completed',
    actualEndTime,
    workHours,
  });
  
  res.json(updatedOrder);
});

router.post('/:id/review', (req, res) => {
  const id = parseInt(req.params.id);
  const { rating, comment } = req.body;
  
  if (!rating) {
    return res.status(400).json({ error: '评价等级不能为空' });
  }
  
  const validRatings: ReviewRating[] = ['positive', 'negative', 'neutral'];
  if (!validRatings.includes(rating as ReviewRating)) {
    return res.status(400).json({ error: '无效的评价等级' });
  }
  
  const order = getOrderById(id);
  if (!order) {
    return res.status(404).json({ error: '订单不存在' });
  }
  
  const updatedOrder = updateOrder(id, {
    review: { rating: rating as ReviewRating, comment },
  });
  
  res.json(updatedOrder);
});

export default router;
