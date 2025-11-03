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
You are playing Go as White ('W') on a ${board.length}x${board.length} board.
Your task is to choose your next move. Respond in JSON.

Current board state ('B' is black, 'W' is white, '.' is empty):
${boardString}

Previous board state (for the Ko rule):
${lastBoardStateString}

Your action must be either 'MOVE' to a {row, col} or 'PASS'.
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
      // Basic validation
      if (result.move.row >= 0 && result.move.row < board.length && result.move.col >= 0 && result.move.col < board.length) {
          return result.move;
      }
    }
    
    console.error("AI response was malformed or suggested an invalid move:", result);
    return 'pass'; // Fallback to passing

  } catch (error) {
    console.error("Error getting AI move from Gemini:", error);
    return 'pass'; // Fallback if API fails
  }
};