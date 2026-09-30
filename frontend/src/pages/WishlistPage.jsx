import React from 'react';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';

const WishlistPage = () => {
  const { items } = useWishlist();

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wishlist</h1>
      {items.length === 0 ? (
        <p className="text-gray-400">Nothing saved yet — tap the heart on a product to add it here.</p>
      ) : (
        <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items
            .filter((p) => p.name) // drop optimistic placeholders that haven't hydrated yet
            .map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
