/**
 * Design System Rules — enforcement patterns for ChefKix UI.
 * Referenced in `.github/copilot-instructions.md`.
 *
 * These patterns define FORBIDDEN and ALLOWED tokens.
 * Linting tools and AI agents use these to catch violations.
 */

// ────────────────────────────────────────────────
// FORBIDDEN PATTERNS (reject in code review)
// ────────────────────────────────────────────────
export const FORBIDDEN_PATTERNS = [
	// Arbitrary Tailwind values
	{
		pattern: /w-\[\d+px\]/,
		message: 'Use design token instead of arbitrary width',
	},
	{
		pattern: /h-\[\d+px\]/,
		message: 'Use design token instead of arbitrary height',
	},
	{
		pattern: /text-\[#[a-fA-F0-9]+\]/,
		message: 'Use semantic color token (text-text, text-text-secondary, etc.)',
	},
	{
		pattern: /bg-\[#[a-fA-F0-9]+\]/,
		message: 'Use semantic bg token (bg-bg, bg-bg-card, bg-bg-elevated, etc.)',
	},
	{
		pattern: /border-\[#[a-fA-F0-9]+\]/,
		message: 'Use border-border-subtle or border-brand',
	},

	// Generic shadows (use semantic tokens)
	{ pattern: /\bshadow-sm\b/, message: 'Use shadow-card instead of shadow-sm' },
	{
		pattern: /\bshadow-md\b/,
		message: 'Use shadow-card or shadow-warm instead of shadow-md',
	},
	{ pattern: /\bshadow-lg\b/, message: 'Use shadow-warm instead of shadow-lg' },

	// Arbitrary z-index (use tokens)
	{
		pattern: /z-\[\d+\]/,
		message: 'Use z-modal, z-tooltip, z-dropdown, z-sticky, z-notification',
	},

	// External CDN images
	{
		pattern: /pravatar\.cc|picsum\.photos|via\.placeholder/,
		message: 'Use local placeholder assets, never external CDNs',
	},

	// Legacy icon sizing
	{
		pattern: /\bh-4 w-4\b/,
		message: 'Use size-4 (modern) instead of h-4 w-4 (legacy)',
	},
	{ pattern: /\bh-5 w-5\b/, message: 'Use size-5 instead of h-5 w-5' },
	{ pattern: /\bh-6 w-6\b/, message: 'Use size-6 instead of h-6 w-6' },

	// Fake loading
	{
		pattern: /setTimeout\([^)]*setIsLoading\(false\)/,
		message: 'Never fake loading — show real data or disable the feature',
	},
] as const

// ────────────────────────────────────────────────
// ALLOWED TOKENS (use these instead)
// ────────────────────────────────────────────────
export const ALLOWED_TOKENS = {
	backgrounds: [
		'bg-bg',
		'bg-bg-card',
		'bg-bg-elevated',
		'bg-bg-sunken',
		'bg-brand',
	],
	text: ['text-text', 'text-text-secondary', 'text-text-muted', 'text-brand'],
	borders: ['border-border-subtle', 'border-brand', 'border-border'],
	shadows: ['shadow-card', 'shadow-warm', 'shadow-glow'],
	zIndex: ['z-modal', 'z-tooltip', 'z-dropdown', 'z-sticky', 'z-notification'],
	spacing: ['gap-sm', 'gap-md', 'gap-lg', 'p-4', 'p-6', 'p-8'],
	sizes: [
		'size-4',
		'size-5',
		'size-6',
		'size-8',
		'size-icon-lg',
		'size-avatar-sm',
	],
	containers: ['max-w-container-lg', 'max-w-container-xl'],
	radii: ['rounded-radius'],
	motion: [
		'transition-all duration-300',
		'TRANSITION_SPRING',
		'CARD_HOVER',
		'BUTTON_HOVER',
	],
} as const

// ────────────────────────────────────────────────
// COMPONENT PATTERNS (canonical)
// ────────────────────────────────────────────────
export const COMPONENT_PATTERNS = {
	card: 'group rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card transition-all duration-300 hover:shadow-warm md:p-6',
	input:
		'rounded-md border border-border-subtle bg-bg-card px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30',
	button: {
		primary: 'bg-brand text-white hover:bg-brand-hover',
		secondary: 'bg-bg-elevated text-text hover:bg-bg-card',
		ghost: 'hover:bg-bg-elevated text-text-secondary',
	},
	badge:
		'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
} as const

// ────────────────────────────────────────────────
// PAGE CLASSIFICATION
// ────────────────────────────────────────────────
export const PRIMARY_PAGES = [
	'/dashboard',
	'/explore',
	'/challenges',
	'/community',
	'/create',
	'/messages',
	'/profile',
	'/settings',
] as const

// Primary pages: NO back button (user navigates away via sidebar)
// Secondary pages (everything else): MUST have back button
