import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../context/AuthContext';

const OrdersPage = () => {
  const { refreshProfile } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lottery, setLottery] = useState({ entries: [], wins: [] });

  useEffect(() => {
    api
      .get('/orders/myorders')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
    api.get('/lottery/my-entries').then(({ data }) => setLottery(data)).catch(() => {});
    // Pick up any SuperCoins credited since the last login/refresh (e.g. an order just delivered)
    refreshProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (loading) return <p className="text-center py-20 text-gray-400">Loading...</p>;

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>

      {lottery.wins.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h2 className="font-bold text-amber-800 mb-1">🎉 You've won a lottery draw!</h2>
          {lottery.wins.map((w) => (
            <p key={w._id} className="text-sm text-amber-700">
              Winner of {w.seller?.shopName}'s draw on {new Date(w.drawnAt).toLocaleDateString()}
            </p>
          ))}
        </div>
      )}
      {lottery.entries.length > 0 && (
        <p className="text-xs text-gray-400 mb-6">
          You currently have {lottery.entries.filter((e) => !e.draw).length} open lottery
          entr{lottery.entries.filter((e) => !e.draw).length === 1 ? 'y' : 'ies'} from qualifying orders.
        </p>
      )}

      {orders.length === 0 ? (
        <p className="text-gray-400">You haven't placed any orders yet.</p>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex justify-between items-center mb-3 flex-wrap gap-2">
                <span className="text-sm text-gray-400">
                  Order #{order._id.slice(-6).toUpperCase()} ·{' '}
                  {new Date(order.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      order.isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {order.isPaid ? 'Paid' : 'Payment Pending'}
                  </span>
                  {order.isPaid && <StatusBadge status={order.status} />}
                </div>
              </div>
              {order.delivery && (
                <div className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2 mb-3">
                  <span className="text-gray-500">
                    {order.delivery.type} delivery requested for{' '}
                    {new Date(order.delivery.requestedDate).toLocaleDateString()}
                    {order.delivery.status !== 'Pending' && order.delivery.sellerNote && (
                      <span className="italic"> — "{order.delivery.sellerNote}"</span>
                    )}
                  </span>
                  <span
                    className={`font-semibold px-2.5 py-1 rounded-full ${
                      order.delivery.status === 'Accepted'
                        ? 'bg-green-100 text-green-700'
                        : order.delivery.status === 'Rejected'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {order.delivery.status === 'Pending'
                      ? 'Awaiting seller confirmation'
                      : order.delivery.status}
                  </span>
                </div>
              )}
              <div className="divide-y">
                {order.orderItems.map((item, i) => (
                  <div key={i} className="flex justify-between items-center py-2 text-sm">
                    <span>
                      {item.name} × {item.qty}
                    </span>
                    <div className="flex items-center gap-3">
                      <span>₹{item.price * item.qty}</span>
                      {order.isPaid && order.status === 'Delivered' && (
                        <Link to={`/product/${item.product}`} className="text-brand-600 text-xs hover:underline">
                          Review
                        </Link>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {order.discountAmount > 0 && (
                <div className="text-right text-xs text-green-600 mt-2">
                  Coupon {order.couponCode} applied: −₹{order.discountAmount}
                </div>
              )}
              {order.coinsRedeemed > 0 && (
                <div className="text-right text-xs text-amber-600 mt-1">
                  🪙 {order.coinsRedeemed} SuperCoins redeemed: −₹{order.coinsRedeemed}
                </div>
              )}
              <div className="text-right font-semibold mt-2 text-gray-800">
                Total: ₹{order.totalPrice}
              </div>
              {order.status === 'Delivered' && order.coinsEarned > 0 && (
                <div className="text-right text-xs text-amber-600 mt-1">
                  🪙 You earned {order.coinsEarned} SuperCoins from this order
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersPage;
