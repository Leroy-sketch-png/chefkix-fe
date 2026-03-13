'use client'

import { useEffect, useState, useCallback } from 'react'
import {
	getPendingReports,
	getAllReports,
	reviewReport,
} from '@/services/admin'
import type { Report, ReviewDecision, BanScope } from '@/lib/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import {
	AlertTriangle,
	CheckCircle,
	XCircle,
	Ban,
	Eye,
	Clock,
	MessageSquare,
	FileText,
	ChefHat,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const REASON_LABELS: Record<string, string> = {
	fraud: 'Fraud',
	spam: 'Spam',
	inappropriate: 'Inappropriate',
	harassment: 'Harassment',
	copyright: 'Copyright',
	other: 'Other',
}

const TARGET_ICONS: Record<string, typeof FileText> = {
	post: FileText,
	comment: MessageSquare,
	recipe: ChefHat,
}

const STATUS_CONFIG: Record<
	string,
	{
		label: string
		variant: 'default' | 'secondary' | 'destructive' | 'outline'
		icon: typeof Clock
	}
> = {
	pending: { label: 'Pending', variant: 'destructive', icon: Clock },
	reviewed: { label: 'Reviewed', variant: 'secondary', icon: Eye },
	resolved: { label: 'Resolved', variant: 'default', icon: CheckCircle },
	dismissed: { label: 'Dismissed', variant: 'outline', icon: XCircle },
}

