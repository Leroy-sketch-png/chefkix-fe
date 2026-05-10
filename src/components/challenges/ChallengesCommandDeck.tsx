import { motion } from 'framer-motion'
import { Clock, Leaf, Sparkles, Trophy, Users } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ChallengesCommandDeckProps {
	counts: {
		community: number
		seasonal: number
		hasDaily: boolean
		hasWeekly: boolean
	}
	className?: string
}

function DeckStat({
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

export function ChallengesCommandDeck({
	counts,
	className,
}: ChallengesCommandDeckProps) {
	const activeStreams =
		(counts.hasDaily ? 1 : 0) +
		(counts.hasWeekly ? 1 : 0) +
		counts.community +
		counts.seasonal

	return (
		<motion.section
			initial={{ opacity: 0, y: 10 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-xp/6 p-4 shadow-card md:p-5',
				className,
			)}
		>
			<div className='mb-4 flex items-center justify-between gap-3'>
				<div>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-xp'>
						Challenge Command
					</p>
					<h2 className='mt-1 text-lg font-black text-text-primary'>
						Compete With Intent
					</h2>
				</div>
				<div className='inline-flex items-center gap-1 rounded-full border border-xp/20 bg-xp/8 px-3 py-1.5 text-xs font-semibold text-xp'>
					<Sparkles className='size-3.5' />
					Live modes
				</div>
			</div>

			<div className='grid grid-cols-2 gap-2 lg:grid-cols-5'>
				<DeckStat
					label='Active Streams'
					value={activeStreams.toString()}
					icon={Trophy}
					tone='xp'
				/>
				<DeckStat
					label='Daily'
					value={counts.hasDaily ? '1' : '0'}
					icon={Clock}
					tone={counts.hasDaily ? 'brand' : 'muted'}
				/>
				<DeckStat
					label='Weekly'
					value={counts.hasWeekly ? '1' : '0'}
					icon={Sparkles}
					tone={counts.hasWeekly ? 'brand' : 'muted'}
				/>
				<DeckStat
					label='Community'
					value={counts.community.toString()}
					icon={Users}
					tone='social'
				/>
				<DeckStat
					label='Seasonal'
					value={counts.seasonal.toString()}
					icon={Leaf}
					tone='muted'
				/>
			</div>
		</motion.section>
	)
}
