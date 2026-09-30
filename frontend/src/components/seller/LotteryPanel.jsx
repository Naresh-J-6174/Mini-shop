import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

const LotteryPanel = () => {
  const [settings, setSettings] = useState({ enabled: false, minAmount: 0 });
  const [pool, setPool] = useState({ count: 0, entries: [] });
  const [draws, setDraws] = useState([]);
  const [saving, setSaving] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [message, setMessage] = useState('');

  const loadAll = () => {
    api.get('/lottery/settings').then(({ data }) => setSettings(data));
    api.get('/lottery/pool').then(({ data }) => setPool(data));
    api.get('/lottery/draws').then(({ data }) => setDraws(data));
  };

  useEffect(loadAll, []);

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const { data } = await api.put('/lottery/settings', settings);
      setSettings(data);
      setMessage('Saved.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not save settings');
    }
    setSaving(false);
  };

  const handleDraw = async () => {
    setDrawing(true);
    setMessage('');
    try {
      const { data } = await api.post('/lottery/draw');
      setMessage(`🎉 Winner: ${data.winner.name} (${data.winner.email}) out of ${data.totalEntries} entries`);
      loadAll();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Could not run the draw');
    }
    setDrawing(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl shadow-sm p-6">
        <h2 className="text-lg font-bold text-gray-900 mb-1">Buyer Lottery</h2>
        <p className="text-gray-500 text-sm mb-4">
          Reward buyers who spend above a threshold with you — they're automatically entered when
          their order is paid.
        </p>
        {message && <p className="text-sm text-brand-700 mb-3">{message}</p>}
        <form onSubmit={handleSave} className="flex flex-wrap items-end gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
              className="w-4 h-4"
            />
            Enable lottery
          </label>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Qualifying spend (₹)</label>
            <input
              type="number"
              min="0"
              value={settings.minAmount}
              onChange={(e) => setSettings({ ...settings, minAmount: e.target.value })}
              className="border border-gray-200 rounded-lg px-3 py-2 text-sm w-32"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-5 py-2 rounded-lg transition disabled:opacity-60"
          >
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </form>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Current Pool</h2>
            <p className="text-gray-500 text-sm">{pool.count} open entr{pool.count === 1 ? 'y' : 'ies'}</p>
          </div>
          <button
            onClick={handleDraw}
            disabled={drawing || pool.count === 0}
            className="bg-amber-500 hover:bg-amber-600 text-white font-semibold px-5 py-2.5 rounded-xl transition disabled:opacity-50"
          >
            {drawing ? 'Drawing...' : '🎲 Draw a Winner'}
          </button>
        </div>
        {pool.entries.length > 0 && (
          <div className="divide-y text-sm">
            {pool.entries.map((e) => (
              <div key={e._id} className="flex justify-between py-2">
                <span>{e.buyer?.name}</span>
                <span className="text-gray-500">₹{e.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {draws.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Past Draws</h2>
          <div className="divide-y text-sm">
            {draws.map((d) => (
              <div key={d._id} className="flex justify-between py-2">
                <span>
                  {d.winner?.name} won out of {d.totalEntries} entries
                </span>
                <span className="text-gray-400">{new Date(d.drawnAt).toLocaleDateString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LotteryPanel;
