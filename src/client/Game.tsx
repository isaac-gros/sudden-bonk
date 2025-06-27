import React, { useState, useCallback } from 'react';
import { HomeScreen } from './components/HomeScreen';
import { CharacterEditor } from './components/CharacterEditor';
import { MatchmakingScreen } from './components/MatchmakingScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { MakeMoveScreen } from './components/MakeMoveScreen';
import { FightScreen } from './components/FightScreen';
import { Screen, Character, Player, PathData } from '../shared/types/game';

const MOCK_PLAYERS: Player[] = [
  {
    id: '1',
    name: 'DragonSlayer',
    points: 2500,
    character: { id: '1', name: 'DragonSlayer', hat: '👑', weapon: '⚔️', x: 0, y: 0 }
  },
  {
    id: '2',
    name: 'ShadowNinja',
    points: 2200,
    character: { id: '2', name: 'ShadowNinja', hat: '🎩', weapon: '🗡️', x: 0, y: 0 }
  },
  {
    id: '3',
    name: 'FireWarrior',
    points: 1900,
    character: { id: '3', name: 'FireWarrior', hat: '⛑️', weapon: '🔫', x: 0, y: 0 }
  },
  {
    id: '4',
    name: 'IceQueen',
    points: 1750,
    character: { id: '4', name: 'IceQueen', hat: '👒', weapon: '🏹', x: 0, y: 0 }
  },
  {
    id: '5',
    name: 'ThunderGod',
    points: 1600,
    character: { id: '5', name: 'ThunderGod', hat: '🧢', weapon: '🔨', x: 0, y: 0 }
  }
];

export const Game: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>('home');
  const [playerCharacter, setPlayerCharacter] = useState<Character>({
    id: 'player',
    name: 'Player',
    hat: '🎩',
    weapon: '⚔️',
    x: 0,
    y: 0,
  });
  const [opponentCharacter, setOpponentCharacter] = useState<Character>({
    id: 'opponent',
    name: 'Opponent',
    hat: '👑',
    weapon: '🗡️',
    x: 0,
    y: 0,
  });
  const [playerPath, setPlayerPath] = useState<PathData>({ points: [], duration: 0 });
  const [opponentPath, setOpponentPath] = useState<PathData>({ points: [], duration: 0 });

  const navigateToScreen = useCallback((screen: Screen) => {
    setCurrentScreen(screen);
  }, []);

  const handleCharacterUpdate = useCallback((character: Character) => {
    setPlayerCharacter(character);
  }, []);

  const handleJoinMatchmaking = useCallback(() => {
    setCurrentScreen('matchmaking');
  }, []);

  const handleMatchFound = useCallback(() => {
    // Generate random opponent
    const randomHats = ['👑', '🎩', '🧢', '⛑️', '🎓', '👒'];
    const randomWeapons = ['⚔️', '🗡️', '🏹', '🔫', '🪓', '🔨'];
    
    setOpponentCharacter({
      id: 'opponent',
      name: 'Challenger',
      hat: randomHats[Math.floor(Math.random() * randomHats.length)],
      weapon: randomWeapons[Math.floor(Math.random() * randomWeapons.length)],
      x: 0,
      y: 0,
    });
    
    setCurrentScreen('make-move');
  }, []);

  const handleMoveComplete = useCallback((playerPathData: PathData, opponentPathData: PathData) => {
    setPlayerPath(playerPathData);
    setOpponentPath(opponentPathData);
    setCurrentScreen('fight');
  }, []);

  const handleFightComplete = useCallback((won: boolean) => {
    // In a real game, you'd update player stats here
    console.log(won ? 'Player won!' : 'Player lost!');
    setCurrentScreen('home');
  }, []);

  const renderCurrentScreen = () => {
    switch (currentScreen) {
      case 'home':
        return (
          <HomeScreen
            onNavigate={(screen) => {
              if (screen === 'character-editor') {
                navigateToScreen('character-editor');
              } else if (screen === 'matchmaking') {
                navigateToScreen('matchmaking');
              } else if (screen === 'leaderboard') {
                navigateToScreen('leaderboard');
              }
            }}
          />
        );

      case 'character-editor':
        return (
          <CharacterEditor
            character={playerCharacter}
            onCharacterUpdate={handleCharacterUpdate}
            onJoinMatchmaking={handleJoinMatchmaking}
            onBack={() => navigateToScreen('home')}
          />
        );

      case 'matchmaking':
        return (
          <MatchmakingScreen
            onMatchFound={handleMatchFound}
            onBack={() => navigateToScreen('home')}
          />
        );

      case 'leaderboard':
        return (
          <LeaderboardScreen
            players={MOCK_PLAYERS}
            onBack={() => navigateToScreen('home')}
          />
        );

      case 'make-move':
        return (
          <MakeMoveScreen
            onMoveComplete={handleMoveComplete}
          />
        );

      case 'fight':
        return (
          <FightScreen
            playerCharacter={playerCharacter}
            opponentCharacter={opponentCharacter}
            opponentPath={opponentPath}
            playerPath={playerPath}
            onFightComplete={handleFightComplete}
          />
        );

      default:
        return <HomeScreen onNavigate={(screen) => navigateToScreen(screen)} />;
    }
  };

  return (
    <div className="w-full h-full">
      {renderCurrentScreen()}
    </div>
  );
};