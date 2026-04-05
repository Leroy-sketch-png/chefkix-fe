'use client'

import { useState, useCallback } from 'react'
import { getUserBans, banUser, revokeBan } from '@/services/admin'
import type { BanResponse, BanScope } from '@/lib/types/admin'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
	Ban,
	Search,
	Shield,
	ShieldOff,
	Clock,
	AlertTriangle,
	Infinity,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { PageContainer } from '@/components/layout/PageContainer'
import { PageHeader } from '@/components/layout/PageHeader'
import { useTranslations } from 'next-intl'

export default function BansPage() {
	const t = useTranslations('admin')
	const [userId, setUserId] = useState('')
	const [bans, setBans] = useState<BanResponse[]>([])
	const [loading, setLoading] = useState(false)
	const [searched, setSearched] = useState(false)
	const [actionLoading, setActionLoading] = useState<string | null>(null)

	// Ban form state
	const [showBanForm, setShowBanForm] = useState(false)
	const [banReason, setBanReason] = useState('')
	const [banScope, setBanScope] = useState<BanScope>('all')

	const searchBans = useCallback(async () => {
		if (!userId.trim()) {
			toast.error(t('toastEnterUserId'))
			return
		}
		setLoading(true)
		setSearched(true)
		try {
			const res = await getUserBans(userId.trim())
			if (res.success) {
				setBans(res.data ?? [])
			}
		} catch {
			toast.error(t('toastFetchBansFailed'))
			setBans([])
		} finally {
			setLoading(false)
		}
	}, [userId])

	const handleRevoke = async (banId: string) => {
		setActionLoading(banId)
		try {
			const res = await revokeBan(banId)
			if (res.success) {
				toast.success(t('toastBanRevoked'))
				await searchBans()
			}
		} catch {
			toast.error(t('toastRevokeFailed'))
		} finally {
			setActionLoading(null)
		}
	}

	const handleBan = async () => {
		if (!banReason.trim()) {
			toast.error(t('toastBanReasonRequired'))
			return
		}
		setActionLoading('ban-new')
		try {
			const res = await banUser(userId.trim(), {
				reason: banReason,
				scope: banScope,
			})
			if (res.success && res.data) {
				toast.success(
					res.data.permanent
						? 'User permanently banned'
						: `User banned for ${res.data.durationDays} days (offense #${res.data.offenseNumber})`,
				)
				setShowBanForm(false)
				setBanReason('')
				await searchBans()
			}
		} catch {
			toast.error(t('toastBanFailed'))
		} finally {
			setActionLoading(null)
		}
	}

	return (
		<PageContainer maxWidth='2xl'>
			<PageHeader
				icon={Shield}
				title={t('bansTitle')}
				subtitle={t('bansSubtitle')}
				gradient='gray'
				marginBottom='md'
			/>
			<div className='space-y-6'>
				{/* Search bar */}
				<div className='flex gap-2'>
					<div className='relative flex-1'>
						<Search className='absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted' />
						<input
							type='text'
							value={userId}
							onChange={e => setUserId(e.target.value)}
							onKeyDown={e => e.key === 'Enter' && searchBans()}
							placeholder={t('searchPlaceholder')}
							className='w-full rounded-xl border border-border-subtle bg-bg-card py-2.5 pl-10 pr-4 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30'
						/>
					</div>
					<Button onClick={searchBans} disabled={loading} className='gap-1.5'>
						<Search className='size-4' />
						Search
					</Button>
				</div>

			{/* Results */}
			{loading ? (
				<div className='space-y-3'>
					{Array.from({ length: 3 }).map((_, i) => (
						<Skeleton key={i} className='h-20 w-full rounded-xl' />
					))}
				</div>
			) : searched ? (
				<>
					{/* User actions */}
					<div className='flex items-center justify-between'>
						<p className='text-sm text-text-muted'>
							{bans.length === 0
								? t('noActiveBansUser')
								: t('activeBansCount', { count: bans.length })}
						</p>
						{userId.trim() && (
							<Button
								size='sm'
								variant={showBanForm ? 'outline' : 'destructive'}
								onClick={() => setShowBanForm(!showBanForm)}
								className='gap-1.5'
							>
								<Ban className='size-3.5' />
								{showBanForm ? t('cancelBan') : t('issueNewBan')}
							</Button>
						)}
					</div>

					{/* Ban form */}
					{showBanForm && (
						<div className='rounded-xl border border-destructive/30 bg-destructive/5 p-4 space-y-3'>
							<p className='text-sm font-semibold text-text'>
								{t('banUserLabel', { userId: userId.trim() })}
							</p>
							<p className='text-xs text-text-muted'>
								{t('escalatingPenalties')}
							</p>
							<textarea
								value={banReason}
								onChange={e => setBanReason(e.target.value)}
								placeholder={t('banReasonPlaceholder')}
								className='w-full resize-none rounded-lg border border-border-subtle bg-bg-card p-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-brand/30'
								rows={2}
							/>
							<div className='flex items-center gap-3'>
								<label className='text-xs font-medium text-text-muted'>
									{t('scopeLabel')}
								</label>
								{(['all', 'post', 'comment'] as BanScope[]).map(scope => (
									<button
										type='button'
										key={scope}
										onClick={() => setBanScope(scope)}
										className={cn(
											'rounded-lg px-3 py-1.5 text-xs font-medium transition-colors',
											banScope === scope
												? 'bg-destructive text-destructive-foreground'
												: 'bg-bg-elevated text-text-muted hover:text-text',
										)}
									>
										{scope.charAt(0).toUpperCase() + scope.slice(1)}
									</button>
								))}
							</div>
							<Button
								size='sm'
								variant='destructive'
								onClick={handleBan}
								disabled={actionLoading === 'ban-new'}
								className='gap-1.5'
							>
								<Ban className='size-3.5' />
								{t('confirmBan')}
							</Button>
						</div>
					)}

					{/* Ban list */}
					{bans.length > 0 && (
						<div className='space-y-3'>
							{bans.map(ban => (
								<div
									key={ban.id}
									className={cn(
										'rounded-xl border bg-bg-card p-4 shadow-card',
										ban.active
											? 'border-destructive/30'
											: 'border-border-subtle opacity-60',
									)}
								>
									<div className='flex items-center justify-between gap-3'>
										<div className='flex items-center gap-3'>
											<div
												className={cn(
													'grid size-10 place-items-center rounded-lg',
													ban.active ? 'bg-destructive/10' : 'bg-bg-elevated',
												)}
											>
												{ban.active ? (
													<Shield className='size-5 text-destructive' />
												) : (
													<ShieldOff className='size-5 text-text-muted' />
												)}
											</div>
											<div>
												<div className='flex items-center gap-2'>
													<span className='text-sm font-semibold text-text'>
														{t('offenseLabel', { number: ban.offenseNumber })}
													</span>
													<Badge
														variant={ban.active ? 'destructive' : 'outline'}
														className='text-xs'
													>
														{ban.active ? t('activeStatus') : t('revokedStatus')}
													</Badge>
													<Badge
														variant='secondary'
														className='text-xs capitalize'
													>
														{ban.scope}
													</Badge>
													{ban.permanent && (
														<Badge
															variant='destructive'
															className='gap-1 text-xs'
														>
															<Infinity className='size-3' />
															Permanent
														</Badge>
													)}
												</div>
												<p className='text-xs text-text-muted'>
													{ban.permanent
														? 'No expiry'
														: `${ban.durationDays} days \u00b7 Expires ${ban.expiresAt ? new Date(ban.expiresAt).toLocaleDateString() : 'N/A'}`}
													{' \u00b7 Issued '}
													{new Date(ban.issuedAt).toLocaleDateString()}
												</p>
											</div>
										</div>
										{ban.active && (
											<Button
												size='sm'
												variant='outline'
												onClick={() => handleRevoke(ban.id)}
												disabled={actionLoading === ban.id}
												className='gap-1.5'
											>
												<ShieldOff className='size-3.5' />
												Revoke
											</Button>
										)}
									</div>
									<p className='mt-2 text-xs text-text-muted'>
										<span className='font-medium'>{t('reasonPrefix')}</span> {ban.reason}
									</p>
								</div>
							))}
						</div>
					)}

					{/* Empty state */}
					{bans.length === 0 && !showBanForm && (
						<div className='flex flex-col items-center gap-3 py-12 text-center'>
							<div className='grid size-12 place-items-center rounded-full bg-success/10'>
								<Shield className='size-6 text-success' />
							</div>
							<p className='text-sm font-medium text-text'>{t('noActiveBansTitle')}</p>
							<p className='text-xs text-text-muted'>{t('cleanRecord')}</p>
						</div>
					)}
				</>
			) : (
				<div className='flex flex-col items-center gap-3 py-16 text-center'>
					<div className='grid size-12 place-items-center rounded-full bg-bg-elevated'>
						<Search className='size-6 text-text-muted' />
					</div>
					<p className='text-sm font-medium text-text'>{t('lookUpTitle')}</p>
					<p className='text-xs text-text-muted'>
						Enter a user ID to view their ban history and manage bans
					</p>
				</div>
			)}
			</div>
		</PageContainer>
	)
}
