import User from '../models/User.js';
import Product from '../models/Product.js';
import generateToken from '../utils/generateToken.js';

// @desc Register a new user (buyer or seller)
// @route POST /api/users/register
export const registerUser = async (req, res) => {
  try {
    const { name, email, password, role, shopName, phone, shopAddress, gstNumber, businessCategory } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Only allow buyer/seller from public registration; admin is created via seeder only
    const safeRole = role === 'seller' ? 'seller' : 'buyer';

    if (safeRole === 'seller' && (!phone || !shopAddress)) {
      return res.status(400).json({ message: 'Phone number and shop address are required to register as a seller' });
    }

    const user = await User.create({
      name,
      email,
      password,
      role: safeRole,
      shopName: safeRole === 'seller' ? shopName || `${name}'s Shop` : '',
      phone: safeRole === 'seller' ? phone : '',
      shopAddress: safeRole === 'seller' ? shopAddress : '',
      gstNumber: safeRole === 'seller' ? gstNumber || '' : '',
      businessCategory: safeRole === 'seller' ? businessCategory || '' : ''
    });

    generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isApproved: user.isApproved,
      shopName: user.shopName,
      superCoins: user.superCoins
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc Auth user & get token
// @route POST /api/users/login
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      generateToken(res, user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isApproved: user.isApproved,
        shopName: user.shopName,
        superCoins: user.superCoins
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Logout user / clear cookie
// @route POST /api/users/logout
export const logoutUser = (req, res) => {
  res.cookie('jwt', '', { httpOnly: true, expires: new Date(0) });
  res.json({ message: 'Logged out' });
};

// @desc Get current logged in user's profile
// @route GET /api/users/profile
export const getProfile = async (req, res) => {
  res.json(req.user);
};

// ---------- WISHLIST ----------

// @desc Get the logged-in user's wishlist, populated with product details
// @route GET /api/users/wishlist
export const getWishlist = async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    populate: { path: 'seller', select: 'name shopName' }
  });
  res.json(user.wishlist);
};

// @desc Add a product to the wishlist
// @route POST /api/users/wishlist/:productId
export const addToWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  const { productId } = req.params;
  if (!user.wishlist.some((id) => id.toString() === productId)) {
    user.wishlist.push(productId);
    await user.save();
  }
  res.json(user.wishlist);
};

// @desc Remove a product from the wishlist
// @route DELETE /api/users/wishlist/:productId
export const removeFromWishlist = async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter((id) => id.toString() !== req.params.productId);
  await user.save();
  res.json(user.wishlist);
};

// ---------- ADMIN ONLY ----------

// @desc Get all sellers awaiting approval
// @route GET /api/users/admin/pending-sellers
export const getPendingSellers = async (req, res) => {
  const sellers = await User.find({ role: 'seller', isApproved: false }).select('-password');
  res.json(sellers);
};

// @desc Approve a seller account
// @route PUT /api/users/admin/approve-seller/:id
export const approveSeller = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'seller') {
    return res.status(404).json({ message: 'Seller not found' });
  }
  user.isApproved = true;
  await user.save();
  res.json({ message: 'Seller approved', user });
};

// @desc Reject / remove a pending seller account
// @route DELETE /api/users/admin/reject-seller/:id
export const rejectSeller = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || user.role !== 'seller') {
    return res.status(404).json({ message: 'Seller not found' });
  }
  await user.deleteOne();
  res.json({ message: 'Seller rejected and removed' });
};

// @desc Get all users (for admin overview)
// @route GET /api/users/admin/all
export const getAllUsers = async (req, res) => {
  const users = await User.find({}).select('-password');
  res.json(users);
};

// @desc Admin: permanently remove any account (buyer, seller, or another admin's — used for
// moderation, e.g. a seller who was previously approved but is now misbehaving). Removing a
// seller also removes their product listings so nothing is left pointing at a deleted seller.
// @route DELETE /api/users/admin/:id
export const adminDeleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });

  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'You cannot remove your own account' });
  }

  if (user.role === 'seller') {
    await Product.deleteMany({ seller: user._id });
  }

  await user.deleteOne();
  res.json({ message: 'Account removed' });
};
