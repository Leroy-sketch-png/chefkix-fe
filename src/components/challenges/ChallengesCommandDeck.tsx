'use client'

import { motion } from 'framer-motion'
import { Clock, Leaf, Sparkles, Trophy, Users } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { NumberTicker } from '@/components/ui/number-ticker'
import {
	getCommandStatToneClass,
	type CommandStatTone,
} from '@/components/layout/command-stat-tone'

interface ChallengesCommandDeckProps {
	activeChallengeCount: number | null
	counts: {
		community: number | null
		seasonal: number | null
		daily: number | null
		weekly: number | null
	}
	className?: string
}

function DeckStat({
	label,
	value,
	unavailableLabel,
	icon: Icon,
	tone,
}: {
	label: string
	value: number | null
	unavailableLabel: string
	icon: React.ComponentType<{ className?: string }>
	tone: Extract<CommandStatTone, 'brand' | 'xp' | 'success' | 'muted'>
}) {
	const toneClass = getCommandStatToneClass(tone)

	return (
		<div className='rounded-xl border border-border-subtle/50 bg-bg-card/40 backdrop-blur-sm p-3 shadow-card'>
			<div className='flex items-center justify-between gap-2'>
				<div>
					<p className='text-2xs font-bold uppercase tracking-widest text-text-muted'>
						{label}
					</p>
					<p className='mt-1 text-xl font-black tabular-nums text-text-primary'>
						{value === null ? (
							<span aria-label={unavailableLabel}>—</span>
						) : (
							<NumberTicker value={value} />
						)}
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
	activeChallengeCount,
	counts,
	className,
}: ChallengesCommandDeckProps) {
	const t = useTranslations('challenges')

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
			<div className='rounded-2xl bg-bg-card/75 backdrop-blur-md p-4 md:p-5'>
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
							label={t('statActiveChallenges')}
							value={activeChallengeCount}
							unavailableLabel={t('countUnavailable')}
							icon={Trophy}
							tone='xp'
						/>
						<DeckStat
							label={t('daily')}
							value={counts.daily}
							unavailableLabel={t('countUnavailable')}
							icon={Clock}
							tone={counts.daily === 1 ? 'brand' : 'muted'}
						/>
						<DeckStat
							label={t('weekly')}
							value={counts.weekly}
							unavailableLabel={t('countUnavailable')}
							icon={Sparkles}
							tone={counts.weekly === 1 ? 'brand' : 'muted'}
						/>
						<DeckStat
							label={t('community')}
							value={counts.community}
							unavailableLabel={t('countUnavailable')}
							icon={Users}
							tone={
								counts.community !== null && counts.community > 0
									? 'success'
									: 'muted'
							}
						/>
						<DeckStat
							label={t('seasonal')}
							value={counts.seasonal}
							unavailableLabel={t('countUnavailable')}
							icon={Leaf}
							tone='muted'
						/>
					</div>
				</div>
			</div>
		</motion.section>
	)
}
