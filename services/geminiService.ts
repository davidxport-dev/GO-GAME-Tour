import { GoogleGenAI, Type } from "@google/genai";
import { Board, Player, Move, AIDifficulty } from '../types';

// This function must be defined in a real environment with an API key
const getApiKey = () => process.env.API_KEY;

const getDifficultyInstruction = (difficulty: AIDifficulty): string => {
    switch (difficulty) {
        case 'beginner':
            return "You are a beginner Go player. You understand the basic rules of capture but don't think many moves ahead. Prioritize simple captures and defending your immediate groups. Make plausible but non-optimal moves a beginner might make.";
        case 'skilled':
            return "You are a skilled Go AI. Play strategically to win, balancing attack and defense like an intermediate club player.";
        case 'pro':
            return "You are an expert Go AI, playing at a professional level. Your analysis should be deep, considering long-term strategy, complex life-and-death situations, and subtle territorial advantages.";
        default:
            return "You are a Go game AI expert.";
    }
}

export const getAIMove = async (board: Board, currentPlayer: Player, history: Board[], difficulty: AIDifficulty): Promise<Move | 'pass'> => {
  if (!getApiKey()) {
      console.warn("API_KEY is not set. AI will pass.");
      return 'pass';
  }
  const ai = new GoogleGenAI({ apiKey: getApiKey() });

  const boardString = board.map(row =>
    row.map(stone => (stone ? (stone === 'black' ? 'B' : 'W') : '.')).join(' ')
  ).join('\n');

  const lastBoardState = history.length > 0 ? history[history.length - 1] : null;
  const lastBoardStateString = lastBoardState
    ? lastBoardState.map(row => row.map(s => s ? (s === 'black' ? 'B' : 'W') : '.').join(' ')).join('\n')
    : "N/A (first move)";

  const totalMoves = history.length + 1;
  const boardArea = board.length * board.length;
  const gamePhase = totalMoves / boardArea < 0.25 ? 'Opening (Fuseki)' : (totalMoves / boardArea < 0.75 ? 'Mid-game (Chuban)' : 'End-game (Yose)');

  const prompt = `
${getDifficultyInstruction(difficulty)}

You are an expert Go (Weiqi) player AI, playing as White ('W'). Your goal is to win.

**PRIMARY DIRECTIVE: YOU MUST MAKE A MOVE. DO NOT PASS.**
Passing is an absolute last resort, only to be used in the final turns of the game when no territory is left to claim. Passing early or in the middle of the game is a losing strategy and is forbidden. For this turn, find the best possible move on an empty intersection.

**GAME CONTEXT:**
- Board Size: ${board.length}x${board.length}
- Your Color: White ('W')
- Opponent's Color: Black ('B')
- Current Phase: ${gamePhase}
- Total Moves So Far: ${totalMoves}

**CRITICAL RULES FOR A VALID MOVE:**
Your move MUST strictly adhere to these rules.
1.  **Empty Point:** Place your stone on an empty intersection ('.'). Do NOT choose a coordinate occupied by 'B' or 'W'.
2.  **Suicide Rule:** A move is illegal if it places a stone where its group has no liberties, unless this move captures opponent stones.
3.  **Ko Rule:** You cannot make a move that reverts the board to its exact state from the opponent's previous turn.

**Current Board State:**
(B = Black, W = White, . = Empty)
${boardString}

**Previous Board State (for Ko rule check):**
${lastBoardStateString}

**STRATEGIC GUIDANCE:**
- **If Phase is Opening (Fuseki):** Focus on establishing territory and influence. Prioritize moves on the 3rd or 4th lines from the edge. Secure corners first, then sides. Create a balanced position.
- **If Phase is Mid-game (Chuban):** Focus on attacking weak groups, defending your own, reducing the opponent's territory, and invading.
- **If Phase is End-game (Yose):** Focus on solidifying territory boundaries and capturing any remaining neutral points.

**YOUR TASK & RESPONSE FORMAT:**
Analyze the board and choose the best possible valid move for White ('W'). Your response must be in JSON format.
- **You are required to make a move.** Respond with \`{"action": "MOVE", "move": {"row": <number>, "col": <number>}}\`.
- **Passing is forbidden unless it is the absolute end of the game.** If and only if there are no valid or beneficial moves left anywhere on the board, you may respond with \`{"action": "PASS"}\`. Given the current board state, you are expected to find a move.
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-flash-latest',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: "Either 'MOVE' or 'PASS'.",
            },
            move: {
              type: Type.OBJECT,
              description: "The coordinates for the move, only if action is 'MOVE'.",
              properties: {
                row: { type: Type.INTEGER },
                col: { type: Type.INTEGER },
              },
            },
          },
          required: ['action'],
        },
      },
    });

    const jsonText = response.text.trim();
    const result = JSON.parse(jsonText);
    
    if (result.action === 'PASS') {
      return 'pass';
    }

    if (result.action === 'MOVE' && result.move && typeof result.move.row === 'number' && typeof result.move.col === 'number') {
      const { row, col } = result.move;
      // Final validation: ensure move is within bounds and on an empty spot
      if (row >= 0 && row < board.length && col >= 0 && col < board.length) {
          if (board[row][col] === null) {
            return result.move;
          } else {
            console.error("AI violated rules by suggesting an occupied spot:", result.move);
            return 'pass'; // Fallback to passing if spot is occupied
          }
      }
    }
    
    console.error("AI response was malformed or suggested an out-of-bounds move:", result);
    return 'pass'; // Fallback to passing

  } catch (error) {
    console.error("Error getting AI move from Gemini:", error);
    return 'pass'; // Fallback if API fails
  }
};