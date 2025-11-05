import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Board, Stone, AIDifficulty, TimeSetting, Move } from '../types';
import GoBoard from './GoBoard';
import { getAIMove } from '../services/geminiService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { playSound } from '../services/audioService';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';
import ClockIcon from './icons/ClockIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';

const GameScreen: React.FC<{ onBack: () => void; size: number; difficulty: AIDifficulty; timeSetting: TimeSetting; }> = ({ onBack, size, difficulty, timeSetting }) => {
  const initialBoard = useMemo(() => Array(size).fill(null).map(() => Array(size).fill(null)), [size]);
  
  const getInitialTime = useCallback((setting: TimeSetting): number | null => {
    if (setting === 'unlimited') return null;
    const minutes = parseInt(setting.replace('m', ''));
    return minutes * 60;
  }, []);

  const [board, setBoard] = useState<Board>(initialBoard);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('black');
  const [scores, setScores] = useState({ black: 0, white: 0 });
  const [isAITurn, setIsAITurn] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [history, setHistory] = useState<Board[]>([]);
  const [consecutivePasses, setConsecutivePasses] = useState(0);
  const [message, setMessage] = useState("Black's turn to move.");
  const [messageType, setMessageType] = useState<'info' | 'error'>('info');
  const [lastMove, setLastMove] = useState<{row: number, col: number} | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [territory, setTerritory] = useState<Board>(initialBoard);
  const [scoreDetails, setScoreDetails] = useState<{ black: { territory: number, captured: number }, white: { territory: number, captured: number }} | null>(null);
  const [lastSound, setLastSound] = useState<string | null>(null);
  const [invalidMove, setInvalidMove] = useState<{row: number, col: number} | null>(null);
  const [timers, setTimers] = useState({
    black: getInitialTime(timeSetting),
    white: getInitialTime(timeSetting),
  });
  const [moveHistory, setMoveHistory] = useState<(Move | 'pass')[]>([]);
  const [isHistoryVisible, setIsHistoryVisible] = useState(false);

  useEffect(() => {
    if (lastSound) {
        const timer = setTimeout(() => setLastSound(null), 1000);
        return () => clearTimeout(timer);
    }
  }, [lastSound]);

  const resetGame = useCallback(() => {
    setBoard(initialBoard);
    setCurrentPlayer('black');
    setScores({ black: 0, white: 0 });
    setIsAITurn(false);
    setGameOver(false);
    setHistory([]);
    setConsecutivePasses(0);
    setMessage("Black's turn to move.");
    setMessageType('info');
    setLastMove(null);
    setTerritory(initialBoard);
    setScoreDetails(null);
    setMoveHistory([]);
    setIsHistoryVisible(false);
    const initialTime = getInitialTime(timeSetting);
    setTimers({ black: initialTime, white: initialTime });
  }, [initialBoard, getInitialTime, timeSetting]);
  
  const showErrorMessage = useCallback((msg: string, row?: number, col?: number) => {
    setMessage(msg);
    setMessageType('error');
    if (row !== undefined && col !== undefined) {
      setInvalidMove({ row, col });
    }
  }, []);

  // Effect to clear error messages after a delay
  useEffect(() => {
    if (messageType === 'error') {
        const timer = setTimeout(() => {
            setMessageType('info');
            setInvalidMove(null);
            // Restore the correct turn message
            if (!gameOver) {
              setMessage(`${currentPlayer === 'black' ? 'Black' : 'White'}'s turn.`);
            }
        }, 2000);
        return () => clearTimeout(timer);
    }
  }, [message, messageType, currentPlayer, gameOver]);

  const getNeighbors = useCallback((r: number, c: number) => {
    const neighbors = [];
    if (r > 0) neighbors.push({ r: r - 1, c });
    if (r < size - 1) neighbors.push({ r: r + 1, c });
    if (c > 0) neighbors.push({ r, c: c - 1 });
    if (c < size - 1) neighbors.push({ r, c: c + 1 });
    return neighbors;
  }, [size]);

  const findGroup = useCallback((r: number, c: number, player: Player, currentBoard: Board) => {
    const group = new Set<string>();
    const liberties = new Set<string>();
    const visited = new Set<string>();
    const queue = [{ r, c }];
    visited.add(`${r},${c}`);

    while (queue.length > 0) {
      const stone = queue.shift()!;
      group.add(`${stone.r},${stone.c}`);

      for (const neighbor of getNeighbors(stone.r, stone.c)) {
        const key = `${neighbor.r},${neighbor.c}`;
        if (visited.has(key)) continue;
        
        const neighborStone = currentBoard[neighbor.r][neighbor.c];
        if (neighborStone === player) {
          visited.add(key);
          queue.push(neighbor);
        } else if (neighborStone === null) {
          liberties.add(key);
        }
      }
    }
    return { group, liberties };
  }, [getNeighbors]);
  
  const calculateTerritory = useCallback((finalBoard: Board) => {
    const territoryMap: (Player | null)[][] = Array(size).fill(null).map(() => Array(size).fill(null));
    const visited: boolean[][] = Array(size).fill(null).map(() => Array(size).fill(false));
    let blackTerritory = 0;
    let whiteTerritory = 0;

    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (finalBoard[r][c] === null && !visited[r][c]) {
                const group = new Set<string>();
                const borders = new Set<Player>();
                const queue = [{ r, c }];
                visited[r][c] = true;

                while (queue.length > 0) {
                    const stone = queue.shift()!;
                    group.add(`${stone.r},${stone.c}`);

                    for (const neighbor of getNeighbors(stone.r, stone.c)) {
                        const neighborStone = finalBoard[neighbor.r][neighbor.c];
                        if (neighborStone !== null) {
                           borders.add(neighborStone);
                        } else if (!visited[neighbor.r][neighbor.c]) {
                           visited[neighbor.r][neighbor.c] = true;
                           queue.push(neighbor);
                        }
                    }
                }

                if (borders.size === 1) {
                    const owner = borders.values().next().value;
                    if (owner === 'black') {
                        blackTerritory += group.size;
                    } else {
                        whiteTerritory += group.size;
                    }
                    group.forEach(key => {
                        const [row, col] = key.split(',').map(Number);
                        territoryMap[row][col] = owner;
                    });
                }
            }
        }
    }

    return { blackTerritory, whiteTerritory, territoryMap };
  }, [size, getNeighbors]);
  
  const endGame = useCallback(() => {
    // Pass 1: Initial territory calculation to identify influential areas
    const { territoryMap: initialTerritoryMap } = calculateTerritory(board);
    
    let finalBoard = board.map(r => [...r]);
    const visitedStones = new Set<string>();
    let deadBlackStones = 0;
    let deadWhiteStones = 0;

    // Pass 2: Identify and mark dead stones
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const stoneKey = `${r},${c}`;
        const stone = finalBoard[r][c];
        if (stone && !visitedStones.has(stoneKey)) {
          const { group, liberties } = findGroup(r, c, stone, finalBoard);
          group.forEach(key => visitedStones.add(key));

          let isDead = true;
          if (liberties.size > 0) {
            for (const libertyKey of liberties) {
              const [lr, lc] = libertyKey.split(',').map(Number);
              // A group is alive if any of its liberties are in its own territory or neutral territory
              if (initialTerritoryMap[lr][lc] !== (stone === 'black' ? 'white' : 'black')) {
                isDead = false;
                break;
              }
            }
          }
          // Note: A group with 0 liberties at the end of the game is also considered dead.

          if (isDead) {
            if (stone === 'black') deadBlackStones += group.size;
            else deadWhiteStones += group.size;
            
            group.forEach(key => {
              const [gr, gc] = key.split(',').map(Number);
              finalBoard[gr][gc] = null; // Remove dead stones for final territory count
            });
          }
        }
      }
    }

    // Pass 3: Final territory calculation on the board with dead stones removed
    const { blackTerritory, whiteTerritory, territoryMap } = calculateTerritory(finalBoard);
    
    // Final Scoring
    const capturedByBlack = scores.black + deadWhiteStones;
    const capturedByWhite = scores.white + deadBlackStones;

    const finalBlack = blackTerritory + capturedByBlack;
    const finalWhite = whiteTerritory + capturedByWhite;

    setScoreDetails({
        black: { territory: blackTerritory, captured: capturedByBlack },
        white: { territory: whiteTerritory, captured: capturedByWhite }
    });

    setScores({ black: finalBlack, white: finalWhite });
    setTerritory(territoryMap);
    setGameOver(true);
    
    let winnerMessage = `Game Over. Final Score: Black ${finalBlack} - White ${finalWhite}. `;
    if (finalBlack > finalWhite) {
        winnerMessage += 'Black wins!';
    } else if (finalWhite > finalBlack) {
        winnerMessage += 'White wins!';
    } else {
        winnerMessage += "It's a draw!";
    }
    setMessage(winnerMessage);
    setMessageType('info');

  }, [board, scores, calculateTerritory, size, findGroup]);

  const passTurn = useCallback(() => {
    playSound('pass');
    setLastSound('Pass');
    setMoveHistory(prev => [...prev, 'pass']);
    const newPasses = consecutivePasses + 1;
    if (newPasses >= 2) {
        endGame();
        return;
    }
    setConsecutivePasses(newPasses);
    const nextPlayer: Player = currentPlayer === 'black' ? 'white' : 'black';
    setCurrentPlayer(nextPlayer);
    setMessage(`${nextPlayer === 'black' ? 'Black' : 'White'}'s turn. (Previous player passed)`);
    setIsAITurn(nextPlayer === 'white');
  }, [consecutivePasses, currentPlayer, endGame]);

  const handleMove = useCallback((row: number, col: number): boolean => {
    if (gameOver) return false;

    // 1. Check if the spot is already taken
    if (board[row][col] !== null) {
      if (currentPlayer === 'black') { // Only show UI error for human player
        showErrorMessage("Invalid move: Spot is taken.", row, col);
      }
      return false; // Move is invalid
    }
    
    // Create a temporary board to test the move
    let newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;

    const opponent: Player = currentPlayer === 'black' ? 'white' : 'black';
    let capturedStones = 0;

    // 2. Check for captures
    for (const neighbor of getNeighbors(row, col)) {
      if (newBoard[neighbor.r][neighbor.c] === opponent) {
        const { group, liberties } = findGroup(neighbor.r, neighbor.c, opponent, newBoard);
        if (liberties.size === 0) {
          capturedStones += group.size;
          group.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            newBoard[r][c] = null;
          });
        }
      }
    }

    // 3. Check for suicide
    const { liberties: selfLiberties } = findGroup(row, col, currentPlayer, newBoard);
    if (selfLiberties.size === 0 && capturedStones === 0) {
      if (currentPlayer === 'black') {
        showErrorMessage("Illegal suicide move.", row, col);
      }
      return false; // Move is invalid
    }

    // 4. Check for Ko
    const newBoardString = JSON.stringify(newBoard);
    const lastBoardString = history.length > 0 ? JSON.stringify(history[history.length - 1]) : null;
    if(newBoardString === lastBoardString){
        if (currentPlayer === 'black') {
            showErrorMessage("Illegal Ko move.", row, col);
        }
        return false; // Move is invalid
    }

    // If all checks pass, the move is valid. Update the game state.
    if (capturedStones > 0) {
        playSound('capture');
        setLastSound('Capture!');
    } else {
        playSound('place');
        setLastSound('Stone Placed');
    }

    setHistory(prev => [...prev, board]);
    setBoard(newBoard);
    setScores(prev => ({ ...prev, [currentPlayer]: prev[currentPlayer] + capturedStones }));
    const nextPlayer: Player = opponent;
    setCurrentPlayer(nextPlayer);
    setLastMove({row, col});
    setMoveHistory(prev => [...prev, {row, col}]);
    setMessage(`${nextPlayer === 'black' ? 'Black' : 'White'}'s turn.`);
    setMessageType('info');
    setConsecutivePasses(0);
    setIsAITurn(nextPlayer === 'white');

    return true; // Move was successful
  }, [board, currentPlayer, gameOver, history, getNeighbors, findGroup, showErrorMessage]);

  const handlePass = useCallback(() => {
    if (gameOver || isAITurn) return;
    passTurn();
  }, [gameOver, isAITurn, passTurn]);
  
  useEffect(() => {
    if (isAITurn && currentPlayer === 'white' && !gameOver) {
      setLoadingAI(true);
      setMessage("AI is thinking...");
      setMessageType('info');
      const performAIMove = async () => {
        let attempts = 0;
        const maxAttempts = 3; // Give the AI 3 chances to find a valid move.

        while (attempts < maxAttempts) {
          const move = await getAIMove(board, 'white', history, difficulty);
          
          if (move === 'pass') {
            passTurn();
            setLoadingAI(false);
            return;
          }

          const moveSuccessful = handleMove(move.row, move.col);

          if (moveSuccessful) {
            setLoadingAI(false);
            return; // Success, exit the function.
          }
          
          // If move was not successful, it was illegal.
          attempts++;
          console.warn(`AI suggested an invalid move (attempt ${attempts}/${maxAttempts}). Retrying...`);
        }

        // If the loop completes, all attempts failed.
        console.error(`AI failed to find a valid move after ${maxAttempts} attempts. Passing turn.`);
        passTurn();
        setLoadingAI(false);
      };
      
      const timeoutId = setTimeout(performAIMove, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isAITurn, currentPlayer, gameOver, board, history, handleMove, passTurn, difficulty]);

  // Timer countdown effect
  useEffect(() => {
    if (gameOver || timeSetting === 'unlimited') {
        return;
    }

    const timerId = setInterval(() => {
        setTimers(prev => {
            if (prev[currentPlayer] === null) return prev;
            
            const newTime = prev[currentPlayer]! - 1;
            if (newTime <= 0) {
                clearInterval(timerId); // Stop interval right away
                return { ...prev, [currentPlayer]: 0 };
            }
            return { ...prev, [currentPlayer]: newTime };
        });
    }, 1000);

    return () => clearInterval(timerId);
  }, [currentPlayer, gameOver, timeSetting]);

  const handleTimeUp = useCallback(() => {
      if (gameOver) return;
      const loser = timers.black === 0 ? 'black' : 'white';
      const winner = loser === 'black' ? 'White' : 'Black';
      setMessage(`${winner} wins on time!`);
      setMessageType('info');
      setGameOver(true);
      playSound('capture'); 
  }, [gameOver, timers.black, timers.white]);

  // Time-up check effect
  useEffect(() => {
      if ((timers.black !== null && timers.black <= 0) || (timers.white !== null && timers.white <= 0)) {
          handleTimeUp();
      }
  }, [timers, handleTimeUp]);

  const formatTime = (seconds: number | null) => {
      if (seconds === null) return '∞';
      if (seconds < 0) seconds = 0;
      const mins = Math.floor(seconds / 60);
      const secs = seconds % 60;
      return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const colToLetter = (col: number): string => {
      const letters = "ABCDEFGHJKLMNOPQRSTUVWXYZ"; // Skips 'I'
      return letters[col] || '?';
  };

  const formatMove = (move: Move | 'pass', index: number): string => {
      const moveNumber = Math.floor(index / 2) + 1;
      const player: Player = index % 2 === 0 ? 'black' : 'white';
      const playerName = player.charAt(0).toUpperCase() + player.slice(1);

      if (move === 'pass') {
          return `${moveNumber}. ${playerName}: Pass`;
      }

      const letter = colToLetter(move.col);
      const rowNum = size - move.row;
      return `${moveNumber}. ${playerName}: ${letter}${rowNum}`;
  };

  return (
    <div className="h-full flex flex-col md:flex-row gap-4">
      {/* Info Panel */}
      <div className="flex flex-col p-4 md:w-80 md:flex-shrink-0 min-h-0">
        <button onClick={onBack} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition mb-4 flex items-center justify-center space-x-2 flex-shrink-0">
            <ArrowLeftIcon />
            <span>Main Menu</span>
        </button>
        <div className="bg-gray-900/50 rounded-lg p-4 flex-grow flex flex-col justify-between overflow-y-auto">
            <div>
                <h2 className="text-2xl font-bold mb-4">Game Info</h2>
                <div className={`p-3 rounded-lg border-2 ${currentPlayer === 'black' && !gameOver ? 'border-blue-500' : 'border-transparent'}`}>
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-semibold">Black (You)</h3>
                        {timeSetting !== 'unlimited' && (
                            <div className={`flex items-center space-x-2 text-lg font-mono p-1 px-2 rounded ${currentPlayer === 'black' && !gameOver ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400'}`}>
                                <ClockIcon />
                                <span>{formatTime(timers.black)}</span>
                            </div>
                        )}
                    </div>
                    {scoreDetails ? (
                        <p className="mt-1">Score: {scores.black} <span className="text-xs text-gray-400">({scoreDetails.black.territory}T + {scoreDetails.black.captured}C)</span></p>
                    ) : (
                        <p className="mt-1">Captured: {scores.black}</p>
                    )}
                </div>
                <div className={`mt-4 p-3 rounded-lg border-2 ${currentPlayer === 'white' && !gameOver ? 'border-blue-500' : 'border-transparent'}`}>
                    <div className="flex justify-between items-center">
                         <div>
                            <h3 className="text-lg font-semibold">White (AI)</h3>
                            <p className="text-sm text-gray-400">Difficulty: <span className="capitalize">{difficulty}</span></p>
                        </div>
                        {timeSetting !== 'unlimited' && (
                            <div className={`flex items-center space-x-2 text-lg font-mono p-1 px-2 rounded ${currentPlayer === 'white' && !gameOver ? 'bg-blue-500/20 text-blue-300' : 'text-gray-400'}`}>
                                <ClockIcon />
                                <span>{formatTime(timers.white)}</span>
                            </div>
                        )}
                    </div>
                    {scoreDetails ? (
                        <p className="mt-1">Score: {scores.white} <span className="text-xs text-gray-400">({scoreDetails.white.territory}T + {scoreDetails.white.captured}C)</span></p>
                    ) : (
                        <p className="mt-1">Captured: {scores.white}</p>
                    )}
                </div>
                <p className={`mt-6 h-10 transition-all duration-300 ${messageType === 'error' ? 'text-red-400 font-bold' : gameOver ? 'text-green-400 font-semibold' : 'text-gray-400 italic'}`}>{message}</p>
                <div className="relative h-8 -mt-6">
                    {lastSound && (
                        <div key={Date.now()} className="absolute inset-0 flex items-center justify-center space-x-2 text-green-400 opacity-0 animate-fade-in-out">
                            <SpeakerWaveIcon />
                            <span className="font-semibold">{lastSound}</span>
                        </div>
                    )}
                </div>
                 {/* Move History Section */}
                <div className="mt-4">
                    <button 
                        onClick={() => setIsHistoryVisible(!isHistoryVisible)} 
                        className="w-full flex justify-between items-center bg-gray-700/50 p-2 rounded-md hover:bg-gray-700 transition"
                        aria-expanded={isHistoryVisible}
                        aria-controls="move-history-panel"
                    >
                        <span className="font-semibold">Move History</span>
                        <span className={`transition-transform duration-200 ${isHistoryVisible ? 'rotate-180' : ''}`}>
                            <ChevronDownIcon />
                        </span>
                    </button>
                    {isHistoryVisible && (
                        <div id="move-history-panel" className="mt-2 bg-gray-800/50 p-2 rounded-md max-h-48 overflow-y-auto">
                            {moveHistory.length > 0 ? (
                                <ul className="space-y-1 text-sm">
                                    {[...moveHistory].reverse().map((move, index) => {
                                        const originalIndex = moveHistory.length - 1 - index;
                                        return (
                                            <li key={originalIndex} className={`p-1 rounded ${originalIndex % 2 === 0 ? 'bg-gray-900/70' : 'bg-gray-700/70'}`}>
                                                {formatMove(move, originalIndex)}
                                            </li>
                                        )
                                    })}
                                </ul>
                            ) : (
                                <p className="text-gray-500 italic text-center p-2">No moves yet.</p>
                            )}
                        </div>
                    )}
                </div>
            </div>
            
            <div className="flex flex-col space-y-3 mt-4">
                 <button onClick={handlePass} disabled={isAITurn || gameOver} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded transition disabled:bg-gray-600">
                    Pass Turn
                </button>
                <button onClick={resetGame} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition">
                    Reset Game
                </button>
            </div>
        </div>
      </div>
      {/* Board Container */}
      <div className="relative flex-grow flex items-center justify-center min-w-0 min-h-0 p-4">
          {loadingAI && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-lg">
                   <div className="text-center">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
                        <p className="text-white mt-4 text-lg">AI is thinking...</p>
                    </div>
              </div>
          )}
          <GoBoard size={size} boardState={board} onMove={(r, c) => !isAITurn && handleMove(r, c)} lastMove={lastMove} disabled={isAITurn || gameOver} territoryMap={territory} invalidMove={invalidMove} />
      </div>
    </div>
  );
};

export default GameScreen;