'use client'

import { useEffect, useState } from 'react'
import { IoReadinessPanel } from '@/components/dev/IoReadinessPanel'

const DEMO_COCKPIT_SESSION_KEY = 'chefkix-demo-cockpit-enabled'

export default function DemoCockpitPage() {
	const [armedAt, setArmedAt] = useState<string>('')

	useEffect(() => {
		window.sessionStorage.setItem(DEMO_COCKPIT_SESSION_KEY, 'true')
		setArmedAt(new Date().toLocaleTimeString())
	}, [])

	return (
		<main className='min-h-screen bg-bg px-4 py-8 text-text-primary sm:px-6'>
			<div className='mx-auto max-w-6xl space-y-8'>
				<header className='flex flex-col gap-4 border-b border-border-subtle pb-6 sm:flex-row sm:items-end sm:justify-between'>
					<div>
						<p className='text-xs font-semibold uppercase text-success'>
							ChefKix live demo cockpit
						</p>
						<h1 className='mt-1 text-3xl font-bold'>
							Armed and waiting for the remote
						</h1>
						<p className='mt-2 text-sm text-text-muted'>
							Command bus online. Presenter control is active.
						</p>
					</div>
					<div className='flex items-center gap-2 text-sm text-text-muted'>
						<span className='size-2 rounded-full bg-success' />
						{armedAt ? `Armed at ${armedAt}` : 'Arming...'}
					</div>
				</header>
				<IoReadinessPanel />
			</div>
		</main>
	)
}
