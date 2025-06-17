import React, { useState } from 'react';
import { Character } from '../../shared/types/game';

interface CharacterEditorProps {
  character: Character;
  onCharacterUpdate: (character: Character) => void;
  onJoinMatchmaking: () => void;
  onBack: () => void;
}

const HATS = ['🎩', '👑', '🧢', '⛑️', '🎓', '👒'];
const WEAPONS = ['⚔️', '🗡️', '🏹', '🔫', '🪓', '🔨'];

export const CharacterEditor: React.FC<CharacterEditorProps> = ({
  character,
  onCharacterUpdate,
  onJoinMatchmaking,
  onBack,
}) => {
  const [hatIndex, setHatIndex] = useState(HATS.indexOf(character.hat) || 0);
  const [weaponIndex, setWeaponIndex] = useState(WEAPONS.indexOf(character.weapon) || 0);

  const updateCharacter = (newHat?: string, newWeapon?: string) => {
    const updatedCharacter = {
      ...character,
      hat: newHat || HATS[hatIndex],
      weapon: newWeapon || WEAPONS[weaponIndex],
    };
    onCharacterUpdate(updatedCharacter);
  };

  const changeHat = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left' 
      ? (hatIndex - 1 + HATS.length) % HATS.length
      : (hatIndex + 1) % HATS.length;
    setHatIndex(newIndex);
    updateCharacter(HATS[newIndex], undefined);
  };

  const changeWeapon = (direction: 'left' | 'right') => {
    const newIndex = direction === 'left'
      ? (weaponIndex - 1 + WEAPONS.length) % WEAPONS.length
      : (weaponIndex + 1) % WEAPONS.length;
    setWeaponIndex(newIndex);
    updateCharacter(undefined, WEAPONS[newIndex]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 via-blue-900 to-black flex flex-col items-center justify-center p-8">
      <button
        onClick={onBack}
        className="absolute top-4 left-4 bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
      >
        ← Back
      </button>

      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">CHARACTER EDITOR</h1>
        <p className="text-gray-300">Customize your fighter</p>
      </div>

      {/* Character Display */}
      <div className="bg-gray-800 rounded-lg p-8 mb-8 border-2 border-gray-600">
        <div className="text-center">
          <div className="text-8xl mb-4">
            <div className="relative inline-block">
              <span className="text-6xl">🥷</span>
              <span className="absolute -top-4 left-1/2 transform -translate-x-1/2 text-4xl">
                {HATS[hatIndex]}
              </span>
              <span className="absolute -bottom-2 -right-2 text-3xl">
                {WEAPONS[weaponIndex]}
              </span>
            </div>
          </div>
          <h3 className="text-xl font-bold text-white">{character.name}</h3>
        </div>
      </div>

      {/* Hat Selection */}
      <div className="mb-6 w-full max-w-md">
        <h3 className="text-white text-lg font-semibold mb-3 text-center">Hat</h3>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => changeHat('left')}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-colors"
          >
            ←
          </button>
          <div className="bg-gray-700 px-6 py-4 rounded-lg min-w-[80px] text-center">
            <span className="text-4xl">{HATS[hatIndex]}</span>
          </div>
          <button
            onClick={() => changeHat('right')}
            className="bg-blue-600 hover:bg-blue-500 text-white p-3 rounded-full transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Weapon Selection */}
      <div className="mb-8 w-full max-w-md">
        <h3 className="text-white text-lg font-semibold mb-3 text-center">Weapon</h3>
        <div className="flex items-center justify-center space-x-4">
          <button
            onClick={() => changeWeapon('left')}
            className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-full transition-colors"
          >
            ←
          </button>
          <div className="bg-gray-700 px-6 py-4 rounded-lg min-w-[80px] text-center">
            <span className="text-4xl">{WEAPONS[weaponIndex]}</span>
          </div>
          <button
            onClick={() => changeWeapon('right')}
            className="bg-red-600 hover:bg-red-500 text-white p-3 rounded-full transition-colors"
          >
            →
          </button>
        </div>
      </div>

      {/* Join Matchmaking Button */}
      <button
        onClick={onJoinMatchmaking}
        className="bg-gradient-to-r from-green-600 to-emerald-700 hover:from-green-500 hover:to-emerald-600 text-white font-bold py-4 px-8 rounded-lg text-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
      >
        JOIN MATCHMAKING
      </button>
    </div>
  );
};