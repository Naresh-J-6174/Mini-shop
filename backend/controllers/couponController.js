import Coupon from '../models/Coupon.js';

// @desc Seller creates a coupon
// @route POST /api/coupons
export const createCoupon = async (req, res) => {
  try {
    const { code, discountPercent, minOrderAmount, expiresAt } = req.body;
    if (!code || !discountPercent) {
      return res.status(400).json({ message: 'code and discountPercent are required' });
    }

    const coupon = await Coupon.create({
      seller: req.user._id,
      code: code.trim().toUpperCase(),
      discountPercent,
      minOrderAmount: minOrderAmount || 0,
      expiresAt: expiresAt || undefined
    });
    res.status(201).json(coupon);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'That coupon code is already in use' });
    }
    res.status(400).json({ message: error.message });
  }
};

// @desc Seller: list own coupons
// @route GET /api/coupons/mine
export const getMyCoupons = async (req, res) => {
  const coupons = await Coupon.find({ seller: req.user._id }).sort({ createdAt: -1 });
  res.json(coupons);
};

// @desc Seller: deactivate/delete own coupon
// @route DELETE /api/coupons/:id
export const deleteCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ message: 'Coupon not found' });
  if (coupon.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await coupon.deleteOne();
  res.json({ message: 'Coupon removed' });
};

// @desc Buyer: validate a coupon code against a given seller + that seller's subtotal in the cart
// @route POST /api/coupons/validate
export const validateCoupon = async (req, res) => {
  const { code, sellerId, subtotal } = req.body;
  if (!code || !sellerId || subtotal == null) {
    return res.status(400).json({ message: 'code, sellerId and subtotal are required' });
  }

  const coupon = await Coupon.findOne({ code: code.trim().toUpperCase(), seller: sellerId });
  if (!coupon || !coupon.isActive) {
    return res.status(404).json({ message: 'Invalid coupon code for this seller' });
  }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) {
    return res.status(400).json({ message: 'This coupon has expired' });
  }
  if (subtotal < coupon.minOrderAmount) {
    return res
      .status(400)
      .json({ message: `Minimum order of ₹${coupon.minOrderAmount} required for this coupon` });
  }

  const discountAmount = Math.round((subtotal * coupon.discountPercent) / 100);
  res.json({
    code: coupon.code,
    discountPercent: coupon.discountPercent,
    discountAmount,
    sellerId
  });
};
