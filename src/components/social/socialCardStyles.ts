import { cva } from 'class-variance-authority'

export const socialCardSurface = cva(
	'group relative overflow-hidden -mx-4 sm:mx-0 sm:rounded-2xl border-y sm:border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/40 shadow-card transition-all duration-300 hover:border-border-medium hover:shadow-warm',
	{
		variants: {
			tone: {
				default: '',
				poll: 'to-info/6 sm:border-l-2 sm:border-l-info/50',
				recentCook:
					'to-brand/8 sm:border-l-2 sm:border-l-brand/60 hover:shadow-[0_4px_24px_rgba(255,90,54,0.12)]',
				quickTip: 'to-success/6 sm:border-l-2 sm:border-l-success/50',
				battle:
					'to-error/7 sm:border-l-2 sm:border-l-error/60 hover:shadow-[0_4px_24px_rgba(239,68,68,0.1)]',
				group: 'to-accent-purple/6 sm:border-l-2 sm:border-l-accent-purple/50',
				recipeReview: 'to-warning/6 sm:border-l-2 sm:border-l-warning/50',
			},
		},
		defaultVariants: {
			tone: 'default',
		},
	},
)

/** Map PostType → card tone */
export const POST_TYPE_TO_TONE: Record<
	string,
	| 'default'
	| 'poll'
	| 'recentCook'
	| 'quickTip'
	| 'battle'
	| 'group'
	| 'recipeReview'
> = {
	PERSONAL: 'default',
	QUICK: 'default',
	POLL: 'poll',
	RECENT_COOK: 'recentCook',
	QUICK_TIP: 'quickTip',
	RECIPE_BATTLE: 'battle',
	GROUP: 'group',
	RECIPE_REVIEW: 'recipeReview',
}

export const socialCardTopAccent =
	'pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-border-medium/50 to-transparent sm:block'

export const socialCardHeaderPadding = 'px-4 py-3.5 md:px-5 md:py-4'
export const socialCardBodyPadding = 'px-4 pb-4 md:px-5 md:pb-5'
