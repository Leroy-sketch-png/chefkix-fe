# ChefKix Frontend — AI Agent Instructions
<!-- Authoritative source: workspace root .github/copilot-instructions.md -->
<!-- This file contains FE-specific guidance only. For full architecture, see root. -->

## §WORK_ETHIC
- **GIT**: main/master=sacred. ALL changes via PR. NO direct commits to main.
- **COMMITS**: User decides when. Then: small, atomic, clean commits. Professional msgs.
- **QUALITY**: Work until user satisfied. Perfectionist approach. No gaps, no assumptions.

## §ARCH
```
FE(Next15:3000) → Monolith(Spring Boot:8080, context-path=/api/v1)
                        ↓            ↓           ↓
                  Keycloak:8180  MongoDB:27017  Kafka:9094  Redis:6379
AI(FastAPI:8000) — standalone, Gemini 2.5 Flash
```
**Single JVM monolith**, modular architecture. No API Gateway, no Eureka, no Feign.
FE calls `http://localhost:8080/api/v1/*` directly.

### §MODULE_DETAILS
| module | package | domain |
|--------|---------|--------|
| identity | com.chefkix.identity | Auth, Profile, Social, Stats, Chat |
| culinary | com.chefkix.culinary | Recipes, CookingSessions, XP |
| social | com.chefkix.social | Posts, Comments, Likes, Feed |
| notification | com.chefkix.notification | Email(Brevo), Bell notifs |
| ai-service | src/ | Python FastAPI, Gemini 2.5 Flash |

All modules share single MongoDB database `chefkix`.

## §PATTERNS

### Java Response Wrapper (ALL endpoints)
```java
ApiResponse.<T>builder().success(true).statusCode(200).data(x).build();
```

### Error Handling
```java
throw new AppException(ErrorCode.USER_NOT_FOUND);
```

## §AUTH_FLOW
1. FE→`/api/v1/auth/login`→monolith (identity module)
2. identity→Keycloak (WebClient, password grant)
3. Keycloak returns tokens, identity wraps in ApiResponse
4. **RefreshToken**: HttpOnly cookie (7d login, 30d refresh). AccessToken: body→Zustand→localStorage
5. FE axios interceptor auto-refreshes on 401

### Keycloak Config
- Realm: `nottisn`, Client: `chefkix-be`
- JWT issuer: `http://localhost:8180/realms/nottisn`

## §FRONTEND (Next.js 15 + React 19)

### API Layer
```typescript
import { api } from '@/lib/axios' // NEVER raw axios
import { API_ENDPOINTS } from '@/constants'
api.get(API_ENDPOINTS.RECIPES.FEED)
```

### State
- Zustand: `authStore.ts` (auth state), `uiStore.ts`, `cookingStore.ts`
- Persisted to localStorage via `zustand/middleware/persist`

### Types
`src/lib/types/` — recipe.ts, auth.ts, post.ts, etc.

### Services
`src/services/` — one file per domain (recipe.ts, auth.ts, post.ts...)
Pattern: async fn, try/catch, return ApiResponse<T>

### Components
`src/components/` — organized by feature (recipe/, cooking/, feed/, auth/...)
shadcn/ui in `components/ui/`

## §STARTUP

```powershell
# Infrastructure
cd chefkix-infrastructure; docker compose -f compose-infra-only.yaml up -d
# Backend
cd chefkix-infrastructure; .\dev.bat
# Frontend
cd chefkix-fe; npm run dev
# AI Service
cd chefkix-ai-service; .\run
```

## §TESTING
```powershell
cd chefkix-fe; npm test
```
**Creds**: testuser/test123, Keycloak admin/admin

## §KEY_FILES
| what | where |
|------|-------|
| BE config | chefkix-monolith/application/src/main/resources/application.yml |
| BE security | chefkix-monolith/application/.../config/SecurityConfig.java |
| FE endpoints | chefkix-fe/src/constants/api.ts |
| FE axios+auth | chefkix-fe/src/lib/axios.ts |
| Design system | chefkix-fe/DESIGN_SYSTEM.md |

## §FRONTEND_UX_PATTERNS

### Loading States
- **Skeleton-first**: Content-aware skeletons matching final layout
- **No generic spinners** in content areas
- **AuthLoader**: Warm coral Lottie for auth transitions only

### Lottie Animations
- Location: `public/lottie/`
- Use `LottieAnimation` wrapper from `@/components/shared/LottieAnimation`
- **Brand colors**: Coral (#FF5A36), NOT cyan/blue

### Auth State Management
- `authStore.ts`: Zustand store with `isLoading`, `isAuthenticated`, `accessToken`, `user`
- `login()` does NOT set `isLoading` — caller manages loading state
- `AuthProvider` handles all redirects; forms should NOT call `router.push()` after login

### Form Validation
- Zod schemas + react-hook-form with `zodResolver`
- Registration requires: firstName, lastName, username, email, password

### Design System Tokens (globals.css)
- Brand: `--color-brand: #ff5a36` (coral)
- Backgrounds: Warm parchment (`--bg: #f8f4ef`), cream cards (`--bg-card: #fdfbf8`)
- Text: Espresso browns (`--text: #2c2420`)
- Tailwind: `bg-brand`, `text-primary`, `bg-bg-card`, etc.
- **Master Reference**: `DESIGN_SYSTEM.md`

## §WORKSPACE_STRUCTURE
This workspace contains:
- `chefkix-monolith/` — Modular monolith backend (Spring Boot 3.5.7, Java 21, port 8080)
- `chefkix-fe/` — Frontend (Next.js 15, port 3000)
- `chefkix-ai-service/` — AI service (Python FastAPI, port 8000)
- `chefkix-infrastructure/` — Docker, scripts, configs, Keycloak, seeds
- `vision_and_spec/` — Product specs and vision documents
- `.github/` — Prompts and AI agent instructions

**Git workflow**: Each repo has own git. Create feature branches in each affected repo, commit separately, push, then PR each.
