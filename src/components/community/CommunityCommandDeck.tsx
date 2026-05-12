import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Compass, Trophy, UserPlus, Users, UsersRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SlideTabs } from '@/components/ui/slide-tabs'

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
	const heading = isAuthenticated ? t('cmdHeading') : t('guestCmdHeading')
	const chipLabel = isAuthenticated ? t('cmdChip') : t('guestCmdChip')
	const hasMeaningfulStats =
		counts.friends > 0 ||
		counts.followers > 0 ||
		counts.suggested > 0 ||
		counts.leaderboard > 0
	const shouldShowStatGrid = isAuthenticated && hasMeaningfulStats

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

	const visibleTabs = tabs.filter(tab => tab.show)
	const shouldShowTabRow = visibleTabs.length > 1
	const statusMessage =
		activeTab === 'discover'
			? isAuthenticated
				? t('discoverModeHint')
				: t('guestDiscoverModeHint')
			: t('searchFirstHintDesc')

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-brand/6 p-3 shadow-card sm:p-4 md:p-5',
				className,
			)}
		>
			<div className='mb-3 flex items-start justify-between gap-2 sm:mb-4 sm:items-center sm:gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
						{t('cmdEyebrow')}
					</p>
					<h2 className='mt-1 text-base font-black text-text-primary sm:text-lg'>
						{heading}
					</h2>
				</div>
				<div className='hidden shrink-0 items-center gap-1 whitespace-nowrap rounded-full border border-brand/20 bg-brand/8 px-3 py-1.5 text-xs font-semibold text-brand sm:inline-flex'>
					<UserPlus className='size-3.5' />
					{chipLabel}
				</div>
			</div>

			<div className='mb-3 flex flex-col gap-3 sm:mb-4'>
				<p className='max-w-2xl text-sm leading-6 text-text-secondary'>
					{statusMessage}
				</p>

				{shouldShowTabRow && (
					<div className='min-w-0'>
						<SlideTabs
							tabs={visibleTabs.map(tab => {
								const Icon = tab.icon
								const isActive = activeTab === tab.id

								return {
									id: tab.id,
									label: tab.label,
									icon: (
										<Icon
											className={cn(
												'size-3.5',
												isActive
													? tab.id === 'leaderboard'
														? 'text-xp'
														: 'text-brand'
													: 'text-text-muted',
											)}
										/>
									),
								}
							})}
							activeTab={activeTab}
							onTabChange={value => onTabChange(value as CommunityTab)}
							variant='pill'
							size='sm'
							fullWidth
							className='w-full sm:w-auto'
						/>
					</div>
				)}
			</div>

			{shouldShowStatGrid && (
				<div className='mb-3 grid grid-cols-2 gap-2 sm:mb-4 lg:grid-cols-4'>
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
		</motion.section>
	)
}
