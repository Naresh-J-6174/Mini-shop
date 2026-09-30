import React, { useEffect, useState } from 'react';

// 8 decorative wedges. The last wedge (index 7) is the "prize" wedge — the wheel always spins to
// land the pointer on it, because the reward itself was already determined server-side by the
// buyer's purchase quantity (see RewardTier). This is a reveal effect, not a game of chance.
const WEDGES = ['✨', '🎁', '⭐', '🛍️', '💫', '🎉', '🪙', 'WIN'];
const WEDGE_ANGLE = 360 / WEDGES.length;
// Land the pointer (fixed at top, 0deg) on the center of the last wedge, plus several full spins.
const TARGET_ROTATION = 360 * 5 + (360 - (WEDGES.length - 0.5) * WEDGE_ANGLE);

const SpinWheelReveal = ({ reward }) => {
  const [rotation, setRotation] = useState(0);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    // Trigger the CSS transition on the next frame after mount (rotation starts at 0).
    const start = requestAnimationFrame(() => setRotation(TARGET_ROTATION));
    const reveal = setTimeout(() => setRevealed(true), 2900);
    return () => {
      cancelAnimationFrame(start);
      clearTimeout(reveal);
    };
  }, []);

  if (!reward) return null;

  return (
    <div className="bg-gradient-to-b from-amber-50 to-white border border-amber-200 rounded-2xl p-6 text-center mt-4">
      <p className="text-sm font-semibold text-amber-700 mb-3">🎯 Quantity Reward Unlocked!</p>

      <div className="relative w-40 h-40 mx-auto mb-4">
        {/* Pointer */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-0 h-0 border-l-[8px] border-r-[8px] border-t-[14px] border-l-transparent border-r-transparent border-t-amber-600" />
        <div
          className="w-40 h-40 rounded-full border-4 border-amber-300 relative overflow-hidden shadow-inner"
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: 'transform 2.6s cubic-bezier(0.17, 0.67, 0.12, 0.99)'
          }}
        >
          {WEDGES.map((w, i) => (
            <div
              key={i}
              className="absolute inset-0 flex items-start justify-center"
              style={{ transform: `rotate(${i * WEDGE_ANGLE}deg)` }}
            >
              <span
                className={`text-sm mt-2 ${i === WEDGES.length - 1 ? 'font-bold text-amber-700' : 'text-gray-400'}`}
                style={{ transform: `rotate(${WEDGE_ANGLE / 2}deg)` }}
              >
                {w}
              </span>
            </div>
          ))}
        </div>
      </div>

      {revealed ? (
        <div>
          <p className="text-lg font-bold text-amber-800">+{reward.bonusCoins} 🪙 SuperCoins</p>
          <p className="text-sm text-amber-600 mt-1">{reward.label}</p>
          <p className="text-xs text-gray-400 mt-1">for buying enough {reward.productName}</p>
        </div>
      ) : (
        <p className="text-sm text-gray-400">Spinning your reward...</p>
      )}
    </div>
  );
};

export default SpinWheelReveal;
