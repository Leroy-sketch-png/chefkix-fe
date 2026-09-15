# Q184-SHOT-TEAM-BATCH — Execution Brief for SHOT

**Origin:** SCOPE survey Q155–Q183. **Approval:** HUMAN approved "all the above as one scripted batch" 2026-08-11.
**SCOPE contract:** this is the handoff. SHOT implements, verifies with the gates below, and does NOT self-expand scope.
**All items** are frontend-only (chefkix-fe), line-traced, small, high visible value.

> WHAT CHANGED AFTER APPROVAL (read FIRST): the previously approved "Phase C: mount PostDeadlineCard"
> item is CORRECTED — it is NOT a blind single mount. See item 6. Treat item 6 as a DECISION, not an edit.

---

## Batch 1 — Q183 Viewer-first fixes (highest "impress" per unit of work)

### 1. Q183-F2 — Search true total (cleanest win; pure frontend)
- Files: `src/app/(main)/search/page.tsx`; reference `src/app/(main)/explore/ExploreClient.tsx`.
- Bug: `search/page.tsx:552-568` fetches `unifiedSearch(query,'all',20)` and maps only the loaded 20
  `.hits` per category into `results`; `:567 totalCount = recipes.length + people.length + posts.length`
  (truncated). `:587-609` builds `totalResults` and per-tab tab `count`s from those same lengths.
- The backend ALWAYS returned the real total: `SearchResult<T>.found` (`src/lib/types/search.ts:21`),
  i.e. `res.data.recipes.found` / `.users.found` / `.posts.found`. It is never read.
- **Fix (mirror Explore):** `ExploreClient.tsx:753` does `const totalFound = recipesResult.found ?? allRecipes.length`. Do the same per tab:
  - Store `recipesFound`, `peopleFound`, `postsFound` from `res.data.recipes?.found ?? 0` etc. (fallback to loaded length when null).
  - `:587 totalResults = recipesFound + peopleFound + postsFound`.
  - `:595/601/607` tab `count:` use the `.found` value, not `results.X.length`.
- Optional (recommended, small): add "Load more"/infinite using the existing `page` param that
  `unifiedSearch(query,'all',20,page)` already supports (`src/services/search.ts:25-45`) — set `hasMore = totalFound > loaded`.
- Falsifier: counts and "N results found" must equal the backend's `.found`, not the loaded page length.

### 2. Q183-F1 — Explore empty-state "Did you mean:" dead chips
- Files: `src/app/(main)/explore/ExploreClient.tsx`; shared `src/components/shared/EmptyStateGamified.tsx`.
- Bug: `ExploreClient.tsx:1441-1447` passes `searchSuggestions` (trending terms) to `EmptyStateGamified`
  but does NOT pass `onSuggestionClick`. `EmptyStateGamified.tsx:798-801` renders clickable pills that
  call `onSuggestionClick?.(suggestion)` — undefined → dead buttons.
- Correct reference: `search/page.tsx:675` and `GroupsExploreGrid.tsx:253` both pass `onSuggestionClick`.
  Explore's own autocomplete already sets the query at `:1276/:1316/:1578` via `setSearchQuery` (`:482`).
- **Fix:** at `:1441` add `onSuggestionClick={term => setSearchQuery(term)}` alongside `searchSuggestions`
  (optionally also `handleSearchKeyDown`-style submit / navigate). Also localize the hardcoded
  `"Did you mean:"` caption at `EmptyStateGamified.tsx:794` (currently English).
- Falsifier: clicking a suggestion chip actually performs the search / updates the query.

### 3. Q183-F3 — Verification signal hardcoded off (2-instance cluster)
- Files: `src/app/(main)/explore/ExploreClient.tsx`; `src/app/(main)/collections/[collectionId]/page.tsx`.
- Bug: both build the recipe author object with `isVerified: false` —
  `ExploreClient.tsx:1516` and `collections/[collectionId]/page.tsx:422` —
  dropping the trusted-creator ✓ badge (`RecipeCardEnhanced` renders badge only when true).
  Search threads the REAL flag (`search/page.tsx:449`) → inconsistent truth across surfaces.
- **Fix (both):** set `isVerified` from the actual author doc instead of `false`
  (thread the real value available on the loaded recipe/author).
- Falsifier: same verified creator shows the ✓ badge on Explore + Collections as on Search.

### 4. Q183-F4 — Notifications list is stale while open (split-brain)
- Files: `src/hooks/useNotificationSocket.ts`; `src/store/notificationStore.ts`;
  `src/app/(main)/notifications/page.tsx`.
- Root cause: `useNotificationSocket.ts:47-54` handles `action === 'CREATE'` by ONLY
  `incrementUnreadCount()`; the full `event.notification` payload (`:17-20`) is discarded.
  `notificationStore.ts:5-15` is badge-only (no list state); the visible list lives only in the page
  (`page.tsx:299-342`, mount/retry fetch). Socket and list are architecturally disconnected.
- **Fix — pick one (SHOT + reviewer agree the minimal):**
  - **Minimal:** in `useNotificationSocket.ts` `handleNotification`, on `CREATE`, expose the new
    `notification` (e.g. callback/`setLastEvent`), and have the notifications page prepend it to its
    local list on the socket event while open. Badge stays via existing `incrementUnreadCount`.
  - **Architectural:** promote list state into `notificationStore`; socket prepends on CREATE; page reads from store.
- Falsifier: sitting on the notifications page, a new notification appears in the list live (badge AND item), and doesn't duplicate on manual refresh.

---

## Batch 2 — Phase A reachability/layout ("impress" flagship)

