'use client'

import { useCallback, useEffect, type ReactNode, useRef } from 'react'
import { cn } from '@/lib/utils'
import {
	getStorageJson,
	removeStorageItem,
	setStorageJson,
} from '@/lib/storage'
import type { TasteProfile } from './TasteDetector'

const COLD_START_STORAGE_KEY = 'chefkix:cold-start-state'
const INTERACTION_THRESHOLD = 5

interface ColdStartState {
	interactionCount: number
	dismissed: boolean
	firstSeenAt: string
}

interface ColdStartExperienceProps {
	children: ReactNode
	isAuthenticated?: boolean
	tasteProfile?: TasteProfile
	onColdStartComplete?: () => void
	className?: string
}

type ColdStartPhase = 'curated' | 'transitioning' | 'personalized'

function getColdStartState(): ColdStartState | null {
	return getStorageJson<ColdStartState>(COLD_START_STORAGE_KEY)
}

function setColdStartState(state: ColdStartState) {
	setStorageJson(COLD_START_STORAGE_KEY, state)
}

function clearColdStartState() {
	removeStorageItem(COLD_START_STORAGE_KEY)
}

function createColdStartState(): ColdStartState {
	return {
		interactionCount: 0,
		dismissed: false,
		firstSeenAt: new Date().toISOString(),
	}
}

function getInitialPhase(): ColdStartPhase {
	if (typeof window === 'undefined') return 'personalized'

	const state = getColdStartState()
	return state?.dismissed ||
		(state?.interactionCount ?? 0) >= INTERACTION_THRESHOLD
		? 'personalized'
		: 'curated'
}

/**
 * Learns from first-feed interactions without placing onboarding UI before the
 * content. Cold-start ranking may change behind the scenes; the feed stays the
 * user's first and only visible job.
 */
export const ColdStartExperience = ({
	children,
	onColdStartComplete,
	className,
}: ColdStartExperienceProps) => {
	const rootRef = useRef<HTMLDivElement>(null)
	const phaseRef = useRef<ColdStartPhase>(getInitialPhase())

	useEffect(() => {
		if (!getColdStartState()) {
			setColdStartState(createColdStartState())
		}
	}, [])

	const recordInteraction = useCallback(() => {
		if (phaseRef.current !== 'curated') return

		const current = getColdStartState() ?? createColdStartState()
		const interactionCount = current.interactionCount + 1
		const isComplete = interactionCount >= INTERACTION_THRESHOLD

		setColdStartState({
			...current,
			interactionCount,
			dismissed: isComplete,
		})

		if (isComplete) {
			phaseRef.current = 'personalized'
			onColdStartComplete?.()
		}
	}, [onColdStartComplete])

	useEffect(() => {
		const root = rootRef.current
		if (!root) return

		root.addEventListener('click', recordInteraction)
		return () => root.removeEventListener('click', recordInteraction)
	}, [recordInteraction])

	return (
		<div ref={rootRef} className={cn('relative', className)}>
			{children}
		</div>
	)
}

export { clearColdStartState }
export type { ColdStartPhase, ColdStartState }
