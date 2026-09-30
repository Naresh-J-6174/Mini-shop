import mongoose from 'mongoose';

const productSchema = new mongoose.Schema(
  {
    seller: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: { type: String, required: true },
    image: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    price: { type: Number, required: true, default: 0 },
    countInStock: { type: Number, required: true, default: 0 },
    // Seller gets a "low stock" warning on their dashboard once countInStock drops to/below this
    lowStockThreshold: { type: Number, default: 5 },
    rating: { type: Number, default: 0 },
    numReviews: { type: Number, default: 0 },
    // Every new product starts pending until an admin approves it.
    isApproved: { type: Boolean, default: false },
    rejectionReason: { type: String, default: '' }
  },
  { timestamps: true }
);

const Product = mongoose.model('Product', productSchema);
export default Product;
