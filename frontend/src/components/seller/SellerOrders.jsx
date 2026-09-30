import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import StatusBadge from '../StatusBadge';

const STATUSES = ['Processing', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const DELIVERY_STYLES = {
  Pending: 'bg-amber-100 text-amber-700',
  Accepted: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700'
};

const SellerOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [noteDrafts, setNoteDrafts] = useState({}); // orderId -> note text while responding

  const load = () => {
    setLoading(true);
    api
      .get('/orders/seller/mine')
      .then(({ data }) => setOrders(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleStatusChange = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliveryResponse = async (orderId, status) => {
    setUpdatingId(orderId);
    try {
      await api.put(`/orders/${orderId}/delivery/respond`, {
        status,
        sellerNote: noteDrafts[orderId] || ''
      });
      load();
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (orders.length === 0) return <p className="text-gray-400">No orders containing your products yet.</p>;

  return (
    <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-500 text-left">
          <tr>
            <th className="p-4">Order</th>
            <th className="p-4">Your Items</th>
            <th className="p-4">Paid</th>
            <th className="p-4">Delivery Request</th>
            <th className="p-4">Status</th>
            <th className="p-4">Update</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {orders.map((order) => (
            <tr key={order._id}>
              <td className="p-4 text-gray-500 align-top">
                #{order._id.slice(-6).toUpperCase()}
                <br />
                <span className="text-xs">{new Date(order.createdAt).toLocaleDateString()}</span>
              </td>
              <td className="p-4 align-top">
                {order.orderItems.map((i, idx) => (
                  <div key={idx}>
                    {i.name} × {i.qty}
                  </div>
                ))}
              </td>
              <td className="p-4 align-top">{order.isPaid ? '✅' : '—'}</td>
              <td className="p-4 align-top min-w-[220px]">
                {order.delivery ? (
                  <div className="space-y-1.5">
                    <div className="text-xs text-gray-500">
                      {order.delivery.type} ·{' '}
                      {order.delivery.requestedDate
                        ? new Date(order.delivery.requestedDate).toLocaleDateString()
                        : '—'}
                    </div>
                    <span
                      className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${
                        DELIVERY_STYLES[order.delivery.status] || 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {order.delivery.status}
                    </span>
                    {order.delivery.status === 'Pending' && (
                      <div className="pt-1 space-y-1.5">
                        <input
                          placeholder="Note to buyer (optional)"
                          value={noteDrafts[order._id] || ''}
                          onChange={(e) =>
                            setNoteDrafts({ ...noteDrafts, [order._id]: e.target.value })
                          }
                          className="w-full border border-gray-200 rounded-md px-2 py-1 text-xs"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDeliveryResponse(order._id, 'Accepted')}
                            disabled={updatingId === order._id}
                            className="text-xs font-semibold bg-green-600 hover:bg-green-700 text-white px-2.5 py-1 rounded-md disabled:opacity-50"
                          >
                            Accept date
                          </button>
                          <button
                            onClick={() => handleDeliveryResponse(order._id, 'Rejected')}
                            disabled={updatingId === order._id}
                            className="text-xs font-semibold bg-red-500 hover:bg-red-600 text-white px-2.5 py-1 rounded-md disabled:opacity-50"
                          >
                            Suggest new date
                          </button>
                        </div>
                      </div>
                    )}
                    {order.delivery.status !== 'Pending' && order.delivery.sellerNote && (
                      <div className="text-xs text-gray-400 italic">"{order.delivery.sellerNote}"</div>
                    )}
                  </div>
                ) : (
                  '—'
                )}
              </td>
              <td className="p-4 align-top">
                <StatusBadge status={order.status} />
              </td>
              <td className="p-4 align-top">
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order._id, e.target.value)}
                  disabled={!order.isPaid || updatingId === order._id}
                  className="border border-gray-200 rounded-lg px-2 py-1.5 text-sm disabled:opacity-50"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default SellerOrders;
