import express from 'express';
import {
  createReview,
  getProductReviews,
  getMyReviews,
  deleteReview
} from '../controllers/reviewController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/', protect, createReview);
router.get('/mine', protect, getMyReviews);
router.get('/product/:productId', getProductReviews);
router.delete('/:id', protect, deleteReview);

export default router;
