'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Swords, Clock, Flame, Users, ChevronRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { getActiveBattles } from '@/services/post'
import { Skeleton } from '@/components/ui/skeleton'
import { TRANSITION_SPRING, DURATION_S, CARD_FEED_HOVER } from '@/lib/motion'
import { formatEventTimeRemaining } from '@/lib/challenge-time'
import { logDevError } from '@/lib/dev-log'
import type { Post } from '@/lib/types/post'

function getBattleHeat(
	votesA: number,
	votesB: number,
): 'cold' | 'warm' | 'hot' {
	const total = votesA + votesB
	if (total >= 50) return 'hot'
	if (total >= 10) return 'warm'
	return 'cold'
}

// ============================================
// BATTLE CARD
// ============================================

function BattleCard({ battle, index }: { battle: Post; index: number }) {
	const t = useTranslations('challenges')
	const totalVotes = (battle.battleVotesA || 0) + (battle.battleVotesB || 0)
	const percentA =
		totalVotes > 0
			? Math.round(((battle.battleVotesA || 0) / totalVotes) * 100)
			: 50
	const heat = getBattleHeat(battle.battleVotesA || 0, battle.battleVotesB || 0)
	const timeLeft = battle.battleEndsAt
		? formatEventTimeRemaining(battle.battleEndsAt, t)
		: null
	const hasVoted = battle.userBattleVote != null

	return (
		<motion.div
			initial={{ opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			whileHover={CARD_FEED_HOVER}
			transition={{ delay: index * 0.08, ...TRANSITION_SPRING }}
		>
			<Link
				href={`/post/${battle.id}`}
				className='group block rounded-2xl border border-border-subtle bg-bg-card shadow-card transition-all duration-300 hover:shadow-warm'
			>
				{/* Header */}
				<div className='flex items-center justify-between px-5 pt-4 pb-3'>
					<div className='flex items-center gap-2.5'>
						<div
							className={`flex size-9 items-center justify-center rounded-lg ${
								heat === 'hot'
									? 'bg-brand/15 text-brand'
									: heat === 'warm'
										? 'bg-warning/15 text-warning'
										: 'bg-bg-elevated text-text-muted'
							}`}
						>
							{heat === 'hot' ? (
								<Flame className='size-4.5' />
							) : (
								<Swords className='size-4' />
							)}
						</div>
						<div>
							<p
								className='text-sm font-semibold text-text line-clamp-1'
								title={battle.content || t('recipeBattle')}
							>
								{battle.content || t('recipeBattle')}
							</p>
							<p className='text-xs text-text-muted'>{battle.displayName}</p>
						</div>
					</div>
					{timeLeft && (
						<span className='flex items-center gap-1 rounded-full bg-bg-elevated px-2.5 py-1 text-xs font-medium text-text-secondary'>
							<Clock className='size-3' />
							{timeLeft}
						</span>
					)}
				</div>

				{/* VS Matchup */}
				<div className='relative flex items-stretch gap-0 px-4 pb-3'>
					{/* Recipe A */}
					<div className='relative flex-1 overflow-hidden rounded-l-xl'>
						{battle.battleRecipeImageA ? (
							<Image
								src={battle.battleRecipeImageA}
								alt={battle.battleRecipeTitleA || t('recipeA')}
								width={200}
								height={120}
								className='h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105'
								onError={e => {
									;(e.target as HTMLImageElement).style.display = 'none'
								}}
							/>
						) : (
							<div className='flex h-24 items-center justify-center bg-bg-elevated text-2xl'>
								🍳
							</div>
						)}
						<div className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2'>
							<p
								className='text-xs font-semibold text-white line-clamp-1'
								title={battle.battleRecipeTitleA || t('recipeA')}
							>
								{battle.battleRecipeTitleA || t('recipeA')}
							</p>
						</div>
					</div>

					{/* VS Badge */}
					<div className='absolute top-1/2 left-1/2 z-10 flex size-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-bg-card bg-brand text-xs font-black text-white shadow-warm'>
						{t('versus')}
					</div>

					{/* Recipe B */}
					<div className='relative flex-1 overflow-hidden rounded-r-xl'>
						{battle.battleRecipeImageB ? (
							<Image
								src={battle.battleRecipeImageB}
								alt={battle.battleRecipeTitleB || t('recipeB')}
								width={200}
								height={120}
								className='h-24 w-full object-cover transition-transform duration-300 group-hover:scale-105'
								onError={e => {
									;(e.target as HTMLImageElement).style.display = 'none'
								}}
							/>
						) : (
							<div className='flex h-24 items-center justify-center bg-bg-elevated text-2xl'>
								🍳
							</div>
						)}
						<div className='pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2'>
							<p
								className='text-xs font-semibold text-white line-clamp-1'
								title={battle.battleRecipeTitleB || t('recipeB')}
							>
								{battle.battleRecipeTitleB || t('recipeB')}
							</p>
						</div>
					</div>
				</div>

				{/* Vote Progress Bar */}
				<div className='px-5 pb-2'>
					<div className='flex h-2 overflow-hidden rounded-full bg-bg-elevated'>
						<motion.div
							initial={{ width: '50%' }}
							animate={{ width: `${percentA}%` }}
							transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
							className='rounded-l-full bg-brand'
						/>
						<motion.div
							initial={{ width: '50%' }}
							animate={{ width: `${100 - percentA}%` }}
							transition={{ duration: DURATION_S.slow, ease: 'easeOut' }}
							className='rounded-r-full bg-accent-purple'
						/>
					</div>
					<div className='mt-1 flex justify-between text-xs font-medium tabular-nums text-text-muted'>
						<span>{t('votesCount', { count: battle.battleVotesA || 0 })}</span>
						<span>{t('votesCount', { count: battle.battleVotesB || 0 })}</span>
					</div>
				</div>

				{/* Footer */}
				<div className='flex items-center justify-between border-t border-border-subtle/50 px-5 py-2.5'>
					<span className='flex items-center gap-1 tabular-nums text-xs text-text-muted'>
						<Users className='size-3.5' />
						{totalVotes} {t('totalVotes')}
					</span>
					<span className='flex items-center gap-1 text-xs font-semibold text-brand'>
						{hasVoted ? t('yourVoteCast') : t('castYourVote')}
						<ChevronRight className='size-3.5' />
					</span>
				</div>
			</Link>
		</motion.div>
	)
}

// ============================================
// SECTION
// ============================================

export function ActiveBattlesSection() {
	const t = useTranslations('challenges')
	const [battles, setBattles] = useState<Post[]>([])
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		let cancelled = false

		const fetchBattles = async () => {
			try {
				const response = await getActiveBattles(0, 6)
				if (cancelled) return
				if (response.success && response.data) {
					setBattles(response.data)
				}
			} catch (err) {
				if (cancelled) return
				logDevError('Failed to fetch active battles:', err)
			} finally {
				if (!cancelled) setLoading(false)
			}
		}

		fetchBattles()
		return () => {
			cancelled = true
		}
	}, [])

	// Don't render section if no battles and done loading
	if (!loading && battles.length === 0) return null

	return (
		<section className='mb-8'>
			<div className='mb-4 flex items-center gap-2'>
				<Swords className='size-5 text-brand' />
				<h2 className='text-lg font-bold text-text'>{t('recipeBattles')}</h2>
			</div>

			<AnimatePresence mode='wait'>
				{loading ? (
					<motion.div
						key='loading'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						className='grid grid-cols-1 gap-4 sm:grid-cols-2'
					>
						{[1, 2].map(i => (
							<div
								key={i}
								className='rounded-2xl border border-border-subtle bg-bg-card shadow-card'
							>
								<div className='flex items-center gap-3 px-5 pt-4 pb-3'>
									<Skeleton className='size-9 rounded-lg' />
									<div className='flex-1 space-y-1.5'>
										<Skeleton className='h-4 w-2/3' />
										<Skeleton className='h-3 w-1/3' />
									</div>
									<Skeleton className='h-5 w-16 rounded-full' />
								</div>
								<div className='flex gap-0.5 px-4 pb-3'>
									<Skeleton className='h-24 flex-1 rounded-l-xl' />
									<Skeleton className='h-24 flex-1 rounded-r-xl' />
								</div>
								<div className='px-5 pb-2'>
									<Skeleton className='h-2 w-full rounded-full' />
									<div className='mt-1 flex justify-between'>
										<Skeleton className='h-3 w-12' />
										<Skeleton className='h-3 w-12' />
									</div>
								</div>
								<div className='flex items-center justify-between border-t border-border-subtle/50 px-5 py-2.5'>
									<Skeleton className='h-3 w-20' />
									<Skeleton className='h-3 w-24' />
								</div>
							</div>
						))}
					</motion.div>
				) : (
					<motion.div
						key='content'
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						className='grid grid-cols-1 gap-4 sm:grid-cols-2'
					>
						{battles.map((battle, i) => (
							<BattleCard key={battle.id} battle={battle} index={i} />
						))}
					</motion.div>
				)}
			</AnimatePresence>
		</section>
	)
}
