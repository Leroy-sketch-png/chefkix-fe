import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { motion } from 'framer-motion'
import {
	Compass,
	MessageSquare,
	Sparkles,
	Trophy,
	Users,
	ArrowRight,
} from 'lucide-react'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'

interface CommunityContextRailProps {
	counts: {
		friends: number
		followers: number
		suggested: number
		leaderboard: number
	}
	showOnlineWidget?: boolean
}

function MetricRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-center justify-between border-b border-border-subtle py-2.5 last:border-0'>
			<span className='text-xs font-medium text-text-secondary'>{label}</span>
			<span className='text-sm font-black tabular-nums text-text-primary'>
				{value}
			</span>
		</div>
	)
}

export function CommunityContextRail({
	counts,
	showOnlineWidget = true,
}: CommunityContextRailProps) {
	const t = useTranslations('community')
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-6 xl:self-start xl:sticky xl:top-24'
		>
			<div className='rounded-2xl border border-border-subtle/80 bg-gradient-to-br from-bg-card via-bg-card to-brand/5 p-4 shadow-card'>
				<p className='text-2xs font-bold uppercase tracking-widest text-brand'>
					{t('railPulseEyebrow')}
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					{t('railPulseHeading')}
				</h3>
				<div className='mt-3'>
					<MetricRow label={t('friends')} value={counts.friends.toString()} />
					<MetricRow
						label={t('railFollowBacks')}
						value={counts.followers.toString()}
					/>
					<MetricRow
						label={t('railSuggestedFollows')}
						value={counts.suggested.toString()}
					/>
					<MetricRow
						label={t('railRankedChefs')}
						value={counts.leaderboard.toString()}
					/>
				</div>
			</div>

			<div className='rounded-2xl border border-border-subtle/80 bg-bg-card p-4 shadow-card'>
				<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
					{t('railQuickMoves')}
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/explore'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Compass className='size-3.5' />
							{t('railExploreRecipes')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/messages'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<MessageSquare className='size-3.5' />
							{t('railOpenMessages')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/challenges'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Sparkles className='size-3.5' />
							{t('railJoinChallenges')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/leaderboard'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Trophy className='size-3.5' />
							{t('railGlobalLeaderboard')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
					<Link
						href='/community?tab=discover'
						className='group inline-flex items-center justify-between gap-2 rounded-xl border border-border-subtle bg-bg-elevated px-3 py-2.5 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<span className='inline-flex items-center gap-2'>
							<Users className='size-3.5' />
							{t('railFindPeople')}
						</span>
						<ArrowRight className='size-3.5 text-text-muted transition-transform group-hover:translate-x-0.5' />
					</Link>
				</div>
			</div>

			{showOnlineWidget && <FriendsOnlineWidget />}
		</motion.aside>
	)
}
