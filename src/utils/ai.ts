import { PlayerSymbol, AiDifficulty } from '../types/game';
import { checkWinner, getAvailableMoves } from './gameLogic';

interface MinimaxResult {
  score: number;
  bestMove: number;
}

/**
 * Minimax evaluation function for Tic-Tac-Toe
 * Maximizes AI's score (+10 - depth), minimizes human player's score (-10 + depth)
 */
function minimax(
  board: (PlayerSymbol | null)[],
  depth: number,
  isMaximizing: boolean,
  aiPlayer: PlayerSymbol,
  humanPlayer: PlayerSymbol
): MinimaxResult {
  const { winner } = checkWinner(board);
  if (winner === aiPlayer) {
    return { score: 10 - depth, bestMove: -1 };
  }
  if (winner === humanPlayer) {
    return { score: depth - 10, bestMove: -1 };
  }
  if (winner === 'draw') {
    return { score: 0, bestMove: -1 };
  }

  const availableMoves = getAvailableMoves(board);
  if (availableMoves.length === 0) {
    return { score: 0, bestMove: -1 };
  }

  if (isMaximizing) {
    let maxScore = -Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      board[move] = aiPlayer;
      const result = minimax(board, depth + 1, false, aiPlayer, humanPlayer);
      board[move] = null;

      if (result.score > maxScore) {
        maxScore = result.score;
        bestMove = move;
      }
    }
    return { score: maxScore, bestMove };
  } else {
    let minScore = Infinity;
    let bestMove = availableMoves[0];

    for (const move of availableMoves) {
      board[move] = humanPlayer;
      const result = minimax(board, depth + 1, true, aiPlayer, humanPlayer);
      board[move] = null;

      if (result.score < minScore) {
        minScore = result.score;
        bestMove = move;
      }
    }
    return { score: minScore, bestMove };
  }
}

/**
 * Returns the best move index (0-8) according to the selected difficulty
 */
export function getAiMove(
  board: (PlayerSymbol | null)[],
  aiPlayer: PlayerSymbol,
  difficulty: AiDifficulty = 'hard'
): number {
  const humanPlayer: PlayerSymbol = aiPlayer === 'X' ? 'O' : 'X';
  const availableMoves = getAvailableMoves(board);

  if (availableMoves.length === 0) {
    return -1;
  }

  // 1. Easy: Mostly random, 20% tactical
  if (difficulty === 'easy') {
    // If center is free, 30% take it, otherwise pick random
    const randomIndex = Math.floor(Math.random() * availableMoves.length);
    return availableMoves[randomIndex];
  }

  // 2. Medium: Heuristic check for instant win or instant block, then 50% minimax or random
  if (difficulty === 'medium') {
    // Check if AI can win immediately
    for (const move of availableMoves) {
      board[move] = aiPlayer;
      const { winner } = checkWinner(board);
      board[move] = null;
      if (winner === aiPlayer) return move;
    }

    // Check if human can win immediately, and block them
    for (const move of availableMoves) {
      board[move] = humanPlayer;
      const { winner } = checkWinner(board);
      board[move] = null;
      if (winner === humanPlayer) return move;
    }

    // 50% minimax, 50% random
    if (Math.random() < 0.5) {
      const { bestMove } = minimax(board, 0, true, aiPlayer, humanPlayer);
      return bestMove;
    } else {
      return availableMoves[Math.floor(Math.random() * availableMoves.length)];
    }
  }

  // 3. Hard: Perfect Unbeatable Minimax
  const { bestMove } = minimax(board, 0, true, aiPlayer, humanPlayer);
  return bestMove;
}
