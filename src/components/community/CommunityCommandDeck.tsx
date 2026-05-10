import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Compass, Trophy, UserPlus, Users, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'

type CommunityTab = 'discover' | 'friends' | 'groups' | 'leaderboard'

interface CommunityCommandDeckProps {
	activeTab: CommunityTab
	onTabChange: (tab: CommunityTab) => void
	isAuthenticated: boolean
	counts: {
		friends: number
		followers: number
		suggested: number
		leaderboard: number
	}
	className?: string
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
	tone: 'brand' | 'xp' | 'social' | 'muted'
}) {
	const toneClass = {
		brand: 'border-brand/20 bg-brand/8 text-brand',
		xp: 'border-xp/20 bg-xp/8 text-xp',
		social: 'border-error/20 bg-error/8 text-error',
		muted: 'border-border-subtle bg-bg-elevated text-text-muted',
	}[tone]

	return (
		<div className='rounded-xl border border-border-subtle bg-bg-card p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-[10px] font-bold uppercase tracking-[0.14em] text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-xl font-black tabular-nums text-text-primary'>
						{value}
					</p>
				</div>
				<div className={cn('rounded-md border p-1.5', toneClass)}>
					<Icon className='size-3.5' />
				</div>
			</div>
		</div>
	)
}

export function CommunityCommandDeck({
	activeTab,
	onTabChange,
	isAuthenticated,
	counts,
	className,
}: CommunityCommandDeckProps) {
	const t = useTranslations('community')
	const hasMeaningfulStats =
		counts.friends > 0 ||
		counts.followers > 0 ||
		counts.suggested > 0 ||
		counts.leaderboard > 0

	const tabs: {
		id: CommunityTab
		label: string
		icon: React.ComponentType<{ className?: string }>
		show: boolean
		count?: number
	}[] = [
		{ id: 'discover', label: t('discover'), icon: Compass, show: true },
		{
			id: 'friends',
			label: t('friends'),
			icon: Users,
			show: isAuthenticated,
			count: counts.friends,
		},
		{
			id: 'groups',
			label: t('groups'),
			icon: UsersRound,
			show: isAuthenticated,
		},
		{
			id: 'leaderboard',
			label: t('leaderboard'),
			icon: Trophy,
			show: true,
			count: counts.leaderboard,
		},
	]

	const visibleTabs = tabs.filter(
		tab => tab.show && !(activeTab === 'discover' && tab.id === 'discover'),
	)
	const shouldShowTabRow = !(activeTab === 'discover' && !isAuthenticated)

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						{t('cmdEyebrow')}
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						{t('cmdHeading')}
					</h2>
				</div>
				<div className='hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand sm:inline-flex'>
					<UserPlus className='size-3.5' />
					{t('cmdChip')}
				</div>
			</div>

			<div className='mb-3 rounded-xl border border-brand/15 bg-brand/6 px-3 py-2.5 sm:mb-4 sm:p-3'>
				{activeTab === 'discover' ? (
					<p className='text-sm font-semibold text-text-primary'>
						{t('discoverModeHint')}
					</p>
				) : (
					<div className='flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between'>
						<div>
							<p className='text-sm font-semibold text-text-primary'>
								{t('searchFirstHint')}
							</p>
							<p className='mt-0.5 text-xs text-text-secondary'>
								{t('searchFirstHintDesc')}
							</p>
						</div>
						<button
							type='button'
							onClick={() => onTabChange('discover')}
							className='inline-flex min-h-10 items-center justify-center gap-2 rounded-full border border-brand/25 bg-bg-card px-4 py-2 text-sm font-semibold text-brand shadow-card transition-all hover:-translate-y-0.5 hover:border-brand/40 hover:bg-brand/8'
						>
							<Compass className='size-4' />
							{t('openDiscover')}
						</button>
					</div>
				)}
			</div>

			{hasMeaningfulStats && (
				<div className='mb-4 grid grid-cols-2 gap-2 lg:grid-cols-4'>
					<StatCard
						label={t('friends')}
						value={counts.friends.toString()}
						icon={Users}
						tone='social'
					/>
					<StatCard
						label={t('statFollowBacks')}
						value={counts.followers.toString()}
						icon={UserPlus}
						tone={counts.followers > 0 ? 'brand' : 'muted'}
					/>
					<StatCard
						label={t('statSuggested')}
						value={counts.suggested.toString()}
						icon={Compass}
						tone='muted'
					/>
					<StatCard
						label={t('leaderboard')}
						value={counts.leaderboard.toString()}
						icon={Trophy}
						tone='xp'
					/>
				</div>
			)}

			{shouldShowTabRow && (
				<div
					className={cn(
						'grid gap-2 sm:flex sm:flex-wrap',
						visibleTabs.length === 1 ? 'grid-cols-1' : 'grid-cols-2',
					)}
				>
					{visibleTabs.map(tab => {
						const Icon = tab.icon
						const isActive = activeTab === tab.id
						return (
							<button
								type='button'
								key={tab.id}
								onClick={() => onTabChange(tab.id)}
								className={cn(
									'inline-flex min-h-10 items-center justify-center gap-2 rounded-full border px-3.5 py-2 text-xs font-semibold transition-all sm:text-sm',
									isActive
										? 'border-brand/25 bg-brand/10 text-brand'
										: 'border-border-subtle bg-bg-elevated text-text-secondary hover:bg-bg-hover hover:text-text-primary',
								)}
							>
								<Icon className='size-3.5' />
								{tab.label}
								{typeof tab.count === 'number' && tab.count > 0 && (
									<span className='rounded-full bg-bg-card px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-text-muted'>
										{tab.count}
									</span>
								)}
							</button>
						)
					})}
				</div>
			)}
		</motion.section>
	)
}
