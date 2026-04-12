'use client'

import { useTranslations } from 'next-intl'

import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	DollarSign,
	ArrowDownLeft,
	ArrowUpRight,
	MessageSquare,
	Clock,
	AlertCircle,
} from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getReceivedTips, getSentTips } from '@/services/tips'
import { getProfileByUserId } from '@/services/profile'
import { Tip } from '@/lib/types/tips'
import {
	TRANSITION_SPRING,
	LIST_ITEM_HOVER,
	LIST_ITEM_TAP,
	staggerContainer,
	staggerItem,
} from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

// ============================================
// TYPES
// ============================================

type Tab = 'received' | 'sent'

interface ResolvedTip extends Tip {
	displayName: string
	avatarUrl: string | null
	username: string | null
}

interface TipHistoryProps {
	className?: string
}

// ============================================
// HELPERS
// ============================================

function formatCents(amountCents: number): string {
	return `$${(amountCents / 100).toFixed(2)}`
}

function getStatusBadge(status: Tip['status']) {
	switch (status) {
		case 'completed':
			return { label: 'Completed', className: 'bg-gaming-xp/10 text-gaming-xp' }
		case 'pending':
			return { label: 'Pending', className: 'bg-amber-500/10 text-amber-600' }
		case 'refunded':
			return { label: 'Refunded', className: 'bg-red-500/10 text-red-600' }
	}
}

// ============================================
// COMPONENT
// ============================================

export function TipHistory({ className = '' }: TipHistoryProps) {
	const t = useTranslations('creator')
	const [activeTab, setActiveTab] = useState<Tab>('received')
	const [receivedTips, setReceivedTips] = useState<ResolvedTip[]>([])
	const [sentTips, setSentTips] = useState<ResolvedTip[]>([])
	const [isLoading, setIsLoading] = useState(true)
	const [error, setError] = useState(false)

	const resolveTips = useCallback(
		async (
			tips: Tip[],
			resolveField: 'tipperId' | 'creatorId',
		): Promise<ResolvedTip[]> => {
			// Batch-dedupe user IDs to minimize requests
			const uniqueIds = [...new Set(tips.map(t => t[resolveField]))]
			const profileMap = new Map<
				string,
				{
					displayName: string
					avatarUrl: string | null
					username: string | null
				}
			>()

			await Promise.allSettled(
				uniqueIds.map(async id => {
					try {
						const res = await getProfileByUserId(id)
						if (res.success && res.data) {
							const p = res.data
							const name =
								p.displayName ||
								[p.firstName, p.lastName].filter(Boolean).join(' ') ||
								p.username ||
								'Unknown'
							profileMap.set(id, {
								displayName: name,
								avatarUrl: p.avatarUrl ?? null,
								username: p.username ?? null,
							})
						}
					} catch {
						// Skip failed profile resolution
					}
				}),
			)

			return tips.map(tip => {
				const resolved = profileMap.get(tip[resolveField])
				return {
					...tip,
					displayName: resolved?.displayName ?? t('unknownUser'),
					avatarUrl: resolved?.avatarUrl ?? null,
					username: resolved?.username ?? null,
				}
			})
		},
		[t],
	)

	const fetchTips = useCallback(async () => {
		setIsLoading(true)
		setError(false)
		try {
			const [received, sent] = await Promise.all([
				getReceivedTips(),
				getSentTips(),
			])
			const [resolvedReceived, resolvedSent] = await Promise.all([
				resolveTips(received, 'tipperId'),
				resolveTips(sent, 'creatorId'),
			])
			setReceivedTips(resolvedReceived)
			setSentTips(resolvedSent)
		} catch (err) {
			logDevError('Failed to fetch tip history:', err)
			setError(true)
		} finally {
			setIsLoading(false)
		}
	}, [resolveTips])

	useEffect(() => {
		fetchTips()
	}, [fetchTips])

	const activeTips = activeTab === 'received' ? receivedTips : sentTips
	const totalReceived = receivedTips.reduce((sum, t) => sum + t.amountCents, 0)
	const totalSent = sentTips.reduce((sum, t) => sum + t.amountCents, 0)

	return (
		<div
			className={`rounded-radius border border-border bg-bg-card shadow-card ${className}`}
		>
			{/* Header */}
			<div className='border-b border-border-subtle p-4 md:p-6'>
				<div className='mb-4 flex items-center gap-3'>
					<div className='flex size-10 items-center justify-center rounded-xl bg-gaming-xp/10'>
						<DollarSign className='size-5 text-gaming-xp' />
					</div>
					<div>
						<h3 className='font-semibold text-text'>{t('tipHistory')}</h3>
						<p className='text-sm text-text-muted'>
							{receivedTips.length > 0
								? `${formatCents(totalReceived)} received · ${formatCents(totalSent)} sent`
								: t('tipHistorySubtitle')}
						</p>
					</div>
				</div>

				{/* Tabs */}
				<div className='flex gap-1 rounded-lg bg-bg-elevated p-1'>
					{(['received', 'sent'] as const).map(tab => (
						<button
							type='button'
							key={tab}
							onClick={() => setActiveTab(tab)}
							className={`relative flex flex-1 items-center justify-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
								activeTab === tab
									? 'text-text'
									: 'text-text-muted hover:text-text-secondary'
							}`}
						>
							{activeTab === tab && (
								<motion.div
									layoutId='tipHistoryTab'
									className='absolute inset-0 rounded-md bg-bg-card shadow-sm'
									transition={TRANSITION_SPRING}
								/>
							)}
							<span className='relative z-10 flex items-center gap-2'>
								{tab === 'received' ? (
									<ArrowDownLeft className='size-4' />
								) : (
									<ArrowUpRight className='size-4' />
								)}
								{tab === 'received' ? t('tabReceived') : t('tabSent')}
								{(tab === 'received' ? receivedTips : sentTips).length > 0 && (
									<span className='rounded-full bg-brand/10 px-1.5 py-0.5 text-xs text-brand'>
										{(tab === 'received' ? receivedTips : sentTips).length}
									</span>
								)}
							</span>
						</button>
					))}
				</div>
			</div>

			{/* Content */}
			<div className='p-4 md:p-6'>
				{isLoading ? (
					<div className='space-y-3'>
						{[0, 1, 2].map(i => (
							<div key={i} className='flex items-center gap-3'>
								<div className='size-10 animate-pulse rounded-full bg-bg-elevated' />
								<div className='flex-1 space-y-2'>
									<div className='h-4 w-32 animate-pulse rounded bg-bg-elevated' />
									<div className='h-3 w-20 animate-pulse rounded bg-bg-elevated' />
								</div>
								<div className='h-5 w-16 animate-pulse rounded bg-bg-elevated' />
							</div>
						))}
					</div>
				) : error ? (
					<div className='flex flex-col items-center gap-3 py-8 text-center'>
						<AlertCircle className='size-8 text-text-muted' />
						<p className='text-sm text-text-muted'>
							Failed to load tip history
						</p>
						<button
							type='button'
							onClick={fetchTips}
							className='rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand/90'
						>
							{t('tryAgain')}
						</button>
					</div>
				) : activeTips.length === 0 ? (
					<div className='flex flex-col items-center gap-2 py-8 text-center'>
						<span className='text-3xl'>
							{activeTab === 'received' ? '💰' : '🎁'}
						</span>
						<p className='font-medium text-text'>
							{activeTab === 'received' ? t('noTipsReceived') : t('noTipsSent')}
						</p>
						<p className='text-sm text-text-muted'>
							{activeTab === 'received'
								? "When fans tip your recipes, they'll show up here"
								: 'Support your favorite creators by sending a tip'}
						</p>
					</div>
				) : (
					<AnimatePresence mode='wait'>
						<motion.div
							key={activeTab}
							variants={staggerContainer}
							initial='hidden'
							animate='visible'
							className='space-y-2'
						>
							{activeTips.map(tip => (
								<TipListItem key={tip.id} tip={tip} direction={activeTab} />
							))}
						</motion.div>
					</AnimatePresence>
				)}
			</div>
		</div>
	)
}

