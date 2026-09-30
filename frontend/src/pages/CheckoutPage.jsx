import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import SpinWheelReveal from '../components/SpinWheelReveal';

const loadRazorpayScript = () =>
  new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });

// Tomorrow's date as yyyy-mm-dd, for the delivery date picker's min attribute
const tomorrowStr = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
};

const CheckoutPage = () => {
  const { cartItems, totalPrice, clearCart } = useCart();
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [address, setAddress] = useState({ address: '', city: '', postalCode: '', country: '' });
  const [placing, setPlacing] = useState(false);
  const [paying, setPaying] = useState(false);
  const [order, setOrder] = useState(null);
  const [error, setError] = useState('');
  const [paymentConfig, setPaymentConfig] = useState({ razorpayEnabled: false, keyId: null });

  useEffect(() => {
    api.get('/payments/config').then(({ data }) => setPaymentConfig(data)).catch(() => {});
  }, []);

  const [couponInput, setCouponInput] = useState('');
  const [coupon, setCoupon] = useState(null); // {code, discountPercent, discountAmount, sellerId}
  const [couponError, setCouponError] = useState('');
  const [checkingCoupon, setCheckingCoupon] = useState(false);

  const [deliveryType, setDeliveryType] = useState('Standard');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [useCoins, setUseCoins] = useState(false);

  const discountAmount = coupon?.discountAmount || 0;
  const afterCoupon = Math.max(0, totalPrice - discountAmount);

  const availableCoins = user?.superCoins || 0;
  // Mirrors the backend cap: coins can cover at most half the coupon-adjusted total
  const maxCoinsUsable = Math.min(availableCoins, Math.floor(afterCoupon * 0.5), Math.floor(afterCoupon));
  const coinsToRedeem = useCoins ? maxCoinsUsable : 0;
  const finalTotal = Math.max(0, afterCoupon - coinsToRedeem);
  const coinsToEarn = Math.floor(finalTotal * 0.02);

  const handleApplyCoupon = async () => {
    setCouponError('');
    setCoupon(null);
    if (!couponInput.trim()) return;

    // A coupon belongs to one seller — try it against every distinct seller in the cart
    // and apply it to whichever one it matches.
    const sellerIds = [...new Set(cartItems.map((item) => item.seller?._id || item.seller))];
    setCheckingCoupon(true);
    for (const sellerId of sellerIds) {
      const subtotal = cartItems
        .filter((item) => (item.seller?._id || item.seller) === sellerId)
        .reduce((sum, item) => sum + item.price * item.qty, 0);
      try {
        const { data } = await api.post('/coupons/validate', {
          code: couponInput,
          sellerId,
          subtotal
        });
        setCoupon(data);
        setCheckingCoupon(false);
        return;
      } catch {
        // try the next seller
      }
    }
    setCheckingCoupon(false);
    setCouponError('That code is not valid for any seller in your cart right now');
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    setError('');
    if (!deliveryDate) {
      setError('Please choose a preferred delivery date');
      return;
    }
    setPlacing(true);
    try {
      const orderItems = cartItems.map((item) => ({
        name: item.name,
        qty: item.qty,
        image: item.image,
        price: item.price,
        product: item._id,
        seller: item.seller?._id || item.seller
      }));

      const { data } = await api.post('/orders', {
        orderItems,
        shippingAddress: address,
        totalPrice: afterCoupon,
        couponCode: coupon?.code || '',
        discountAmount,
        deliveryType,
        requestedDeliveryDate: deliveryDate,
        coinsToRedeem
      });
      setOrder(data);
      if (coinsToRedeem > 0 || data.spinReward) refreshProfile();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not place order');
    }
    setPlacing(false);
  };

  const handleMockPay = async () => {
    setPaying(true);
    try {
      await api.put(`/orders/${order._id}/pay`);
      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Payment failed');
    }
    setPaying(false);
  };

  const handleRazorpayPay = async () => {
    setPaying(true);
    setError('');
    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Could not load Razorpay checkout — check your connection and try again.');
        setPaying(false);
        return;
      }

      const { data: rzpOrder } = await api.post(`/payments/${order._id}/create`);

      const rzp = new window.Razorpay({
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        order_id: rzpOrder.razorpayOrderId,
        name: 'ShopHub',
        description: `Order #${order._id.slice(-6).toUpperCase()}`,
        prefill: { name: user?.name, email: user?.email },
        theme: { color: '#4338ca' },
        handler: async (response) => {
          try {
            await api.post(`/payments/${order._id}/verify`, response);
            clearCart();
            navigate('/orders');
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed');
          }
          setPaying(false);
        },
        modal: {
          ondismiss: () => setPaying(false)
        }
      });
      rzp.on('payment.failed', () => {
        setError('Payment failed or was cancelled — you can try again.');
        setPaying(false);
      });
      rzp.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not start Razorpay checkout');
      setPaying(false);
    }
  };

  if (order) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm p-8">
          <h2 className="text-xl font-bold text-gray-900 mb-2">Order Placed!</h2>
          <p className="text-gray-500 mb-1">Total: ₹{order.totalPrice}</p>
          <p className="text-xs text-gray-400 mb-6">
            Requested delivery: {new Date(order.delivery.requestedDate).toLocaleDateString()} ·{' '}
            {order.delivery.type} — awaiting seller confirmation
          </p>

          {order.spinReward && <SpinWheelReveal reward={order.spinReward} />}
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          {paymentConfig.razorpayEnabled ? (
            <>
              <p className="text-xs text-gray-400 mb-6">
                Razorpay test mode — no real money moves. Use card 4111 1111 1111 1111, any future
                expiry, any CVV, to simulate a successful payment.
              </p>
              <button
                onClick={handleRazorpayPay}
                disabled={paying}
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
              >
                {paying ? 'Opening checkout...' : 'Pay with Razorpay'}
              </button>
            </>
          ) : (
            <>
              <p className="text-xs text-gray-400 mb-6">
                No real payment gateway is connected — click below to simulate a successful payment.
              </p>
              <button
                onClick={handleMockPay}
                disabled={paying}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
              >
                {paying ? 'Processing...' : 'Pay Now (Mock Payment)'}
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-10">
      <div className="bg-white rounded-2xl shadow-sm p-8">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Shipping Details</h1>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handlePlaceOrder} className="space-y-4">
          <input
            placeholder="Address"
            value={address.address}
            onChange={(e) => setAddress({ ...address, address: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            placeholder="City"
            value={address.city}
            onChange={(e) => setAddress({ ...address, city: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            placeholder="Postal Code"
            value={address.postalCode}
            onChange={(e) => setAddress({ ...address, postalCode: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />
          <input
            placeholder="Country"
            value={address.country}
            onChange={(e) => setAddress({ ...address, country: e.target.value })}
            required
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
          />

          <div className="pt-2">
            <label className="text-sm text-gray-600 mb-1 block">Coupon code (optional)</label>
            <div className="flex gap-2">
              <input
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="e.g. WELCOME10"
                className="flex-1 border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
              />
              <button
                type="button"
                onClick={handleApplyCoupon}
                disabled={checkingCoupon}
                className="bg-gray-800 hover:bg-gray-900 text-white font-semibold px-4 rounded-lg transition disabled:opacity-60"
              >
                {checkingCoupon ? '...' : 'Apply'}
              </button>
            </div>
            {couponError && <p className="text-red-500 text-xs mt-1">{couponError}</p>}
            {coupon && (
              <p className="text-green-600 text-xs mt-1">
                {coupon.code} applied — {coupon.discountPercent}% off (−₹{coupon.discountAmount})
              </p>
            )}
          </div>

          <div className="pt-2">
            <label className="text-sm text-gray-600 mb-1 block">Delivery type</label>
            <div className="flex gap-3">
              {['Standard', 'Express'].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setDeliveryType(t)}
                  className={`flex-1 border rounded-lg px-4 py-2.5 text-sm font-semibold transition ${
                    deliveryType === t
                      ? 'border-brand-600 bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {t}
                  {t === 'Express' && <span className="block text-xs font-normal">Faster, priority handling</span>}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm text-gray-600 mb-1 block">Preferred delivery date</label>
            <input
              type="date"
              value={deliveryDate}
              onChange={(e) => setDeliveryDate(e.target.value)}
              min={tomorrowStr()}
              required
              className="w-full border border-gray-200 rounded-lg px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <p className="text-xs text-gray-400 mt-1">
              The seller will confirm or suggest a different date once you place the order.
            </p>
          </div>

          {availableCoins > 0 && (
            <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer">
              <input
                type="checkbox"
                checked={useCoins}
                onChange={(e) => setUseCoins(e.target.checked)}
                className="mt-1"
              />
              <span className="text-sm text-amber-800">
                <span className="font-semibold">Use SuperCoins</span> — you have{' '}
                <span className="font-semibold">{availableCoins}</span> 🪙. Redeem{' '}
                <span className="font-semibold">{maxCoinsUsable}</span> now for ₹{maxCoinsUsable} off.
              </span>
            </label>
          )}

          <div className="pt-2 space-y-1">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Subtotal</span>
              <span>₹{totalPrice}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Coupon discount</span>
                <span>−₹{discountAmount}</span>
              </div>
            )}
            {coinsToRedeem > 0 && (
              <div className="flex justify-between text-sm text-amber-600">
                <span>SuperCoins redeemed</span>
                <span>−₹{coinsToRedeem}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-800 text-lg pt-1">
              <span>Total</span>
              <span>₹{finalTotal}</span>
            </div>
            {coinsToEarn > 0 && (
              <p className="text-xs text-amber-600 pt-1">You'll earn ~{coinsToEarn} 🪙 SuperCoins once this is delivered</p>
            )}
          </div>

          <button
            type="submit"
            disabled={placing}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-xl transition disabled:opacity-60"
          >
            {placing ? 'Placing order...' : 'Place Order'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutPage;
