'use client'

import {
	useState,
	useRef,
	useEffect,
	useCallback,
	forwardRef,
	useImperativeHandle,
	useId,
	type KeyboardEvent,
} from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { DURATION_S } from '@/lib/motion'
import { Portal } from '@/components/ui/portal'
import { cn } from '@/lib/utils'
import { Search, Loader2 } from 'lucide-react'

export interface AsyncComboboxOption {
	value: string
	label: string
	secondary?: string
	category?: string
	data?: Record<string, unknown>
}

export interface AsyncComboboxProps {
	/** Fetch function called on input change (debounced) */
	fetchOptions: (query: string) => Promise<AsyncComboboxOption[]>
	/** Called when user selects an option */
	onSelect: (option: AsyncComboboxOption) => void
	/** Current input value (controlled) */
	value: string
	/** Called on input change */
	onChange: (value: string) => void
	placeholder?: string
	disabled?: boolean
	className?: string
	emptyMessage?: string
	/** Message shown while searching */
	searchingMessage?: string
	/** Message shown when search fails */
	errorMessage?: string
	maxResults?: number
	/** Debounce delay in ms */
	debounceMs?: number
	/** Minimum chars before fetching */
	minChars?: number
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
	icon?: React.ReactNode
	id?: string
}

export interface AsyncComboboxRef {
	focus: () => void
	clear: () => void
}

export const AsyncCombobox = forwardRef<AsyncComboboxRef, AsyncComboboxProps>(
	(
		{
			fetchOptions,
			onSelect,
			value,
			onChange,
			placeholder = 'Search...',
			disabled = false,
			className,
			emptyMessage = 'No results found',
			searchingMessage = 'Searching...',
			errorMessage = 'Search temporarily unavailable. Try typing again.',
			maxResults = 8,
			debounceMs = 300,
			minChars = 2,
			onKeyDown,
			icon,
			id,
		},
		ref,
	) => {
		const inputRef = useRef<HTMLInputElement>(null)
		const containerRef = useRef<HTMLDivElement>(null)
		const listboxId = useId()
		const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

		const [isOpen, setIsOpen] = useState(false)
		const [isLoading, setIsLoading] = useState(false)
		const [options, setOptions] = useState<AsyncComboboxOption[]>([])
		const [selectedIndex, setSelectedIndex] = useState(0)
		const [hasError, setHasError] = useState(false)
		const [dropdownPosition, setDropdownPosition] = useState({
			top: 0,
			left: 0,
			width: 0,
		})

		const displayed = options.slice(0, maxResults)

		useImperativeHandle(ref, () => ({
			focus: () => inputRef.current?.focus(),
			clear: () => {
				onChange('')
				setOptions([])
			},
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

		// Debounced fetch
		useEffect(() => {
			if (debounceRef.current) clearTimeout(debounceRef.current)

			if (value.trim().length < minChars) {
				setOptions([])
				setIsLoading(false)
				return
			}

			setIsLoading(true)
			debounceRef.current = setTimeout(async () => {
				try {
					const results = await fetchOptions(value.trim())
					setOptions(results)
					setSelectedIndex(0)
					setHasError(false)
				} catch {
					setOptions([])
					setHasError(true)
				} finally {
					setIsLoading(false)
				}
			}, debounceMs)

			return () => {
				if (debounceRef.current) clearTimeout(debounceRef.current)
			}
		}, [value, fetchOptions, debounceMs, minChars])

		const selectOption = useCallback(
			(option: AsyncComboboxOption) => {
				onChange(option.label)
				onSelect(option)
				setIsOpen(false)
			},
			[onChange, onSelect],
		)

		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			onChange(e.target.value)
			if (!isOpen) setIsOpen(true)
		}

		const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
			if (isOpen && displayed.length > 0) {
				if (e.key === 'ArrowDown') {
					e.preventDefault()
					setSelectedIndex(prev => (prev < displayed.length - 1 ? prev + 1 : 0))
					return
				}
				if (e.key === 'ArrowUp') {
					e.preventDefault()
					setSelectedIndex(prev => (prev > 0 ? prev - 1 : displayed.length - 1))
					return
				}
				if (e.key === 'Enter' || e.key === 'Tab') {
					if (displayed[selectedIndex]) {
						e.preventDefault()
						selectOption(displayed[selectedIndex])
						return
					}
				}
				if (e.key === 'Escape') {
					e.preventDefault()
					setIsOpen(false)
					return
				}
			}

			if (e.key === 'Enter' && !isOpen) {
				onKeyDown?.(e)
				return
			}

			onKeyDown?.(e)
		}

		const handleFocus = () => {
			if (value.trim().length >= minChars) setIsOpen(true)
		}

		const handleBlur = () => {
			setTimeout(() => setIsOpen(false), 150)
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
						placeholder={placeholder}
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
					{isLoading && (
						<div className='pointer-events-none absolute right-3 top-1/2 -translate-y-1/2'>
							<Loader2 className='size-4 animate-spin text-text-muted' />
						</div>
					)}
				</div>

				<AnimatePresence>
					{isOpen &&
						(displayed.length > 0 ||
							isLoading ||
							hasError ||
							value.trim().length >= minChars) && (
							<Portal>
								<motion.div
									initial={{ opacity: 0, y: 4 }}
									animate={{ opacity: 1, y: 0 }}
									exit={{ opacity: 0, y: 4 }}
									transition={{ duration: DURATION_S.fast }}
									className='fixed z-dropdown overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-warm'
									style={{
										top: `${dropdownPosition.top}px`,
										left: `${dropdownPosition.left}px`,
										width: `${dropdownPosition.width}px`,
									}}
								>
									{isLoading && displayed.length === 0 ? (
										<div className='flex items-center justify-center gap-2 p-3 text-sm text-text-secondary'>
											<Loader2 className='size-4 animate-spin' />
											<span>{searchingMessage}</span>
										</div>
									) : hasError ? (
										<div className='p-3 text-center text-sm text-text-muted'>
											{errorMessage}
										</div>
									) : displayed.length === 0 &&
									  value.trim().length >= minChars ? (
										<div className='p-3 text-center text-sm text-text-muted'>
											{emptyMessage}
										</div>
									) : (
										<ul
											className='max-h-56 overflow-y-auto py-1'
											role='listbox'
											id={listboxId}
										>
											{displayed.map((option, index) => (
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
															<span className='font-medium'>
																{option.label}
															</span>
															{option.secondary && (
																<span className='ml-2 text-xs text-text-muted'>
																	{option.secondary}
																</span>
															)}
														</div>
														{option.category && (
															<span className='flex-shrink-0 rounded-full bg-bg-subtle px-2 py-0.5 text-2xs text-text-muted'>
																{option.category}
															</span>
														)}
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

AsyncCombobox.displayName = 'AsyncCombobox'
