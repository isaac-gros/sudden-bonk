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
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden main-background">
      <button
        onClick={onBack}
        className="absolute z-50 top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ← Back
      </button>
      <div id="background-art"></div>
      <div className="main-menu">
        <h1 className="main-menu--title">sudden *bonk*!</h1>
        <img className="sprite home" src='/assets/sprites/cheemx64.png'></img>
        <div className="home-btns p-12 z-10">
          <div className="text-center">
            <div className="mb-8">
              <div className="animate-spin text-6xl mb-4">⌛</div>
              <h1 className="text-4xl text-gray-800 font-bold mb-4">
                FINDING OPPONENT{dots}
              </h1>
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
          </div>
        </div>
      </div>
    </div>
  );
};