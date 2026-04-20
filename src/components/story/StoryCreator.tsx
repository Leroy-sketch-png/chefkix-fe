'use client'

import { useState, useRef } from 'react'
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

interface StoryItem {
	id: string
	type: 'TEXT' | 'STICKER' | 'IMAGE_STICKER'
	x: number
	y: number
	width: number | string
	height: number | string
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

	const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (file) {
			setMediaFile(file)
			setMediaPreview(URL.createObjectURL(file))
			setImageScale(1) // Reset scale
			setImageRotation(0) // Reset rotation
		}
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
				data: { imageUrl: URL.createObjectURL(file) },
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
			data: { text: 'Nhập chữ...', color: '#ffffff' },
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

	const removeItem = (id: string) =>
		setItems(items.filter(item => item.id !== id))
	const rotateItem = (id: string) =>
		setItems(
			items.map(item =>
				item.id === id ? { ...item, rotation: item.rotation + 45 } : item,
			),
		)

	const handleSubmit = async () => {
		if (!mediaFile) {
			toast.error('Vui lòng chọn ảnh nền')
			return
		}

		setIsLoading(true)
		try {
			const formData = new FormData()

			// 1. Gắn file vật lý vào key "file" (khớp với @RequestPart("file") ở BE)
			formData.append('file', mediaFile)

			// 2. Chuẩn bị dữ liệu metadata
			const formattedItems = items.map(item => ({
				type: item.type === 'IMAGE_STICKER' ? 'STICKER' : item.type,
				x: item.x,
				y: item.y,
				rotation: item.rotation,
				// Tính scale dựa trên chiều rộng (Backend cần số double)
				scale:
					typeof item.width === 'string'
						? parseInt(item.width) / 100
						: item.width / 100,
				data: item.data,
			}))

			const storyMetadata = {
				mediaType: 'IMAGE',
				linkedRecipeId: null,
				items: formattedItems,
			}

			// 3. Gắn metadata vào key "story" dưới dạng Blob JSON (khớp với @RequestPart("story") ở BE)
			formData.append(
				'story',
				new Blob([JSON.stringify(storyMetadata)], {
					type: 'application/json',
				}),
			)

			// 4. Gửi bằng Axios (nó tự xử lý boundary cho Multipart)
			const response = await api.post('/api/v1/stories', formData, {
				headers: { 'Content-Type': 'multipart/form-data' },
			})

			if (response.status === 201 || response.data?.success) {
				toast.success('Đăng Story thành công!')
				await fetchStoryFeed()
				router.push('/dashboard')
			}
		} catch (e: any) {
			console.error('Lỗi đăng story:', e)
			toast.error(e.response?.data?.message || 'Có lỗi xảy ra')
		} finally {
			setIsLoading(false)
		}
	}

