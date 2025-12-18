# ChefKix Monorepo - AI Agent Instructions
<!-- ENCODED FOR CLAUDE/AI AGENTS - Optimized for context efficiency -->

## §WORK_ETHIC
- **GIT**: main/master=sacred. ALL changes via PR. NO direct commits to main.
- **COMMITS**: User decides when. Then: small, atomic, clean commits. Professional msgs.
- **QUALITY**: Work until user satisfied. Perfectionist approach. No gaps, no assumptions.

## §ARCH
```
FE(Next15:3000)→GW(8888)→[identity:8084|recipe:8086|post:8083|chat:8085|notif:8082]
                              ↓                ↓           ↓
                          Keycloak:8180    MongoDB:27017  Kafka:9094
AI(FastAPI:8000) - standalone, Gemini LLM
```
**Eureka:8761** service discovery. All Java svcs register. GW uses `lb://SERVICE-NAME`.

### §SVC_DETAILS
| svc | pkg | db | notes |
|-----|-----|-----|-------|
| chefkix-be | com.chefkix | chefkix | Identity+Social+Keycloak integration |
| recipe-service | com.chefkix | recipe-service | Gamification/CookingSessions/XP |
| post-service | com.chefkixpostservice | post-service | Feed/Comments/Likes |
| chat-service | org.example.chefkixmessageservice | chat-service | Conversations/Messages |
| notification-service | com.chefkix.notification | notification-service | Email(Brevo)/Bell notifs |
| ai-service | src/ | - | Python FastAPI, Gemini 2.5 Flash |

## §GATEWAY_ROUTES (application.yaml)
```yaml
/api/v1/auth/** → lb://chefkix-identity-service (StripPrefix=2)
/api/v1/post/** → lb://chefkix-post-service (StripPrefix=2)
/api/v1/recipes/** → lb://chefkix-recipe-service (StripPrefix=3)
/api/v1/chat/** → lb://chefkix-chat-service (StripPrefix=3)
/api/v1/notification/** → lb://chefkix-notification-service (StripPrefix=2)
```
**PUBLIC**: `/api/v1/auth/**`, OPTIONS all. Rest requires JWT.

## §PATTERNS

### Java Response Wrapper (ALL endpoints)
```java
ApiResponse.<T>builder().success(true).statusCode(200).data(x).build();
// Shortcuts: ApiResponse.success(data), ApiResponse.created(data), ApiResponse.successPage(page)
```
**Location**: each svc has own `dto/response/ApiResponse.java`

### MapStruct
```java
@Mapper(componentModel = "spring") // ALWAYS spring injection
```
pom.xml has `-Amapstruct.defaultComponentModel=spring`

### Lombok Standard
```java
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@FieldDefaults(level = AccessLevel.PRIVATE)
@RequiredArgsConstructor // for final injection
```

### MongoDB Entities
```java
@Document(collection = "name") @Id String id;
@CreatedDate Instant createdAt; @LastModifiedDate Instant updatedAt;
@DBRef for refs, @Indexed for queries
```

### Error Handling
Each svc: `exception/ErrorCode.java` (enum) + `GlobalExceptionHandler.java` (@ControllerAdvice)
```java
throw new AppException(ErrorCode.USER_NOT_FOUND);
```

## §KAFKA_TOPICS
| topic | producer | consumer | payload |
|-------|----------|----------|---------|
| xp-delivery | recipe-svc | identity-svc | XpRewardEvent |
| post-liked-delivery | post-svc | notification-svc | PostLikeEvent |
| post-deleted-delivery | post-svc | identity-svc | PostDeletedEvent |
| otp-delivery | identity-svc | notification-svc | EmailEvent |

Producer: `KafkaTemplate<String,Object>`, Consumer: `@KafkaListener(topics="...", containerFactory="...")`

## §AUTH_FLOW
1. FE→`/api/v1/auth/login`→GW→identity-svc
2. identity→Keycloak (WebClient, password grant)
3. Keycloak returns tokens, identity wraps in ApiResponse
4. **RefreshToken**: HttpOnly cookie (7 days). AccessToken: body→Zustand store→localStorage
5. FE axios interceptor auto-refreshes on 401

