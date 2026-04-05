'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
	X,
	Shield,
	Flag,
	AlertCircle,
	Clock,
	CheckCircle,
	Ban,
	AlertTriangle,
	MessageCircle,
	Send,
	Loader2,
	TrendingUp,
	ShieldCheck,
	Trophy,
	FileText,
	Trash2,
} from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar'
import { useTranslations } from 'next-intl'
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	TRANSITION_BOUNCY,
	BUTTON_HOVER,
	BUTTON_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
	DURATION_S,
} from '@/lib/motion'

// ============================================
// TYPES
// ============================================

type ReportReason =
	| 'spam'
	| 'inappropriate'
	| 'harassment'
	| 'fraud'
	| 'copyright'
	| 'other'

type RestrictionLevel = '3d' | '7d' | '14d' | 'permanent'

export interface ReportedContent {
	type: 'post' | 'comment' | 'recipe' | 'user'
	author: {
		username: string
		avatarUrl: string
	}
	preview?: string
}

interface ViolationDetails {
	type: string
	offense: number // 1st, 2nd, 3rd, 4th+
	restrictionDays: number | 'permanent'
	endDate?: string
}

interface AppealStatus {
	status: 'pending' | 'approved' | 'denied'
	submittedAt: string
	moderatorNote?: string
}

// ============================================
// ANIMATIONS
// ============================================

const overlayVariants = {
	hidden: { opacity: 0 },
	visible: { opacity: 1 },
}

const modalVariants = {
	hidden: { opacity: 0, y: 50, scale: 0.95 },
	visible: {
		opacity: 1,
		y: 0,
		scale: 1,
		transition: TRANSITION_SMOOTH,
	},
	exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: DURATION_S.normal } },
}

// ============================================
// REPORT MODAL
// ============================================

interface ReportModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (reason: ReportReason, details?: string) => Promise<void>
	content: ReportedContent
}

const reportReasons: { value: ReportReason; titleKey: string; descKey: string }[] = [
	{
		value: 'spam',
		titleKey: 'rrSpam',
		descKey: 'rrSpamDesc',
	},
	{
		value: 'inappropriate',
		titleKey: 'rrInappropriate',
		descKey: 'rrInappropriateDesc',
	},
	{
		value: 'harassment',
		titleKey: 'rrHarassment',
		descKey: 'rrHarassmentDesc',
	},
	{
		value: 'fraud',
		titleKey: 'rrFraud',
		descKey: 'rrFraudDesc',
	},
	{
		value: 'copyright',
		titleKey: 'rrCopyright',
		descKey: 'rrCopyrightDesc',
	},
	{ value: 'other', titleKey: 'rrOther', descKey: 'rrOtherDesc' },
]

