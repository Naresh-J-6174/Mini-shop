import React, { useEffect, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import api from '../../api/axios';

const todayISO = () => new Date().toISOString().slice(0, 10);
const monthAgoISO = () => {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
};

const RevenueReport = () => {
  const [from, setFrom] = useState(monthAgoISO());
  const [to, setTo] = useState(todayISO());
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    api
      .get('/reports/seller/summary', { params: { from, to } })
      .then(({ data }) => setSummary(data))
      .finally(() => setLoading(false));
  };

  useEffect(load, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDownload = () => {
    const url = `${api.defaults.baseURL}/reports/seller/download?from=${from}&to=${to}`;
    window.open(url, '_blank');
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm p-6">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Revenue Report</h2>
          <p className="text-gray-500 text-sm">For accounting and tallying your sales</p>
        </div>
        <div className="flex items-end gap-2">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From</label>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To</label>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
            />
          </div>
          <button
            onClick={load}
            className="bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Update
          </button>
          <button
            onClick={handleDownload}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition"
          >
            Download CSV
          </button>
        </div>
      </div>

      {loading || !summary ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <>
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-brand-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{summary.totalRevenue}</p>
            </div>
            <div className="bg-amber-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Paid Orders</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalOrders}</p>
            </div>
            <div className="bg-green-50 rounded-xl p-4">
              <p className="text-xs text-gray-500">Units Sold</p>
              <p className="text-2xl font-bold text-gray-900">{summary.totalUnitsSold}</p>
            </div>
          </div>

          {summary.dailyRevenue.length > 0 ? (
            <div className="h-64 mb-6">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.dailyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v) => [`₹${v}`, 'Revenue']} />
                  <Line type="monotone" dataKey="revenue" stroke="#4338ca" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-gray-400 text-sm mb-6">No paid sales in this range yet.</p>
          )}

          {summary.topProducts.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Top Products</h3>
              <div className="divide-y">
                {summary.topProducts.map((p) => (
                  <div key={p.name} className="flex justify-between py-2 text-sm">
                    <span>{p.name} ({p.qty} sold)</span>
                    <span className="font-medium">₹{p.revenue}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default RevenueReport;
