import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import WishlistButton from '../components/WishlistButton';
import ReviewSection from '../components/ReviewSection';

const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [product, setProduct] = useState(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => setProduct(data));
  }, [id]);

  if (!product) return <p className="text-center py-20 text-gray-400">Loading...</p>;

  const handleAddToCart = () => {
    addToCart(product, qty);
    navigate('/cart');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="relative grid md:grid-cols-2 gap-10 bg-white rounded-2xl shadow-sm p-8">
        <WishlistButton productId={product._id} className="absolute top-6 right-6" />
        <div className="flex items-center justify-center bg-gray-50 rounded-xl p-6">
          <img src={product.image} alt={product.name} className="max-h-96 object-contain" />
        </div>
        <div>
          <span className="text-xs text-brand-600 font-semibold uppercase">{product.category}</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">{product.name}</h1>
          {product.seller?.shopName && (
            <p className="text-sm text-gray-400 mt-1">Sold by {product.seller.shopName}</p>
          )}
          <div className="mt-2">
            {product.numReviews > 0 ? (
              <span className="text-sm text-amber-600 font-medium">
                ★ {product.rating.toFixed(1)} ({product.numReviews} review{product.numReviews > 1 ? 's' : ''})
              </span>
            ) : (
              <span className="text-sm text-gray-400">No reviews yet</span>
            )}
          </div>
          <p className="text-3xl font-extrabold text-gray-900 mt-4">₹{product.price}</p>
          <p className="text-gray-600 mt-4 leading-relaxed">{product.description}</p>

          <div className="mt-6 flex items-center gap-4">
            <span className="text-sm text-gray-500">
              {product.countInStock > 0 ? `${product.countInStock} in stock` : 'Out of stock'}
            </span>
          </div>

          {product.countInStock > 0 && (
            <div className="mt-4 flex items-center gap-3">
              <label className="text-sm text-gray-600">Qty:</label>
              <select
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
                className="border border-gray-200 rounded-lg px-3 py-1.5"
              >
                {[...Array(Math.min(product.countInStock, 10)).keys()].map((x) => (
                  <option key={x + 1} value={x + 1}>
                    {x + 1}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={product.countInStock === 0}
            className="mt-6 w-full md:w-auto bg-brand-600 hover:bg-brand-700 disabled:bg-gray-300 text-white font-semibold px-8 py-3 rounded-xl transition"
          >
            Add to Cart
          </button>
        </div>
      </div>

      <ReviewSection productId={product._id} />
    </div>
  );
};

export default ProductPage;
