'use client'

import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useTranslations } from 'next-intl'

/**
 * Global 404 Not Found Page
 *
 * 404.4: Global not-found.tsx with consistent styling
 * - Warm, branded error page
 * - Clear navigation options
 * - Works for any invalid route
 */
export default function NotFound() {
	const t = useTranslations('shared')

	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-bg px-4'>
			<div className='mx-auto max-w-md text-center'>
				{/* Branded 404 illustration */}
				<div className='mb-6 flex justify-center'>
					<div className='relative'>
						{/* Large 404 text */}
						<span className='text-9xl font-display font-black text-brand/20'>
							404
						</span>
						{/* Chef illustration overlay */}
						<div className='absolute inset-0 flex items-center justify-center'>
							<Image
								src='/404-chef.svg'
								alt='Chef illustration'
								width={120}
								height={120}
								className='opacity-80'
								priority
							/>
						</div>
					</div>
				</div>

				<h1 className='mb-2 text-2xl font-bold leading-tight text-text'>
					{t('notFoundTitle')}
				</h1>
				<p className='mb-8 leading-normal text-text-secondary'>
					{t('notFoundDesc')}
				</p>

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button asChild className='h-11 gap-2'>
						<Link href='/dashboard'>
							<Home className='size-4' />
							{t('goToDashboard')}
						</Link>
					</Button>
					<Button variant='outline' asChild className='h-11 gap-2'>
						<Link href='/explore'>
							<Search className='size-4' />
							{t('exploreRecipes')}
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
