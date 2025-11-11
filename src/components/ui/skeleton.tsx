import { cn } from '@/lib/utils'

function Skeleton({
	className,
	...props
}: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				'relative overflow-hidden rounded-radius bg-muted/20',
				'before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer',
				'before:bg-gradient-to-r before:from-transparent before:via-white/40 before:to-transparent',
				className,
			)}
			{...props}
		/>
	)
}

function CommentSkeleton() {
	return (
		<div className='flex gap-3 py-3'>
			<Skeleton className='h-10 w-10 flex-shrink-0 rounded-full' />
			<div className='flex-1 space-y-2'>
				<Skeleton className='h-20 w-full rounded-lg' />
				<div className='flex gap-4'>
					<Skeleton className='h-4 w-16' />
					<Skeleton className='h-4 w-12' />
					<Skeleton className='h-4 w-12' />
				</div>
			</div>
		</div>
	)
}

export { Skeleton, CommentSkeleton }
