'use client'

import { useState, useRef } from 'react'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { GripVertical, ImagePlus, Timer, Trash2, Video, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { diag } from '@/lib/diagnostics'
import { toast } from 'sonner'
import { uploadRecipeImages, uploadStepVideo } from '@/services/recipe'
import { formatTimer, getTimerSeconds } from '@/lib/recipeCreateUtils'
import type { RecipeStep, TimeUnit } from '@/lib/types/recipeCreate'

// ── Props ───────────────────────────────────────────────────────────
interface StepItemProps {
	step: RecipeStep
	index: number
	onRemove: () => void
	onUpdate: (updates: Partial<RecipeStep>) => void
}

/**
 * A single editable step in the recipe creation flow.
 *
 * Features:
 * - Flexible timer with unit selector (seconds/minutes/hours/days)
 * - Inline image upload with optimistic local preview
 * - Technique badge display
 * - Drag handle for reordering
 */
export const StepItem = ({
	step,
	index,
	onRemove,
	onUpdate,
}: StepItemProps) => {
	const t = useTranslations('recipe')
	const [isEditingTimer, setIsEditingTimer] = useState(false)
	const [timerValue, setTimerValue] = useState('')
	const [timerUnit, setTimerUnit] = useState<TimeUnit>('minutes')
	const fileInputRef = useRef<HTMLInputElement>(null)
	const videoInputRef = useRef<HTMLInputElement>(null)
	const [isUploadingImage, setIsUploadingImage] = useState(false)
	const [isUploadingVideo, setIsUploadingVideo] = useState(false)

	// ── Timer editing ───────────────────────────────────────────────
	const openTimerEditor = () => {
		const seconds = getTimerSeconds(step)
		if (seconds !== undefined) {
			if (seconds >= 86400 && seconds % 86400 === 0) {
				setTimerValue((seconds / 86400).toString())
				setTimerUnit('days')
			} else if (seconds >= 3600 && seconds % 3600 === 0) {
				setTimerValue((seconds / 3600).toString())
				setTimerUnit('hours')
			} else if (seconds >= 60) {
				setTimerValue(Math.floor(seconds / 60).toString())
				setTimerUnit('minutes')
			} else {
				setTimerValue(seconds.toString())
				setTimerUnit('seconds')
			}
		} else {
			setTimerValue('')
			setTimerUnit('minutes')
		}
		setIsEditingTimer(true)
	}

	const handleTimerSave = () => {
		const value = parseFloat(timerValue)
		if (!isNaN(value) && value > 0) {
			let seconds = value
			switch (timerUnit) {
				case 'days':
					seconds = value * 86400
					break
				case 'hours':
					seconds = value * 3600
					break
				case 'minutes':
					seconds = value * 60
					break
				case 'seconds':
					seconds = value
					break
			}
			onUpdate({ timerSeconds: Math.round(seconds) })
		} else {
			onUpdate({ timerSeconds: undefined })
		}
		setIsEditingTimer(false)
	}

	const handleClearTimer = (e: React.MouseEvent) => {
		e.stopPropagation()
		onUpdate({ timerSeconds: undefined })
	}

	const handleTimerKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter') handleTimerSave()
		else if (e.key === 'Escape') setIsEditingTimer(false)
	}

	// ── Image upload ────────────────────────────────────────────────
	const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		diag.image('recipe', 'select', {
			stepIndex: index,
			fileName: file.name,
			size: file.size,
		})
		setIsUploadingImage(true)

		const localPreviewUrl = URL.createObjectURL(file)
		diag.image('recipe', 'upload-start', { stepIndex: index, localPreviewUrl })
		onUpdate({ imageUrl: localPreviewUrl })

		try {
			const response = await uploadRecipeImages([file])
			if (response.success && response.data?.[0]) {
				diag.image('recipe', 'upload-success', {
					stepIndex: index,
					serverUrl: response.data[0],
				})
				onUpdate({ imageUrl: response.data[0] })
				URL.revokeObjectURL(localPreviewUrl)
			} else {
				diag.image('recipe', 'upload-fail', { stepIndex: index, response })
				toast.error(t('imageUploadFailed'), {
					description: t('imageUploadFailedDesc'),
				})
			}
		} catch (error) {
			diag.image('recipe', 'upload-fail', { stepIndex: index, error })
			toast.error(t('imageUploadFailed'), {
				description: t('imageUploadFailedDesc'),
			})
		} finally {
			setIsUploadingImage(false)
		}
	}

	// ── Video upload ────────────────────────────────────────────────
	const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const validTypes = ['video/mp4', 'video/webm']
		if (!validTypes.includes(file.type)) {
			toast.error(t('invalidVideoFormat'), {
				description: t('invalidVideoFormatDesc'),
			})
			return
		}

		const maxSize = 50 * 1024 * 1024 // 50MB
		if (file.size > maxSize) {
			toast.error(t('videoTooLarge'), { description: t('videoTooLargeDesc') })
			return
		}

		setIsUploadingVideo(true)
		try {
			const response = await uploadStepVideo(file)
			if (response.success && response.data) {
				onUpdate({
					videoUrl: response.data.url,
					videoThumbnailUrl: response.data.thumbnailUrl,
					videoDurationSec: response.data.durationSec,
				})
				toast.success(t('videoUploaded'))
			} else {
				toast.error(t('videoUploadFailed'))
			}
		} catch {
			toast.error(t('videoUploadFailed'))
		} finally {
			setIsUploadingVideo(false)
			if (videoInputRef.current) videoInputRef.current.value = ''
		}
	}

	const timerSeconds = getTimerSeconds(step)

	// ── Render ──────────────────────────────────────────────────────
	return (
		<div className='group flex gap-3.5 rounded-2xl bg-bg p-4'>
			<div className='flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-hero text-sm font-display font-extrabold text-white shadow-card'>
				{index + 1}
			</div>
			<div className='flex-1 space-y-3'>
				{/* Step Image */}
				{step.imageUrl ? (
					<div className='relative'>
						<Image
							src={step.imageUrl}
							alt={`Step ${index + 1}`}
							width={400}
							height={128}
							className={cn(
								'h-32 w-full rounded-lg object-cover',
								isUploadingImage && 'opacity-60',
							)}
						/>
						{isUploadingImage && (
							<div className='absolute inset-0 flex items-center justify-center'>
								<div className='size-8 animate-spin rounded-full border-2 border-white border-t-transparent' />
							</div>
						)}
						<button
							type='button'
							onClick={() => {
								diag.image('recipe', 'remove', { stepIndex: index })
								onUpdate({ imageUrl: undefined })
							}}
							disabled={isUploadingImage}
							className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-error disabled:opacity-50'
						>
							<X className='size-3.5' />
						</button>
					</div>
				) : (
					<button
						type='button'
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploadingImage}
						className='flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-text-secondary transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isUploadingImage ? (
							<>
								<div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
								{t('uploading')}
							</>
						) : (
							<>
								<ImagePlus className='size-4' />
								{t('addStepPhoto')}
							</>
						)}
					</button>
				)}
				<input
					ref={fileInputRef}
					type='file'
					accept='image/*'
					onChange={handleImageUpload}
					className='hidden'
				/>

				{/* Step Video */}
				{step.videoUrl ? (
					<div className='relative'>
						<video
							src={step.videoUrl}
							poster={step.videoThumbnailUrl || undefined}
							controls
							muted
							playsInline
							className='h-32 w-full rounded-lg object-cover'
						/>
						<button
							type='button'
							onClick={() =>
								onUpdate({
									videoUrl: undefined,
									videoThumbnailUrl: undefined,
									videoDurationSec: undefined,
								})
							}
							className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-error'
						>
							<X className='size-3.5' />
						</button>
					</div>
				) : (
					<button
						type='button'
						onClick={() => videoInputRef.current?.click()}
						disabled={isUploadingVideo}
						className='flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-text-secondary transition-colors hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isUploadingVideo ? (
							<>
								<div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
								{t('uploadingVideo')}
							</>
						) : (
							<>
								<Video className='size-4' />
								{t('addStepVideo')}
							</>
						)}
					</button>
				)}
				<input
					ref={videoInputRef}
					type='file'
					accept='video/mp4,video/webm'
					onChange={handleVideoUpload}
					className='hidden'
				/>

				{/* Instruction */}
				<textarea
					defaultValue={step.instruction}
					onChange={e => onUpdate({ instruction: e.target.value })}
					placeholder={t('describeStepPlaceholder')}
					className='min-h-16 w-full resize-none rounded-lg border border-border bg-bg-card p-3 text-sm text-text placeholder:text-text-secondary/50 focus:border-brand focus:outline-none'
				/>

				{/* Timer & Technique Tags */}
				<div className='flex flex-wrap gap-2.5'>
					{isEditingTimer ? (
						<div className='flex items-center gap-1.5 rounded-lg border border-brand bg-brand/5 px-2 py-1'>
							<Timer className='size-3.5 text-brand' />
							<input
								type='number'
								value={timerValue}
								onChange={e => setTimerValue(e.target.value)}
								onKeyDown={handleTimerKeyDown}
								placeholder='0'
								min='0'
								className='w-12 bg-transparent text-xs font-semibold text-brand outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
								autoFocus
							/>
							<select
								value={timerUnit}
								onChange={e => setTimerUnit(e.target.value as TimeUnit)}
								className='bg-bg-card text-xs font-semibold text-brand outline-none cursor-pointer rounded px-1 py-0.5'
							>
								<option value='seconds' className='bg-bg-card text-text'>
									sec
								</option>
								<option value='minutes' className='bg-bg-card text-text'>
									min
								</option>
								<option value='hours' className='bg-bg-card text-text'>
									hours
								</option>
								<option value='days' className='bg-bg-card text-text'>
									days
								</option>
							</select>
							<button
								type='button'
								onClick={handleTimerSave}
								className='ml-1 rounded bg-brand px-2 py-0.5 text-xs font-semibold text-white'
							>
								✓
							</button>
						</div>
					) : timerSeconds ? (
						<div className='flex items-center gap-1 rounded-lg bg-brand/10 px-3 py-1.5'>
							<button
								type='button'
								onClick={openTimerEditor}
								className='flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand/80'
							>
								<Timer className='size-3.5' />
								{formatTimer(timerSeconds)}
							</button>
							<button
								type='button'
								onClick={handleClearTimer}
								aria-label={t('clearTimer')}
								className='ml-1 flex size-4 items-center justify-center rounded-full text-brand/60 hover:bg-brand/20 hover:text-brand'
							>
								<X className='size-3' />
							</button>
						</div>
					) : (
						<button
							type='button'
							onClick={openTimerEditor}
							className='flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-text-secondary transition-colors hover:border-brand hover:text-brand'
						>
							<Timer className='size-3.5' />
						{t('addTimer')}
						</button>
					)}
					{step.technique && (
						<span className='rounded-lg bg-streak/10 px-3 py-1.5 text-xs font-semibold text-streak'>
							🔥 {step.technique}
						</span>
					)}
				</div>
			</div>
			<div className='flex flex-col gap-2'>
				<button
					type='button'
					aria-label={t('dragToReorder')}
					className='flex size-8 cursor-grab items-center justify-center rounded-lg text-text-secondary/70 transition-colors hover:bg-muted/30 hover:text-text-secondary active:cursor-grabbing'
				>
					<GripVertical className='size-4' />
				</button>
				<button
					type='button'
					onClick={onRemove}
					aria-label={t('removeStep')}
					className='flex size-8 items-center justify-center rounded-lg text-text-secondary/50 transition-colors hover:bg-error/10 hover:text-error'
				>
					<Trash2 className='size-4' />
				</button>
			</div>
		</div>
	)
}
