'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { Profile } from '@/lib/types'
import { UserCard } from './UserCard'
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from '@/components/ui/input-group'
import { EmptyStateGamified } from '@/components/shared'
import { Search, X, AlertCircle } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { TRANSITION_SPRING, staggerContainer } from '@/lib/motion'
import { getProfilesPaginated } from '@/services/profile'

const PROFILES_PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 300

type Props = {
	/** Initial profiles from parent (optional, will fetch if not provided) */
	profiles?: Profile[]
}

export const UserDiscoveryClient = ({ profiles: initialProfiles }: Props) => {
	const t = useTranslations('discover')
	const [profiles, setProfiles] = useState<Profile[]>(initialProfiles ?? [])
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [page, setPage] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [isLoading, setIsLoading] = useState(!initialProfiles)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadError, setLoadError] = useState(false)
	const loadMoreRef = useRef<HTMLDivElement>(null)
	const hasAnimated = useRef(false)

	// Debounce search
	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchTerm)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(timeout)
	}, [searchTerm])

	// Fetch profiles on initial load or search change
	useEffect(() => {
		const fetchProfiles = async () => {
			setIsLoading(true)
			setLoadError(false)
			setPage(0)

			try {
				const response = await getProfilesPaginated({
					page: 0,
					size: PROFILES_PER_PAGE,
					search: debouncedSearch || undefined,
				})

				if (response.success && response.data) {
					setProfiles(response.data)
					if (response.pagination) {
						setHasMore(!response.pagination.last)
					} else {
						setHasMore(response.data.length >= PROFILES_PER_PAGE)
					}
				} else {
					setLoadError(true)
					toast.error(t('toastLoadUsersFailed'))
				}
			} catch {
				setLoadError(true)
				toast.error(t('toastLoadUsersFailed'))
			} finally {
				setIsLoading(false)
			}
		}

		// Only fetch if we don't have initial profiles OR if search is active
		if (!initialProfiles || debouncedSearch) {
			fetchProfiles()
		} else if (initialProfiles && !debouncedSearch) {
			// Use initial profiles when no search
			setProfiles(initialProfiles)
			setHasMore(false) // Initial profiles are the complete list
		}
	}, [debouncedSearch, initialProfiles, t])

	// Load more callback
	const handleLoadMore = useCallback(async () => {
		if (isLoadingMore || !hasMore) return

		setIsLoadingMore(true)
		const nextPage = page + 1

		try {
			const response = await getProfilesPaginated({
				page: nextPage,
				size: PROFILES_PER_PAGE,
				search: debouncedSearch || undefined,
			})

			if (response.success && response.data) {
				setProfiles(prev => {
					const existingIds = new Set(prev.map(p => p.userId))
					const newProfiles = response.data.filter(p => !existingIds.has(p.userId))
					return [...prev, ...newProfiles]
				})
				setPage(nextPage)
				if (response.pagination) {
					setHasMore(!response.pagination.last)
				} else {
					setHasMore(response.data.length >= PROFILES_PER_PAGE)
				}
			} else {
				toast.error(t('toastLoadMoreUsersFailed'))
			}
		} catch {
			toast.error(t('toastLoadMoreUsersFailed'))
		} finally {
			setIsLoadingMore(false)
		}
	}, [isLoadingMore, hasMore, page, debouncedSearch, t])

	// Infinite scroll observer
	useEffect(() => {
		if (!loadMoreRef.current || isLoading) return

		const observer = new IntersectionObserver(
			entries => {
				if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
					handleLoadMore()
				}
			},
			{ threshold: 0.1, rootMargin: '100px' },
		)

		observer.observe(loadMoreRef.current)
		return () => observer.disconnect()
	}, [hasMore, isLoadingMore, isLoading, handleLoadMore])

	// Mark as animated after first render
	useEffect(() => {
		hasAnimated.current = true
	}, [])

	const handleClearSearch = () => {
		setSearchTerm('')
		setDebouncedSearch('')
	}

	const handleRetry = () => {
		setLoadError(false)
		setDebouncedSearch(prev => prev) // Trigger re-fetch
	}

	// Show error state if initial load failed
	if (loadError && profiles.length === 0) {
		return (
			<div className='space-y-6'>
				<div className='max-w-md'>
					<InputGroup>
						<InputGroupAddon align='inline-start'>
							<Search className='size-4 text-text-muted' />
						</InputGroupAddon>
						<InputGroupInput
							placeholder={t('searchPlaceholder')}
							value={searchTerm}
							onChange={e => setSearchTerm(e.target.value)}
						/>
					</InputGroup>
				</div>
				<EmptyStateGamified
					variant='custom'
					emoji='⚠️'
					title={t('errorLoadUsers')}
					description={t('errorLoadUsersDesc')}
					primaryAction={{
						label: t('tryAgain'),
						onClick: handleRetry,
					}}
				/>
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className='space-y-6'>
				<div className='max-w-md'>
					<InputGroup>
						<InputGroupAddon align='inline-start'>
							<Search className='size-4 text-text-muted' />
						</InputGroupAddon>
						<InputGroupInput
							placeholder={t('searchPlaceholder')}
							value=''
							disabled
							readOnly
						/>
					</InputGroup>
				</div>
				<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'>
					{Array.from({ length: 8 }).map((_, i) => (
						<div key={i} className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card space-y-3'>
							<div className='flex items-center gap-3'>
								<Skeleton className='size-10 rounded-full' />
								<div className='flex-1 space-y-1.5'>
									<Skeleton className='h-4 w-24' />
									<Skeleton className='h-3 w-16' />
								</div>
							</div>
							<Skeleton className='h-3 w-full' />
							<Skeleton className='h-8 w-full rounded-md' />
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-6'>
			{/* Search Bar */}
			<div className='max-w-md'>
				<InputGroup>
					<InputGroupAddon align='inline-start'>
						<Search className='size-4 text-text-muted' />
					</InputGroupAddon>
					<InputGroupInput
						placeholder={t('searchPlaceholder')}
						value={searchTerm}
						onChange={e => setSearchTerm(e.target.value)}
					/>
					{searchTerm && (
						<InputGroupAddon align='inline-end'>
							<button
								type='button'
								onClick={handleClearSearch}
								className='rounded-full p-1 text-text-muted transition-colors hover:bg-bg-elevated hover:text-text'
								aria-label={t('ariaClearSearch')}
							>
								<X className='size-4' />
							</button>
						</InputGroupAddon>
					)}
				</InputGroup>
			</div>

			{/* Results */}
			{profiles.length === 0 ? (
				searchTerm ? (
					<EmptyStateGamified
						variant='search'
						title={t('noUsersFound')}
						description={t('noUsersFoundDesc', { term: searchTerm })}
						primaryAction={{
							label: t('clearSearch'),
							onClick: handleClearSearch,
						}}
					/>
				) : (
					<EmptyStateGamified
						variant='feed'
						title={t('noUsersYet')}
						description={t('noUsersYetDesc')}
					/>
				)
			) : (
				<>
					<motion.div
						className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
						initial={hasAnimated.current ? false : 'hidden'}
						animate='visible'
						variants={staggerContainer}
					>
						<AnimatePresence mode='popLayout'>
							{profiles.map(profile => (
								<UserCard key={profile.userId} profile={profile} />
							))}
						</AnimatePresence>
					</motion.div>

					{/* Infinite scroll sentinel */}
					<div ref={loadMoreRef} className='h-px' />

					{/* Loading indicator */}
					{isLoadingMore && (
						<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 py-6'>
							{Array.from({ length: 4 }).map((_, i) => (
								<div key={i} className='rounded-radius border border-border-subtle bg-bg-card p-4 shadow-card space-y-3'>
									<div className='flex items-center gap-3'>
										<Skeleton className='size-10 rounded-full' />
										<div className='flex-1 space-y-1.5'>
											<Skeleton className='h-4 w-24' />
											<Skeleton className='h-3 w-16' />
										</div>
									</div>
									<Skeleton className='h-3 w-full' />
									<Skeleton className='h-8 w-full rounded-md' />
								</div>
							))}
						</div>
					)}

					{/* End indicator */}
					{!hasMore && profiles.length > PROFILES_PER_PAGE && (
						<div className='flex justify-center py-6'>
							<span className='text-sm text-text-muted'>
								✨ You&apos;ve discovered all {profiles.length} chefs
							</span>
						</div>
					)}
				</>
			)}
		</div>
	)
}
