import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { User } from 'firebase/auth';
import {
  auth,
  onAuthStateChanged,
  loginWithGoogle,
  logoutUser,
  testConnection,
} from './firebase';
import {
  GameDoc,
  GameEventDoc,
  PlayerSymbol,
  AiDifficulty,
  TurnSnapshot,
} from './types/game';
import {
  createGame,
  findGameByCode,
  getGameById,
  joinGame,
  recordMove,
  recordRollback,
  subscribeToGame,
  subscribeToGameEvents,
} from './services/gameService';
import { reconstructGameState } from './utils/reconstruct';
import { checkWinner } from './utils/gameLogic';
import { getAiMove } from './utils/ai';
import { playMoveSound } from './utils/audio';

import { Navbar } from './components/Navbar';
import { Lobby } from './components/Lobby';
import { Board } from './components/Board';
import { MatchHeader } from './components/MatchHeader';
import { TimeTravelBar } from './components/TimeTravelBar';
import { ShareBanner } from './components/ShareBanner';
import { GameOverModal } from './components/GameOverModal';
import {
  Loader2,
  AlertCircle,
  LogIn,
  RefreshCw,
  Sparkles,
  Bot,
  Users,
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [connectionTested, setConnectionTested] = useState(false);

  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active game state
  const [currentGame, setCurrentGame] = useState<GameDoc | null>(null);
  const [gameEvents, setGameEvents] = useState<GameEventDoc[]>([]);
  const [selectedTurnIndex, setSelectedTurnIndex] = useState<number>(0);

  // UI state
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const [isJoiningGame, setIsJoiningGame] = useState(false);
  const [isProcessingMove, setIsProcessingMove] = useState(false);
  const [isProcessingRollback, setIsProcessingRollback] = useState(false);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [showGameOverModal, setShowGameOverModal] = useState(false);
  const [pendingUrlCode, setPendingUrlCode] = useState<string | null>(null);

  // 1. Initialize Auth and validate Firestore connection
  useEffect(() => {
    testConnection().then(() => setConnectionTested(true));

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Read room code from URL parameters (e.g. ?game=ABCDEF)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const code = params.get('game') || params.get('join');
      if (code) {
        setPendingUrlCode(code.trim().toUpperCase());
      }
    }
  }, []);

  // 3. Reconstruct game state from discrete event stream
  const reconstructed = useMemo(() => {
    return reconstructGameState(gameEvents);
  }, [gameEvents]);

  // Keep selectedTurnIndex in sync with latest event unless user intentionally stepped back
  const latestTurnIndex = reconstructed.history.length - 1;

  useEffect(() => {
    // Whenever new events arrive, automatically follow latest turn
    setSelectedTurnIndex(latestTurnIndex);
  }, [latestTurnIndex]);

  // Determine which snapshot is being rendered on the board
  const displayedSnapshot: TurnSnapshot =
    reconstructed.history[selectedTurnIndex] || reconstructed.history[0];

  const isBrowsingHistory = selectedTurnIndex < latestTurnIndex;

  // Identify current user's role and symbol in the active game
  const userSymbol: PlayerSymbol | null = useMemo(() => {
    if (!currentUser || !currentGame) return null;
    if (currentGame.playerX.uid === currentUser.uid) return 'X';
    if (currentGame.playerO?.uid === currentUser.uid) return 'O';
    return null;
  }, [currentUser, currentGame]);

  // Can the current user make a move right now?
  const canMakeMove = useMemo(() => {
    if (!currentGame || !currentUser) return false;
    if (currentGame.status !== 'in_progress') return false;
    if (reconstructed.isGameOver) return false;
    if (isBrowsingHistory) return false;
    if (isProcessingMove || isAiThinking) return false;

    // Check whose turn it is
    return reconstructed.currentTurn === userSymbol;
  }, [
    currentGame,
    currentUser,
    reconstructed.isGameOver,
    reconstructed.currentTurn,
    isBrowsingHistory,
    isProcessingMove,
    isAiThinking,
    userSymbol,
  ]);

  // Check if Game Over modal should pop up
  useEffect(() => {
    if (reconstructed.isGameOver && currentGame?.status === 'finished') {
      setShowGameOverModal(true);
    } else {
      setShowGameOverModal(false);
    }
  }, [reconstructed.isGameOver, currentGame?.status]);

  // 4. Listen to Game Doc and Events Subcollection
  useEffect(() => {
    if (!currentGame?.id) return;

    const unsubGame = subscribeToGame(currentGame.id, (updatedGame) => {
      setCurrentGame(updatedGame);
    });

    const unsubEvents = subscribeToGameEvents(currentGame.id, (events) => {
      setGameEvents(events);
    });

    return () => {
      unsubGame();
      unsubEvents();
    };
  }, [currentGame?.id]);

  // 5. Automatic deep-link join once user is authenticated
  useEffect(() => {
    if (currentUser && pendingUrlCode && !currentGame && !isJoiningGame) {
      handleJoinByCode(pendingUrlCode);
      setPendingUrlCode(null);
    }
  }, [currentUser, pendingUrlCode, currentGame, isJoiningGame]);

  // 6. Handle AI Move Trigger
  useEffect(() => {
    if (!currentGame || currentGame.mode !== 'ai') return;
    if (currentGame.status !== 'in_progress') return;
    if (reconstructed.isGameOver) return;
    if (isBrowsingHistory) return;
    if (isAiThinking || isProcessingMove) return;

    // Identify AI symbol
    const aiSymbol: PlayerSymbol = currentGame.playerX.uid === 'ai-opponent' ? 'X' : 'O';

    if (reconstructed.currentTurn === aiSymbol) {
      setIsAiThinking(true);

      const delay = Math.floor(Math.random() * 300) + 400; // 400-700ms realistic thinking pause
      const timer = setTimeout(async () => {
        try {
          const aiMoveCell = getAiMove(
            [...reconstructed.board],
            aiSymbol,
            (currentGame.aiDifficulty as AiDifficulty) || 'hard'
          );

          if (aiMoveCell >= 0) {
            playMoveSound(aiSymbol);
            const simulatedBoard = [...reconstructed.board];
            simulatedBoard[aiMoveCell] = aiSymbol;
            const outcome = checkWinner(simulatedBoard);
            const nextTurn: PlayerSymbol = aiSymbol === 'X' ? 'O' : 'X';

            await recordMove(
              currentGame.id,
              gameEvents.length,
              reconstructed.moveCount + 1,
              aiSymbol,
              'ai-opponent',
              aiMoveCell,
              nextTurn,
              outcome.winner
            );
          }
        } catch (err) {
          console.error('Error executing AI move:', err);
        } finally {
          setIsAiThinking(false);
        }
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [
    currentGame,
    reconstructed.currentTurn,
    reconstructed.board,
    reconstructed.isGameOver,
    reconstructed.moveCount,
    isBrowsingHistory,
    isAiThinking,
    isProcessingMove,
    gameEvents.length,
  ]);

  // User Actions
  const handleLogin = async () => {
    if (isSigningIn) return;
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const user = await loginWithGoogle();
      if (user) {
        setCurrentUser(user);
      }
    } catch (err: any) {
      // Don't treat user-dismissed popup as a fatal application error
      if (
        err?.code !== 'auth/popup-closed-by-user' &&
        err?.code !== 'auth/cancelled-popup-request'
      ) {
        setAuthError(err?.message || 'Google sign-in could not be completed.');
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutUser();
      setCurrentGame(null);
      setGameEvents([]);
    } catch (err) {
      console.error('Sign out failed:', err);
    }
  };

  const handleStartAiGame = async (difficulty: AiDifficulty, symbol: PlayerSymbol) => {
    if (!currentUser) {
      await handleLogin();
      return;
    }

    try {
      setIsCreatingGame(true);
      setJoinError(null);
      const newGame = await createGame(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Player',
          photoURL: currentUser.photoURL || '',
          email: currentUser.email || '',
        },
        'ai',
        difficulty,
        symbol
      );

      setGameEvents([]);
      setCurrentGame(newGame);
    } catch (err: any) {
      setJoinError('Could not start AI game. Please try again.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleCreatePvpGame = async () => {
    if (!currentUser) {
      await handleLogin();
      return;
    }

    try {
      setIsCreatingGame(true);
      setJoinError(null);
      const newGame = await createGame(
        {
          uid: currentUser.uid,
          displayName: currentUser.displayName || 'Player',
          photoURL: currentUser.photoURL || '',
          email: currentUser.email || '',
        },
        'pvp',
        'none',
        'X'
      );

      setGameEvents([]);
      setCurrentGame(newGame);
    } catch (err: any) {
      setJoinError('Failed to create match room.');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinByCode = async (code: string) => {
    if (!currentUser) {
      setPendingUrlCode(code);
      await handleLogin();
      return;
    }

    try {
      setIsJoiningGame(true);
      setJoinError(null);
      const found = await findGameByCode(code);

      if (!found) {
        setJoinError(`Game room "${code}" was not found or has expired.`);
        return;
      }

      // Check if user is already playerX
      if (found.playerX.uid === currentUser.uid) {
        setCurrentGame(found);
        return;
      }

      // Check if user is already playerO
      if (found.playerO && found.playerO.uid === currentUser.uid) {
        setCurrentGame(found);
        return;
      }

      // If room is already full with 2 other players
      if (found.playerO && found.playerO.uid !== currentUser.uid) {
        setJoinError('This game already has two players in progress.');
        return;
      }

      // Join as Player O
      await joinGame(found.id, {
        uid: currentUser.uid,
        displayName: currentUser.displayName || 'Player O',
        photoURL: currentUser.photoURL || '',
        email: currentUser.email || '',
      });

      const updated = await getGameById(found.id);
      if (updated) {
        setCurrentGame(updated);
      }
    } catch (err) {
      console.error('Failed to join game:', err);
      setJoinError('Could not connect to match room.');
    } finally {
      setIsJoiningGame(false);
    }
  };

  const handleCellClick = async (cellIndex: number) => {
    if (!currentGame || !currentUser || !userSymbol || !canMakeMove) return;

    try {
      setIsProcessingMove(true);
      playMoveSound(userSymbol);

      const simulatedBoard = [...reconstructed.board];
      simulatedBoard[cellIndex] = userSymbol;
      const outcome = checkWinner(simulatedBoard);
      const nextTurn: PlayerSymbol = userSymbol === 'X' ? 'O' : 'X';

      await recordMove(
        currentGame.id,
        gameEvents.length,
        reconstructed.moveCount + 1,
        userSymbol,
        currentUser.uid,
        cellIndex,
        nextTurn,
        outcome.winner
      );
    } catch (err) {
      console.error('Error recording move:', err);
    } finally {
      setIsProcessingMove(false);
    }
  };

  const handleConfirmRollback = async (targetSnapshot: TurnSnapshot) => {
    if (!currentGame || !currentUser) return;

    try {
      setIsProcessingRollback(true);
      await recordRollback(
        currentGame.id,
        gameEvents.length,
        targetSnapshot,
        currentUser.uid
      );
      setSelectedTurnIndex(targetSnapshot.turnNumber);
    } catch (err) {
      console.error('Rollback error:', err);
    } finally {
      setIsProcessingRollback(false);
    }
  };

  const handlePlayAgain = () => {
    setShowGameOverModal(false);
    if (!currentGame) return;

    if (currentGame.mode === 'ai') {
      handleStartAiGame(
        (currentGame.aiDifficulty as AiDifficulty) || 'hard',
        userSymbol || 'X'
      );
    } else {
      handleCreatePvpGame();
    }
  };

  const handleExitToLobby = () => {
    setCurrentGame(null);
    setGameEvents([]);
    setShowGameOverModal(false);
    // Clear URL params without full page reload
    if (typeof window !== 'undefined' && window.history) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  // Loading Splash
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300 gap-3">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-xs font-mono tracking-wider text-slate-400">
          Connecting to Firebase...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        user={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onGoHome={handleExitToLobby}
        isInGame={!!currentGame}
        isSigningIn={isSigningIn}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">
        {!currentUser ? (
          // Unauthenticated Landing Screen
          <div className="flex-1 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center space-y-6 bg-slate-900/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-500 p-[2px] mx-auto shadow-xl shadow-indigo-500/20">
                <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-indigo-400" />
                </div>
              </div>

              <div className="space-y-2">
                <h2 className="text-2xl font-black text-white tracking-tight">
                  Welcome to Chronotactics
                </h2>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Sign in with your Google account to unlock real-time multiplayer, unbeatable Minimax AI, and turn-by-turn event sourcing time travel.
                </p>
              </div>

              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{authError}</span>
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={isSigningIn}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 hover:from-indigo-500 hover:to-pink-500 disabled:opacity-60 text-white font-bold text-sm shadow-xl shadow-indigo-600/30 transition active:scale-98 flex items-center justify-center gap-2.5"
              >
                {isSigningIn ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Signing in with Google...</span>
                  </>
                ) : (
                  <>
                    <LogIn className="w-4 h-4" />
                    <span>Continue with Google Sign-In</span>
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-slate-800 grid grid-cols-2 gap-2 text-left">
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <Bot className="w-3.5 h-3.5 text-purple-400" /> Minimax AI
                  </div>
                  Zero LLM calls, pure tactical tree search.
                </div>
                <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800 text-[11px] text-slate-400">
                  <div className="font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                    <Users className="w-3.5 h-3.5 text-indigo-400" /> Live Match
                  </div>
                  6-digit room code with link sharing.
                </div>
              </div>
            </div>
          </div>
        ) : !currentGame ? (
          // Lobby View (No active match)
          <Lobby
            onStartAiGame={handleStartAiGame}
            onCreatePvpGame={handleCreatePvpGame}
            onJoinGameCode={handleJoinByCode}
            isJoining={isJoiningGame}
            isCreating={isCreatingGame}
            joinError={joinError}
          />
        ) : (
          // Active Game Match View
          <div className="flex-1 max-w-4xl mx-auto w-full p-4 sm:p-6 space-y-5 animate-in fade-in duration-300">
            {/* Share Banner for PvP games */}
            {currentGame.mode === 'pvp' && (
              <ShareBanner
                gameCode={currentGame.gameCode}
                isWaiting={currentGame.status === 'waiting'}
              />
            )}

            {/* Match Header with player profiles and turn glow */}
            <MatchHeader
              game={currentGame}
              currentTurn={reconstructed.currentTurn}
              winner={reconstructed.winner}
              isAiThinking={isAiThinking}
              currentUserUid={currentUser.uid}
            />

            {/* Interactive 3x3 Board */}
            <div className="py-2">
              <Board
                board={displayedSnapshot.board}
                winningLine={displayedSnapshot.winningLine}
                lastMoveIndex={displayedSnapshot.lastMove?.cellIndex ?? null}
                currentTurn={displayedSnapshot.currentTurn}
                canMakeMove={canMakeMove}
                isPreviewingHistory={isBrowsingHistory}
                onCellClick={handleCellClick}
              />
            </div>

            {/* Event Sourcing Timeline and Time-Travel Scrubber */}
            <TimeTravelBar
              history={reconstructed.history}
              rawEvents={gameEvents}
              selectedTurnIndex={selectedTurnIndex}
              latestTurnIndex={latestTurnIndex}
              onSelectTurnIndex={setSelectedTurnIndex}
              onConfirmRollback={handleConfirmRollback}
              isProcessingRollback={isProcessingRollback}
              canRollback={
                isBrowsingHistory &&
                currentGame.status !== 'waiting' &&
                (userSymbol !== null)
              }
            />

            {/* Game Over Modal */}
            {showGameOverModal && (
              <GameOverModal
                winner={reconstructed.winner}
                userSymbol={userSymbol}
                onPlayAgain={handlePlayAgain}
                onInspectHistory={() => setShowGameOverModal(false)}
                onExitLobby={handleExitToLobby}
                isAiGame={currentGame.mode === 'ai'}
              />
            )}
          </div>
        )}
      </main>
    </div>
  );
}
