'use client'

import { useUiStore } from '@/store/uiStore'
import { useCookingStore } from '@/store/cookingStore'
import { RightSidebar } from '@/components/layout/RightSidebar'
import { CookingPanel } from '@/components/cooking/CookingPanel'

/**
 * CookingSidebarSwitch
 *
 * Conditionally renders either:
 * - CookingPanel (when actively cooking in docked mode)
 * - RightSidebar (default, when not cooking or in other modes)
 *
 * This enables the "cooking is a mode, not a modal" UX paradigm
 * where users can browse the feed while cooking.
 */
export const CookingSidebarSwitch = () => {
	const { cookingMode } = useUiStore()
	const { session } = useCookingStore()

	// Show CookingPanel when:
	// 1. Cooking mode is 'docked'
	// 2. There's an active session
	const showCookingPanel = cookingMode === 'docked' && session

	if (showCookingPanel) {
		return <CookingPanel />
	}

	return <RightSidebar />
}
