# Valence — Firestore Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **Authenticated & Verified Identity**: Only authenticated users with verified Google emails (`request.auth != null && request.auth.token.email_verified == true`) may read or write their own quota document at `/userQuotas/{userId}`.
2. **Strict Ownership**: `userId` in the path and `ownerId` inside the document must strictly equal `request.auth.uid`, and `ownerId` and `createdAt` are immutable after creation.
3. **Server-Synchronized Daily Window (`dateKey`)**: `dateKey` must match the server's exact UTC calendar date (`YYYY-MM-DD` from `request.time`) on both `create` and `update`. Users cannot backdate or forward-date `dateKey` to reset quotas.
4. **Hard Daily Cap (`0..25`)**:
   - On `create`: `actionCount` may only be `0` (`lastActionType == 'init'`) or `1` (`lastActionType in ['import', 'lookup', 'analyze']`).
   - On same-day `update`: `existing().actionCount < 25` and `incoming().actionCount == existing().actionCount + 1`.
   - On new-day `update` (`incoming().dateKey != existing().dateKey` while `isTodayDateKey(incoming().dateKey)`): `actionCount` resets to `0` (`init`) or `1` (`import`/`lookup`/`analyze`).
   - `delete` is unconditionally denied so users cannot delete and recreate their quota record to bypass the 25-action cap.
5. **No Blanket List / No Cross-User Reads**: `allow list: if false;` prevents collection enumeration; `allow get` strictly requires `isOwner(userId)`.

## 2. The "Dirty Dozen" Adversarial Payloads (All Must Return `PERMISSION_DENIED`)
1. **Unauthenticated read/write**: `request.auth == null` on `/userQuotas/uid123` -> Denied.
2. **Unverified email**: `request.auth.token.email_verified == false` -> Denied.
3. **Cross-user get**: Signed in as `uidA`, `get(/userQuotas/uidB)` -> Denied.
4. **Cross-user create (Identity Spoofing)**: Signed in as `uidA`, creating `/userQuotas/uidA` with `ownerId: "uidB"` -> Denied.
5. **Collection list scraping**: `list(/userQuotas)` -> Denied.
6. **Exceeding daily cap**: Same-day update attempting `actionCount: 26` when `existing.actionCount == 25` -> Denied.
7. **Decrementing actionCount**: Same-day update attempting `actionCount: 0` when `existing.actionCount == 12` -> Denied.
8. **Skipping / jumping count**: Same-day update attempting `actionCount: 5` when `existing.actionCount == 1` -> Denied.
9. **Date spoofing to reset quota**: Update sending yesterday's or tomorrow's `dateKey` to trigger reset -> Denied by `isTodayDateKey(incoming().dateKey)` against `request.time`.
10. **Self-delete quota reset**: `delete(/userQuotas/uidA)` -> Denied (`allow delete: if false`).
11. **Shadow field injection**: Create or update adding an extra field like `isPremium: true` or `limit: 9999` -> Denied by `keys().hasOnly(...)` & `affectedKeys().hasOnly(...)`.
12. **Client-forged timestamp or ID poisoning**: Create with `createdAt != request.time` or `userId` containing `/` or `> 128` chars -> Denied.
