'use client'

import { Send, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useUiStore } from '@/store/uiStore'

export const MessagesDrawer = () => {
	const { isMessagesDrawerOpen, toggleMessagesDrawer } = useUiStore()

	if (!isMessagesDrawerOpen) return null

	return (
		<div className='fixed bottom-0 right-5 z-50 flex h-[400px] w-[300px] flex-col rounded-t-lg border bg-card text-card-foreground shadow-lg'>
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
