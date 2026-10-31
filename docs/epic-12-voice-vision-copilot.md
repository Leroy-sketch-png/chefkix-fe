# Epic 12 — Voice-Vision Copilot

## Scope

Epic 12 adds a reviewable client flow for the future Leader orchestration service:

`wake word + voice command + optional camera frame → VLM + Graph-RAG → answer + TTS + interventions`

The frontend does not fabricate an AI result. Until `NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT` is set, the UI shows an explicit `integration-pending` state.

## Endpoint contract

Set `NEXT_PUBLIC_VOICE_COPILOT_ENDPOINT` to the Leader-published endpoint. The client sends JSON:

```json
{
	"command": "what should I watch for?",
	"frameDataUrl": "data:image/jpeg;base64,...",
	"context": {
		"recipeId": "optional",
		"recipeTitle": "optional",
		"currentStep": 3,
		"currentStepInstruction": "optional"
	}
}
```

The response adapter accepts `data` envelopes and normalizes these fields:

```json
{
	"answer": "...",
	"speechText": "...",
	"interventions": [
		{
			"id": "oil-too-hot",
			"severity": "warning",
			"title": "Check the pan",
			"message": "...",
			"suggestedAction": "...",
			"source": "vision-perception"
		}
	],
	"evidence": [
		{
			"id": "graph-1",
			"label": "Sautéing",
			"source": "recipe-graph",
			"confidence": 0.91
		}
	],
	"requestId": "optional"
}
```

## Behavior guarantees

- Continuous cooking voice mode only executes after `Hey ChefKix`; wake-word-only speech arms the listener for eight seconds.
- Push-to-talk cooking commands retain their existing behavior and do not require a wake word.
- Front and back camera capture are available in the copilot preview.
- TTS speaks the normalized `speechText` response when supported.
- Every returned intervention is rendered with severity and an optional next action.
- Missing or unavailable Leader integration is visible and actionable; it is never presented as a successful AI answer.
