import express from 'express';
import {
  getProducts,
  getProductById,
  getCategories,
  createProduct,
  updateProduct,
  deleteProduct,
  getMyProducts,
  getAllProductsAdmin
} from '../controllers/productController.js';
import { protect, admin, seller } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public storefront
router.get('/', getProducts);
router.get('/categories', getCategories);

// Seller-specific (must come before /:id so "seller" and "admin" aren't parsed as an id)
router.get('/seller/mine', protect, seller, getMyProducts);

// Admin-specific
router.get('/admin/all', protect, admin, getAllProductsAdmin);

// Seller create
router.post('/', protect, seller, createProduct);

// Generic id routes (public read, owner/admin write) — keep last
router.get('/:id', getProductById);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

export default router;
