'use client'

import { cn } from '@/lib/utils'
import { MagicCard } from '@/components/ui/magic-card'

// ── Types ──────────────────────────────────────────────────────────────
interface BentoGridProps {
	children: React.ReactNode
	/** Override default column count (default: auto-2-col grid) */
	className?: string
}

type BentoCardProps = React.ComponentPropsWithoutRef<typeof MagicCard> & {
	children: React.ReactNode
	/** Span columns: 1 (default) or 2 */
	colSpan?: 1 | 2
	/** Span rows: 1 (default) or 2 */
	rowSpan?: 1 | 2
	className?: string
}

// ── Components ─────────────────────────────────────────────────────────

/**
 * BentoGrid — 2-column adaptive grid for dashboard stat layouts.
 * Adapted from ui_lab BentoGrid, using ChefKix design tokens.
 * Default auto-row height 140px for dashboard density.
 */
export function BentoGrid({ children, className }: BentoGridProps) {
	return (
		<div
			className={cn(
				'grid auto-rows-[minmax(140px,_1fr)] grid-cols-2 gap-3',
				className,
			)}
		>
			{children}
		</div>
	)
}

/**
 * BentoCard — a single cell inside BentoGrid.
 * Uses ChefKix semantic tokens (bg-bg-card, border-border-subtle, shadow-card).
 * Upgraded to MagicCard frosted spotlights for Steve Jobs-level interactive UI.
 */
export function BentoCard({
	children,
	colSpan = 1,
	rowSpan = 1,
	className,
	...props
}: BentoCardProps) {
	return (
		<MagicCard
			mode='gradient'
			className={cn(
				'group relative overflow-hidden rounded-2xl border-none bg-bg-card/75 backdrop-blur-md shadow-card transition-shadow duration-200 hover:shadow-warm',
				colSpan === 2 && 'col-span-2',
				rowSpan === 2 && 'row-span-2',
				className,
			)}
			{...props}
		>
			{children}
		</MagicCard>
	)
}
