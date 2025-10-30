'use client'

import Link from 'next/link'
import { Bell, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import Image from 'next/image'

export const Topbar = () => {
	const { user } = useAuth()

	return (
		<header className='flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6'>
			<div className='w-full flex-1'>{/* Can add search bar here later */}</div>
			<div className='flex items-center gap-2'>
				<Button variant='outline' size='icon' className='h-8 w-8'>
					<Bell className='h-4 w-4' />
					<span className='sr-only'>Toggle notifications</span>
				</Button>
				<Button variant='outline' size='icon' className='h-8 w-8'>
					<MessageSquare className='h-4 w-4' />
					<span className='sr-only'>Toggle messages</span>
				</Button>
			</div>
			<div>
				{user && (
					<Link href={`/${user.name}`}>
						<div className='relative h-9 w-9 overflow-hidden rounded-full'>
							<Image
								src={user.avatarUrl || 'https://i.pravatar.cc/150'}
								alt={`${user.name}'s avatar`}
								fill
								className='object-cover'
							/>
						</div>
					</Link>
				)}
			</div>
		</header>
	)
}
