import mongoose from 'mongoose';

const lotteryDrawSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    winner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    winningEntry: { type: mongoose.Schema.Types.ObjectId, ref: 'LotteryEntry', required: true },
    totalEntries: { type: Number, required: true },
    drawnAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

const LotteryDraw = mongoose.model('LotteryDraw', lotteryDrawSchema);
export default LotteryDraw;
