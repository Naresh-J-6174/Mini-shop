import Order from '../models/Order.js';
import mongoose from 'mongoose';

// Shared aggregation: every paid order-item belonging to this seller, in an optional date range
const getSellerLineItems = async (sellerId, from, to) => {
  const match = {
    isPaid: true,
    'orderItems.seller': new mongoose.Types.ObjectId(sellerId)
  };
  if (from || to) {
    match.paidAt = {};
    if (from) match.paidAt.$gte = new Date(from);
    if (to) match.paidAt.$lte = new Date(to);
  }

  const orders = await Order.find(match).sort({ paidAt: 1 });

  const lineItems = [];
  for (const order of orders) {
    for (const item of order.orderItems) {
      if (item.seller.toString() === sellerId.toString()) {
        lineItems.push({
          orderId: order._id,
          date: order.paidAt,
          productName: item.name,
          qty: item.qty,
          price: item.price,
          lineTotal: item.qty * item.price
        });
      }
    }
  }
  return lineItems;
};

// @desc Seller: revenue summary for dashboard (totals, top products, day-by-day series)
// @route GET /api/reports/seller/summary?from=&to=
export const getSellerRevenueSummary = async (req, res) => {
  const { from, to } = req.query;
  const lineItems = await getSellerLineItems(req.user._id, from, to);

  const totalRevenue = lineItems.reduce((sum, i) => sum + i.lineTotal, 0);
  const totalUnitsSold = lineItems.reduce((sum, i) => sum + i.qty, 0);
  const orderIds = new Set(lineItems.map((i) => i.orderId.toString()));

  const byProduct = {};
  for (const item of lineItems) {
    if (!byProduct[item.productName]) byProduct[item.productName] = { qty: 0, revenue: 0 };
    byProduct[item.productName].qty += item.qty;
    byProduct[item.productName].revenue += item.lineTotal;
  }
  const topProducts = Object.entries(byProduct)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  const byDay = {};
  for (const item of lineItems) {
    const day = item.date ? item.date.toISOString().slice(0, 10) : 'unknown';
    byDay[day] = (byDay[day] || 0) + item.lineTotal;
  }
  const dailyRevenue = Object.entries(byDay)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  res.json({
    totalRevenue,
    totalOrders: orderIds.size,
    totalUnitsSold,
    topProducts,
    dailyRevenue
  });
};

// @desc Seller: download the same data as a CSV for offline accounting/tallying
// @route GET /api/reports/seller/download?from=&to=
export const downloadSellerRevenueCSV = async (req, res) => {
  const { from, to } = req.query;
  const lineItems = await getSellerLineItems(req.user._id, from, to);

  const header = 'Order ID,Date,Product,Qty,Unit Price,Line Total\n';
  const rows = lineItems
    .map((i) =>
      [
        i.orderId,
        i.date ? i.date.toISOString().slice(0, 10) : '',
        `"${i.productName.replace(/"/g, '""')}"`,
        i.qty,
        i.price,
        i.lineTotal
      ].join(',')
    )
    .join('\n');
  const totalRow = `\nTOTAL,,,,,${lineItems.reduce((s, i) => s + i.lineTotal, 0)}\n`;

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="revenue-report.csv"');
  res.send(header + rows + totalRow);
};
