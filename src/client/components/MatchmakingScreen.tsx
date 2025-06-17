import React, { useEffect, useState } from 'react';

interface MatchmakingScreenProps {
  onMatchFound: () => void;
  onBack: () => void;
}

export const MatchmakingScreen: React.FC<MatchmakingScreenProps> = ({
  onMatchFound,
  onBack,
}) => {
  const [dots, setDots] = useState('');
  const [searchTime, setSearchTime] = useState(0);

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    const timeInterval = setInterval(() => {
      setSearchTime(prev => prev + 1);
    }, 1000);

    // Simulate finding a match after 3-8 seconds
    const matchTimeout = setTimeout(() => {
      onMatchFound();
    }, Math.random() * 5000 + 3000);

    return () => {
      clearInterval(dotsInterval);
      clearInterval(timeInterval);
      clearTimeout(matchTimeout);
    };
  }, [onMatchFound]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-900 via-red-900 to-black flex flex-col items-center justify-center p-8">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ← Back
      </button>

      <div className="text-center">
        <div className="mb-8">
          <div className="animate-spin text-6xl mb-4">⚔️</div>
          <h1 className="text-4xl font-bold text-white mb-4">
            FINDING OPPONENT{dots}
          </h1>
          <p className="text-gray-300 text-lg">Searching for a worthy challenger</p>
        </div>

        <div className="bg-gray-800 rounded-lg p-6 mb-8 border border-gray-600">
          <div className="text-white">
            <p className="text-sm text-gray-400 mb-2">Search Time</p>
            <p className="text-2xl font-mono">{formatTime(searchTime)}</p>
          </div>
        </div>

        <div className="flex justify-center space-x-2 mb-8">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-3 h-3 rounded-full ${
                i < (searchTime % 5) + 1 ? 'bg-orange-500' : 'bg-gray-600'
              } transition-colors duration-300`}
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </div>

        <div className="text-gray-400 text-sm">
          <p>🌍 Searching globally...</p>
          <p className="mt-2">💪 Preparing for battle...</p>
        </div>
      </div>
    </div>
  );
};