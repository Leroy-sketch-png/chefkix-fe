'use client'

import { useEffect, useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
	ImageIcon,
	TypeIcon,
	Send,
	Smile,
	Trash2,
	Camera,
	RotateCw,
	ImagePlus,
	X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import EmojiPicker, { Theme } from 'emoji-picker-react'
import { Rnd } from 'react-rnd'
import { useStoryStore } from '@/store/storyStore'
import { createStory } from '@/services/story'
import { api } from '@/lib/axios'
import { useTranslations } from '@/i18n/hooks'
import { STORY_IMAGE_ACCEPT, validateStoryImage } from '@/lib/story-media'

interface StoryItem {
	id: string
	type: 'TEXT' | 'STICKER' | 'IMAGE_STICKER'
	x: number
	y: number
	width: number | string
	height: number | string

	// --- 3 BIẾN MỚI THÊM VÀO ---
	baseWidth?: number
	baseHeight?: number
	scale?: number
	// ---------------------------

	rotation: number
	data: Record<string, any>
	file?: File
}

const uploadToCloudinary = async (file: File): Promise<string> => {
	const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
	const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

	if (!cloudName || !uploadPreset) throw new Error('Cloudinary config missing')

	const formData = new FormData()
	formData.append('file', file)
	formData.append('upload_preset', uploadPreset)

	const res = await fetch(
		`https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`,
		{ method: 'POST', body: formData },
	)
	const data = await res.json()
	if (!res.ok) throw new Error(data.error?.message || 'Upload failed')
	return data.secure_url
}

export function StoryCreator() {
	const router = useRouter()
	const t = useTranslations('story')
	const [items, setItems] = useState<StoryItem[]>([])
	const [mediaFile, setMediaFile] = useState<File | null>(null)
	const [mediaPreview, setMediaPreview] = useState<string>('')
	const [imageScale, setImageScale] = useState(1)
	const [imageRotation, setImageRotation] = useState(0)

	const [isLoading, setIsLoading] = useState(false)
	const [showEmojiPicker, setShowEmojiPicker] = useState(false)
	const fetchStoryFeed = useStoryStore(state => state.fetchStoryFeed)

	const fileInputRef = useRef<HTMLInputElement>(null)
	const stickerInputRef = useRef<HTMLInputElement>(null)
	const objectUrlsRef = useRef(new Set<string>())

	const createObjectUrl = (file: File) => {
		const url = URL.createObjectURL(file)
		objectUrlsRef.current.add(url)
		return url
	}

	const releaseObjectUrl = (url?: string) => {
		if (url && objectUrlsRef.current.delete(url)) {
			URL.revokeObjectURL(url)
		}
	}

	useEffect(() => {
		const objectUrls = objectUrlsRef.current
		return () => {
			objectUrls.forEach(url => URL.revokeObjectURL(url))
			objectUrls.clear()
		}
	}, [])

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		const validationError = validateStoryImage(file)
		if (validationError) {
			e.target.value = ''
			toast.error(
				validationError === 'too-large'
					? t('imageTooLargeError')
					: t('unsupportedImageError'),
			)
			return
		}

		releaseObjectUrl(mediaPreview)
		setMediaFile(file)
		setMediaPreview(createObjectUrl(file))
		setImageScale(1)
		setImageRotation(0)
	}

	const handleImageStickerUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			const newItem: StoryItem = {
				id: Date.now().toString(),
				type: 'IMAGE_STICKER',
				x: 100,
				y: 150,
				width: 150,
				height: 150,
				rotation: 0,
				data: { imageUrl: createObjectUrl(file) },
				file: file,
			}
			setItems([...items, newItem])
			if (stickerInputRef.current) stickerInputRef.current.value = ''
		}
	}

	const handleAddText = () => {
		const newItem: StoryItem = {
			id: Date.now().toString(),
			type: 'TEXT',
			x: 50,
			y: 100,
			width: 260,
			height: 60,
			rotation: 0,
			data: { text: t('textPlaceholder'), color: '#ffffff' },
		}
		setItems([...items, newItem])
	}

	const handleAddEmoji = (emojiData: any) => {
		const newItem: StoryItem = {
			id: Date.now().toString(),
			type: 'STICKER',
			x: 100,
			y: 150,
			width: 100,
			height: 100,
			rotation: 0,
			data: { emoji: emojiData.emoji },
		}
		setItems([...items, newItem])
		setShowEmojiPicker(false)
	}

	const updateItemText = (id: string, text: string) => {
		setItems(
			items.map(item =>
				item.id === id ? { ...item, data: { ...item.data, text } } : item,
			),
		)
	}

	const removeItem = (id: string) => {
		const item = items.find(candidate => candidate.id === id)
		if (item?.type === 'IMAGE_STICKER') {
			releaseObjectUrl(item.data.imageUrl)
		}
		setItems(items.filter(candidate => candidate.id !== id))
	}
	const rotateItem = (id: string) =>
		setItems(
			items.map(item =>
				item.id === id ? { ...item, rotation: item.rotation + 45 } : item,
			),
		)

	const handleSubmit = async () => {
		if (!mediaFile) {
			toast.error(t('selectBackgroundPrompt'))
			return
		}

		setIsLoading(true)
		try {
			// 1. Chờ upload toàn bộ ảnh sticker lên Cloudinary (Nếu có)
			// 1. Chờ upload toàn bộ ảnh sticker lên Cloudinary (Nếu có)
			const processedItems = await Promise.all(
				items.map(async item => {
					let finalImageUrl = item.data?.imageUrl

					if (item.type === 'IMAGE_STICKER' && item.file) {
						finalImageUrl = await uploadToCloudinary(item.file)
					}

					return {
						type: item.type === 'IMAGE_STICKER' ? 'STICKER' : item.type,
						x: item.x,
						y: item.y,
						rotation: item.rotation || 0,
						// LẤY SCALE, WIDTH, HEIGHT TỪ ITEM, KHÔNG PHẢI ITEM.DATA
						scale: item.scale || 1,
						data: {
							...(item.data || {}),
							imageUrl: finalImageUrl,
							width: item.baseWidth || item.width,
							height: item.baseHeight || item.height,
						},
					}
				}),
			)

			// 2. Đóng gói FormData
			const formData = new FormData()
			formData.append('file', mediaFile)

			const storyMetadata = {
				mediaType: 'IMAGE',
				linkedRecipeId: null,
				imageScale: imageScale, // Gửi tỷ lệ của ảnh nền
				imageRotation: imageRotation, // Gửi góc xoay của ảnh nền
				items: processedItems,
			}

			formData.append(
				'story',
				new Blob([JSON.stringify(storyMetadata)], {
					type: 'application/json',
				}),
			)

			// 3. Gửi lên Backend
			const response = await api.post('/api/v1/stories', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})

			if (response.status === 201 || response.data?.success) {
				toast.success(t('publishSuccessMessage'))
				await fetchStoryFeed()
				router.push('/dashboard')
			}
		} catch (e: any) {
			console.error('Story publish error:', e)
			toast.error(e.response?.data?.message || t('errorMessage'))
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex h-screen bg-bg text-text-primary font-sans overflow-hidden'>
			{/* CỘT TRÁI: Thanh Sidebar điều khiển */}
			<div className='w-drawer bg-bg-card border-r border-border flex flex-col z-10 shadow-2xl'>
				<div className='flex items-center gap-3 p-4 border-b border-border'>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => router.back()}
						className='rounded-full hover:bg-bg-hover text-white'
					>
						<X className='w-5 h-5' />
					</Button>
					<h2 className='text-xl font-bold'>{t('createStoryTitle')}</h2>
				</div>

				<div className='flex-1 overflow-y-auto p-4 space-y-6'>
					{/* Khu vực Upload Ảnh Nền */}
					<div className='space-y-3'>
						<h3 className='text-label font-semibold text-text-secondary'>
							{t('backgroundMediaLabel')}
						</h3>
						<input
							type='file'
							accept={STORY_IMAGE_ACCEPT}
							className='hidden'
							ref={fileInputRef}
							onChange={handleImageUpload}
						/>
						<Button
							onClick={() => fileInputRef.current?.click()}
							className='w-full bg-bg-hover hover:bg-border-subtle text-text-primary font-semibold h-12 flex items-center justify-center gap-2 rounded-xl'
						>
							<ImageIcon className='w-5 h-5' />
							{mediaPreview
								? t('changeBackgroundButton')
								: t('selectBackgroundButton')}
						</Button>
					</div>

					{mediaPreview && (
						<div className='space-y-4 p-4 bg-bg rounded-xl border border-border'>
							<h3 className='text-label font-semibold text-text-secondary mb-2'>
								{t('editBackgroundSection')}
							</h3>

							<div className='space-y-2'>
								<div className='flex justify-between text-xs text-text-secondary'>
									<span>
										{t('zoomLabel', { scale: imageScale.toFixed(1) })}
									</span>
								</div>
								<input
									type='range'
									min='0.5'
									max='3'
									step='0.1'
									value={imageScale}
									onChange={e => setImageScale(Number(e.target.value))}
									className='w-full accent-blue-500 h-1 bg-bg-hover rounded-xl appearance-none cursor-pointer'
								/>
							</div>

							<div className='space-y-2'>
								<div className='flex justify-between text-xs text-text-secondary'>
									<span>{t('rotateLabel', { rotation: imageRotation })}</span>
								</div>
								<input
									type='range'
									min='-180'
									max='180'
									step='1'
									value={imageRotation}
									onChange={e => setImageRotation(Number(e.target.value))}
									className='w-full accent-blue-500 h-1 bg-bg-hover rounded-xl appearance-none cursor-pointer'
								/>
							</div>
						</div>
					)}

					{/* Khu vực Thêm Sticker / Text */}
					<div className='space-y-3'>
						<h3 className='text-label font-semibold text-text-secondary'>
							{t('addDetailsSection')}
						</h3>
						<div className='grid grid-cols-2 gap-3'>
							<button
								onClick={handleAddText}
								className='flex flex-col items-center justify-center p-4 bg-bg-hover hover:bg-border-subtle rounded-xl transition-colors'
							>
								<div className='bg-white/10 p-2 rounded-full mb-2'>
									<TypeIcon className='w-5 h-5 text-white' />
								</div>
								<span className='text-sm font-medium'>{t('textOption')}</span>
							</button>

							<div className='relative'>
								<button
									onClick={() => setShowEmojiPicker(!showEmojiPicker)}
									className='w-full flex flex-col items-center justify-center p-4 bg-bg-hover hover:bg-border-subtle rounded-xl transition-colors'
								>
									<div className='bg-white/10 p-2 rounded-full mb-2'>
										<Smile className='w-5 h-5 text-white' />
									</div>
									<span className='text-sm font-medium'>
										{t('emojiOption')}
									</span>
								</button>
								{showEmojiPicker && (
									<div className='absolute top-full left-0 mt-2 z-dropdown shadow-2xl rounded-xl overflow-hidden'>
										<div
											className='fixed inset-0 z-[-1]'
											onClick={() => setShowEmojiPicker(false)}
										/>
										<EmojiPicker
											onEmojiClick={handleAddEmoji}
											width={300}
											height={350}
											theme={Theme.DARK}
										/>
									</div>
								)}
							</div>
						</div>

						<input
							type='file'
							accept='image/png,image/jpeg,image/webp'
							className='hidden'
							ref={stickerInputRef}
							onChange={handleImageStickerUpload}
						/>
						<button
							onClick={() => stickerInputRef.current?.click()}
							className='w-full flex items-center justify-center gap-2 p-3 bg-bg-hover hover:bg-border-subtle rounded-xl transition-colors'
						>
							<ImagePlus className='w-5 h-5' />
							<span className='text-sm font-medium'>
								{t('uploadStickerButton')}
							</span>
						</button>
					</div>
				</div>

				{/* Nút Đăng Story */}
				<div className='p-4 border-t border-border bg-bg-card'>
					<Button
						onClick={handleSubmit}
						disabled={isLoading || !mediaPreview}
						className='w-full bg-brand hover:bg-brand-hover text-white font-semibold h-11 rounded-xl text-label'
					>
						{isLoading ? t('loadingText') : t('publishButton')}
					</Button>
				</div>
			</div>

			{/* CỘT PHẢI: Canvas Review */}
			<div className='flex-1 flex items-center justify-center bg-bg p-8 relative'>
				<div className='relative w-full max-w-sm aspect-[9/16] bg-black rounded-xl shadow-md overflow-hidden border border-border'>
					{/* Story background image */}
					{mediaPreview ? (
						<img
							src={mediaPreview}
							alt='Story Background'
							className='absolute inset-0 w-full h-full object-cover pointer-events-none transition-transform duration-75'
							style={{
								transform: `scale(${imageScale}) rotate(${imageRotation}deg)`,
							}}
						/>
					) : (
						<div className='absolute inset-0 flex flex-col items-center justify-center text-text-secondary bg-bg-card'>
							<Camera className='w-16 h-16 mb-4 opacity-30' />
							<span className='text-sm font-medium'>{t('previewLabel')}</span>
						</div>
					)}

					{/* Lớp Layer Items (Text, Stickers) */}
					{items.map(item => (
						<Rnd
							key={item.id}
							bounds='parent'
							size={{ width: item.width, height: item.height }}
							position={{ x: item.x, y: item.y }}
							onDragStop={(e, d) =>
								setItems(prev =>
									prev.map(i =>
										i.id === item.id ? { ...i, x: d.x, y: d.y } : i,
									),
								)
							}
							onResizeStop={(e, dir, ref, delta, position) => {
								setItems(prev =>
									prev.map(i =>
										i.id === item.id
											? {
													...i,
													width: ref.style.width,
													height: ref.style.height,
													...position,
												}
											: i,
									),
								)
							}}
							className='absolute flex items-center justify-center group z-50 cursor-grab active:cursor-grabbing'
							style={{ transform: `rotate(${item.rotation}deg)` }}
						>
							<div className='w-full h-full relative flex items-center justify-center'>
								{item.type === 'TEXT' && (
									<textarea
										value={item.data.text}
										onChange={e => updateItemText(item.id, e.target.value)}
										className='w-full h-full bg-transparent text-white border-2 border-transparent hover:border-white/30 focus:border-white/70 outline-none resize-none !text-2xl font-bold text-center flex items-center justify-center pt-2 rounded-md overflow-hidden leading-tight'
										style={{
											textShadow:
												'0px 2px 10px rgba(0,0,0,0.8), 0px 0px 2px rgba(0,0,0,1)',
										}}
									/>
								)}

								{item.type === 'STICKER' && (
									<div className='text-7xl leading-none select-none drop-shadow-2xl'>
										{item.data.emoji}
									</div>
								)}

								{item.type === 'IMAGE_STICKER' && (
									<img
										src={item.data.imageUrl}
										alt='Custom Sticker'
										className='w-full h-full object-contain pointer-events-none drop-shadow-xl'
									/>
								)}

								<div className='absolute -top-12 right-0 hidden group-hover:flex gap-1.5 bg-black/60 p-1 rounded-xl backdrop-blur-sm border border-white/10'>
									<Button
										variant='ghost'
										size='icon'
										className='w-8 h-8 rounded-md text-white hover:bg-white/20'
										onClick={() => rotateItem(item.id)}
									>
										<RotateCw className='w-4 h-4' />
									</Button>
									<Button
										variant='ghost'
										size='icon'
										className='w-8 h-8 rounded-md text-error hover:bg-error/20 hover:text-error'
										onClick={() => removeItem(item.id)}
									>
										<Trash2 className='w-4 h-4' />
									</Button>
								</div>
							</div>
						</Rnd>
					))}
				</div>
			</div>
		</div>
	)
}
