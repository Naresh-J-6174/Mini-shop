import crypto from 'crypto';
import Order from '../models/Order.js';
import { finalizeOrderPayment } from '../utils/paymentHelpers.js';

const isConfigured = () => !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

// @desc Public: tells the frontend whether real Razorpay checkout is available, and the public key if so
// @route GET /api/payments/config
export const getPaymentConfig = (req, res) => {
  res.json({
    razorpayEnabled: isConfigured(),
    keyId: isConfigured() ? process.env.RAZORPAY_KEY_ID : null
  });
};

// @desc Create a Razorpay order (test mode) for an existing ShopHub order, so the frontend can
// open the Razorpay checkout popup against it
// @route POST /api/payments/:orderId/create
export const createRazorpayOrder = async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ message: 'Razorpay is not configured on this server yet' });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }
  if (order.isPaid) {
    return res.status(400).json({ message: 'Order is already paid' });
  }

  const auth = Buffer.from(`${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`).toString('base64');

  const response = await fetch('https://api.razorpay.com/v1/orders', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`
    },
    body: JSON.stringify({
      // Razorpay expects the smallest currency unit — paise, not rupees
      amount: Math.round(order.totalPrice * 100),
      currency: 'INR',
      receipt: order._id.toString()
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error('Razorpay order creation failed:', response.status, errText);
    return res.status(502).json({ message: 'Could not start Razorpay checkout' });
  }

  const razorpayOrder = await response.json();
  res.json({
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency,
    keyId: process.env.RAZORPAY_KEY_ID
  });
};

// @desc Verify the signature Razorpay's checkout popup returns after a (test) payment, then mark
// the ShopHub order as paid
// @route POST /api/payments/:orderId/verify
export const verifyRazorpayPayment = async (req, res) => {
  if (!isConfigured()) {
    return res.status(503).json({ message: 'Razorpay is not configured on this server yet' });
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ message: 'Missing Razorpay payment details' });
  }

  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ message: 'Order not found' });
  if (order.user.toString() !== req.user._id.toString()) {
    return res.status(403).json({ message: 'Not authorized' });
  }

  // Razorpay's own recipe: HMAC-SHA256 of "order_id|payment_id" using your key secret
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  if (expectedSignature !== razorpay_signature) {
    return res.status(400).json({ message: 'Payment verification failed — signature mismatch' });
  }

  const updated = await finalizeOrderPayment(order);
  res.json(updated);
};
