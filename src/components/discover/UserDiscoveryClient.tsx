'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Profile } from '@/lib/types'
import { UserCard } from './UserCard'
import { EmptyStateGamified } from '@/components/shared'
import { Search, X } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useTranslations } from '@/i18n/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import { staggerContainer } from '@/lib/motion'
import { getProfilesPaginated } from '@/services/profile'
import { autocompleteSearch } from '@/services/search'
import { logDevError } from '@/lib/dev-log'
import {
	AsyncCombobox,
	type AsyncComboboxOption,
} from '@/components/ui/async-combobox'

const PROFILES_PER_PAGE = 20
const SEARCH_DEBOUNCE_MS = 300

function formatCompactNumber(value: number) {
	return new Intl.NumberFormat('en', {
		notation: 'compact',
		maximumFractionDigits: value >= 1000 ? 1 : 0,
	}).format(value)
}

type Props = {
	/** Initial profiles from parent (optional, will fetch if not provided) */
	profiles?: Profile[]
	surfaceMode?: 'standalone' | 'embedded'
}

export const UserDiscoveryClient = ({
	profiles: initialProfiles,
	surfaceMode = 'standalone',
}: Props) => {
	const t = useTranslations('discover')
	const [profiles, setProfiles] = useState<Profile[]>(
		Array.isArray(initialProfiles) ? initialProfiles : [],
	)
	const [searchTerm, setSearchTerm] = useState('')
	const [debouncedSearch, setDebouncedSearch] = useState('')
	const [page, setPage] = useState(0)
	const [hasMore, setHasMore] = useState(true)
	const [isLoading, setIsLoading] = useState(!initialProfiles)
	const [isLoadingMore, setIsLoadingMore] = useState(false)
	const [loadError, setLoadError] = useState(false)
	const [retryKey, setRetryKey] = useState(0)
	const loadMoreRef = useRef<HTMLDivElement>(null)
	const hasAnimated = useRef(false)
	const isEmbedded = surfaceMode === 'embedded'
	const searchShellClass = isEmbedded
		? 'rounded-xl border border-border-subtle bg-bg-card/85 p-2 shadow-card'
		: 'rounded-2xl border border-border-subtle bg-bg-card p-2.5 shadow-card sm:p-3'

	const fetchUserSearchOptions = useCallback(
		async (query: string): Promise<AsyncComboboxOption[]> => {
			const trimmedQuery = query.trim()
			if (!trimmedQuery) return []

			const response = await autocompleteSearch(trimmedQuery, 'users', 6)
			if (!response.success || !response.data) {
				logDevError('[UserDiscoveryClient] autocompleteSearch failed:', response)
				return []
			}

			const hits = response.data?.users?.hits ?? []
			const seenUserIds = new Set<string>()

			return hits
				.map(hit => hit.document)
				.filter(user => {
					if (!user.id || seenUserIds.has(user.id)) return false
					seenUserIds.add(user.id)
					return true
				})
				.map(user => {
					const displayName =
						user.displayName?.trim() ||
						[user.firstName, user.lastName].filter(Boolean).join(' ').trim() ||
						user.username

					return {
						value: user.id,
						label: displayName,
						secondary: `@${user.username}`,
						category:
							user.followerCount > 0
								? `${formatCompactNumber(user.followerCount)} ${t('followers')}`
								: undefined,
						data: {
							searchTerm: user.username || displayName,
						},
					}
				})
		},
		[t],
	)

	const renderSearchField = (disabled = false) => (
		<div className={searchShellClass}>
			<div className='flex items-center gap-2'>
				<AsyncCombobox
					value={searchTerm}
					onChange={setSearchTerm}
					onSelect={option => {
						const nextSearch = String(option.data?.searchTerm ?? option.label)
						setSearchTerm(nextSearch)
						setDebouncedSearch(nextSearch)
					}}
					fetchOptions={fetchUserSearchOptions}
					minChars={1}
					disabled={disabled}
					placeholder={t('searchPlaceholder')}
					emptyMessage={t('noUsersFoundDesc')}
					searchingMessage={t('searchingUsers')}
					errorMessage={t('searchUnavailable')}
					icon={<Search className='size-4' />}
				/>
				{searchTerm && !disabled && (
					<button
						type='button'
						onClick={handleClearSearch}
						className='flex size-9 flex-shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg-elevated hover:text-text-primary'
						aria-label={t('ariaClearSearch')}
					>
						<X className='size-4' />
					</button>
				)}
			</div>
		</div>
	)

	// Debounce search
	useEffect(() => {
		const timeout = setTimeout(() => {
			setDebouncedSearch(searchTerm)
		}, SEARCH_DEBOUNCE_MS)
		return () => clearTimeout(timeout)
	}, [searchTerm])

	// Fetch profiles on initial load or search change
	useEffect(() => {
		let cancelled = false
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

				if (cancelled) return
				if (response.success && response.data) {
					setProfiles(response.data)
					if (response.pagination) {
						setHasMore(!response.pagination.last)
					} else {
						setHasMore(response.data.length >= PROFILES_PER_PAGE)
					}
				} else {
					setLoadError(true)
					if (!isEmbedded) {
						toast.error(t('toastLoadUsersFailed'))
					}
				}
			} catch {
				if (!cancelled) {
					setLoadError(true)
					if (!isEmbedded) {
						toast.error(t('toastLoadUsersFailed'))
					}
				}
			} finally {
				if (!cancelled) setIsLoading(false)
			}
		}

		// Only fetch if we don't have initial profiles OR if search is active
		if (!Array.isArray(initialProfiles) || debouncedSearch) {
			fetchProfiles()
		} else if (Array.isArray(initialProfiles) && !debouncedSearch) {
			// Use initial profiles when no search
			setProfiles(initialProfiles)
			setHasMore(false) // Initial profiles are the complete list
		}
		return () => {
			cancelled = true
		}
	}, [debouncedSearch, initialProfiles, isEmbedded, retryKey, t])

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
					const newProfiles = response.data.filter(
						p => !existingIds.has(p.userId),
					)
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
		setRetryKey(prev => prev + 1)
	}

	// Show error state if initial load failed
	if (loadError && profiles.length === 0) {
		return (
			<div className='space-y-5'>
				{renderSearchField()}
				{isEmbedded ? (
					<div className='rounded-2xl border border-border-subtle bg-bg-card px-4 py-6 text-center shadow-card sm:px-6'>
						<h3 className='text-2xl font-black tracking-tight text-text-primary'>
							{t('errorLoadUsers')}
						</h3>
						<p className='mt-3 text-base text-text-secondary'>
							{t('errorLoadUsersDesc')}
						</p>
						<div className='mt-5 flex flex-wrap items-center justify-center gap-3'>
							<button
								type='button'
								onClick={handleRetry}
								className='inline-flex min-h-12 items-center justify-center rounded-full bg-brand px-6 text-base font-semibold text-white shadow-warm transition-colors hover:bg-brand/90'
							>
								{t('tryAgain')}
							</button>
							<Link
								href='/leaderboard'
								className='inline-flex min-h-11 items-center justify-center rounded-full border border-border-subtle bg-bg-elevated px-5 text-base font-medium text-text-primary transition-colors hover:bg-bg-hover'
							>
								🏆 {t('openLeaderboard')}
							</Link>
						</div>
					</div>
				) : (
					<EmptyStateGamified
						variant='custom'
						title={t('errorLoadUsers')}
						description={t('errorLoadUsersDesc')}
						className='my-2 py-6 md:py-8'
						primaryAction={{
							label: t('tryAgain'),
							onClick: handleRetry,
						}}
						quickActions={[
							{
								label: t('openLeaderboard'),
								href: '/leaderboard',
								emoji: '🏆',
							},
						]}
					/>
				)}
			</div>
		)
	}

	if (isLoading) {
		return (
			<div className='space-y-5'>
				{renderSearchField(true)}
				<div className='grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3'>
					{Array.from({ length: 4 }).map((_, i) => (
						<div
							key={i}
							className='rounded-radius border border-border-subtle bg-bg-card p-3.5 shadow-card sm:p-4'
						>
							<div className='flex items-center gap-2.5'>
								<Skeleton className='size-9 rounded-full' />
								<div className='flex-1 space-y-1.5'>
									<Skeleton className='h-3.5 w-24' />
									<Skeleton className='h-3 w-14' />
								</div>
							</div>
							<div className='space-y-2'>
								<Skeleton className='h-3 w-full' />
								<Skeleton className='h-3 w-5/6' />
							</div>
							<Skeleton className='h-7 w-28 rounded-md' />
						</div>
					))}
				</div>
			</div>
		)
	}

	return (
		<div className='space-y-5'>
			{/* Search Bar */}
			{renderSearchField()}

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
						className='grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-3'
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
						<div className='grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 sm:gap-4 2xl:grid-cols-3'>
							{Array.from({ length: 4 }).map((_, i) => (
								<div
									key={i}
									className='rounded-radius border border-border-subtle bg-bg-card p-3.5 shadow-card sm:p-4'
								>
									<div className='flex items-center gap-2.5'>
										<Skeleton className='size-9 rounded-full' />
										<div className='flex-1 space-y-1.5'>
											<Skeleton className='h-3.5 w-24' />
											<Skeleton className='h-3 w-14' />
										</div>
									</div>
									<div className='space-y-2'>
										<Skeleton className='h-3 w-full' />
										<Skeleton className='h-3 w-5/6' />
									</div>
									<Skeleton className='h-7 w-28 rounded-md' />
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
