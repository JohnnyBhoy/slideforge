import React from 'react';

interface TryCounterProps {
  remainingTries: number | null;
  isSubscribed: boolean;
  role: string | null;
}

const TryCounter: React.FC<TryCounterProps> = ({ remainingTries, isSubscribed, role }) => {
  if (role === 'teacher' && isSubscribed) {
    return (
      <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 font-semibold px-4 py-2 rounded-full text-sm">
        ✦ Unlimited generations ✓
      </div>
    );
  }

  if (remainingTries === null) return null;

  let colorClass = 'bg-green-100 text-green-700';
  let icon = '✦';
  let label = '';

  if (role === 'teacher') {
    if (remainingTries >= 5) colorClass = 'bg-green-100 text-green-700';
    else if (remainingTries >= 3) colorClass = 'bg-yellow-100 text-yellow-700';
    else if (remainingTries >= 1) colorClass = 'bg-orange-100 text-orange-700';
    else colorClass = 'bg-red-100 text-red-700';
    label = remainingTries > 0 ? `${remainingTries} tries remaining this month` : 'No tries left — subscribe to continue';
  } else {
    if (remainingTries === 3) { colorClass = 'bg-green-100 text-green-700'; label = '✦ 3 free tries — no account needed'; }
    else if (remainingTries === 2) { colorClass = 'bg-yellow-100 text-yellow-700'; label = '2 tries remaining'; icon = '⚠'; }
    else if (remainingTries === 1) { colorClass = 'bg-orange-100 text-orange-700'; label = '1 try remaining — sign in for more'; icon = '!'; }
    else { colorClass = 'bg-red-100 text-red-700'; label = 'No tries left'; icon = '✕'; }
  }

  return (
    <div className={`inline-flex items-center gap-2 ${colorClass} font-semibold px-4 py-2 rounded-full text-sm`}>
      <span>{icon}</span>
      <span>{label}</span>
    </div>
  );
};

export default TryCounter;
