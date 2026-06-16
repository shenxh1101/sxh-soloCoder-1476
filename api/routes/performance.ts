import { Router } from 'express';
import { getWorkers, getOrders, getWorkerById } from '../db/index.js';
import type { MonthlyPerformance } from '../../shared/types.js';

const router = Router();

const POSITIVE_BONUS = 50;
const NEGATIVE_PENALTY = 30;

router.get('/', (req, res) => {
  const { month } = req.query;
  
  const targetMonth = month ? String(month) : getCurrentMonth();
  
  const workers = getWorkers();
  const orders = getOrders();
  
  const performances: MonthlyPerformance[] = workers.map(worker => {
    const workerOrders = orders.filter(o => {
      if (o.workerId !== worker.id) return false;
      if (o.status !== 'completed') return false;
      const orderMonth = new Date(o.scheduledStartTime).toISOString().slice(0, 7);
      return orderMonth === targetMonth;
    });
    
    const totalHours = workerOrders.reduce((sum, o) => sum + (o.workHours || 0), 0);
    const positiveReviews = workerOrders.filter(o => o.review?.rating === 'positive').length;
    const negativeReviews = workerOrders.filter(o => o.review?.rating === 'negative').length;
    
    const baseSalary = Math.round(totalHours * worker.hourlyRate);
    const bonus = positiveReviews * POSITIVE_BONUS - negativeReviews * NEGATIVE_PENALTY;
    const totalSalary = Math.max(0, baseSalary + bonus);
    
    return {
      workerId: worker.id,
      workerName: worker.name,
      month: targetMonth,
      totalOrders: workerOrders.length,
      totalHours: Math.round(totalHours * 10) / 10,
      positiveReviews,
      negativeReviews,
      baseSalary,
      bonus,
      totalSalary,
    };
  });
  
  performances.sort((a, b) => b.totalSalary - a.totalSalary);
  
  res.json(performances);
});

router.get('/workers/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { month } = req.query;
  
  const targetMonth = month ? String(month) : getCurrentMonth();
  
  const worker = getWorkerById(id);
  if (!worker) {
    return res.status(404).json({ error: '阿姨不存在' });
  }
  
  const orders = getOrders().filter(o => {
    if (o.workerId !== id) return false;
    if (o.status !== 'completed') return false;
    const orderMonth = new Date(o.scheduledStartTime).toISOString().slice(0, 7);
    return orderMonth === targetMonth;
  });
  
  const totalHours = orders.reduce((sum, o) => sum + (o.workHours || 0), 0);
  const positiveReviews = orders.filter(o => o.review?.rating === 'positive').length;
  const negativeReviews = orders.filter(o => o.review?.rating === 'negative').length;
  
  const baseSalary = Math.round(totalHours * worker.hourlyRate);
  const bonus = positiveReviews * POSITIVE_BONUS - negativeReviews * NEGATIVE_PENALTY;
  const totalSalary = Math.max(0, baseSalary + bonus);
  
  res.json({
    workerId: worker.id,
    workerName: worker.name,
    month: targetMonth,
    totalOrders: orders.length,
    totalHours: Math.round(totalHours * 10) / 10,
    positiveReviews,
    negativeReviews,
    baseSalary,
    bonus,
    totalSalary,
    orders,
  });
});

function getCurrentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export default router;
