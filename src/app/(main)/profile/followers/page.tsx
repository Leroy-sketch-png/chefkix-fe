'use client'

import { useEffect, useState, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSearchParams, useRouter } from 'next/navigation'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PageHeader } from '@/components/layout/PageHeader'
import { FollowUserCard } from '@/components/profile/FollowUserCard'
import { Skeleton } from '@/components/ui/skeleton'
import { ErrorState } from '@/components/ui/error-state'
import { EmptyStateGamified } from '@/components/shared'
import { getFollowers, getFollowing, getFriends } from '@/services/social'
import { Profile } from '@/lib/types/profile'
import { StaggerContainer } from '@/components/ui/stagger-animation'
import { Users, UserCheck, Heart, ArrowLeft, Loader2 } from 'lucide-react'
import { TRANSITION_SPRING, BUTTON_SUBTLE_TAP } from '@/lib/motion'
import { cn } from '@/lib/utils'

type Tab = 'followers' | 'following' | 'friends'

const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
	{ key: 'followers', label: 'Followers', icon: <Users className='size-4' /> },
	{
		key: 'following',
		label: 'Following',
		icon: <UserCheck className='size-4' />,
	},
	{ key: 'friends', label: 'Friends', icon: <Heart className='size-4' /> },
]

function FollowersSkeleton() {
	return (
		<div className='space-y-3'>
			{Array.from({ length: 6 }).map((_, i) => (
				<div
					key={i}
					className='flex items-center gap-3 rounded-radius border border-border-subtle bg-bg-card p-4'
				>
					<Skeleton className='size-10 rounded-full' />
					<div className='flex-1 space-y-1.5'>
						<Skeleton className='h-4 w-32' />
						<Skeleton className='h-3 w-20' />
					</div>
					<Skeleton className='h-8 w-24 rounded-md' />
				</div>
			))}
		</div>
	)
}

