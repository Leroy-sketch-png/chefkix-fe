import { PageContainer } from '@/components/layout/PageContainer'
import { RecipeCardSkeleton } from '@/components/recipe/RecipeCardSkeleton'
import { PostCardSkeleton } from '@/components/social/PostCardSkeleton'
import { UserProfileSkeleton } from '@/components/profile/UserProfileSkeleton'
import { CommentSkeleton } from '@/components/social/CommentSkeleton'
import { Separator } from '@/components/ui/separator'

/**
 * Skeleton Components Showcase
 *
 * Demo page displaying all specialized loading skeletons.
 * These match exact dimensions of their real components for smooth perceived performance.
 */
export default function SkeletonDemoPage() {
	return (
		<PageContainer maxWidth='xl'>
			<div className='mb-8'>
				<h1 className='text-3xl font-bold text-text-primary'>
					Skeleton Components Showcase
				</h1>
				<p className='mt-2 text-text-secondary'>
					Specialized loading skeletons matching real component dimensions
				</p>
			</div>

			<div className='space-y-12'>
				{/* Recipe Card Skeleton */}
				<section>
					<h2 className='mb-4 text-2xl font-bold text-text-primary'>
						Recipe Card Skeleton
					</h2>
					<p className='mb-6 text-text-secondary'>
						Matches RecipeCard dimensions: aspect [4/3] image, difficulty badge,
						save button, title, description, author info
					</p>
					<div className='grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3'>
						<RecipeCardSkeleton count={3} />
					</div>
				</section>

				<Separator />

				{/* Post Card Skeleton */}
				<section>
					<h2 className='mb-4 text-2xl font-bold text-text-primary'>
						Post Card Skeleton
					</h2>
					<p className='mb-6 text-text-secondary'>
						Matches PostCard dimensions: header (avatar + name + time), content
						text, images grid, tags, action buttons, stats
					</p>
					<div className='space-y-6'>
						<PostCardSkeleton count={2} showImages={true} />
					</div>
				</section>

				<Separator />

				{/* Post Card Skeleton - No Images */}
				<section>
					<h2 className='mb-4 text-2xl font-bold text-text-primary'>
						Post Card Skeleton (Text Only)
					</h2>
					<p className='mb-6 text-text-secondary'>
						Same as above but without image placeholders for text-only posts
					</p>
					<div className='space-y-6'>
						<PostCardSkeleton count={2} showImages={false} />
					</div>
				</section>

				<Separator />

				{/* Comment Skeleton */}
				<section>
					<h2 className='mb-4 text-2xl font-bold text-text-primary'>
						Comment Skeleton
					</h2>
					<p className='mb-6 text-text-secondary'>
						Matches Comment component: small avatar, name + timestamp, comment
						text (1-2 lines), action buttons
					</p>
					<div className='rounded-radius bg-bg-card p-4 shadow-md'>
						<h3 className='mb-3 font-semibold text-text-primary'>
							Standard Comments
						</h3>
						<CommentSkeleton count={3} isReply={false} />

						<h3 className='mb-3 mt-6 font-semibold text-text-primary'>
							Reply Comments (with left margin)
						</h3>
						<CommentSkeleton count={2} isReply={true} />
					</div>
				</section>

				<Separator />

				{/* User Profile Skeleton */}
				<section>
					<h2 className='mb-4 text-2xl font-bold text-text-primary'>
						User Profile Skeleton
					</h2>
					<p className='mb-6 text-text-secondary'>
						Matches UserProfile dimensions: cover image, large avatar, name/bio,
						stats row, action buttons, badges, tabs, content grid
					</p>
					<div className='rounded-radius bg-panel-bg p-6'>
						<UserProfileSkeleton />
					</div>
				</section>
			</div>
		</PageContainer>
	)
}
