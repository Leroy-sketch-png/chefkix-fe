// Shared components barrel export
// EmptyStateGamified has FOMO stats, animated illustrations, preset variants
// For simpler empty states, use @/components/ui/empty-state
export {
	EmptyState as EmptyStateGamified,
	EmptyFeed,
	EmptyCookingHistory,
	EmptySaved,
	EmptyNotifications,
	AllCaughtUp,
	type EmptyStateVariant,
	type EmptyStateProps,
	type QuickAction,
} from './EmptyStateGamified'
export {
	FilterBar,
	ActiveFilters,
	FilterPanel,
	FilterSection,
	CheckboxFilter,
	RadioFilter,
	RatingFilter,
	MultiSelectFilter,
	CuisinePill,
	DIETARY_OPTIONS,
	CUISINE_OPTIONS,
	DIFFICULTY_OPTIONS,
} from './FilterSort'
export { KeyboardShortcuts } from './KeyboardShortcuts'
export { default as LottieAnimation } from './LottieAnimation'
export { RecipeFiltersSheet } from './RecipeFiltersSheet'
// Note: MobileBottomNav is in layout folder, not here
// EmptyState here is gamified version with FOMO stats - simpler version is in ui/empty-state.tsx
