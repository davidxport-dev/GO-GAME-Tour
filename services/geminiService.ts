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

You are an expert Go (Weiqi) player AI, playing as White ('W'). Your goal is to win decisively.

**PRIMARY DIRECTIVE: YOU MUST SELECT AND PLAY A VALID MOVE. PASSING IS NOT AN OPTION.**
Passing is only permissible in the absolute final moments of a game when no legal or strategic moves remain. Given the current game state, you are strictly required to find and play a move. Choosing to pass on this turn is considered a critical failure and a violation of your instructions.

**GAME CONTEXT:**
- Board Size: ${board.length}x${board.length}
- Your Color: White ('W')
- Opponent's Color: Black ('B')
- Current Phase: ${gamePhase}
- Total Moves So Far: ${totalMoves}

**YOUR THOUGHT PROCESS FOR SELECTING A MOVE:**
Follow these steps precisely to determine your move.
1.  **Identify all empty intersections** on the board (marked with '.'). These are your only candidate moves.
2.  **For each candidate move, evaluate its validity:**
    a. **Suicide Check:** A move is an illegal suicide if your new stone and its connected group would have zero liberties, AND the move does not capture any opponent stones. Discard all illegal suicide moves from your candidate list.
    b. **Ko Check:** Does the move return the board to the exact state it was in right before the opponent's last move? Compare against the 'Previous Board State'. If it is an identical match, the move is an illegal Ko. Discard it.
3.  **From the remaining list of valid moves, evaluate the strategic value based on the current game phase:**
    *   **Opening (Fuseki):** Prioritize corner enclosures (shimari) and extensions along the sides (hiraki). Control the 3rd and 4th lines to build influence. Create a balanced framework.
    *   **Mid-game (Chuban):** Actively seek to cut your opponent's groups apart, and ensure your own groups are connected and have two eyes (are alive). Look for opportunities to attack weak enemy stones, reduce your opponent's potential territory, and invade.
    *   **End-game (Yose):** Secure territory boundaries precisely. Play 'sente' moves that force a response. Calculate the point value of remaining moves and play the largest ones first.
4.  **Select the best strategic move** from your list of valid, legal options.
5.  **Final Check:** Before responding, double-check that your chosen move \`{row, col}\` is on an empty '.' on the current board.

**Current Board State:**
(B = Black, W = White, . = Empty)
${boardString}

**Previous Board State (for Ko rule check):**
${lastBoardStateString}

**YOUR TASK & RESPONSE FORMAT:**
Analyze the board following the thought process above. You must respond with the coordinates of your chosen move in JSON format.
- **Your response MUST be:** \`{"action": "MOVE", "move": {"row": <number>, "col": <number>}}\`.
- **DO NOT respond with "PASS".** It is critical that you find and execute a valid move.
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
              description: "Either 'MOVE' or 'PASS'. You must choose 'MOVE'.",
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
      console.warn("AI chose to pass despite instructions. This may be a late-game scenario or a prompt adherence issue.");
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
