import { Button } from '@/components/ui/button'
import { Home, Search } from 'lucide-react'
import Link from 'next/link'

/**
 * Global 404 Not Found Page
 *
 * 404.4: Global not-found.tsx with consistent styling
 * - Warm, branded error page
 * - Clear navigation options
 * - Works for any invalid route
 */
export default function NotFound() {
	return (
		<div className='flex min-h-screen flex-col items-center justify-center bg-bg px-4'>
			<div className='mx-auto max-w-md text-center'>
				{/* Branded 404 illustration */}
				<div className='mb-6 flex justify-center'>
					<div className='relative'>
						{/* Large 404 text */}
						<span className='text-9xl font-black text-brand/20'>404</span>
						{/* Overlapping chef hat emoji */}
						<span className='absolute inset-0 flex items-center justify-center text-6xl'>
							👨‍🍳
						</span>
					</div>
				</div>

				<h1 className='mb-2 text-2xl font-bold leading-tight text-text'>
					Page Not Found
				</h1>
				<p className='mb-8 leading-normal text-text-secondary'>
					Oops! This recipe seems to have gone missing from our kitchen.
					Let&apos;s get you back on track.
				</p>

				<div className='flex flex-col gap-3 sm:flex-row sm:justify-center'>
					<Button asChild className='h-11 gap-2'>
						<Link href='/dashboard'>
							<Home className='size-4' />
							Go to Dashboard
						</Link>
					</Button>
					<Button variant='outline' asChild className='h-11 gap-2'>
						<Link href='/explore'>
							<Search className='size-4' />
							Explore Recipes
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}
