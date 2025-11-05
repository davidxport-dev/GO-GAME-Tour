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

You are an expert Go (Weiqi) player AI. Your color is White ('W'). Your goal is to win.

**PRIMARY DIRECTIVE:** You MUST select a valid, legal move. Your response must be in the specified JSON format.

**GAME CONTEXT:**
- Board Size: ${board.length}x${board.length}
- Your Color: White ('W')
- Opponent's Color: Black ('B')
- Current Game Phase: ${gamePhase}
- Total Moves So Far: ${totalMoves}

**CURRENT BOARD STATE:**
(B = Black, W = White, . = Empty)
${boardString}

**PREVIOUS BOARD STATE (for Ko rule check):**
${lastBoardStateString}

**YOUR THOUGHT PROCESS:**
1.  **Analyze the board:** Assess the overall position, identify key groups, and evaluate territory.
2.  **Generate Candidate Moves:** Identify all empty intersections as potential moves.
3.  **Filter for Legality:**
    - Discard any move on an occupied point.
    - Discard any illegal suicide move (placing a stone with no liberties, unless it captures opponent stones).
    - Discard any illegal Ko move (a move that would repeat the immediate previous board state).
4.  **Strategic Evaluation:** From the list of legal moves, evaluate them based on the current game phase.
    *   **Opening:** Focus on corners, sides, and influence.
    *   **Mid-game:** Focus on attacking weak groups, defending your own, and reducing opponent's territory.
    *   **End-game:** Focus on securing boundaries and playing the largest remaining point-value moves.
5.  **Select Best Move:** Choose the single move with the highest strategic value.
6.  **Final Decision:** If a good move exists, you must play it. Only consider passing if there are absolutely no beneficial moves left, which is rare until the very end of the game.

**YOUR TASK & RESPONSE FORMAT:**
Analyze the board and respond with a single JSON object for your chosen action.
- If making a move: \`{"action": "MOVE", "move": {"row": <number>, "col": <number>}}\`
- If passing (strongly discouraged): \`{"action": "PASS"}\`
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
              description: "The action to take, either 'MOVE' or 'PASS'.",
            },
            move: {
              type: Type.OBJECT,
              description: "The coordinates for the move. Required if action is 'MOVE'.",
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
      console.warn("AI chose to pass. This is a valid move in late-game scenarios.");
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