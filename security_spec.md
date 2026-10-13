# Security Specification: Chronotactics Event-Sourced Tic-Tac-Toe

## 1. Data Invariants
1. A Game document must always have a creator matching `request.auth.uid` upon creation.
2. Events in `games/{gameId}/events` can only be appended (immutable event sourcing) by authenticated participants of the game.
3. Rollbacks and Moves must record valid indices and adhere to strictly typed event structures.
4. Game documents cannot have their `creatorId` or `createdAt` altered after creation.
5. All timestamps (`createdAt`, `updatedAt`, `timestamp`) must match `request.time`.
6. Append-only event subcollections cannot be updated or deleted.

## 2. The Dirty Dozen Payloads (Targeting Rejection)
1. **Unauthenticated Creation**: Write to `/games/test-game` without `request.auth` -> REJECT
2. **Creator Impersonation**: Create game with `creatorId: 'victim-uid'` when logged in as `'attacker-uid'` -> REJECT
3. **Ghost Fields Injection**: Attempting to inject `{ isAdmin: true, bypassRules: true }` in game document -> REJECT
4. **Invalid Cell Index**: Event with `cellIndex: 99` -> REJECT
5. **Invalid Event Type**: Event with `type: 'FORCE_WIN'` -> REJECT
6. **Non-Participant Event Write**: Malicious user trying to inject a turn into a private match -> REJECT
7. **Event Mutation**: Attempting `update` on `/games/{gameId}/events/{eventId}` -> REJECT
8. **Event Deletion**: Attempting `delete` on an event document -> REJECT
9. **Fake Timestamp**: Creating a game with client-spoofed `createdAt: '2020-01-01'` -> REJECT
10. **Game Id Poisoning**: Creating game with 2000-character malicious string ID -> REJECT
11. **Altering Immutable Creator**: Updating existing game with a different `creatorId` -> REJECT
12. **Unauthorized Status Overwrite**: Non-player updating game state -> REJECT
