import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const emptyForm = { product: '', thresholdQty: '', bonusCoins: '', label: '' };

const RewardTierManager = () => {
  const [tiers, setTiers] = useState([]);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    Promise.all([api.get('/reward-tiers/mine'), api.get('/products/seller/mine')])
      .then(([tiersRes, productsRes]) => {
        setTiers(tiersRes.data);
        setProducts(productsRes.data);
      })
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/reward-tiers', {
        ...form,
        thresholdQty: Number(form.thresholdQty),
        bonusCoins: Number(form.bonusCoins)
      });
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not create reward tier');
    }
  };

  const handleDelete = async (id) => {
    await api.delete(`/reward-tiers/${id}`);
    load();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Create a Quantity Reward</h2>
        <p className="text-sm text-gray-400 mb-4">
          Buyers purchasing at least this many units of a product in one order automatically win a
          fixed bonus of SuperCoins — revealed to them as a spin-the-wheel animation at checkout.
          The outcome isn't left to chance; it's exactly the rule you set here.
        </p>
        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
        <form onSubmit={handleSubmit} className="grid sm:grid-cols-4 gap-3">
          <select
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-2"
          >
            <option value="">Select product...</option>
            {products.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            type="number"
            min="1"
            placeholder="Min quantity"
            value={form.thresholdQty}
            onChange={(e) => setForm({ ...form, thresholdQty: e.target.value })}
            required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            type="number"
            min="1"
            placeholder="Bonus coins"
            value={form.bonusCoins}
            onChange={(e) => setForm({ ...form, bonusCoins: e.target.value })}
            required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm"
          />
          <input
            placeholder="Reveal label, e.g. Buy 3+ and win!"
            value={form.label}
            onChange={(e) => setForm({ ...form, label: e.target.value })}
            required
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm sm:col-span-3"
          />
          <button
            type="submit"
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition"
          >
            Create
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-4">Your Quantity Rewards</h2>
        {loading ? (
          <p className="text-gray-400">Loading...</p>
        ) : tiers.length === 0 ? (
          <p className="text-gray-400 text-sm">No reward tiers yet.</p>
        ) : (
          <div className="divide-y text-sm">
            {tiers.map((t) => (
              <div key={t._id} className="flex items-center justify-between py-3">
                <div>
                  <span className="font-semibold text-gray-800">{t.product?.name || 'Product'}</span>
                  <span className="text-gray-500 ml-2">
                    buy {t.thresholdQty}+ &rarr; {t.bonusCoins} 🪙 &mdash; "{t.label}"
                  </span>
                </div>
                <button onClick={() => handleDelete(t._id)} className="text-red-500 hover:underline">
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

export default RewardTierManager;
