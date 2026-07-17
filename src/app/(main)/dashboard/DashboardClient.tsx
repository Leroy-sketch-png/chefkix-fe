'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { AlertCircle, ArrowRight, ChefHat, Clock, RefreshCw } from 'lucide-react'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageTransition } from '@/components/layout/PageTransition'
import { PremiumSurface } from '@/components/layout/PremiumSurface'
import { BlurFade } from '@/components/ui/blur-fade'
import { Button } from '@/components/ui/button'
import { MeshGradient } from '@/components/ui/mesh-gradient'
import { ResumeCookingBanner } from '@/components/cooking'
import { TonightsPick } from '@/components/dashboard'
import { getFeedPosts } from '@/services/post'
import type { Post } from '@/lib/types'
import { cn } from '@/lib/utils'
import { logDevError } from '@/lib/dev-log'
import { useTranslations } from '@/i18n/hooks'

const RECENT_ACTIVITY_LIMIT = 5
const RECENT_ACTIVITY_TIMEOUT_MS = 8000

type RecentActivityState = {
	posts: Post[]
	isLoading: boolean
	error: string | null
}

const getActivityHref = (post: Post) =>
	post.recipeId ? `/recipes/${post.recipeId}` : `/post/${post.id}`

const getActivityTitle = (post: Post, fallbackTitle: string) =>
	post.recipeTitle || post.content?.trim() || fallbackTitle

const getActivityImage = (post: Post) =>
	post.photoUrls?.[0] || post.photoUrl || '/placeholder-recipe.svg'

const getActivityMeta = (
	post: Post,
	t: ReturnType<typeof useTranslations>,
) => {
	const createdAt = new Date(post.createdAt)
	if (Number.isNaN(createdAt.getTime())) return ''

	const minutesAgo = Math.max(
		0,
		Math.floor((Date.now() - createdAt.getTime()) / 60000),
	)
	if (minutesAgo < 1) return t('recentActivityJustNow')
	if (minutesAgo < 60) return t('recentActivityMinutesAgo', { count: minutesAgo })

	const hoursAgo = Math.floor(minutesAgo / 60)
	if (hoursAgo < 24) return t('recentActivityHoursAgo', { count: hoursAgo })

	const daysAgo = Math.floor(hoursAgo / 24)
	return t('recentActivityDaysAgo', { count: daysAgo })
}

