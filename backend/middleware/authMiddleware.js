import jwt from 'jsonwebtoken';
import User from '../models/User.js';

// Verifies the JWT (from cookie or Authorization header) and attaches req.user
export const protect = async (req, res, next) => {
  let token = req.cookies?.jwt;

  if (!token && req.headers.authorization?.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = await User.findById(decoded.userId).select('-password');
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user not found' });
    }
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, token failed' });
  }
};

export const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: 'Admin access only' });
  }
};

// Seller must be role=seller AND approved by admin
export const seller = (req, res, next) => {
  if (req.user && req.user.role === 'seller') {
    if (!req.user.isApproved) {
      return res
        .status(403)
        .json({ message: 'Your seller account is pending admin approval' });
    }
    next();
  } else {
    res.status(403).json({ message: 'Seller access only' });
  }
};
