import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Frown, Equal, RotateCcw, Home, Eye } from 'lucide-react';
import { GameWinner, PlayerSymbol } from '../types/game';
import { playWinSound, playDrawSound } from '../utils/audio';

interface GameOverModalProps {
  winner: GameWinner;
  userSymbol: PlayerSymbol | null;
  onPlayAgain: () => void;
  onInspectHistory: () => void;
  onExitLobby: () => void;
  isAiGame: boolean;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  winner,
  userSymbol,
  onPlayAgain,
  onInspectHistory,
  onExitLobby,
  isAiGame,
}) => {
  const isDraw = winner === 'draw';
  const isUserWinner = userSymbol && winner === userSymbol;
  const isUserLoser = userSymbol && winner && !isDraw && winner !== userSymbol;

  useEffect(() => {
    if (isUserWinner || (winner && !isDraw && !userSymbol)) {
      playWinSound();
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#6366f1', '#a855f7', '#ec4899', '#22d3ee', '#f59e0b'],
        });
      } catch {
        // Confetti fallback
      }
    } else if (isDraw) {
      playDrawSound();
    }
  }, [winner, isUserWinner, isDraw, userSymbol]);

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl p-6 sm:p-8 max-w-sm w-full text-center space-y-5 shadow-2xl relative overflow-hidden">
        {/* Decorative backdrop glow */}
        <div className="absolute -inset-10 bg-gradient-to-tr from-indigo-500/10 via-purple-500/10 to-pink-500/10 blur-2xl pointer-events-none" />

        {/* Icon banner */}
        <div className="relative">
          {isUserWinner ? (
            <div className="w-16 h-16 rounded-3xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20 animate-bounce">
              <Trophy className="w-8 h-8" />
            </div>
          ) : isDraw ? (
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-300 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/20">
              <Equal className="w-8 h-8" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-3xl bg-rose-500/20 border border-rose-500/40 text-rose-300 flex items-center justify-center mx-auto shadow-lg shadow-rose-500/20">
              {isAiGame ? <Frown className="w-8 h-8" /> : <Trophy className="w-8 h-8" />}
            </div>
          )}
        </div>

        {/* Text Heading */}
        <div className="space-y-1.5 relative">
          <h2 className="text-2xl font-black text-white">
            {isDraw
              ? 'Tactical Stalemate!'
              : isUserWinner
              ? 'Victory Achieved!'
              : isUserLoser
              ? isAiGame
                ? 'Minimax AI Prevails!'
                : `Player ${winner} Won!`
              : `Player ${winner} Takes the Match!`}
          </h2>
          <p className="text-xs text-slate-400">
            {isDraw
              ? 'Both players played balanced defense. No winning lines remain.'
              : isUserWinner
              ? 'All winning lines secured! Excellent tactical precision.'
              : 'The match has concluded with an event-sourced audit log.'}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-2.5 pt-2 relative">
          <button
            onClick={onPlayAgain}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Play Rematch / New Game</span>
          </button>

          <button
            onClick={onInspectHistory}
            className="w-full py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition flex items-center justify-center gap-2"
          >
            <Eye className="w-4 h-4 text-indigo-400" />
            <span>Inspect Turns & Time-Travel</span>
          </button>

          <button
            onClick={onExitLobby}
            className="w-full py-2 text-xs text-slate-400 hover:text-slate-200 transition flex items-center justify-center gap-1.5"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Exit to Main Lobby</span>
          </button>
        </div>
      </div>
    </div>
  );
};
