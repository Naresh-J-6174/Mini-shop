import Product from '../models/Product.js';
import Order from '../models/Order.js';

// Google's Gemini API — free tier available at https://aistudio.google.com/app/apikey
const MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';

// Build grounding context so the assistant isn't just guessing at what's on the site
const buildBuyerContext = async (message) => {
  const keywords = (message.match(/[a-zA-Z]{3,}/g) || []).slice(0, 6);
  const filter = { isApproved: true };
  if (keywords.length) {
    filter.$or = [
      { name: { $regex: keywords.join('|'), $options: 'i' } },
      { category: { $regex: keywords.join('|'), $options: 'i' } }
    ];
  }
  let products = await Product.find(filter).limit(8).select('name category price rating countInStock');
  if (products.length === 0) {
    products = await Product.find({ isApproved: true }).sort({ createdAt: -1 }).limit(8)
      .select('name category price rating countInStock');
  }
  const catalog = products
    .map((p) => `- ${p.name} (${p.category}) — ₹${p.price}, rating ${p.rating.toFixed(1)}, ${p.countInStock} in stock`)
    .join('\n');

  return `You are ShopHub's buyer-facing shopping assistant. Help the customer find products, answer
questions about them, and give honest recommendations. Only recommend items from the catalog
snippet below — never invent products, prices or stock that aren't listed. If nothing here fits,
say so plainly and suggest what to search for instead. Keep replies short and conversational.
Mention that customers earn SuperCoins on every delivered order and can redeem them at checkout
for a discount, if it's relevant to what they're asking.

Catalog snippet (subset of live approved listings, matched to the customer's message):
${catalog || '(no matching products found)'}`;
};

const buildSellerContext = async (sellerId) => {
  const products = await Product.find({ seller: sellerId });
  const pendingProducts = products.filter((p) => !p.isApproved).length;
  const lowStock = products.filter((p) => p.countInStock <= (p.lowStockThreshold ?? 5)).length;

  const orders = await Order.find({ 'orderItems.seller': sellerId, isPaid: true });
  let revenue = 0;
  let unitsSold = 0;
  let pendingDeliveryRequests = 0;
  for (const order of orders) {
    if (order.delivery?.status === 'Pending') pendingDeliveryRequests += 1;
    for (const item of order.orderItems) {
      if (item.seller.toString() === sellerId.toString()) {
        revenue += item.price * item.qty;
        unitsSold += item.qty;
      }
    }
  }

  return `You are ShopHub's seller-facing assistant. Help this seller understand their store's
performance and improve their listings (e.g. tightening a product description, suggesting a
price, spotting risks). Be concrete and use the numbers below rather than generic advice. Keep
replies short.

Seller snapshot:
- Live products: ${products.length} (${pendingProducts} pending admin approval, ${lowStock} low on stock)
- Total paid revenue: ₹${revenue}
- Units sold: ${unitsSold}
- Delivery-date requests awaiting your response: ${pendingDeliveryRequests}`;
};

// Gemini uses 'user' / 'model' roles (not 'assistant'), and takes the system prompt via a
// separate systemInstruction field rather than as a message in the array.
const toGeminiContents = (history) =>
  (Array.isArray(history) ? history : [])
    .filter((m) => m && typeof m.content === 'string' && m.content.trim())
    .slice(-8)
    .map((m) => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

// @desc Chat with the AI assistant. Behavior adapts to req.user.role (buyer vs seller/admin).
// @route POST /api/ai/chat
export const chat = async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({
        message:
          'AI assistant is not configured yet — add a free GEMINI_API_KEY to backend/.env ' +
          '(aistudio.google.com/app/apikey)'
      });
    }

    const { message, history } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ message: 'message is required' });
    }

    const system =
      req.user.role === 'seller'
        ? await buildSellerContext(req.user._id)
        : await buildBuyerContext(message);

    const contents = [...toGeminiContents(history), { role: 'user', parts: [{ text: message }] }];

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { role: 'system', parts: [{ text: system }] },
        contents,
        generationConfig: { maxOutputTokens: 500 }
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error('Gemini API error:', response.status, errText);
      return res.status(502).json({ message: 'AI assistant is temporarily unavailable' });
    }

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.map((p) => p.text).join('') || '';
    res.json({ reply: reply || "Sorry, I couldn't come up with a reply — try rephrasing that?" });
  } catch (error) {
    console.error('AI chat error:', error);
    res.status(500).json({ message: 'AI assistant failed to respond' });
  }
};
