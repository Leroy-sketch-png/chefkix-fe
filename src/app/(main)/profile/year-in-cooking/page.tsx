'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from '@/i18n/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import {
	ArrowLeft,
	ChevronLeft,
	ChevronRight,
	Flame,
	Trophy,
	ChefHat,
	Star,
	TrendingUp,
	Zap,
	Share2,
	Download,
	Loader2,
	Check,
	Heart,
	Award,
} from 'lucide-react'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { EmptyStateGamified } from '@/components/shared'
import { Skeleton } from '@/components/ui/skeleton'
import { useAuth } from '@/hooks/useAuth'
import { TRANSITION_SPRING, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { getProfileDisplayName } from '@/lib/types/profile'

// ── Card slide data ──
interface RecapCard {
	id: string
	emoji: string
	titleKey: string
	value?: string
	valueKey?: string
	valueParams?: Record<string, string | number>
	subtitleKey: string
	subtitleParams?: Record<string, string | number>
	gradient: string // tailwind gradient classes
	icon: React.ReactNode
}

function buildRecapCards(stats: {
	completionCount: number
	streakCount: number
	longestStreak: number
	currentLevel: number
	currentXP: number
	recipeCount: number
	postCount: number
	followerCount: number
	followingCount: number
	badges: string[]
	title: string
}): RecapCard[] {
	const cards: RecapCard[] = []

	// 1. Total cooks
	if (stats.completionCount > 0) {
		const tier =
			stats.completionCount >= 50
				? 'warrior'
				: stats.completionCount >= 20
					? 'dedicated'
					: stats.completionCount >= 5
						? 'groove'
						: 'first'
		cards.push({
			id: 'cooks',
			emoji: '🍳',
			titleKey: 'yicCardTitleCooks',
			value: stats.completionCount.toLocaleString(),
			subtitleKey: `yicCardSubCooks_${tier}`,
			gradient: 'from-brand to-streak',
			icon: <ChefHat className='size-8' />,
		})
	}

	// 2. XP earned
	if (stats.currentXP > 0) {
		cards.push({
			id: 'xp',
			emoji: '⚡',
			titleKey: 'yicCardTitleXp',
			value: stats.currentXP.toLocaleString(),
			subtitleKey: 'yicCardSubXp',
			subtitleParams: { level: stats.currentLevel, title: stats.title },
			gradient: 'from-gaming-xp to-accent-purple',
			icon: <Zap className='size-8' />,
		})
	}

	// 3. Best streak (historical max, with current streak fallback for older users)
	const bestStreak = Math.max(stats.longestStreak, stats.streakCount)
	if (bestStreak > 0) {
		const tier =
			bestStreak >= 30
				? 'legendary'
				: bestStreak >= 14
					? 'twoWeeks'
					: bestStreak >= 7
						? 'fullWeek'
						: 'building'
		cards.push({
			id: 'streak',
			emoji: '🔥',
			titleKey: 'yicCardTitleStreak',
			valueKey: 'yicCardValueDays',
			valueParams: { count: bestStreak },
			subtitleKey: `yicCardSubStreak_${tier}`,
			gradient: 'from-gaming-streak to-error',
			icon: <Flame className='size-8' />,
		})
	}

	// 4. Recipes created
	if (stats.recipeCount > 0) {
		const tier =
			stats.recipeCount >= 20
				? 'author'
				: stats.recipeCount >= 5
					? 'growing'
					: 'first'
		cards.push({
			id: 'recipes',
			emoji: '📝',
			titleKey: 'yicCardTitleRecipes',
			value: stats.recipeCount.toLocaleString(),
			subtitleKey: `yicCardSubRecipes_${tier}`,
			gradient: 'from-success to-accent-teal',
			icon: <Star className='size-8' />,
		})
	}

	// 5. Posts shared
	if (stats.postCount > 0) {
		const tier =
			stats.postCount >= 30
				? 'machine'
				: stats.postCount >= 10
					? 'sharing'
					: 'started'
		cards.push({
			id: 'posts',
			emoji: '📸',
			titleKey: 'yicCardTitlePosts',
			value: stats.postCount.toLocaleString(),
			subtitleKey: `yicCardSubPosts_${tier}`,
			gradient: 'from-brand to-brand/70',
			icon: <Heart className='size-8' />,
		})
	}

	// 6. Community
	if (stats.followerCount > 0 || stats.followingCount > 0) {
		cards.push({
			id: 'community',
			emoji: '🤝',
			titleKey: 'yicCardTitleCommunity',
			valueKey: 'yicCardValueFollowers',
			valueParams: { count: stats.followerCount },
			subtitleKey: 'yicCardSubCommunity',
			subtitleParams: { count: stats.followingCount },
			gradient: 'from-info to-accent-purple',
			icon: <TrendingUp className='size-8' />,
		})
	}

	// 7. Badges
	if (stats.badges.length > 0) {
		const tier =
			stats.badges.length >= 10
				? 'collector'
				: stats.badges.length >= 5
					? 'building'
					: 'first'
		cards.push({
			id: 'badges',
			emoji: '🏅',
			titleKey: 'yicCardTitleBadges',
			value: stats.badges.length.toLocaleString(),
			subtitleKey: `yicCardSubBadges_${tier}`,
			gradient: 'from-warning to-warning',
			icon: <Award className='size-8' />,
		})
	}

	// 8. Level achievement (always last as the "finale")
	cards.push({
		id: 'level',
		emoji: '🏆',
		titleKey: 'yicCardTitleLevel',
		value: stats.title,
		subtitleKey: 'yicCardSubLevel',
		subtitleParams: { level: stats.currentLevel },
		gradient: 'from-gaming-level to-warning',
		icon: <Trophy className='size-8' />,
	})

	return cards
}

// ── Canvas card generation for sharing ──
const SHARE_W = 600
const SHARE_H = 800
const BRAND_COLOR = '#ff5a36'
const BG_WARM = '#fdfbf8'
const TEXT_PRIMARY = '#2c2420'
const TEXT_SECONDARY = '#8c7e72'

interface ShareCard {
	emoji: string
	title: string
	value: string
	subtitle: string
}

function generateShareCanvas(
	cards: ShareCard[],
	displayName: string,
	headerTitle: string,
	footerTitle: string,
): HTMLCanvasElement {
	const canvas = document.createElement('canvas')
	const dpr = 2
	canvas.width = SHARE_W * dpr
	canvas.height = SHARE_H * dpr
	const ctx = canvas.getContext('2d')!
	ctx.scale(dpr, dpr)

	// Background
	ctx.fillStyle = BG_WARM
	ctx.fillRect(0, 0, SHARE_W, SHARE_H)

	// Header gradient bar
	const grad = ctx.createLinearGradient(0, 0, SHARE_W, 80)
	grad.addColorStop(0, BRAND_COLOR)
	grad.addColorStop(1, '#8b5cf6')
	ctx.fillStyle = grad
	ctx.beginPath()
	ctx.moveTo(0, 0)
	ctx.lineTo(SHARE_W, 0)
	ctx.lineTo(SHARE_W, 70)
	ctx.quadraticCurveTo(SHARE_W / 2, 95, 0, 70)
	ctx.closePath()
	ctx.fill()

	// Title
	ctx.fillStyle = '#ffffff'
	ctx.font = 'bold 24px system-ui, -apple-system, sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText(headerTitle, SHARE_W / 2, 44)

	// Stats grid — show up to 6 cards in a 2×3 grid
	const gridCards = cards.slice(0, 6)
	const startY = 120
	const cellW = 260
	const cellH = 180
	const gapX = 20
	const gapY = 16
	const offsetX = (SHARE_W - cellW * 2 - gapX) / 2

	gridCards.forEach((card, i) => {
		const col = i % 2
		const row = Math.floor(i / 2)
		const x = offsetX + col * (cellW + gapX)
		const y = startY + row * (cellH + gapY)

		// Card background
		ctx.fillStyle = '#ffffff'
		ctx.beginPath()
		ctx.roundRect(x, y, cellW, cellH, 16)
		ctx.fill()

		// Card border
		ctx.strokeStyle = 'rgba(140,126,114,0.15)'
		ctx.lineWidth = 1
		ctx.beginPath()
		ctx.roundRect(x, y, cellW, cellH, 16)
		ctx.stroke()

		// Emoji
		ctx.font = '36px system-ui, -apple-system, sans-serif'
		ctx.textAlign = 'center'
		ctx.fillText(card.emoji, x + cellW / 2, y + 48)

		// Value
		ctx.fillStyle = TEXT_PRIMARY
		ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
		ctx.fillText(card.value, x + cellW / 2, y + 90)

		// Title
		ctx.fillStyle = TEXT_SECONDARY
		ctx.font = '13px system-ui, -apple-system, sans-serif'
		ctx.fillText(card.title, x + cellW / 2, y + 115)

		// Subtitle (truncate)
		ctx.font = '11px system-ui, -apple-system, sans-serif'
		ctx.fillStyle = 'rgba(140,126,114,0.7)'
		const sub =
			card.subtitle.length > 35
				? card.subtitle.slice(0, 32) + '…'
				: card.subtitle
		ctx.fillText(sub, x + cellW / 2, y + 140)
	})

	// Footer
	const footerY = SHARE_H - 50
	ctx.fillStyle = TEXT_SECONDARY
	ctx.font = '12px system-ui, -apple-system, sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText(footerTitle, SHARE_W / 2, footerY)

	ctx.fillStyle = BRAND_COLOR
	ctx.font = 'bold 14px system-ui, -apple-system, sans-serif'
	ctx.fillText('chefkix.com', SHARE_W / 2, footerY + 22)

	return canvas
}

// ── Slide animation variants ──
const slideVariants = {
	enter: (direction: number) => ({
		x: direction > 0 ? 300 : -300,
		opacity: 0,
		scale: 0.9,
	}),
	center: {
		x: 0,
		opacity: 1,
		scale: 1,
	},
	exit: (direction: number) => ({
		x: direction < 0 ? 300 : -300,
		opacity: 0,
		scale: 0.9,
	}),
}

export default function YearInCookingPage() {
	const router = useRouter()
	const t = useTranslations('profile')
	const { user: profile } = useAuth()
	const [[page, direction], setPage] = useState([0, 0])
	const [isGenerating, setIsGenerating] = useState(false)
	const [copied, setCopied] = useState(false)

	const cards = useMemo(() => {
		if (!profile?.statistics) return []
		const s = profile.statistics
		return buildRecapCards({
			completionCount: s.completionCount ?? 0,
			streakCount: s.streakCount ?? 0,
			longestStreak: s.longestStreak ?? 0,
			currentLevel: s.currentLevel ?? 1,
			currentXP: s.currentXP ?? 0,
			recipeCount: s.recipeCount ?? 0,
			postCount: s.postCount ?? 0,
			followerCount: s.followerCount ?? 0,
			followingCount: s.followingCount ?? 0,
			badges: s.badges ?? [],
			title: s.title ?? 'BEGINNER',
		})
	}, [profile])

	const displayName = getProfileDisplayName(profile)
	const paginate = useCallback(
		(newDirection: number) => {
			setPage(([prev]) => {
				const next = prev + newDirection
				if (next < 0 || next >= cards.length) return [prev, 0]
				return [next, newDirection]
			})
		},
		[cards.length],
	)

	const resolveShareCards = useCallback(
		(): ShareCard[] =>
			cards.map(c => ({
				emoji: c.emoji,
				title: t(c.titleKey),
				value: c.valueKey ? t(c.valueKey, c.valueParams) : (c.value ?? ''),
				subtitle: t(c.subtitleKey, c.subtitleParams),
			})),
		[cards, t],
	)

	const handleShare = useCallback(async () => {
		if (cards.length === 0) return
		setIsGenerating(true)
		try {
			const shareCards = resolveShareCards()
			const headerTitle = t('yicShareHeader', { name: displayName })
			const footerTitle = t('yicShareFooter')
			const canvas = generateShareCanvas(
				shareCards,
				displayName,
				headerTitle,
				footerTitle,
			)
			const blob = await new Promise<Blob | null>(res =>
				canvas.toBlob(res, 'image/png'),
			)
			if (!blob) throw new Error('Failed to generate image')

			if (
				navigator.share &&
				navigator.canShare?.({
					files: [
						new File([blob], 'year-in-cooking.png', { type: 'image/png' }),
					],
				})
			) {
				await navigator.share({
					title: t('yicShareHeader', { name: displayName }),
					text: t('yicShareText'),
					files: [
						new File([blob], 'year-in-cooking.png', { type: 'image/png' }),
					],
				})
			} else {
				await navigator.clipboard.write([
					new ClipboardItem({ 'image/png': blob }),
				])
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
				toast.success(t('toastCopiedClipboard'))
			}
		} catch {
			toast.error(t('toastShareFailed'))
		} finally {
			setIsGenerating(false)
		}
	}, [cards, displayName, t, resolveShareCards])

	const handleDownload = useCallback(async () => {
		if (cards.length === 0) return
		setIsGenerating(true)
		try {
			const shareCards = resolveShareCards()
			const headerTitle = t('yicShareHeader', { name: displayName })
			const footerTitle = t('yicShareFooter')
			const canvas = generateShareCanvas(
				shareCards,
				displayName,
				headerTitle,
				footerTitle,
			)
			const blob = await new Promise<Blob | null>(res =>
				canvas.toBlob(res, 'image/png'),
			)
			if (!blob) throw new Error('Failed to generate image')
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'year-in-cooking.png'
			a.click()
			URL.revokeObjectURL(url)
			toast.success(t('toastDownloaded'))
		} catch {
			toast.error(t('toastDownloadFailed'))
		} finally {
			setIsGenerating(false)
		}
	}, [cards, displayName, t, resolveShareCards])
	useEffect(() => {
		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'ArrowRight') paginate(1)
			if (e.key === 'ArrowLeft') paginate(-1)
		}
		window.addEventListener('keydown', handleKey)
		return () => window.removeEventListener('keydown', handleKey)
	}, [paginate])

	if (!profile) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<EmptyStateGamified
						variant='custom'
						emoji='📊'
						title={t('signInToSeeYear')}
						description={t('signInToSeeYearDesc')}
						primaryAction={{ label: t('signIn'), href: '/auth/login' }}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	if (cards.length === 0) {
		return (
			<PageTransition>
				<PageContainer maxWidth='lg'>
					<div className='mb-8 flex items-center gap-3'>
						<motion.button
							type='button'
							onClick={() => router.back()}
							whileTap={BUTTON_SUBTLE_TAP}
							className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
							aria-label={t('ariaGoBack')}
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<h1 className='text-xl font-bold text-text'>
							{t('yearInCooking')}
						</h1>
					</div>
					<EmptyStateGamified
						variant='cooking'
						title={t('yearJustBeginning')}
						description={t('yearJustBeginningDesc')}
						primaryAction={{ label: t('exploreRecipes'), href: '/explore' }}
					/>
				</PageContainer>
			</PageTransition>
		)
	}

	const currentCard = cards[page]

	return (
		<PageTransition>
			<PageContainer maxWidth='sm'>
				{/* Header */}
				<div className='mb-6 flex items-center gap-3'>
					<motion.button
						type='button'
						onClick={() => router.back()}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text focus-visible:ring-2 focus-visible:ring-brand/50'
						aria-label={t('ariaGoBack')}
					>
						<ArrowLeft className='size-5' />
					</motion.button>
					<div className='flex-1'>
						<h1 className='text-xl font-bold text-text'>
							{t('yearInCooking')}
						</h1>
						<p className='text-sm text-text-muted'>
							{page + 1} / {cards.length}
						</p>
					</div>
				</div>

				{/* Card carousel */}
				<div className='relative mb-6 overflow-hidden rounded-2xl'>
					{/* Progress dots */}
					<div className='mb-4 flex justify-center gap-1.5'>
						{cards.map((c, i) => (
							<button
								type='button'
								key={c.id}
								onClick={() => setPage([i, i > page ? 1 : -1])}
								className={`h-1.5 rounded-full transition-all duration-300 ${
									i === page
										? 'w-6 bg-brand'
										: i < page
											? 'w-1.5 bg-brand/40'
											: 'w-1.5 bg-border'
								}`}
								aria-label={t('yicGoToCard', { num: i + 1 })}
							/>
						))}
					</div>

					{/* Card */}
					<div className='relative min-h-96'>
						<AnimatePresence initial={false} custom={direction} mode='wait'>
							<motion.div
								key={page}
								custom={direction}
								variants={slideVariants}
								initial='enter'
								animate='center'
								exit='exit'
								transition={{
									x: { type: 'spring', stiffness: 300, damping: 30 },
									opacity: { duration: 0.2 },
									scale: { duration: 0.2 },
								}}
								className={`flex min-h-96 flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${currentCard.gradient} p-8 text-white shadow-warm`}
							>
								{/* Decorative background circles */}
								<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-2xl'>
									<div className='absolute -right-12 -top-12 size-48 rounded-full bg-white/10' />
									<div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10' />
								</div>

								<div className='relative z-10 flex flex-col items-center'>
									<span className='mb-4 text-6xl'>{currentCard.emoji}</span>
									<p className='mb-2 text-sm font-medium uppercase tracking-wider text-white/80'>
										{t(currentCard.titleKey)}
									</p>
									<p className='mb-3 text-5xl font-black tracking-tight'>
										{currentCard.valueKey
											? t(currentCard.valueKey, currentCard.valueParams)
											: currentCard.value}
									</p>
									<p className='max-w-64 text-center text-base text-white/90'>
										{t(currentCard.subtitleKey, currentCard.subtitleParams)}
									</p>
								</div>
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Navigation arrows */}
					{page > 0 && (
						<motion.button
							type='button'
							whileTap={BUTTON_SUBTLE_TAP}
							onClick={() => paginate(-1)}
							className='absolute left-2 top-1/2 z-sticky flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text shadow-card backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-brand/50'
							aria-label={t('ariaPrevious')}
						>
							<ChevronLeft className='size-5' />
						</motion.button>
					)}
					{page < cards.length - 1 && (
						<motion.button
							type='button'
							whileTap={BUTTON_SUBTLE_TAP}
							onClick={() => paginate(1)}
							className='absolute right-2 top-1/2 z-sticky flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text shadow-card backdrop-blur-sm transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-brand/50'
							aria-label={t('ariaNext')}
						>
							<ChevronRight className='size-5' />
						</motion.button>
					)}
				</div>

				{/* Share / Download */}
				<div className='flex justify-center gap-3'>
					<motion.button
						type='button'
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={handleDownload}
						disabled={isGenerating}
						className='flex items-center gap-2 rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isGenerating ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Download className='size-4' />
						)}
						{t('yicDownload')}
					</motion.button>
					<motion.button
						type='button'
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={handleShare}
						disabled={isGenerating}
						className='flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{copied ? (
							<Check className='size-4' />
						) : isGenerating ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Share2 className='size-4' />
						)}
						{copied ? t('yicCopied') : t('yicShare')}
					</motion.button>
				</div>

				{/* Hint */}
				<p className='mt-4 text-center text-xs text-text-muted'>
					{t('yicKeyboardHint')}
				</p>

				<div className='pb-40 md:pb-8' />
			</PageContainer>
		</PageTransition>
	)
}
