import React from 'react';

interface HomeScreenProps {
  onNavigate: (screen: 'character-editor' | 'matchmaking' | 'leaderboard') => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden main-background">
      <div id="background-art"></div>
      <div className="main-menu">
        <h1 className="main-menu--title">sudden *bonk*!</h1>
        <img className="sprite home" src='/assets/sprites/cheemx64.png'></img>
        <div className="home-btns p-12 z-10">
          <div className="flex flex-col items-center justify-center gap-6 w-full">
            <button onClick={() => onNavigate('matchmaking')} className="ui-btn">
              play
            </button>
            <button onClick={() => alert('Work in progress !')} className="ui-btn ui-btn--secondary">
              live bet
            </button>
            <button onClick={() => alert('Work in progress !')} className="ui-btn ui-btn--secondary">
              leaderboard
            </button>
          </div>
        </div>
      </div>
      {/*<div className="mt-12 text-center">
        <div className="flex space-x-4">
          <span>Sometime your real enemy can be closer than you think...</span>
        </div>
      </div>
      */}
    </div>
  );
};
