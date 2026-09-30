import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';

const WishlistButton = ({ productId, className = '' }) => {
  const { user } = useAuth();
  const { isWishlisted, toggle } = useWishlist();

  if (!user || user.role !== 'buyer') return null;

  const active = isWishlisted(productId);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  };

  return (
    <button
      onClick={handleClick}
      aria-label={active ? 'Remove from wishlist' : 'Add to wishlist'}
      className={`w-9 h-9 rounded-full flex items-center justify-center shadow-sm transition ${
        active ? 'bg-rose-500 text-white' : 'bg-white/90 text-gray-400 hover:text-rose-500'
      } ${className}`}
    >
      {active ? '♥' : '♡'}
    </button>
  );
};

export default WishlistButton;
