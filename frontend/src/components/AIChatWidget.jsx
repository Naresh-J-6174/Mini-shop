import React, { useState, useRef, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const AIChatWidget = () => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState([]); // {role: 'user'|'assistant', content}
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, open]);

  if (!user) return null; // AI assistant is only available to logged-in buyers/sellers

  const greeting =
    user.role === 'seller'
      ? "Hi! Ask me about your sales, low stock, or for help polishing a listing."
      : "Hi! Ask me to help you find a product, compare options, or answer questions.";

  const handleSend = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const nextMessages = [...messages, { role: 'user', content: text }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const { data } = await api.post('/ai/chat', {
        message: text,
        history: nextMessages.slice(0, -1)
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: err.response?.data?.message || "Sorry, I couldn't respond just now."
        }
      ]);
    }
    setSending(false);
  };

  return (
    <div className="fixed bottom-5 right-5 z-50">
      {open && (
        <div className="mb-3 w-80 sm:w-96 h-[28rem] bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
          <div className="bg-gradient-to-r from-gray-900 to-brand-700 text-white px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">
              ShopHub Assistant {user.role === 'seller' ? '· Seller' : ''}
            </span>
            <button onClick={() => setOpen(false)} className="text-white/70 hover:text-white text-lg leading-none">
              ×
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 text-sm">
            <div className="bg-brand-50 text-gray-700 rounded-xl rounded-tl-none px-3 py-2 max-w-[85%]">
              {greeting}
            </div>
            {messages.map((m, i) => (
              <div
                key={i}
                className={`px-3 py-2 rounded-xl max-w-[85%] whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-brand-600 text-white ml-auto rounded-tr-none'
                    : 'bg-gray-100 text-gray-800 rounded-tl-none'
                }`}
              >
                {m.content}
              </div>
            ))}
            {sending && <div className="text-gray-400 text-xs">Thinking...</div>}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSend} className="p-3 border-t border-gray-100 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={user.role === 'seller' ? 'Ask about your store...' : 'Ask about products...'}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-400"
            />
            <button
              type="submit"
              disabled={sending}
              className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 rounded-lg disabled:opacity-60"
            >
              Send
            </button>
          </form>
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-14 h-14 rounded-full bg-brand-600 hover:bg-brand-700 text-white shadow-xl flex items-center justify-center text-2xl"
        aria-label="Open AI assistant"
      >
        {open ? '×' : '💬'}
      </button>
    </div>
  );
};

export default AIChatWidget;
