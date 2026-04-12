# Chefkix — AI-Powered Social Cooking Platform

A modular monolith social platform where users share recipes, cook interactively with AI assistance, and progress through a Duolingo-inspired gamification system. Built with **Spring Boot 3.5.7**, **Next.js 15**, **FastAPI**, and **3 languages**.

> **This README documents the full system.**

---

## Architecture

```
                            ┌──────────────────────────┐
                            │     Next.js 15 Client     │
                            │  React 19 · TypeScript    │
                            │  STOMP/WebSocket · Zustand │
                            └────────────┬─────────────┘
                                         │ HTTP
                                         ▼
                ┌─────────────────────────────────────────────┐
                │      Spring Boot Modular Monolith (8080)    │
                │     context-path: /api/v1                   │
                │     OAuth2 Resource Server · WebSocket       │
                └──┬──────┬──────┬──────┬──────┬─────────────┘
                   │      │      │      │      │
         ┌─────────┘  ┌───┘  ┌───┘  ┌───┘  ┌───┘
         ▼            ▼      ▼      ▼      ▼
   ┌──────────┐ ┌────────┐ ┌────┐ ┌────┐ ┌──────────────┐
   │ Identity │ │Culinary│ │Soc │ │Chat│ │ Notification │
   │ Module   │ │ Module │ │Mod │ │(id)│ │    Module    │
   │          │ │        │ │    │ │    │ │              │
   │ Auth     │ │Recipes │ │Feed│ │WS/ │ │Kafka Consumer│
   │ Profiles │ │Cooking │ │Cmts│ │STOMP│ │Email (Brevo)│
   │ Social   │ │Sessions│ │Like│ │Rooms│ │Push (WS)    │
   │ Leaders  │ │AI Proxy│ │Rpt │ │    │ │              │
   └────┬─────┘ └───┬────┘ └─┬──┘ └─┬──┘ └──────┬───────┘
        │            │        │      │            │
        ▼            ▼        ▼      ▼            ▼
   ┌──────────────────────────────────────────────────────┐
   │                  Infrastructure                       │
   │  MongoDB · Kafka · Keycloak · Redis                   │
   └──────────────────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   AI Service (Python)  │
            │   FastAPI · Gemini     │
            │   Moderation · NLP    │
            │   Anti-Cheat · Enrich │
            └────────────────────────┘
```

---

## System Boundaries

| Module           | Owns                                                     | Talks To                         | Protocol          |
| ---------------- | -------------------------------------------------------- | -------------------------------- | ----------------- |
| **Identity**     | Users, profiles, friendships, social graph, leaderboards | Keycloak, Redis, MongoDB         | SPI (in-process)  |
| **Culinary**     | Recipes, cooking sessions, challenges, interactions      | AI Service, MongoDB, Cloudinary  | SPI, REST (AI)    |
| **Social**       | Feed posts, comments, likes, saves, reports              | MongoDB, Cloudinary              | SPI (in-process)  |
| **Chat**         | Conversations, messages (in identity module)             | MongoDB                          | WebSocket (STOMP) |
| **Notification** | Bell notifications, email delivery                       | Kafka (consumer), Brevo, MongoDB | Kafka, WebSocket  |
| **AI Service**   | Recipe NLP, content moderation, anti-cheat, enrichment   | Gemini 2.5, Redis                | REST              |

---

## Failure Handling

This system is designed to degrade, not crash.

### AI Provider Rotation (4 layers)

The AI service calls 7 free-tier LLM providers (Groq, Mistral, OpenRouter, HuggingFace, Fireworks, Cohere, Gemini). Failure at any layer triggers the next:

```
Layer 1: Proactive rate-limit avoidance
         Each provider has a sliding-window call counter.
         Won't attempt a call if approaching the provider's RPM limit.
              │ provider at limit
              ▼
Layer 2: Cross-provider failover with cooldown
         HTTP 429 → 60s cooldown on that provider
         HTTP 5xx → 30s cooldown
         Auto-routes to next available provider. Retries up to 3x across different providers.
              │ all 7 providers exhausted
              ▼
Layer 3: Legacy Gemini SDK fallback
         Falls back to Google GenAI SDK with exponential backoff.
              │ Gemini also down
              ▼
Layer 4: Feature-level graceful degradation
         Moderation → rules-only verdict + FLAG for manual review
         Anti-cheat → rules-only XP multiplier
         Enrichment → recipe returns without story/notes
         Cache failure → in-memory fallback → proceeds without cache
```

**The system never returns a 500 to the user because of an AI outage.**

### Content Moderation (rules-first, AI for the gray zone)

```
User text
    │
    ▼
Rules engine (regex, leet-speak normalization, cooking-context whitelist)
    │
    ├── Score ≥ 75  →  BLOCK immediately (no AI call, no latency cost)
    ├── Score ≤ 24  →  APPROVE (cooking banter like "this recipe is killer" passes)
    └── Score 25-74 →  AI judges intent (is it attacking someone or casual?)
                           │ AI fails?
                           └── FLAG for manual review (never silently approves)
```

### Anti-Cheat XP Validation

5 rule checks reduce an XP multiplier from 1.0 downward:

| Check                    | Detection                                                | Example                                             |
| ------------------------ | -------------------------------------------------------- | --------------------------------------------------- |
| Step spam                | SequenceMatcher > 0.8 similarity between steps           | Copy-pasting "stir" 20 times                        |
| Time inflation           | Claimed time vs. technique time dictionary (40+ entries) | 3 hours for "chopping"                              |
| Fake techniques          | Advanced technique without required context              | "Sous vide" with no mention of immersion circulator |
| Difficulty inflation     | Expert claim with < 10 steps or < 30 minutes             | Claiming "expert" for toast                         |
| Ingredient-step mismatch | Steps > 3× ingredients                                   | 30 steps with 2 ingredients                         |

