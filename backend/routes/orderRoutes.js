import express from 'express';
import {
  addOrderItems,
  markOrderAsPaid,
  getMyOrders,
  getOrderById,
  getAllOrders,
  getSellerOrders,
  updateOrderStatus,
  respondToDeliveryRequest
} from '../controllers/orderController.js';
import { protect, admin, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, addOrderItems);
router.get('/myorders', protect, getMyOrders);
router.get('/seller/mine', protect, seller, getSellerOrders);
router.get('/', protect, admin, getAllOrders);
router.get('/:id', protect, getOrderById);
router.put('/:id/pay', protect, markOrderAsPaid);
router.put('/:id/status', protect, updateOrderStatus);
router.put('/:id/delivery/respond', protect, seller, respondToDeliveryRequest);

export default router;
