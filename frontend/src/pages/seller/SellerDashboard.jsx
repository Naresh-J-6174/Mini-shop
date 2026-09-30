import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import RevenueReport from '../../components/seller/RevenueReport';
import LotteryPanel from '../../components/seller/LotteryPanel';
import CouponManager from '../../components/seller/CouponManager';
import SellerOrders from '../../components/seller/SellerOrders';
import RewardTierManager from '../../components/seller/RewardTierManager';

const emptyForm = {
  name: '',
  image: '',
  description: '',
  category: '',
  price: '',
  countInStock: '',
  lowStockThreshold: 5
};

const TABS = ['Products', 'Orders', 'Revenue Report', 'Lottery', 'Coupons', 'Rewards'];

const SellerDashboard = () => {
  const { user } = useAuth();
  const [tab, setTab] = useState('Products');
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  const fetchProducts = () => {
    setLoading(true);
    api
      .get('/products/seller/mine')
      .then(({ data }) => setProducts(data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (user?.isApproved) fetchProducts();
    else setLoading(false);
  }, [user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const resetForm = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleImageFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const body = new FormData();
      body.append('image', file);
      // Let the browser set the multipart Content-Type header (with boundary) itself —
      // setting it manually here would strip the boundary and break upload parsing.
      const { data } = await api.post('/upload/image', body);
      setForm((f) => ({ ...f, image: data.url }));
    } catch (err) {
      setError(err.response?.data?.message || 'Image upload failed');
    }
    setUploading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!form.image) {
      setError('Please upload a product photo');
      return;
    }
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        countInStock: Number(form.countInStock),
        lowStockThreshold: Number(form.lowStockThreshold) || 5
      };
      if (editingId) {
        await api.put(`/products/${editingId}`, payload);
      } else {
        await api.post('/products', payload);
      }
      resetForm();
      fetchProducts();
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    }
  };

  const handleEdit = (product) => {
    setForm({
      name: product.name,
      image: product.image,
      description: product.description,
      category: product.category,
      price: product.price,
      countInStock: product.countInStock,
      lowStockThreshold: product.lowStockThreshold ?? 5
    });
    setEditingId(product._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    await api.delete(`/products/${id}`);
    fetchProducts();
  };

  if (!user?.isApproved) {
    return (
      <div className="max-w-lg mx-auto text-center py-24 px-4">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <h2 className="text-xl font-bold text-amber-800 mb-2">Pending Admin Approval</h2>
          <p className="text-amber-700 text-sm">
            Your seller account, <strong>{user.shopName}</strong>, is waiting for an admin to approve
            it. You'll be able to list products once approved.
          </p>
        </div>
      </div>
    );
  }

  const lowStockProducts = products.filter((p) => p.countInStock <= (p.lowStockThreshold ?? 5) && p.countInStock > 0);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{user.shopName}</h1>
          <p className="text-gray-500 text-sm">Manage your store</p>
        </div>
        {tab === 'Products' && (
          <button
            onClick={() => (showForm ? resetForm() : setShowForm(true))}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl transition"
          >
            {showForm ? 'Cancel' : '+ Add Product'}
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 transition ${
              tab === t ? 'border-brand-600 text-brand-700' : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Products' && (
        <>
          {lowStockProducts.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 text-sm text-red-700">
              ⚠️ Low stock: {lowStockProducts.map((p) => `${p.name} (${p.countInStock} left)`).join(', ')}
            </div>
          )}

          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl shadow-sm p-6 mb-8 grid md:grid-cols-2 gap-4"
            >
              {error && <p className="md:col-span-2 text-red-500 text-sm">{error}</p>}
              <input
                name="name"
                placeholder="Product Name"
                value={form.name}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-4 py-2.5"
              />
              <input
                name="category"
                placeholder="Category (e.g. Electronics)"
                value={form.category}
                onChange={handleChange}
                required
                className="border border-gray-200 rounded-lg px-4 py-2.5"
              />
              <div className="md:col-span-2 flex items-center gap-4">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Preview"
                    className="w-16 h-16 object-contain border border-gray-200 rounded-lg bg-white"
                  />
                ) : (
                  <div className="w-16 h-16 flex items-center justify-center border border-dashed border-gray-300 rounded-lg text-gray-300 text-xs">
                    No image
                  </div>
                )}
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFile}
                    disabled={uploading}
                    className="block w-full text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700 file:font-semibold hover:file:bg-brand-100"
                  />
                  {uploading && <p className="text-xs text-gray-400 mt-1">Uploading...</p>}
                  {!uploading && !form.image && (
                    <p className="text-xs text-gray-400 mt-1">Required — upload a product photo</p>
                  )}
                </div>
              </div>
              <input
                name="price"
                type="number"
                placeholder="Price (₹)"
                value={form.price}
                onChange={handleChange}
                required
                min="0"
                className="border border-gray-200 rounded-lg px-4 py-2.5"
              />
              <input
                name="countInStock"
                type="number"
                placeholder="Stock Quantity"
                value={form.countInStock}
                onChange={handleChange}
                required
                min="0"
                className="border border-gray-200 rounded-lg px-4 py-2.5"
              />
              <input
                name="lowStockThreshold"
                type="number"
                placeholder="Low stock alert threshold"
                value={form.lowStockThreshold}
                onChange={handleChange}
                min="0"
                className="border border-gray-200 rounded-lg px-4 py-2.5"
              />
              <textarea
                name="description"
                placeholder="Description"
                value={form.description}
                onChange={handleChange}
                required
                rows={3}
                className="border border-gray-200 rounded-lg px-4 py-2.5 md:col-span-2"
              />
              <button
                type="submit"
                className="md:col-span-2 bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-lg transition"
              >
                {editingId ? 'Update Product' : 'Submit for Approval'}
              </button>
            </form>
          )}

          {loading ? (
            <p className="text-gray-400">Loading...</p>
          ) : products.length === 0 ? (
            <p className="text-gray-400">You haven't listed any products yet.</p>
          ) : (
            <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-gray-500 text-left">
                  <tr>
                    <th className="p-4">Product</th>
                    <th className="p-4">Price</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Rating</th>
                    <th className="p-4">Status</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products.map((p) => (
                    <tr key={p._id}>
                      <td className="p-4 flex items-center gap-3">
                        <img src={p.image} alt={p.name} className="w-10 h-10 object-contain" />
                        {p.name}
                      </td>
                      <td className="p-4">₹{p.price}</td>
                      <td className="p-4">
                        <span className={p.countInStock <= (p.lowStockThreshold ?? 5) ? 'text-red-600 font-semibold' : ''}>
                          {p.countInStock}
                        </span>
                      </td>
                      <td className="p-4">{p.numReviews > 0 ? `★ ${p.rating.toFixed(1)} (${p.numReviews})` : '—'}</td>
                      <td className="p-4">
                        <span
                          className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            p.isApproved
                              ? 'bg-green-100 text-green-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {p.isApproved ? 'Approved' : 'Pending'}
                        </span>
                      </td>
                      <td className="p-4 space-x-3">
                        <button
                          onClick={() => handleEdit(p)}
                          className="text-brand-600 font-medium hover:underline"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(p._id)}
                          className="text-red-500 font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === 'Orders' && <SellerOrders />}
      {tab === 'Revenue Report' && <RevenueReport />}
      {tab === 'Lottery' && <LotteryPanel />}
      {tab === 'Coupons' && <CouponManager />}
      {tab === 'Rewards' && <RewardTierManager />}
    </div>
  );
};

export default SellerDashboard;
