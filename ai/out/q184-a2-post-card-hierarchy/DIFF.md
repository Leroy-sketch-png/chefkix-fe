# Q184 A2 - Diff Record

## Cluster Fix

### AREA CLEARED: Social PostCard visual hierarchy

- Trigger Finding: feed cards rendered caption/context before the primary food media.
- Seed of Suspicion: content-first ordering had likely allowed feature-specific context to outrank the core desire signal.
- Blast Radius Findings (Pass 2): media, video, actions, rating, and caption are independent siblings; comments remain after actions; media double-tap and keyboard behavior are local to media.
- Systemic Sweep (Pass 3): the approved cluster is isolated to `PostCard`; no JSX relocation or shared social-card primitive is involved.
- Total Eradications: 1 hierarchy defect, 1 regression contract.

## Preserved

Like, comment, share, save, collection, rating, poll, battle, recipe-link, media double-tap, edit, menu, and comments behavior were not rewritten.
