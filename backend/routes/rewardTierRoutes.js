import express from 'express';
import {
  createRewardTier,
  getMyRewardTiers,
  deleteRewardTier,
  getRewardTiersForProduct
} from '../controllers/rewardTierController.js';
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, seller, createRewardTier);
router.get('/mine', protect, seller, getMyRewardTiers);
router.delete('/:id', protect, seller, deleteRewardTier);
router.get('/product/:productId', getRewardTiersForProduct);

export default router;
