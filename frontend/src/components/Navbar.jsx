import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { cartItems } = useCart();
  const navigate = useNavigate();
  const cartCount = cartItems.reduce((sum, item) => sum + item.qty, 0);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-gray-900 to-brand-700 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold tracking-tight flex items-center gap-1">
          Shop<span className="text-brand-100">Hub</span>
        </Link>

        <div className="flex items-center gap-5 text-sm font-medium">
          <Link to="/" className="hover:text-brand-100 transition">
            Home
          </Link>
          <Link to="/cart" className="relative hover:text-brand-100 transition">
            Cart
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-3 bg-amber-400 text-gray-900 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {cartCount}
              </span>
            )}
          </Link>

          {user?.role === 'buyer' && (
            <>
              <Link to="/orders" className="hover:text-brand-100 transition">
                My Orders
              </Link>
              <Link to="/wishlist" className="hover:text-brand-100 transition">
                Wishlist
              </Link>
              <span
                title="SuperCoins — earn on delivery, redeem at checkout"
                className="flex items-center gap-1 bg-amber-400/20 text-amber-200 font-semibold px-2.5 py-1 rounded-full text-xs"
              >
                🪙 {user.superCoins || 0}
              </span>
            </>
          )}

          {user?.role === 'seller' && (
            <Link to="/seller" className="hover:text-brand-100 transition">
              Seller Dashboard
            </Link>
          )}

          {user?.role === 'admin' && (
            <Link to="/admin" className="hover:text-brand-100 transition">
              Admin Panel
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-brand-100 hidden sm:inline">Hi, {user.name.split(' ')[0]}</span>
              <button
                onClick={handleLogout}
                className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-lg transition"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="hover:text-brand-100 transition"
              >
                Sign In
              </Link>
              <Link
                to="/register"
                className="bg-amber-400 text-gray-900 font-semibold px-4 py-1.5 rounded-lg hover:bg-amber-300 transition"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
