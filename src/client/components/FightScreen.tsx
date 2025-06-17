import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Character, PathData, DrawingPoint } from '../../shared/types/game';

interface FightScreenProps {
  playerCharacter: Character;
  opponentCharacter: Character;
  playerPath: PathData;
  onFightComplete: (won: boolean) => void;
}

const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const CHARACTER_SIZE = 40;
const ATTACK_RANGE = 60;
const ATTACK_COOLDOWN = 1200; // 1.2 seconds
const GAME_LOOP_INTERVAL = 16; // ~60fps (16ms)

export const FightScreen: React.FC<FightScreenProps> = ({
  playerCharacter,
  opponentCharacter,
  playerPath,
  onFightComplete,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  
  const [gamePhase, setGamePhase] = useState<'countdown' | 'fighting' | 'finished'>('countdown');
  const [countdown, setCountdown] = useState(3);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [playerAttackCooldown, setPlayerAttackCooldown] = useState(0);
  const [opponentAttackCooldown, setOpponentAttackCooldown] = useState(0);
  const [isPlayerAttacking, setIsPlayerAttacking] = useState(false);
  const [isOpponentAttacking, setIsOpponentAttacking] = useState(false);
  const [showAttackEffect, setShowAttackEffect] = useState<{ player: boolean; opponent: boolean }>({
    player: false,
    opponent: false,
  });
  const [currentPlayerPos, setCurrentPlayerPos] = useState<DrawingPoint>({ x: 50, y: 200 });
  const [currentOpponentPos, setCurrentOpponentPos] = useState<DrawingPoint>({ x: 350, y: 200 });

  // Generate opponent path (simple AI movement)
  const generateOpponentPath = useCallback((): PathData => {
    const points: DrawingPoint[] = [];
    const duration = 5000;
    const numPoints = 50; // More points for smoother movement
    
    for (let i = 0; i <= numPoints; i++) {
      const t = i / numPoints;
      const timestamp = t * duration;
      
      // Simple circular movement pattern
      const centerX = 300;
      const centerY = 200;
      const radius = 80;
      const angle = t * Math.PI * 2;
      
      points.push({
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        timestamp,
      });
    }
    
    return { points, duration };
  }, []);

  const [opponentPath] = useState<PathData>(generateOpponentPath());

  // Get position along path at given time (with looping)
  const getPositionAtTime = useCallback((path: PathData, elapsedTime: number): DrawingPoint => {
    if (!path.points.length) {
      console.log('No path points available');
      return { x: 50, y: 200 }; // Default position
    }
    
    // Loop the path by using modulo
    const loopedTime = elapsedTime % Math.max(path.duration, 1000);
    
    console.log(`Getting position for time: ${elapsedTime}, looped: ${loopedTime}, duration: ${path.duration}`);
    
    // Find the appropriate point based on timestamp
    let targetPoint = path.points[0];
    
    for (let i = 0; i < path.points.length - 1; i++) {
      const current = path.points[i];
      const next = path.points[i + 1];
      
      if (current.timestamp !== undefined && next.timestamp !== undefined) {
        if (loopedTime >= current.timestamp && loopedTime <= next.timestamp) {
          // Interpolate between current and next point
          const segmentProgress = (loopedTime - current.timestamp) / (next.timestamp - current.timestamp);
          targetPoint = {
            x: current.x + (next.x - current.x) * segmentProgress,
            y: current.y + (next.y - current.y) * segmentProgress,
          };
          console.log(`Interpolated position: (${targetPoint.x}, ${targetPoint.y})`);
          break;
        }
      }
    }
    
    // If we're past the last point, use the last point
    if (loopedTime >= (path.points[path.points.length - 1]?.timestamp || 0)) {
      targetPoint = path.points[path.points.length - 1] || { x: 50, y: 200 };
    }
    
    return targetPoint;
  }, []);

  // Check if two positions are within attack range
  const checkCollision = useCallback((pos1: DrawingPoint, pos2: DrawingPoint, range: number): boolean => {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance <= range;
  }, []);

  // Handle player attack
  const handlePlayerAttack = useCallback(() => {
    if (playerAttackCooldown > 0 || gamePhase !== 'fighting') return;
    
    setIsPlayerAttacking(true);
    setPlayerAttackCooldown(ATTACK_COOLDOWN);
    setShowAttackEffect(prev => ({ ...prev, player: true }));
    
    // Check if attack hits opponent (SUDDEN DEATH - instant win)
    if (checkCollision(currentPlayerPos, currentOpponentPos, ATTACK_RANGE)) {
      setGamePhase('finished');
      setWinner('player');
      setTimeout(() => onFightComplete(true), 2000);
    }
    
    // Reset attack animation
    setTimeout(() => {
      setIsPlayerAttacking(false);
      setShowAttackEffect(prev => ({ ...prev, player: false }));
    }, 300);
  }, [playerAttackCooldown, currentPlayerPos, currentOpponentPos, gamePhase, checkCollision, onFightComplete]);

  // AI opponent attack logic
  const handleOpponentAttack = useCallback(() => {
    if (opponentAttackCooldown > 0) return;
    
    // Simple AI: attack if close to player
    if (checkCollision(currentPlayerPos, currentOpponentPos, ATTACK_RANGE * 1.2)) {
      setIsOpponentAttacking(true);
      setOpponentAttackCooldown(ATTACK_COOLDOWN);
      setShowAttackEffect(prev => ({ ...prev, opponent: true }));
      
      // Check if attack hits player (SUDDEN DEATH - instant win)
      if (checkCollision(currentPlayerPos, currentOpponentPos, ATTACK_RANGE)) {
        setGamePhase('finished');
        setWinner('opponent');
        setTimeout(() => onFightComplete(false), 2000);
      }
      
      // Reset attack animation
      setTimeout(() => {
        setIsOpponentAttacking(false);
        setShowAttackEffect(prev => ({ ...prev, opponent: false }));
      }, 300);
    }
  }, [opponentAttackCooldown, currentPlayerPos, currentOpponentPos, checkCollision, onFightComplete]);

  // Game loop using setInterval
  const gameLoop = useCallback(() => {
    if (gamePhase !== 'fighting') return;
    
    const currentTime = Date.now();
    if (!startTimeRef.current) {
      startTimeRef.current = currentTime;
    }
    
    const elapsedTime = currentTime - startTimeRef.current;
    
    console.log(`Game loop - elapsed time: ${elapsedTime}ms`);
    
    // Update positions based on paths (with looping)
    const playerPos = getPositionAtTime(playerPath, elapsedTime);
    const opponentPos = getPositionAtTime(opponentPath, elapsedTime);
    
    console.log(`Player position: (${playerPos.x}, ${playerPos.y})`);
    console.log(`Opponent position: (${opponentPos.x}, ${opponentPos.y})`);
    
    setCurrentPlayerPos(playerPos);
    setCurrentOpponentPos(opponentPos);
    
    // Update cooldowns
    setPlayerAttackCooldown(prev => Math.max(0, prev - GAME_LOOP_INTERVAL));
    setOpponentAttackCooldown(prev => Math.max(0, prev - GAME_LOOP_INTERVAL));
    
    // AI attack logic
    if (Math.random() < 0.02) { // 2% chance per frame
      handleOpponentAttack();
    }
    
    // Render
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw background
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      
      // Draw path traces (faded)
      // Player path - draw the actual path from MakeMoveScreen
      if (playerPath.points.length > 0) {
        ctx.strokeStyle = 'rgba(59, 130, 246, 0.5)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        playerPath.points.forEach((point, i) => {
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
      
      // Opponent path
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      opponentPath.points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
      
      // Draw characters
      const drawCharacter = (pos: DrawingPoint, character: Character, isPlayer: boolean, isAttacking: boolean) => {
        ctx.save();
        ctx.translate(pos.x, pos.y);
        
        // Character shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, CHARACTER_SIZE/2, CHARACTER_SIZE/2, CHARACTER_SIZE/4, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Character body
        ctx.font = '32px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // Scale up if attacking
        if (isAttacking) {
          ctx.scale(1.2, 1.2);
        }
        
        ctx.fillText('🥷', 0, -5);
        
        // Hat
        ctx.font = '20px Arial';
        ctx.fillText(character.hat, 0, -25);
        
        // Weapon
        ctx.font = '16px Arial';
        ctx.fillText(character.weapon, 15, 5);
        
        // Name
        ctx.restore();
        ctx.fillStyle = isPlayer ? '#3b82f6' : '#ef4444';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(isPlayer ? 'YOU' : 'ENEMY', pos.x, pos.y - 50);
      };
      
      drawCharacter(currentPlayerPos, playerCharacter, true, isPlayerAttacking);
      drawCharacter(currentOpponentPos, opponentCharacter, false, isOpponentAttacking);
      
      // Draw attack effects
      if (showAttackEffect.player) {
        ctx.save();
        ctx.translate(currentPlayerPos.x, currentPlayerPos.y);
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💥', 30, 0);
        ctx.restore();
      }
      
      if (showAttackEffect.opponent) {
        ctx.save();
        ctx.translate(currentOpponentPos.x, currentOpponentPos.y);
        ctx.font = '40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('💥', -30, 0);
        ctx.restore();
      }
    }
  }, [gamePhase, playerPath, opponentPath, getPositionAtTime, handleOpponentAttack, playerCharacter, opponentCharacter, showAttackEffect, isPlayerAttacking, isOpponentAttacking]);

  // Start countdown
  useEffect(() => {
    const countdownInterval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setGamePhase('fighting');
          startTimeRef.current = 0; // Reset start time
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(countdownInterval);
  }, []);

  // Start game loop when fighting begins
  useEffect(() => {
    if (gamePhase === 'fighting') {
      console.log('Starting game loop with setInterval');
      console.log('Player path points:', playerPath.points.length);
      console.log('Player path duration:', playerPath.duration);
      
      gameLoopRef.current = setInterval(gameLoop, GAME_LOOP_INTERVAL);
    } else {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    }
    
    return () => {
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
        gameLoopRef.current = null;
      }
    };
  }, [gamePhase, gameLoop]);

  // Debug: Log player path when component mounts
  useEffect(() => {
    console.log('FightScreen received player path:', playerPath);
    console.log('Player path points:', playerPath.points);
    console.log('Player path duration:', playerPath.duration);
    
    if (playerPath.points.length > 0) {
      console.log('First point:', playerPath.points[0]);
      console.log('Last point:', playerPath.points[playerPath.points.length - 1]);
    }
  }, [playerPath]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-900 via-orange-900 to-black flex flex-col items-center justify-center p-4">
      <div className="text-center mb-4">
        <h1 className="text-3xl font-bold text-white mb-2">
          {gamePhase === 'countdown' && `FIGHT STARTS IN ${countdown}`}
          {gamePhase === 'fighting' && 'SUDDEN DEATH BATTLE'}
          {gamePhase === 'finished' && (winner === 'player' ? 'VICTORY!' : 'DEFEAT!')}
        </h1>
        {gamePhase === 'fighting' && (
          <p className="text-yellow-400 font-semibold">First hit wins!</p>
        )}
      </div>

      {/* Fight Arena */}
      <div className="relative mb-4">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-4 border-gray-600 rounded-lg bg-gray-800"
        />
        
        {gamePhase === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-white text-6xl font-bold animate-pulse">{countdown}</div>
          </div>
        )}
      </div>

      {/* Attack Button */}
      {gamePhase === 'fighting' && (
        <button
          onClick={handlePlayerAttack}
          disabled={playerAttackCooldown > 0}
          className={`px-8 py-4 rounded-lg font-bold text-xl transition-all duration-200 ${
            playerAttackCooldown > 0
              ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
              : 'bg-red-600 hover:bg-red-500 text-white transform hover:scale-105 active:scale-95'
          }`}
        >
          {playerAttackCooldown > 0 
            ? `COOLDOWN (${Math.ceil(playerAttackCooldown / 1000)}s)`
            : 'ATTACK ⚔️'
          }
        </button>
      )}

      {/* Game Instructions */}
      <div className="text-center text-gray-400 text-sm mt-4">
        {gamePhase === 'countdown' && <p>Get ready! Your character will follow the path you drew.</p>}
        {gamePhase === 'fighting' && <p>Time your attack perfectly! Characters loop their paths until someone hits!</p>}
        {gamePhase === 'finished' && (
          <p>{winner === 'player' ? 'Perfect timing!' : 'Better luck next time!'}</p>
        )}
      </div>

      {/* Debug Info */}
      {gamePhase === 'fighting' && (
        <div className="text-xs text-gray-500 mt-2">
          <p>Player Path Points: {playerPath.points.length}</p>
          <p>Current Position: ({Math.round(currentPlayerPos.x)}, {Math.round(currentPlayerPos.y)})</p>
          <p>Elapsed Time: {startTimeRef.current ? Date.now() - startTimeRef.current : 0}ms</p>
        </div>
      )}
    </div>
  );
};