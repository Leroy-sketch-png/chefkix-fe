'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Swords,
	Trophy,
	Clock,
	Check,
	X,
	ChevronRight,
	Send,
	User,
	ChefHat,
	Crown,
	Ban,
	Hourglass,
	Search,
} from 'lucide-react'
import { toast } from 'sonner'
import Image from 'next/image'
import { useAuthStore } from '@/store/authStore'
import { Portal } from '@/components/ui/portal'
import {
	getActiveDuels,
	getPendingInvites,
	getMyDuels,
	acceptDuel,
	declineDuel,
	cancelDuel,
	createDuel,
} from '@/services/duel'
import { getFollowing } from '@/services/social'
import { getAllRecipes } from '@/services/recipe'
import type { DuelResponse, CreateDuelRequest } from '@/lib/types/duel'
import type { Profile } from '@/lib/types/profile'
import type { Recipe } from '@/lib/types/recipe'
import { getProfileDisplayName } from '@/lib/types/profile'
import { TRANSITION_SPRING, CARD_HOVER, BUTTON_TAP } from '@/lib/motion'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from 'next-intl'

// ============================================
// STATUS HELPERS
// ============================================

const STATUS_META: Record<
	string,
	{ label: string; color: string; bgColor: string; icon: React.ReactNode }
> = {
	Pending: {
		label: 'Pending',
		color: 'text-warning',
		bgColor: 'bg-warning/10',
		icon: <Hourglass className='size-3.5' />,
	},
	Accepted: {
		label: 'Accepted',
		color: 'text-info',
		bgColor: 'bg-info/10',
		icon: <Check className='size-3.5' />,
	},
	'In Progress': {
		label: 'In Progress',
		color: 'text-accent-purple',
		bgColor: 'bg-accent-purple/10',
		icon: <ChefHat className='size-3.5' />,
	},
	Completed: {
		label: 'Completed',
		color: 'text-success',
		bgColor: 'bg-success/10',
		icon: <Trophy className='size-3.5' />,
	},
	Declined: {
		label: 'Declined',
		color: 'text-error',
		bgColor: 'bg-error/10',
		icon: <X className='size-3.5' />,
	},
	Expired: {
		label: 'Expired',
		color: 'text-text-muted',
		bgColor: 'bg-bg-elevated',
		icon: <Clock className='size-3.5' />,
	},
	Cancelled: {
		label: 'Cancelled',
		color: 'text-text-muted',
		bgColor: 'bg-bg-elevated',
		icon: <Ban className='size-3.5' />,
	},
}

function formatDeadline(iso: string | null): string {
	if (!iso) return ''
	const diff = new Date(iso).getTime() - Date.now()
	if (diff <= 0) return 'Expired'
	const hours = Math.floor(diff / 3600000)
	if (hours >= 24) return `${Math.floor(hours / 24)}d ${hours % 24}h left`
	const mins = Math.floor((diff % 3600000) / 60000)
	return `${hours}h ${mins}m left`
}

// ============================================
// DUEL CARD (status-aware)
// ============================================