	return (
		<div className='flex h-screen bg-[#18191A] text-[#E4E6EB] font-sans overflow-hidden'>
			{/* CỘT TRÁI: Thanh Sidebar điều khiển */}
			<div className='w-[360px] bg-[#242526] border-r border-[#3E4042] flex flex-col z-10 shadow-2xl'>
				<div className='flex items-center gap-3 p-4 border-b border-[#3E4042]'>
					<Button
						variant='ghost'
						size='icon'
						onClick={() => router.back()}
						className='rounded-full hover:bg-[#3A3B3C] text-white'
					>
						<X className='w-5 h-5' />
					</Button>
					<h2 className='text-xl font-bold'>Tạo tin</h2>
				</div>

				<div className='flex-1 overflow-y-auto p-4 space-y-6'>
					{/* Khu vực Upload Ảnh Nền */}
					<div className='space-y-3'>
						<h3 className='text-[15px] font-semibold text-[#B0B3B8]'>
							Ảnh / Video nền
						</h3>
						<input
							type='file'
							accept='image/*,video/*'
							className='hidden'
							ref={fileInputRef}
							onChange={handleImageUpload}
						/>
						<Button
							onClick={() => fileInputRef.current?.click()}
							className='w-full bg-[#3A3B3C] hover:bg-[#4E4F50] text-[#E4E6EB] font-semibold h-12 flex items-center justify-center gap-2 rounded-lg'
						>
							<ImageIcon className='w-5 h-5' />
							{mediaPreview ? 'Thay đổi ảnh nền' : 'Chọn ảnh nền'}
						</Button>
					</div>

					{mediaPreview && (
						<div className='space-y-4 p-4 bg-[#18191A] rounded-xl border border-[#3E4042]'>
							<h3 className='text-[15px] font-semibold text-[#B0B3B8] mb-2'>
								Chỉnh sửa nền
							</h3>

							<div className='space-y-2'>
								<div className='flex justify-between text-xs text-[#B0B3B8]'>
									<span>Phóng to ({imageScale.toFixed(1)}x)</span>
								</div>
								<input
									type='range'
									min='0.5'
									max='3'
									step='0.1'
									value={imageScale}
									onChange={e => setImageScale(Number(e.target.value))}
									className='w-full accent-blue-500 h-1 bg-[#3A3B3C] rounded-lg appearance-none cursor-pointer'
								/>
							</div>

							<div className='space-y-2'>
								<div className='flex justify-between text-xs text-[#B0B3B8]'>
									<span>Xoay ({imageRotation}°)</span>
								</div>
								<input
									type='range'
									min='-180'
									max='180'
									step='1'
									value={imageRotation}
									onChange={e => setImageRotation(Number(e.target.value))}
									className='w-full accent-blue-500 h-1 bg-[#3A3B3C] rounded-lg appearance-none cursor-pointer'
								/>
							</div>
						</div>
					)}

					{/* Khu vực Thêm Sticker / Text */}
					<div className='space-y-3'>
						<h3 className='text-[15px] font-semibold text-[#B0B3B8]'>
							Thêm chi tiết
						</h3>
						<div className='grid grid-cols-2 gap-3'>
							<button
								onClick={handleAddText}
								className='flex flex-col items-center justify-center p-4 bg-[#3A3B3C] hover:bg-[#4E4F50] rounded-xl transition-colors'
							>
								<div className='bg-white/10 p-2 rounded-full mb-2'>
									<TypeIcon className='w-5 h-5 text-white' />
								</div>
								<span className='text-sm font-medium'>Văn bản</span>
							</button>

							<div className='relative'>
								<button
									onClick={() => setShowEmojiPicker(!showEmojiPicker)}
									className='w-full flex flex-col items-center justify-center p-4 bg-[#3A3B3C] hover:bg-[#4E4F50] rounded-xl transition-colors'
								>
									<div className='bg-white/10 p-2 rounded-full mb-2'>
										<Smile className='w-5 h-5 text-white' />
									</div>
									<span className='text-sm font-medium'>Cảm xúc</span>
								</button>
								{showEmojiPicker && (
									<div className='absolute top-full left-0 mt-2 z-[999] shadow-2xl rounded-xl overflow-hidden'>
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
							className='w-full flex items-center justify-center gap-2 p-3 bg-[#3A3B3C] hover:bg-[#4E4F50] rounded-xl transition-colors'
						>
							<ImagePlus className='w-5 h-5' />
							<span className='text-sm font-medium'>Tải ảnh Sticker lên</span>
						</button>
					</div>
				</div>

				{/* Nút Đăng Story */}
				<div className='p-4 border-t border-[#3E4042] bg-[#242526]'>
					<Button
						onClick={handleSubmit}
						disabled={isLoading || !mediaPreview}
						className='w-full bg-[#0866FF] hover:bg-[#0054D1] text-white font-semibold h-11 rounded-lg text-[15px]'
					>
						{isLoading ? 'Đang xử lý...' : 'Chia sẻ lên Tin'}
					</Button>
				</div>
			</div>

			{/* CỘT PHẢI: Canvas Review */}
			<div className='flex-1 flex items-center justify-center bg-[#18191A] p-8 relative'>
				<div className='relative w-full max-w-[380px] aspect-[9/16] bg-black rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden border border-[#3E4042]'>
					{/* Lớp nền Ảnh/Video */}
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
						<div className='absolute inset-0 flex flex-col items-center justify-center text-[#B0B3B8] bg-[#242526]'>
							<Camera className='w-16 h-16 mb-4 opacity-30' />
							<span className='text-sm font-medium'>Bản xem trước</span>
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
									<div className='text-[80px] leading-none select-none drop-shadow-2xl'>
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

								<div className='absolute -top-12 right-0 hidden group-hover:flex gap-1.5 bg-black/60 p-1 rounded-lg backdrop-blur-sm border border-white/10'>
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
										className='w-8 h-8 rounded-md text-[#FF4444] hover:bg-[#FF4444]/20 hover:text-[#FF4444]'
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