function FollowersContent() {
	const searchParams = useSearchParams()
	const router = useRouter()
	const initialTab = (searchParams.get('tab') as Tab) || 'followers'
	const [activeTab, setActiveTab] = useState<Tab>(initialTab)
	const [data, setData] = useState<Record<Tab, Profile[]>>({
		followers: [],
		following: [],
		friends: [],
	})
	const [loading, setLoading] = useState<Record<Tab, boolean>>({
		followers: true,
		following: true,
		friends: true,
	})
	const [errors, setErrors] = useState<Record<Tab, string | null>>({
		followers: null,
		following: null,
		friends: null,
	})

	const fetchTab = useCallback(async (tab: Tab) => {
		setLoading(prev => ({ ...prev, [tab]: true }))
		setErrors(prev => ({ ...prev, [tab]: null }))

		const fetchers: Record<Tab, () => ReturnType<typeof getFollowers>> = {
			followers: getFollowers,
			following: getFollowing,
			friends: getFriends,
		}

		try {
			const response = await fetchers[tab]()
			if (response.success && response.data) {
				setData(prev => ({ ...prev, [tab]: response.data! }))
			} else {
				setErrors(prev => ({
					...prev,
					[tab]: response.message || `Failed to load ${tab}`,
				}))
			}
		} catch {
			setErrors(prev => ({ ...prev, [tab]: `Failed to load ${tab}` }))
		} finally {
			setLoading(prev => ({ ...prev, [tab]: false }))
		}
	}, [])

	// Fetch active tab on mount and tab change
	useEffect(() => {
		let cancelled = false

		const load = async () => {
			setLoading(prev => ({ ...prev, [activeTab]: true }))
			setErrors(prev => ({ ...prev, [activeTab]: null }))

			const fetchers: Record<Tab, () => ReturnType<typeof getFollowers>> = {
				followers: getFollowers,
				following: getFollowing,
				friends: getFriends,
			}

			try {
				const response = await fetchers[activeTab]()
				if (cancelled) return
				if (response.success && response.data) {
					setData(prev => ({ ...prev, [activeTab]: response.data! }))
				} else {
					setErrors(prev => ({
						...prev,
						[activeTab]: response.message || `Failed to load ${activeTab}`,
					}))
				}
			} catch {
				if (!cancelled) {
					setErrors(prev => ({
						...prev,
						[activeTab]: `Failed to load ${activeTab}`,
					}))
				}
			} finally {
				if (!cancelled) setLoading(prev => ({ ...prev, [activeTab]: false }))
			}
		}

		load()
		return () => {
			cancelled = true
		}
	}, [activeTab])

	const handleFollowChange = (userId: string, isNowFollowing: boolean) => {
		// Update local state when follow status changes
		setData(prev => {
			const updated = { ...prev }
			// If we unfollowed someone, remove from "following" list
			if (!isNowFollowing) {
				updated.following = updated.following.filter(p => p.userId !== userId)
				// Also remove from friends (no longer mutual)
				updated.friends = updated.friends.filter(p => p.userId !== userId)
			}
			return updated
		})
	}

	const currentList = data[activeTab]
	const isLoading = loading[activeTab]
	const error = errors[activeTab]

	return (
		<PageTransition>
			<PageContainer maxWidth='md'>
				{/* Header with PageHeader */}
				<div className='mb-6 flex items-center gap-3'>
					<motion.button
						onClick={() => router.back()}
						whileTap={BUTTON_SUBTLE_TAP}
						className='flex size-10 items-center justify-center rounded-xl border border-border bg-bg-card text-text-secondary transition-colors hover:bg-bg-elevated hover:text-text'
						aria-label='Go back'
					>
						<ArrowLeft className='size-5' />
					</motion.button>
					<div className='flex-1'>
						<PageHeader
							icon={Users}
							title='Your Network'
							subtitle='Followers, following, and friends'
							gradient='purple'
							marginBottom='sm'
							className='mb-0'
						/>
					</div>
				</div>

				{/* Tab Buttons */}
				<div className='mb-6 flex gap-2 rounded-radius border border-border-subtle bg-bg-elevated p-1'>
					{TABS.map(tab => (
						<button
							key={tab.key}
							onClick={() => setActiveTab(tab.key)}
							className={cn(
								'flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
								activeTab === tab.key
									? 'bg-bg-card text-text shadow-card'
									: 'text-text-muted hover:text-text-secondary',
							)}
						>
							{tab.icon}
							{tab.label}
							<span
								className={cn(
									'ml-1 flex min-w-5 items-center justify-center rounded-full px-1.5 py-0.5 text-2xs font-bold',
									activeTab === tab.key
										? 'bg-brand/15 text-brand'
										: 'bg-bg-elevated text-text-muted',
								)}
							>
								{data[tab.key].length}
							</span>
						</button>
					))}
				</div>

				{/* Content */}
				<AnimatePresence mode='wait'>
					<motion.div
						key={activeTab}
						initial={{ opacity: 0, y: 8 }}
						animate={{ opacity: 1, y: 0 }}
						exit={{ opacity: 0, y: -8 }}
						transition={TRANSITION_SPRING}
					>
						{isLoading ? (
							<FollowersSkeleton />
						) : error ? (
							<ErrorState
								title={`Failed to load ${activeTab}`}
								message={error}
								onRetry={() => fetchTab(activeTab)}
							/>
						) : currentList.length === 0 ? (
							<EmptyStateGamified
								title={`No ${activeTab} yet`}
								description={
									activeTab === 'followers'
										? 'Share your culinary creations to attract followers!'
										: activeTab === 'following'
											? 'Find chefs you admire and follow them for inspiration.'
											: 'Mutual follows become friends. Start by following chefs you love!'
								}
								illustration={
									TABS.find(t => t.key === activeTab)?.icon || (
										<Users className='size-6' />
									)
								}
							/>
						) : (
							<StaggerContainer className='space-y-3'>
								{currentList.map(profile => (
									<FollowUserCard
										key={profile.userId}
										profile={profile}
										isMutual={
											activeTab === 'friends' ||
											profile.relationshipStatus === 'FRIENDS'
										}
										onFollowChange={handleFollowChange}
									/>
								))}
							</StaggerContainer>
						)}
					</motion.div>
				</AnimatePresence>
			</PageContainer>
		</PageTransition>
	)
}

export default function FollowersPage() {
	return (
		<Suspense
			fallback={
				<PageContainer maxWidth='lg'>
					<div className='flex min-h-panel-md items-center justify-center'>
						<Loader2 className='size-8 animate-spin text-brand' />
					</div>
				</PageContainer>
			}
		>
			<FollowersContent />
		</Suspense>
	)
}
