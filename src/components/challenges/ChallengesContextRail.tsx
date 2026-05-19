'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Compass, History, Sparkles, Swords, Trophy } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { MagicCard } from '@/components/ui/magic-card'

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
		<div className='flex items-center justify-between border-b border-border-subtle/60 py-2 last:border-0'>
			<span className='text-xs font-medium text-text-secondary'>{label}</span>
			<span className='text-sm font-black tabular-nums text-text-primary'>
				{value}
			</span>
		</div>
	)
}

export function ChallengesContextRail({ counts }: ChallengesContextRailProps) {
	const t = useTranslations('challenges')
	return (
		<motion.aside
			initial={{ opacity: 0, x: 10 }}
			animate={{ opacity: 1, x: 0 }}
			transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
			className='hidden xl:flex xl:flex-col xl:gap-4 xl:self-start xl:sticky xl:top-24'
		>
			<MagicCard
				mode='orb'
				glowFrom='var(--color-xp)'
				glowTo='var(--color-brand)'
				className='rounded-xl border border-border-subtle bg-bg-card/75 backdrop-blur-md shadow-card overflow-hidden p-0'
			>
				<div className='p-4 relative z-10 w-full'>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-xp'>
						{t('pulseEyebrow')}
					</p>
					<h3 className='mt-1 text-lg font-black text-text-primary'>
						{t('pulseHeading')}
					</h3>
					<div className='mt-3'>
						<InfoRow
							label={t('pulseDailyLive')}
							value={counts.hasDaily ? t('pulseYes') : t('pulseNo')}
						/>
						<InfoRow
							label={t('pulseWeeklyLive')}
							value={counts.hasWeekly ? t('pulseYes') : t('pulseNo')}
						/>
						<InfoRow
							label={t('community')}
							value={counts.community.toString()}
						/>
						<InfoRow label={t('seasonal')} value={counts.seasonal.toString()} />
					</div>
				</div>
			</MagicCard>

			<MagicCard
				mode='orb'
				glowFrom='var(--color-brand)'
				glowTo='var(--color-xp)'
				className='rounded-xl border border-border-subtle bg-bg-card/75 backdrop-blur-md shadow-card overflow-hidden p-0'
			>
				<div className='p-4 relative z-10 w-full'>
					<p className='text-[11px] font-bold uppercase tracking-[0.16em] text-text-muted'>
						{t('quickMovesEyebrow')}
					</p>
					<div className='mt-3 grid gap-2'>
						<Link
							href='/explore'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/60 px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Compass className='size-3.5' />
							{t('quickMovesFind')}
						</Link>
						<Link
							href='/cook-together'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/60 px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Swords className='size-3.5' />
							{t('quickMovesDuel')}
						</Link>
						<Link
							href='/leaderboard'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/60 px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Trophy className='size-3.5' />
							{t('quickMovesLeaderboard')}
						</Link>
						<Link
							href='/challenges/history'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/60 px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<History className='size-3.5' />
							{t('quickMovesHistory')}
						</Link>
						<Link
							href='/community'
							className='inline-flex items-center gap-2 rounded-lg border border-border-subtle bg-bg-elevated/60 px-3 py-2 text-xs font-semibold text-text-primary transition-all hover:border-brand/25 hover:bg-brand/8 hover:text-brand'
						>
							<Sparkles className='size-3.5' />
							{t('quickMovesCommunity')}
						</Link>
					</div>
				</div>
			</MagicCard>
		</motion.aside>
	)
}
