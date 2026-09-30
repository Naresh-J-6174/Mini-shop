import express from 'express';
import {
  getPaymentConfig,
  createRazorpayOrder,
  verifyRazorpayPayment
} from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/config', getPaymentConfig);
router.post('/:orderId/create', protect, createRazorpayOrder);
router.post('/:orderId/verify', protect, verifyRazorpayPayment);

export default router;
