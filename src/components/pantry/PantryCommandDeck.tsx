import { motion } from 'framer-motion'
import { AlertTriangle, Package, Search, Sparkles } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from 'next-intl'

interface PantryCommandDeckProps {
	itemCount: number
	expiredCount: number
	expiringCount: number
	searchQuery: string
	onSearchChange: (value: string) => void
	showingCategory: string
	hasSuggestionsOpen: boolean
	onOpenSuggestions: () => void
	onClearExpired: () => void
	canClearExpired: boolean
	className?: string
	children: React.ReactNode
}

function StatCard({
	label,
	value,
	icon: Icon,
	tone,
}: {
	label: string
	value: string
	icon: React.ComponentType<{ className?: string }>
	tone: 'brand' | 'warning' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		warning: 'border-warning/20 bg-warning/8 text-warning',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-radius border border-border-subtle bg-bg-card p-2.5 shadow-card sm:rounded-xl sm:p-3'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-base font-black tabular-nums text-text-primary sm:text-lg'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1 sm:p-1.5', toneClass)}>
					<Icon className='size-3 sm:size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function PantryCommandDeck({
	itemCount,
	expiredCount,
	expiringCount,
	searchQuery,
	onSearchChange,
	showingCategory,
	hasSuggestionsOpen,
	onOpenSuggestions,
	onClearExpired,
	canClearExpired,
	className,
	children,
}: PantryCommandDeckProps) {
	const t = useTranslations('pantry')

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-success/8 p-3 shadow-card sm:p-4 md:rounded-2xl md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex flex-col gap-3 sm:mb-4 lg:flex-row lg:items-center lg:justify-between'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-success'>
						{t('commandEyebrow')}
					</p>
					<h2 className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						{t('commandHeading')}
					</h2>
				</div>
				<div className='grid w-full grid-cols-2 gap-2 lg:w-auto lg:flex'>
					<button
						type='button'
						onClick={onOpenSuggestions}
						className='inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-brand/20 bg-brand/8 px-3 py-2 text-sm font-semibold text-brand transition-all hover:bg-brand/12'
					>
						<Sparkles className='size-4' />
						{hasSuggestionsOpen ? t('suggestionsOpen') : t('whatCanICook')}
					</button>
					{canClearExpired && (
						<button
							type='button'
							onClick={onClearExpired}
							className='inline-flex min-h-9 items-center justify-center gap-2 rounded-xl border border-warning/20 bg-warning/8 px-3 py-2 text-sm font-semibold text-warning transition-all hover:bg-warning/12'
						>
							<AlertTriangle className='size-4' />
							{t('clearExpired', { count: expiredCount })}
						</button>
					)}
				</div>
			</div>

			<div className='mb-3 grid grid-cols-2 gap-2 lg:mb-4 lg:grid-cols-4'>
				<StatCard
					label={t('tracked')}
					value={itemCount.toString()}
					icon={Package}
					tone='muted'
				/>
				<StatCard
					label={t('expiring')}
					value={expiringCount.toString()}
					icon={AlertTriangle}
					tone={expiringCount > 0 ? 'warning' : 'muted'}
				/>
				<StatCard
					label={t('expiredStat')}
					value={expiredCount.toString()}
					icon={AlertTriangle}
					tone={expiredCount > 0 ? 'warning' : 'muted'}
				/>
				<StatCard
					label={t('currentFilter')}
					value={showingCategory}
					icon={Search}
					tone='brand'
				/>
			</div>

			<div className='mb-3 relative lg:mb-4'>
				<Search className='absolute left-4 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
				<input
					value={searchQuery}
					onChange={e => onSearchChange(e.target.value)}
					placeholder={t('searchPlaceholder')}
					aria-label={t('searchPlaceholder')}
					className='h-10 w-full rounded-xl border border-border-subtle bg-bg px-11 pr-3 text-sm text-text-primary placeholder:text-text-muted focus:border-brand focus:outline-none focus-visible:ring-1 focus-visible:ring-brand'
				/>
			</div>

			{children}
		</motion.section>
	)
}
