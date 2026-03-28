'use client'

import { useState, useEffect, useCallback } from 'react'
import { motion } from 'framer-motion'
import {
  Download,
  Share2,
  Clock,
  ChefHat,
  Flame,
  Star,
  Loader2,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { FADE_IN_VARIANTS } from '@/lib/motion'
import { cn } from '@/lib/utils'
import type { CookCardData } from '@/lib/types/cookCard'
import { getCookCardData } from '@/services/cookCard'
import Image from 'next/image'

// Card dimensions (Instagram story ratio 4:5)
const CARD_WIDTH = 1080
const CARD_HEIGHT = 1350

// ChefKix brand colors
const BRAND_CORAL = '#FF5A36'
const BRAND_BG = '#FDF8F3'
const BRAND_TEXT = '#2C2420'
const BRAND_TEXT_SECONDARY = '#6B5E57'

interface CookCardRendererProps {
  sessionId: string
  compact?: boolean
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.lineTo(x + w - r, y)
  ctx.quadraticCurveTo(x + w, y, x + w, y + r)
  ctx.lineTo(x + w, y + h - r)
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  ctx.lineTo(x + r, y + h)
  ctx.quadraticCurveTo(x, y + h, x, y + h - r)
  ctx.lineTo(x, y + r)
  ctx.quadraticCurveTo(x, y, x + r, y)
  ctx.closePath()
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number
): string[] {
  const words = text.split(' ')
  let line = ''
  const lines: string[] = []
  for (const word of words) {
    const testLine = line + (line ? ' ' : '') + word
    if (ctx.measureText(testLine).width > maxWidth && line) {
      lines.push(line)
      line = word
    } else {
      line = testLine
    }
  }
  lines.push(line)
  return lines.slice(0, maxLines)
}

function formatCookTime(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`
}

async function renderCardToCanvas(data: CookCardData): Promise<Blob | null> {
  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = CARD_HEIGHT
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // --- Background ---
  ctx.fillStyle = BRAND_BG
  ctx.fillRect(0, 0, CARD_WIDTH, CARD_HEIGHT)

  // --- Gradient header ---
  const topGradient = ctx.createLinearGradient(0, 0, 0, 400)
  topGradient.addColorStop(0, BRAND_CORAL)
  topGradient.addColorStop(1, '#FF8A65')
  ctx.fillStyle = topGradient
  ctx.beginPath()
  ctx.moveTo(0, 0)
  ctx.lineTo(CARD_WIDTH, 0)
  ctx.lineTo(CARD_WIDTH, 350)
  ctx.quadraticCurveTo(CARD_WIDTH / 2, 420, 0, 350)
  ctx.closePath()
  ctx.fill()

  // --- "I COOKED THIS!" header ---
  ctx.fillStyle = '#FFFFFF'
  ctx.font = 'bold 42px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('I COOKED THIS!', CARD_WIDTH / 2, 160)

  // --- Recipe image ---
  const imageUrl = data.coverImageUrl?.[0]
  const imgCenterX = CARD_WIDTH / 2
  const imgCenterY = 340
  const imgRadius = 140

  if (imageUrl) {
    try {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = () => reject(new Error('Image load failed'))
        img.src = imageUrl
      })

      ctx.save()
      ctx.beginPath()
      ctx.arc(imgCenterX, imgCenterY, imgRadius, 0, Math.PI * 2)
      ctx.closePath()
      ctx.clip()
      ctx.drawImage(
        img,
        imgCenterX - imgRadius,
        imgCenterY - imgRadius,
        imgRadius * 2,
        imgRadius * 2
      )
      ctx.restore()

      // White border ring
      ctx.strokeStyle = '#FFFFFF'
      ctx.lineWidth = 6
      ctx.beginPath()
      ctx.arc(imgCenterX, imgCenterY, imgRadius + 3, 0, Math.PI * 2)
      ctx.stroke()
    } catch {
      // Fallback placeholder
      ctx.fillStyle = '#FFF3E0'
      ctx.beginPath()
      ctx.arc(imgCenterX, imgCenterY, imgRadius, 0, Math.PI * 2)
      ctx.fill()
    }
  } else {
    ctx.fillStyle = '#FFF3E0'
    ctx.beginPath()
    ctx.arc(imgCenterX, imgCenterY, imgRadius, 0, Math.PI * 2)
    ctx.fill()
  }

  // --- Recipe title ---
  ctx.fillStyle = BRAND_TEXT
  ctx.font = 'bold 48px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  const titleY = 560
  const titleLines = wrapText(ctx, data.recipeTitle, CARD_WIDTH - 120, 2)
  titleLines.forEach((line, i) => {
    ctx.fillText(line, CARD_WIDTH / 2, titleY + i * 58)
  })

  // --- Chef name ---
  const nameY = titleY + titleLines.length * 58 + 30
  ctx.fillStyle = BRAND_TEXT_SECONDARY
  ctx.font = '32px system-ui, -apple-system, sans-serif'
  ctx.fillText(`by ${data.displayName || 'Chef'}`, CARD_WIDTH / 2, nameY)

  // --- Stats grid ---
  const statsY = nameY + 80
  const stats: { label: string; value: string; emoji: string }[] = []

  if (data.xpEarned > 0) {
    stats.push({ label: 'XP Earned', value: `+${data.xpEarned}`, emoji: '\u26A1' })
  }
  if (data.cookingTimeMinutes != null && data.cookingTimeMinutes > 0) {
    stats.push({
      label: 'Cook Time',
      value: formatCookTime(data.cookingTimeMinutes),
      emoji: '\u23F1\uFE0F',
    })
  }
  if (data.totalSteps) {
    stats.push({
      label: 'Steps',
      value: `${data.stepsCompleted}/${data.totalSteps}`,
      emoji: '\u2705',
    })
  }
  if (data.difficulty) {
    stats.push({ label: 'Difficulty', value: data.difficulty, emoji: '\uD83D\uDD25' })
  }
  if (data.rating != null && data.rating > 0) {
    stats.push({
      label: 'Rating',
      value: '\u2605'.repeat(data.rating),
      emoji: '',
    })
  }

  const statWidth = 220
  const statHeight = 90
  const statGap = 24

  stats.forEach((stat, i) => {
    const row = Math.floor(i / 3)
    const col = i % 3
    const rowCount = Math.min(stats.length - row * 3, 3)
    const rowWidth = rowCount * statWidth + (rowCount - 1) * statGap
    const rowStartX = (CARD_WIDTH - rowWidth) / 2
    const x = rowStartX + col * (statWidth + statGap)
    const y = statsY + row * (statHeight + statGap)

    // White pill background
    ctx.fillStyle = '#FFFFFF'
    drawRoundedRect(ctx, x, y, statWidth, statHeight, 16)
    ctx.shadowColor = 'rgba(0,0,0,0.08)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetY = 2
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0

    // Value
    ctx.fillStyle = BRAND_TEXT
    ctx.font = 'bold 28px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      `${stat.emoji} ${stat.value}`,
      x + statWidth / 2,
      y + 40
    )

    // Label
    ctx.fillStyle = BRAND_TEXT_SECONDARY
    ctx.font = '22px system-ui, -apple-system, sans-serif'
    ctx.fillText(stat.label, x + statWidth / 2, y + 70)
  })

  // --- ChefKix branding ---
  const brandY = CARD_HEIGHT - 100
  ctx.fillStyle = BRAND_CORAL
  ctx.font = 'bold 36px system-ui, -apple-system, sans-serif'
  ctx.textAlign = 'center'
  ctx.fillText('ChefKix', CARD_WIDTH / 2, brandY)

  ctx.fillStyle = BRAND_TEXT_SECONDARY
  ctx.font = '24px system-ui, -apple-system, sans-serif'
  ctx.fillText('Cook. Share. Level Up.', CARD_WIDTH / 2, brandY + 40)

  // --- Date ---
  if (data.completedAt) {
    const date = new Date(data.completedAt)
    ctx.fillStyle = BRAND_TEXT_SECONDARY
    ctx.font = '20px system-ui, -apple-system, sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText(
      date.toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      CARD_WIDTH / 2,
      CARD_HEIGHT - 40
    )
  }

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/png', 1.0)
  })
}

export default function CookCardRenderer({
  sessionId,
  compact = false,
}: CookCardRendererProps) {
  const [data, setData] = useState<CookCardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setError(null)
      const response = await getCookCardData(sessionId)
      if (response.success && response.data) {
        setData(response.data)
      }
    } catch {
      setError('Failed to load cook card data')
    } finally {
      setIsLoading(false)
    }
  }, [sessionId])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const handleDownload = async () => {
    if (!data) return
    setIsGenerating(true)
    try {
      const blob = await renderCardToCanvas(data)
      if (!blob) {
        toast.error('Failed to generate card image')
        return
      }

      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `chefkix-${data.recipeTitle.replace(/\s+/g, '-').toLowerCase()}.png`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Cook card downloaded!')
    } catch {
      toast.error('Failed to download cook card')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleShare = async () => {
    if (!data) return
    setIsGenerating(true)
    try {
      const blob = await renderCardToCanvas(data)

      // Try sharing with image first
      if (blob && navigator.share) {
        const file = new File([blob], 'chefkix-cook-card.png', {
          type: 'image/png',
        })
        try {
          await navigator.share({
            title: `I cooked ${data.recipeTitle} on ChefKix!`,
            text: `Just finished cooking ${data.recipeTitle} and earned ${data.xpEarned} XP!`,
            files: [file],
          })
          return
        } catch {
          // File share not supported — fall through to link share
        }
      }

      // Fallback: share link or copy
      if (navigator.share) {
        await navigator.share({
          title: `I cooked ${data.recipeTitle} on ChefKix!`,
          text: `Just finished cooking ${data.recipeTitle} and earned ${data.xpEarned} XP!`,
          url: data.shareUrl,
        })
      } else {
        await navigator.clipboard.writeText(data.shareUrl)
        toast.success('Link copied to clipboard!')
      }
    } catch {
      // User cancelled share — not an error
    } finally {
      setIsGenerating(false)
    }
  }

  // --- Loading ---
  if (isLoading) {
    return (
      <div className={cn('space-y-4', compact ? 'p-4' : 'p-6')}>
        <div className="h-6 w-40 animate-pulse rounded-lg bg-bg-elevated" />
        <div className="aspect-[4/5] w-full max-w-sm animate-pulse rounded-xl bg-bg-elevated" />
      </div>
    )
  }

  // --- Error ---
  if (error || !data) {
    return (
      <div className="flex flex-col items-center gap-3 py-8 text-center">
        <AlertTriangle className="size-6 text-text-muted" />
        <p className="text-sm text-text-secondary">
          {error || 'No data available'}
        </p>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setIsLoading(true)
            fetchData()
          }}
        >
          Try Again
        </Button>
      </div>
    )
  }

  const cookTimeStr =
    data.cookingTimeMinutes != null && data.cookingTimeMinutes > 0
      ? formatCookTime(data.cookingTimeMinutes)
      : null

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={FADE_IN_VARIANTS}
      className={cn('space-y-4', compact ? '' : 'mx-auto max-w-sm')}
    >
      {/* Preview Card */}
      <div className="relative overflow-hidden rounded-2xl border border-border-subtle bg-bg-card shadow-card">
        {/* Coral header */}
        <div className="relative h-32 bg-gradient-to-br from-brand to-orange-400">
          <div
            className="absolute bottom-0 left-0 right-0 h-8"
            style={{
              background:
                'radial-gradient(ellipse at 50% 0%, transparent 60%, var(--bg-card) 60.5%)',
            }}
          />
          <p className="pt-8 text-center text-lg font-bold text-white">
            I COOKED THIS!
          </p>
        </div>

        {/* Recipe image */}
        <div className="relative -mt-10 flex justify-center">
          <div className="size-24 overflow-hidden rounded-full border-4 border-bg-card bg-bg-elevated shadow-warm">
            {data.coverImageUrl?.[0] ? (
              <Image
                src={data.coverImageUrl[0]}
                alt={data.recipeTitle}
                className="size-full object-cover"
                width={96}
                height={96}
              />
            ) : (
              <div className="flex size-full items-center justify-center text-3xl">
                🍳
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="px-5 pb-5 pt-3 text-center">
          <h3 className="text-lg font-bold text-text">{data.recipeTitle}</h3>
          <p className="mt-1 text-sm text-text-secondary">
            by {data.displayName || 'Chef'}
          </p>

          {/* Stats */}
          <div className="mt-4 grid grid-cols-2 gap-2">
            {data.xpEarned > 0 && (
              <div className="rounded-lg bg-bg-elevated px-3 py-2">
                <div className="flex items-center justify-center gap-1">
                  <Flame className="size-4 text-xp" />
                  <span className="text-sm font-bold text-text">
                    +{data.xpEarned}
                  </span>
                </div>
                <p className="text-xs text-text-muted">XP Earned</p>
              </div>
            )}
            {cookTimeStr && (
              <div className="rounded-lg bg-bg-elevated px-3 py-2">
                <div className="flex items-center justify-center gap-1">
                  <Clock className="size-4 text-brand" />
                  <span className="text-sm font-bold text-text">
                    {cookTimeStr}
                  </span>
                </div>
                <p className="text-xs text-text-muted">Cook Time</p>
              </div>
            )}
            {data.totalSteps != null && (
              <div className="rounded-lg bg-bg-elevated px-3 py-2">
                <div className="flex items-center justify-center gap-1">
                  <CheckCircle2 className="size-4 text-green-500" />
                  <span className="text-sm font-bold text-text">
                    {data.stepsCompleted}/{data.totalSteps}
                  </span>
                </div>
                <p className="text-xs text-text-muted">Steps</p>
              </div>
            )}
            {data.difficulty && (
              <div className="rounded-lg bg-bg-elevated px-3 py-2">
                <div className="flex items-center justify-center gap-1">
                  <ChefHat className="size-4 text-amber-500" />
                  <span className="text-sm font-bold text-text">
                    {data.difficulty}
                  </span>
                </div>
                <p className="text-xs text-text-muted">Difficulty</p>
              </div>
            )}
          </div>

          {/* Rating */}
          {data.rating != null && data.rating > 0 && (
            <div className="mt-3 flex items-center justify-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    'size-5',
                    i < data.rating!
                      ? 'fill-amber-400 text-amber-400'
                      : 'text-text-muted/20'
                  )}
                />
              ))}
            </div>
          )}

          {/* Date */}
          {data.completedAt && (
            <p className="mt-3 text-xs text-text-muted">
              {new Date(data.completedAt).toLocaleDateString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </p>
          )}

          {/* Branding */}
          <div className="mt-4 border-t border-border-subtle pt-3">
            <p className="text-sm font-bold text-brand">ChefKix</p>
            <p className="text-xs text-text-muted">Cook. Share. Level Up.</p>
          </div>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button
          onClick={handleDownload}
          disabled={isGenerating}
          variant="outline"
          className="flex-1"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Download className="mr-2 size-4" />
          )}
          Download
        </Button>
        <Button
          onClick={handleShare}
          disabled={isGenerating}
          className="flex-1 bg-brand text-white hover:bg-brand/90"
        >
          {isGenerating ? (
            <Loader2 className="mr-2 size-4 animate-spin" />
          ) : (
            <Share2 className="mr-2 size-4" />
          )}
          Share
        </Button>
      </div>
    </motion.div>
  )
}
