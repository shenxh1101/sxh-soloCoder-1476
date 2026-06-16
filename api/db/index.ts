import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Worker, Order, Customer, FollowUp, CallbackReminder } from '../../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../data');
const WORKERS_FILE = path.join(DATA_DIR, 'workers.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const CUSTOMERS_FILE = path.join(DATA_DIR, 'customers.json');
const FOLLOWUPS_FILE = path.join(DATA_DIR, 'followups.json');
const REMINDERS_FILE = path.join(DATA_DIR, 'reminders.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function readJSONFile<T>(filePath: string, defaultValue: T): T {
  ensureDataDir();
  if (!fs.existsSync(filePath)) {
    return defaultValue;
  }
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(content) as T;
  } catch {
    return defaultValue;
  }
}

function writeJSONFile<T>(filePath: string, data: T): void {
  ensureDataDir();
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export interface Database {
  workers: Worker[];
  orders: Order[];
  customers: Customer[];
  followups: FollowUp[];
  reminders: CallbackReminder[];
  nextWorkerId: number;
  nextOrderId: number;
  nextCustomerId: number;
  nextFollowUpId: number;
  nextReminderId: number;
}

const db: Database = {
  workers: [],
  orders: [],
  customers: [],
  followups: [],
  reminders: [],
  nextWorkerId: 1,
  nextOrderId: 1,
  nextCustomerId: 1,
  nextFollowUpId: 1,
  nextReminderId: 1,
};

export function loadDatabase(): void {
  const workers = readJSONFile<Worker[]>(WORKERS_FILE, []);
  const orders = readJSONFile<Order[]>(ORDERS_FILE, []);
  const customers = readJSONFile<Customer[]>(CUSTOMERS_FILE, []);
  const followups = readJSONFile<FollowUp[]>(FOLLOWUPS_FILE, []);
  const reminders = readJSONFile<CallbackReminder[]>(REMINDERS_FILE, []);

  if (workers.length === 0 && orders.length === 0 && customers.length === 0) {
    seedMockData();
  } else {
    db.workers = workers;
    db.orders = orders;
    db.customers = customers;
    db.followups = followups;
    db.reminders = reminders;
    db.nextWorkerId = workers.length > 0 ? Math.max(...workers.map(w => w.id)) + 1 : 1;
    db.nextOrderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1;
    db.nextCustomerId = customers.length > 0 ? Math.max(...customers.map(c => c.id)) + 1 : 1;
    db.nextFollowUpId = followups.length > 0 ? Math.max(...followups.map(f => f.id)) + 1 : 1;
    db.nextReminderId = reminders.length > 0 ? Math.max(...reminders.map(r => r.id)) + 1 : 1;
  }
}

export function saveDatabase(): void {
  writeJSONFile(WORKERS_FILE, db.workers);
  writeJSONFile(ORDERS_FILE, db.orders);
  writeJSONFile(CUSTOMERS_FILE, db.customers);
  writeJSONFile(FOLLOWUPS_FILE, db.followups);
  writeJSONFile(REMINDERS_FILE, db.reminders);
}

function seedMockData(): void {
  const skills = ['日常保洁', '深度保洁', '擦玻璃', '地板打蜡', '油烟机清洗'];
  
  const workerNames = [
    { name: '王阿姨', skills: ['日常保洁', '深度保洁', '擦玻璃'], rate: 25 },
    { name: '李阿姨', skills: ['日常保洁', '油烟机清洗', '擦玻璃'], rate: 28 },
    { name: '张阿姨', skills: ['深度保洁', '地板打蜡', '擦玻璃'], rate: 30 },
    { name: '刘阿姨', skills: ['日常保洁', '深度保洁'], rate: 25 },
    { name: '陈阿姨', skills: ['油烟机清洗', '擦玻璃', '深度保洁'], rate: 28 },
    { name: '赵阿姨', skills: ['日常保洁', '地板打蜡'], rate: 26 },
    { name: '孙阿姨', skills: ['深度保洁', '油烟机清洗'], rate: 27 },
    { name: '周阿姨', skills: ['日常保洁', '擦玻璃', '深度保洁'], rate: 26 },
    { name: '吴阿姨', skills: ['地板打蜡', '深度保洁', '油烟机清洗'], rate: 30 },
    { name: '郑阿姨', skills: ['日常保洁', '擦玻璃'], rate: 24 },
  ];

  const today = new Date();
  
  db.workers = workerNames.map((w, index) => {
    const hireDate = new Date(today);
    hireDate.setMonth(hireDate.getMonth() - (index + 1) * 3);
    
    const insuranceDate = new Date(today);
    if (index < 3) {
      insuranceDate.setDate(insuranceDate.getDate() + (index + 1) * 7);
    } else {
      insuranceDate.setMonth(insuranceDate.getMonth() + index + 2);
    }
    
    return {
      id: index + 1,
      name: w.name,
      phone: `138${String(10000000 + index * 111).slice(0, 8)}`,
      skills: w.skills,
      hireDate: hireDate.toISOString().split('T')[0],
      insuranceExpiryDate: insuranceDate.toISOString().split('T')[0],
      status: 'active' as const,
      hourlyRate: w.rate,
      createdAt: today.toISOString(),
      updatedAt: today.toISOString(),
    };
  });
  db.nextWorkerId = 11;

  const customerDefs = [
    { name: '张先生', phone: '13900001111', address: '朝阳区建国路88号' },
    { name: '李女士', phone: '13900002222', address: '海淀区中关村大街1号' },
    { name: '王先生', phone: '13900003333', address: '西城区金融街15号' },
    { name: '赵女士', phone: '13900004444', address: '东城区东长安街1号' },
    { name: '刘先生', phone: '13900005555', address: '丰台区方庄路5号' },
  ];

  db.customers = customerDefs.map((c, index) => ({
    id: index + 1,
    name: c.name,
    phone: c.phone,
    addresses: [c.address],
    totalOrders: 0,
    createdAt: today.toISOString(),
    updatedAt: today.toISOString(),
  }));
  db.nextCustomerId = customerDefs.length + 1;

  const serviceTypes = ['日常保洁', '深度保洁', '擦玻璃', '地板打蜡', '油烟机清洗'];
  const statuses: ('pending' | 'assigned' | 'in_progress' | 'completed' | 'cancelled')[] = [
    'pending', 'assigned', 'in_progress', 'completed', 'completed', 'completed', 'completed', 'cancelled'
  ];

  let orderId = 1;
  
  for (let dayOffset = -14; dayOffset <= 1; dayOffset++) {
    const orderDate = new Date(today);
    orderDate.setDate(orderDate.getDate() + dayOffset);
    
    const ordersPerDay = dayOffset >= 0 ? 2 + Math.floor(Math.random() * 2) : 1 + Math.floor(Math.random() * 2);
    
    for (let i = 0; i < ordersPerDay; i++) {
      const customer = customerDefs[Math.floor(Math.random() * customerDefs.length)];
      const serviceType = serviceTypes[Math.floor(Math.random() * serviceTypes.length)];
      const status = dayOffset < 0 ? 'completed' : statuses[Math.floor(Math.random() * statuses.length)];
      
      const startHour = 8 + Math.floor(Math.random() * 8);
      const duration = 2 + Math.floor(Math.random() * 3);
      
      const startTime = new Date(orderDate);
      startTime.setHours(startHour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(startHour + duration);
      
      let workerId: number | undefined;
      let actualStartTime: string | undefined;
      let actualEndTime: string | undefined;
      let workHours: number | undefined;
      let review: Order['review'];
      
      if (status !== 'pending') {
        const eligibleWorkers = db.workers.filter(w => w.skills.includes(serviceType));
        if (eligibleWorkers.length > 0) {
          workerId = eligibleWorkers[Math.floor(Math.random() * eligibleWorkers.length)].id;
        }
      }
      
      if (status === 'in_progress') {
        actualStartTime = startTime.toISOString();
      } else if (status === 'completed') {
        actualStartTime = startTime.toISOString();
        const actualDuration = duration - 0.5 + Math.random();
        actualEndTime = new Date(startTime.getTime() + actualDuration * 60 * 60 * 1000).toISOString();
        workHours = Math.round(actualDuration * 10) / 10;
        
        if (Math.random() > 0.3) {
          const isPositive = Math.random() > 0.2;
          review = {
            rating: isPositive ? 'positive' : (Math.random() > 0.5 ? 'negative' : 'neutral'),
            comment: isPositive ? '服务很专业，打扫得很干净' : '有些角落没打扫到',
          };
        }
      }
      
      db.orders.push({
        id: orderId++,
        customerName: customer.name,
        customerPhone: customer.phone,
        serviceAddress: customer.address,
        serviceType,
        scheduledStartTime: startTime.toISOString(),
        scheduledEndTime: endTime.toISOString(),
        actualStartTime,
        actualEndTime,
        workHours,
        workerId,
        status,
        notes: dayOffset === 0 ? '客户要求自带清洁工具' : undefined,
        review,
        createdAt: new Date(startTime.getTime() - 86400000).toISOString(),
        updatedAt: today.toISOString(),
      });
    }
  }
  
  db.nextOrderId = orderId;
  saveDatabase();
}

export function getWorkers(): Worker[] {
  return db.workers;
}

export function getWorkerById(id: number): Worker | undefined {
  return db.workers.find(w => w.id === id);
}

export function addWorker(worker: Omit<Worker, 'id' | 'createdAt' | 'updatedAt'>): Worker {
  const newWorker: Worker = {
    ...worker,
    id: db.nextWorkerId++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.workers.push(newWorker);
  saveDatabase();
  return newWorker;
}

export function updateWorker(id: number, updates: Partial<Worker>): Worker | undefined {
  const index = db.workers.findIndex(w => w.id === id);
  if (index === -1) return undefined;
  
  db.workers[index] = {
    ...db.workers[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  return db.workers[index];
}

export function deleteWorker(id: number): boolean {
  const index = db.workers.findIndex(w => w.id === id);
  if (index === -1) return false;
  db.workers.splice(index, 1);
  saveDatabase();
  return true;
}

export function getOrders(): Order[] {
  return db.orders.sort((a, b) => 
    new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime()
  );
}

export function getOrderById(id: number): Order | undefined {
  return db.orders.find(o => o.id === id);
}

export function addOrder(order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Order {
  const newOrder: Order = {
    ...order,
    id: db.nextOrderId++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.orders.push(newOrder);
  saveDatabase();
  return newOrder;
}

export function updateOrder(id: number, updates: Partial<Order>): Order | undefined {
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) return undefined;
  
  db.orders[index] = {
    ...db.orders[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  return db.orders[index];
}

export function deleteOrder(id: number): boolean {
  const index = db.orders.findIndex(o => o.id === id);
  if (index === -1) return false;
  db.orders.splice(index, 1);
  saveDatabase();
  return true;
}

export function getCustomers(): Customer[] {
  return db.customers;
}

export function getCustomerById(id: number): Customer | undefined {
  return db.customers.find(c => c.id === id);
}

export function getCustomerByPhone(phone: string): Customer | undefined {
  return db.customers.find(c => c.phone === phone);
}

export function addCustomer(customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
  const newCustomer: Customer = {
    ...customer,
    id: db.nextCustomerId++,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  db.customers.push(newCustomer);
  saveDatabase();
  return newCustomer;
}

export function updateCustomer(id: number, updates: Partial<Customer>): Customer | undefined {
  const index = db.customers.findIndex(c => c.id === id);
  if (index === -1) return undefined;

  db.customers[index] = {
    ...db.customers[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  return db.customers[index];
}

export function deleteCustomer(id: number): boolean {
  const index = db.customers.findIndex(c => c.id === id);
  if (index === -1) return false;
  db.customers.splice(index, 1);
  saveDatabase();
  return true;
}

export function upsertCustomerFromOrder(order: Order): void {
  const phone = order.customerPhone;
  if (!phone) return;

  let customer = db.customers.find(c => c.phone === phone);

  if (!customer) {
    customer = addCustomer({
      name: order.customerName,
      phone,
      addresses: order.serviceAddress ? [order.serviceAddress] : [],
      totalOrders: 1,
      lastServiceDate: order.scheduledStartTime,
    });
  } else {
    const addresses = [...customer.addresses];
    if (order.serviceAddress && !addresses.includes(order.serviceAddress)) {
      addresses.push(order.serviceAddress);
    }
    const customerOrders = db.orders.filter(o => o.customerPhone === phone);
    const lastDate = customerOrders.length > 0
      ? customerOrders.sort((a, b) => new Date(b.scheduledStartTime).getTime() - new Date(a.scheduledStartTime).getTime())[0].scheduledStartTime
      : order.scheduledStartTime;

    updateCustomer(customer.id, {
      name: order.customerName,
      addresses,
      totalOrders: customerOrders.length,
      lastServiceDate: lastDate,
    });
  }
}

export function getFollowUpsByOrderId(orderId: number): FollowUp[] {
  return db.followups
    .filter(f => f.orderId === orderId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function getFollowUpsByCustomerPhone(phone: string): FollowUp[] {
  const orderIds = db.orders
    .filter(o => o.customerPhone === phone)
    .map(o => o.id);
  return db.followups
    .filter(f => orderIds.includes(f.orderId))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function addFollowUp(followUp: Omit<FollowUp, 'id' | 'createdAt'>): FollowUp {
  const newFollowUp: FollowUp = {
    ...followUp,
    id: db.nextFollowUpId++,
    createdAt: new Date().toISOString(),
  };
  db.followups.push(newFollowUp);
  saveDatabase();
  return newFollowUp;
}

export function updateFollowUp(id: number, content: string): FollowUp | undefined {
  const index = db.followups.findIndex(f => f.id === id);
  if (index === -1) return undefined;
  db.followups[index] = {
    ...db.followups[index],
    content,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  return db.followups[index];
}

export function getReminders(): CallbackReminder[] {
  return db.reminders.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getRemindersByCustomer(customerId: number): CallbackReminder[] {
  return db.reminders
    .filter(r => r.customerId === customerId)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function getPendingReminders(): CallbackReminder[] {
  return db.reminders
    .filter(r => r.status === 'pending')
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
}

export function addReminder(reminder: Omit<CallbackReminder, 'id' | 'createdAt'>): CallbackReminder {
  const newReminder: CallbackReminder = {
    ...reminder,
    id: db.nextReminderId++,
    createdAt: new Date().toISOString(),
  };
  db.reminders.push(newReminder);
  saveDatabase();
  return newReminder;
}

export function updateReminder(id: number, updates: Partial<CallbackReminder>): CallbackReminder | undefined {
  const index = db.reminders.findIndex(r => r.id === id);
  if (index === -1) return undefined;
  db.reminders[index] = {
    ...db.reminders[index],
    ...updates,
    id,
    updatedAt: new Date().toISOString(),
  };
  saveDatabase();
  return db.reminders[index];
}

export function getSpendingTrend(phone: string): Array<{ month: string; orders: number; hours: number; spending: number }> {
  const customerOrders = db.orders.filter(o => o.customerPhone === phone && o.status === 'completed');
  const monthMap: Record<string, { orders: number; hours: number; spending: number }> = {};

  for (const order of customerOrders) {
    const month = new Date(order.scheduledStartTime).toISOString().slice(0, 7);
    if (!monthMap[month]) monthMap[month] = { orders: 0, hours: 0, spending: 0 };
    monthMap[month].orders++;
    if (order.workHours) {
      monthMap[month].hours += order.workHours;
      const worker = order.workerId ? getWorkerById(order.workerId) : null;
      if (worker) monthMap[month].spending += order.workHours * worker.hourlyRate;
    }
  }

  return Object.entries(monthMap)
    .map(([month, data]) => ({
      month,
      orders: data.orders,
      hours: Math.round(data.hours * 10) / 10,
      spending: Math.round(data.spending),
    }))
    .sort((a, b) => a.month.localeCompare(b.month));
}

export function getWorkerAvailability(
  serviceType: string,
  startTime: string,
  endTime: string,
  excludeOrderId?: number
): { available: Worker[]; unavailable: Array<{ worker: Worker; reason: string; reasonType: 'skill_mismatch' | 'time_conflict' | 'inactive'; conflictOrderId?: number }> } {
  const start = new Date(startTime);
  const end = new Date(endTime);
  const allWorkers = getWorkers();
  const available: Worker[] = [];
  const unavailable: Array<{ worker: Worker; reason: string; reasonType: 'skill_mismatch' | 'time_conflict' | 'inactive'; conflictOrderId?: number }> = [];

  for (const worker of allWorkers) {
    if (worker.status !== 'active') {
      unavailable.push({ worker, reason: '该阿姨当前状态为停用', reasonType: 'inactive' });
      continue;
    }
    if (!worker.skills.includes(serviceType)) {
      unavailable.push({ worker, reason: `技能不匹配（需${serviceType}，该阿姨擅长：${worker.skills.join('、')}）`, reasonType: 'skill_mismatch' });
      continue;
    }
    const conflict = db.orders.find(order => {
      if (order.workerId !== worker.id) return false;
      if (order.status === 'cancelled' || order.status === 'completed') return false;
      if (excludeOrderId && order.id === excludeOrderId) return false;
      const orderStart = new Date(order.scheduledStartTime);
      const orderEnd = new Date(order.scheduledEndTime);
      return start < orderEnd && end > orderStart;
    });
    if (conflict) {
      unavailable.push({
        worker,
        reason: `时间冲突（与订单 #${conflict.id} ${new Date(conflict.scheduledStartTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}-${new Date(conflict.scheduledEndTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}重叠）`,
        reasonType: 'time_conflict',
        conflictOrderId: conflict.id,
      });
      continue;
    }
    available.push(worker);
  }

  return { available, unavailable };
}
