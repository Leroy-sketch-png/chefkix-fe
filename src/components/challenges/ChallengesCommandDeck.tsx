'use client'

import { motion } from 'framer-motion'
import { Clock, Leaf, Sparkles, Trophy, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { MagicCard } from '@/components/ui/magic-card'
import { NumberTicker } from '@/components/ui/number-ticker'

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
		<div className='rounded-xl border border-border-subtle/50 bg-bg-card/40 backdrop-blur-sm p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-xl font-black tabular-nums text-text-primary'>
						<NumberTicker value={parseInt(value) || 0} />
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
	const t = useTranslations('challenges')
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
				'rounded-2xl overflow-hidden shadow-card border border-border-subtle',
				className,
			)}
		>
			<MagicCard
				mode='orb'
				glowFrom='var(--color-brand)'
				glowTo='var(--color-xp)'
				className='rounded-2xl bg-bg-card/75 backdrop-blur-md p-4 md:p-5'
			>
				<div className='relative z-10 w-full'>
					<div className='mb-4 flex items-center justify-between gap-3'>
						<div>
							<p className='text-2xs font-bold uppercase tracking-widest text-xp'>
								{t('commandEyebrow')}
							</p>
							<h2 className='mt-1 text-lg font-black text-text-primary'>
								{t('commandHeading')}
							</h2>
						</div>
						<div className='inline-flex items-center gap-1 rounded-full border border-xp/20 bg-xp/8 px-3 py-1.5 text-xs font-semibold text-xp animate-pulse'>
							<Sparkles className='size-3.5' />
							{t('commandChip')}
						</div>
					</div>

					<div className='grid grid-cols-2 gap-2 lg:grid-cols-5'>
						<DeckStat
							label={t('statActiveStreams')}
							value={activeStreams.toString()}
							icon={Trophy}
							tone='xp'
						/>
						<DeckStat
							label={t('daily')}
							value={counts.hasDaily ? '1' : '0'}
							icon={Clock}
							tone={counts.hasDaily ? 'brand' : 'muted'}
						/>
						<DeckStat
							label={t('weekly')}
							value={counts.hasWeekly ? '1' : '0'}
							icon={Sparkles}
							tone={counts.hasWeekly ? 'brand' : 'muted'}
						/>
						<DeckStat
							label={t('community')}
							value={counts.community.toString()}
							icon={Users}
							tone='social'
						/>
						<DeckStat
							label={t('seasonal')}
							value={counts.seasonal.toString()}
							icon={Leaf}
							tone='muted'
						/>
					</div>
				</div>
			</MagicCard>
		</motion.section>
	)
}
