import React, { useRef, useEffect, useState, useCallback } from 'react';
import { DrawingPoint, PathData } from '../../shared/types/game';
import csvToDataPoints from '../utils/csvToDataPoints';

interface MakeMoveScreenProps {
  onMoveComplete: (playerPathData: PathData, opponentPathData: PathData) => void;
}

export const MakeMoveScreen: React.FC<MakeMoveScreenProps> = ({ onMoveComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawingPointsRef = useRef<DrawingPoint[]>([]);
  const opponentPointsRef = useRef<DrawingPoint[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [timeLeft, setTimeLeft] = useState(5);
  const [canvasState, setCanvasState] = useState<'locked' | 'drawing' | 'finished'>('locked');
  const [drawingPoints, setDrawingPoints] = useState<DrawingPoint[]>([]);
  const [startTime, setStartTime] = useState<number>(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const timeTracker = useRef<NodeJS.Timeout | null>(null);

  const initializeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      // Clear canvas
      ctx.clearRect(0, 0, 400, 400);
      
      if (canvasState === 'locked') {
        // Darken the canvas
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, 400, 400);
        
        // Add instruction text
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Tap/click here to draw your move!', 200, 200);
      } else if (canvasState === 'drawing') {
        // Set up drawing context
        ctx.strokeStyle = '#ff6b6b';
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
      } else if (canvasState === 'finished') {
        // Show locked state with drawing preserved
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(0, 0, 400, 400);
        
        ctx.fillStyle = 'white';
        ctx.font = 'bold 16px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('🔒 LOCKED', 200, 200);
      }
    }
  }, [canvasState]);

  const generateOpponentPoints = useCallback(async (): PathData => {
    const sampleIndexes = [1, 2, 3, 4];
    const randomIndex = sampleIndexes[Math.floor(Math.random() * sampleIndexes.length)];
    const dataPoints = await csvToDataPoints(`/data/moves/sample${randomIndex}.csv`);
    console.log("[MakeMove] Opponent datapoints ready ! ", JSON.stringify(dataPoints).slice(0, 100));
    opponentPointsRef.current = dataPoints;
  }, []);

  // On loading
  useEffect(() => {
    generateOpponentPoints();
  }, [generateOpponentPoints]);

  // When opponent path is ready, init canvas
  useEffect(() => {
    if (opponentPointsRef.current.length > 0) {
      initializeCanvas();
    }
  }, [initializeCanvas, opponentPointsRef])

  const finishDrawingSession = useCallback(() => {
    console.log('Finishing drawing session with points:', drawingPointsRef.current);
    setCanvasState('finished');
    
    // Create path data using the ref (which has the latest points)
    const playerPathData: PathData = {
      points: drawingPointsRef.current,
      duration: 5000, // Always 5 seconds
    };

    const opponentPathData: PathData = {
      points: opponentPointsRef.current,
      duration: 5000
    }
    
    console.log('Sending path data:', playerPathData, "opponent => ", opponentPathData);
    
    // Redirect after a short delay
    setTimeout(() => {
      onMoveComplete(playerPathData, opponentPathData);
    }, 1000);
  }, [onMoveComplete]);

  const startDrawingSession = useCallback(() => {
    if (canvasState !== 'locked') return;
    
    console.log('Starting drawing session');
    setCanvasState('drawing');
    setTimeLeft(5);
    setStartTime(Date.now());
    setDrawingPoints([]);
    drawingPointsRef.current = [];
    
    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    // Start countdown
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          if (timeTracker.current) {
            clearInterval(timeTracker.current);
            timeTracker.current = null;
          }
          finishDrawingSession();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    timeTracker.current = setInterval(() => {
      if (!isDrawing) {
        const lastDrawnPoints = drawingPoints[drawingPoints.length - 1];
        if (lastDrawnPoints) {
          console.log('Inactive ! Ajout de points');
          setDrawingPoints([...drawingPoints, { x: lastDrawnPoints.x, y: lastDrawnPoints.y }]);
        }
      }
    }, 10);
  }, [canvasState, finishDrawingSession]);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (canvasState === 'locked') {
      startDrawingSession();
    } else if (canvasState === 'drawing') {
      startDrawing(e);
    }
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (canvasState !== 'drawing') return;
    
    setIsDrawing(true);
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      const timestamp = Date.now() - startTime;
      const newPoint: DrawingPoint = { x, y, timestamp };
      
      // Update both state and ref
      setDrawingPoints([newPoint]);
      drawingPointsRef.current = [newPoint];
      
      console.log('Started drawing at:', newPoint);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || canvasState !== 'drawing') return;
    
    const { x, y } = getCoordinates(e);
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.stroke();
      const timestamp = Date.now() - startTime;
      const newPoint: DrawingPoint = { x, y, timestamp };
      
      // Update both state and ref
      setDrawingPoints(prev => {
        const updated = [...prev, newPoint];
        drawingPointsRef.current = updated; // Keep ref in sync
        return updated;
      });
      
      console.log('Drawing point:', newPoint, 'Total points:', drawingPointsRef.current.length);
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden main-background">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">MAKE YOUR MOVE</h1>
        <p className="text-gray-800">Draw your character's movement path</p>
      </div>

      {/* Timer - only show when drawing */}
      {canvasState === 'drawing' && (
        <div className="mb-6">
          <div className={`text-6xl font-bold ${timeLeft <= 2 ? 'text-red-400 animate-pulse' : 'text-gray-800'}`}>
            {timeLeft}
          </div>
          <p className="text-center text-gray-400 mt-2">seconds left</p>
        </div>
      )}

      {/* Drawing Canvas */}
      <div className="relative mb-6">
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className={`border-4 border-gray-600 rounded-lg bg-gray-800 ${
            canvasState === 'locked' ? 'cursor-pointer' : 
            canvasState === 'drawing' ? 'cursor-crosshair' : 
            'cursor-not-allowed'
          }`}
          onClick={handleCanvasClick}
          onMouseDown={canvasState === 'drawing' ? startDrawing : undefined}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={handleCanvasClick}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>

      <div className="text-center text-gray-800">
        <p>
          {canvasState === 'locked' && '🎯 Click the canvas to start drawing your path'}
          {canvasState === 'drawing' && '🎨 Draw your character\'s movement path quickly!'}
          {canvasState === 'finished' && '⚔️ Preparing for battle...'}
        </p>
        <p className="text-xs mt-2 text-gray-800">
          Cheems will follow this exact path during battle!
        </p>
        {/* Debug info */}
        {canvasState === 'drawing' && (
          <p className="text-xs mt-1 text-blue-400">
            Points captured: {drawingPoints.length}
          </p>
        )}
      </div>
    </div>
  );
};