import express from 'express';
import {
  createCoupon,
  getMyCoupons,
  deleteCoupon,
  validateCoupon
} from '../controllers/couponController.js';
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, seller, createCoupon);
router.get('/mine', protect, seller, getMyCoupons);
router.post('/validate', protect, validateCoupon);
router.delete('/:id', protect, seller, deleteCoupon);

export default router;
