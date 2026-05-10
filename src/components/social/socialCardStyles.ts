import { cva } from 'class-variance-authority'

export const socialCardSurface = cva(
	'group relative overflow-hidden -mx-4 sm:mx-0 sm:rounded-2xl border-y sm:border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-bg-elevated/40 shadow-card transition-all duration-300 hover:border-border-medium hover:shadow-warm',
	{
		variants: {
			tone: {
				default: '',
				poll: 'to-info/6',
				recentCook: 'to-brand/8',
			},
		},
		defaultVariants: {
			tone: 'default',
		},
	},
)

export const socialCardTopAccent =
	'pointer-events-none absolute inset-x-0 top-0 hidden h-px bg-gradient-to-r from-transparent via-border-medium/50 to-transparent sm:block'

export const socialCardHeaderPadding = 'px-4 py-3.5 md:px-5 md:py-4'
export const socialCardBodyPadding = 'px-4 pb-4 md:px-5 md:pb-5'
