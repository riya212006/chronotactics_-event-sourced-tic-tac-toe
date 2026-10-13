import React, { useState } from 'react';
import {
  Bot,
  Users,
  KeyRound,
  ArrowRight,
  Sparkles,
  Zap,
  Cpu,
  Brain,
  History,
  Shield,
  CheckCircle2,
} from 'lucide-react';
import { AiDifficulty, GameMode, PlayerSymbol } from '../types/game';

interface LobbyProps {
  onStartAiGame: (difficulty: AiDifficulty, symbol: PlayerSymbol) => void;
  onCreatePvpGame: () => void;
  onJoinGameCode: (code: string) => void;
  isJoining: boolean;
  isCreating: boolean;
  joinError: string | null;
}

export const Lobby: React.FC<LobbyProps> = ({
  onStartAiGame,
  onCreatePvpGame,
  onJoinGameCode,
  isJoining,
  isCreating,
  joinError,
}) => {
  const [activeTab, setActiveTab] = useState<'ai' | 'pvp'>('ai');
  const [aiDifficulty, setAiDifficulty] = useState<AiDifficulty>('hard');
  const [playerSymbol, setPlayerSymbol] = useState<PlayerSymbol>('X');
  const [inputCode, setInputCode] = useState('');

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputCode.trim().length >= 4) {
      onJoinGameCode(inputCode.trim());
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6 px-4">
      {/* Hero section */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
          <Zap className="w-3.5 h-3.5 text-indigo-400" />
          <span>Real-time Firebase Event Sourcing</span>
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white">
          Tactical Tic-Tac-Toe{' '}
          <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
            Reconstructed
          </span>
        </h1>
        <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
          Play against a recursive Minimax AI or challenge friends online. Every turn is an immutable Firestore event, enabling real-time replay and interactive time-travel rewind.
        </p>
      </div>

      {/* Main card */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
        {/* Play Setup Column */}
        <div className="md:col-span-7 bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-2xl backdrop-blur-md space-y-6">
          {/* Tab selector */}
          <div className="grid grid-cols-2 p-1 bg-slate-950 rounded-2xl border border-slate-800">
            <button
              onClick={() => setActiveTab('ai')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'ai'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Bot className="w-4 h-4" />
              <span>Play vs AI</span>
            </button>
            <button
              onClick={() => setActiveTab('pvp')}
              className={`flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition ${
                activeTab === 'pvp'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Multiplayer (PvP)</span>
            </button>
          </div>

          {/* AI Mode Settings */}
          {activeTab === 'ai' && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Difficulty selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Minimax AI Difficulty
                </label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'easy', label: 'Easy', desc: 'Casual moves', color: 'emerald' },
                    { id: 'medium', label: 'Medium', desc: 'Tactical block', color: 'amber' },
                    { id: 'hard', label: 'Hard', desc: 'Unbeatable Minimax', color: 'purple' },
                  ].map((lvl) => (
                    <button
                      key={lvl.id}
                      type="button"
                      onClick={() => setAiDifficulty(lvl.id as AiDifficulty)}
                      className={`
                        p-3 rounded-2xl border text-left transition flex flex-col justify-between
                        ${
                          aiDifficulty === lvl.id
                            ? 'border-indigo-500 bg-indigo-500/10 shadow-lg shadow-indigo-500/10'
                            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 text-slate-400'
                        }
                      `}
                    >
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{lvl.label}</span>
                        {aiDifficulty === lvl.id && (
                          <span className="w-2 h-2 rounded-full bg-indigo-400" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 mt-1">
                        {lvl.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Symbol selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2.5">
                  Play As
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPlayerSymbol('X')}
                    className={`
                      p-3 rounded-2xl border text-left flex items-center gap-3 transition
                      ${
                        playerSymbol === 'X'
                          ? 'border-cyan-500/60 bg-cyan-500/10 text-cyan-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }
                    `}
                  >
                    <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center font-black text-sm">
                      X
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Player X</div>
                      <div className="text-[10px] text-slate-400">Moves first</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPlayerSymbol('O')}
                    className={`
                      p-3 rounded-2xl border text-left flex items-center gap-3 transition
                      ${
                        playerSymbol === 'O'
                          ? 'border-rose-500/60 bg-rose-500/10 text-rose-300 shadow-sm'
                          : 'border-slate-800 bg-slate-950/60 text-slate-400 hover:border-slate-700'
                      }
                    `}
                  >
                    <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center font-black text-sm">
                      O
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Player O</div>
                      <div className="text-[10px] text-slate-400">AI moves first</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Start AI Game Button */}
              <button
                onClick={() => onStartAiGame(aiDifficulty, playerSymbol)}
                disabled={isCreating}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 text-white font-bold text-sm shadow-lg shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center gap-2"
              >
                <Cpu className="w-4 h-4" />
                <span>{isCreating ? 'Initializing Match...' : 'Start Match vs AI'}</span>
              </button>
            </div>
          )}

          {/* PvP Mode Settings */}
          {activeTab === 'pvp' && (
            <div className="space-y-6 animate-in fade-in duration-200">
              {/* Option 1: Host a game */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-[10px]">
                    1
                  </span>
                  <span>Host a New Match</span>
                </div>
                <p className="text-xs text-slate-400">
                  Generate a unique 6-digit game code or direct share link to invite an opponent.
                </p>
                <button
                  onClick={onCreatePvpGame}
                  disabled={isCreating}
                  className="w-full py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>{isCreating ? 'Creating Room...' : 'Create Room & Get Code'}</span>
                </button>
              </div>

              {/* Option 2: Join a game with code */}
              <div className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-white">
                  <span className="w-5 h-5 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center text-[10px]">
                    2
                  </span>
                  <span>Join with Game Code</span>
                </div>
                <p className="text-xs text-slate-400">
                  Enter the 6-character room code sent by your friend.
                </p>

                <form onSubmit={handleJoinSubmit} className="space-y-2">
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input
                        type="text"
                        value={inputCode}
                        onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                        placeholder="e.g. X9K2PW"
                        maxLength={10}
                        className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-slate-500 text-xs font-mono uppercase tracking-widest focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={isJoining || inputCode.trim().length < 4}
                      className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white text-xs font-semibold transition flex items-center gap-1.5"
                    >
                      <span>{isJoining ? 'Joining...' : 'Join'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  {joinError && (
                    <div className="text-xs text-rose-400 font-medium">
                      {joinError}
                    </div>
                  )}
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Feature Highlights & Explanation Column */}
        <div className="md:col-span-5 space-y-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Event Sourcing Architecture</h3>
                <p className="text-xs text-slate-400">Pure state replay from genesis</p>
              </div>
            </div>

            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Immutable Turns:</strong> Every move is recorded as an independent document in the <code>events</code> subcollection.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Deterministic Reconstruction:</strong> Board state is recalculated by folding the chronological event stream.
                </span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>Interactive Time Travel:</strong> Scrub through prior turns and opt to restore/roll back the game at any moment.
                </span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-5 space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                <Brain className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Pure Minimax Opponent</h3>
                <p className="text-xs text-slate-400">Zero LLM or external API dependencies</p>
              </div>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The AI calculates moves using classic tree search algorithms with terminal depth scoring. Hard difficulty delivers mathematically unbeatable defense and offensive traps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
