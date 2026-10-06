# Epic 8: Photo intelligence integration handoff

The scan UI is wired to stable same-origin adapters and does not invent recipe matches when the Lead services are unavailable.

## Request protection and limits

The three same-origin photo routes require a bearer token that the monolith validates at its authenticated profile endpoint. The token is not forwarded to the detector or retrieval provider. Photo uploads are capped at 10 MiB; ingredient matching accepts at most 100 names, each at most 120 characters, within a 32 KiB JSON body. Client aborts propagate to the provider fetch, which also has a 30-second timeout. A timed-out provider returns 504; an unavailable or invalid provider response remains an error and is never replaced with mock output.

Provider-specific service credentials and production endpoint acceptance are deployment handoff requirements; this proxy's user-session check does not authenticate the external model provider.

## Environment variables

Configure these on the Next.js server when the corresponding Lead endpoints are published:

```text
INGREDIENT_DETECTION_BACKEND_URL=<YOLOv8 ONNX detection endpoint>
HGAT_RECIPE_MATCH_BACKEND_URL=<HGAT ingredient-to-recipe endpoint>
CROSS_MODAL_RETRIEVAL_BACKEND_URL=<CLIP photo-to-recipe endpoint>
```

When an Epic 8 endpoint is not configured, the UI receives a `503` response with `code: INTEGRATION_PENDING` and presents a human-readable waiting state. Demo detection is available only when `NEXT_PUBLIC_INGREDIENT_DETECTION_MOCK=true` is explicitly enabled for local demonstrations.

## HGAT request/response

`POST /api/photo-intelligence/ingredient-recipes`

```json
{ "ingredients": ["tomato", "basil"] }
```

The adapter accepts `matches`, `results`, or `recipes` from the upstream response and normalizes each item to:

```json
{
	"recipeId": "recipe-123",
	"recipeTitle": "Example recipe",
	"matchScore": 0.87,
	"matchedIngredients": ["tomato"],
	"missingIngredients": ["basil"]
}
```

Scores can be sent as either `0..1` or percentages. Snake_case and camelCase field names are supported at the adapter boundary.

## CLIP request/response

`POST /api/photo-intelligence/dish-retrieval` with a multipart `image` field. The response uses the same normalized match shape, so the UI can display visually similar recipes without a second presentation contract.

## UI coverage

- Ingredient detections show names and confidence scores, with the detector source labeled as live or demo.
- HGAT matches show the number of recipes, match scores, matched ingredients, and missing ingredients.
- Each missing ingredient opens the existing substitution flow, including compound evidence and allergen safety status when those services return it.
- Dish-photo retrieval is isolated in its own component and is ready for the CLIP endpoint.
