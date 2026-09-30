import RewardTier from '../models/RewardTier.js';
import Product from '../models/Product.js';

// @desc Seller: create a quantity-based reward rule for one of their own products
// @route POST /api/reward-tiers
export const createRewardTier = async (req, res) => {
  try {
    const { product, thresholdQty, bonusCoins, label } = req.body;
    if (!product || !thresholdQty || !bonusCoins || !label) {
      return res.status(400).json({ message: 'product, thresholdQty, bonusCoins and label are required' });
    }

    const owned = await Product.findOne({ _id: product, seller: req.user._id });
    if (!owned) {
      return res.status(403).json({ message: 'You can only create reward tiers for your own products' });
    }

    const tier = await RewardTier.create({
      seller: req.user._id,
      product,
      thresholdQty: Number(thresholdQty),
      bonusCoins: Number(bonusCoins),
      label: label.trim()
    });
    const populated = await tier.populate('product', 'name image');
    res.status(201).json(populated);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Seller: list own reward tiers
// @route GET /api/reward-tiers/mine
export const getMyRewardTiers = async (req, res) => {
  const tiers = await RewardTier.find({ seller: req.user._id })
    .populate('product', 'name image')
    .sort({ createdAt: -1 });
  res.json(tiers);
};

// @desc Seller: delete own reward tier
// @route DELETE /api/reward-tiers/:id
export const deleteRewardTier = async (req, res) => {
  const tier = await RewardTier.findById(req.params.id);
  if (!tier) return res.status(404).json({ message: 'Reward tier not found' });
  if (tier.seller.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Not authorized' });
  }
  await tier.deleteOne();
  res.json({ message: 'Reward tier removed' });
};

// @desc Public/buyer: list active reward tiers for a given product (so it can be shown on the
// product page, e.g. "Buy 3 or more and win a spin reward!")
// @route GET /api/reward-tiers/product/:productId
export const getRewardTiersForProduct = async (req, res) => {
  const tiers = await RewardTier.find({ product: req.params.productId, isActive: true }).sort({ thresholdQty: 1 });
  res.json(tiers);
};
