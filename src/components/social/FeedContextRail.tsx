import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, MessageSquare, Sparkles, Users } from 'lucide-react'
import { FriendsOnlineWidget } from '@/components/social/FriendsOnlineWidget'

interface FeedContextRailProps {
	postCount: number
	feedMode: 'latest' | 'trending'
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
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24'
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-brand'>
					Feed Pulse
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					Stream Snapshot
				</h3>
				<div className='mt-3'>
					<MetricRow label='Visible posts' value={postCount.toString()} />
					<MetricRow
						label='Mode'
						value={feedMode === 'latest' ? 'Latest' : 'Trending'}
					/>
					<MetricRow label='Audience' value='Public' />
				</div>
			</div>

			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
					Quick Moves
				</p>
				<div className='mt-3 grid gap-2'>
					<Link
						href='/community'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Users className='size-3.5' />
						Open community
					</Link>
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
				</div>
			</div>

			{showFriendsOnline && <FriendsOnlineWidget />}
		</motion.aside>
	)
}
