# ChefKix Frontend — AI Agent Instructions
<!-- Chain: BELT.md (OS) → SCOPE.md (work queue) → AGENTS.md (audit trail) → this file (FE specifics) -->
<!-- This file: FE-specific conventions only. Read root files for full context. -->

# LIVE FIXES (read before touching any FE file)
- Story view tracking: `recordStoryView()` was NEVER called in StoryViewer — effect added watching `currentStory?.id`.
- `POST_SHARED` (1.3x feed weight) was dead signal — wired in PostCard + SharePostModal handleShare.
- VerifyOtpForm: `setLoading(true)` never reset after signup — removed the rogue line before `router.push()`.
- ColdStartExperience: `chefkix:interaction` custom event was NEVER dispatched — added click proxy + PostCard like handler dispatch.
- `POST_COMMENTED` (1.8x), `RECIPE_CREATED` (2.5x) were dead tracking signals — wired July 2026.
- `RECIPE_SKIPPED` / `SEARCH_REFINED` defined but never emitted (features not built).

# KNOWLEDGE GAPS (features referenced by code but not built)
- No draft auto-save on post creation (content lost on browser crash)
- No ToS checkbox on signup despite `TERMS_NOT_ACCEPTED` error code
- No dietary restrictions in InterestPicker (only cuisines)
- `copilot-instructions.md` was in FE .gitignore (bare pattern) — removed July 2026; `.github/copilot-instructions.md` is now tracked

# FE CONVENTIONS
- **Import alias**: `@/` → `src/`
- **i18n**: `next-intl` — `useTranslations` from `next-intl`
- **Routing constants**: `PATHS` from `@/constants`
- **Design tokens** (Tailwind): `bg-bg`, `bg-bg-card`, `bg-bg-elevated`, `bg-bg-hover`, `text-text-primary`, `text-text-secondary`, `text-text-muted`, `border-border`, `border-border-subtle`
- **Animations**: Framer Motion with `@/lib/motion` constants (`TRANSITION_SPRING`, etc.)
- **API**: axios via `@/services/` files
- **State**: Zustand stores in `@/store/`
- **UI**: Radix primitives in `@/components/ui/`
- **Form**: react-hook-form + zod resolver
- **Sharing**: `POST_SHARED` fires on both native share (`handleNativeShare`) and chat share (`SharePostModal.handleShare`)

# TESTING
```powershell
npm test        # jest
npm run lint    # next lint
npm run typecheck # tsc --noEmit
npm run dev     # next dev --turbopack
```

# KEY FILES
| Path | Why |
|------|-----|
| `src/lib/eventTracker.ts` | Tracking engine |
| `src/lib/types/events.ts` | 22 event types |
| `src/components/social/PostCard.tsx` | Main post card (1.6k lines) |
| `src/components/story/StoryViewer.tsx` | Story viewer |
| `src/components/onboarding/ColdStartExperience.tsx` | New user cold-start |
| `src/components/auth/VerifyOtpForm.tsx` | OTP + auto-login |
| `src/store/authStore.ts` | Auth Zustand store |
| `src/services/post.ts` | Post API |
| `src/services/story.ts` | Story API |
| `src/constants/api.ts` | API endpoint constants |
| `..vision_and_spec/30-frontend-design-system.md` | Design authority |
| `..AGENTS.md` | Full audit trail |
