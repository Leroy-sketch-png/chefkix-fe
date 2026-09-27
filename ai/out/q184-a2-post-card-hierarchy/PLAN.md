# Q184 A2 - PostCard Hierarchy

## Decision

Execute the approved Phase A2 hierarchy correction: present post media first, then the primary social actions, then optional plate rating, then caption and supporting cooking context.

## Product reality

- Human scene: a scroller opens a feed card to judge the food and decide whether to like, comment, share, or save.
- Current friction: caption and long post-specific context precede the food, delaying the primary desire signal and actions.
- Value: faster desire recognition and a more familiar social-card rhythm without removing any creator, cook, or social behavior.
- Rejection trigger: a card that hides the food below a wall of context feels like a form, not a food-social product.

## Challenge

- Strongest alternative: physically move JSX blocks. Rejected because it duplicates or risks disturbing the existing media, rating, menu, battle, poll, and comments lifecycles.
- Selected approach: flex ordering of existing sibling regions, keeping source ownership and behavior unchanged.
- Disconfirming evidence: any direct-child region is not independently orderable, or runtime inspection shows actions/context still render in the prior order.
- Falsifier: focused contract, typecheck, lint, or representative layout check fails; revert the order classes only.
- Pre-mortem: a hidden sibling bypasses the order contract; narrow cards overflow; comments or menus inherit an unintended order. The source contract and existing adjacent tests cover the first and behavior-preservation checks cover the latter.

## Scope

`src/components/social/PostCard.tsx` and one focused source contract. No API, data, auth, or product-direction changes.
