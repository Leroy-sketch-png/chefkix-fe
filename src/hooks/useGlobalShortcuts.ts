'use client'

import { useRouter } from 'next/navigation'
import { PATHS } from '@/constants'
import { useKeyboardShortcuts } from './useKeyboardShortcuts'

export function useGlobalShortcuts() {
	const router = useRouter()

	useKeyboardShortcuts([
		{ key: 'n', ctrl: true, action: () => router.push(PATHS.CREATE_POST) },
		{ key: '/', action: () => router.push(PATHS.EXPLORE) },
	])
}
