import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [items, setItems] = useState([]); // array of populated product objects

  const refresh = useCallback(() => {
    if (!user || user.role !== 'buyer') {
      setItems([]);
      return;
    }
    api
      .get('/users/wishlist')
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]));
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const isWishlisted = (productId) => items.some((p) => p._id === productId);

  const toggle = async (productId) => {
    if (isWishlisted(productId)) {
      setItems((prev) => prev.filter((p) => p._id !== productId));
      await api.delete(`/users/wishlist/${productId}`);
    } else {
      // optimistic placeholder so the heart flips instantly; refresh() will backfill full details
      setItems((prev) => [...prev, { _id: productId }]);
      await api.post(`/users/wishlist/${productId}`);
      refresh();
    }
  };

  return (
    <WishlistContext.Provider value={{ items, isWishlisted, toggle, refresh }}>
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => useContext(WishlistContext);
