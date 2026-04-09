'use client'

import { useTranslations } from 'next-intl'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
} from '@/components/ui/dialog'
import { PATHS } from '@/constants/paths'

const shortcuts = [
	{ keys: ['?'], description: 'ksShowShortcuts', action: 'toggle' },
	{
		keys: ['Ctrl/⌘', 'K'],
		description: 'ksCommandPalette',
		action: 'palette',
	},
	{ keys: ['/'], description: 'ksFocusSearch', action: 'search' },
	{ keys: ['g', 'd'], description: 'ksGoDashboard', path: PATHS.DASHBOARD },
	{ keys: ['g', 'e'], description: 'ksGoExplore', path: PATHS.EXPLORE },
	{ keys: ['g', 'f'], description: 'ksGoDiscover', path: PATHS.DISCOVER },
	{ keys: ['n'], description: 'ksNewPost', action: 'newPost' },
	{ keys: ['Esc'], description: 'ksCloseDialogs', action: 'escape' },
]

export const KeyboardShortcuts = () => {
	const t = useTranslations('shared')
	const [open, setOpen] = useState(false)
	const [sequence, setSequence] = useState<string[]>([])
	const router = useRouter()

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Don't trigger shortcuts when typing in inputs
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return
			}

			// Handle ? to show shortcuts
			if (e.key === '?') {
				e.preventDefault()
				setOpen(prev => !prev)
				return
			}

			// Handle / for search
			if (e.key === '/') {
				e.preventDefault()
				const searchInput = document.querySelector(
					'input[type="search"]',
				) as HTMLInputElement
				if (searchInput) {
					searchInput.focus()
				}
				return
			}

			// Handle Escape
			if (e.key === 'Escape') {
				setOpen(false)
				return
			}

			// Handle 'g' sequence shortcuts
			if (e.key === 'g') {
				setSequence(['g'])
				setTimeout(() => setSequence([]), 1000)
				return
			}

			// Check for sequence completion
			if (sequence.length > 0) {
				const newSequence = [...sequence, e.key]
				const shortcut = shortcuts.find(
					s => s.keys.join('') === newSequence.join(''),
				)

				if (shortcut?.path) {
					e.preventDefault()
					router.push(shortcut.path)
					setSequence([])
				} else {
					setSequence([])
				}
			}

			// Handle single-key shortcuts
			if (e.key === 'n') {
				e.preventDefault()
				router.push('/post/new')
			}
		}

		window.addEventListener('keydown', handleKeyDown)
		return () => window.removeEventListener('keydown', handleKeyDown)
	}, [sequence, router])

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='max-w-2xl'>
				<DialogHeader>
					<DialogTitle>{t('ksTitle')}</DialogTitle>
					<DialogDescription>{t('ksDescription')}</DialogDescription>
				</DialogHeader>
				<div className='grid gap-4'>
					{shortcuts.map((shortcut, index) => (
						<div
							key={index}
							className='flex items-center justify-between rounded-lg border border-border-subtle bg-bg-subtle p-3'
						>
							<span className='text-sm text-text-primary'>
								{t(shortcut.description)}
							</span>
							<div className='flex gap-2'>
								{shortcut.keys.map((key, i) => (
									<kbd
										key={i}
										className='rounded-md border border-border-subtle bg-bg-card px-3 py-1.5 text-xs font-semibold text-text-primary'
									>
										{key}
									</kbd>
								))}
							</div>
						</div>
					))}
				</div>
				<div className='mt-4 text-center text-xs text-text-secondary'>
					{t.rich('ksToggleHint', {
						key: chunks => (
							<kbd className='rounded bg-bg-subtle px-2 py-1'>{chunks}</kbd>
						),
					})}
				</div>
			</DialogContent>
		</Dialog>
	)
}
