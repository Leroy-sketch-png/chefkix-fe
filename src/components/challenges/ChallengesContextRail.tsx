import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, History, Sparkles, Swords, Trophy } from 'lucide-react'

interface ChallengesContextRailProps {
	counts: {
		community: number
		seasonal: number
		hasDaily: boolean
		hasWeekly: boolean
	}
}

function InfoRow({ label, value }: { label: string; value: string }) {
	return (
		<div className='flex items-center justify-between border-b border-border-subtle py-2 last:border-0'>
			<span className='text-xs font-medium text-text-secondary'>{label}</span>
			<span className='text-sm font-black tabular-nums text-text-primary'>
				{value}
			</span>
		</div>
	)
}

export function ChallengesContextRail({ counts }: ChallengesContextRailProps) {
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24'
		>
			<div className='rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card'>
				<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-xp'>
					Challenge Pulse
				</p>
				<h3 className='mt-1 text-lg font-black text-text-primary'>
					Competition Health
				</h3>
				<div className='mt-3'>
					<InfoRow label='Daily live' value={counts.hasDaily ? 'Yes' : 'No'} />
					<InfoRow
						label='Weekly live'
						value={counts.hasWeekly ? 'Yes' : 'No'}
					/>
					<InfoRow label='Community' value={counts.community.toString()} />
					<InfoRow label='Seasonal' value={counts.seasonal.toString()} />
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
						Find recipes to cook
					</Link>
					<Link
						href='/cook-together'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Swords className='size-3.5' />
						Start a duel
					</Link>
					<Link
						href='/leaderboard'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Trophy className='size-3.5' />
						See leaderboard
					</Link>
					<Link
						href='/challenges/history'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<History className='size-3.5' />
						View challenge history
					</Link>
					<Link
						href='/community'
						className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
					>
						<Sparkles className='size-3.5' />
						Open community hub
					</Link>
				</div>
			</div>
		</motion.aside>
	)
}
