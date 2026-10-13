import React from 'react';
import { PlayerSymbol } from '../types/game';

interface BoardProps {
  board: (PlayerSymbol | null)[];
  winningLine: number[] | null;
  lastMoveIndex: number | null;
  currentTurn: PlayerSymbol;
  canMakeMove: boolean;
  isPreviewingHistory: boolean;
  onCellClick: (index: number) => void;
}

export const Board: React.FC<BoardProps> = ({
  board,
  winningLine,
  lastMoveIndex,
  currentTurn,
  canMakeMove,
  isPreviewingHistory,
  onCellClick,
}) => {
  return (
    <div className="relative">
      {/* Board Container */}
      <div className="relative bg-slate-900/80 p-4 sm:p-6 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md max-w-[420px] mx-auto">
        {/* Subtle decorative glow behind the board */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl blur-xl -z-10 pointer-events-none" />

        {/* 3x3 Grid */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3.5 aspect-square">
          {board.map((cellValue, idx) => {
            const isWinningCell = winningLine?.includes(idx);
            const isLastMove = lastMoveIndex === idx;
            const isEmpty = cellValue === null;
            const isClickable = isEmpty && canMakeMove && !isPreviewingHistory;

            return (
              <button
                key={idx}
                onClick={() => isClickable && onCellClick(idx)}
                disabled={!isClickable}
                aria-label={`Cell ${idx + 1}: ${cellValue || 'Empty'}`}
                className={`
                  relative group flex items-center justify-center rounded-2xl transition-all duration-200 aspect-square
                  ${
                    isEmpty
                      ? isClickable
                        ? 'bg-slate-950/70 hover:bg-slate-800/80 border border-slate-800/90 hover:border-indigo-500/60 cursor-pointer shadow-inner active:scale-95'
                        : 'bg-slate-950/40 border border-slate-850 cursor-not-allowed opacity-80'
                      : 'bg-slate-950/90 border border-slate-700/80 shadow-md'
                  }
                  ${
                    isWinningCell
                      ? 'border-amber-400 bg-amber-500/15 shadow-lg shadow-amber-500/25 ring-2 ring-amber-400/50 scale-[1.03] z-10'
                      : ''
                  }
                  ${
                    isLastMove && !isWinningCell
                      ? 'border-indigo-500/60 ring-1 ring-indigo-500/30'
                      : ''
                  }
                `}
              >
                {/* Last move beacon indicator */}
                {isLastMove && (
                  <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400 animate-ping pointer-events-none" />
                )}

                {/* Placed Value Marker */}
                {cellValue === 'X' && (
                  <svg
                    viewBox="0 0 100 100"
                    className="w-12 h-12 sm:w-16 sm:h-16 text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transform animate-in zoom-in-50 duration-200"
                  >
                    <line
                      x1="22"
                      y1="22"
                      x2="78"
                      y2="78"
                      stroke="currentColor"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                    <line
                      x1="78"
                      y1="22"
                      x2="22"
                      y2="78"
                      stroke="currentColor"
                      strokeWidth="14"
                      strokeLinecap="round"
                    />
                  </svg>
                )}

                {cellValue === 'O' && (
                  <svg
                    viewBox="0 0 100 100"
                    className="w-12 h-12 sm:w-16 sm:h-16 text-rose-400 drop-shadow-[0_0_12px_rgba(251,113,133,0.5)] transform animate-in zoom-in-50 duration-200"
                  >
                    <circle
                      cx="50"
                      cy="50"
                      r="30"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="13"
                    />
                  </svg>
                )}

                {/* Hover ghost preview for active player */}
                {isEmpty && isClickable && (
                  <div className="opacity-0 group-hover:opacity-25 transition-opacity pointer-events-none">
                    {currentTurn === 'X' ? (
                      <svg viewBox="0 0 100 100" className="w-10 h-10 text-cyan-400">
                        <line x1="25" y1="25" x2="75" y2="75" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                        <line x1="75" y1="25" x2="25" y2="75" stroke="currentColor" strokeWidth="12" strokeLinecap="round" />
                      </svg>
                    ) : (
                      <svg viewBox="0 0 100 100" className="w-10 h-10 text-rose-400">
                        <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="11" />
                      </svg>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
