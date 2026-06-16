import { Router } from 'express';
import {
  getWorkers,
  getWorkerById,
  addWorker,
  updateWorker,
  deleteWorker,
  getOrders,
  getWorkerAvailability,
} from '../db/index.js';
import type { Worker, WorkerWithScore } from '../../shared/types.js';

const router = Router();

router.get('/', (req, res) => {
  const { skill, status } = req.query;
  let workers = getWorkers();
  
  if (skill && typeof skill === 'string') {
    workers = workers.filter(w => w.skills.includes(skill));
  }
  
  if (status && typeof status === 'string') {
    workers = workers.filter(w => w.status === status);
  }
  
  res.json(workers);
});

router.get('/available', (req, res) => {
  const { serviceType, startTime, endTime, orderId } = req.query;
  
  if (!serviceType || !startTime || !endTime) {
    return res.status(400).json({ error: '缺少必要参数: serviceType, startTime, endTime' });
  }
  
  const start = new Date(startTime as string);
  const end = new Date(endTime as string);
  const excludeOrderId = orderId ? parseInt(orderId as string) : undefined;
  
  const { available, unavailable } = getWorkerAvailability(
    serviceType as string,
    startTime as string,
    endTime as string,
    excludeOrderId
  );
  
  const allOrders = getOrders();
  
  const workersWithScore: WorkerWithScore[] = available.map(worker => {
    const completedOrders = allOrders.filter(o => 
      o.workerId === worker.id && o.status === 'completed'
    ).length;
    
    const score = completedOrders * 10 + worker.hourlyRate;
    
    return {
      ...worker,
      matchScore: Math.max(10, score),
    } as WorkerWithScore;
  }).sort((a, b) => b.matchScore - a.matchScore);
  
  res.json({
    available: workersWithScore,
    unavailable: unavailable.map(u => ({
      workerId: u.worker.id,
      workerName: u.worker.name,
      reason: u.reason,
      reasonType: u.reasonType,
      conflictOrderId: u.conflictOrderId,
      skills: u.worker.skills,
    })),
  });
});

router.get('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const worker = getWorkerById(id);
  
  if (!worker) {
    return res.status(404).json({ error: '阿姨不存在' });
  }
  
  res.json(worker);
});

router.post('/', (req, res) => {
  const { name, phone, skills, hireDate, insuranceExpiryDate, status, hourlyRate } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: '姓名不能为空' });
  }
  
  const newWorker = addWorker({
    name,
    phone: phone || '',
    skills: skills || [],
    hireDate: hireDate || new Date().toISOString().split('T')[0],
    insuranceExpiryDate: insuranceExpiryDate || '',
    status: status || 'active',
    hourlyRate: hourlyRate || 25,
  });
  
  res.status(201).json(newWorker);
});

router.put('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const updates = req.body;
  
  const updatedWorker = updateWorker(id, updates);
  
  if (!updatedWorker) {
    return res.status(404).json({ error: '阿姨不存在' });
  }
  
  res.json(updatedWorker);
});

router.delete('/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const success = deleteWorker(id);
  
  if (!success) {
    return res.status(404).json({ error: '阿姨不存在' });
  }
  
  res.json({ message: '删除成功' });
});

export default router;
