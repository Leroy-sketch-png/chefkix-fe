# Q116 Cluster Diff

## Creator Commands

- Manual and AI-assisted recipe editors now use `Preview cooking` with Play.
- Published-recipe management uses the same wording and icon.
- All three retain `startPreviewCooking(...)` followed by
  `expandCookingPanel()`.
- The AI-assisted command now has the same visible keyboard focus treatment as
  the manual editor command.

## Catalog Authority

- `recipe.formTestPlay` and `recipe.aiFlowTestPlay` became one
  `recipe.previewCooking` key.
- `recipeDetail.testCook` and `recipeDetail.testCookPreview` became one
  `recipeDetail.previewCooking` key.
- `create.previewRecipe` was preserved after the first focused test exposed that
  it belongs to a different namespace than SCOPE's proposed deletion cluster.

## Regression Contract

- Locks copy, icon, command wiring, panel expansion, preview disclosure, removed
  QA keys, and the preserved `create.previewRecipe` boundary.
