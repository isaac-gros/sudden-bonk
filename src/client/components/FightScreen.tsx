import React, { useEffect, useState, useRef, useCallback, Dispatch, SetStateAction } from 'react';
import { Character, PathData, DrawingPoint } from '../../shared/types/game';
import csvToDataPoints from '../utils/csvToDataPoints';

interface FightScreenProps {
  playerCharacter: Character;
  opponentCharacter: Character;
  playerPath: PathData;
  opponentPath: PathData;
  onFightComplete: (won: boolean) => void;
}

const ARENA_WIDTH = 400;
const ARENA_HEIGHT = 400;
const CHARACTER_SIZE = 40;
const ATTACK_RANGE = 60;
const ATTACK_COOLDOWN = 1200; // 1.2 seconds
const GAME_LOOP_INTERVAL = 16; // ~60fps (16ms)

export const FightScreen: React.FC<FightScreenProps> = ({
  playerCharacter,
  opponentCharacter,
  playerPath,
  opponentPath,
  onFightComplete,
}) => {
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<number>(0);
  const pathCanvasRef = useRef<HTMLCanvasElement>(null);
  
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
  const [currentPlayerPosIndex, setCurrentPlayerPosIndex] = useState<number>(0); // Index in path data
  const [currentOpponentPos, setCurrentOpponentPos] = useState<DrawingPoint>({ x: 350, y: 200 });
  const [currentOpponentPosIndex, setCurrentOpponentPosIndex] = useState<number>(0);

  // Generate opponent path (simple AI movement)
  // TODO : Pass it as a props
  // const generateOpponentPath = useCallback(async (): PathData => {
  //   if (!opponentPathLoaded) {
  //     const sampleIndexes = [1, 2, 3, 4];
  //     const randomIndex = sampleIndexes[Math.floor(Math.random() * sampleIndexes.length)];
  //     const dataPoints = await csvToDataPoints(`/data/moves/sample${randomIndex}.csv`);
  //     const duration = 5000; // Match player path duration
  //     setOpponentPathLoaded(true);
    
  //     setOpponentPath({ points: dataPoints, duration });
  //   }
  // }, []);

  // const [opponentPath, setOpponentPath] = useState<PathData>(generateOpponentPath());

  // Draw paths on canvas (background only)
  const drawPaths = useCallback(() => {
    const canvas = pathCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
      
      // Draw player path
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
      
      // Draw opponent path
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.3)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      console.log("opponentPath ===> ", opponentPath);
      opponentPath.points.forEach((point, i) => {
        if (i === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.stroke();
    }
  }, [playerPath, opponentPath]);

  // Get position along path at given time (with looping)
  const getPositionAtTime = useCallback((path: PathData, elapsedTime: number): DrawingPoint => {
    if (!path.points.length) {
      console.log('No path points available');
      return { x: 50, y: 200 }; // Default position
    }

    // Set first target point
    let targetPoint = path.points[0];
    
    for (let i = 0; i < path.points.length - 1; i++) {
      const current = path.points[i];
      const next = path.points[i + 1];

      // Interpolate between current and next point
      targetPoint = {
        x: current.x + (next.x - current.x),
        y: current.y + (next.y - current.y),
      };
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

    // Reset attack cooldown
    setTimeout(() => {
      setPlayerAttackCooldown(0);
    }, ATTACK_COOLDOWN);
  }, [playerAttackCooldown, currentPlayerPos, currentOpponentPos, gamePhase, checkCollision, onFightComplete]);

  // Handle entities movement
  const handleEntityMove = (
      index: number, 
      pathData: PathData, 
      setPosition: Dispatch<SetStateAction<DrawingPoint>>,
      setIndex: Dispatch<SetStateAction<number>>,
      entityType: string
  ) => {

    // If index is greater than max path data,
    // reset it
    if (index == pathData.points.length) {
      setIndex(0);
      return;
    } else {

      // Else, move the entity to next point
      const targetPoint = pathData.points[index];
      setPosition({
        x: targetPoint.x,
        y: targetPoint.y,
      });
    }
  }
  const handlePlayerMove = useCallback(() => {
    handleEntityMove(currentPlayerPosIndex, playerPath, setCurrentPlayerPos, setCurrentPlayerPosIndex, 'player')
  }, [currentPlayerPosIndex, playerPath, setCurrentPlayerPos, setCurrentPlayerPosIndex])
  useEffect(handlePlayerMove, [currentPlayerPosIndex, handlePlayerMove]);

  
  const handleOpponentMove = useCallback(() => {
    console.log(opponentPath);
    handleEntityMove(currentOpponentPosIndex, opponentPath, setCurrentOpponentPos, setCurrentOpponentPosIndex, 'opponent')
  }, [currentOpponentPosIndex, opponentPath, setCurrentOpponentPos, setCurrentOpponentPosIndex])
  useEffect(handleOpponentMove, [currentOpponentPosIndex, handleOpponentMove]);

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
    
    setCurrentPlayerPosIndex(currentPlayerPosIndex + 1)
    setCurrentOpponentPosIndex(currentOpponentPosIndex + 1);
    
    // Update cooldowns
    setPlayerAttackCooldown(prev => Math.max(0, prev - GAME_LOOP_INTERVAL));
    setOpponentAttackCooldown(prev => Math.max(0, prev - GAME_LOOP_INTERVAL));
    
    // AI attack logic
    if (Math.random() < 0.02) { // 2% chance per frame
      handleOpponentAttack();
    }
  }, [gamePhase,currentPlayerPosIndex, playerPath, opponentPath, getPositionAtTime, handleOpponentAttack]);

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

  // Draw paths when component mounts or paths change
  useEffect(() => {
    drawPaths();
  }, [drawPaths]);

  // Debug: Log player path when component mounts
  useEffect(() => {
    console.log('FightScreen received player path:', playerPath);
    console.log('Player path points:', playerPath.points);
    console.log('Player path duration:', playerPath.duration);
    
    if (playerPath.points.length > 0) {
      console.log('First point:', playerPath.points[0]);
      console.log('Last point:', playerPath.points[playerPath.points.length - 1]);
      
      // Log some sample timestamps
      const samplePoints = playerPath.points.filter((_, i) => i % 10 === 0);
      console.log('Sample timestamps:', samplePoints.map(p => ({ x: p.x, y: p.y, t: p.timestamp })));
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
        {/* Background canvas for paths */}
        <canvas
          ref={pathCanvasRef}
          width={ARENA_WIDTH}
          height={ARENA_HEIGHT}
          className="absolute top-0 left-0 border-4 border-gray-600 rounded-lg bg-gray-800"
        />
        
        {/* Arena container for characters */}
        <div 
          className="relative border-4 border-gray-600 rounded-lg bg-transparent"
          style={{ 
            width: ARENA_WIDTH, 
            height: ARENA_HEIGHT 
          }}
        >
          {/* Player Character */}
          <div
            className={`absolute transition-all duration-75 ease-linear ${
              isPlayerAttacking ? 'scale-125' : 'scale-100'
            }`}
            style={{
              left: currentPlayerPos.x - CHARACTER_SIZE / 2,
              top: currentPlayerPos.y - CHARACTER_SIZE / 2,
              width: CHARACTER_SIZE,
              height: CHARACTER_SIZE,
            }}
          >
            {/* Character Body */}
            <div className="relative text-center">
              <div className="text-2xl">🥷</div>
              {/* Hat */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg">
                {playerCharacter.hat}
              </div>
              {/* Weapon */}
              <div className="absolute -bottom-1 -right-1 text-sm">
                {playerCharacter.weapon}
              </div>
              {/* Player Label */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-blue-400 font-bold whitespace-nowrap">
                YOU
              </div>
              {/* Attack Effect */}
              {showAttackEffect.player && (
                <div className="absolute top-1/2 left-8 transform -translate-y-1/2 text-2xl animate-ping">
                  💥
                </div>
              )}
            </div>
          </div>

          {/* Opponent Character */}
          <div
            className={`absolute transition-all ${
              isOpponentAttacking ? 'scale-125' : 'scale-100'
            }`}
            style={{
              left: currentOpponentPos.x - CHARACTER_SIZE / 2,
              top: currentOpponentPos.y - CHARACTER_SIZE / 2,
              width: CHARACTER_SIZE,
              height: CHARACTER_SIZE,
            }}
          >
            {/* Character Body */}
            <div className="relative text-center">
              <div className="text-2xl">🥷</div>
              {/* Hat */}
              <div className="absolute -top-2 left-1/2 transform -translate-x-1/2 text-lg">
                {opponentCharacter.hat}
              </div>
              {/* Weapon */}
              <div className="absolute -bottom-1 -right-1 text-sm">
                {opponentCharacter.weapon}
              </div>
              {/* Opponent Label */}
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 text-xs text-red-400 font-bold whitespace-nowrap">
                ENEMY
              </div>
              {/* Attack Effect */}
              {showAttackEffect.opponent && (
                <div className="absolute top-1/2 -left-8 transform -translate-y-1/2 text-2xl animate-ping">
                  💥
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Countdown Overlay */}
        {gamePhase === 'countdown' && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
            <div className="text-white text-6xl font-bold animate-pulse">{countdown}</div>
          </div>
        )}
      </div>

      {/* Attack Buttons */}
      {gamePhase === 'fighting' && (
        <div className="flex items-center justify-between">
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
          <button
            onClick={() => setCurrentPlayerPosIndex(currentPlayerPosIndex + 1)}
            className="
              px-8 py-4 rounded-lg font-bold text-xl 
              transition-all duration-200 bg-blue-600 hover:bg-blue-500 text-white 
              transform hover:scale-105 active:scale-95">
            MOVE ⏩
          </button>
        </div>
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
          <p>Player Path Duration: {playerPath.duration}ms</p>
          <p>Current Position: ({Math.round(currentPlayerPos.x)}, {Math.round(currentPlayerPos.y)})</p>
          <p>Elapsed Time: {startTimeRef.current ? Date.now() - startTimeRef.current : 0}ms</p>
          <p>Loop Progress: {startTimeRef.current ? Math.round(((Date.now() - startTimeRef.current) % Math.max(playerPath.duration, 5000)) / Math.max(playerPath.duration, 5000) * 100) : 0}%</p>
        </div>
      )}
    </div>
  );
};