### Keycloak Config
- Realm: `nottisn`, Client: `chefkix-be`
- JWT issuer: `http://localhost:8180/realms/nottisn` (docker: `keycloak:8180`)
- All svcs validate JWT via `spring.security.oauth2.resourceserver.jwt.issuer-uri`

## §FRONTEND (Next.js 15 + React 19)

### API Layer
```typescript
import { api } from '@/lib/axios' // NEVER raw axios
import { API_ENDPOINTS } from '@/constants'
api.get(API_ENDPOINTS.RECIPES.FEED)
```
axios.ts: auto token refresh, standardized response shape

### State
- Zustand: `authStore.ts` (auth state), `uiStore.ts`
- Persisted to localStorage via `zustand/middleware/persist`

### Types
`src/lib/types/` - recipe.ts, auth.ts, post.ts, etc.

### Services
`src/services/` - one file per domain (recipe.ts, auth.ts, post.ts...)
Pattern: async fn, try/catch, return ApiResponse<T>

### Components
`src/components/` - organized by feature (recipe/, cooking/, feed/, auth/...)
shadcn/ui in `components/ui/`

## §AI_SERVICE (Python FastAPI)

### Structure
```
src/
├── app.py           # FastAPI app, lifespan, middleware
├── config.py        # pydantic-settings, env validation
├── routers/         # recipe.py, metas.py, moderation.py
├── services/        # ai.py (Gemini), moderation.py, anticheat.py
├── models/          # Pydantic request/response
├── sanitization.py  # Prompt injection protection
└── observability.py # structlog logger
```

### Key Patterns
```python
from src.config import get_settings
from src.services.ai import call_gemini_with_retry, extract_json_from_response
from src.sanitization import sanitize_recipe_text, InputSanitizationError
from src.observability import get_logger
logger.info("event", key=val) # kwargs only, no positional
```

### Endpoints
- `POST /api/v1/process_recipe` - raw text → structured recipe
- `POST /api/v1/calculate_metas` - XP, badges, enrichment
- `POST /api/v1/validate_recipe` - safety check
- `POST /api/v1/moderate` - hybrid moderation (rules+AI)

## §STARTUP

### Full Stack
```powershell
cd chefkix-infrastructure\scripts; .\start_all.bat
```

### Dev (IDE debugging)
```powershell
cd chefkix-infrastructure; docker compose -f compose-infra-only.yaml up -d
# Then run services via IDE or mvnw spring-boot:run
```

### Frontend
```powershell
cd chefkix-fe; npm run dev
```

### AI Service
```powershell
cd chefkix-ai-service; .\run  # auto venv creation
```

## §TESTING
```powershell
# Java: cd <svc>; mvnw test
# FE: cd chefkix-fe; npm test
# AI: cd chefkix-ai-service; pytest (or make test)
```
**Creds**: testuser/test123, Keycloak admin/admin

## §KEY_FILES
| what | where |
|------|-------|
| GW routes | chefkix-api-gateway/src/main/resources/application.yaml |
| FE endpoints | chefkix-fe/src/constants/api.ts |
| FE axios+auth | chefkix-fe/src/lib/axios.ts |
| Seed data | chefkix-infrastructure/seed/seed-mongo.js |
| Docker full | chefkix-infrastructure/compose.yaml |
| Docker infra | chefkix-infrastructure/compose-infra-only.yaml |
| Keycloak realm | chefkix-infrastructure/keycloak-config/realm-export.json |

## §ENTITIES_OVERVIEW

### Identity (chefkix-be)
- User: id, username, email, passwordHash, @DBRef userProfile, @DBRef roles
- UserProfile: userId, displayName, avatarUrl, bio, Statistics, List<Friendship>
- Statistics: xp, level, recipesCreated, recipesCooked, badges, streaks