If confidence drops below 0.7 or 2+ issues flag → AI escalation for semantic analysis.

---

## Design Decisions

**Why a modular monolith (not microservices)?**
All Java modules share the same domain (cooking platform) and the same database (MongoDB). Microservices added network hops, distributed tracing complexity, and Eureka/Feign overhead with no real scaling benefit at this stage. The monolith gives us fast cross-module calls via SPI interfaces, a single deployment artifact, and easy local development — while the module boundaries keep the code just as decoupled.

**Why Kafka inside a monolith?**
Notifications and XP delivery are fire-and-forget from the producer's perspective. Kafka gives us async decoupling and durability even within the same JVM — if the notification consumer lags, producers aren't blocked. It also makes future extraction to separate services trivial.

**Why 7 LLM providers instead of just one?**
Every free-tier provider has aggressive rate limits (Gemini: 5 RPM, Cohere: 1000/month). A single provider caps the system at ~5 concurrent AI features. Rotation across 7 gives ~355 RPM aggregate throughput at zero API cost.

**Why hybrid moderation (not pure AI)?**
AI moderation adds 1-3 seconds latency. The rules engine handles 80%+ of cases in < 5ms. AI only activates for the ambiguous middle band — this cuts average moderation latency by ~10x while maintaining safety.

**Why MongoDB (not PostgreSQL)?**
Recipes, posts, and chat messages have deeply nested, variable-shape documents (recipe steps with optional timers, sub-ingredients, technique tags). MongoDB's document model avoids the join explosion that relational modeling would require for these structures.

---

## Tech Stack

| Layer              | Technologies                                                             |
| ------------------ | ------------------------------------------------------------------------ |
| **Frontend**       | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, Framer Motion |
| **Backend**        | Java 21, Spring Boot 3.5, Modular Monolith (9 Maven modules)             |
| **AI Service**     | Python 3.11, FastAPI, Pydantic v2, 7 LLM providers                       |
| **Auth**           | Keycloak (OAuth2/OIDC), Google social login, JWT                         |
| **Messaging**      | Apache Kafka                                                             |
| **Database**       | MongoDB, Redis                                                           |
| **Real-time**      | WebSocket/STOMP (chat), WebSocket (notifications)                        |
| **Infrastructure** | Docker Compose, Kubernetes                                               |
| **Observability**  | Structlog (JSON), SpringDoc OpenAPI/Swagger                              |

---

## Repositories

| Repo                                                                         | Role               | Language   |
| ---------------------------------------------------------------------------- | ------------------ | ---------- |
| **[chefkix-fe](https://github.com/Leroy-sketch-png/chefkix-fe)**             | Next.js frontend   | TypeScript |
| [chefkix-monolith](https://github.com/NotTisn/chefkix-monolith)              | Modular monolith   | Java       |
| [chefkix-ai-service](https://github.com/Leroy-sketch-png/chefkix-ai-service) | AI/ML service      | Python     |
| [chefkix-infrastructure](https://github.com/NotTisn/chefkix-infrastructure)  | Docker/K8s configs | YAML/JS    |

---

## Running Locally

```bash
# 1. Clone infrastructure and start backing services
git clone https://github.com/NotTisn/chefkix-infrastructure.git
cd chefkix-infrastructure
docker-compose -f compose-infra-only.yaml up -d    # MongoDB, Kafka, Keycloak, Redis

# 2. Start monolith
cd chefkix-monolith && mvnw spring-boot:run -pl application

# 3. Start AI service
cd chefkix-ai-service && .\run

# 4. Start frontend
cd chefkix-fe && npm install && npm run dev
```

**Service ports:** Monolith: 8080 | AI: 8000 | Frontend: 3000

---

## Visual Review Workflow

The Playwright visual runner now produces two artifact sets:

- `tests/visual/shots/` is the canonical AI-safe image directory. Every image in it is guaranteed to fit within the many-image vision limit.
- `tests/visual/raw-archive/` keeps the original full-fidelity captures as gzipped PNG archives so the raw data survives without leaving giant image files in the workspace.
- `tests/visual/ai-review/` stores manifests, deterministic review batches, and the next recommended batch for Copilot vision review.

Commands:

```bash
# Capture full screenshots and auto-build AI-safe review assets
npm run visual

# Rebuild only the AI-safe review assets from existing originals
npm run visual:review

# Rebuild and verify that no oversized visual images remain
npm run visual:review:verify

# Print and write the next recommended AI review batch
npm run visual:review:next
```

Generated review metadata:

- `tests/visual/shots/manifest.json` maps each archived original screenshot to its AI-safe derivative(s).
- `tests/visual/ai-review/manifest.json` records the active run, verification results, and batching metadata.
- `tests/visual/ai-review/batches.json` groups AI-safe images into small review batches.
- `tests/visual/ai-review/next-batch.json` contains the best next batch to attach to Copilot.

Optional environment overrides:

- `VISUAL_AI_REVIEW_MAX_DIMENSION` default `2000`
- `VISUAL_AI_REVIEW_TILE_SIZE` default `1600`
- `VISUAL_AI_REVIEW_TILE_OVERLAP` default `160`
- `VISUAL_AI_REVIEW_RESIZE_TOLERANCE_RATIO` default `1.12`
- `VISUAL_AI_REVIEW_MAX_BATCH_IMAGES` default `6`

---

## Stats

- **782+ commits** across 4 repositories
- **761+ source files** (268 TS/TSX, ~434 Java, 43 Python)
- **5 months** of development
