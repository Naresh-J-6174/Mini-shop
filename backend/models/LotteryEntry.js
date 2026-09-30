import mongoose from 'mongoose';

const lotteryEntrySchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    amount: { type: Number, required: true },
    // null while the entry is still sitting in the open pool; set once a draw consumes it
    draw: { type: mongoose.Schema.Types.ObjectId, ref: 'LotteryDraw', default: null }
  },
  { timestamps: true }
);

const LotteryEntry = mongoose.model('LotteryEntry', lotteryEntrySchema);
export default LotteryEntry;
