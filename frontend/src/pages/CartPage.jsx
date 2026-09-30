import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';

const CartPage = () => {
  const { cartItems, updateQty, removeFromCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleCheckout = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  if (cartItems.length === 0) {
    return (
      <div className="max-w-2xl mx-auto text-center py-24 px-4">
        <h2 className="text-2xl font-bold text-gray-800">Your cart is empty</h2>
        <Link to="/" className="text-brand-600 font-medium mt-3 inline-block">
          Continue shopping →
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Shopping Cart</h1>
      <div className="bg-white rounded-2xl shadow-sm divide-y">
        {cartItems.map((item) => (
          <div key={item._id} className="flex items-center gap-4 p-4">
            <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.name}</p>
              <p className="text-gray-500 text-sm">₹{item.price}</p>
            </div>
            <select
              value={item.qty}
              onChange={(e) => updateQty(item._id, Number(e.target.value))}
              className="border border-gray-200 rounded-lg px-2 py-1"
            >
              {[...Array(10).keys()].map((x) => (
                <option key={x + 1} value={x + 1}>
                  {x + 1}
                </option>
              ))}
            </select>
            <span className="font-semibold w-20 text-right">₹{item.price * item.qty}</span>
            <button
              onClick={() => removeFromCart(item._id)}
              className="text-red-500 hover:text-red-700 text-sm font-medium"
            >
              Remove
            </button>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6 mt-6 flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-800">Total: ₹{totalPrice}</span>
        <button
          onClick={handleCheckout}
          className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-8 py-3 rounded-xl transition"
        >
          Proceed to Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