export const ReportModal = ({
	isOpen,
	onClose,
	onSubmit,
	content,
}: ReportModalProps) => {
	const t = useTranslations('report')
	const [selectedReason, setSelectedReason] = useState<ReportReason | null>(
		null,
	)
	const [details, setDetails] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	const handleSubmit = async () => {
		if (!selectedReason) return

		setIsSubmitting(true)
		try {
			await onSubmit(selectedReason, details)
			setSubmitted(true)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleClose = () => {
		setSelectedReason(null)
		setDetails('')
		setSubmitted(false)
		onClose()
	}

	useEscapeKey(isOpen, handleClose)

	return (
		<Portal>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						variants={overlayVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						onClick={handleClose}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4'
					>
						<motion.div
							variants={modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							onClick={e => e.stopPropagation()}
							className='max-h-modal w-full max-w-modal-lg overflow-y-auto rounded-2xl bg-bg-card'
						>
							{submitted ? (
								// Confirmation View
								<div className='p-5 text-center md:p-6'>
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={TRANSITION_BOUNCY}
										className='mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/10 text-success'
									>
										<CheckCircle className='size-7' />
									</motion.div>
									<h3 className='mb-2 text-lg font-extrabold'>
										{t('rmSubmitted')}
									</h3>
									<p className='mb-4 text-sm leading-relaxed text-text-muted'>
										{t('rmThanks')}
									</p>
									<div className='mb-4 rounded-lg bg-bg-elevated p-4 text-left'>
										<h4 className='mb-2 text-sm font-bold'>
											{t('rmWhatsNext')}
										</h4>
										<ul className='space-y-1.5 text-xs text-text-muted'>
											<li>• {t('rmStep1')}</li>
											<li>• {t('rmStep2')}</li>
											<li>• {t('rmStep3')}</li>
										</ul>
									</div>
									<motion.button
										type='button'
										onClick={handleClose}
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										className='w-full rounded-lg bg-gradient-xp py-3 text-sm font-bold text-white'
									>
										{t('rmDone')}
									</motion.button>
								</div>
							) : (
								// Report Form
								<>
									<div className='flex items-center justify-between border-b border-border p-4 md:p-5'>
										<h2 className='text-lg font-extrabold'>{t('rmTitle')}</h2>
										<motion.button										type='button'											whileHover={ICON_BUTTON_HOVER}
											whileTap={ICON_BUTTON_TAP}
											onClick={handleClose}
											className='flex size-8 items-center justify-center rounded-lg bg-bg-elevated text-text-muted hover:text-text'
											aria-label={t('rmCloseAriaLabel')}
										>
											<X className='size-4' />
										</motion.button>
									</div>
									<div className='p-4 md:p-5'>
										{/* Content Preview */}
										<div className='mb-4 flex items-center gap-3 rounded-xl bg-bg-elevated px-3 py-2.5'>
											<Avatar size='sm'>
												<AvatarImage
													src={content.author.avatarUrl}
													alt={content.author.username}
												/>
												<AvatarFallback>
													{content.author.username?.slice(0, 2).toUpperCase() ||
														'??'}
												</AvatarFallback>
											</Avatar>
											<div>
												<div className='text-sm font-bold'>
													@{content.author.username}
												</div>
												<div className='text-xs text-text-muted capitalize'>
													{content.type}
												</div>
											</div>
										</div>

										{/* Reasons */}
										<div className='mb-4'>
											<h3 className='mb-2.5 text-sm font-bold'>
											{t('rmWhyReporting')}
											</h3>
											<div className='flex flex-col gap-2'>
												{reportReasons.map(reason => (
													<label
														key={reason.value}
														className={cn(
															'flex cursor-pointer items-start gap-3 rounded-lg border-2 border-transparent bg-bg-elevated p-3 transition-all',
															selectedReason === reason.value
																? 'border-xp bg-xp/10'
																: 'hover:border-border',
														)}
													>
														<input
															type='radio'
															name='reason'
															value={reason.value}
															checked={selectedReason === reason.value}
															onChange={() => setSelectedReason(reason.value)}
															className='sr-only'
														/>
														<div
															className={cn(
																'mt-0.5 flex size-4 flex-shrink-0 items-center justify-center rounded-full border-2',
																selectedReason === reason.value
																	? 'border-xp'
																	: 'border-border',
															)}
														>
															{selectedReason === reason.value && (
																<div className='size-2 rounded-full bg-xp' />
															)}
														</div>
														<div className='flex flex-col gap-0.5'>
															<span className='text-sm font-semibold'>
																{t(reason.titleKey)}
															</span>
															<span className='text-xs text-text-muted'>
																{t(reason.descKey)}
															</span>
														</div>
													</label>
												))}
											</div>
										</div>

										{/* Additional Details */}
										<div className='mb-4'>
											<h3 className='mb-1.5 text-sm font-bold'>
											{t('rmDetails')}
											</h3>
											<textarea
												value={details}
												onChange={e => setDetails(e.target.value)}
												placeholder={t('rmDetailsPlaceholder')}
												maxLength={1000}
												className='min-h-20 w-full resize-y rounded-lg border-2 border-transparent bg-bg-elevated p-3 text-sm leading-relaxed outline-none transition-colors focus:border-accent-purple'
											/>
											{details.length > 0 && (
											<p className={`mt-1 text-right text-xs tabular-nums ${details.length > 800 ? (details.length >= 1000 ? 'text-error font-semibold' : 'text-warning') : 'text-text-muted'}`}>
													{details.length}/1000
												</p>
											)}
										</div>

										{/* Trust Signal */}
										<div className='mb-4 flex items-start gap-2 rounded-lg bg-xp/10 p-3'>
											<Shield className='mt-0.5 size-4 flex-shrink-0 text-xp' />
											<span className='text-xs leading-relaxed text-text-muted'>
											{t('rmTrustSignal')}
											</span>
										</div>

										{/* Submit */}
										<motion.button
											onClick={handleSubmit}
											disabled={!selectedReason || isSubmitting}
											whileHover={
												selectedReason && !isSubmitting ? { y: -2 } : {}
											}
											whileTap={
												selectedReason && !isSubmitting ? { scale: 0.98 } : {}
											}
											className='flex w-full items-center justify-center gap-2 rounded-lg bg-error py-3 text-sm font-bold text-white disabled:opacity-50'
										>
											{isSubmitting ? (
												<Loader2 className='size-4 animate-spin' />
											) : (
												<>
													<Flag className='size-4' />
												<span>{t('rmSubmit')}</span>
												</>
											)}
										</motion.button>
									</div>
								</>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</Portal>
	)
}

interface ReportLimitModalProps {
	isOpen: boolean
	onClose: () => void
	hoursUntilReset: number
}

export const ReportLimitModal = ({
	isOpen,
	onClose,
	hoursUntilReset,
}: ReportLimitModalProps) => {
	const t = useTranslations('report')
	useEscapeKey(isOpen, onClose)

	return (
		<Portal>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						variants={overlayVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						onClick={onClose}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4'
					>
						<motion.div
							variants={modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							onClick={e => e.stopPropagation()}
							className='w-full max-w-modal-sm rounded-2xl bg-bg-card p-7 text-center'
						>
							<div className='mx-auto mb-5 flex size-16 items-center justify-center rounded-full bg-warning/10 text-warning'>
								<AlertCircle className='size-8' />
							</div>
							<h3 className='mb-3 text-xl font-extrabold'>
								{t('rlTitle')}
							</h3>
							<p className='mb-5 text-sm leading-relaxed text-text-muted'>
								{t('rlDescription')}
							</p>
							<div className='mb-5 flex items-center justify-center gap-2 rounded-lg bg-bg-elevated p-3 text-sm text-text-muted'>
								<Clock className='size-icon-sm' />
								<span>
									{t('rlResetIn')}{' '}
									<strong className='text-text'>{t('rlHours', { count: hoursUntilReset })}</strong>
								</span>
							</div>
							<motion.button
								onClick={onClose}
								whileHover={BUTTON_HOVER}
								whileTap={BUTTON_TAP}
								className='w-full rounded-xl bg-gradient-xp py-3.5 font-bold text-white'
							>
								{t('rlOkay')}
							</motion.button>
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</Portal>
	)
}

// ============================================

interface AccountRestrictedNoticeProps {
	violation: ViolationDetails
	onAppeal: () => void
	onDismiss: () => void
}

export const AccountRestrictedNotice = ({
	violation,
	onAppeal,
	onDismiss,
}: AccountRestrictedNoticeProps) => {
	const t = useTranslations('report')
	const isPermanent = violation.restrictionDays === 'permanent'
	const offenseLabels = [
		t('ar1st'),
		t('ar2nd'),
		t('ar3rd'),
		t('ar4th'),
	]

	return (
		<div className='mx-auto max-w-modal-lg overflow-hidden rounded-2xl bg-bg-card'>
			{/* Header */}
			<div
				className={cn(
					'flex flex-col items-center gap-4 p-8 text-center',
					isPermanent
						? 'bg-gradient-to-br from-error/20 to-error/10'
						: 'bg-gradient-to-br from-warning/15 to-error/10',
				)}
			>
				<div
					className={cn(
						'flex size-thumbnail-lg items-center justify-center rounded-full',
						isPermanent
							? 'bg-error/15 text-error'
							: 'bg-warning/15 text-warning',
					)}
				>
					{isPermanent ? (
						<Ban className='size-9' />
					) : (
						<AlertTriangle className='size-9' />
					)}
				</div>
				<h2 className='text-2xl font-extrabold'>
					{isPermanent ? t('arBanned') : t('arRestricted')}
				</h2>
			</div>

			{/* Body */}
			<div className='p-6'>
				<p className='mb-5 text-base leading-relaxed text-text-muted'>
					{isPermanent ? t('arBannedDesc') : t('arRestrictedDesc')}
				</p>

				{/* Violation Details */}
				<div className='mb-5 rounded-2xl bg-bg-elevated p-4'>
					<div className='flex justify-between border-b border-border py-2.5'>
						<span className='text-sm text-text-muted'>{t('arViolationType')}</span>
						<span className='text-sm font-semibold'>{violation.type}</span>
					</div>
					<div className='flex justify-between border-b border-border py-2.5'>
						<span className='text-sm text-text-muted'>{t('arOffense')}</span>
						<span className='rounded-lg bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning'>
							{offenseLabels[Math.min(violation.offense - 1, 3)]}
						</span>
					</div>
					<div className='flex justify-between border-b border-border py-2.5'>
						<span className='text-sm text-text-muted'>{t('arRestrictionPeriod')}</span>
						<span className='text-sm font-semibold'>
							{isPermanent ? t('arPermanent') : t('arDays', { count: violation.restrictionDays })}
						</span>
					</div>
					{violation.endDate && (
						<div className='flex justify-between py-2.5'>
							<span className='text-sm text-text-muted'>{t('arEnds')}</span>
							<span className='text-sm font-semibold'>{violation.endDate}</span>
						</div>
					)}
				</div>

				{/* Effects */}
				{!isPermanent && (
					<div className='mb-5'>
						<h4 className='mb-3 text-sm font-bold'>
							{t('arCannotDo')}
						</h4>
						<ul className='space-y-2.5'>
							{[
								t('arNoPost'),
								t('arNoCook'),
								t('arNoXp'),
							].map(item => (
								<li
									key={item}
									className='flex items-center gap-2.5 text-sm text-error'
								>
									<X className='size-icon-sm' />
									<span>{item}</span>
								</li>
							))}
							<li className='flex items-center gap-2.5 text-sm text-success'>
								<CheckCircle className='size-icon-sm' />
								<span>{t('arCanView')}</span>
							</li>
						</ul>
					</div>
				)}

				{/* Escalation Warning */}
				{!isPermanent && (
					<div className='mb-5 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4'>
						<TrendingUp className='mt-0.5 size-5 flex-shrink-0 text-error' />
						<div className='flex flex-col gap-1'>
							<strong className='text-sm text-error'>
								{t('arEscalation')}
							</strong>
							<span className='text-sm text-text-muted'>
								{t('arEscalationDetail')}
							</span>
						</div>
					</div>
				)}
			</div>

			{/* Actions */}
			<div className='flex gap-3 px-6 pb-6'>
				<motion.button
					onClick={onAppeal}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex flex-1 items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated py-3.5 text-sm font-semibold text-text-muted'
				>
					<MessageCircle className='size-icon-sm' />
					{isPermanent ? t('arFinalAppeal') : t('arAppealDecision')}
				</motion.button>
				{!isPermanent && (
					<motion.button
						onClick={onDismiss}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='flex-1 rounded-xl bg-warning py-3.5 text-sm font-bold text-white'
					>
						{t('arUnderstand')}
					</motion.button>
				)}
			</div>
		</div>
	)
}

// ============================================
// APPEAL MODAL
// ============================================

interface AppealModalProps {
	isOpen: boolean
	onClose: () => void
	onSubmit: (appeal: string) => Promise<void>
	violation: ViolationDetails
}

export const AppealModal = ({
	isOpen,
	onClose,
	onSubmit,
	violation,
}: AppealModalProps) => {
	const t = useTranslations('report')
	const [appealText, setAppealText] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

	useEscapeKey(isOpen, onClose)

	const handleSubmit = async () => {
		if (!appealText.trim()) return

		setIsSubmitting(true)
		try {
			await onSubmit(appealText)
			setSubmitted(true)
		} finally {
			setIsSubmitting(false)
		}
	}

	const handleClose = () => {
		setAppealText('')
		setSubmitted(false)
		onClose()
	}

	return (
		<Portal>
			<AnimatePresence>
				{isOpen && (
					<motion.div
						variants={overlayVariants}
						initial='hidden'
						animate='visible'
						exit='hidden'
						onClick={handleClose}
						className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4'
					>
						<motion.div
							variants={modalVariants}
							initial='hidden'
							animate='visible'
							exit='exit'
							onClick={e => e.stopPropagation()}
							className='max-h-modal w-full max-w-modal-lg overflow-y-auto rounded-2xl bg-bg-card'
						>
							{submitted ? (
								// Submitted View
								<div className='p-10 text-center'>
									<motion.div
										initial={{ scale: 0 }}
										animate={{ scale: 1 }}
										transition={TRANSITION_BOUNCY}
										className='mx-auto mb-5 flex h-avatar-md w-avatar-md items-center justify-center rounded-full bg-success/10 text-success'
									>
										<CheckCircle className='size-9' />
									</motion.div>
									<h3 className='mb-3 text-xl font-extrabold'>
										{t('apSubmitted')}
									</h3>
									<p className='mb-6 leading-relaxed text-text-muted'>
										{t('apSubmittedDesc')}
									</p>

									{/* Status Card */}
									<div className='mb-6 rounded-2xl bg-bg-elevated p-5 text-left'>
										<div className='mb-4 flex items-center justify-between'>
											<span className='text-sm text-text-muted'>
												{t('apStatus')}
											</span>
											<span className='rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning'>
												{t('apUnderReview')}
											</span>
										</div>
										<div className='mb-4 flex items-center justify-center gap-2 text-sm text-text-muted'>
											<Clock className='size-4' />
											<span>
												{t('apEstimated')}{' '}
												<strong className='text-text'>{t('ap48Hours')}</strong>
											</span>
										</div>
									</div>

									<motion.button
										onClick={handleClose}
										whileHover={BUTTON_HOVER}
										whileTap={BUTTON_TAP}
										className='w-full rounded-xl bg-gradient-xp py-3.5 font-bold text-white'
									>
										{t('apGotIt')}
									</motion.button>
								</div>
							) : (
								// Appeal Form
								<>
									<div className='flex items-center justify-between border-b border-border p-7'>
										<h2 className='text-xl font-extrabold'>{t('apTitle')}</h2>
										<motion.button
											whileHover={ICON_BUTTON_HOVER}
											whileTap={ICON_BUTTON_TAP}
											onClick={handleClose}
											className='flex size-9 items-center justify-center rounded-lg bg-bg-elevated text-text-muted hover:text-text'
											aria-label={t('apCloseAriaLabel')}
										>
											<X className='size-5' />
										</motion.button>
									</div>{' '}
									<div className='p-7'>
										{/* Context */}
										<div className='mb-5 rounded-xl bg-bg-elevated p-4'>
											<div className='flex justify-between border-b border-border py-2'>
												<span className='text-sm text-text-muted'>
													{t('apViolation')}
												</span>
												<span className='text-sm font-semibold'>
													{violation.type}
												</span>
											</div>
											<div className='flex justify-between py-2'>
												<span className='text-sm text-text-muted'>{t('apPenalty')}</span>
												<span className='text-sm font-semibold'>
													{violation.restrictionDays === 'permanent'
														? t('apPermBan')
														: t('apDayRestriction', { count: violation.restrictionDays })}
												</span>
											</div>
										</div>

										{/* Appeal Form */}
										<div className='mb-5'>
											<label className='mb-2.5 block text-sm font-bold'>
											{t('apWhyIncorrect')}
											</label>
											<textarea
												value={appealText}
												onChange={e =>
													setAppealText(e.target.value.slice(0, 1000))
												}
												placeholder={t('apPlaceholder')}
												className='min-h-textarea w-full resize-y rounded-xl border-2 border-transparent bg-bg-elevated p-4 text-sm leading-relaxed outline-none transition-colors focus:border-accent-purple'
											/>
											<div className='mt-2 text-right text-xs text-text-muted tabular-nums'>
												{appealText.length} / 1000
											</div>
										</div>

										{/* Guidelines */}
										<div className='mb-5 rounded-xl bg-bg-elevated p-4'>
											<h4 className='mb-2.5 text-sm font-bold'>
											{t('apGuidelines')}
										</h4>
										<ul className='space-y-1.5 text-sm text-text-muted'>
											<li>• {t('apGuide1')}</li>
											<li>• {t('apGuide2')}</li>
											<li>• {t('apGuide3')}</li>
											<li>• {t('apGuide4')}</li>
											<li>• {t('apGuide5')}</li>
											</ul>
										</div>

										{/* Actions */}
										<div className='flex gap-3'>
											<motion.button
												onClick={handleClose}
												whileHover={BUTTON_HOVER}
												whileTap={BUTTON_TAP}
												className='flex-1 rounded-xl border border-border bg-bg-elevated py-3.5 text-sm font-semibold text-text-muted'
											>
											{t('apCancel')}
											</motion.button>
											<motion.button
												onClick={handleSubmit}
												disabled={!appealText.trim() || isSubmitting}
												whileHover={
													appealText.trim() && !isSubmitting ? { y: -2 } : {}
												}
												whileTap={
													appealText.trim() && !isSubmitting
														? { scale: 0.98 }
														: {}
												}
												className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-xp py-3.5 text-sm font-bold text-white disabled:opacity-50'
											>
												{isSubmitting ? (
													<Loader2 className='size-icon-sm animate-spin' />
												) : (
													<>
														<Send className='size-icon-sm' />
													<span>{t('apSubmit')}</span>
													</>
												)}
											</motion.button>
										</div>
									</div>
								</>
							)}
						</motion.div>
					</motion.div>
				)}
			</AnimatePresence>
		</Portal>
	)
}

// ============================================
// CONTENT REMOVED NOTICE
// ============================================

interface ContentRemovedNoticeProps {
	violationType: string
	contentTitle: string
	contentDate: string
	thumbnailUrl?: string
	onLearnGuidelines: () => void
	onDismiss: () => void
}

export const ContentRemovedNotice = ({
	violationType,
	contentTitle,
	contentDate,
	thumbnailUrl,
	onLearnGuidelines,
	onDismiss,
}: ContentRemovedNoticeProps) => {
	const t = useTranslations('report')
	return (
		<div className='max-w-modal-md overflow-hidden rounded-xl border border-error/20 bg-bg-card'>
			{/* Header */}
			<div className='flex items-center gap-2.5 bg-error/10 px-5 py-4 font-bold text-error'>
				<Trash2 className='size-5' />
				<span>{t('crTitle')}</span>
			</div>

			{/* Body */}
			<div className='p-5'>
				<p className='mb-3.5 text-sm text-text-muted'>
					{t('crDescription')}
				</p>

				<div className='mb-4 inline-flex items-center gap-2 rounded-lg bg-bg-elevated px-4 py-2.5 text-sm font-semibold text-error'>
					<AlertCircle className='size-4' />
					<span>{violationType}</span>
				</div>

				{/* Content Preview */}
				<div className='mb-3.5 flex items-center gap-3.5 rounded-xl bg-bg-elevated p-3.5'>
					{thumbnailUrl && (
						<div className='relative size-thumbnail-md overflow-hidden rounded-lg opacity-50'>
							<Image
								src={thumbnailUrl}
								alt={`Preview of reported content: ${contentTitle || 'content'}`}
								fill
								sizes='64px'
								className='object-cover'
							/>
						</div>
					)}
					<div className='flex flex-col gap-1'>
						<span className='text-sm font-semibold'>{contentTitle}</span>
						<span className='text-xs text-text-muted'>{contentDate}</span>
					</div>
				</div>

				<p className='rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning'>
					{t('crRepeatedWarning')}
				</p>
			</div>

			{/* Actions */}
			<div className='flex gap-2.5 border-t border-border px-5 py-4'>
				<motion.button
					onClick={onLearnGuidelines}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex-1 rounded-lg border border-border py-3 text-sm font-semibold text-text-muted'
				>
					{t('crLearnGuidelines')}
				</motion.button>
				<motion.button
					onClick={onDismiss}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex-1 rounded-lg bg-bg-elevated py-3 text-sm font-semibold'
				>
					{t('crDismiss')}
				</motion.button>
			</div>
		</div>
	)
}
