import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Player, Board, Stone, AIDifficulty } from '../types';
import GoBoard from './GoBoard';
import { getAIMove } from '../services/geminiService';
import ArrowLeftIcon from './icons/ArrowLeftIcon';
import { playSound } from '../services/audioService';
import SpeakerWaveIcon from './icons/SpeakerWaveIcon';

const GameScreen: React.FC<{ onBack: () => void; size: number; difficulty: AIDifficulty; }> = ({ onBack, size, difficulty }) => {
  const initialBoard = useMemo(() => Array(size).fill(null).map(() => Array(size).fill(null)), [size]);
  
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
  }, [initialBoard]);
  
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

  const showErrorMessage = (msg: string, row?: number, col?: number) => {
    setMessage(msg);
    setMessageType('error');
    if (row !== undefined && col !== undefined) {
      setInvalidMove({ row, col });
    }
  };

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
        visited.add(key);
        
        const neighborStone = currentBoard[neighbor.r][neighbor.c];
        if (neighborStone === player) {
          queue.push(neighbor);
        } else if (neighborStone === null) {
          liberties.add(key);
        }
      }
    }
    return { group, liberties: liberties.size };
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
    const { blackTerritory, whiteTerritory, territoryMap } = calculateTerritory(board);
    
    setScoreDetails({
        black: { territory: blackTerritory, captured: scores.black },
        white: { territory: whiteTerritory, captured: scores.white }
    });

    const finalBlack = scores.black + blackTerritory;
    const finalWhite = scores.white + whiteTerritory;
    
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

  }, [board, scores, calculateTerritory]);

  const passTurn = useCallback(() => {
    playSound('pass');
    setLastSound('Pass');
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

  const handleMove = useCallback((row: number, col: number) => {
    if (gameOver || board[row][col] !== null) {
      if (board[row][col] !== null) {
        showErrorMessage("Invalid move: Spot is taken.", row, col);
      }
      return;
    }
    
    let newBoard = board.map(r => [...r]);
    newBoard[row][col] = currentPlayer;

    const opponent: Player = currentPlayer === 'black' ? 'white' : 'black';
    let capturedStones = 0;

    for (const neighbor of getNeighbors(row, col)) {
      if (newBoard[neighbor.r][neighbor.c] === opponent) {
        const { group, liberties } = findGroup(neighbor.r, neighbor.c, opponent, newBoard);
        if (liberties === 0) {
          capturedStones += group.size;
          group.forEach(key => {
            const [r, c] = key.split(',').map(Number);
            newBoard[r][c] = null;
          });
        }
      }
    }

    const { liberties: selfLiberties } = findGroup(row, col, currentPlayer, newBoard);
    if (selfLiberties === 0 && capturedStones === 0) {
      showErrorMessage("Illegal suicide move.", row, col);
      return;
    }

    const newBoardString = JSON.stringify(newBoard);
    const lastBoardString = history.length > 0 ? JSON.stringify(history[history.length - 1]) : null;
    if(newBoardString === lastBoardString){
        showErrorMessage("Illegal Ko move.", row, col);
        return;
    }

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
    setMessage(`${nextPlayer === 'black' ? 'Black' : 'White'}'s turn.`);
    setMessageType('info');
    setConsecutivePasses(0);
    setIsAITurn(nextPlayer === 'white');

  }, [board, currentPlayer, gameOver, history, getNeighbors, findGroup]);

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
        const move = await getAIMove(board, 'white', history, difficulty);
        setLoadingAI(false);

        if (move === 'pass') {
          passTurn();
        } else {
          if(move.row >= 0 && move.row < size && move.col >= 0 && move.col < size && board[move.row][move.col] === null) {
            handleMove(move.row, move.col);
          } else {
            console.warn("AI suggested an invalid move. Passing instead.");
            passTurn();
          }
        }
      };
      
      const timeoutId = setTimeout(performAIMove, 1000);
      return () => clearTimeout(timeoutId);
    }
  }, [isAITurn, currentPlayer, gameOver, board, history, handleMove, passTurn, size, difficulty]);

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="flex-none w-full md:w-72 order-2 md:order-1 flex flex-col p-4">
        <button onClick={onBack} className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition mb-4 flex items-center justify-center space-x-2">
            <ArrowLeftIcon />
            <span>Main Menu</span>
        </button>
        <div className="bg-gray-900/50 rounded-lg p-4 flex-grow flex flex-col justify-between">
            <div>
                <h2 className="text-2xl font-bold mb-4">Game Info</h2>
                <div className={`p-3 rounded-lg border-2 ${currentPlayer === 'black' && !gameOver ? 'border-blue-500' : 'border-transparent'}`}>
                    <h3 className="text-lg font-semibold">Black (You)</h3>
                    {scoreDetails ? (
                        <p>Score: {scores.black} <span className="text-xs text-gray-400">({scoreDetails.black.territory}T + {scoreDetails.black.captured}C)</span></p>
                    ) : (
                        <p>Captured: {scores.black}</p>
                    )}
                </div>
                <div className={`mt-4 p-3 rounded-lg border-2 ${currentPlayer === 'white' && !gameOver ? 'border-blue-500' : 'border-transparent'}`}>
                    <h3 className="text-lg font-semibold">White (AI)</h3>
                    <p>Difficulty: <span className="capitalize">{difficulty}</span></p>
                    {scoreDetails ? (
                        <p>Score: {scores.white} <span className="text-xs text-gray-400">({scoreDetails.white.territory}T + {scoreDetails.white.captured}C)</span></p>
                    ) : (
                        <p>Captured: {scores.white}</p>
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
            </div>
            
            <div className="flex flex-col space-y-3">
                 <button onClick={handlePass} disabled={isAITurn || gameOver} className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-4 rounded transition disabled:bg-gray-600">
                    Pass Turn
                </button>
                <button onClick={resetGame} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded transition">
                    Reset Game
                </button>
            </div>
        </div>
      </div>
      <div className="flex-grow flex justify-center items-stretch order-1 md:order-2 relative min-h-0 p-4">
          {loadingAI && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-20 rounded-lg">
                   <div className="text-center">
                        <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-blue-500 mx-auto"></div>
                        <p className="text-white mt-4 text-lg">AI is thinking...</p>
                    </div>
              </div>
          )}
          <GoBoard size={size} boardState={board} onMove={handleMove} lastMove={lastMove} disabled={isAITurn || gameOver} territoryMap={territory} invalidMove={invalidMove} />
      </div>
    </div>
  );
};

export default GameScreen;