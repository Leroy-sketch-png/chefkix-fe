'use client'

import { useState, useRef } from 'react'
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
				toast.error('Image upload failed', {
					description:
						"Using local preview. Image won't persist after page refresh.",
				})
			}
		} catch (error) {
			diag.image('recipe', 'upload-fail', { stepIndex: index, error })
			toast.error('Image upload failed', {
				description:
					"Using local preview. Image won't persist after page refresh.",
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
			toast.error('Invalid video format', {
				description: 'Only MP4 and WebM are supported.',
			})
			return
		}

		const maxSize = 50 * 1024 * 1024 // 50MB
		if (file.size > maxSize) {
			toast.error('Video too large', { description: 'Maximum size is 50MB.' })
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
				toast.success('Video uploaded')
			} else {
				toast.error('Video upload failed')
			}
		} catch {
			toast.error('Video upload failed')
		} finally {
			setIsUploadingVideo(false)
			if (videoInputRef.current) videoInputRef.current.value = ''
		}
	}

	const timerSeconds = getTimerSeconds(step)

	// ── Render ──────────────────────────────────────────────────────
	return (
		<div className='group flex gap-3.5 rounded-2xl bg-bg p-4'>
			<div className='flex size-8 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-hero text-sm font-extrabold text-white shadow-md'>
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
							onClick={() => {
								diag.image('recipe', 'remove', { stepIndex: index })
								onUpdate({ imageUrl: undefined })
							}}
							disabled={isUploadingImage}
							className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 disabled:opacity-50'
						>
							<X className='size-3.5' />
						</button>
					</div>
				) : (
					<button
						onClick={() => fileInputRef.current?.click()}
						disabled={isUploadingImage}
						className='flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isUploadingImage ? (
							<>
								<div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
								Uploading...
							</>
						) : (
							<>
								<ImagePlus className='size-4' />
								Add step photo
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
							onClick={() =>
								onUpdate({
									videoUrl: undefined,
									videoThumbnailUrl: undefined,
									videoDurationSec: undefined,
								})
							}
							className='absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500'
						>
							<X className='size-3.5' />
						</button>
					</div>
				) : (
					<button
						onClick={() => videoInputRef.current?.click()}
						disabled={isUploadingVideo}
						className='flex h-20 w-full items-center justify-center gap-2 rounded-lg border border-dashed border-border text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-50'
					>
						{isUploadingVideo ? (
							<>
								<div className='size-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
								Uploading video...
							</>
						) : (
							<>
								<Video className='size-4' />
								Add step video
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
					placeholder='Describe this step...'
					className='min-h-16 w-full resize-none rounded-lg border border-border bg-panel-bg p-3 text-sm text-text placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none'
				/>

				{/* Timer & Technique Tags */}
				<div className='flex flex-wrap gap-2.5'>
					{isEditingTimer ? (
						<div className='flex items-center gap-1.5 rounded-lg border border-primary bg-primary/5 px-2 py-1'>
							<Timer className='size-3.5 text-primary' />
							<input
								type='number'
								value={timerValue}
								onChange={e => setTimerValue(e.target.value)}
								onKeyDown={handleTimerKeyDown}
								placeholder='0'
								min='0'
								className='w-12 bg-transparent text-xs font-semibold text-primary outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
								autoFocus
							/>
							<select
								value={timerUnit}
								onChange={e => setTimerUnit(e.target.value as TimeUnit)}
								className='bg-bg-card text-xs font-semibold text-primary outline-none cursor-pointer rounded px-1 py-0.5'
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
								onClick={handleTimerSave}
								className='ml-1 rounded bg-primary px-2 py-0.5 text-xs font-semibold text-white'
							>
								✓
							</button>
						</div>
					) : timerSeconds ? (
						<div className='flex items-center gap-1 rounded-lg bg-primary/10 px-3 py-1.5'>
							<button
								onClick={openTimerEditor}
								className='flex items-center gap-1.5 text-xs font-semibold text-primary transition-colors hover:text-primary/80'
							>
								<Timer className='size-3.5' />
								{formatTimer(timerSeconds)}
							</button>
							<button
								onClick={handleClearTimer}
								className='ml-1 flex size-4 items-center justify-center rounded-full text-primary/60 hover:bg-primary/20 hover:text-primary'
							>
								<X className='size-3' />
							</button>
						</div>
					) : (
						<button
							onClick={openTimerEditor}
							className='flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary'
						>
							<Timer className='size-3.5' />
							Add Timer
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
				<button className='flex size-8 cursor-grab items-center justify-center rounded-lg text-muted-foreground/70 transition-colors hover:bg-muted/30 hover:text-muted-foreground active:cursor-grabbing'>
					<GripVertical className='size-4' />
				</button>
				<button
					onClick={onRemove}
					className='flex size-8 items-center justify-center rounded-lg text-muted-foreground/50 transition-colors hover:bg-red-500/10 hover:text-red-500'
				>
					<Trash2 className='size-4' />
				</button>
			</div>
		</div>
	)
}
