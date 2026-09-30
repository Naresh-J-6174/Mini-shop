import Review from '../models/Review.js';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

// Recalculate a product's rating/numReviews from its current reviews
const recalcProductRating = async (productId) => {
  const reviews = await Review.find({ product: productId });
  const numReviews = reviews.length;
  const rating = numReviews === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / numReviews;
  await Product.findByIdAndUpdate(productId, { rating, numReviews });
};

// @desc Create a review for a product — only if the buyer has a PAID order containing it
// @route POST /api/reviews
export const createReview = async (req, res) => {
  try {
    const { product, order: orderId, rating, comment } = req.body;

    if (!product || !orderId || !rating || !comment) {
      return res.status(400).json({ message: 'product, order, rating and comment are required' });
    }

    const order = await Order.findById(orderId);
    if (!order || order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only review products from your own orders' });
    }
    if (!order.isPaid) {
      return res.status(400).json({ message: 'Only paid orders can be reviewed' });
    }
    const purchasedThisProduct = order.orderItems.some((i) => i.product.toString() === product);
    if (!purchasedThisProduct) {
      return res.status(400).json({ message: 'You can only review products you actually purchased' });
    }

    const existing = await Review.findOne({ product, user: req.user._id });
    if (existing) {
      return res.status(400).json({ message: 'You already reviewed this product' });
    }

    const review = await Review.create({
      product,
      user: req.user._id,
      order: orderId,
      rating,
      comment
    });

    await recalcProductRating(product);

    const populated = await review.populate('user', 'name');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Get all reviews for a product (public)
// @route GET /api/reviews/product/:productId
export const getProductReviews = async (req, res) => {
  const reviews = await Review.find({ product: req.params.productId })
    .populate('user', 'name')
    .sort({ createdAt: -1 });
  res.json(reviews);
};

// @desc Get the logged-in buyer's own reviews (used to know what's already reviewed)
// @route GET /api/reviews/mine
export const getMyReviews = async (req, res) => {
  const reviews = await Review.find({ user: req.user._id });
  res.json(reviews);
};

// @desc Delete a review (owner or admin)
// @route DELETE /api/reviews/:id
export const deleteReview = async (req, res) => {
  const review = await Review.findById(req.params.id);
  if (!review) return res.status(404).json({ message: 'Review not found' });

  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized to delete this review' });
  }

  const productId = review.product;
  await review.deleteOne();
  await recalcProductRating(productId);
  res.json({ message: 'Review removed' });
};
