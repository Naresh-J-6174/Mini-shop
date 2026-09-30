import mongoose from 'mongoose';

// A seller-defined rule: buying at least `thresholdQty` units of `product` in a single order
// unlocks a fixed (non-random) bonus of `bonusCoins` SuperCoins, shown to the buyer via a
// spin-the-wheel reveal animation on the order confirmation screen.
const rewardTierSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    thresholdQty: { type: Number, required: true, min: 1 },
    bonusCoins: { type: Number, required: true, min: 1 },
    label: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

rewardTierSchema.index({ seller: 1, product: 1, thresholdQty: 1 });

export default mongoose.model('RewardTier', rewardTierSchema);
