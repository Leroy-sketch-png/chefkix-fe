'use client'

import { useRef, useState, useCallback, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Download, Share2, Loader2, Check } from 'lucide-react'
import { toast } from 'sonner'
import { BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { useTranslations } from 'next-intl'

interface TasteDimension {
	label: string
	value: number
	description: string
}

interface TasteDNAShareCardProps {
	dimensions: TasteDimension[]
	displayName: string
	topTrait: string
	level: number
	title: string
}

interface CanvasLabels {
	tasteDnaTitle: string
	tasteDnaStrongest: string
	tasteDnaFooter: string
}

// Brand colors (must match globals.css tokens)
const BRAND = '#ff5a36'
const BG_WARM = '#fdfbf8'
const TEXT_PRIMARY = '#2c2420'
const TEXT_SECONDARY = '#8c7e72'
const ACCENT_PURPLE = '#8b5cf6'

function drawRadarToCanvas(
	ctx: CanvasRenderingContext2D,
	dimensions: TasteDimension[],
	centerX: number,
	centerY: number,
	radius: number,
) {
	const n = dimensions.length
	const angleStep = (2 * Math.PI) / n

	// Grid rings
	for (const level of [25, 50, 75, 100]) {
		const r = (level / 100) * radius
		ctx.beginPath()
		ctx.arc(centerX, centerY, r, 0, Math.PI * 2)
		ctx.strokeStyle = 'rgba(140,126,114,0.12)'
		ctx.lineWidth = 1
		ctx.stroke()
	}

	// Axis lines
	for (let i = 0; i < n; i++) {
		const angle = i * angleStep - Math.PI / 2
		const x = centerX + radius * Math.cos(angle)
		const y = centerY + radius * Math.sin(angle)
		ctx.beginPath()
		ctx.moveTo(centerX, centerY)
		ctx.lineTo(x, y)
		ctx.strokeStyle = 'rgba(140,126,114,0.1)'
		ctx.lineWidth = 1
		ctx.stroke()
	}

	// Data polygon (filled)
	ctx.beginPath()
	dimensions.forEach((d, i) => {
		const angle = i * angleStep - Math.PI / 2
		const r = (d.value / 100) * radius
		const x = centerX + r * Math.cos(angle)
		const y = centerY + r * Math.sin(angle)
		if (i === 0) ctx.moveTo(x, y)
		else ctx.lineTo(x, y)
	})
	ctx.closePath()
	ctx.fillStyle = `${BRAND}22`
	ctx.fill()
	ctx.strokeStyle = BRAND
	ctx.lineWidth = 2.5
	ctx.stroke()

	// Data points
	dimensions.forEach((d, i) => {
		const angle = i * angleStep - Math.PI / 2
		const r = (d.value / 100) * radius
		const x = centerX + r * Math.cos(angle)
		const y = centerY + r * Math.sin(angle)
		ctx.beginPath()
		ctx.arc(x, y, 5, 0, Math.PI * 2)
		ctx.fillStyle = BRAND
		ctx.fill()
	})

	// Labels
	ctx.font = '600 13px Inter, system-ui, sans-serif'
	ctx.textAlign = 'center'
	ctx.textBaseline = 'middle'
	ctx.fillStyle = TEXT_SECONDARY
	dimensions.forEach((d, i) => {
		const angle = i * angleStep - Math.PI / 2
		const labelR = radius + 28
		const x = centerX + labelR * Math.cos(angle)
		const y = centerY + labelR * Math.sin(angle)
		ctx.fillText(d.label, x, y)
	})
}

function generateCanvas(
	canvas: HTMLCanvasElement,
	props: TasteDNAShareCardProps,
	labels: CanvasLabels,
) {
	const dpr = 2 // High DPI for crisp sharing
	const W = 600
	const H = 740
	canvas.width = W * dpr
	canvas.height = H * dpr
	canvas.style.width = `${W}px`
	canvas.style.height = `${H}px`

	const ctx = canvas.getContext('2d')!
	ctx.scale(dpr, dpr)

	// Background
	ctx.fillStyle = BG_WARM
	ctx.beginPath()
	ctx.roundRect(0, 0, W, H, 24)
	ctx.fill()

	// Subtle border
	ctx.strokeStyle = 'rgba(140,126,114,0.15)'
	ctx.lineWidth = 1
	ctx.beginPath()
	ctx.roundRect(0, 0, W, H, 24)
	ctx.stroke()

	// Header gradient bar
	const gradient = ctx.createLinearGradient(0, 0, W, 0)
	gradient.addColorStop(0, BRAND)
	gradient.addColorStop(1, ACCENT_PURPLE)
	ctx.fillStyle = gradient
	ctx.beginPath()
	ctx.roundRect(0, 0, W, 80, [24, 24, 0, 0])
	ctx.fill()

	// Header text
	ctx.fillStyle = '#ffffff'
	ctx.font = 'bold 24px Inter, system-ui, sans-serif'
	ctx.textAlign = 'left'
	ctx.fillText(labels.tasteDnaTitle, 24, 48)

	// User name + level
	ctx.fillStyle = 'rgba(255,255,255,0.85)'
	ctx.font = '500 14px Inter, system-ui, sans-serif'
	ctx.textAlign = 'right'
	ctx.fillText(`${props.displayName} · Level ${props.level}`, W - 24, 40)
	ctx.font = '400 12px Inter, system-ui, sans-serif'
	ctx.fillText(props.title, W - 24, 58)

	// Radar chart
	const radarCenterX = W / 2
	const radarCenterY = 280
	const radarRadius = 130
	drawRadarToCanvas(ctx, props.dimensions, radarCenterX, radarCenterY, radarRadius)

	// Top trait highlight
	ctx.textAlign = 'center'
	ctx.fillStyle = TEXT_PRIMARY
	ctx.font = 'bold 18px Inter, system-ui, sans-serif'
	ctx.fillText(labels.tasteDnaStrongest, W / 2, 460)

	// Dimension bars
	const barStartY = 490
	const barHeight = 8
	const barGap = 34
	const barLeft = 100
	const barWidth = W - 200

	props.dimensions.forEach((dim, i) => {
		const y = barStartY + i * barGap

		// Label
		ctx.textAlign = 'left'
		ctx.fillStyle = TEXT_SECONDARY
		ctx.font = '500 12px Inter, system-ui, sans-serif'
		ctx.fillText(dim.label, 24, y + barHeight / 2 + 1)

		// Value
		ctx.textAlign = 'right'
		ctx.fillStyle = BRAND
		ctx.font = 'bold 12px Inter, system-ui, sans-serif'
		ctx.fillText(`${dim.value}%`, W - 24, y + barHeight / 2 + 1)

		// Bar background
		ctx.fillStyle = 'rgba(140,126,114,0.08)'
		ctx.beginPath()
		ctx.roundRect(barLeft, y, barWidth, barHeight, barHeight / 2)
		ctx.fill()

		// Bar fill
		const barGradient = ctx.createLinearGradient(barLeft, 0, barLeft + barWidth, 0)
		barGradient.addColorStop(0, BRAND)
		barGradient.addColorStop(1, `${BRAND}99`)
		ctx.fillStyle = barGradient
		ctx.beginPath()
		ctx.roundRect(barLeft, y, barWidth * (dim.value / 100), barHeight, barHeight / 2)
		ctx.fill()
	})

	// Footer
	const footerY = H - 30
	ctx.textAlign = 'center'
	ctx.fillStyle = TEXT_SECONDARY
	ctx.font = '400 11px Inter, system-ui, sans-serif'
	ctx.fillText(labels.tasteDnaFooter, W / 2, footerY)
}

export function TasteDNAShareCard(props: TasteDNAShareCardProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const [isGenerating, setIsGenerating] = useState(false)
	const [isCopied, setIsCopied] = useState(false)
	const t = useTranslations('profile')

	const canvasLabels: CanvasLabels = useMemo(() => ({
		tasteDnaTitle: t('tasteDnaTitle'),
		tasteDnaStrongest: t('tasteDnaStrongest', { trait: props.topTrait }),
		tasteDnaFooter: t('tasteDnaFooter'),
	}), [t, props.topTrait])

	const generate = useCallback(() => {
		if (!canvasRef.current) return
		generateCanvas(canvasRef.current, props, canvasLabels)
	}, [props, canvasLabels])

	const handleDownload = useCallback(async () => {
		if (!canvasRef.current) return
		setIsGenerating(true)
		try {
			generateCanvas(canvasRef.current, props, canvasLabels)
			const blob = await new Promise<Blob | null>(resolve =>
				canvasRef.current!.toBlob(resolve, 'image/png'),
			)
			if (!blob) throw new Error('Failed to generate image')

			const url = URL.createObjectURL(blob)
			const a = document.createElement('a')
			a.href = url
			a.download = `chefkix-taste-dna-${Date.now()}.png`
			a.click()
			URL.revokeObjectURL(url)
			toast.success(t('tasteDnaDownloaded'))
		} catch {
			toast.error(t('tasteDnaFailedGenerate'))
		} finally {
			setIsGenerating(false)
		}
	}, [props, canvasLabels, t])

	const handleShare = useCallback(async () => {
		if (!canvasRef.current) return
		setIsGenerating(true)
		try {
			generateCanvas(canvasRef.current, props, canvasLabels)
			const blob = await new Promise<Blob | null>(resolve =>
				canvasRef.current!.toBlob(resolve, 'image/png'),
			)
			if (!blob) throw new Error('Failed to generate image')

			if (navigator.share && navigator.canShare?.({ files: [new File([blob], 'taste-dna.png', { type: 'image/png' })] })) {
				await navigator.share({
					title: t('tasteDnaTitle'),
					text: t('tasteDnaShareText', { trait: props.topTrait }),
					files: [new File([blob], 'chefkix-taste-dna.png', { type: 'image/png' })],
				})
			} else {
				// Fallback: copy to clipboard
				await navigator.clipboard.write([
					new ClipboardItem({ 'image/png': blob }),
				])
				setIsCopied(true)
				setTimeout(() => setIsCopied(false), 2000)
				toast.success(t('tasteDnaCopied'))
			}
		} catch (err) {
			// User cancelled share — not an error
			if (err instanceof Error && err.name === 'AbortError') return
			toast.error(t('tasteDnaFailedShare'))
		} finally {
			setIsGenerating(false)
		}
	}, [props, canvasLabels, t])

	return (
		<div className='space-y-4'>
			{/* Hidden canvas for generation */}
			<canvas ref={canvasRef} className='hidden' />

			{/* Preview: re-render on mount */}
			<motion.div
				initial={{ opacity: 0, y: 10 }}
				animate={{ opacity: 1, y: 0 }}
				transition={{ delay: 0.3 }}
				className='overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card'
			>
				{/* Use the SVG radar from the page as visual preview */}
				<div className='border-b border-border-subtle bg-gradient-to-r from-brand to-accent-purple p-4'>
					<h3 className='text-lg font-bold text-white'>🧬 {t('tasteDnaShareTitle')}</h3>
					<p className='text-sm text-white/70'>
						{t('tasteDnaShareDesc')}
					</p>
				</div>

				<div className='flex gap-3 p-4'>
					<motion.button
						type='button'
						onClick={handleDownload}
						disabled={isGenerating}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 font-semibold text-white transition-colors hover:bg-brand/90 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isGenerating ? (
							<Loader2 className='size-4 animate-spin' />
						) : (
							<Download className='size-4' />
						)}
						{t('tasteDnaDownload')}
					</motion.button>

					<motion.button
						type='button'
						onClick={handleShare}
						disabled={isGenerating}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border-subtle bg-bg-card px-4 py-3 font-semibold text-text transition-colors hover:bg-bg-elevated disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-brand/50'
					>
						{isCopied ? (
							<>
								<Check className='size-4 text-success' />
								{t('tasteDnaCopied')}
							</>
						) : (
							<>
								<Share2 className='size-4' />
								{t('tasteDnaShare')}
							</>
						)}
					</motion.button>
				</div>
			</motion.div>
		</div>
	)
}
