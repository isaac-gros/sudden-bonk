import React from 'react';

interface HomeScreenProps {
  onNavigate: (screen: 'character-editor' | 'matchmaking' | 'leaderboard') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-red-800 to-black flex flex-col items-center justify-center p-8">
      <div className="text-center mb-12">
        <h1 className="text-6xl font-bold text-yellow-400 mb-4 tracking-wider shadow-lg">
          STREET FIGHTER
        </h1>
        <p className="text-xl text-white opacity-80">Choose your destiny</p>
      </div>
      
      <div className="space-y-6 w-full max-w-md">
        <button
          onClick={() => onNavigate('character-editor')}
          className="w-full bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-400 hover:to-orange-500 text-black font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          PLAY
        </button>
        
        <button
          onClick={() => onNavigate('matchmaking')}
          className="w-full bg-gradient-to-r from-blue-600 to-purple-700 hover:from-blue-500 hover:to-purple-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          LIVE BET
        </button>
        
        <button
          onClick={() => onNavigate('leaderboard')}
          className="w-full bg-gradient-to-r from-green-600 to-teal-700 hover:from-green-500 hover:to-teal-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
        >
          LEADERBOARD
        </button>
      </div>
      
      <div className="mt-12 text-center">
        <div className="flex space-x-4 text-sm text-gray-400">
          <span>⚔️ Fight</span>
          <span>🏆 Win</span>
          <span>👑 Dominate</span>
        </div>
      </div>
    </div>
  );
};