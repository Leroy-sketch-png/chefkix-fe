'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import {
	initEventTracker,
	destroyEventTracker,
	trackPageView,
} from '@/lib/eventTracker'
import { useAuthStore } from '@/store/authStore'

export function useEventTracker() {
	const pathname = usePathname()
	const isAuthenticated = useAuthStore(s => s.isAuthenticated)

	useEffect(() => {
		if (!isAuthenticated) return

		initEventTracker()
		return () => destroyEventTracker()
	}, [isAuthenticated])

	useEffect(() => {
		if (!isAuthenticated || !pathname) return
		trackPageView(pathname)
	}, [pathname, isAuthenticated])
}
