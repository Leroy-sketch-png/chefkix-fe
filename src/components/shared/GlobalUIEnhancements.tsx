'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { ScrollToTop } from '@/components/ui/scroll-to-top'
import { TopLoadingBar } from '@/components/ui/top-loading-bar'
import { OfflineBanner } from '@/components/ui/offline-banner'
import { AuthRequiredModal } from '@/components/auth/AuthRequiredModal'
import { CookieConsent } from '@/components/ui/cookie-consent'
import { useOnlineStatus } from '@/hooks/useOnlineStatus'
import { useUiStore } from '@/store/uiStore'

/**
 * Global UI enhancements — scroll-to-top, route loading bar, offline banner.
 * Place once in root layout.
 */
export function GlobalUIEnhancements() {
	const pathname = usePathname()
	const { isOffline } = useOnlineStatus()
	const [isNavigating, setIsNavigating] = useState(false)
	const [prevPathname, setPrevPathname] = useState(pathname)
	const authGateOpen = useUiStore(s => s.authGateOpen)
	const authGateAction = useUiStore(s => s.authGateAction)
	const closeAuthGate = useUiStore(s => s.closeAuthGate)

	// Detect route changes for loading bar
	useEffect(() => {
		if (pathname !== prevPathname) {
			setIsNavigating(true)
			setPrevPathname(pathname)
			// Route is already loaded when pathname changes in App Router
			const timeout = setTimeout(() => setIsNavigating(false), 150)
			return () => clearTimeout(timeout)
		}
	}, [pathname, prevPathname])

	return (
		<>
			<TopLoadingBar isLoading={isNavigating} />
			<ScrollToTop />
			<OfflineBanner isOffline={isOffline} />
			<AuthRequiredModal
				isOpen={authGateOpen}
				onClose={closeAuthGate}
				action={authGateAction}
			/>
			<CookieConsent />
		</>
	)
}
