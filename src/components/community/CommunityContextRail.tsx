import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, MessageSquare, Sparkles, Trophy, Users } from 'lucide-react'
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
		<div className='flex items-center justify-between border-b border-border-subtle py-2 last:border-0'>
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
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24'
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					Community Pulse
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					Growth Snapshot
				</h3>
				<div className='mt-3'>
					<MetricRow label='Friends' value={counts.friends.toString()} />
					<MetricRow label='Follow backs' value={counts.followers.toString()} />
					<MetricRow
						label='Suggested follows'
						value={counts.suggested.toString()}
					/>
					<MetricRow
						label='Ranked chefs'
						value={counts.leaderboard.toString()}
					/>
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Quick Moves
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/explore'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Compass className='size-3.5' />
						Explore recipes
					</Link>
					<Link
						href='/messages'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<MessageSquare className='size-3.5' />
						Open messages
					</Link>
					<Link
						href='/challenges'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						Join challenges
					</Link>
					<Link
						href='/leaderboard'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Trophy className='size-3.5' />
						Global leaderboard
					</Link>
					<Link
						href='/community?tab=discover'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Users className='size-3.5' />
						Find new people
					</Link>
				</div>
			</div>

			{showOnlineWidget && <FriendsOnlineWidget />}
		</motion.aside>
	)
}
