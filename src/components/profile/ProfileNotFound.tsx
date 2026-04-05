'use client'

import { UserX, Home, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

export const ProfileNotFound = () => {
	const t = useTranslations('profile')
	return (
		<div className='flex min-h-content-max flex-col items-center justify-center px-4'>
			<div className='mx-auto max-w-md text-center'>
				<div className='mb-6 flex justify-center'>
					<div className='rounded-full bg-bg-elevated p-6'>
						<UserX className='size-16 text-text-secondary' />
					</div>
				</div>

				<h1 className='mb-2 text-3xl font-bold'>{t('profileNotFound')}</h1>
				<p className='mb-8 text-text-secondary'>
					{t('profileNotFoundDesc')}
				</p>

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button asChild>
						<Link href='/dashboard'>
							<Home className='mr-2 size-4' />
							{t('goToDashboard')}
						</Link>
					</Button>
					<Button variant='outline' asChild>
						<Link href='/discover'>
							<Search className='mr-2 size-4' />
							{t('discoverPeople')}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
