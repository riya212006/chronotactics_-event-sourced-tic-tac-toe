import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  GameDoc,
  GameEventDoc,
  GameMode,
  AiDifficulty,
  PlayerSymbol,
  GameWinner,
  PlayerInfo,
  TurnSnapshot,
} from '../types/game';

// Helper to generate a clean 6-character game join code
export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // excluding I, O, 0, 1 to prevent ambiguity
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

export async function createGame(
  user: PlayerInfo,
  mode: GameMode,
  difficulty: AiDifficulty | 'none' = 'hard',
  playerChoice: PlayerSymbol = 'X'
): Promise<GameDoc> {
  const gameId = `gm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const gameCode = generateGameCode();

  const isAi = mode === 'ai';
  const isUserX = playerChoice === 'X';

  const userPlayer: PlayerInfo = {
    uid: user.uid,
    displayName: user.displayName || 'Player',
    photoURL: user.photoURL || '',
    email: user.email || '',
  };

  const aiPlayer: PlayerInfo = {
    uid: 'ai-opponent',
    displayName: `AI (${difficulty.toUpperCase()})`,
    photoURL: '',
  };

  const playerX = isAi ? (isUserX ? userPlayer : aiPlayer) : userPlayer;
  const playerO = isAi ? (isUserX ? aiPlayer : userPlayer) : null;

  const gameData: GameDoc = {
    id: gameId,
    gameCode,
    mode,
    aiDifficulty: isAi ? difficulty : 'none',
    creatorId: user.uid,
    creatorDisplayName: user.displayName || 'Player',
    creatorPhotoURL: user.photoURL || '',
    playerX,
    playerO,
    status: isAi ? 'in_progress' : 'waiting',
    winner: 'none',
    currentTurn: 'X',
    moveCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  const path = `games/${gameId}`;
  try {
    await setDoc(doc(db, 'games', gameId), gameData);
    return gameData;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, path);
  }
}

export async function findGameByCode(code: string): Promise<GameDoc | null> {
  const trimmed = code.trim().toUpperCase();
  const q = query(
    collection(db, 'games'),
    where('gameCode', '==', trimmed),
    limit(1)
  );

  try {
    const querySnapshot = await getDocs(q);
    if (querySnapshot.empty) return null;
    const docData = querySnapshot.docs[0].data() as GameDoc;
    return docData;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, 'games');
  }
}

export async function getGameById(gameId: string): Promise<GameDoc | null> {
  const path = `games/${gameId}`;
  try {
    const snap = await getDoc(doc(db, 'games', gameId));
    if (!snap.exists()) return null;
    return snap.data() as GameDoc;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, path);
  }
}

export async function joinGame(gameId: string, user: PlayerInfo): Promise<void> {
  const path = `games/${gameId}`;
  const playerO: PlayerInfo = {
    uid: user.uid,
    displayName: user.displayName || 'Player O',
    photoURL: user.photoURL || '',
    email: user.email || '',
  };

  try {
    await updateDoc(doc(db, 'games', gameId), {
      playerO,
      status: 'in_progress',
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, path);
  }
}

/**
 * Appends a discrete MOVE event to the game's event sourcing subcollection
 * and synchronizes the parent game document status.
 */
export async function recordMove(
  gameId: string,
  eventIndex: number,
  turnNumber: number,
  player: PlayerSymbol,
  playerId: string,
  cellIndex: number,
  nextTurn: PlayerSymbol,
  newWinner: GameWinner
): Promise<void> {
  const eventId = generateEventId();
  const eventPath = `games/${gameId}/events/${eventId}`;

  const eventDoc: GameEventDoc = {
    id: eventId,
    gameId,
    eventIndex,
    turnNumber,
    type: 'MOVE',
    player,
    playerId,
    cellIndex,
    timestamp: serverTimestamp(),
  };

  try {
    // 1. Write the event document
    await setDoc(doc(db, 'games', gameId, 'events', eventId), eventDoc);

    // 2. Update the parent game state
    const gamePath = `games/${gameId}`;
    const isGameOver = newWinner !== null;
    await updateDoc(doc(db, 'games', gameId), {
      currentTurn: nextTurn,
      winner: newWinner ? newWinner : 'none',
      status: isGameOver ? 'finished' : 'in_progress',
      moveCount: turnNumber,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, eventPath);
  }
}

/**
 * Appends a discrete ROLLBACK event to the game's event sourcing subcollection,
 * recording the intent to restore to a previous turn's state.
 */
export async function recordRollback(
  gameId: string,
  eventIndex: number,
  targetSnapshot: TurnSnapshot,
  userId: string
): Promise<void> {
  const eventId = generateEventId();
  const eventPath = `games/${gameId}/events/${eventId}`;

  const eventDoc: GameEventDoc = {
    id: eventId,
    gameId,
    eventIndex,
    type: 'ROLLBACK',
    targetTurn: targetSnapshot.turnNumber,
    playerId: userId,
    player: 'none',
    timestamp: serverTimestamp(),
  };

  try {
    // 1. Write the rollback event document
    await setDoc(doc(db, 'games', gameId, 'events', eventId), eventDoc);

    // 2. Update the parent game state to match the target turn
    const isGameOver = targetSnapshot.winner !== null;
    await updateDoc(doc(db, 'games', gameId), {
      currentTurn: targetSnapshot.currentTurn,
      winner: targetSnapshot.winner ? targetSnapshot.winner : 'none',
      status: isGameOver ? 'finished' : 'in_progress',
      moveCount: targetSnapshot.turnNumber,
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, eventPath);
  }
}

/**
 * Real-time listener for the game document.
 */
export function subscribeToGame(
  gameId: string,
  onData: (game: GameDoc) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `games/${gameId}`;
  return onSnapshot(
    doc(db, 'games', gameId),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as GameDoc);
      }
    },
    (error) => {
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (e) {
          onError(e as Error);
        }
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}

/**
 * Real-time listener for the game's events subcollection (Event Sourcing stream).
 */
export function subscribeToGameEvents(
  gameId: string,
  onEvents: (events: GameEventDoc[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = `games/${gameId}/events`;
  const q = query(collection(db, 'games', gameId, 'events'), orderBy('eventIndex', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const events: GameEventDoc[] = [];
      snapshot.forEach((d) => {
        events.push(d.data() as GameEventDoc);
      });
      onEvents(events);
    },
    (error) => {
      if (onError) {
        try {
          handleFirestoreError(error, OperationType.GET, path);
        } catch (e) {
          onError(e as Error);
        }
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    }
  );
}
