/**
 * Layout Constants — Semantic tokens for layout dimensions, z-index, and breakpoints.
 *
 * Adapted from .tmp stash. Provides a single source of truth for layout
 * dimensions used across sidebar, header, container, and mobile nav components.
 *
 * Usage: Import constants instead of hardcoding magic numbers in layout components.
 *
 * @example
 * import { Z_INDEX, SIDEBAR, HEADER, CONTAINER } from '@/lib/layout-constants'
 * style={{ zIndex: Z_INDEX.modal }}
 */

// ─── Z-Index Scale ───────────────────────────────────────
// Semantic layers — never use arbitrary z-values. Pick a layer.
export const Z_INDEX = {
	/** Default content (0) */
	base: 0,
	/** Dropdowns, popovers, tooltips (10) */
	dropdown: 10,
	/** Sticky headers, sidebars (20) */
	sticky: 20,
	/** Overlays, backdrops (30) */
	overlay: 30,
	/** Modal dialogs (40) */
	modal: 40,
	/** Toast notifications (50) */
	notification: 50,
	/** Tooltips that must be above everything (60) */
	tooltip: 60,
} as const

// ─── Sidebar ────────────────────────────────────────────
export const SIDEBAR = {
	/** Expanded sidebar width in px */
	expandedWidth: 256,
	/** Collapsed (icon-only rail) width in px */
	collapsedWidth: 80,
	/** Breakpoint below which sidebar becomes overlay */
	mobileBreakpoint: 768,
	/** Keyboard shortcut to toggle */
	toggleShortcut: 'Ctrl+B',
	/** localStorage key for persisting collapsed state */
	storageKey: 'sidebar-collapsed',
} as const

// ─── Header ─────────────────────────────────────────────
export const HEADER = {
	/** Standard header height in px */
	height: 64,
	/** Compact header height (scrolled state) */
	compactHeight: 48,
} as const

// ─── Container Widths ────────────────────────────────────
// Maps to Tailwind max-w-* classes — used by PageContainer
export const CONTAINER = {
	xs: 512,
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
	full: Infinity,
} as const

// ─── Breakpoints ─────────────────────────────────────────
// Mirrors Tailwind defaults — use for JS-side responsive logic
export const BREAKPOINTS = {
	sm: 640,
	md: 768,
	lg: 1024,
	xl: 1280,
	'2xl': 1536,
} as const

// ─── Spacing Scale ───────────────────────────────────────
// Section-level spacing for page rhythm
export const SECTION_SPACING = {
	/** Horizontal page padding */
	pagePadding: 'px-4 md:px-6 lg:px-8',
	/** Vertical section gap (between major page sections) */
	sectionGap: 'py-12 md:py-16 lg:py-20',
	/** Compact section gap */
	sectionGapCompact: 'py-8 md:py-10 lg:py-12',
	/** Content area vertical padding */
	contentPadding: 'py-6 md:py-8',
} as const

// ─── Mobile Bottom Nav ───────────────────────────────────
export const MOBILE_NAV = {
	/** Height in px (excluding safe area) */
	height: 64,
	/** Add this to body/main bottom padding on mobile to prevent content clipping */
	safeOffset: 'pb-20 md:pb-0',
} as const
