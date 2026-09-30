import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['buyer', 'seller', 'admin'],
      default: 'buyer'
    },
    // Sellers must be approved by an admin before they can list products.
    // Buyers and admins are auto-approved.
    isApproved: { type: Boolean, default: true },
    shopName: { type: String, default: '' },
    // Seller onboarding details, captured at registration so an admin has enough context to
    // decide on approval. Empty/unused for buyer and admin accounts.
    phone: { type: String, default: '' },
    shopAddress: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
    businessCategory: { type: String, default: '' },
    // Buyers: saved-for-later products
    wishlist: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    // SuperCoins reward-wallet balance (1 coin = ₹1 when redeemed at checkout)
    superCoins: { type: Number, default: 0, min: 0 },
    // Sellers: optional "spend above X, get a lottery entry" promotion
    lotterySettings: {
      enabled: { type: Boolean, default: false },
      minAmount: { type: Number, default: 0 }
    }
  },
  { timestamps: true }
);

userSchema.pre('save', function (next) {
  if (this.role === 'seller' && this.isNew) {
    this.isApproved = false;
  }
  next();
});

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.matchPassword = async function (enteredPassword) {
  return bcrypt.compare(enteredPassword, this.password);
};

const User = mongoose.model('User', userSchema);
export default User;