function RecentActivityList() {
	const t = useTranslations('dashboard')
	const fallbackActivityTitle = t('recentActivityFallbackTitle')
	const [state, setState] = useState<RecentActivityState>({
		posts: [],
		isLoading: true,
		error: null,
	})

	const loadActivity = async () => {
		setState(prev => ({ ...prev, isLoading: true, error: null }))

		try {
			const response = await getFeedPosts(
				{
					page: 0,
					size: RECENT_ACTIVITY_LIMIT,
					mode: 'latest',
				},
				{ timeoutMs: RECENT_ACTIVITY_TIMEOUT_MS },
			)

			if (!response.success) {
				logDevError('[Dashboard] recent activity returned failure:', response)
				setState({
					posts: [],
					isLoading: false,
					error: t('recentActivityError'),
				})
				return
			}

			setState({
				posts: (response.data ?? []).slice(0, RECENT_ACTIVITY_LIMIT),
				isLoading: false,
				error: null,
			})
		} catch (error) {
			logDevError('[Dashboard] recent activity failed:', error)
			setState({
				posts: [],
				isLoading: false,
				error: t('recentActivityError'),
			})
		}
	}

	useEffect(() => {
		void loadActivity()
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	return (
		<PremiumSurface
			className='p-4 sm:p-5'
			eyebrow={t('recentActivityEyebrow')}
			chipText={t('recentActivityChip')}
		>
			<div className='mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between'>
				<div>
					<h2 className='text-lg font-bold text-text-primary'>
						{t('recentActivityTitle')}
					</h2>
					<p className='mt-1 max-w-2xl text-sm text-text-secondary'>
						{t('recentActivityDesc')}
					</p>
				</div>
				<Link
					href='/feed'
					className='inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80'
				>
					{t('recentActivityViewAll')}
					<ArrowRight className='size-4' />
				</Link>
			</div>

			{state.isLoading && (
				<div className='grid gap-3' aria-live='polite' aria-busy='true'>
					{Array.from({ length: 3 }).map((_, index) => (
						<div
							key={index}
							className='flex items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3'
						>
							<div className='size-14 animate-pulse rounded-lg bg-bg-hover' />
							<div className='flex-1 space-y-2'>
								<div className='h-4 w-2/3 animate-pulse rounded bg-bg-hover' />
								<div className='h-3 w-1/3 animate-pulse rounded bg-bg-hover' />
							</div>
						</div>
					))}
				</div>
			)}

			{!state.isLoading && state.error && (
				<div
					role='alert'
					className='flex flex-col gap-3 rounded-xl border border-destructive/20 bg-destructive/5 p-4 sm:flex-row sm:items-center sm:justify-between'
				>
					<div className='flex items-start gap-3'>
						<AlertCircle className='mt-0.5 size-4 shrink-0 text-destructive' />
						<div>
							<p className='text-sm font-semibold text-text-primary'>
								{state.error}
							</p>
							<p className='mt-1 text-sm text-text-secondary'>
								{t('recentActivityErrorDesc')}
							</p>
						</div>
					</div>
					<Button type='button' variant='outline' size='sm' onClick={loadActivity}>
						<RefreshCw className='size-4' />
						{t('tpRetry')}
					</Button>
				</div>
			)}

			{!state.isLoading && !state.error && state.posts.length === 0 && (
				<div className='rounded-xl border border-border-subtle bg-bg-elevated p-5'>
					<div className='flex items-start gap-3'>
						<div className='grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand'>
							<ChefHat className='size-5' />
						</div>
						<div>
							<h3 className='text-sm font-semibold text-text-primary'>
								{t('recentActivityEmptyTitle')}
							</h3>
							<p className='mt-1 text-sm text-text-secondary'>
								{t('recentActivityEmptyDesc')}
							</p>
							<Link
								href='/explore'
								className='mt-3 inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand/80'
							>
								{t('exploreTrending')}
								<ArrowRight className='size-4' />
							</Link>
						</div>
					</div>
				</div>
			)}

			{!state.isLoading && !state.error && state.posts.length > 0 && (
				<div className='grid gap-3'>
					{state.posts.map(post => (
						<Link
							key={post.id}
							href={getActivityHref(post)}
							className='group flex min-w-0 items-center gap-3 rounded-xl border border-border-subtle bg-bg-elevated p-3 transition-colors hover:border-brand/30 hover:bg-brand/5'
						>
							<div className='relative size-14 shrink-0 overflow-hidden rounded-lg bg-bg-hover'>
								<Image
									src={getActivityImage(post)}
									alt=''
									fill
									sizes='56px'
									className='object-cover'
								/>
							</div>
							<div className='min-w-0 flex-1'>
								<p className='truncate text-sm font-semibold text-text-primary'>
									{getActivityTitle(post, fallbackActivityTitle)}
								</p>
								<div className='mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-muted'>
									<span>{post.displayName}</span>
									<span className='inline-flex items-center gap-1 tabular-nums'>
										<Clock className='size-3' />
										{getActivityMeta(post, t)}
									</span>
								</div>
							</div>
							<ArrowRight className='size-4 shrink-0 text-text-muted transition-colors group-hover:text-brand' />
						</Link>
					))}
				</div>
			)}
		</PremiumSurface>
	)
}

export default function DashboardPage() {
	return (
		<PageTransition>
			<MeshGradient className='min-h-full'>
				<PageContainer maxWidth='lg'>
					<div
						data-testid='dashboard-page'
						data-visual-ready='true'
						className={cn(
							'space-y-5 pb-[calc(var(--h-mobile-nav)+var(--space-24))]',
							'md:space-y-6 md:pb-8',
						)}
					>
						<BlurFade delay={0.06}>
							<ResumeCookingBanner className='mb-0' />
						</BlurFade>

						<div className='grid gap-5 xl:grid-cols-[minmax(0,1.08fr)_minmax(20rem,0.92fr)]'>
							<BlurFade delay={0.09}>
								<TonightsPick className='mb-0 h-full' />
							</BlurFade>

							<BlurFade delay={0.12}>
								<RecentActivityList />
							</BlurFade>
						</div>
					</div>
				</PageContainer>
			</MeshGradient>
		</PageTransition>
	)
}
