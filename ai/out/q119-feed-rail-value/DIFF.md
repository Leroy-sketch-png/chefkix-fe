# Q119 Cluster Diff

## Feed Rail

- Removed the Stream Snapshot card that displayed mounted-post count, selected
  mode, and ranking audience vocabulary.
- Removed the rail's `postCount` and `feedMode` props plus their derived labels.
- Preserved all four Quick Moves and the conditional Friends Online widget.

## Feed Caller

- The feed now supplies only `showFriendsOnline={Boolean(user)}` to the rail.
- Feed mode state, tabs, loading, pagination, post counts, content ranking, and
  API calls are unchanged.

## Catalog And Contract

- Removed eight orphaned `feed.pulse*` strings while leaving identically named
  challenge, planner, and shopping namespace keys untouched.
- Added a focused contract proving telemetry does not return and useful actions
  plus authenticated presence remain.

## Systemic Correction

- FeedCommandDeck now owns only stream selection; it no longer displays mounted
  item count or automatic-pagination state.
- The loaded feed section no longer repeats `posts.length` as if it were a total.
- Removed the orphaned `feed.postsCount` and deck-only `feed.loadMore` strings.
- Retired two tests that asserted the removed status row and expanded the Q119
  contract across the rail, deck, caller, section header, and catalog.
