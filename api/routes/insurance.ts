import { Router } from 'express';
import { getWorkers } from '../db/index.js';

const router = Router();

router.get('/expiring', (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const warningDate = new Date(today);
  warningDate.setDate(warningDate.getDate() + days);
  
  const workers = getWorkers()
    .filter(w => {
      if (!w.insuranceExpiryDate) return false;
      const expiryDate = new Date(w.insuranceExpiryDate);
      return expiryDate <= warningDate;
    })
    .map(w => {
      const expiryDate = new Date(w.insuranceExpiryDate);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      
      let urgency: 'critical' | 'warning' | 'normal';
      if (daysUntilExpiry <= 7) {
        urgency = 'critical';
      } else if (daysUntilExpiry <= 15) {
        urgency = 'warning';
      } else {
        urgency = 'normal';
      }
      
      return {
        id: w.id,
        name: w.name,
        phone: w.phone,
        insuranceExpiryDate: w.insuranceExpiryDate,
        daysUntilExpiry,
        urgency,
      };
    })
    .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry);
  
  res.json(workers);
});

export default router;