### 5. A1 — `/creator` Creator Studio reachable (4 edits, exact)
- Files: `src/constants/paths.ts`; `src/components/layout/LeftSidebar.tsx` (`:92-116` "more" list);
  `src/components/layout/MobileBottomNav.tsx` (`:104-114` `moreMenuItems`); `messages/en.json` (`nav` ns).
- `/creator` needs NO auth/role gate (full `creator` i18n at `en.json:3886+`; empty state `creator/page.tsx:248-260`; reads authStore userId).
- **Edits (match the existing `labelKey` + literal-href convention used by both navs):**
  1. `paths.ts`: add `CREATOR: '/creator'` (currently no `CREATOR` route const; `DISCOVER`/`COMMUNITY` at `:14-15`).
  2. `LeftSidebar.tsx` `:92-116` more list: add `{ href: PATHS.CREATOR, icon: <e.g. Compass/Sparkles>, labelKey: 'creator' }`.
  3. `MobileBottomNav.tsx` `moreMenuItems` `:104-114`: add `{ href: PATHS.CREATOR, icon: ..., labelKey: 'creator' }`.
  4. `messages/en.json` `nav` namespace: add `"creator": "Creator Studio"` (both components use `useTranslations('nav')` and resolve `labelKey` against it — no `creator` key exists today).
- Falsifier: `/creator` reachable from BOTH desktop sidebar and mobile bottom nav; no missing-key type errors.

### 6. A2 — Post-card action placement (mainstream convention)
- Files: `src/components/social/PostCard.tsx`.
- Current order: "Rate This Plate" FIRE/CRINGE bar at `:1337-1391`, then the primary Actions row
  (like/share/comment) at `:1393+`. Mainstream (IG/TikTok) = primary actions dominant; secondary social
  rating is not a full-width banner that buries the canonical engagement row.
- **Fix:** make the like/comment/share Actions row the visually primary engagement surface (move/emphasize
  above the FIRE/CRINGE row, or demote rate-plate into a less dominant inline control). Keep
  `hasCommentProof`/`isPositiveSocialMetric` honest-count behavior and the existing optimistic like/retry.
- Regression guard: `post-card-navigation.test.ts` (36 lines) is position-agnostic → low risk. Preserve aria-labels/counts.
- Falsifier: a viewer's first engagement affordance is the canonical like/comment/share, not the rating banner.

### 7. A3 — League leaderboard reachable
- Files: `src/components/leaderboard/LeaderboardPage.tsx` (`:78-81` tabs).
- Bug: `LeaderboardTabs` hardcodes global+friends; `LeagueLeaderboard` (361 lines) is fully built but unselectable.
- **Fix:** add the League tab to the tab row (selectable → renders the built `LeagueLeaderboard`).
- Falsifier: a user can switch to the league view from the leaderboard tabs.

---

## Batch 3 — Phase C corrected (DECISION, not blind edit)

### 8. Q179-F4 CORRECTED — pending-post UI redundancy
- **Do NOT blindly "mount PostDeadlineCard".** Discovery after approval:
  - `PostDeadlineCard` (`src/components/completion/PostDeadlineCard.tsx`, 552 lines) — unmounted.
  - `PendingPostsSection` (`src/components/pending/PendingPostsSection.tsx`, 755 lines: `SinglePendingPost`/`MultiplePendingPosts`/`ManyPendingPosts`) — ALSO unmounted.
  - The pending recovery loop IS live via `CookingHistoryTab` (mounted `UserProfile.tsx:59,1061`, inline `CookingHistoryTab.tsx:582-640`), plus pending-count badges in `ProfileHeaderGamified.tsx:741+` and `ProfileCommandRail.tsx:152`.
- **Decision required (raise to HUMAN/architect):** (a) mount ONE orphan (likely `PendingPostsSection`) as the profile-tab surface for the recovery loop and fold `PostDeadlineCard`'s card/badge into the same data source, or (b) delete BOTH orphans in favor of `CookingHistoryTab`'s inline rendering. Do not stack a second dead duplicate on a live surface.
- Falsifier to avoid: two pending-post UIs rendering simultaneously, or XP-loss claims not backed by the pending sessions data (`services/cookingSession.ts` pending model).

---

## Verification gates (ALL items)
- `npm run typecheck` → 0 errors.
- `npm run lint` → 0 errors (targeted files at minimum; full run preferred).
- Targeted Jest for touched files (search page, ExploreClient, notifications socket/store, PostCard, LeaderboardPage, nav).
- If behavior contracts were touched, re-read `AGENTS.md` UX doctrine + `30-frontend-design-system.md` tokens.
- Log results to `SESSION.md`/`SCOPE.md`; keep `EXECUTION_QUEUE.md` promoted items honest.

## Files (canonical)
- `chefkix-fe/src/app/(main)/search/page.tsx` · `explore/ExploreClient.tsx`
- `chefkix-fe/src/components/shared/EmptyStateGamified.tsx`
- `chefkix-fe/src/app/(main)/collections/[collectionId]/page.tsx`
- `chefkix-fe/src/hooks/useNotificationSocket.ts` · `src/store/notificationStore.ts` · `src/app/(main)/notifications/page.tsx`
- `chefkix-fe/src/constants/paths.ts` · `src/components/layout/{LeftSidebar,MobileBottomNav}.tsx` · `messages/en.json`
- `chefkix-fe/src/components/social/PostCard.tsx` · `src/components/leaderboard/LeaderboardPage.tsx`
- `chefkix-fe/src/components/{completion/PostDeadlineCard,pending/PendingPostsSection,CookingHistoryTab}.tsx` · `src/components/profile/UserProfile.tsx`
