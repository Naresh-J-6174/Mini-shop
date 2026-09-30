import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Stars = ({ value, onChange }) => (
  <div className="flex gap-1 text-2xl">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        type="button"
        key={n}
        onClick={() => onChange?.(n)}
        className={`${n <= value ? 'text-amber-400' : 'text-gray-200'} ${onChange ? 'cursor-pointer' : ''}`}
      >
        ★
      </button>
    ))}
  </div>
);

const ReviewSection = ({ productId }) => {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadReviews = () => {
    api.get(`/reviews/product/${productId}`).then(({ data }) => setReviews(data));
  };

  useEffect(() => {
    loadReviews();
  }, [productId]);

  useEffect(() => {
    if (!user || user.role !== 'buyer') return;

    api.get('/reviews/mine').then(({ data }) => {
      setAlreadyReviewed(data.some((r) => r.product === productId));
    });

    api.get('/orders/myorders').then(({ data }) => {
      const paidWithProduct = data.filter(
        (o) => o.isPaid && o.orderItems.some((i) => i.product === productId)
      );
      setEligibleOrders(paidWithProduct);
    });
  }, [user, productId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await api.post('/reviews', {
        product: productId,
        order: eligibleOrders[0]._id,
        rating,
        comment
      });
      setComment('');
      setRating(5);
      setAlreadyReviewed(true);
      loadReviews();
    } catch (err) {
      setError(err.response?.data?.message || 'Could not submit review');
    }
    setSubmitting(false);
  };

  const canReview = user?.role === 'buyer' && eligibleOrders.length > 0 && !alreadyReviewed;

  return (
    <div className="mt-10 bg-white rounded-2xl shadow-sm p-8">
      <h2 className="text-lg font-bold text-gray-900 mb-4">Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>

      {canReview && (
        <form onSubmit={handleSubmit} className="mb-6 border-b border-gray-100 pb-6 space-y-3">
          <p className="text-sm text-gray-500">You bought this — leave a review:</p>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Stars value={rating} onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="What did you think of this product?"
            required
            rows={3}
            className="w-full border border-gray-200 rounded-lg px-4 py-2.5"
          />
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 text-white font-semibold px-6 py-2 rounded-lg transition disabled:opacity-60"
          >
            {submitting ? 'Submitting...' : 'Submit Review'}
          </button>
        </form>
      )}

      {reviews.length === 0 ? (
        <p className="text-gray-400 text-sm">No reviews yet — be the first to buy and review this.</p>
      ) : (
        <div className="space-y-5">
          {reviews.map((r) => (
            <div key={r._id} className="border-b border-gray-50 pb-4 last:border-0">
              <div className="flex items-center justify-between mb-1">
                <span className="font-semibold text-gray-800 text-sm">{r.user?.name || 'Buyer'}</span>
                <Stars value={r.rating} />
              </div>
              <p className="text-gray-600 text-sm">{r.comment}</p>
              <p className="text-xs text-gray-300 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewSection;
