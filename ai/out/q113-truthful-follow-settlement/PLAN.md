# Q113 Plan - Truthful Follow Suggestion Settlement

## Goal

Make the shared follow-suggestion card settle and celebrate only from the relationship state returned by the toggle-follow command.

## Files

1. `src/lib/types/social.ts` - encode the backend-guaranteed relationship fields.
2. `src/components/social/FollowSuggestionCard.tsx` - gate removal and celebration on authoritative state; remove fake dismiss lifecycle.
3. `src/components/social/__tests__/follow-suggestion-card.test.tsx` - render and exercise all settlement branches.
4. `src/lib/__tests__/celebrationProportionality.test.ts` - retain a systemic source contract for proportional celebration.

## Order

1. Challenge SCOPE's parent-command claim against the shared child and backend.
2. Strengthen the response type without changing the endpoint.
3. Repair the shared card used by Community and profile followers.
4. Prove confirmed one-way, confirmed mutual, contradictory, malformed, rejected, thrown, auth-denied, and dismiss behavior.
5. Run focused and full checks, production build, source sweep, diff review, and Agent OS.

## Risks

1. A second command in the parent would undo the follow because the endpoint toggles.
2. Treating `variant='follow-back'` as relationship proof would be stale under races.
3. A success envelope without authoritative data could still remove the card unless explicitly rejected.
