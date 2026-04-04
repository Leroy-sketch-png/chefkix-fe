'use client'

import { useEffect, useState, useCallback } from 'react'
import { getPendingAppeals, reviewAppeal } from '@/services/admin'
import type { Appeal, AppealDecision } from '@/lib/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Scale,
	CheckCircle,
	XCircle,
	ExternalLink,
	Clock,
	FileText,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'

const STATUS_CONFIG: Record<
	string,
	{
		label: string
		variant: 'default' | 'secondary' | 'destructive' | 'outline'
	}
> = {
	pending: { label: 'Pending', variant: 'destructive' },
	approved: { label: 'Approved', variant: 'default' },
	rejected: { label: 'Rejected', variant: 'outline' },
}

export default function AppealsPage() {
	const [appeals, setAppeals] = useState<Appeal[]>([])
	const [loading, setLoading] = useState(true)
	const [reviewingId, setReviewingId] = useState<string | null>(null)
	const [expandedId, setExpandedId] = useState<string | null>(null)
	const [reviewNotes, setReviewNotes] = useState('')

	const fetchAppeals = useCallback(async () => {
		setLoading(true)
		try {
			const res = await getPendingAppeals()
			if (res.success) {
				setAppeals(res.data ?? [])
			}
		} catch {
			toast.error('Failed to load appeals')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchAppeals()
	}, [fetchAppeals])

	const handleReview = async (appealId: string, decision: AppealDecision) => {
		setReviewingId(appealId)
		try {
			const res = await reviewAppeal(appealId, {
				decision,
				notes: reviewNotes || undefined,
			})
			if (res.success) {
				toast.success(
					decision === 'approved'
						? 'Appeal approved — ban has been revoked'
						: 'Appeal rejected',
				)
				setExpandedId(null)
				setReviewNotes('')
				await fetchAppeals()
			}
		} catch {
			toast.error('Failed to review appeal')
		} finally {
			setReviewingId(null)
		}
	}

	if (loading) {
		return (
			<PageContainer maxWidth='2xl'>
				<PageHeader
					icon={Scale}
					title='Appeals'
					subtitle='Review ban appeals from users'
					gradient='blue'
					marginBottom='md'
				/>
				<div className='space-y-3'>
					{Array.from({ length: 4 }).map((_, i) => (
						<Skeleton key={i} className='h-24 w-full rounded-xl' />
					))}
				</div>
			</PageContainer>
		)
	}

	if (appeals.length === 0) {
		return (
			<PageContainer maxWidth='2xl'>
				<PageHeader
					icon={Scale}
					title='Appeals'
					subtitle='Review ban appeals from users'
					gradient='blue'
					marginBottom='md'
				/>
				<div className='flex flex-col items-center gap-3 py-16 text-center'>
					<div className='grid size-12 place-items-center rounded-full bg-success/10'>
						<Scale className='size-6 text-success' />
					</div>
					<p className='text-sm font-medium text-text'>No pending appeals</p>
					<p className='text-xs text-text-muted'>
						All appeals have been reviewed. Check back later.
					</p>
					<Button
						variant='outline'
						size='sm'
						onClick={fetchAppeals}
						className='mt-2'
					>
						Refresh
					</Button>
				</div>
			</PageContainer>
		)
	}

	return (
		<PageContainer maxWidth='2xl'>
			<PageHeader
				icon={Scale}
				title='Appeals'
				subtitle='Review ban appeals from users'
				gradient='blue'
				marginBottom='md'
			/>
			<div className='space-y-3'>
				<div className='mb-4 flex items-center justify-between'>
					<p className='text-sm text-text-muted'>
						{appeals.length} pending appeal{appeals.length !== 1 ? 's' : ''}
					</p>
					<Button
						variant='outline'
					size='sm'
					onClick={fetchAppeals}
					disabled={loading}
				>
					Refresh
				</Button>
			</div>

			{appeals.map(appeal => {
				const isExpanded = expandedId === appeal.id
				const statusConfig = STATUS_CONFIG[appeal.status]

				return (
					<div
						key={appeal.id}
						className={cn(
							'rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card transition-all',
							isExpanded && 'ring-2 ring-brand/20',
						)}
					>
						{/* Appeal header */}
						<div
							className='flex cursor-pointer items-center justify-between gap-3'
							onClick={() => setExpandedId(isExpanded ? null : appeal.id)}
						>
							<div className='flex items-center gap-3'>
								<div className='grid size-10 place-items-center rounded-lg bg-warning/10'>
									<Scale className='size-5 text-warning' />
								</div>
								<div>
									<div className='flex items-center gap-2'>
										<span className='text-sm font-semibold text-text'>
											Ban Appeal
										</span>
										<Badge
											variant={statusConfig?.variant ?? 'outline'}
											className='text-xs'
										>
											{statusConfig?.label ?? appeal.status}
										</Badge>
									</div>
									<p className='text-xs text-text-muted'>
										User:{' '}
										<span className='font-mono'>
											{appeal.userId.slice(0, 12)}...
										</span>
										{' \u00b7 '}
										{new Date(appeal.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<Clock className='size-4 text-text-muted' />
						</div>

						{/* Expanded details */}
						{isExpanded && (
							<div className='mt-4 space-y-3 border-t border-border-subtle pt-4'>
								<div className='grid grid-cols-2 gap-3 text-xs'>
									<div>
										<span className='font-medium text-text-muted'>User ID</span>
										<p className='mt-0.5 font-mono text-text'>
											{appeal.userId}
										</p>
									</div>
									<div>
										<span className='font-medium text-text-muted'>Ban ID</span>
										<p className='mt-0.5 font-mono text-text'>{appeal.banId}</p>
									</div>
								</div>

								<div className='text-xs'>
									<span className='font-medium text-text-muted'>
										Appeal reason
									</span>
									<p className='mt-0.5 rounded-lg bg-bg-elevated p-3 text-text'>
										{appeal.reason}
									</p>
								</div>

								{appeal.evidenceUrls.length > 0 && (
									<div className='text-xs'>
										<span className='font-medium text-text-muted'>
											Evidence ({appeal.evidenceUrls.length})
										</span>
										<div className='mt-1 space-y-1'>
											{appeal.evidenceUrls.map((url, i) => (
												<a
													key={i}
													href={url}
													target='_blank'
													rel='noopener noreferrer'
													className='flex items-center gap-1.5 rounded-lg bg-bg-elevated px-3 py-2 text-brand hover:underline'
												>
													<ExternalLink className='size-3' />
													{url.length > 60 ? `${url.slice(0, 60)}...` : url}
												</a>
											))}
										</div>
									</div>
								)}

								{appeal.reviewedBy && (
									<div className='grid grid-cols-2 gap-3 text-xs'>
										<div>
											<span className='font-medium text-text-muted'>
												Reviewed by
											</span>
											<p className='mt-0.5 font-mono text-text'>
												{appeal.reviewedBy}
											</p>
										</div>
										{appeal.reviewedAt && (
											<div>
												<span className='font-medium text-text-muted'>
													Reviewed at
												</span>
												<p className='mt-0.5 text-text'>
													{new Date(appeal.reviewedAt).toLocaleString()}
												</p>
											</div>
										)}
									</div>
								)}

								{appeal.reviewNotes && (
									<div className='text-xs'>
										<span className='font-medium text-text-muted'>
											Review notes
										</span>
										<p className='mt-0.5 rounded-lg bg-bg-elevated p-3 text-text'>
											{appeal.reviewNotes}
										</p>
									</div>
								)}

								{/* Actions (only for pending) */}
								{appeal.status === 'pending' && (
									<div className='space-y-3 border-t border-border-subtle pt-3'>
										<textarea
											value={reviewNotes}
											onChange={e => setReviewNotes(e.target.value)}
											placeholder='Review notes (optional)...'
											className='w-full resize-none rounded-lg border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30'
											rows={2}
										/>
										<div className='flex gap-2'>
											<Button
												size='sm'
												onClick={() => handleReview(appeal.id, 'approved')}
												disabled={reviewingId === appeal.id}
												className='gap-1.5'
											>
												<CheckCircle className='size-3.5' />
												Approve (Revoke Ban)
											</Button>
											<Button
												size='sm'
												variant='destructive'
												onClick={() => handleReview(appeal.id, 'rejected')}
												disabled={reviewingId === appeal.id}
												className='gap-1.5'
											>
												<XCircle className='size-3.5' />
												Reject
											</Button>
										</div>
									</div>
								)}
							</div>
						)}
					</div>
				)
			})}
			</div>
		</PageContainer>
	)
}
