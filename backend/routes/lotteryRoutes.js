import express from 'express';
import {
  getLotterySettings,
  updateLotterySettings,
  getLotteryPool,
  drawLottery,
  getSellerDraws,
  getMyLotteryEntries
} from '../controllers/lotteryController.js';
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/settings', protect, seller, getLotterySettings);
router.put('/settings', protect, seller, updateLotterySettings);
router.get('/pool', protect, seller, getLotteryPool);
router.get('/draws', protect, seller, getSellerDraws);
router.get('/my-entries', protect, getMyLotteryEntries);
// Either the seller themselves, or an admin passing sellerId in the body, can trigger a draw
router.post('/draw', protect, (req, res, next) => {
  if (req.user.role === 'seller' || req.user.role === 'admin') return next();
  return res.status(403).json({ message: 'Seller or admin access only' });
}, drawLottery);

export default router;
