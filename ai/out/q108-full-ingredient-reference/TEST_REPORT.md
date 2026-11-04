# Q108 Full Cooking Ingredient Reference - Verification Report

Date: 2026-08-04

## Result

IMPLEMENTED - VERIFIED E2 + OWNER-PREVIEW E3. Physical real-cooking E3 remains open.

Cooking Mode now exposes the complete canonical ingredient list from every step without turning the reference into a second checklist authority. Prep also renders the full scrollable list instead of truncating at eight items.

## AoE Rinse

### Pass 1 - Epicenter

- Added a persistent All Ingredients command beside step progress.
- Added a viewport-bounded Radix dialog with quantity, unit, name, and `As needed` fallback.
- Removed prep's eight-item slice and inert remainder label.

### Pass 2 - Blast Radius

- Guarded the player keyboard handler while the dialog owns focus and Escape.
- Reset dialog state when the cooking player closes.
- Normalized prep interpolation so missing quantity or unit does not leave awkward spaces.
- Hid the command when no canonical ingredients exist.

### Pass 3 - Systemic Sweep

- Traced full-list, per-step checklist, preview, active-session, keyboard, dialog, and co-cooking ownership.
- Preserved per-step checklist completion as a distinct interaction; the complete reference is intentionally read-only.
- Preserved timers, audio, navigation, co-cooking, recipe data, and persistence contracts.
- Owner-only preview was not bypassed for visual proof.

## Executable Evidence

- Focused plus adjacent Jest: 2 suites, 11 tests passed.
- Long-list test renders 24 ingredients inside the dialog viewport.
- Full frontend Jest: 132 suites, 538 tests passed.
- TypeScript: passed.
- ESLint: passed with zero warnings or errors.
- Prettier: passed.
- Source sweep finds no production `.slice(0, 8)` or `moreIngredients` cooking path.
- Production build: compiled successfully; 53/53 static pages generated.
- Agent OS: 123/123 passed before execution.
- `git diff --check`: passed.

The first production-build command exceeded its 10-minute harness bound without producing a result. No active compiler remained. An exact-source rerun under a longer bound completed successfully in 535.9 seconds; the initial timeout is retained rather than hidden.

## Open Evidence

- Physical Chrome/device use, kitchen-distance readability, dark-mode perception, and representative-cook preference remain E3 UNKNOWN.
- Owner preview was reached through normal `chef_minh` fixture login and the recipe's existing `Preview cooking` action. Login metadata and transient presence traffic occurred as normal; no cooking-session, recipe, checklist, timer, or XP write was made. The recipe page also issued its existing ingredient-link lookup and difficulty-calibration requests.

## Runtime E3 Update (2026-10-22)

- Used the owned six-step `Pho Bo Ha Noi` fixture (10 canonical ingredients; zero per-step ingredient mappings) in the local-only owner preview. Preview persistence remained `session: null`, `recipe: null`; exiting through the preview's Leave Session confirmation restored that state. No timer was started and no cook step was completed.
- Reproduced and fixed a real keyboard defect: Escape closed both the Radix ingredient dialog and the cooking player. Radix dismissed during the document event path; the React state update rebound the window-bubble handler before it ran. A capture-phase marker stored in a stable ref now preserves ownership of that same Escape event, allowing Radix to close the dialog while the player stays open. The marker's stable-ref contract is covered in the focused test.
- Live preview at 320x800, 390x844, 768x900, and 1440x900: command visible on steps 1 and 2; dialog showed all 10 ingredients with their quantity/unit; settled dialog bounds stayed inside the viewport; document width equaled viewport width; Escape dismissed only the dialog. Preview exited locally and persisted session/recipe remained null.
- Screenshots: `%TEMP%\\q108-settled-320.png`, `%TEMP%\\q108-settled-1440.png`.
- Post-fix checks: cooking directory 5 suites/10 tests passed; TypeScript passed; ESLint passed with zero warnings/errors; Prettier passed. No page or console errors were observed during the focused Escape verification; the final settled-viewport pass did not separately record HTTP status codes.
- This is local browser/device-emulation evidence, not physical hardware, real-kitchen distance, dark-mode, active-session, or representative-user evidence.

## Production Bundle Follow-up (2026-10-22)

- `dev.bat -PrepareDemo` rebuilt the production frontend after detecting a stale source fingerprint. Its final Git-policy gate returned NO-GO on existing branch, dirty-tree, and divergence findings across the root and nested repositories; no Git state was changed.
- Authenticated `chef_minh` reached the existing owner flow through Manage > Preview cooking on `localhost:3000`. The dialog showed all ten ingredients. Once its exit animation settled, Escape closed only the ingredient dialog; Preview Mode and All ingredients remained available.
- No page errors, console errors, or HTTP >=400 responses were observed. The existing preview persisted `session:null` and `recipe:null` after exit. Observed non-GET requests were presence heartbeat, ingredient-link lookup, and difficulty calibration; no cooking-session or recipe mutation was observed.
- An initial assertion ran before the Radix exit animation completed and was discarded. The settled-state rerun passed. Strict demo smoke then passed 131/131; all nine services were UP; `verify-agent-os.ps1 -Quiet` passed.
- This verifies the rebuilt local production bundle, not physical-device input, real-kitchen readability, dark-mode perception, active-session preservation, or representative-cook preference.
