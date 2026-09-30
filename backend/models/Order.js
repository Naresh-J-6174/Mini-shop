import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    orderItems: [
      {
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
        seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
      }
    ],
    shippingAddress: {
      address: { type: String, required: true },
      city: { type: String, required: true },
      postalCode: { type: String, required: true },
      country: { type: String, required: true }
    },
    totalPrice: { type: Number, required: true, default: 0 },
    couponCode: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
    isPaid: { type: Boolean, default: false },
    paidAt: { type: Date },
    status: {
      type: String,
      enum: ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'],
      default: 'Processing'
    },
    // Set once markOrderAsPaid has run its one-time side effects (lottery entries etc.)
    lotteryProcessed: { type: Boolean, default: false },

    // ---------- SuperCoins ----------
    // Coins the buyer chose to redeem against this order (1 coin = ₹1, already subtracted from totalPrice)
    coinsRedeemed: { type: Number, default: 0 },
    // Coins credited to the buyer once this order is marked Delivered
    coinsEarned: { type: Number, default: 0 },
    // Guards against crediting coinsEarned twice if status is toggled back and forth
    coinsCredited: { type: Boolean, default: false },

    // ---------- Delivery scheduling ----------
    delivery: {
      type: { type: String, enum: ['Standard', 'Express'], default: 'Standard' },
      requestedDate: { type: Date },
      status: {
        type: String,
        enum: ['Pending', 'Accepted', 'Rejected'],
        default: 'Pending'
      },
      sellerNote: { type: String, default: '' },
      respondedAt: { type: Date }
    },

    // ---------- Quantity-based "spin" reward ----------
    // Set when this order qualified for a seller's RewardTier (buy >= N of a product).
    // The reward itself is NOT random — it's fully determined by the quantity purchased.
    // The spin-wheel animation on the frontend is purely a reveal effect, not a chance draw.
    spinReward: {
      label: { type: String },
      bonusCoins: { type: Number },
      productName: { type: String }
    }
  },
  { timestamps: true }
);

const Order = mongoose.model('Order', orderSchema);
export default Order;