### Recipe
- Recipe: title, description, difficulty(enum), ingredients[], steps[], xpReward, badges[], validation, enrichment
- CookingSession: userId, recipeId, status(enum), currentStep, completedSteps[], timerEvents[], xp fields, postDeadline
- Enums: Difficulty(BEGINNER/INTERMEDIATE/ADVANCED/EXPERT), SessionStatus, RecipeStatus

### Post
- Post: userId, content, photoUrls[], sessionId, recipeId, likes, commentCount, hotScore
- Comment: postId, userId, content, likes, replies[]

### Chat
- Conversation: type(GROUP/DIRECT), participants[], participantsHash(unique)
- ChatMessage: conversationId, senderId, content, timestamp

## §ADD_FEATURE_WORKFLOW
1. **Java endpoint**: Controller→DTO(req/res)→Service→Repository→test
2. **Kafka event**: dto/event/XxxEvent.java, producer send, consumer @KafkaListener
3. **FE page**: app/(main)/xxx/page.tsx, service fn in services/, types in lib/types/
4. **AI feature**: router in ai-svc, sanitize input, call Gemini, test

## §COMMON_GOTCHAS
- Port mismatch: check application.yml vs actual (recipe=8086 not 8081 in yml)
- Package names vary: chefkixpostservice vs chefkix vs org.example.chefkixmessageservice
- StripPrefix in GW: /api/v1/auth/login → /auth/login at identity-svc
- Kafka trusted.packages: must include event class packages
- FE API_ENDPOINTS: some paths singular (recipe), some plural (recipes in GW)
- MongoDB: each svc has own database, not shared collections

## §FRONTEND_UX_PATTERNS

### Loading States Philosophy
- **Skeleton-first**: Use content-aware skeletons that match final layout (e.g., `UserProfileSkeleton`)
- **No generic spinners** in content areas — skeletons tell users what's coming
- **AuthLoader**: Warm coral Lottie for auth transitions (brief, transitional moments only)
- **Consistency**: All loading.tsx files use skeletons matching their page's content structure

### Lottie Animations
- Location: `public/lottie/`
- Use `LottieAnimation` wrapper from `@/components/shared/LottieAnimation`
- **Brand colors**: Coral (#FF5A36), NOT cyan/blue
- Check for white "BG" layers in dark mode — remove solid backgrounds for transparency
- `lottie-loading-coral.json` = on-brand loader, `lottie-loading.json` = deprecated (cyan)

### Auth State Management
- `authStore.ts`: Zustand store with `isLoading`, `isAuthenticated`, `accessToken`, `user`
- `login()` does NOT set `isLoading` — caller manages loading state to prevent race conditions
- `AuthProvider` handles all redirects; forms should NOT call `router.push()` after login
- Pattern: `setLoading(true)` → `login(token)` → `getMyProfile()` → `setUser()` → `setLoading(false)`

### Form Validation
- Zod schemas in component files or `@/lib/validations/`
- react-hook-form with `zodResolver`
- Registration requires: firstName, lastName, username, email, password

### Design System Tokens (globals.css)
- Brand: `--color-brand: #ff5a36` (coral)
- Backgrounds: Warm parchment (`--bg: #f8f4ef`), cream cards (`--bg-card: #fdfbf8`)
- Text: Espresso browns (`--text: #2c2420`)
- Gaming: XP purple, streak orange, level gold
- Tailwind: `bg-brand`, `text-primary`, `bg-bg-card`, etc.

## §MULTI_REPO_STRUCTURE
This workspace contains multiple independent git repositories:
- `chefkix-fe/` — Frontend (Next.js 15)
- `chefkix-be/` — Identity service (Spring Boot)
- `chefkix-recipe-service/` — Recipe service
- `chefkix-post-service/` — Post/Feed service
- `chefkix-chat-service/` — Chat/Messaging service
- `chefkix-notification-service/` — Notifications
- `chefkix-api-gateway/` — API Gateway
- `chefkix-infrastructure/` — Docker, scripts, configs
- `chefkix-ai-service/` — Python AI service

**Git workflow**: Each repo has own git. Create feature branches in each affected repo, commit separately, push, then PR each.
