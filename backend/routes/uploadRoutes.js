import express from 'express';
import { uploadImage } from '../controllers/uploadController.js';
import { protect, seller } from '../middleware/authMiddleware.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

router.post('/image', protect, seller, upload.single('image'), uploadImage);

export default router;
