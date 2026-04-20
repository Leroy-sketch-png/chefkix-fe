'use client'

import { useState, useRef, useEffect } from 'react'
import { X, ZoomIn, ZoomOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'

interface ImageLightboxProps {
	src: string
	alt: string
	children: React.ReactNode
	className?: string
}

/**
 * Click-to-zoom image viewer with zoom controls.
 * Uses Portal to escape stacking contexts.
 *
 * @example
 * <ImageLightbox src="/photo.jpg" alt="Food photo">
 *   <img src="/photo.jpg" alt="Food photo" className="w-48" />
 * </ImageLightbox>
 */
export function ImageLightbox({
	src,
	alt,
	children,
	className,
}: ImageLightboxProps) {
	const [open, setOpen] = useState(false)
	const [zoom, setZoom] = useState(1)
	const overlayRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (open) overlayRef.current?.focus()
	}, [open])

	const handleClose = () => {
		setOpen(false)
		setZoom(1)
	}

	return (
		<>
			<button
				type='button'
				onClick={() => setOpen(true)}
				className={cn('group relative cursor-zoom-in', className)}
			>
				{children}
				<div className='pointer-events-none absolute inset-0 flex items-center justify-center rounded bg-black/0 transition-colors group-hover:bg-black/10'>
					<ZoomIn className='size-8 text-white opacity-0 drop-shadow-lg transition-opacity group-hover:opacity-100' />
				</div>
			</button>

			{open && (
				<Portal>
					<div
						ref={overlayRef}
						tabIndex={-1}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/95 outline-none'
						role='dialog'
						aria-modal='true'
						aria-label={alt}
						onKeyDown={e => {
							if (e.key === 'Escape') handleClose()
						}}
					>
						{/* Controls */}
						<div className='absolute right-4 top-4 z-10 flex items-center gap-2'>
							<button
								type='button'
								onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
								className='rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20'
								aria-label='Zoom out'
							>
								<ZoomOut className='size-5' />
							</button>
							<button
								type='button'
								onClick={() => setZoom(1)}
								className='rounded-full bg-white/10 px-3 py-1 text-sm text-white transition-colors hover:bg-white/20'
								aria-label='Reset zoom'
							>
								{Math.round(zoom * 100)}%
							</button>
							<button
								type='button'
								onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
								className='rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20'
								aria-label='Zoom in'
							>
								<ZoomIn className='size-5' />
							</button>
							<button
								type='button'
								onClick={handleClose}
								className='ml-2 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20'
								aria-label='Close lightbox'
							>
								<X className='size-5' />
							</button>
						</div>

						{/* Image */}
						<div
							className='flex size-full items-center justify-center overflow-auto'
							onClick={e => {
								if (e.target === e.currentTarget) handleClose()
							}}
						>
							<div
								className='transition-transform duration-200'
								style={{ transform: `scale(${zoom})` }}
							>
								{/* eslint-disable-next-line @next/next/no-img-element */}
								<img
									src={src}
									alt={alt}
									className='max-h-[90vh] max-w-[95vw] object-contain'
								/>
							</div>
						</div>
					</div>
				</Portal>
			)}
		</>
	)
}
