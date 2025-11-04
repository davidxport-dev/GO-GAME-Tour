import React from 'react';
import { Board } from '../types';

interface GoBoardProps {
  size: number;
  boardState: Board;
  onMove: (row: number, col: number) => void;
  lastMove: { row: number, col: number } | null;
  disabled: boolean;
  territoryMap: Board;
  invalidMove: { row: number, col: number } | null;
}

const getHoshiPoints = (boardSize: number) => {
    if (boardSize === 9) {
        const edge = 2;
        const center = Math.floor(boardSize / 2);
        return [[edge, edge], [edge, boardSize - 1 - edge], [center, center], [boardSize - 1 - edge, edge], [boardSize - 1 - edge, boardSize - 1 - edge]];
    }
    if (boardSize === 13 || boardSize === 19) {
        const edge = 3;
        const center = Math.floor(boardSize / 2);
        const points = [
            [edge, edge],
            [edge, boardSize - 1 - edge],
            [boardSize - 1 - edge, edge],
            [boardSize - 1 - edge, boardSize - 1 - edge],
        ];
        if (boardSize > 9) {
            points.push([center, center]);
        }
        if (boardSize === 19) {
             points.push([edge, center], [center, edge], [boardSize - 1 - edge, center], [center, boardSize - 1 - edge]);
        }
        return points;
    }
    return [];
};


const GoBoard: React.FC<GoBoardProps> = ({ size, boardState, onMove, lastMove, disabled, territoryMap, invalidMove }) => {
  const hoshiPoints = getHoshiPoints(size);
  const cellSize = 100 / (size - 1);

  // The root div now uses viewport units to guarantee a large, square size,
  // bypassing any parent container sizing issues. 
  // 95vmin = 95% of the smaller viewport dimension (width or height).
  // This ensures the board is always visible and as large as possible.
  return (
    <div className="w-[95vmin] h-[95vmin] relative bg-[#d2b48c] shadow-lg rounded-md">
      {/* Padded area for the grid, so stones on the edge aren't cut off */}
      <div className="absolute inset-[2.5%]">
        
        {/* Lines */}
        <div className="absolute inset-0">
          {/* Horizontal lines */}
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full h-[1px] bg-gray-900/50"
              style={{ top: `${(i / (size - 1)) * 100}%` }}
            />
          ))}
          {/* Vertical lines */}
          {Array.from({ length: size }).map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-[1px] bg-gray-900/50"
              style={{ left: `${(i / (size - 1)) * 100}%` }}
            />
          ))}
        </div>

        {/* Hoshi Points */}
        <div className="absolute inset-0">
            {hoshiPoints.map(([r, c], i) => (
            <div
                key={i}
                className="absolute w-2 h-2 bg-gray-900/60 rounded-full -translate-x-1/2 -translate-y-1/2"
                style={{
                top: `${(r / (size - 1)) * 100}%`,
                left: `${(c / (size - 1)) * 100}%`,
                }}
            />
            ))}
        </div>

        {/* Territory Overlay */}
        <div className="absolute inset-0">
            {territoryMap.flat().map((owner, i) => {
                const r = Math.floor(i / size);
                const c = i % size;
                if (!owner || boardState[r][c] !== null) return null;
                const bgColor = owner === 'black' ? 'bg-black/40' : 'bg-white/40';
                return (
                    <div
                        key={`${r}-${c}-territory`}
                        className={`absolute rounded-sm ${bgColor} z-5 pointer-events-none -translate-x-1/2 -translate-y-1/2`}
                        style={{
                            top: `${(r / (size - 1)) * 100}%`,
                            left: `${(c / (size - 1)) * 100}%`,
                            width: `${cellSize * 0.5}%`,
                            height: `${cellSize * 0.5}%`,
                        }}
                    />
                );
            })}
        </div>
        
        {/* Clickable Intersections and Stones */}
        <div className="absolute inset-0">
            {boardState.flat().map((stone, i) => {
            const r = Math.floor(i / size);
            const c = i % size;
            return (
                <div
                key={`${r}-${c}`}
                className="absolute -translate-x-1/2 -translate-y-1/2"
                style={{
                    top: `${(r / (size - 1)) * 100}%`,
                    left: `${(c / (size - 1)) * 100}%`,
                    width: `${cellSize}%`, // Clickable area
                    height: `${cellSize}%`,
                    zIndex: 10,
                }}
                onClick={() => !disabled && onMove(r, c)}
                >
                {/* This inner div is for the stone itself and hover effects */}
                <div
                    className={`w-full h-full relative flex items-center justify-center rounded-full ${!disabled && stone === null ? 'cursor-pointer group' : ''}`}
                >
                    {/* Hover preview */}
                    {!disabled && stone === null && (
                         <div className="opacity-0 group-hover:opacity-20 transition-opacity w-[90%] h-[90%] rounded-full bg-black"></div>
                    )}
                    
                    {/* Stone */}
                    {stone && (
                    <div
                        className={`absolute w-[90%] h-[90%] rounded-full shadow-md ${
                        stone === 'black' ? 'bg-black' : 'bg-white'
                        } ${lastMove && lastMove.row === r && lastMove.col === c ? 'ring-2 ring-offset-2 ring-blue-500' : ''}`}
                    />
                    )}

                    {/* Invalid Move Indicator */}
                    {invalidMove && invalidMove.row === r && invalidMove.col === c && (
                        <div className="absolute text-red-500 font-bold text-2xl w-full h-full flex items-center justify-center" style={{ textShadow: '0 0 3px black' }}>
                        X
                        </div>
                    )}
                </div>
                </div>
            );
            })}
        </div>
      </div>
    </div>
  );
};

export default GoBoard;