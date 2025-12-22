/**
 * ChefKix Design System Enforcement
 *
 * This file contains patterns that should be caught during development.
 * Use in conjunction with ESLint's no-restricted-syntax rule.
 *
 * Add to eslint.config.mjs to enforce these patterns.
 */

// Arbitrary value patterns to forbid (regex patterns for ESLint)
export const FORBIDDEN_PATTERNS = {
	// Arbitrary widths
	arbitraryWidth: /w-\[\d+px\]/,
	// Arbitrary heights
	arbitraryHeight: /h-\[\d+px\]/,
	// Arbitrary text sizes
	arbitraryText: /text-\[\d+px\]/,
	// Arbitrary gaps/spacing
	arbitraryGap: /gap-\[\d+px\]/,
	// Arbitrary padding
	arbitraryPadding: /p[xytblr]?-\[\d+px\]/,
	// Arbitrary margins
	arbitraryMargin: /m[xytblr]?-\[\d+px\]/,
	// Arbitrary colors (hex)
	arbitraryColor: /(bg|text|border)-\[#[0-9a-fA-F]+\]/,
	// Legacy size patterns
	legacySize: /\b(h|w)-\d+\s+(h|w)-\d+\b/, // h-4 w-4 should be size-4
	// Hardcoded z-index
	hardcodedZIndex: /z-\d{2,}/,
}

// Allowed tokens (for reference and validation)
export const ALLOWED_TOKENS = {
	// Container widths
	containerWidths: [
		'max-w-container-sm', // 480px
		'max-w-container-md', // 600px
		'max-w-container-lg', // 800px
		'max-w-container-xl', // 1000px
		'max-w-container-form', // 900px
	],

	// Layout widths
	layoutWidths: [
		'w-nav', // 80px - sidebar
		'w-right', // 280px - right panel
		'w-drawer', // 400px - drawer
	],

	// Icon sizes (use size-* for square icons)
	iconSizes: [
		'size-4', // 16px - inline icons
		'size-5', // 20px - button icons
		'size-6', // 24px - standard icons
		'size-8', // 32px - large icons
		'size-10', // 40px - xl icons
		'size-12', // 48px - 2xl icons
		'size-icon-sm', // 18px - semantic
		'size-icon-md', // 22px - semantic
		'size-icon-lg', // 28px - semantic
		'size-icon-xl', // 32px - semantic
	],

	// Avatar sizes
	avatarSizes: [
		'size-avatar-xs', // 32px
		'size-avatar-sm', // 42px
		'size-avatar-md', // 72px
		'size-avatar-lg', // 100px
		'size-avatar-xl', // 120px
	],

	// Spacing tokens
	spacing: [
		'gap-1',
		'gap-2',
		'gap-3',
		'gap-4',
		'gap-5',
		'gap-6',
		'gap-8',
		'gap-10',
		'gap-12',
		'gap-xs',
		'gap-sm',
		'gap-md',
		'gap-lg',
		'gap-xl',
		'gap-2xl',
		'gap-3xl',
		'p-1',
		'p-2',
		'p-3',
		'p-4',
		'p-5',
		'p-6',
		'p-8',
		'p-10',
		'p-12',
		'm-1',
		'm-2',
		'm-3',
		'm-4',
		'm-5',
		'm-6',
		'm-8',
		'm-10',
		'm-12',
	],

	// Text sizes
	textSizes: [
		'text-2xs',
		'text-xs',
		'text-sm',
		'text-caption',
		'text-label',
		'text-base',
		'text-lg',
		'text-xl',
		'text-2xl',
		'text-3xl',
	],

	// Background colors
	backgrounds: [
		'bg-bg',
		'bg-bg-page',
		'bg-bg-card',
		'bg-bg-elevated',
		'bg-bg-hover',
		'bg-bg-input',
		'bg-brand',
		'bg-brand-subtle',
		'bg-gradient-hero',
		'bg-gradient-brand',
	],

	// Text colors
	textColors: [
		'text-text',
		'text-text-primary',
		'text-text-secondary',
		'text-text-tertiary',
		'text-text-muted',
		'text-brand',
		'text-xp',
		'text-streak',
		'text-level',
	],

	// Border colors
	borderColors: [
		'border-border',
		'border-border-subtle',
		'border-border-medium',
		'border-border-strong',
	],

	// Z-index (semantic)
	zIndex: [
		'z-base',
		'z-dropdown',
		'z-sticky',
		'z-modal',
		'z-notification',
		'z-tooltip',
	],

	// Shadows
	shadows: [
		'shadow-sm',
		'shadow-md',
		'shadow-lg',
		'shadow-card',
		'shadow-warm',
		'shadow-glow',
	],

	// Border radius
	borderRadius: [
		'rounded-sm',
		'rounded-radius',
		'rounded-lg',
		'rounded-xl',
		'rounded-2xl',
		'rounded-full',
	],
}

// Motion presets that must be used (from @/lib/motion)
export const MOTION_PRESETS = {
	transitions: ['TRANSITION_SPRING', 'TRANSITION_SMOOTH', 'TRANSITION_BOUNCY'],
	hovers: [
		'BUTTON_HOVER',
		'BUTTON_SUBTLE_HOVER',
		'CARD_HOVER',
		'CARD_FEED_HOVER',
		'CARD_GRID_HOVER',
		'ICON_BUTTON_HOVER',
		'IMAGE_ZOOM_HOVER',
		'LIST_ITEM_HOVER',
	],
	taps: ['BUTTON_TAP', 'BUTTON_SUBTLE_TAP', 'ICON_BUTTON_TAP', 'LIST_ITEM_TAP'],
	animations: [
		'staggerContainer',
		'staggerItem',
		'FADE_IN_VARIANTS',
		'SCALE_IN_VARIANTS',
		'SLIDE_IN_VARIANTS',
	],
}

// Required component patterns
export const REQUIRED_PATTERNS = {
	// All pages must use these wrappers
	pageWrappers: ['PageTransition', 'PageContainer'],

	// Primary nav pages (NO back button)
	primaryPages: [
		'/dashboard',
		'/explore',
		'/challenges',
		'/community',
		'/create',
		'/messages',
		'/profile',
		'/settings',
	],

	// Secondary pages (MUST have back button)
	secondaryPages: [
		'/notifications',
		'/search',
		'/leaderboard',
		'/creator',
		'/creator/recipes',
		'/recipes/[id]',
		'/recipes/[id]/edit',
		'/post/new',
		'/profile/badges',
		'/[userId]',
	],

	// Page header pattern elements
	headerElements: {
		iconBox: 'flex size-12 items-center justify-center rounded-2xl',
		title: 'text-3xl font-bold text-text',
		subtitle: 'flex items-center gap-2 text-text-secondary',
	},
}

// Console warnings for development
export const DEV_WARNINGS = {
	arbitraryValue: (value: string) =>
		`⚠️ DESIGN SYSTEM VIOLATION: Arbitrary value "${value}" detected. Use a design token instead.`,

	legacyPattern: (pattern: string) =>
		`⚠️ DESIGN SYSTEM VIOLATION: Legacy pattern "${pattern}" detected. Use modern size-* utility.`,

	missingPageWrapper: (page: string) =>
		`⚠️ DESIGN SYSTEM VIOLATION: Page "${page}" missing PageTransition or PageContainer wrapper.`,

	wrongBackButton: (page: string, hasBack: boolean) =>
		`⚠️ DESIGN SYSTEM VIOLATION: Page "${page}" ${hasBack ? 'should NOT' : 'MUST'} have a back button.`,
}

// Export all rules as named export for use in scripts
export const DesignSystemRules = {
	FORBIDDEN_PATTERNS,
	ALLOWED_TOKENS,
	MOTION_PRESETS,
	REQUIRED_PATTERNS,
	DEV_WARNINGS,
}
