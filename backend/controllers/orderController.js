import Order from '../models/Order.js';
import User from '../models/User.js';
import RewardTier from '../models/RewardTier.js';
import { finalizeOrderPayment } from '../utils/paymentHelpers.js';

// Buyers earn this fraction of an order's paid total as SuperCoins once it's Delivered.
// 1 SuperCoin = ₹1 when redeemed.
const COIN_EARN_RATE = Number(process.env.SUPERCOIN_EARN_RATE) || 0.02; // 2%
// Coins can never cover more than this fraction of an order's total, so a coupon + coins
// combo can't zero out an order entirely.
const MAX_COIN_REDEMPTION_SHARE = 0.5;

// Checks the buyer's purchased quantities against each product's seller-defined RewardTiers and
// returns the single best-matching reward for this order (highest bonusCoins among qualifying
// tiers), or null. This is a deterministic lookup — nothing here is randomized. The frontend's
// "spin the wheel" animation is purely a reveal effect for whatever this function returns.
const computeSpinReward = async (orderItems) => {
  const qtyByProduct = new Map();
  for (const item of orderItems) {
    qtyByProduct.set(item.product.toString(), (qtyByProduct.get(item.product.toString()) || 0) + item.qty);
  }
  if (qtyByProduct.size === 0) return null;

  const tiers = await RewardTier.find({
    product: { $in: [...qtyByProduct.keys()] },
    isActive: true
  }).populate('product', 'name');

  let best = null;
  for (const tier of tiers) {
    const purchasedQty = qtyByProduct.get(tier.product._id.toString()) || 0;
    if (purchasedQty < tier.thresholdQty) continue;
    if (!best || tier.bonusCoins > best.bonusCoins) {
      best = { label: tier.label, bonusCoins: tier.bonusCoins, productName: tier.product.name };
    }
  }
  return best;
};

// @desc Create a new order
// @route POST /api/orders
export const addOrderItems = async (req, res) => {
  const {
    orderItems,
    shippingAddress,
    totalPrice,
    couponCode,
    discountAmount,
    deliveryType,
    requestedDeliveryDate,
    coinsToRedeem
  } = req.body;

  if (!orderItems || orderItems.length === 0) {
    return res.status(400).json({ message: 'No order items' });
  }

  if (!requestedDeliveryDate) {
    return res.status(400).json({ message: 'Please choose a preferred delivery date' });
  }
  const parsedDate = new Date(requestedDeliveryDate);
  if (Number.isNaN(parsedDate.getTime()) || parsedDate < new Date().setHours(0, 0, 0, 0)) {
    return res.status(400).json({ message: 'Please choose a valid, future delivery date' });
  }

  // ---- SuperCoins redemption ----
  const requestedCoins = Math.max(0, Math.floor(Number(coinsToRedeem) || 0));
  let coinsRedeemed = 0;
  let finalTotal = totalPrice;

  if (requestedCoins > 0) {
    const buyer = await User.findById(req.user._id);
    const maxRedeemableByBalance = buyer.superCoins;
    const maxRedeemableByOrderCap = Math.floor(totalPrice * MAX_COIN_REDEMPTION_SHARE);
    coinsRedeemed = Math.min(requestedCoins, maxRedeemableByBalance, maxRedeemableByOrderCap, totalPrice);

    if (coinsRedeemed > 0) {
      finalTotal = Math.max(0, totalPrice - coinsRedeemed);
      await User.findByIdAndUpdate(req.user._id, { $inc: { superCoins: -coinsRedeemed } });
    }
  }

  // Quantity-based spin reward: fixed by the rule the seller configured, not random.
  const spinReward = await computeSpinReward(orderItems);
  if (spinReward) {
    await User.findByIdAndUpdate(req.user._id, { $inc: { superCoins: spinReward.bonusCoins } });
  }

  const order = await Order.create({
    user: req.user._id,
    orderItems,
    shippingAddress,
    totalPrice: finalTotal,
    couponCode: couponCode || '',
    discountAmount: discountAmount || 0,
    coinsRedeemed,
    delivery: {
      type: deliveryType === 'Express' ? 'Express' : 'Standard',
      requestedDate: parsedDate,
      status: 'Pending'
    },
    ...(spinReward ? { spinReward } : {})
  });

  res.status(201).json(order);
};

// @desc Mock "pay now" — instantly marks the order as paid, no real gateway.
// Kept as a zero-setup fallback when Razorpay isn't configured (see paymentController for the real flow).
// @route PUT /api/orders/:id/pay
export const markOrderAsPaid = async (req, res) => {
  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }

  const updated = await finalizeOrderPayment(order);
  res.json(updated);
};

// @desc Seller/admin: update an order's fulfillment status. Crediting SuperCoins happens once,
// the first time an order transitions into "Delivered".
// @route PUT /api/orders/:id/status
export const updateOrderStatus = async (req, res) => {
  const { status } = req.body;
  const allowed = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ message: 'Invalid status value' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const sellsInThisOrder = order.orderItems.some((i) => i.seller.toString() === req.user._id.toString());
  if (req.user.role !== 'admin' && !sellsInThisOrder) {
    return res.status(403).json({ message: 'Not authorized to update this order' });
  }

  order.status = status;

  if (status === 'Delivered' && order.isPaid && !order.coinsCredited) {
    const coinsEarned = Math.floor(order.totalPrice * COIN_EARN_RATE);
    if (coinsEarned > 0) {
      await User.findByIdAndUpdate(order.user, { $inc: { superCoins: coinsEarned } });
    }
    order.coinsEarned = coinsEarned;
    order.coinsCredited = true;
  }

  const updated = await order.save();
  res.json(updated);
};

// @desc Seller: accept or reject the buyer's requested delivery date for an order that contains
// their products. Rejecting doesn't cancel the order — it just flags that the date needs
// renegotiating (e.g. via the seller's note); the buyer sees this on their Orders page.
// @route PUT /api/orders/:id/delivery/respond
export const respondToDeliveryRequest = async (req, res) => {
  const { status, sellerNote } = req.body;
  if (!['Accepted', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'status must be Accepted or Rejected' });
  }

  const order = await Order.findById(req.params.id);
  if (!order) return res.status(404).json({ message: 'Order not found' });

  const sellsInThisOrder = order.orderItems.some((i) => i.seller.toString() === req.user._id.toString());
  if (req.user.role !== 'admin' && !sellsInThisOrder) {
    return res.status(403).json({ message: 'Not authorized to respond to this order' });
  }

  order.delivery.status = status;
  order.delivery.sellerNote = sellerNote || '';
  order.delivery.respondedAt = new Date();

  const updated = await order.save();
  res.json(updated);
};

// @desc Get logged-in user's own orders
// @route GET /api/orders/myorders
export const getMyOrders = async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};

// @desc Get a single order by id (owner or admin)
// @route GET /api/orders/:id
export const getOrderById = async (req, res) => {
  const order = await Order.findById(req.params.id).populate('user', 'name email');
  if (!order) return res.status(404).json({ message: 'Order not found' });

  if (order.user._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  res.json(order);
};

// @desc Admin: get all orders in the system
// @route GET /api/orders
export const getAllOrders = async (req, res) => {
  const orders = await Order.find({}).populate('user', 'name email').sort({ createdAt: -1 });
  res.json(orders);
};

// @desc Seller: get orders that contain at least one of their own products
// @route GET /api/orders/seller/mine
export const getSellerOrders = async (req, res) => {
  const orders = await Order.find({ 'orderItems.seller': req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
};
