'use client'

import * as React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'

export interface CommandMenuItem {
	id: string
	label: string
	icon?: React.ReactNode
	shortcut?: string
	action: () => void
}

export interface CommandMenuGroup {
	heading: string
	items: CommandMenuItem[]
}

interface CommandMenuProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	groups: CommandMenuGroup[]
	placeholder?: string
	className?: string
}

export function CommandMenu({
	open,
	onOpenChange,
	groups,
	placeholder,
	className,
}: CommandMenuProps) {
	const tCommon = useTranslations('common')
	const [query, setQuery] = React.useState('')
	const [selectedIndex, setSelectedIndex] = React.useState(0)
	const inputRef = React.useRef<HTMLInputElement>(null)

	const filteredGroups = React.useMemo(() => {
		const normalized = query.toLowerCase().trim()
		return groups
			.map(group => ({
				...group,
				items: group.items.filter(item =>
					item.label.toLowerCase().includes(normalized),
				),
			}))
			.filter(group => group.items.length > 0)
	}, [groups, query])

	const allItems = React.useMemo(
		() => filteredGroups.flatMap(group => group.items),
		[filteredGroups],
	)

	React.useEffect(() => {
		if (!open) return
		setQuery('')
		setSelectedIndex(0)
		const id = setTimeout(() => inputRef.current?.focus(), 50)
		return () => clearTimeout(id)
	}, [open])

	const handleSelect = React.useCallback(
		(item: CommandMenuItem) => {
			item.action()
			onOpenChange(false)
		},
		[onOpenChange],
	)

	const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
		if (event.key === 'ArrowDown') {
			event.preventDefault()
			setSelectedIndex(prev => Math.min(prev + 1, allItems.length - 1))
			return
		}

		if (event.key === 'ArrowUp') {
			event.preventDefault()
			setSelectedIndex(prev => Math.max(prev - 1, 0))
			return
		}

		if (event.key === 'Enter') {
			event.preventDefault()
			const target = allItems[selectedIndex]
			if (target) handleSelect(target)
		}
	}

	return (
		<AnimatePresence>
			{open && (
				<Portal>
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						transition={{ duration: 0.15 }}
						className='fixed inset-0 z-modal bg-bg/70 backdrop-blur-sm'
						onClick={() => onOpenChange(false)}
						aria-hidden
					/>

					<motion.div
						initial={{ opacity: 0, scale: 0.96, y: -10 }}
						animate={{ opacity: 1, scale: 1, y: 0 }}
						exit={{ opacity: 0, scale: 0.96, y: -10 }}
						transition={{ duration: 0.16, ease: [0.2, 0, 0, 1] }}
						className={cn(
							'fixed left-1/2 top-[14%] z-modal w-full max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border border-border-subtle bg-bg shadow-warm',
							className,
						)}
						role='dialog'
						aria-label={tCommon('search')}
					>
						<div className='flex items-center gap-2 border-b border-border-subtle px-4'>
							<Search className='size-4 text-text-muted' />
							<input
								ref={inputRef}
								value={query}
								onChange={event => {
									setQuery(event.target.value)
									setSelectedIndex(0)
								}}
								onKeyDown={handleKeyDown}
								placeholder={placeholder ?? tCommon('commandPlaceholder')}
								className='flex-1 bg-transparent py-3 text-sm text-text-primary outline-none placeholder:text-text-muted'
							/>
							<button
								type='button'
								onClick={() => onOpenChange(false)}
								className='rounded p-1 text-text-muted transition-colors hover:text-text-primary'
								aria-label={tCommon('close')}
							>
								<X className='size-4' />
							</button>
						</div>

						<div className='max-h-80 overflow-y-auto p-2'>
							{filteredGroups.length === 0 && (
								<p className='py-6 text-center text-sm text-text-muted'>
									{tCommon('noResults')}
								</p>
							)}

							{filteredGroups.map(group => (
								<div key={group.heading} className='mb-2'>
									<div className='px-2 py-1.5 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'>
										{group.heading}
									</div>
									{group.items.map(item => {
										const flatIndex = allItems.indexOf(item)
										const active = flatIndex === selectedIndex

										return (
											<button
												type='button'
												key={item.id}
												onClick={() => handleSelect(item)}
												onMouseEnter={() => setSelectedIndex(flatIndex)}
												className={cn(
													'flex w-full items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors',
													active
														? 'bg-bg-hover text-text-primary'
														: 'text-text-secondary hover:bg-bg-elevated',
												)}
											>
												{item.icon && (
													<span className='text-text-muted'>{item.icon}</span>
												)}
												<span className='flex-1 truncate text-left'>
													{item.label}
												</span>
												{item.shortcut && (
													<kbd className='rounded border border-border-subtle bg-bg-elevated px-1.5 py-0.5 text-xs text-text-muted'>
														{item.shortcut}
													</kbd>
												)}
											</button>
										)
									})}
								</div>
							))}
						</div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
