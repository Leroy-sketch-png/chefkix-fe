import Link from 'next/link'
import { motion } from 'framer-motion'
import { useTranslations } from 'next-intl'
import { Compass, MessageSquare, Sparkles, Users } from 'lucide-react'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'
import { MagicCard } from '@/components/ui/magic-card'
import type { FeedMode } from '@/components/shared/FeedTabBar'

interface FeedContextRailProps {
	postCount: number
	feedMode: FeedMode
	showFriendsOnline: boolean
}

function MetricRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-center justify-between border-b border-border-subtle py-2 last:border-0'>
			<span className='text-xs font-medium text-text-secondary'>{label}</span>
			<span className='text-sm font-black text-text-primary'>{value}</span>
		</div>
	)
}

export function FeedContextRail({
	postCount,
	feedMode,
	showFriendsOnline,
}: FeedContextRailProps) {
	const t = useTranslations('feed')
	const modeLabel =
		feedMode === 'forYou'
			? t('statModeForYou')
			: feedMode === 'following'
				? t('statModeFollowing')
				: feedMode === 'latest'
					? t('statModeLatest')
					: t('statModeTrending')
	const audienceLabel =
		feedMode === 'forYou'
			? t('pulseAudiencePersonalized')
			: feedMode === 'following'
				? t('pulseAudienceFollowing')
				: t('pulseAudiencePublic')
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden 2xl:flex 2xl:flex-col 2xl:gap-4 2xl:self-start 2xl:sticky 2xl:top-24'
		>
			<MagicCard
				mode='orb'
				glowFrom='var(--color-brand)'
				glowTo='var(--color-xp)'
				className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card/75 backdrop-blur-md p-4 shadow-card'
			>
				<div className='relative z-10 w-full'>
					<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
						{t('pulseEyebrow')}
					</p>
					<h3 className='mt-1 text-lg font-black text-text-primary'>
						{t('pulseHeading')}
					</h3>
					<div className='mt-3'>
						<MetricRow
							label={t('pulseVisiblePosts')}
							value={postCount.toString()}
						/>
						<MetricRow label={t('pulseMode')} value={modeLabel} />
						<MetricRow label={t('pulseAudience')} value={audienceLabel} />
					</div>
				</div>
			</MagicCard>

			<MagicCard
				mode='orb'
				glowFrom='var(--color-brand)'
				glowTo='var(--color-xp)'
				className='overflow-hidden rounded-xl border border-border-subtle bg-bg-card/75 backdrop-blur-md p-4 shadow-card'
			>
				<div className='relative z-10 w-full'>
					<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
						{t('quickMovesEyebrow')}
					</p>
					<div className='mt-3 grid gap-2'>
						<Link
							href='/community'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Users className='size-3.5' />
							{t('quickMovesCommunity')}
						</Link>
						<Link
							href='/explore'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Compass className='size-3.5' />
							{t('quickMovesExplore')}
						</Link>
						<Link
							href='/messages'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<MessageSquare className='size-3.5' />
							{t('quickMovesMessages')}
						</Link>
						<Link
							href='/challenges'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Sparkles className='size-3.5' />
							{t('quickMovesChallenges')}
						</Link>
					</div>
				</div>
			</MagicCard>

			{showFriendsOnline && <FriendsOnlineWidget />}
		</motion.aside>
	)
}
