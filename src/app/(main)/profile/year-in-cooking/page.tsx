'use client'

import { useState, useMemo, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
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
	title: string
	value: string
	subtitle: string
	gradient: string // tailwind gradient classes
	icon: React.ReactNode
}

function buildRecapCards(stats: {
	completionCount: number
	streakCount: number
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
		cards.push({
			id: 'cooks',
			emoji: '🍳',
			title: 'Dishes Completed',
			value: stats.completionCount.toLocaleString(),
			subtitle: stats.completionCount >= 50
				? "You're a kitchen warrior!"
				: stats.completionCount >= 20
					? 'Serious dedication!'
					: stats.completionCount >= 5
						? 'Getting into your groove'
						: 'Every journey starts with one dish',
			gradient: 'from-brand to-streak',
			icon: <ChefHat className='size-8' />,
		})
	}

	// 2. XP earned
	if (stats.currentXP > 0) {
		cards.push({
			id: 'xp',
			emoji: '⚡',
			title: 'Total XP Earned',
			value: stats.currentXP.toLocaleString(),
			subtitle: `Reached Level ${stats.currentLevel} — ${stats.title}`,
			gradient: 'from-gaming-xp to-accent-purple',
			icon: <Zap className='size-8' />,
		})
	}

	// 3. Streak
	if (stats.streakCount > 0) {
		cards.push({
			id: 'streak',
			emoji: '🔥',
			title: 'Best Cooking Streak',
			value: `${stats.streakCount} days`,
			subtitle: stats.streakCount >= 30
				? 'Legendary consistency!'
				: stats.streakCount >= 14
					? 'Two weeks strong!'
					: stats.streakCount >= 7
						? 'A full week of cooking!'
						: 'Building the habit',
			gradient: 'from-gaming-streak to-error',
			icon: <Flame className='size-8' />,
		})
	}

	// 4. Recipes created
	if (stats.recipeCount > 0) {
		cards.push({
			id: 'recipes',
			emoji: '📝',
			title: 'Recipes Created',
			value: stats.recipeCount.toLocaleString(),
			subtitle: stats.recipeCount >= 20
				? 'A true recipe author!'
				: stats.recipeCount >= 5
					? 'Your collection is growing'
					: 'Your first creations',
			gradient: 'from-success to-accent-teal',
			icon: <Star className='size-8' />,
		})
	}

	// 5. Posts shared
	if (stats.postCount > 0) {
		cards.push({
			id: 'posts',
			emoji: '📸',
			title: 'Posts Shared',
			value: stats.postCount.toLocaleString(),
			subtitle: stats.postCount >= 30
				? 'Content machine!'
				: stats.postCount >= 10
					? 'Sharing the love'
					: 'Getting started',
			gradient: 'from-brand to-brand/70',
			icon: <Heart className='size-8' />,
		})
	}

	// 6. Community
	if (stats.followerCount > 0 || stats.followingCount > 0) {
		cards.push({
			id: 'community',
			emoji: '🤝',
			title: 'Your Community',
			value: `${stats.followerCount} followers`,
			subtitle: `Following ${stats.followingCount} amazing chefs`,
			gradient: 'from-info to-accent-purple',
			icon: <TrendingUp className='size-8' />,
		})
	}

	// 7. Badges
	if (stats.badges.length > 0) {
		cards.push({
			id: 'badges',
			emoji: '🏅',
			title: 'Badges Earned',
			value: stats.badges.length.toLocaleString(),
			subtitle: stats.badges.length >= 10
				? 'Serious collector!'
				: stats.badges.length >= 5
					? 'Building your collection'
					: 'First achievements unlocked',
			gradient: 'from-warning to-warning',
			icon: <Award className='size-8' />,
		})
	}

	// 8. Level achievement (always last as the "finale")
	cards.push({
		id: 'level',
		emoji: '🏆',
		title: 'Your Chef Title',
		value: stats.title,
		subtitle: `Level ${stats.currentLevel} — Keep climbing!`,
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

function generateShareCanvas(
	cards: RecapCard[],
	displayName: string,
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
	ctx.fillText(`${displayName}'s Year in Cooking`, SHARE_W / 2, 44)

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
		const sub = card.subtitle.length > 35 ? card.subtitle.slice(0, 32) + '…' : card.subtitle
		ctx.fillText(sub, x + cellW / 2, y + 140)
	})

	// Footer
	const footerY = SHARE_H - 50
	ctx.fillStyle = TEXT_SECONDARY
	ctx.font = '12px system-ui, -apple-system, sans-serif'
	ctx.textAlign = 'center'
	ctx.fillText('ChefKix — Year in Cooking', SHARE_W / 2, footerY)

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

	const handleShare = useCallback(async () => {
		if (cards.length === 0) return
		setIsGenerating(true)
		try {
			const canvas = generateShareCanvas(cards, displayName)
			const blob = await new Promise<Blob | null>((res) =>
				canvas.toBlob(res, 'image/png'),
			)
			if (!blob) throw new Error('Failed to generate image')

			if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'year-in-cooking.png', { type: 'image/png' })] })) {
				await navigator.share({
					title: `${displayName}'s Year in Cooking`,
					text: 'Check out my Year in Cooking on ChefKix!',
					files: [new File([blob], 'year-in-cooking.png', { type: 'image/png' })],
				})
			} else {
				await navigator.clipboard.write([
					new ClipboardItem({ 'image/png': blob }),
				])
				setCopied(true)
				setTimeout(() => setCopied(false), 2000)
				toast.success('Copied to clipboard!')
			}
		} catch {
			toast.error('Sharing failed')
		} finally {
			setIsGenerating(false)
		}
	}, [cards, displayName])

	const handleDownload = useCallback(async () => {
		if (cards.length === 0) return
		setIsGenerating(true)
		try {
			const canvas = generateShareCanvas(cards, displayName)
			const blob = await new Promise<Blob | null>((res) =>
				canvas.toBlob(res, 'image/png'),
			)
			if (!blob) throw new Error('Failed to generate image')
			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = 'year-in-cooking.png'
			a.click()
			URL.revokeObjectURL(url)
			toast.success('Downloaded!')
		} catch {
			toast.error('Download failed')
		} finally {
			setIsGenerating(false)
		}
	}, [cards, displayName])

	// Keyboard navigation
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
						title='Sign in to see your Year'
						description='Your Year in Cooking recap is built from your cooking activity.'
						primaryAction={{ label: 'Sign In', href: '/auth/login' }}
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
							onClick={() => router.back()}
							whileTap={BUTTON_SUBTLE_TAP}
							className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
							aria-label='Go back'
						>
							<ArrowLeft className='size-5' />
						</motion.button>
						<h1 className='text-xl font-bold text-text'>Year in Cooking</h1>
					</div>
					<EmptyStateGamified
						variant='cooking'
						title='Your story is just beginning…'
						description='Cook your first recipe to start building your Year in Cooking recap.'
						primaryAction={{ label: 'Explore Recipes', href: '/explore' }}
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
						onClick={() => router.back()}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
						aria-label='Go back'
					>
						<ArrowLeft className='size-5' />
					</motion.button>
					<div className='flex-1'>
						<h1 className='text-xl font-bold text-text'>Your Year in Cooking</h1>
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
								aria-label={`Go to card ${i + 1}`}
							/>
						))}
					</div>

					{/* Card */}
					<div className='relative min-h-[380px]'>
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
								className={`flex min-h-[380px] flex-col items-center justify-center rounded-2xl bg-gradient-to-br ${currentCard.gradient} p-8 text-white shadow-warm`}
							>
								{/* Decorative background circles */}
								<div className='pointer-events-none absolute inset-0 overflow-hidden rounded-2xl'>
									<div className='absolute -right-12 -top-12 size-48 rounded-full bg-white/10' />
									<div className='absolute -bottom-8 -left-8 size-32 rounded-full bg-white/10' />
								</div>

								<div className='relative z-10 flex flex-col items-center'>
									<span className='mb-4 text-6xl'>{currentCard.emoji}</span>
									<p className='mb-2 text-sm font-medium uppercase tracking-wider text-white/80'>
										{currentCard.title}
									</p>
									<p className='mb-3 text-5xl font-black tracking-tight'>
										{currentCard.value}
									</p>
									<p className='max-w-[260px] text-center text-base text-white/90'>
										{currentCard.subtitle}
									</p>
								</div>
							</motion.div>
						</AnimatePresence>
					</div>

					{/* Navigation arrows */}
					{page > 0 && (
						<motion.button
							whileTap={BUTTON_SUBTLE_TAP}
							onClick={() => paginate(-1)}
							className='absolute left-2 top-1/2 z-sticky flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text shadow-card backdrop-blur-sm transition-colors hover:bg-white'
							aria-label='Previous'
						>
							<ChevronLeft className='size-5' />
						</motion.button>
					)}
					{page < cards.length - 1 && (
						<motion.button
							whileTap={BUTTON_SUBTLE_TAP}
							onClick={() => paginate(1)}
							className='absolute right-2 top-1/2 z-sticky flex size-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-text shadow-card backdrop-blur-sm transition-colors hover:bg-white'
							aria-label='Next'
						>
							<ChevronRight className='size-5' />
						</motion.button>
					)}
				</div>

				{/* Share / Download */}
				<div className='flex justify-center gap-3'>
					<motion.button
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={handleDownload}
						disabled={isGenerating}
						className='flex items-center gap-2 rounded-xl border border-border bg-bg-card px-5 py-2.5 text-sm font-medium text-text transition-colors hover:bg-bg-elevated disabled:opacity-50'
					>
						{isGenerating ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Download className='size-4' />
						)}
						Download
					</motion.button>
					<motion.button
						whileTap={BUTTON_SUBTLE_TAP}
						onClick={handleShare}
						disabled={isGenerating}
						className='flex items-center gap-2 rounded-xl bg-brand px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand/90 disabled:opacity-50'
					>
						{copied ? (
							<Check className='size-4' />
						) : isGenerating ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Share2 className='size-4' />
						)}
						{copied ? 'Copied!' : 'Share'}
					</motion.button>
				</div>

				{/* Hint */}
				<p className='mt-4 text-center text-xs text-text-muted'>
					Use ← → arrow keys or swipe to navigate
				</p>
			</PageContainer>
		</PageTransition>
	)
}
