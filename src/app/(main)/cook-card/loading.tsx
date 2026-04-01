import { PageContainer } from '@/components/layout/PageContainer'

export default function Loading() {
	return (
		<PageContainer>
			{/* Back button */}
			<div className='mb-4 h-5 w-16 animate-pulse rounded-lg bg-bg-elevated/40' />

			{/* Header */}
			<div className='mb-6'>
				<div className='mb-2 flex items-center gap-3'>
					<div className='size-12 animate-pulse rounded-2xl bg-bg-elevated/40' />
					<div className='h-9 w-48 animate-pulse rounded-lg bg-bg-elevated/40' />
				</div>
				<div className='h-5 w-64 animate-pulse rounded-lg bg-bg-elevated/40' />
			</div>

			{/* Cook Card */}
			<div className='mx-auto max-w-md'>
				<div className='aspect-[4/5] w-full animate-pulse rounded-xl bg-bg-elevated/40' />
			</div>
		</PageContainer>
	)
}
