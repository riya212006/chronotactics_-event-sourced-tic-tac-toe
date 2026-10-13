import { GameEventDoc, PlayerSymbol, ReconstructedState, TurnSnapshot, GameWinner } from '../types/game';
import { checkWinner } from './gameLogic';

export function getCellLabel(index: number): string {
  const row = Math.floor(index / 3) + 1;
  const col = (index % 3) + 1;
  const colLetter = ['A', 'B', 'C'][col - 1];
  return `${colLetter}${row} (Pos ${index + 1})`;
}

/**
 * Event-sourcing state reducer.
 * Takes the raw sequential stream of event documents from the subcollection
 * and deterministically reconstructs the full game board state, turn status,
 * and complete turn-by-turn history timeline.
 */
export function reconstructGameState(events: GameEventDoc[]): ReconstructedState {
  let board: (PlayerSymbol | null)[] = Array(9).fill(null);
  let currentTurn: PlayerSymbol = 'X';
  let winner: GameWinner = null;
  let winningLine: number[] | null = null;
  let turnNumber = 0;

  const history: TurnSnapshot[] = [
    {
      turnNumber: 0,
      eventIndex: -1,
      board: [...board],
      lastMove: null,
      currentTurn: 'X',
      winner: null,
      winningLine: null,
      summary: 'Game started (Empty Board)',
    },
  ];

  // Ensure events are processed in strict chronological eventIndex order
  const sortedEvents = [...events].sort((a, b) => a.eventIndex - b.eventIndex);

  for (const event of sortedEvents) {
    if (event.type === 'MOVE') {
      if (
        event.cellIndex !== undefined &&
        event.cellIndex >= 0 &&
        event.cellIndex < 9 &&
        event.player &&
        event.player !== 'none'
      ) {
        turnNumber++;
        board[event.cellIndex] = event.player as PlayerSymbol;

        const result = checkWinner(board);
        winner = result.winner;
        winningLine = result.winningLine;
        currentTurn = event.player === 'X' ? 'O' : 'X';

        history.push({
          turnNumber,
          eventIndex: event.eventIndex,
          board: [...board],
          lastMove: {
            cellIndex: event.cellIndex,
            player: event.player as PlayerSymbol,
          },
          currentTurn,
          winner,
          winningLine,
          summary: `Turn ${turnNumber}: ${event.player} marked ${getCellLabel(event.cellIndex)}`,
        });
      }
    } else if (event.type === 'ROLLBACK') {
      const targetTurn = event.targetTurn ?? 0;
      // Look up target turn in history prior to this rollback
      const targetSnapshot = history
        .slice()
        .reverse()
        .find((s) => s.turnNumber === targetTurn && s.eventIndex < event.eventIndex);

      if (targetSnapshot) {
        board = [...targetSnapshot.board];
        currentTurn = targetSnapshot.currentTurn;
        winner = targetSnapshot.winner;
        winningLine = targetSnapshot.winningLine;
        turnNumber = targetTurn;

        history.push({
          turnNumber,
          eventIndex: event.eventIndex,
          board: [...board],
          lastMove: targetSnapshot.lastMove,
          currentTurn,
          winner,
          winningLine,
          summary: `Time-Travel: Reverted game state back to Turn ${targetTurn}`,
        });
      }
    }
  }

  return {
    board,
    currentTurn,
    winner,
    winningLine,
    moveCount: turnNumber,
    isGameOver: winner !== null,
    history,
  };
}