export default function ReportsPage() {
	const [pendingReports, setPendingReports] = useState<Report[]>([])
	const [allReports, setAllReports] = useState<Report[]>([])
	const [loading, setLoading] = useState(true)
	const [activeTab, setActiveTab] = useState('pending')
	const [reviewingId, setReviewingId] = useState<string | null>(null)
	const [reviewNotes, setReviewNotes] = useState('')
	const [expandedId, setExpandedId] = useState<string | null>(null)

	const fetchReports = useCallback(async () => {
		setLoading(true)
		try {
			const [pendingRes, allRes] = await Promise.all([
				getPendingReports(),
				getAllReports(),
			])
			if (pendingRes.success) setPendingReports(pendingRes.data ?? [])
			if (allRes.success) setAllReports(allRes.data ?? [])
		} catch {
			toast.error('Failed to load reports')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		fetchReports()
	}, [fetchReports])

	const handleReview = async (
		reportId: string,
		decision: ReviewDecision,
		banScope?: BanScope,
	) => {
		setReviewingId(reportId)
		try {
			const res = await reviewReport(reportId, {
				decision,
				notes: reviewNotes || undefined,
				banScope,
			})
			if (res.success) {
				toast.success(
					decision === 'resolved'
						? 'Report resolved'
						: decision === 'dismissed'
							? 'Report dismissed'
							: 'User banned & report resolved',
				)
				setExpandedId(null)
				setReviewNotes('')
				await fetchReports()
			}
		} catch {
			toast.error('Failed to review report')
		} finally {
			setReviewingId(null)
		}
	}

	const reports = activeTab === 'pending' ? pendingReports : allReports

	return (
		<div>
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<div className='mb-4 flex items-center justify-between'>
					<TabsList>
						<TabsTrigger value='pending'>
							Pending
							{pendingReports.length > 0 && (
								<Badge variant='destructive' className='ml-2 text-xs'>
									{pendingReports.length}
								</Badge>
							)}
						</TabsTrigger>
						<TabsTrigger value='all'>All Reports</TabsTrigger>
					</TabsList>
					<Button
						variant='outline'
						size='sm'
						onClick={fetchReports}
						disabled={loading}
					>
						Refresh
					</Button>
				</div>

				<TabsContent value='pending'>
					<ReportList
						reports={reports}
						loading={loading}
						expandedId={expandedId}
						setExpandedId={setExpandedId}
						reviewingId={reviewingId}
						reviewNotes={reviewNotes}
						setReviewNotes={setReviewNotes}
						onReview={handleReview}
						showActions
					/>
				</TabsContent>
				<TabsContent value='all'>
					<ReportList
						reports={reports}
						loading={loading}
						expandedId={expandedId}
						setExpandedId={setExpandedId}
						reviewingId={reviewingId}
						reviewNotes={reviewNotes}
						setReviewNotes={setReviewNotes}
						onReview={handleReview}
						showActions={false}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}

function ReportList({
	reports,
	loading,
	expandedId,
	setExpandedId,
	reviewingId,
	reviewNotes,
	setReviewNotes,
	onReview,
	showActions,
}: {
	reports: Report[]
	loading: boolean
	expandedId: string | null
	setExpandedId: (id: string | null) => void
	reviewingId: string | null
	reviewNotes: string
	setReviewNotes: (v: string) => void
	onReview: (id: string, decision: ReviewDecision, banScope?: BanScope) => void
	showActions: boolean
}) {
	if (loading) {
		return (
			<div className='space-y-3'>
				{Array.from({ length: 5 }).map((_, i) => (
					<Skeleton key={i} className='h-24 w-full rounded-xl' />
				))}
			</div>
		)
	}

	if (reports.length === 0) {
		return (
			<div className='flex flex-col items-center gap-3 py-16 text-center'>
				<CheckCircle className='size-12 text-success' />
				<p className='text-sm font-medium text-text'>No reports to review</p>
				<p className='text-xs text-text-muted'>All clear! Check back later.</p>
			</div>
		)
	}

	return (
		<div className='space-y-3'>
			{reports.map(report => {
				const isExpanded = expandedId === report.id
				const statusConfig = STATUS_CONFIG[report.status]
				const TargetIcon = TARGET_ICONS[report.targetType] ?? FileText

				return (
					<div
						key={report.id}
						className={cn(
							'rounded-xl border border-border-subtle bg-bg-card p-4 shadow-card transition-all',
							isExpanded && 'ring-2 ring-brand/20',
						)}
					>
						{/* Report header */}
						<div
							className='flex cursor-pointer items-center justify-between gap-3'
							onClick={() => setExpandedId(isExpanded ? null : report.id)}
						>
							<div className='flex items-center gap-3'>
								<div className='grid size-10 place-items-center rounded-lg bg-warning/10'>
									<TargetIcon className='size-5 text-warning' />
								</div>
								<div>
									<div className='flex items-center gap-2'>
										<span className='text-sm font-semibold text-text capitalize'>
											{report.targetType} Report
										</span>
										<Badge
											variant={statusConfig?.variant ?? 'outline'}
											className='text-xs'
										>
											{statusConfig?.label ?? report.status}
										</Badge>
									</div>
									<p className='text-xs text-text-muted'>
										Reason: {REASON_LABELS[report.reason] ?? report.reason}
										{' \u00b7 '}
										{new Date(report.createdAt).toLocaleDateString()}
									</p>
								</div>
							</div>
							<div className='text-xs text-text-muted'>
								ID: {report.targetId.slice(0, 8)}...
							</div>
						</div>

						{/* Expanded details */}
						{isExpanded && (
							<div className='mt-4 space-y-3 border-t border-border-subtle pt-4'>
								<div className='grid grid-cols-2 gap-3 text-xs'>
									<div>
										<span className='font-medium text-text-muted'>
											Reporter ID
										</span>
										<p className='mt-0.5 font-mono text-text'>
											{report.reporterId}
										</p>
									</div>
									<div>
										<span className='font-medium text-text-muted'>
											Target ID
										</span>
										<p className='mt-0.5 font-mono text-text'>
											{report.targetId}
										</p>
									</div>
								</div>

								{report.details && (
									<div className='text-xs'>
										<span className='font-medium text-text-muted'>Details</span>
										<p className='mt-0.5 rounded-lg bg-bg-elevated p-3 text-text'>
											{report.details}
										</p>
									</div>
								)}

								{report.reviewedBy && (
									<div className='grid grid-cols-2 gap-3 text-xs'>
										<div>
											<span className='font-medium text-text-muted'>
												Reviewed by
											</span>
											<p className='mt-0.5 font-mono text-text'>
												{report.reviewedBy}
											</p>
										</div>
										{report.reviewedAt && (
											<div>
												<span className='font-medium text-text-muted'>
													Reviewed at
												</span>
												<p className='mt-0.5 text-text'>
													{new Date(report.reviewedAt).toLocaleString()}
												</p>
											</div>
										)}
									</div>
								)}

								{report.reviewNotes && (
									<div className='text-xs'>
										<span className='font-medium text-text-muted'>
											Review notes
										</span>
										<p className='mt-0.5 rounded-lg bg-bg-elevated p-3 text-text'>
											{report.reviewNotes}
										</p>
									</div>
								)}

								{/* Actions (only for pending reports) */}
								{showActions && report.status === 'pending' && (
									<div className='space-y-3 border-t border-border-subtle pt-3'>
										<textarea
											value={reviewNotes}
											onChange={e => setReviewNotes(e.target.value)}
											placeholder='Review notes (optional)...'
											className='w-full resize-none rounded-lg border border-border-subtle bg-bg-elevated p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30'
											rows={2}
										/>
										<div className='flex flex-wrap gap-2'>
											<Button
												size='sm'
												variant='outline'
												onClick={() => onReview(report.id, 'resolved')}
												disabled={reviewingId === report.id}
												className='gap-1.5'
											>
												<CheckCircle className='size-3.5' />
												Resolve (Unhide)
											</Button>
											<Button
												size='sm'
												variant='outline'
												onClick={() => onReview(report.id, 'dismissed')}
												disabled={reviewingId === report.id}
												className='gap-1.5'
											>
												<XCircle className='size-3.5' />
												Dismiss
											</Button>
											<Button
												size='sm'
												variant='destructive'
												onClick={() => onReview(report.id, 'ban_user', 'all')}
												disabled={reviewingId === report.id}
												className='gap-1.5'
											>
												<Ban className='size-3.5' />
												Ban User
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
	)
}
