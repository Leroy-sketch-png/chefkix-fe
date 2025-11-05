'use client'

import { UserX, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const ProfileNotFound = () => {
	return (
		<div className='flex min-h-[70vh] flex-col items-center justify-center px-4'>
			<div className='mx-auto max-w-md text-center'>
				<div className='mb-6 flex justify-center'>
					<div className='rounded-full bg-muted p-6'>
						<UserX className='h-16 w-16 text-muted-foreground' />
					</div>
				</div>

				<h1 className='mb-2 text-3xl font-bold'>Profile Not Found</h1>
				<p className='mb-8 text-muted-foreground'>
					This profile doesn&apos;t exist or has been removed.
				</p>

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button asChild>
						<Link href='/dashboard'>
							<Home className='mr-2 h-4 w-4' />
							Go to Dashboard
						</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/discover'>
							<Search className='mr-2 h-4 w-4' />
							Discover People
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
