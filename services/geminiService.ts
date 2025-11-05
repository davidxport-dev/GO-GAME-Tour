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

  // Refined prompt for clarity, conciseness, and better guidance.
  const prompt = `
${getDifficultyInstruction(difficulty)}

You are an expert Go (Weiqi) player AI. Your task is to analyze the provided game state and select the best possible **legal** move for the White player ('W').

---

### Game Context
- **Board Size:** ${board.length}x${board.length}
- **Your Color:** White ('W')
- **Game Phase:** ${gamePhase}
- **Total Moves:** ${totalMoves}

---

### Current Board State
*B = Black, W = White, . = Empty*
\`\`\`
${boardString}
\`\`\`

---

### Previous Board State (for Ko rule check)
\`\`\`
${lastBoardStateString}
\`\`\`

---

### Your Task
1.  **Analyze the board** to identify strategic opportunities.
2.  **Select a single, legal move** that maximizes your advantage. A legal move must be on an empty intersection and must not be a suicide or violate the Ko rule.
3.  **Passing your turn is strongly discouraged.** Only respond with 'PASS' if there are no other valid or beneficial moves available, which is typical only at the very end of the game.
4.  **Format your response** as a JSON object according to the provided schema.

---

### Response Format
Your response MUST be a JSON object with an \`action\` and, if moving, a \`move\` object.
- **Move:** \`{"action": "MOVE", "move": {"row": <number>, "col": <number>}}\`
- **Pass:** \`{"action": "PASS"}\`
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
              description: "The AI's chosen action. Must be 'MOVE' to place a stone or 'PASS' to skip the turn.",
            },
            move: {
              type: Type.OBJECT,
              description: "The {row, col} coordinates for the move. This field is required if the action is 'MOVE' and it must represent a legal move on an empty intersection.",
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
