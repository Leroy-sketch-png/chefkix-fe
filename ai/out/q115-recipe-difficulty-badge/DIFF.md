# Q115 Cluster Diff

## Recipe Hero

- Added a typed `DIFFICULTY_BADGE_CLASSES` table containing complete opacity
  utilities for Beginner, Intermediate, Advanced, and Expert.
- Removed unused text/glow configuration and runtime `replace().concat()` class
  construction.
- Preserved the Beginner fallback and existing badge geometry.

## Ingredient Check Blast Radius

- Runtime review exposed eight Framer Motion warnings caused by interpolating
  semantic colors to literal `transparent` in the shared ingredient checkbox.
- Moved the binary color state to semantic CSS classes with `transition-colors`.
- Retained Framer Motion ownership of the checkmark entrance only.

## Regression Contracts

- Added a recipe-source contract for complete difficulty tokens and no runtime
  class surgery.
- Added an IngredientCheck contract preventing reintroduction of JS color
  interpolation at that boundary.
