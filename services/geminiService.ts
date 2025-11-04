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

  const prompt = `
${getDifficultyInstruction(difficulty)}

You are an expert Go (Weiqi) player AI. Your goal is to win by having a higher score (territory + captured stones) than your opponent. You are playing as White ('W').

**CRITICAL RULES FOR A VALID MOVE:**
Your move MUST strictly adhere to these rules. Failure to do so will result in an invalid move and a forfeited turn.
1.  **Empty Point:** You MUST place your stone on an empty intersection, marked with '.'. Do NOT choose a coordinate occupied by 'B' or 'W'.
2.  **Suicide Rule:** A move is illegal if it is a "suicide". This means placing a stone in a spot where it (and its connected group) has zero liberties, UNLESS this move simultaneously captures one or more of the opponent's stones. If a move results in your own group having no liberties, it is only valid if it also removes the last liberty from an opponent's group.
3.  **Ko Rule:** You CANNOT make a move that reverts the board to the state it was in right before your opponent's last move. This prevents infinite loops. Compare the potential new board state with the provided "Previous Board State". They cannot be identical.

**GAME CONTEXT:**
- Board Size: ${board.length}x${board.length}
- Your Color: White ('W')
- Opponent's Color: Black ('B')

**Current Board State:**
(B = Black, W = White, . = Empty)
${boardString}

**Previous Board State (for Ko rule check):**
${lastBoardStateString}

**YOUR TASK:**
Analyze the board and choose the best possible valid move for White ('W').
Think strategically. Consider territory, influence, cutting and connecting, and the life and death of groups.

**RESPONSE FORMAT:**
Provide your decision in JSON format.
- If you have a valid, strategic move, respond with \`{"action": "MOVE", "move": {"row": <number>, "col": <number>}}\`.
- Only if there are NO beneficial or legal moves available, respond with \`{"action": "PASS"}\`. Passing should be a last resort. Do not pass if there are still good moves to make.

Your move MUST be on an empty spot. Double-check your chosen coordinates against the current board state.
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