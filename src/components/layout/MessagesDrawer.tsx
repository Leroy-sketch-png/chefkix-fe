'use client'

import { Send, X, GripVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/store/uiStore'
import { useState, useRef, useEffect } from 'react'

export const MessagesDrawer = () => {
	const { isMessagesDrawerOpen, toggleMessagesDrawer } = useUiStore()
	const [width, setWidth] = useState(400)
	const [height, setHeight] = useState(500)
	const [isResizing, setIsResizing] = useState(false)
	const drawerRef = useRef<HTMLDivElement>(null)

	useEffect(() => {
		if (!isResizing) return

		const handleMouseMove = (e: MouseEvent) => {
			if (!drawerRef.current) return
			const rect = drawerRef.current.getBoundingClientRect()

			// Calculate new width (from right edge)
			const newWidth = window.innerWidth - e.clientX - 20 // 20px = right margin
			// Calculate new height (from bottom edge)
			const newHeight = window.innerHeight - e.clientY

			if (newWidth > 300 && newWidth < 800) {
				setWidth(newWidth)
			}
			if (newHeight > 300 && newHeight < 800) {
				setHeight(newHeight)
			}
		}

		const handleMouseUp = () => {
			setIsResizing(false)
		}

		document.addEventListener('mousemove', handleMouseMove)
		document.addEventListener('mouseup', handleMouseUp)

		return () => {
			document.removeEventListener('mousemove', handleMouseMove)
			document.removeEventListener('mouseup', handleMouseUp)
		}
	}, [isResizing])

	if (!isMessagesDrawerOpen) return null

	return (
		<div
			ref={drawerRef}
			className='fixed bottom-0 right-5 z-50 flex flex-col rounded-t-lg border bg-card text-card-foreground shadow-lg'
			style={{ width: `${width}px`, height: `${height}px` }}
		>
			{/* Resize handle */}
			<div
				onMouseDown={() => setIsResizing(true)}
				className='absolute left-0 top-0 flex h-full w-2 cursor-ew-resize items-center justify-center hover:bg-primary/10'
			>
				<div className='h-12 w-1 rounded-full bg-border' />
			</div>
			<div
				onMouseDown={() => setIsResizing(true)}
				className='absolute left-0 top-0 flex h-2 w-full cursor-ns-resize items-center justify-center hover:bg-primary/10'
			>
				<div className='h-1 w-12 rounded-full bg-border' />
			</div>

			<div className='flex items-center justify-between border-b p-3'>
				<h3 className='font-semibold'>ChefAnna</h3>
				<Button variant='ghost' size='icon' onClick={toggleMessagesDrawer}>
					<X className='h-4 w-4' />
				</Button>
			</div>
			<div className='flex-1 overflow-y-auto p-3'>
				<div className='flex flex-col gap-3'>
					{/* Them */}
					<div className='flex items-end'>
						<div className='max-w-[70%] rounded-lg rounded-bl-none bg-muted p-2'>
							<p className='text-sm'>
								Just saw your ramen video, looks insane! 🍜
							</p>
						</div>
					</div>
					{/* You */}
					<div className='flex items-end justify-end'>
						<div className='max-w-[70%] rounded-lg rounded-br-none bg-primary p-2 text-primary-foreground'>
							<p className='text-sm'>Thanks! It&apos;s my new favorite.</p>{' '}
						</div>
					</div>
				</div>
			</div>
			<div className='flex items-center gap-2 border-t p-3'>
				<Input placeholder='Type a message...' className='flex-1' />
				<Button size='icon'>
					<Send className='h-4 w-4' />
				</Button>
			</div>
		</div>
	)
}
