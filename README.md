# Chefkix — AI-Powered Social Cooking Platform

A microservice-based social platform where users share recipes, cook interactively with AI assistance, and progress through a Duolingo-inspired gamification system. Built across **9 repositories**, **7 backend services**, and **3 languages**.

> **This README documents the full system.** Individual service repos are linked below.

---

## Architecture

```
                            ┌──────────────────────────┐
                            │     Next.js 15 Client     │
                            │  React 19 · TypeScript    │
                            │  STOMP/WebSocket · Zustand │
                            └────────────┬─────────────┘
                                         │ HTTPS
                                         ▼
                ┌─────────────────────────────────────────────┐
                │         Spring Cloud API Gateway            │
                │     WebFlux · OAuth2 Resource Server        │
                │            Eureka Client                    │
                └──┬──────┬──────┬──────┬──────┬─────────────┘
                   │      │      │      │      │
         ┌─────────┘  ┌───┘  ┌───┘  ┌───┘  ┌───┘
         ▼            ▼      ▼      ▼      ▼
   ┌──────────┐ ┌────────┐ ┌────┐ ┌────┐ ┌──────────────┐
   │ Identity │ │ Recipe │ │Post│ │Chat│ │ Notification │
   │ Service  │ │Service │ │Svc │ │Svc │ │   Service    │
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
   │  MongoDB · Kafka · Keycloak · Eureka · Redis          │
   └──────────────────────────────────────────────────────┘
                         │
                         ▼
            ┌────────────────────────┐
            │   AI Service (Python)  │
            │   FastAPI · 7 LLMs    │
            │   Moderation · NLP    │
            │   Anti-Cheat · Enrich │
            └────────────────────────┘
```

---

## System Boundaries

| Service | Owns | Talks To | Protocol |
|---------|------|----------|----------|
| **Identity** | Users, profiles, friendships, social graph, leaderboards | Keycloak, Redis, MongoDB | REST, Feign |
| **Recipe** | Recipes, cooking sessions, challenges, interactions | AI Service, MongoDB, Cloudinary | REST, Feign |
| **Post** | Feed posts, comments, likes, saves, reports | MongoDB, Cloudinary | REST |
| **Chat** | Conversations, messages | MongoDB | WebSocket (STOMP) |
| **Notification** | Bell notifications, email delivery | Kafka (consumer), Brevo, MongoDB | Kafka, WebSocket |
| **AI Service** | Recipe NLP, content moderation, anti-cheat, enrichment | 7 LLM providers, Redis | REST |
| **API Gateway** | Routing, rate limiting, token validation | All services, Eureka, Keycloak | HTTP |

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

| Check | Detection | Example |
|-------|-----------|---------|
| Step spam | SequenceMatcher > 0.8 similarity between steps | Copy-pasting "stir" 20 times |
| Time inflation | Claimed time vs. technique time dictionary (40+ entries) | 3 hours for "chopping" |
| Fake techniques | Advanced technique without required context | "Sous vide" with no mention of immersion circulator |
| Difficulty inflation | Expert claim with < 10 steps or < 30 minutes | Claiming "expert" for toast |
| Ingredient-step mismatch | Steps > 3× ingredients | 30 steps with 2 ingredients |

If confidence drops below 0.7 or 2+ issues flag → AI escalation for semantic analysis.

---

## Design Decisions

**Why 7 separate microservices (not a monolith)?**
The chat service needs WebSocket persistence. The notification service is a Kafka consumer. The AI service is Python. These have fundamentally different runtime characteristics — a monolith would force the slowest deployment cycle on the fastest-changing service.

**Why Kafka for notifications (not direct REST)?**
Notifications are fire-and-forget from the producer's perspective. If the notification service is down, messages queue in Kafka and process when it recovers. The recipe service shouldn't block a user's cooking session because email is slow.

**Why 7 LLM providers instead of just one?**
Every free-tier provider has aggressive rate limits (Gemini: 5 RPM, Cohere: 1000/month). A single provider caps the system at ~5 concurrent AI features. Rotation across 7 gives ~355 RPM aggregate throughput at zero API cost.

**Why hybrid moderation (not pure AI)?**
AI moderation adds 1-3 seconds latency. The rules engine handles 80%+ of cases in < 5ms. AI only activates for the ambiguous middle band — this cuts average moderation latency by ~10x while maintaining safety.

**Why MongoDB (not PostgreSQL)?**
Recipes, posts, and chat messages have deeply nested, variable-shape documents (recipe steps with optional timers, sub-ingredients, technique tags). MongoDB's document model avoids the join explosion that relational modeling would require for these structures.

---

## Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Zustand, Framer Motion |
| **Backend** | Java 21, Spring Boot 3.3–3.5, Spring Cloud Gateway (WebFlux) |
| **AI Service** | Python 3.11, FastAPI, Pydantic v2, 7 LLM providers |
| **Auth** | Keycloak (OAuth2/OIDC), Google social login, JWT |
| **Messaging** | Apache Kafka |
| **Database** | MongoDB, Redis |
| **Real-time** | WebSocket/STOMP (chat), WebSocket (notifications) |
| **Infrastructure** | Docker Compose (10+ containers), Kubernetes, 7 GitHub Actions CI/CD pipelines |
| **Observability** | Structlog (JSON), SpringDoc OpenAPI/Swagger |

---

## Repositories

| Repo | Role | Language |
|------|------|----------|
| **[chefkix-fe](https://github.com/Leroy-sketch-png/chefkix-fe)** | Next.js frontend | TypeScript |
| [chefkix-be](https://github.com/NotTisn/chefkix-be) | Identity service | Java |
| [chefkix-recipe-service](https://github.com/NotTisn/chefkix-recipe-service) | Recipe service | Java |
| [chefkix-post-service](https://github.com/NotTisn/chefkix-post-service) | Post/feed service | Java |
| [chefkix-chat-service](https://github.com/NotTisn/chefkix-chat-service) | Real-time chat | Java |
| [chefkix-notification-service](https://github.com/NotTisn/chefkix-notification-service) | Notifications | Java |
| [chefkix-api-gateway](https://github.com/NotTisn/chefkix-api-gateway) | API Gateway | Java |
| [chefkix-ai-service](https://github.com/Leroy-sketch-png/chefkix-ai-service) | AI/ML service | Python |
| [chefkix-infrastructure](https://github.com/NotTisn/chefkix-infrastructure) | Docker/K8s configs | YAML/JS |

---

## Running Locally

```bash
# 1. Clone infrastructure and start backing services
git clone https://github.com/NotTisn/chefkix-infrastructure.git
cd chefkix-infrastructure
docker-compose up -d    # MongoDB, Kafka, Keycloak, Eureka

# 2. Start each Java service (in separate terminals)
cd chefkix-api-gateway && mvn spring-boot:run
cd chefkix-be && mvn spring-boot:run
cd chefkix-recipe-service && mvn spring-boot:run
# ... repeat for post, chat, notification services

# 3. Start AI service
cd chefkix-ai-service && .\run

# 4. Start frontend
cd chefkix-fe && npm install && npm run dev
```

**Service ports:** Gateway: 8888 | Identity: 8084 | Recipe: 8081 | Post: 8082 | Notification: 8083 | Chat: 8085 | AI: 8000 | Frontend: 3000

---

## Stats

- **782 commits** across 9 repositories
- **761+ source files** (268 TS/TSX, ~434 Java, 43 Python)
- **5 months** of development
- **7 CI/CD pipelines** (GitHub Actions)
