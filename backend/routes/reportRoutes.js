import express from 'express';
import { getSellerRevenueSummary, downloadSellerRevenueCSV } from '../controllers/reportController.js';
import { protect, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/seller/summary', protect, seller, getSellerRevenueSummary);
router.get('/seller/download', protect, seller, downloadSellerRevenueCSV);

export default router;