function DuelCard({
	duel,
	currentUserId,
	onAction,
}: {
	duel: DuelResponse
	currentUserId: string
	onAction: () => void
}) {
	const [acting, setActing] = useState(false)
	const isChallenger = duel.challengerId === currentUserId
	const opponentName = isChallenger ? duel.opponentName : duel.challengerName
	const opponentAvatar = isChallenger
		? duel.opponentAvatar
		: duel.challengerAvatar
	const meta = STATUS_META[duel.status] ?? STATUS_META.Pending
	const t = useTranslations('duels')

	const myScore = isChallenger ? duel.challengerScore : duel.opponentScore
	const theirScore = isChallenger ? duel.opponentScore : duel.challengerScore
	const isWinner = duel.winnerId === currentUserId
	const isDraw = duel.status === 'Completed' && !duel.winnerId

	const handleAccept = async () => {
		setActing(true)
		try {
			await acceptDuel(duel.id)
			toast.success(t('toastAccepted'))
			onAction()
		} catch (e) {
			toast.error(e instanceof Error ? e.message : t('toastFailed'))
		} finally {
			setActing(false)
		}
	}

	const handleDecline = async () => {
		setActing(true)
		try {
			await declineDuel(duel.id)
			toast.success(t('toastDeclined'))
			onAction()
		} catch (e) {
			toast.error(e instanceof Error ? e.message : t('toastFailed'))
		} finally {
			setActing(false)
		}
	}

	const handleCancel = async () => {
		setActing(true)
		try {
			await cancelDuel(duel.id)
			toast.success(t('toastCancelled'))
			onAction()
		} catch (e) {
			toast.error(e instanceof Error ? e.message : t('toastFailed'))
		} finally {
			setActing(false)
		}
	}

	return (
		<motion.div
			whileHover={CARD_HOVER}
			transition={TRANSITION_SPRING}
			className='group rounded-2xl border border-border-subtle bg-bg-card p-4 shadow-card transition-all duration-300 hover:shadow-warm md:p-5'
		>
			{/* Header: opponent + status badge */}
			<div className='mb-3 flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='relative'>
						{opponentAvatar ? (
							<Image
								src={opponentAvatar}
								alt={opponentName}
								width={40}
								height={40}
								className='size-10 rounded-full object-cover ring-2 ring-border-subtle'
							/>
						) : (
							<div className='flex size-10 items-center justify-center rounded-full bg-bg-elevated ring-2 ring-border-subtle'>
								<User className='size-5 text-text-muted' />
							</div>
						)}
						{duel.status === 'Completed' && isWinner && (
							<div className='absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-medal-gold shadow-card'>
								<Crown className='size-3 text-white' />
							</div>
						)}
					</div>
					<div>
						<p className='font-semibold text-text'>
							{isChallenger
								? `vs ${opponentName}`
								: `${duel.challengerName} challenged you`}
						</p>
						<p className='text-sm text-text-secondary'>{duel.recipeTitle}</p>
					</div>
				</div>
				<span
					className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold ${meta.color} ${meta.bgColor}`}
				>
					{meta.icon}
					{meta.label}
				</span>
			</div>

			{/* Scores (only when completed) */}
			{duel.status === 'Completed' && myScore != null && theirScore != null && (
				<div className='mb-3 rounded-xl bg-bg-elevated p-3'>
					<div className='flex items-center justify-between'>
						<div className='text-center'>
							<p className='text-xs text-text-muted'>{t('youLabel')}</p>
							<p
								className={`text-2xl font-bold ${isWinner ? 'text-medal-gold' : 'text-text'}`}
							>
								{myScore}
							</p>
						</div>
						<div className='text-center'>
							{isDraw ? (
								<span className='rounded-full bg-warning/10 px-3 py-1 text-sm font-bold text-warning'>
									{t('draw')}
								</span>
							) : isWinner ? (
								<span className='rounded-full bg-success/10 px-3 py-1 text-sm font-bold text-success'>
									{t('won')}
								</span>
							) : (
								<span className='rounded-full bg-error/10 px-3 py-1 text-sm font-bold text-error'>
									{t('lost')}
								</span>
							)}
						</div>
						<div className='text-center'>
							<p className='text-xs text-text-muted'>{opponentName}</p>
							<p
								className={`text-2xl font-bold ${!isWinner && !isDraw ? 'text-medal-gold' : 'text-text'}`}
							>
								{theirScore}
							</p>
						</div>
					</div>
					{duel.bonusXp > 0 && isWinner && (
						<p className='mt-2 text-center text-sm font-semibold text-xp'>
							{t('bonusXP', {n: duel.bonusXp})}
						</p>
					)}
				</div>
			)}

			{/* Message / trash talk */}
			{duel.message && (
				<p className='mb-3 text-sm italic text-text-secondary'>
					&ldquo;{duel.message}&rdquo;
				</p>
			)}

			{/* Deadline info */}
			{duel.status === 'Pending' && duel.acceptDeadline && (
				<p className='mb-3 flex items-center gap-1.5 text-xs text-text-muted'>
					<Clock className='size-3.5' />
					{t('acceptWithin', {time: formatDeadline(duel.acceptDeadline)})}
				</p>
			)}
			{(duel.status === 'Accepted' || duel.status === 'In Progress') &&
				duel.cookDeadline && (
					<p className='mb-3 flex items-center gap-1.5 text-xs text-text-muted'>
						<Clock className='size-3.5' />
						{t('cookWithin', {time: formatDeadline(duel.cookDeadline)})}
					</p>
				)}

			{/* Actions */}
			{duel.status === 'Pending' && !isChallenger && (
				<div className='flex gap-2'>
					<motion.button
						whileTap={BUTTON_TAP}
						disabled={acting}
						onClick={handleAccept}
						className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand/90 disabled:opacity-50'
					>
						<Check className='size-4' />
						Accept
					</motion.button>
					<motion.button
						whileTap={BUTTON_TAP}
						disabled={acting}
						onClick={handleDecline}
						className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-elevated disabled:opacity-50'
					>
						<X className='size-4' />
						Decline
					</motion.button>
				</div>
			)}
			{duel.status === 'Pending' && isChallenger && (
				<motion.button
					whileTap={BUTTON_TAP}
					disabled={acting}
					onClick={handleCancel}
					className='w-full rounded-xl border border-border-subtle bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-elevated disabled:opacity-50'
				>
					Cancel Challenge
				</motion.button>
			)}
			{(duel.status === 'Accepted' || duel.status === 'In Progress') && (
				<a
					href={`/recipes/${duel.recipeId}?cook=true`}
					className='flex items-center justify-center gap-2 rounded-xl bg-gradient-streak px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-opacity hover:opacity-90'
				>
					<ChefHat className='size-4' />
					Start Cooking
					<ChevronRight className='size-4' />
				</a>
			)}
		</motion.div>
	)
}

// ============================================
// DUEL CARD SKELETON
// ============================================

function DuelCardSkeleton() {
	return (
		<div className='animate-pulse rounded-2xl border border-border-subtle bg-bg-card p-4 md:p-5'>
			<div className='mb-3 flex items-center justify-between'>
				<div className='flex items-center gap-3'>
					<div className='size-10 rounded-full bg-bg-elevated' />
					<div className='space-y-1.5'>
						<div className='h-4 w-32 rounded bg-bg-elevated' />
						<div className='h-3 w-24 rounded bg-bg-elevated' />
					</div>
				</div>
				<div className='h-6 w-20 rounded-full bg-bg-elevated' />
			</div>
			<div className='h-9 w-full rounded-xl bg-bg-elevated' />
		</div>
	)
}

// ============================================
// CREATE DUEL MODAL
// ============================================

function CreateDuelModal({
	isOpen,
	onClose,
	onCreated,
}: {
	isOpen: boolean
	onClose: () => void
	onCreated: () => void
}) {
	const t = useTranslations('duels')
	const [step, setStep] = useState<'friend' | 'recipe' | 'confirm'>('friend')
	const [friends, setFriends] = useState<Profile[]>([])
	const [friendSearch, setFriendSearch] = useState('')
	const [recipes, setRecipes] = useState<Recipe[]>([])
	const [recipeSearch, setRecipeSearch] = useState('')
	const [selectedFriend, setSelectedFriend] = useState<Profile | null>(null)
	const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
	const [message, setMessage] = useState('')
	const [loading, setLoading] = useState(false)
	const [submitting, setSubmitting] = useState(false)

	// Load friends
	useEffect(() => {
		if (!isOpen) return
		let cancelled = false
		setStep('friend')
		setSelectedFriend(null)
		setSelectedRecipe(null)
		setMessage('')
		const loadFriends = async () => {
			setLoading(true)
			const res = await getFollowing()
			if (cancelled) return
			if (res.success && res.data) setFriends(res.data)
			setLoading(false)
		}
		loadFriends()
		return () => {
			cancelled = true
		}
	}, [isOpen])

	// Load recipes when moving to recipe step
	useEffect(() => {
		if (step !== 'recipe') return
		let cancelled = false
		const loadRecipes = async () => {
			setLoading(true)
			const res = await getAllRecipes({ page: 0, size: 20 })
			if (cancelled) return
			if (res.success && res.data) {
				setRecipes(Array.isArray(res.data) ? res.data : [])
			}
			setLoading(false)
		}
		loadRecipes()
		return () => {
			cancelled = true
		}
	}, [step])

	const filteredFriends = useMemo(
		() =>
			friends.filter(f => {
				const name = getProfileDisplayName(f).toLowerCase()
				const q = friendSearch.toLowerCase()
				return name.includes(q) || f.username?.toLowerCase().includes(q)
			}),
		[friends, friendSearch],
	)

	const filteredRecipes = useMemo(
		() =>
			recipes.filter(r =>
				r.title.toLowerCase().includes(recipeSearch.toLowerCase()),
			),
		[recipes, recipeSearch],
	)

	const handleSubmit = async () => {
		if (!selectedFriend || !selectedRecipe) return
		setSubmitting(true)
		try {
			const request: CreateDuelRequest = {
				opponentId: selectedFriend.userId,
				recipeId: selectedRecipe.id,
				...(message.trim() && { message: message.trim() }),
			}
			await createDuel(request)
			toast.success(
				`Challenge sent to ${getProfileDisplayName(selectedFriend)}!`,
			)
			onCreated()
			onClose()
		} catch (e) {
			toast.error(e instanceof Error ? e.message : t('toastFailedSend'))
		} finally {
			setSubmitting(false)
		}
	}

	if (!isOpen) return null

	return (
		<Portal>
			<div className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'>
				<motion.div
					initial={{ opacity: 0, scale: 0.95 }}
					animate={{ opacity: 1, scale: 1 }}
					exit={{ opacity: 0, scale: 0.95 }}
					transition={TRANSITION_SPRING}
					className='w-full max-w-md overflow-hidden rounded-2xl bg-bg-card shadow-xl'
				>
					{/* Header */}
					<div className='flex items-center justify-between border-b border-border-subtle px-5 py-4'>
						<div className='flex items-center gap-2'>
							<Swords className='size-5 text-brand' />
							<h2 className='text-lg font-bold text-text'>
								{step === 'friend'
									? 'Pick a Friend'
									: step === 'recipe'
										? 'Pick a Recipe'
										: 'Confirm Challenge'}
							</h2>
						</div>
						<button
							type='button'
							onClick={onClose}
							aria-label={t('closeModal')}
							className='rounded-lg p-1.5 text-text-muted transition-colors hover:bg-bg-elevated'
						>
							<X className='size-5' />
						</button>
					</div>

					{/* Step indicator */}
					<div className='flex gap-1 px-5 pt-4'>
						{['friend', 'recipe', 'confirm'].map((s, i) => (
							<div
								key={s}
								className={`h-1 flex-1 rounded-full transition-colors ${
									['friend', 'recipe', 'confirm'].indexOf(step) >= i
										? 'bg-brand'
										: 'bg-bg-elevated'
								}`}
							/>
						))}
					</div>

					<div className='max-h-[60vh] overflow-y-auto p-5'>
						{/* STEP 1: Friend picker */}
						{step === 'friend' && (
							<div className='space-y-3'>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
									<input
										type='text'
										placeholder={t('searchFriends')}
										value={friendSearch}
										onChange={e => setFriendSearch(e.target.value)}
										className='w-full rounded-xl border border-border-subtle bg-bg py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
									/>
								</div>
								{loading ? (
									<div className='space-y-2'>
										{[1, 2, 3].map(i => (
											<div
												key={i}
												className='flex animate-pulse items-center gap-3 rounded-xl p-3'
											>
												<div className='size-10 rounded-full bg-bg-elevated' />
												<div className='h-4 w-32 rounded bg-bg-elevated' />
											</div>
										))}
									</div>
								) : filteredFriends.length === 0 ? (
									<p className='py-8 text-center text-sm text-text-muted'>
										{friends.length === 0
											? 'Follow some people to challenge them!'
											: 'No friends match your search'}
									</p>
								) : (
									<div className='space-y-1'>
										{filteredFriends.map(friend => (
											<motion.button
												key={friend.userId}
												whileTap={BUTTON_TAP}
												onClick={() => {
													setSelectedFriend(friend)
													setStep('recipe')
												}}
												className='flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-bg-elevated'
											>
												{friend.avatarUrl ? (
													<Image
														src={friend.avatarUrl}
														alt={getProfileDisplayName(friend)}
														width={40}
														height={40}
														className='size-10 rounded-full object-cover'
													/>
												) : (
													<div className='flex size-10 items-center justify-center rounded-full bg-bg-elevated'>
														<User className='size-5 text-text-muted' />
													</div>
												)}
												<div>
													<p className='font-medium text-text'>
														{getProfileDisplayName(friend)}
													</p>
													<p className='text-xs text-text-secondary'>
														@{friend.username}
													</p>
												</div>
												<ChevronRight className='ml-auto size-4 text-text-muted' />
											</motion.button>
										))}
									</div>
								)}
							</div>
						)}

						{/* STEP 2: Recipe picker */}
						{step === 'recipe' && (
							<div className='space-y-3'>
								<div className='relative'>
									<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
									<input
										type='text'
										placeholder={t('searchRecipes')}
										value={recipeSearch}
										onChange={e => setRecipeSearch(e.target.value)}
										className='w-full rounded-xl border border-border-subtle bg-bg py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
									/>
								</div>
								{loading ? (
									<div className='space-y-2'>
										{[1, 2, 3].map(i => (
											<div
												key={i}
												className='flex animate-pulse items-center gap-3 rounded-xl p-3'
											>
												<div className='size-12 rounded-xl bg-bg-elevated' />
												<div className='space-y-1.5'>
													<div className='h-4 w-40 rounded bg-bg-elevated' />
													<div className='h-3 w-24 rounded bg-bg-elevated' />
												</div>
											</div>
										))}
									</div>
								) : filteredRecipes.length === 0 ? (
									<p className='py-8 text-center text-sm text-text-muted'>
										No recipes found
									</p>
								) : (
									<div className='space-y-1'>
										{filteredRecipes.map(recipe => (
											<motion.button
												key={recipe.id}
												whileTap={BUTTON_TAP}
												onClick={() => {
													setSelectedRecipe(recipe)
													setStep('confirm')
												}}
												className='flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors hover:bg-bg-elevated'
											>
												{recipe.coverImageUrl?.[0] ? (
													<Image
														src={recipe.coverImageUrl[0]}
														alt={recipe.title}
														width={48}
														height={48}
														className='size-12 rounded-xl object-cover'
													/>
												) : (
													<div className='flex size-12 items-center justify-center rounded-xl bg-bg-elevated'>
														<ChefHat className='size-5 text-text-muted' />
													</div>
												)}
												<div className='min-w-0 flex-1'>
													<p className='truncate font-medium text-text'>
														{recipe.title}
													</p>
													<p className='text-xs text-text-secondary'>
														{recipe.difficulty} &middot;{' '}
														{recipe.steps?.length ?? 0} steps
													</p>
												</div>
												<ChevronRight className='size-4 flex-shrink-0 text-text-muted' />
											</motion.button>
										))}
									</div>
								)}
								<button
									type='button'
									onClick={() => setStep('friend')}
									className='text-sm font-medium text-brand hover:underline'
								>
									{t('backToFriends')}
								</button>
							</div>
						)}

						{/* STEP 3: Confirm */}
						{step === 'confirm' && selectedFriend && selectedRecipe && (
							<div className='space-y-4'>
								{/* Summary */}
								<div className='rounded-xl bg-bg-elevated p-4'>
									<div className='mb-3 flex items-center gap-3'>
										<Swords className='size-5 text-brand' />
										<span className='font-semibold text-text'>
											Challenge Summary
										</span>
									</div>
									<div className='space-y-2 text-sm'>
										<div className='flex items-center justify-between'>
											<span className='text-text-secondary'>{t('opponent')}</span>
											<span className='font-medium text-text'>
												{getProfileDisplayName(selectedFriend)}
											</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-text-secondary'>{t('recipe')}</span>
											<span className='font-medium text-text'>
												{selectedRecipe.title}
											</span>
										</div>
										<div className='flex items-center justify-between'>
											<span className='text-text-secondary'>{t('bonusXpLabel')}</span>
											<span className='font-semibold text-xp'>{t('bonusXpValue')}</span>
										</div>
									</div>
								</div>

								{/* Optional message */}
								<div>
									<label className='mb-1.5 block text-sm font-medium text-text-secondary'>
										Trash talk (optional)
									</label>
									<input
										type='text'
										placeholder={t('trashTalkPlaceholder')}
										value={message}
										onChange={e => setMessage(e.target.value)}
										maxLength={200}
										className='w-full rounded-xl border border-border-subtle bg-bg py-2.5 px-4 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand'
									/>
								</div>

								{/* Actions */}
								<div className='flex gap-2'>
									<button
										type='button'
										onClick={() => setStep('recipe')}
										className='flex-1 rounded-xl border border-border-subtle bg-bg-card px-4 py-2.5 text-sm font-semibold text-text-secondary transition-colors hover:bg-bg-elevated'
									>
										Back
									</button>
									<motion.button
										whileTap={BUTTON_TAP}
										disabled={submitting}
										onClick={handleSubmit}
										className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand/90 disabled:opacity-50'
									>
										<Send className='size-4' />
										{submitting ? 'Sending...' : 'Send Challenge'}
									</motion.button>
								</div>
							</div>
						)}
					</div>
				</motion.div>
			</div>
		</Portal>
	)
}

// ============================================
// MAIN DUELS SECTION
// ============================================

export function DuelsSection() {
	const user = useAuthStore(s => s.user)
	const [invites, setInvites] = useState<DuelResponse[]>([])
	const [activeDuels, setActiveDuels] = useState<DuelResponse[]>([])
	const [history, setHistory] = useState<DuelResponse[]>([])
	const [loading, setLoading] = useState(true)
	const [showCreate, setShowCreate] = useState(false)
	const [showHistory, setShowHistory] = useState(false)
	const t = useTranslations('duels')

	const loadDuels = async () => {
		setLoading(true)
		try {
			const [inv, active, all] = await Promise.all([
				getPendingInvites(),
				getActiveDuels(),
				getMyDuels(),
			])
			setInvites(inv)
			setActiveDuels(active)
			// History = completed, declined, expired, cancelled
			setHistory(
				all.filter(
					d =>
						d.status === 'Completed' ||
						d.status === 'Declined' ||
						d.status === 'Expired' ||
						d.status === 'Cancelled',
				),
			)
		} catch (err) {
			logDevError('Failed to load duels:', err)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		loadDuels()
	}, [])

	const currentUserId = user?.userId ?? ''

	return (
		<section className='mb-8'>
			{/* Section Header */}
			<div className='mb-4 flex items-center justify-between'>
				<div className='flex items-center gap-2'>
					<Swords className='size-5 text-brand' />
					<h2 className='text-lg font-bold text-text'>{t('title')}</h2>
					{invites.length > 0 && (
						<span className='flex size-5 items-center justify-center rounded-full bg-brand text-xs font-bold text-white'>
							{invites.length}
						</span>
					)}
				</div>
				<motion.button
					whileTap={BUTTON_TAP}
					onClick={() => setShowCreate(true)}
					className='flex items-center gap-1.5 rounded-xl bg-brand px-3.5 py-2 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand/90'
				>
					<Swords className='size-4' />
					Challenge
				</motion.button>
			</div>

			{loading ? (
				<div className='space-y-3'>
					<DuelCardSkeleton />
					<DuelCardSkeleton />
				</div>
			) : invites.length === 0 &&
			  activeDuels.length === 0 &&
			  history.length === 0 ? (
				<div className='rounded-2xl border border-border-subtle bg-bg-card p-8 text-center'>
					<Swords className='mx-auto mb-3 size-10 text-text-muted' />
					<p className='mb-1 font-semibold text-text'>{t('noDuels')}</p>
					<p className='mb-4 text-sm text-text-secondary'>
						Challenge a friend to a 1v1 cooking battle!
					</p>
					<motion.button
						whileTap={BUTTON_TAP}
						onClick={() => setShowCreate(true)}
						className='inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-white shadow-card transition-colors hover:bg-brand/90'
					>
						<Swords className='size-4' />
						Send First Challenge
					</motion.button>
				</div>
			) : (
				<div className='space-y-4'>
					{/* Pending Invites */}
					{invites.length > 0 && (
						<div>
							<p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted'>
								{t('incomingChallenges')}
							</p>
							<div className='space-y-3'>
								{invites.map(duel => (
									<DuelCard
										key={duel.id}
										duel={duel}
										currentUserId={currentUserId}
										onAction={loadDuels}
									/>
								))}
							</div>
						</div>
					)}

					{/* Active Duels */}
					{activeDuels.length > 0 && (
						<div>
							<p className='mb-2 text-xs font-semibold uppercase tracking-wider text-text-muted'>
								{t('activeDuels')}
							</p>
							<div className='space-y-3'>
								{activeDuels.map(duel => (
									<DuelCard
										key={duel.id}
										duel={duel}
										currentUserId={currentUserId}
										onAction={loadDuels}
									/>
								))}
							</div>
						</div>
					)}

					{/* History toggle */}
					{history.length > 0 && (
						<div>
							<button
								type='button'
								onClick={() => setShowHistory(v => !v)}
								className='mb-2 flex items-center gap-1.5 text-sm font-medium text-text-secondary hover:text-text'
							>
								<Trophy className='size-4' />
								{t('pastDuels')} ({history.length})
								<ChevronRight
									className={`size-4 transition-transform ${showHistory ? 'rotate-90' : ''}`}
								/>
							</button>
							<AnimatePresence>
								{showHistory && (
									<motion.div
										initial={{ opacity: 0, height: 0 }}
										animate={{ opacity: 1, height: 'auto' }}
										exit={{ opacity: 0, height: 0 }}
										transition={TRANSITION_SPRING}
										className='space-y-3 overflow-hidden'
									>
										{history.map(duel => (
											<DuelCard
												key={duel.id}
												duel={duel}
												currentUserId={currentUserId}
												onAction={loadDuels}
											/>
										))}
									</motion.div>
								)}
							</AnimatePresence>
						</div>
					)}
				</div>
			)}

			{/* Create Duel Modal */}
			<AnimatePresence>
				{showCreate && (
					<CreateDuelModal
						isOpen={showCreate}
						onClose={() => setShowCreate(false)}
						onCreated={loadDuels}
					/>
				)}
			</AnimatePresence>
		</section>
	)
}
