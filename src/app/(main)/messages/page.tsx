'use client'

import { MoreHorizontal, Send } from 'lucide-react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { PageTransition } from '@/components/layout/PageTransition'

const conversations = [
	{
		id: 1,
		user: 'ChefAnna',
		avatar: 'https://i.pravatar.cc/40?u=1',
		lastMessage: 'That sounds amazing! 🔥',
		unread: true,
	},
	{
		id: 2,
		user: 'MarcoB',
		avatar: 'https://i.pravatar.cc/40?u=2',
		lastMessage: 'See you then!',
		unread: false,
	},
]

const messages = [
	{
		id: 1,
		text: 'Just saw your ramen video, looks insane! 🍜',
		type: 'them',
	},
	{
		id: 2,
		text: 'Thanks! It&apos;s my new favorite.',
		type: 'you',
	},
	{
		id: 3,
		text: 'We should cook together sometime!',
		type: 'them',
	},
	{
		id: 4,
		text: 'Definitely! What are you thinking?',
		type: 'you',
	},
]

export default function MessagesPage() {
	return (
		<PageTransition>
			<div className='flex h-full w-full overflow-hidden rounded-lg border bg-card shadow-sm'>
				{/* Sidebar of conversations */}
				<div className='hidden w-80 flex-shrink-0 flex-col border-r md:flex'>
					<div className='border-b p-4'>
						<h2 className='text-xl font-bold'>Messages</h2>
					</div>
					<div className='flex-1 overflow-y-auto'>
						{conversations.map(conv => (
							<div
								key={conv.id}
								className='flex cursor-pointer items-center gap-3 border-b p-3 hover:bg-muted'
							>
								<div className='relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-full'>
									<Image
										src={conv.avatar}
										alt={conv.user}
										fill
										className='object-cover'
									/>
								</div>
								<div className='flex-1 overflow-hidden'>
									<p
										className={`font-semibold ${conv.unread ? '' : 'text-muted-foreground'}`}
									>
										{conv.user}
									</p>
									<p
										className={`truncate text-sm ${conv.unread ? 'font-semibold' : 'text-muted-foreground'}`}
									>
										{conv.lastMessage}
									</p>
								</div>
							</div>
						))}
					</div>
				</div>

				{/* Main Chat Window */}
				<div className='flex flex-1 flex-col'>
					<div className='flex items-center justify-between border-b p-4'>
						<h3 className='text-lg font-semibold'>ChefAnna</h3>
						<Button variant='ghost' size='icon'>
							<MoreHorizontal className='h-5 w-5' />
						</Button>
					</div>
					<div className='flex-1 overflow-y-auto p-4'>
						<div className='flex flex-col gap-4'>
							{messages.map(message => (
								<div
									key={message.id}
									className={`flex ${message.type === 'you' ? 'justify-end' : 'justify-start'}`}
								>
									<div
										className={`max-w-[70%] rounded-lg p-3 ${message.type === 'you' ? 'rounded-br-none bg-primary text-primary-foreground' : 'rounded-bl-none bg-muted'}`}
									>
										<p className='text-sm'>{message.text}</p>
									</div>
								</div>
							))}
						</div>
					</div>
					<div className='flex items-center gap-2 border-t p-4'>
						<Input placeholder='Type a message...' className='flex-1' />
						<Button size='icon'>
							<Send className='h-5 w-5' />
						</Button>
					</div>
				</div>
			</div>
		</PageTransition>
	)
}
