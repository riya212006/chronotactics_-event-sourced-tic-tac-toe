import React, { useState, useEffect } from 'react';
import {
  RotateCcw,
  SkipBack,
  SkipForward,
  Play,
  Pause,
  ChevronLeft,
  ChevronRight,
  Database,
  ArrowRight,
  AlertTriangle,
  History,
  Info,
} from 'lucide-react';
import { GameEventDoc, TurnSnapshot } from '../types/game';
import { playRollbackSound } from '../utils/audio';

interface TimeTravelBarProps {
  history: TurnSnapshot[];
  rawEvents: GameEventDoc[];
  selectedTurnIndex: number;
  latestTurnIndex: number;
  onSelectTurnIndex: (index: number) => void;
  onConfirmRollback: (targetSnapshot: TurnSnapshot) => Promise<void>;
  isProcessingRollback: boolean;
  canRollback: boolean;
}

export const TimeTravelBar: React.FC<TimeTravelBarProps> = ({
  history,
  rawEvents,
  selectedTurnIndex,
  latestTurnIndex,
  onSelectTurnIndex,
  onConfirmRollback,
  isProcessingRollback,
  canRollback,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showEventLog, setShowEventLog] = useState(false);

  const isBrowsingHistory = selectedTurnIndex < latestTurnIndex;
  const currentSnapshot = history[selectedTurnIndex] || history[0];

  // Auto-play replay through turns
  useEffect(() => {
    let timer: any;
    if (isPlaying) {
      timer = setInterval(() => {
        if (selectedTurnIndex >= latestTurnIndex) {
          setIsPlaying(false);
        } else {
          onSelectTurnIndex(selectedTurnIndex + 1);
        }
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, selectedTurnIndex, latestTurnIndex, onSelectTurnIndex]);

  const handleStepFirst = () => {
    setIsPlaying(false);
    onSelectTurnIndex(0);
  };

  const handleStepPrev = () => {
    setIsPlaying(false);
    if (selectedTurnIndex > 0) {
      onSelectTurnIndex(selectedTurnIndex - 1);
    }
  };

  const handleStepNext = () => {
    setIsPlaying(false);
    if (selectedTurnIndex < latestTurnIndex) {
      onSelectTurnIndex(selectedTurnIndex + 1);
    }
  };

  const handleStepLatest = () => {
    setIsPlaying(false);
    onSelectTurnIndex(latestTurnIndex);
  };

  const handleDoRollback = async () => {
    playRollbackSound();
    setShowConfirmModal(false);
    await onConfirmRollback(currentSnapshot);
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-3">
      {/* Historical preview alert banner */}
      {isBrowsingHistory && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300">
              <History className="w-4 h-4 animate-spin-slow" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-200 flex items-center gap-1.5">
                <span>Time-Travel Inspection</span>
                <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[10px] text-amber-300 font-mono">
                  Turn {currentSnapshot.turnNumber} of {latestTurnIndex}
                </span>
              </div>
              <p className="text-[11px] text-amber-300/80">
                {currentSnapshot.summary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              onClick={handleStepLatest}
              className="text-xs px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-200 font-medium transition"
            >
              Resume Live
            </button>

            {canRollback && (
              <button
                onClick={() => setShowConfirmModal(true)}
                disabled={isProcessingRollback}
                className="text-xs px-3 py-1.5 rounded-lg bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold shadow-md shadow-amber-600/20 transition flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Roll Back Here</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main timeline controller card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-indigo-400" />
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Event Sourcing Timeline
            </span>
          </div>

          <button
            onClick={() => setShowEventLog(!showEventLog)}
            className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition"
          >
            <Database className="w-3.5 h-3.5" />
            <span>{showEventLog ? 'Hide Event Log' : `View Events (${rawEvents.length})`}</span>
          </button>
        </div>

        {/* Turn Scrubber Slider */}
        <div className="space-y-1.5 mb-3">
          <div className="flex justify-between text-[11px] text-slate-400 font-mono">
            <span>Start (Turn 0)</span>
            <span className="text-indigo-300 font-semibold">
              Selected: Turn {currentSnapshot.turnNumber}
            </span>
            <span>Latest (Turn {latestTurnIndex})</span>
          </div>
          <input
            type="range"
            min={0}
            max={latestTurnIndex}
            value={selectedTurnIndex}
            onChange={(e) => {
              setIsPlaying(false);
              onSelectTurnIndex(Number(e.target.value));
            }}
            disabled={latestTurnIndex === 0}
            className="w-full accent-indigo-500 bg-slate-950 h-2 rounded-lg cursor-pointer"
          />
        </div>

        {/* Playback Controls & Turn Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800">
          {/* Stepper Controls */}
          <div className="flex items-center gap-1">
            <button
              onClick={handleStepFirst}
              disabled={selectedTurnIndex === 0}
              title="First Turn"
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <SkipBack className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={handleStepPrev}
              disabled={selectedTurnIndex === 0}
              title="Previous Turn"
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              disabled={latestTurnIndex === 0}
              title={isPlaying ? 'Pause Replay' : 'Play Replay'}
              className="p-1.5 rounded-lg border border-indigo-500/40 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30 transition"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={handleStepNext}
              disabled={selectedTurnIndex >= latestTurnIndex}
              title="Next Turn"
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleStepLatest}
              disabled={selectedTurnIndex >= latestTurnIndex}
              title="Latest Turn"
              className="p-1.5 rounded-lg border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-slate-200 disabled:opacity-40 disabled:pointer-events-none transition"
            >
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Turn selector mini pills */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[280px] py-1 scrollbar-none">
            {history.map((snap, i) => (
              <button
                key={i}
                onClick={() => {
                  setIsPlaying(false);
                  onSelectTurnIndex(i);
                }}
                className={`
                  text-[10px] font-mono px-2 py-0.5 rounded-md transition-all shrink-0
                  ${
                    selectedTurnIndex === i
                      ? 'bg-indigo-500 text-white font-bold shadow-sm shadow-indigo-500/50 scale-105'
                      : 'bg-slate-950/80 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                  }
                `}
              >
                T{snap.turnNumber}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Raw Event Stream Inspector */}
      {showEventLog && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Database className="w-4 h-4 text-purple-400" />
              <span>Firestore Event Stream (Subcollection Log)</span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              games/[gameId]/events
            </span>
          </div>

          <p className="text-[11px] text-slate-400 leading-relaxed">
            Every move and rollback is saved as an immutable event document. State is
            reconstructed by deterministically replaying these events from Turn 0.
          </p>

          <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 font-mono text-[11px]">
            {rawEvents.length === 0 ? (
              <div className="text-slate-500 py-3 text-center italic">
                No events recorded yet. Match is starting.
              </div>
            ) : (
              rawEvents.map((evt, idx) => (
                <div
                  key={evt.id || idx}
                  className={`p-2 rounded-lg border text-left flex items-center justify-between ${
                    evt.type === 'ROLLBACK'
                      ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                      #{evt.eventIndex}
                    </span>
                    <span className={`font-bold ${evt.type === 'ROLLBACK' ? 'text-amber-400' : 'text-indigo-400'}`}>
                      {evt.type}
                    </span>
                    {evt.type === 'MOVE' ? (
                      <span>
                        Player: <strong>{evt.player}</strong> | Cell: <strong>{evt.cellIndex}</strong>
                      </span>
                    ) : (
                      <span>
                        Reverted to Turn: <strong>{evt.targetTurn}</strong>
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-500 truncate max-w-[90px]">
                    {evt.id}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Confirmation Modal for Rollback */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-slate-900 border border-slate-700 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto">
              <RotateCcw className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-white">
                Restore to Turn {currentSnapshot.turnNumber}?
              </h3>
              <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                This will append a <code>ROLLBACK</code> event to the Firestore event log,
                reverting the live board back to the state at Turn {currentSnapshot.turnNumber}.
                Both players will continue from this point.
              </p>
            </div>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-left text-xs text-slate-300 font-mono space-y-1">
              <div>Next Turn: <strong>Player {currentSnapshot.currentTurn}</strong></div>
              <div>Turn Summary: <strong>{currentSnapshot.summary}</strong></div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleDoRollback}
                disabled={isProcessingRollback}
                className="flex-1 px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md shadow-amber-600/30 transition"
              >
                {isProcessingRollback ? 'Rolling back...' : 'Confirm Rollback'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