// ============================================
// TIP LIST ITEM
// ============================================

function TipListItem({
	tip,
	direction,
}: {
	tip: ResolvedTip
	direction: 'received' | 'sent'
}) {
	const userId = direction === 'received' ? tip.tipperId : tip.creatorId
	const badge = getStatusBadge(tip.status)

	return (
		<motion.div
			variants={staggerItem}
			whileHover={LIST_ITEM_HOVER}
			whileTap={LIST_ITEM_TAP}
			className='group flex items-center gap-3 rounded-lg p-3 transition-colors hover:bg-bg-elevated'
		>
			{/* Avatar */}
			<Link href={`/${userId}`} className='flex-shrink-0'>
				<Avatar className='size-10'>
					<AvatarImage src={tip.avatarUrl ?? undefined} alt={tip.displayName} />
					<AvatarFallback>
						{tip.displayName
							.split(' ')
							.map(n => n[0])
							.join('')
							.toUpperCase()
							.slice(0, 2)}
					</AvatarFallback>
				</Avatar>
			</Link>

			{/* Info */}
			<div className='min-w-0 flex-1'>
				<div className='flex items-center gap-2'>
					<Link
						href={`/${userId}`}
						className='truncate text-sm font-semibold text-text transition-colors hover:text-brand'
					>
						{tip.displayName}
					</Link>
					{tip.username && (
						<span className='hidden text-xs text-text-muted sm:inline'>
							@{tip.username}
						</span>
					)}
				</div>
				<div className='flex items-center gap-2'>
					{tip.message && (
						<span className='flex items-center gap-1 truncate text-xs text-text-secondary'>
							<MessageSquare className='size-3 flex-shrink-0' />
							{tip.message}
						</span>
					)}
					{!tip.message && (
						<span className='flex items-center gap-1 text-xs text-text-muted'>
							<Clock className='size-3' />
							{formatDistanceToNow(new Date(tip.createdAt), {
								addSuffix: true,
							})}
						</span>
					)}
				</div>
			</div>

			{/* Amount + Status */}
			<div className='flex flex-shrink-0 flex-col items-end gap-1'>
				<span
					className={`text-sm font-bold ${
						direction === 'received' ? 'text-gaming-xp' : 'text-text-secondary'
					}`}
				>
					{direction === 'received' ? '+' : '-'}
					{formatCents(tip.amountCents)}
				</span>
				<span
					className={`rounded-full px-1.5 py-0.5 text-xs font-medium ${badge.className}`}
				>
					{badge.label}
				</span>
			</div>
		</motion.div>
	)
}
