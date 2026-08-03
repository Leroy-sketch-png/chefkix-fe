# Q101 Truthful Carousel Images - Test Report

## Decision

Replaced ImageCarousel's domain-wide Unsplash substitution with the existing exact known-broken image policy. Successful-load state now resets with the image set, matching the component's existing failure-state reset.

The remaining Q090 mentions, messaging inventory, and dead-code proposals were not executed. SCOPE's premium finding also remains unexecuted because changing a real trial or free-feature contract is money-adjacent product authority, not a local cleanup.

## AoE Evidence

### Pass 1 - Epicenter

- Valid Unsplash food source reaches the rendered image unchanged.
- Two exact known 404 IDs resolve to `/placeholder-recipe.svg` before load.
- A real runtime image error still produces the existing accessible fallback frame.

### Pass 2 - Blast Radius

- Same-index source replacement clears successful-load state and restores the shimmer for the new image.
- ImageCarousel's only production caller is PostCard's canonical `photoUrls` path, rendered in desktop and mobile branches.
- Swipe, keyboard, arrows, indicators, alt text, counter, and delivery transforms are unchanged.

### Pass 3 - Systemic Sweep

- No second domain-wide Unsplash-to-placeholder rule remains in production source.
- Search, recipes, battle images, and the carousel now share `imageSafety` as the exact policy authority.
- Next config permits `images.unsplash.com`; non-Cloudinary remotes intentionally render unoptimized.
- Source history located the broad block in a May visual-audit batch with no surviving host-policy justification.

## Executable Results

- Focused Jest: 3 suites, 9 tests passed.
- Full Jest: 125 suites, 510 tests passed.
- TypeScript: passed after replacing unsupported matcher typings with native DOM attribute assertions.
- ESLint: zero warnings/errors.
- Production build: Next.js 15.4.6 compiled and generated 53/53 routes.
- Agent OS: corrected activation contract passed 124/124.
- Diff/source sweeps: passed.
- Network probe: valid food URL returned 200 `image/jpeg` with nonzero bytes; both exact blocked IDs returned 404.

## Prediction Error And Process Correction

SHOT initially wrote a noncanonical queue-state phrase and began the two-file edit before rerunning Agent OS. The verifier failed closed at 122/123. Q101 was expanded to the exact activation fields, the state was corrected to `ACTIVE - VISION GATE PASSED`, and the gate passed 124/124 before completion was claimed. This ordering miss is preserved rather than disguised.

The compiler also rejected `toHaveAttribute` because this repository's Jest type surface omits that matcher. Native `getAttribute()` assertions preserve the same test meaning and TypeScript then passed.

## Residual Unknowns

- Production prevalence of Unsplash-backed posts remains UNKNOWN.
- Representative preference for the existing fallback frame after genuine failure remains UNKNOWN.
- Host-policy or moderation-pipeline changes require a new review.

## Repeatable Evidence

- `network-probe.ps1`
- `PLAN.md`
- This report
