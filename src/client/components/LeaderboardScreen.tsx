import React from 'react';
import { Player } from '../../shared/types/game';

interface LeaderboardScreenProps {
  players: Player[];
  onBack: () => void;
}

export const LeaderboardScreen: React.FC<LeaderboardScreenProps> = ({
  players,
  onBack,
}) => {
  const sortedPlayers = [...players].sort((a, b) => b.points - a.points);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return '🥇';
      case 2: return '🥈';
      case 3: return '🥉';
      default: return `#${rank}`;
    }
  };

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-400';
      case 2: return 'text-gray-300';
      case 3: return 'text-orange-400';
      default: return 'text-white';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-black p-8">
      <button
        onClick={onBack}
        className="mb-6 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ← Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">LEADERBOARD</h1>
        <p className="text-gray-300">Hall of Champions</p>
      </div>

      <div className="max-w-2xl mx-auto">
        {sortedPlayers.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏆</div>
            <p className="text-gray-400 text-lg">No champions yet...</p>
            <p className="text-gray-500">Be the first to claim glory!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const rank = index + 1;
              return (
                <div
                  key={player.id}
                  className={`bg-gray-800 rounded-lg p-4 border-2 transition-all duration-300 hover:scale-105 ${
                    rank === 1
                      ? 'border-yellow-500 bg-gradient-to-r from-yellow-900/20 to-gray-800'
                      : rank === 2
                      ? 'border-gray-400 bg-gradient-to-r from-gray-700/20 to-gray-800'
                      : rank === 3
                      ? 'border-orange-500 bg-gradient-to-r from-orange-900/20 to-gray-800'
                      : 'border-gray-600'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className={`text-2xl font-bold ${getRankColor(rank)}`}>
                        {getRankIcon(rank)}
                      </div>
                      
                      <div className="flex items-center space-x-3">
                        <div className="relative">
                          <span className="text-3xl">🥷</span>
                          <span className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg">
                            {player.character.hat}
                          </span>
                          <span className="absolute -bottom-1 -right-1 text-sm">
                            {player.character.weapon}
                          </span>
                        </div>
                        
                        <div>
                          <h3 className="text-white font-semibold text-lg">
                            {player.name}
                          </h3>
                          <p className="text-gray-400 text-sm">
                            Fighter #{player.id.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getRankColor(rank)}`}>
                        {player.points.toLocaleString()}
                      </div>
                      <p className="text-gray-400 text-sm">points</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};