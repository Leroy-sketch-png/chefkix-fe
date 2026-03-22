'use client'

import { useEventTracker } from '@/hooks/useEventTracker'

export function EventTrackerProvider({
	children,
}: {
	children: React.ReactNode
}) {
	useEventTracker()
	return <>{children}</>
}
