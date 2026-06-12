'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { PhantomConductor } from './PhantomConductor'
import { PaceTimer } from './PaceTimer'

const DEMO_COCKPIT_SESSION_KEY = 'chefkix-demo-cockpit-enabled'

export function isDemoCockpitSession(): boolean {
	if (typeof window === 'undefined') return false
	return window.sessionStorage.getItem(DEMO_COCKPIT_SESSION_KEY) === 'true'
}

export function DemoCockpitRuntime() {
	const pathname = usePathname()
	const [enabled, setEnabled] = useState(false)

	useEffect(() => {
		if (typeof window === 'undefined') return

		if (pathname === '/demo-cockpit') {
			window.sessionStorage.setItem(DEMO_COCKPIT_SESSION_KEY, 'true')
			setEnabled(true)
			return
		}

		setEnabled(isDemoCockpitSession())
	}, [pathname])

	if (!enabled) return null

	return (
		<>
			<PhantomConductor />
			<PaceTimer />
		</>
	)
}
