import React from 'react';
import { GameDoc, PlayerSymbol, GameWinner } from '../types/game';
import { Bot, User, Trophy, ShieldAlert, Cpu } from 'lucide-react';

interface MatchHeaderProps {
  game: GameDoc;
  currentTurn: PlayerSymbol;
  winner: GameWinner;
  isAiThinking: boolean;
  currentUserUid: string;
}

export const MatchHeader: React.FC<MatchHeaderProps> = ({
  game,
  currentTurn,
  winner,
  isAiThinking,
  currentUserUid,
}) => {
  const isXTurn = currentTurn === 'X' && !winner;
  const isOTurn = currentTurn === 'O' && !winner;

  const isUserX = game.playerX.uid === currentUserUid;
  const isUserO = game.playerO?.uid === currentUserUid;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="grid grid-cols-11 items-center gap-2 bg-slate-900/90 border border-slate-800 rounded-3xl p-3 sm:p-4 shadow-xl backdrop-blur-md">
        {/* Player X Card */}
        <div
          className={`col-span-5 rounded-2xl p-2.5 sm:p-3 transition-all ${
            isXTurn
              ? 'bg-cyan-500/10 border-2 border-cyan-500/50 shadow-md shadow-cyan-500/20 scale-[1.02]'
              : 'bg-slate-950/60 border border-slate-800/80 opacity-85'
          } ${winner === 'X' ? 'ring-2 ring-cyan-400 bg-cyan-500/20' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 flex items-center justify-center font-black text-base shrink-0 shadow-inner">
              X
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {game.playerX.displayName}
                </span>
                {isUserX && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    You
                  </span>
                )}
              </div>
              <div className="text-[10px] text-cyan-400 font-medium flex items-center gap-1">
                {winner === 'X' ? (
                  <span className="text-cyan-300 font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Winner
                  </span>
                ) : isXTurn ? (
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    Turn to move
                  </span>
                ) : (
                  <span className="text-slate-500">Waiting</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* VS / Status divider */}
        <div className="col-span-1 flex flex-col items-center justify-center">
          <div className="w-7 h-7 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-black text-slate-400 font-mono shadow-sm">
            VS
          </div>
        </div>

        {/* Player O Card */}
        <div
          className={`col-span-5 rounded-2xl p-2.5 sm:p-3 transition-all ${
            isOTurn
              ? 'bg-rose-500/10 border-2 border-rose-500/50 shadow-md shadow-rose-500/20 scale-[1.02]'
              : 'bg-slate-950/60 border border-slate-800/80 opacity-85'
          } ${winner === 'O' ? 'ring-2 ring-rose-400 bg-rose-500/20' : ''}`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center font-black text-base shrink-0 shadow-inner">
              O
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-bold text-white truncate">
                  {game.playerO ? game.playerO.displayName : 'Waiting...'}
                </span>
                {isUserO && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-indigo-500/20 text-indigo-300">
                    You
                  </span>
                )}
                {game.mode === 'ai' && (
                  <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-purple-500/20 text-purple-300">
                    AI
                  </span>
                )}
              </div>
              <div className="text-[10px] text-rose-400 font-medium flex items-center gap-1">
                {winner === 'O' ? (
                  <span className="text-rose-300 font-bold flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Winner
                  </span>
                ) : isOTurn ? (
                  isAiThinking ? (
                    <span className="flex items-center gap-1 text-purple-400 animate-pulse">
                      <Cpu className="w-3 h-3 animate-spin" />
                      Computing minimax...
                    </span>
                  ) : (
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
                      Turn to move
                    </span>
                  )
                ) : (
                  <span className="text-slate-500">Waiting</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
