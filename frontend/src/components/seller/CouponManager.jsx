import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyForm = { code: '', discountPercent: '', minOrderAmount: '', expiresAt: '' };

const CouponManager = () => {
  const [coupons, setCoupons] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    api
      .get('/coupons/mine')
      .then(({ data }) => setCoupons(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/coupons', {
        ...form,
        discountPercent: Number(form.discountPercent),
        minOrderAmount: Number(form.minOrderAmount) || 0,
        expiresAt: form.expiresAt || undefined
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create coupon');
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/coupons/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Create a Coupon</h2>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-3">
          <input
            placeholder="CODE (e.g. WELCOME10)"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-1"
          />
          <input
            type="number"
            min="1"
            max="90"
            placeholder="Discount %"
            value={form.discountPercent}
            onChange={(e) => setForm({ ...form, discountPercent: e.target.value })}
            required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="0"
            placeholder="Min order ₹ (optional)"
            value={form.minOrderAmount}
            onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="date"
            value={form.expiresAt}
            onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <button
            type="submit"
            className="sm:col-span-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Create Coupon
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Your Coupons</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : coupons.length === 0 ? (
          <p className="text-gray-400 text-sm">No coupons yet.</p>
        ) : (
          <div className="divide-y text-sm">
            {coupons.map((c) => (
              <div key={c._id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-semibold text-gray-800">{c.code}</span>
                  <span className="text-gray-500 ml-2">
                    {c.discountPercent}% off
                    {c.minOrderAmount > 0 && `, min ₹${c.minOrderAmount}`}
                    {c.expiresAt && `, expires ${new Date(c.expiresAt).toLocaleDateString()}`}
                  </span>
                </div>
                <button onClick={() => handleDelete(c._id)} className="text-red-500 hover:underline">
                  Delete
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CouponManager;
