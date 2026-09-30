import User from '../models/User.js';
import LotteryEntry from '../models/LotteryEntry.js';
import LotteryDraw from '../models/LotteryDraw.js';

// @desc Seller: view own lottery settings
// @route GET /api/lottery/settings
export const getLotterySettings = async (req, res) => {
  res.json(req.user.lotterySettings || { enabled: false, minAmount: 0 });
};

// @desc Seller: turn the lottery on/off and set the qualifying spend
// @route PUT /api/lottery/settings
export const updateLotterySettings = async (req, res) => {
  const { enabled, minAmount } = req.body;
  const user = await User.findById(req.user._id);
  user.lotterySettings = {
    enabled: !!enabled,
    minAmount: Math.max(0, Number(minAmount) || 0)
  };
  await user.save();
  res.json(user.lotterySettings);
};

// @desc Seller: see how many undrawn entries are currently in their pool
// @route GET /api/lottery/pool
export const getLotteryPool = async (req, res) => {
  const entries = await LotteryEntry.find({ seller: req.user._id, draw: null })
    .populate('buyer', 'name email')
    .sort({ createdAt: -1 });
  res.json({ count: entries.length, entries });
};

// @desc Seller (or admin, passing ?sellerId=) triggers a random draw over the current pool
// @route POST /api/lottery/draw
export const drawLottery = async (req, res) => {
  const sellerId = req.user.role === 'admin' && req.body.sellerId ? req.body.sellerId : req.user._id;

  const pool = await LotteryEntry.find({ seller: sellerId, draw: null });
  if (pool.length === 0) {
    return res.status(400).json({ message: 'No eligible entries to draw from yet' });
  }

  const winningEntry = pool[Math.floor(Math.random() * pool.length)];

  const drawDoc = await LotteryDraw.create({
    seller: sellerId,
    winner: winningEntry.buyer,
    winningEntry: winningEntry._id,
    totalEntries: pool.length
  });

  // Close out this round: every entry in the pool is now attached to this draw
  await LotteryEntry.updateMany({ seller: sellerId, draw: null }, { draw: drawDoc._id });

  const populated = await LotteryDraw.findById(drawDoc._id)
    .populate('winner', 'name email')
    .populate('seller', 'shopName');

  res.status(201).json(populated);
};

// @desc Seller: history of past draws
// @route GET /api/lottery/draws
export const getSellerDraws = async (req, res) => {
  const draws = await LotteryDraw.find({ seller: req.user._id })
    .populate('winner', 'name email')
    .sort({ drawnAt: -1 });
  res.json(draws);
};

// @desc Buyer: their own entries + any wins, across all sellers
// @route GET /api/lottery/my-entries
export const getMyLotteryEntries = async (req, res) => {
  const entries = await LotteryEntry.find({ buyer: req.user._id })
    .populate('seller', 'shopName')
    .sort({ createdAt: -1 });

  const wins = await LotteryDraw.find({ winner: req.user._id })
    .populate('seller', 'shopName')
    .sort({ drawnAt: -1 });

  res.json({ entries, wins });
};
