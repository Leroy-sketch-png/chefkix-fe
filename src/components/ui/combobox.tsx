'use client'

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	forwardRef,
	useImperativeHandle,
	useId,
	KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
import { useTranslations } from 'next-intl'
import { Portal } from '@/components/ui/portal'
import { cn } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'

export interface ComboboxOption {
	value: string
	label: string
	secondary?: string
}

export interface ComboboxProps {
	value: string
	onChange: (value: string) => void
	onSelect?: (option: ComboboxOption) => void
	options: ComboboxOption[]
	placeholder?: string
	disabled?: boolean
	className?: string
	isLoading?: boolean
	emptyMessage?: string
	maxResults?: number
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
	icon?: React.ReactNode
	id?: string
}

export interface ComboboxRef {
	focus: () => void
	clear: () => void
}

export const Combobox = forwardRef<ComboboxRef, ComboboxProps>(
	(
		{
			value,
			onChange,
			onSelect,
			options,
			placeholder,
			disabled = false,
			className,
			isLoading = false,
			emptyMessage,
			maxResults = 8,
			onKeyDown,
			icon,
			id,
		},
		ref,
	) => {
		const t = useTranslations('common')
		const resolvedPlaceholder = placeholder ?? `${t('search')}...`
		const resolvedEmptyMessage = emptyMessage ?? t('noResults')
		const inputRef = useRef<HTMLInputElement>(null)
		const containerRef = useRef<HTMLDivElement>(null)
		const blurTimeoutRef = useRef<NodeJS.Timeout | null>(null)
		const listboxId = useId()
		const [isOpen, setIsOpen] = useState(false)
		const [selectedIndex, setSelectedIndex] = useState(0)
		const [dropdownPosition, setDropdownPosition] = useState({
			top: 0,
			left: 0,
			width: 0,
		})

		// Filter options based on input value
		const filtered = value.trim()
			? options
					.filter(opt => {
						const q = value.toLowerCase()
						return (
							opt.label.toLowerCase().includes(q) ||
							opt.value.toLowerCase().includes(q) ||
							opt.secondary?.toLowerCase().includes(q)
						)
					})
					.slice(0, maxResults)
			: options.slice(0, maxResults)

		useImperativeHandle(ref, () => ({
			focus: () => inputRef.current?.focus(),
			clear: () => onChange(''),
		}))

		// Update dropdown position
		useEffect(() => {
			if (isOpen && containerRef.current) {
				const rect = containerRef.current.getBoundingClientRect()
				const spaceBelow = window.innerHeight - rect.bottom
				const dropdownUp = spaceBelow < 260

				setDropdownPosition({
					top: dropdownUp ? rect.top : rect.bottom + 4,
					left: rect.left,
					width: rect.width,
				})
			}
		}, [isOpen, value])

		// Reset selected index when options change
		useEffect(() => {
			setSelectedIndex(0)
		}, [value])

		// Cleanup blur timeout on unmount
		useEffect(() => {
			return () => {
				if (blurTimeoutRef.current) clearTimeout(blurTimeoutRef.current)
			}
		}, [])

		const selectOption = useCallback(
			(option: ComboboxOption) => {
				onChange(option.label)
				onSelect?.(option)
				setIsOpen(false)
			},
			[onChange, onSelect],
		)

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value)
			if (!isOpen) setIsOpen(true)
		}

		const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
			if (isOpen && filtered.length > 0) {
				if (e.key === 'ArrowDown') {
					e.preventDefault()
					setSelectedIndex(prev => (prev < filtered.length - 1 ? prev + 1 : 0))
					return
				}
				if (e.key === 'ArrowUp') {
					e.preventDefault()
					setSelectedIndex(prev => (prev > 0 ? prev - 1 : filtered.length - 1))
					return
				}
				if (e.key === 'Enter' || e.key === 'Tab') {
					if (filtered[selectedIndex]) {
						e.preventDefault()
						selectOption(filtered[selectedIndex])
						return
					}
				}
				if (e.key === 'Escape') {
					e.preventDefault()
					setIsOpen(false)
					return
				}
			}

			// When dropdown is closed, Enter passes through
			if (e.key === 'Enter' && !isOpen) {
				onKeyDown?.(e)
				return
			}

			onKeyDown?.(e)
		}

		const handleFocus = () => {
			if (options.length > 0) setIsOpen(true)
		}

		const handleBlur = () => {
			// Delay to allow click on option
			blurTimeoutRef.current = setTimeout(() => setIsOpen(false), 150)
		}

		return (
			<div ref={containerRef} className='relative w-full'>
				<div className='relative'>
					{icon && (
						<div className='pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted'>
							{icon}
						</div>
					)}
					<input
						ref={inputRef}
						id={id}
						type='text'
						value={value}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onFocus={handleFocus}
						onBlur={handleBlur}
						placeholder={resolvedPlaceholder}
						disabled={disabled}
						className={cn(
							'w-full rounded-lg border border-border-subtle bg-bg px-3 py-2 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand',
							icon && 'pl-9',
							className,
						)}
						role='combobox'
						aria-expanded={isOpen}
						aria-controls={listboxId}
						aria-autocomplete='list'
						autoComplete='off'
					/>
				</div>

				<AnimatePresence>
					{isOpen && (filtered.length > 0 || isLoading) && (
						<Portal>
							<motion.div
								initial={{ opacity: 0, y: 4 }}
								animate={{ opacity: 1, y: 0 }}
								exit={{ opacity: 0, y: 4 }}
								transition={{ duration: DURATION_S.instant }}
								className='fixed z-dropdown overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-warm'
								style={{
									top: `${dropdownPosition.top}px`,
									left: `${dropdownPosition.left}px`,
									width: `${dropdownPosition.width}px`,
								}}
							>
								{isLoading ? (
									<div className='flex items-center justify-center gap-2 p-3 text-sm text-text-secondary'>
										<Loader2 className='size-4 animate-spin' />
										<span>{t('loading')}</span>
									</div>
								) : filtered.length === 0 ? (
									<div className='p-3 text-center text-sm text-text-muted'>
										{resolvedEmptyMessage}
									</div>
								) : (
									<ul
										className='max-h-56 overflow-y-auto py-1'
										role='listbox'
										id={listboxId}
									>
										{filtered.map((option, index) => (
											<li
												key={option.value}
												role='option'
												aria-selected={index === selectedIndex}
											>
												<button
													type='button'
													onClick={() => selectOption(option)}
													onMouseEnter={() => setSelectedIndex(index)}
													className={cn(
														'flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors',
														index === selectedIndex
															? 'bg-brand/10 text-brand'
															: 'text-text hover:bg-bg-hover',
													)}
												>
													<div className='min-w-0 flex-1'>
														<span className='font-medium'>{option.label}</span>
														{option.secondary && (
															<span className='ml-2 text-xs text-text-muted'>
																{option.secondary}
															</span>
														)}
													</div>
												</button>
											</li>
										))}
									</ul>
								)}
								<div className='border-t border-border-subtle bg-bg-subtle px-3 py-1.5 text-2xs text-text-muted'>
									<kbd className='rounded bg-bg-card px-1 py-0.5 font-mono'>
										↑↓
									</kbd>{' '}
									navigate ·{' '}
									<kbd className='rounded bg-bg-card px-1 py-0.5 font-mono'>
										Enter
									</kbd>{' '}
									select
								</div>
							</motion.div>
						</Portal>
					)}
				</AnimatePresence>
			</div>
		)
	},
)

Combobox.displayName = 'Combobox'
