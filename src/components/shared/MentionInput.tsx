'use client'

import {
	useState,
	useRef,
	useCallback,
	useEffect,
	forwardRef,
	useImperativeHandle,
	KeyboardEvent,
} from 'react'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { getFollowing } from '@/services/social'
import { Profile, getProfileDisplayName } from '@/lib/types'
import { Loader2, AtSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'

export interface MentionInputProps {
	value: string
	onChange: (value: string) => void
	onTaggedUsersChange: (userIds: string[]) => void
	placeholder?: string
	disabled?: boolean
	className?: string
	onKeyDown?: (e: KeyboardEvent<HTMLInputElement>) => void
	onSubmit?: () => void
}

export interface MentionInputRef {
	focus: () => void
	clear: () => void
}

interface MentionSuggestion {
	userId: string
	displayName: string
	avatarUrl?: string
	username?: string
}

/**
 * MentionInput — @mention autocomplete input for tagging users.
 *
 * Features:
 * - Type @ to trigger autocomplete dropdown
 * - Shows users you follow as suggestions
 * - Tracks tagged user IDs for API submission
 * - Enter to submit, Escape to close dropdown
 */
export const MentionInput = forwardRef<MentionInputRef, MentionInputProps>(
	(
		{
			value,
			onChange,
			onTaggedUsersChange,
			placeholder = 'Write a reply...',
			disabled = false,
			className,
			onKeyDown,
			onSubmit,
		},
		ref,
	) => {
		const inputRef = useRef<HTMLInputElement>(null)
		const [showSuggestions, setShowSuggestions] = useState(false)
		const [suggestions, setSuggestions] = useState<MentionSuggestion[]>([])
		const [filteredSuggestions, setFilteredSuggestions] = useState<
			MentionSuggestion[]
		>([])
		const [isLoading, setIsLoading] = useState(false)
		const [selectedIndex, setSelectedIndex] = useState(0)
		const [mentionQuery, setMentionQuery] = useState('')
		const [mentionStartIndex, setMentionStartIndex] = useState(-1)
		const [taggedUserIds, setTaggedUserIds] = useState<Set<string>>(new Set())

		// Expose methods to parent
		useImperativeHandle(ref, () => ({
			focus: () => inputRef.current?.focus(),
			clear: () => {
				onChange('')
				setTaggedUserIds(new Set())
				onTaggedUsersChange([])
			},
		}))

		// Load following list for mentions
		const loadSuggestions = useCallback(async () => {
			if (suggestions.length > 0) return // Already loaded
			setIsLoading(true)
			try {
				const response = await getFollowing()
				if (response.success && response.data) {
					setSuggestions(
						response.data.map((profile: Profile) => {
							const displayName = getProfileDisplayName(profile)
							return {
								userId: profile.userId,
								displayName,
								avatarUrl: profile.avatarUrl,
								username: displayName.toLowerCase().replace(/\s+/g, ''),
							}
						}),
					)
				}
			} catch {
				// Silent fail — suggestions just won't work
			} finally {
				setIsLoading(false)
			}
		}, [suggestions.length])

		// Filter suggestions based on query
		useEffect(() => {
			if (!mentionQuery) {
				setFilteredSuggestions(suggestions.slice(0, 5))
			} else {
				const query = mentionQuery.toLowerCase()
				const filtered = suggestions
					.filter(
						s =>
							s.displayName?.toLowerCase().includes(query) ||
							s.username?.includes(query),
					)
					.slice(0, 5)
				setFilteredSuggestions(filtered)
			}
			setSelectedIndex(0)
		}, [mentionQuery, suggestions])

		// Handle input change — detect @ mentions
		const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
			const newValue = e.target.value
			const cursorPos = e.target.selectionStart ?? newValue.length
			onChange(newValue)

			// Find if we're in a mention context
			const textBeforeCursor = newValue.slice(0, cursorPos)
			const lastAtIndex = textBeforeCursor.lastIndexOf('@')

			if (lastAtIndex !== -1) {
				const textAfterAt = textBeforeCursor.slice(lastAtIndex + 1)
				// Check if there's a space before @ (or @ is at start)
				const charBeforeAt = lastAtIndex > 0 ? newValue[lastAtIndex - 1] : ' '

				if (
					(charBeforeAt === ' ' || lastAtIndex === 0) &&
					!/\s/.test(textAfterAt)
				) {
					// We're in a mention context
					setMentionStartIndex(lastAtIndex)
					setMentionQuery(textAfterAt)
					setShowSuggestions(true)
					loadSuggestions()
					return
				}
			}

			// Not in mention context
			setShowSuggestions(false)
			setMentionQuery('')
			setMentionStartIndex(-1)
		}

		// Select a user from suggestions
		const selectUser = (user: MentionSuggestion) => {
			if (mentionStartIndex === -1) return

			// Replace @query with @displayName
			const beforeMention = value.slice(0, mentionStartIndex)
			const afterMention = value.slice(
				mentionStartIndex + mentionQuery.length + 1,
			)
			const newValue = `${beforeMention}@${user.displayName} ${afterMention}`

			onChange(newValue)

			// Track tagged user
			const newTaggedIds = new Set(taggedUserIds)
			newTaggedIds.add(user.userId)
			setTaggedUserIds(newTaggedIds)
			onTaggedUsersChange(Array.from(newTaggedIds))

			// Close suggestions
			setShowSuggestions(false)
			setMentionQuery('')
			setMentionStartIndex(-1)

			// Focus input and move cursor after inserted mention
			setTimeout(() => {
				inputRef.current?.focus()
				const newCursorPos = beforeMention.length + user.displayName.length + 2
				inputRef.current?.setSelectionRange(newCursorPos, newCursorPos)
			}, 0)
		}

		// Handle keyboard navigation
		const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
			if (showSuggestions && filteredSuggestions.length > 0) {
				if (e.key === 'ArrowDown') {
					e.preventDefault()
					setSelectedIndex(prev =>
						prev < filteredSuggestions.length - 1 ? prev + 1 : 0,
					)
					return
				}
				if (e.key === 'ArrowUp') {
					e.preventDefault()
					setSelectedIndex(prev =>
						prev > 0 ? prev - 1 : filteredSuggestions.length - 1,
					)
					return
				}
				if (e.key === 'Enter' || e.key === 'Tab') {
					e.preventDefault()
					selectUser(filteredSuggestions[selectedIndex])
					return
				}
				if (e.key === 'Escape') {
					e.preventDefault()
					setShowSuggestions(false)
					return
				}
			}

			// Submit on Enter (when not in suggestions)
			if (e.key === 'Enter' && !showSuggestions) {
				e.preventDefault()
				onSubmit?.()
				return
			}

			// Pass through other key events
			onKeyDown?.(e)
		}

		// Close suggestions on blur (with delay for click)
		const handleBlur = () => {
			setTimeout(() => setShowSuggestions(false), 150)
		}

		return (
			<div className='relative flex-1'>
				<div className='relative'>
					<input
						ref={inputRef}
						type='text'
						value={value}
						onChange={handleInputChange}
						onKeyDown={handleKeyDown}
						onBlur={handleBlur}
						placeholder={placeholder}
						disabled={disabled}
						className={cn(
							'w-full rounded-lg bg-bg-input px-3 py-2 pr-8 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/30',
							className,
						)}
					/>
					{/* @ hint icon */}
					<div className='pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2'>
						<AtSign className='size-4 text-text-muted opacity-50' />
					</div>
				</div>

				{/* Suggestions dropdown */}
				<AnimatePresence>
					{showSuggestions && (
						<motion.div
							initial={{ opacity: 0, y: -4 }}
							animate={{ opacity: 1, y: 0 }}
							exit={{ opacity: 0, y: -4 }}
							transition={{ duration: 0.15 }}
							className='absolute bottom-full left-0 z-dropdown mb-1 w-full overflow-hidden rounded-lg border border-border-subtle bg-bg-card shadow-warm'
						>
							{isLoading ? (
								<div className='flex items-center justify-center gap-2 p-3 text-sm text-text-secondary'>
									<Loader2 className='size-4 animate-spin' />
									<span>Loading suggestions...</span>
								</div>
							) : filteredSuggestions.length === 0 ? (
								<div className='p-3 text-center text-sm text-text-muted'>
									No users found
								</div>
							) : (
								<ul className='max-h-48 overflow-y-auto py-1'>
									{filteredSuggestions.map((user, index) => (
										<li key={user.userId}>
											<button
												type='button'
												onClick={() => selectUser(user)}
												onMouseEnter={() => setSelectedIndex(index)}
												className={cn(
													'flex w-full items-center gap-2.5 px-3 py-2 text-left transition-colors',
													index === selectedIndex
														? 'bg-primary/10 text-primary'
														: 'text-text-primary hover:bg-bg-hover',
												)}
											>
												<Avatar size='xs'>
													<AvatarImage
														src={user.avatarUrl || ''}
														alt={user.displayName}
													/>
													<AvatarFallback className='text-2xs'>
														{user.displayName
															?.split(' ')
															.map(n => n[0])
															.join('')
															.toUpperCase()
															.slice(0, 2) || '??'}
													</AvatarFallback>
												</Avatar>
												<div className='min-w-0 flex-1'>
													<span className='text-sm font-medium'>
														{user.displayName}
													</span>
												</div>
											</button>
										</li>
									))}
								</ul>
							)}
							{/* Hint footer */}
							<div className='border-t border-border-subtle bg-bg-subtle px-3 py-1.5 text-2xs text-text-muted'>
								<kbd className='rounded bg-bg-card px-1 py-0.5 font-mono'>
									↑↓
								</kbd>{' '}
								to navigate,{' '}
								<kbd className='rounded bg-bg-card px-1 py-0.5 font-mono'>
									Enter
								</kbd>{' '}
								to select
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</div>
		)
	},
)

MentionInput.displayName = 'MentionInput'
