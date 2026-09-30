import User from '../models/User.js';
import LotteryEntry from '../models/LotteryEntry.js';

// Groups paid order items by seller and creates a LotteryEntry for any seller running an
// active "spend above X" promotion that this order's spend with them qualifies for.
export const processLotteryEntries = async (order) => {
  const subtotalBySeller = {};
  for (const item of order.orderItems) {
    const sellerId = item.seller.toString();
    subtotalBySeller[sellerId] = (subtotalBySeller[sellerId] || 0) + item.price * item.qty;
  }

  for (const [sellerId, subtotal] of Object.entries(subtotalBySeller)) {
    const seller = await User.findById(sellerId);
    if (
      seller?.lotterySettings?.enabled &&
      seller.lotterySettings.minAmount > 0 &&
      subtotal >= seller.lotterySettings.minAmount
    ) {
      await LotteryEntry.create({
        seller: sellerId,
        buyer: order.user,
        order: order._id,
        amount: subtotal
      });
    }
  }
};

// Marks an order as paid and runs the one-time side effects (lottery entries etc.), guarding
// against double-processing if this ever gets called twice for the same order.
export const finalizeOrderPayment = async (order) => {
  order.isPaid = true;
  order.paidAt = Date.now();
  if (!order.lotteryProcessed) {
    await processLotteryEntries(order);
    order.lotteryProcessed = true;
  }
  await order.save();
  return order;
};
