'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
	Camera,
	X,
	Send,
	Image as ImageIcon,
	Loader2,
	BarChart3,
	Lightbulb,
	Swords,
	Search,
	ChefHat,
} from 'lucide-react'
import Image from 'next/image'
import { createPost } from '@/services/post'
import { moderateContent } from '@/services/ai'
import { autocompleteSearch } from '@/services/search'
import { Post } from '@/lib/types'
import { Portal } from '@/components/ui/portal'
import { useAuthStore } from '@/store/authStore'
import { toast } from 'sonner'
import {
	TRANSITION_SPRING,
	BUTTON_HOVER,
	BUTTON_TAP,
	BUTTON_SUBTLE_HOVER,
	BUTTON_SUBTLE_TAP,
} from '@/lib/motion'
import { triggerSuccessConfetti } from '@/lib/confetti'
import { cn } from '@/lib/utils'
import { MentionInput } from '@/components/shared/MentionInput'

interface QuickPostFABProps {
	onPostCreated?: (post: Post) => void
	className?: string
}

export const QuickPostFAB = ({
	onPostCreated,
	className,
}: QuickPostFABProps) => {
	const [isOpen, setIsOpen] = useState(false)
	const [mode, setMode] = useState<'post' | 'poll' | 'tip' | 'battle'>('post')
	const t = useTranslations('social')
	const [caption, setCaption] = useState('')
	const [taggedUserIds, setTaggedUserIds] = useState<string[]>([])
	const [photoFiles, setPhotoFiles] = useState<File[]>([])
	const [previewUrls, setPreviewUrls] = useState<string[]>([])
	const [isSubmitting, setIsSubmitting] = useState(false)

	useEscapeKey(isOpen && !isSubmitting, () => setIsOpen(false))

	// Poll state
	const [pollQuestion, setPollQuestion] = useState('')
	const [pollOptionA, setPollOptionA] = useState('')
	const [pollOptionB, setPollOptionB] = useState('')

	// Battle state
	const [battleRecipeA, setBattleRecipeA] = useState<{ id: string; title: string } | null>(null)
	const [battleRecipeB, setBattleRecipeB] = useState<{ id: string; title: string } | null>(null)
	const [battleSearch, setBattleSearch] = useState('')
	const [battleSearchResults, setBattleSearchResults] = useState<{ id: string; title: string }[]>([])
	const [battleSearching, setBattleSearching] = useState(false)
	const [battlePickingSlot, setBattlePickingSlot] = useState<'A' | 'B' | null>(null)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const battleSearchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)
	const { user } = useAuthStore()

	// Dismissible hint — show on first visit
	const [showHint, setShowHint] = useState(false)
	useEffect(() => {
		const dismissed = localStorage.getItem('fab-hint-dismissed')
		if (!dismissed) setShowHint(true)
	}, [])
	const dismissHint = () => {
		setShowHint(false)
		localStorage.setItem('fab-hint-dismissed', '1')
	}

	const MAX_PHOTOS = 5
	const MAX_PHOTO_SIZE = 10 * 1024 * 1024

	const handleOpen = () => {
		setIsOpen(true)
		if (mode === 'post') {
			setTimeout(() => fileInputRef.current?.click(), 100)
		}
	}

	const handleClose = () => {
		if (isSubmitting) return
		setIsOpen(false)
		setMode('post')
		setCaption('')
		setTaggedUserIds([])
		setPhotoFiles([])
		setPreviewUrls([])
		setPollQuestion('')
		setPollOptionA('')
		setPollOptionB('')
		setBattleRecipeA(null)
		setBattleRecipeB(null)
		setBattleSearch('')
		setBattleSearchResults([])
		setBattlePickingSlot(null)
	}

	const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const files = Array.from(e.target.files || [])
		if (files.length === 0) return

		const invalidFile = files.find(
			file => !file.type.startsWith('image/') || file.size > MAX_PHOTO_SIZE,
		)
		if (invalidFile) {
			toast.error(
				!invalidFile.type.startsWith('image/')
					? t('fabInvalidFileType')
					: t('fabFileTooLarge'),
			)
			e.currentTarget.value = ''
			return
		}

		const remainingSlots = MAX_PHOTOS - photoFiles.length
		const selectedFiles = files.slice(0, remainingSlots)
		if (selectedFiles.length < files.length) {
			toast.warning(t('fabPhotosLimited', { count: remainingSlots }))
		}

		setPhotoFiles(prev => [...prev, ...selectedFiles])
		selectedFiles.forEach(file => {
			const reader = new FileReader()
			reader.onloadend = () => {
				setPreviewUrls(prev => [...prev, reader.result as string])
			}
			reader.readAsDataURL(file)
		})
		e.currentTarget.value = ''
	}

	const removePhoto = (index: number) => {
		setPhotoFiles(prev => prev.filter((_, i) => i !== index))
		setPreviewUrls(prev => prev.filter((_, i) => i !== index))
	}

	const handleBattleSearch = (query: string) => {
		setBattleSearch(query)
		if (battleSearchTimeout.current) clearTimeout(battleSearchTimeout.current)
		if (!query.trim()) {
			setBattleSearchResults([])
			return
		}
		battleSearchTimeout.current = setTimeout(async () => {
			setBattleSearching(true)
			try {
				const res = await autocompleteSearch(query.trim(), 'recipes', 6)
				if (res.success && res.data) {
					const hits = res.data.recipes?.hits ?? []
					const recipes = hits.map((h) => ({
						id: h.document.id,
						title: h.document.title,
					}))
					setBattleSearchResults(recipes)
				}
			} catch {
				// Silently fail search
			} finally {
				setBattleSearching(false)
			}
		}, 300)
	}

	const selectBattleRecipe = (recipe: { id: string; title: string }) => {
		if (battlePickingSlot === 'A') {
			if (battleRecipeB?.id === recipe.id) {
				toast.error(t('fabBattleDifferentRecipe'))
				return
			}
			setBattleRecipeA(recipe)
		} else {
			if (battleRecipeA?.id === recipe.id) {
				toast.error(t('fabBattleDifferentRecipe'))
				return
			}
			setBattleRecipeB(recipe)
		}
		setBattlePickingSlot(null)
		setBattleSearch('')
		setBattleSearchResults([])
	}

	const handleSubmit = async () => {
		if (isSubmitting) return

		if (mode === 'poll') {
			if (!pollQuestion.trim() || !pollOptionA.trim() || !pollOptionB.trim()) {
				toast.error(t('fabPollFillAll'))
				return
			}

			setIsSubmitting(true)
			try {
				const moderationResult = await moderateContent(
					pollQuestion.trim(),
					'post_caption',
				)
				if (!moderationResult.success) {
					toast.error(t('fabModerationFailed'))
					return
				}
				if (moderationResult.data?.action === 'block') {
					toast.error(
						moderationResult.data.reason ||
							t('fabContentBlocked'),
					)
					return
				}

				const response = await createPost({
					avatarUrl: user?.avatarUrl || '/placeholder-avatar.svg',
					content: pollQuestion.trim(),
					postType: 'POLL',
					pollQuestion: pollQuestion.trim(),
					pollOptionA: pollOptionA.trim(),
					pollOptionB: pollOptionB.trim(),
				})

				if (response.success && response.data) {
					triggerSuccessConfetti()
					toast.success(t('fabPollCreated'))
					onPostCreated?.(response.data as Post)
					handleClose()
					return
				}
				toast.error(response.message || t('fabPollFailed'))
			} catch {
				toast.error(t('fabPollNetworkError'))
			} finally {
				setIsSubmitting(false)
			}
			return
		}

		if (mode === 'tip') {
			if (!caption.trim()) {
				toast.error(t('fabTipEmpty'))
				return
			}
			if (caption.trim().length < 10) {
				toast.error(t('fabTipTooShort'))
				return
			}

			setIsSubmitting(true)
			try {
				const moderationResult = await moderateContent(
					caption.trim(),
					'post_caption',
				)
				if (!moderationResult.success) {
					toast.error(t('fabModerationFailed'))
					return
				}
				if (moderationResult.data?.action === 'block') {
					toast.error(
						moderationResult.data.reason ||
							t('fabContentBlocked'),
					)
					return
				}

				const response = await createPost({
					avatarUrl: user?.avatarUrl || '/placeholder-avatar.svg',
					content: caption.trim(),
					photoUrls: photoFiles.length > 0 ? photoFiles : undefined,
					postType: 'QUICK_TIP',
				})

				if (response.success && response.data) {
					triggerSuccessConfetti()
					toast.success(t('fabTipShared'))
					onPostCreated?.(response.data as Post)
					handleClose()
					return
				}
				toast.error(response.message || t('fabTipFailed'))
			} catch {
				toast.error(t('fabTipNetworkError'))
			} finally {
				setIsSubmitting(false)
			}
			return
		}

		if (mode === 'battle') {
			if (!battleRecipeA || !battleRecipeB) {
				toast.error(t('fabBattlePickTwo'))
				return
			}
			if (!caption.trim()) {
				toast.error(t('fabBattleNeedCaption'))
				return
			}

			setIsSubmitting(true)
			try {
				const moderationResult = await moderateContent(
					caption.trim(),
					'post_caption',
				)
				if (!moderationResult.success) {
					toast.error(t('fabModerationFailed'))
					return
				}
				if (moderationResult.data?.action === 'block') {
					toast.error(
						moderationResult.data.reason ||
							t('fabContentBlocked'),
					)
					return
				}

				const response = await createPost({
					avatarUrl: user?.avatarUrl || '/placeholder-avatar.svg',
					content: caption.trim(),
					postType: 'RECIPE_BATTLE',
					battleRecipeIdA: battleRecipeA.id,
					battleRecipeIdB: battleRecipeB.id,
				})

				if (response.success && response.data) {
					triggerSuccessConfetti()
					toast.success(t('fabBattleStarted'))
					onPostCreated?.(response.data as Post)
					handleClose()
					return
				}
				toast.error(response.message || t('fabBattleFailed'))
			} catch {
				toast.error(t('fabBattleNetworkError'))
			} finally {
				setIsSubmitting(false)
			}
			return
		}

		if (!caption.trim() && photoFiles.length === 0) {
			toast.error(t('fabPostAddPhotoOrText'))
			return
		}
		if (!caption.trim()) {
			toast.error(t('fabPostAddCaption'))
			return
		}

		setIsSubmitting(true)
		try {
			// AI content moderation (fail-closed)
			const moderationResult = await moderateContent(
				caption.trim(),
				'post_caption',
			)
			if (!moderationResult.success) {
				toast.error(t('fabModerationFailed'))
				return
			}
			if (moderationResult.data?.action === 'block') {
				toast.error(
					moderationResult.data.reason ||
						t('fabContentBlocked'),
				)
				return
			}
			if (moderationResult.data?.action === 'flag') {
				toast.warning(
					moderationResult.data.reason ||
						t('fabContentFlagged'),
				)
			}

			const response = await createPost({
				avatarUrl: user?.avatarUrl || '/placeholder-avatar.svg',
				content: caption.trim(),
				photoUrls: photoFiles.length > 0 ? photoFiles : undefined,
				postType: 'QUICK',
				taggedUserIds: taggedUserIds.length > 0 ? taggedUserIds : undefined,
			})

			if (response.success && response.data) {
				triggerSuccessConfetti()
				toast.success(t('fabPostShared'))
				onPostCreated?.(response.data as Post)
				handleClose()
				return
			}
			toast.error(response.message || t('fabPostFailed'))
		} catch {
			toast.error(t('fabPostNetworkError'))
		} finally {
			setIsSubmitting(false)
		}
	}

	return (
		<>
			{/* FAB Button with discoverability hint */}
			<div className='fixed bottom-6 right-6 z-sticky flex items-center gap-3'>
				{/* First-visit hint pill */}
				<AnimatePresence>
					{showHint && !isOpen && (
						<motion.button
							type='button'
							initial={{ opacity: 0, x: 20, scale: 0.9 }}
							animate={{ opacity: 1, x: 0, scale: 1 }}
							exit={{ opacity: 0, x: 20, scale: 0.9 }}
							transition={TRANSITION_SPRING}
							onClick={() => { dismissHint(); handleOpen() }}
							className='flex items-center gap-2 rounded-full border border-brand/20 bg-bg-card px-4 py-2.5 text-sm font-medium text-text shadow-warm transition-colors hover:bg-bg-elevated focus-visible:ring-2 focus-visible:ring-brand/50'
						>
							<Camera className='size-4 text-brand' />
						{t('fabHintText')}
							<X
								className='size-3.5 text-text-muted hover:text-text'
								onClick={(e) => { e.stopPropagation(); dismissHint() }}
							/>
						</motion.button>
					)}
				</AnimatePresence>

				<motion.button
					type='button'
					onClick={() => { dismissHint(); handleOpen() }}
					className={cn(
						'group relative flex size-14 items-center justify-center rounded-full bg-gradient-brand transition-all duration-300 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-brand/50',
						className,
					)}
					whileHover={BUTTON_SUBTLE_HOVER}
					whileTap={BUTTON_SUBTLE_TAP}
					transition={TRANSITION_SPRING}
					aria-label={t('fabAriaLabel')}
				>
					<Camera className='size-6 text-white' />
					{/* Tooltip on hover (desktop) */}
					<span className='pointer-events-none absolute bottom-full right-0 mb-2 hidden whitespace-nowrap rounded-lg bg-text px-3 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100 sm:block'>
						{t('fabTooltip')}
					</span>
				</motion.button>
			</div>

			{/* Quick Post Modal */}
			<AnimatePresence>
				{isOpen && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-end justify-center bg-black/60 sm:items-center'
							onClick={handleClose}
						>
							<motion.div
								initial={{ opacity: 0, y: 100 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 100 }}
								transition={TRANSITION_SPRING}
								className='w-full max-w-lg rounded-t-2xl border border-border-subtle bg-bg-card p-5 shadow-card sm:rounded-2xl'
								onClick={e => e.stopPropagation()}
							>
								{/* Header */}
								<div className='mb-4 flex items-center justify-between'>
									<h2 className='flex items-center gap-2 text-lg font-bold text-text'>
										{mode === 'post' && <Camera className='size-5 text-brand' />}
										{mode === 'poll' && <BarChart3 className='size-5 text-brand' />}
										{mode === 'tip' && <Lightbulb className='size-5 text-warning' />}
										{mode === 'battle' && <Swords className='size-5 text-error' />}
										{mode === 'post' ? t('fabTitlePost') : mode === 'poll' ? t('fabTitlePoll') : mode === 'tip' ? t('fabTitleTip') : t('fabTitleBattle')}
									</h2>
									<button
										type='button'
										onClick={handleClose}
										disabled={isSubmitting}
										aria-label={t('fabClose')}
										className='grid size-8 place-items-center rounded-lg text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
									>
										<X className='size-5' />
									</button>
								</div>

								{/* Mode Toggle */}
								<div className='mb-4 flex gap-1 rounded-xl bg-bg-elevated p-1'>
									{([
										{ key: 'post', icon: Camera, label: t('fabModePost') },
										{ key: 'poll', icon: BarChart3, label: t('fabModePoll') },
										{ key: 'tip', icon: Lightbulb, label: t('fabModeTip') },
										{ key: 'battle', icon: Swords, label: t('fabModeBattle') },
									] as const).map(({ key, icon: Icon, label }) => (
										<button
											type='button'
											key={key}
											onClick={() => setMode(key)}
											className={cn(
												'flex flex-1 items-center justify-center gap-1 rounded-lg py-2 text-xs font-medium transition-all sm:text-sm sm:gap-1.5',
												mode === key
													? 'bg-bg-card text-text shadow-card'
													: 'text-text-muted hover:text-text',
											)}
										>
											<Icon className='size-3.5 sm:size-4' />
											{label}
										</button>
									))}
								</div>

								{mode === 'poll' ? (
									<>
										{/* Poll Question */}
										<div className='mb-3'>
											<input
												type='text'
												value={pollQuestion}
												onChange={e => setPollQuestion(e.target.value)}
												placeholder={t('fabPollQuestionPlaceholder')}
												maxLength={200}
												disabled={isSubmitting}
												className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											/>										<p className={`mt-1 text-right text-xs tabular-nums ${pollQuestion.length > 160 ? (pollQuestion.length >= 200 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}>
											{pollQuestion.length}/200
										</p>										</div>

										{/* Poll Options */}
										<div className='mb-4 space-y-2'>
											<div className='flex items-center gap-2'>
												<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand'>
													A
												</span>
												<input
													type='text'
													value={pollOptionA}
													onChange={e => setPollOptionA(e.target.value)}
													placeholder={t('fabPollOptionA')}
													maxLength={100}
													disabled={isSubmitting}
													className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
												/>
											</div>
											<div className='flex items-center gap-2'>
												<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary'>
													B
												</span>
												<input
													type='text'
													aria-label={t('fabPollOptionB')}
													value={pollOptionB}
													onChange={e => setPollOptionB(e.target.value)}
													placeholder={t('fabPollOptionB')}
													maxLength={100}
													disabled={isSubmitting}
													className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
												/>
											</div>
										</div>
									</>
								) : mode === 'tip' ? (
									<>
										{/* Tip Content */}
										<div className='mb-3'>
											<div className='mb-2 flex items-center gap-2 rounded-lg bg-warning/10 px-3 py-2'>
												<Lightbulb className='size-4 shrink-0 text-warning' />
												<span className='text-xs text-warning'>{t('fabTipInfoText')}</span>
											</div>
											<textarea
												value={caption}
												onChange={e => setCaption(e.target.value)}
											placeholder={t('fabTipPlaceholder')}
												maxLength={280}
												rows={3}
												disabled={isSubmitting}
												className='w-full resize-none rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											/>
											<p className={`mt-1 text-right text-xs tabular-nums ${caption.length > 224 ? (caption.length >= 280 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}>
												{caption.length}/280
											</p>
										</div>

										{/* Optional photo for tip */}
										<div className='mb-4'>
											{previewUrls.length > 0 ? (
												<div className='grid grid-cols-3 gap-2'>
													{previewUrls.map((url, index) => (
														<div
															key={index}
															className='group relative aspect-square overflow-hidden rounded-xl'
														>
															<Image
																src={url}
																alt={`Photo ${index + 1}`}
																fill
																sizes='120px'
																className='object-cover'
															/>
															<button
																type='button'
																onClick={() => removePhoto(index)}
																aria-label={t('fabRemovePhoto')}
															className='absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-70 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
															>
																<X className='size-3.5' />
															</button>
														</div>
													))}
													{photoFiles.length < 1 && (
														<label className='flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border-subtle transition-colors hover:border-brand/50 hover:bg-brand/5'>
															<ImageIcon className='size-6 text-text-muted' />
															<input
																type='file'
																accept='image/*'
																onChange={handlePhotoSelect}
																className='hidden'
															/>
														</label>
													)}
												</div>
											) : (
												<label className='flex h-20 cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-subtle transition-colors hover:border-brand/50 hover:bg-brand/5'>
													<ImageIcon className='size-5 text-text-muted' />
													<span className='text-sm text-text-muted'>{t('fabTipAddPhoto')}</span>
													<input
														type='file'
														accept='image/*'
														onChange={handlePhotoSelect}
														className='hidden'
													/>
												</label>
											)}
										</div>
									</>
								) : mode === 'battle' ? (
									<>
										{/* Battle Recipe Picker */}
										<div className='mb-3 space-y-3'>
											{/* Recipe A */}
											<div className='rounded-xl border border-border-subtle bg-bg-elevated p-3'>
												<div className='mb-2 flex items-center gap-2'>
													<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-xs font-bold text-brand'>A</span>
													<span className='text-sm font-medium text-text'>
														{battleRecipeA ? battleRecipeA.title : t('fabBattlePickFirst')}
													</span>
													{battleRecipeA && (
														<button
															type='button'
															onClick={() => setBattleRecipeA(null)}
															aria-label={t('fabBattleRemoveRecipe')}
															className='ml-auto grid size-6 place-items-center rounded-full text-text-muted hover:bg-bg-card hover:text-text'
														>
															<X className='size-3.5' />
														</button>
													)}
												</div>
												{!battleRecipeA && (
													<button
														type='button'
														onClick={() => setBattlePickingSlot('A')}
														className='flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-brand/30 bg-brand/5 py-2 text-sm font-medium text-brand transition-colors hover:bg-brand/10'
													>
														<Search className='size-4' />
														{t('fabBattleSearchRecipes')}
													</button>
												)}
											</div>

											{/* VS divider */}
											<div className='flex items-center gap-3'>
												<div className='h-px flex-1 bg-border-subtle' />
												<span className='text-sm font-bold text-text-muted'>VS</span>
												<div className='h-px flex-1 bg-border-subtle' />
											</div>

											{/* Recipe B */}
											<div className='rounded-xl border border-border-subtle bg-bg-elevated p-3'>
												<div className='mb-2 flex items-center gap-2'>
													<span className='flex size-7 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-xs font-bold text-secondary'>B</span>
													<span className='text-sm font-medium text-text'>
														{battleRecipeB ? battleRecipeB.title : t('fabBattlePickSecond')}
													</span>
													{battleRecipeB && (
														<button
															type='button'
															onClick={() => setBattleRecipeB(null)}
															aria-label={t('fabBattleRemoveRecipe')}
															className='ml-auto grid size-6 place-items-center rounded-full text-text-muted hover:bg-bg-card hover:text-text'
														>
															<X className='size-3.5' />
														</button>
													)}
												</div>
												{!battleRecipeB && (
													<button
														type='button'
														onClick={() => setBattlePickingSlot('B')}
														className='flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-secondary/30 bg-secondary/5 py-2 text-sm font-medium text-secondary transition-colors hover:bg-secondary/10'
													>
														<Search className='size-4' />
														{t('fabBattleSearchRecipes')}
													</button>
												)}
											</div>

											{/* Recipe search dropdown */}
											{battlePickingSlot && (
												<div className='rounded-xl border border-brand/20 bg-bg-card p-3 shadow-card'>
													<input
														type='text'
														aria-label={t('fabBattleSearchPlaceholder')}
														value={battleSearch}
														onChange={e => handleBattleSearch(e.target.value)}
														placeholder={t('fabBattleSearchPlaceholder')}
														autoFocus
														className='mb-2 w-full rounded-lg border border-border-subtle bg-bg-elevated p-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
													/>
													{battleSearching && (
														<div className='flex items-center justify-center py-3'>
															<Loader2 className='size-4 animate-spin text-text-muted' />
														</div>
													)}
													{!battleSearching && battleSearchResults.length > 0 && (
														<div className='max-h-40 space-y-1 overflow-y-auto'>
															{battleSearchResults.map(recipe => (
																<button
																	type='button'
																	key={recipe.id}
																	onClick={() => selectBattleRecipe(recipe)}
																	className='flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-text transition-colors hover:bg-bg-elevated'
																>
																	<ChefHat className='size-4 shrink-0 text-brand' />
																	{recipe.title}
																</button>
															))}
														</div>
													)}
													{!battleSearching && battleSearch.trim() && battleSearchResults.length === 0 && (
														<p className='py-2 text-center text-xs text-text-muted'>{t('fabBattleNoRecipesFound')}</p>
													)}
													<button
														type='button'
														onClick={() => {
															setBattlePickingSlot(null)
															setBattleSearch('')
															setBattleSearchResults([])
														}}
														className='mt-2 w-full text-center text-xs text-text-muted hover:text-text'
													>
														Cancel
													</button>
												</div>
											)}
										</div>

										{/* Battle caption */}
										<div className='mb-4'>
											<textarea
												value={caption}
												onChange={e => setCaption(e.target.value)}
											placeholder={t('fabBattleCaptionPlaceholder')}
												maxLength={500}
												rows={2}
												disabled={isSubmitting}
												className='w-full resize-none rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
											/>										<p className={`mt-1 text-right text-xs tabular-nums ${caption.length > 400 ? (caption.length >= 500 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}>
											{caption.length}/500
										</p>										</div>
									</>
								) : (
									<>
										{/* Photo Grid */}
										<div className='mb-4'>
											{previewUrls.length > 0 ? (
												<div className='grid grid-cols-3 gap-2'>
													{previewUrls.map((url, index) => (
														<div
															key={index}
															className='group relative aspect-square overflow-hidden rounded-xl'
														>
															<Image
																src={url}
																alt={`Photo ${index + 1}`}
																fill
																sizes='120px'
																className='object-cover'
															/>
															<button
																type='button'
																onClick={() => removePhoto(index)}
																aria-label={t('removePhoto')}
															className='absolute right-1 top-1 grid size-6 place-items-center rounded-full bg-black/60 text-white opacity-70 transition-opacity hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 focus-visible:opacity-100'
															>
																<X className='size-3.5' />
															</button>
														</div>
													))}
													{photoFiles.length < MAX_PHOTOS && (
														<label className='flex aspect-square cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border-subtle transition-colors hover:border-brand/50 hover:bg-brand/5'>
															<ImageIcon className='size-6 text-text-muted' />
															<input
																type='file'
																accept='image/*'
																multiple
																onChange={handlePhotoSelect}
																className='hidden'
															/>
														</label>
													)}
												</div>
											) : (
												<label className='flex h-40 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-subtle transition-colors hover:border-brand/50 hover:bg-brand/5'>
													<Camera className='size-8 text-text-muted' />
													<span className='text-sm text-text-muted'>
														Tap to add photos
													</span>
													<input
														ref={fileInputRef}
														type='file'
														accept='image/*'
														multiple
														onChange={handlePhotoSelect}
														className='hidden'
													/>
												</label>
											)}
										</div>

										{/* Caption with @mention support */}
										<div className='mb-4'>
											<MentionInput
												value={caption}
												onChange={setCaption}
												onTaggedUsersChange={setTaggedUserIds}
											placeholder={t('fabPostPlaceholder')}
												multiline
												rows={2}
												maxLength={500}
												disabled={isSubmitting}
												className='w-full rounded-xl border border-border-subtle bg-bg-elevated p-3 text-sm'
											/>
											<p className={`mt-1 text-right text-xs tabular-nums ${caption.length > 400 ? (caption.length >= 500 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}>
												{caption.length}/500
											</p>
										</div>
									</>
								)}

								{/* Submit */}
								<motion.button
									type='button'
									onClick={handleSubmit}
									disabled={
										isSubmitting ||
										(mode === 'post'
											? !caption.trim() && photoFiles.length === 0
											: mode === 'poll'
												? !pollQuestion.trim() || !pollOptionA.trim() || !pollOptionB.trim()
												: mode === 'tip'
													? !caption.trim()
													: !battleRecipeA || !battleRecipeB || !caption.trim())
									}
									whileHover={isSubmitting ? undefined : BUTTON_HOVER}
									whileTap={isSubmitting ? undefined : BUTTON_TAP}
									transition={TRANSITION_SPRING}
									className='flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-brand py-3 font-semibold text-white transition-all disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
								>
									{isSubmitting ? (
										<>
											<Loader2 className='size-5 animate-spin' />
									{mode === 'poll' ? t('fabSubmitPollLoading') : mode === 'tip' ? t('fabSubmitTipLoading') : mode === 'battle' ? t('fabSubmitBattleLoading') : t('fabSubmitPostLoading')}
										</>
									) : (
										<>
											{mode === 'poll' && <BarChart3 className='size-5' />}
											{mode === 'tip' && <Lightbulb className='size-5' />}
											{mode === 'battle' && <Swords className='size-5' />}
											{mode === 'post' && <Send className='size-5' />}
											{mode === 'poll' ? t('fabSubmitPoll') : mode === 'tip' ? t('fabSubmitTip') : mode === 'battle' ? t('fabSubmitBattle') : t('fabSubmitPost')}
										</>
									)}
								</motion.button>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>

			{/* Hidden file input for auto-trigger on open */}
			<input
				ref={fileInputRef}
				type='file'
				accept='image/*'
				multiple
				onChange={handlePhotoSelect}
				className='hidden'
			/>
		</>
	)
}
