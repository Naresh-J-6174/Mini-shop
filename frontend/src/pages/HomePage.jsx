import React, { useEffect, useMemo, useState } from 'react';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { mergeSort, sortComparators } from '../utils/mergeSort';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'priceLowToHigh', label: 'Price: Low to High' },
  { value: 'priceHighToLow', label: 'Price: High to Low' },
  { value: 'ratingHighToLow', label: 'Rating: High to Low' },
  { value: 'nameAZ', label: 'Name: A to Z' }
];

const CATEGORY_ICONS = {
  Electronics: '💻',
  Mobiles: '📱',
  Fashion: '👗',
  Clothing: '👕',
  Home: '🏠',
  Furniture: '🛋️',
  Beauty: '💄',
  Books: '📚',
  Sports: '🏸',
  Toys: '🧸',
  Grocery: '🛒',
  Appliances: '🔌',
  Jewelry: '💍',
  Footwear: '👟'
};
const categoryIcon = (name) => CATEGORY_ICONS[name] || '🛍️';

const TRUST_BADGES = [
  { icon: '✅', label: 'Verified Sellers Only' },
  { icon: '🪙', label: 'Earn SuperCoins Every Order' },
  { icon: '🔒', label: 'Secure Checkout' },
  { icon: '🚚', label: 'Delivery Date You Choose' }
];

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', {
        params: { search, category: activeCategory }
      });
      setProducts(data.products);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  useEffect(() => {
    api.get('/products/categories').then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    const timeout = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, activeCategory]);

  // Price range filter + merge sort are applied client-side on top of what
  // the server already returned (search + category), so switching sort/price
  // doesn't need another network round trip.
  const visibleProducts = useMemo(() => {
    let filtered = products;

    const min = minPrice !== '' ? Number(minPrice) : null;
    const max = maxPrice !== '' ? Number(maxPrice) : null;
    if (min !== null) filtered = filtered.filter((p) => p.price >= min);
    if (max !== null) filtered = filtered.filter((p) => p.price <= max);

    return mergeSort(filtered, sortComparators[sortBy]);
  }, [products, sortBy, minPrice, maxPrice]);

  return (
    <div>
      {/* Hero */}
      <div className="relative overflow-hidden bg-gradient-to-br from-brand-700 via-brand-600 to-indigo-500 text-white">
        {/* Decorative blurred orbs */}
        <div className="absolute -top-24 -left-24 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 -right-16 w-96 h-96 bg-indigo-300/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 py-20 text-center">
          <span className="inline-block bg-white/15 backdrop-blur px-4 py-1 rounded-full text-xs font-semibold tracking-wide uppercase mb-5">
            Multi-vendor marketplace
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 tracking-tight">
            Shop from Independent Sellers
          </h1>
          <p className="text-brand-100 max-w-xl mx-auto text-base md:text-lg">
            Every product here is listed by a verified seller and approved by our team &mdash;
            earn SuperCoins on every order along the way.
          </p>
          <div className="mt-9 max-w-xl mx-auto relative">
            <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search for products, brands and more..."
              className="w-full pl-12 pr-5 py-3.5 rounded-full text-gray-800 shadow-lg shadow-black/10 focus:outline-none focus:ring-4 focus:ring-brand-300"
            />
          </div>

          {/* Trust badges */}
          <div className="mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3">
            {TRUST_BADGES.map((b) => (
              <div key={b.label} className="flex items-center gap-2 text-sm text-brand-50">
                <span className="text-base">{b.icon}</span>
                {b.label}
              </div>
            ))}
          </div>
        </div>

        {/* Soft bottom curve into the page body */}
        <div className="h-10 bg-gray-50 rounded-t-[2.5rem] relative -mt-6" />
      </div>

      <div className="max-w-7xl mx-auto px-4 -mt-8 pb-10 relative">
        {/* Category showcase */}
        {categories.length > 0 && (
          <div className="mb-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex gap-3 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveCategory('All')}
                className={`flex flex-col items-center gap-2 min-w-[84px] px-3 py-3 rounded-xl transition ${
                  activeCategory === 'All' ? 'bg-brand-50 ring-2 ring-brand-400' : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">🛍️</span>
                <span className="text-xs font-medium text-gray-600">All</span>
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex flex-col items-center gap-2 min-w-[84px] px-3 py-3 rounded-xl transition ${
                    activeCategory === cat ? 'bg-brand-50 ring-2 ring-brand-400' : 'hover:bg-gray-50'
                  }`}
                >
                  <span className="text-2xl">{categoryIcon(cat)}</span>
                  <span className="text-xs font-medium text-gray-600 text-center leading-tight">{cat}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Sort + price range filter bar */}
        <div className="flex flex-wrap items-center gap-4 mb-8 bg-white rounded-xl border border-gray-100 p-4 shadow-sm">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500 font-medium">Price</label>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <span className="text-gray-400">–</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            {(minPrice || maxPrice) && (
              <button
                onClick={() => {
                  setMinPrice('');
                  setMaxPrice('');
                }}
                className="text-xs text-brand-600 font-medium hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          {activeCategory !== 'All' && (
            <span className="flex items-center gap-1.5 bg-brand-50 text-brand-700 text-xs font-semibold px-3 py-1.5 rounded-full">
              {categoryIcon(activeCategory)} {activeCategory}
              <button onClick={() => setActiveCategory('All')} className="ml-1 text-brand-400 hover:text-brand-700">
                ✕
              </button>
            </span>
          )}

          <span className="ml-auto text-sm text-gray-400">
            {visibleProducts.length} product{visibleProducts.length !== 1 ? 's' : ''}
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {Array.from({ length: 10 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden animate-pulse">
                <div className="h-44 bg-gray-100" />
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-gray-100 rounded w-1/3" />
                  <div className="h-4 bg-gray-100 rounded w-4/5" />
                  <div className="h-4 bg-gray-100 rounded w-1/2 mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : visibleProducts.length === 0 ? (
          <div className="text-center py-24">
            <p className="text-5xl mb-3">🔎</p>
            <p className="text-gray-400">No products found. Try a different search or category.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
            {visibleProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
