'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
import {
	TRANSITION_SPRING,
	TRANSITION_SMOOTH,
	TRANSITION_BOUNCY,
	BUTTON_HOVER,
	BUTTON_TAP,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
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

interface ReportedContent {
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
	exit: { opacity: 0, y: 50, scale: 0.95, transition: { duration: 0.2 } },
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

const reportReasons: { value: ReportReason; title: string; desc: string }[] = [
	{
		value: 'spam',
		title: 'Spam or misleading',
		desc: 'Fake content, scams, or repetitive posts',
	},
	{
		value: 'inappropriate',
		title: 'Inappropriate content',
		desc: 'Not suitable for all audiences',
	},
	{
		value: 'harassment',
		title: 'Harassment or bullying',
		desc: 'Targeting or attacking users',
	},
	{
		value: 'fraud',
		title: 'Gaming/Fraud',
		desc: 'Fake cooking sessions, XP manipulation',
	},
	{
		value: 'copyright',
		title: 'Copyright violation',
		desc: 'Stolen recipes or content',
	},
	{ value: 'other', title: 'Other', desc: 'Something else not listed above' },
]

export const ReportModal = ({
	isOpen,
	onClose,
	onSubmit,
	content,
}: ReportModalProps) => {
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

	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					onClick={handleClose}
					className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'
				>
					<motion.div
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						onClick={e => e.stopPropagation()}
						className='max-h-[90vh] w-full max-w-modal-lg overflow-y-auto rounded-3xl bg-panel-bg'
					>
						{submitted ? (
							// Confirmation View
							<div className='p-10 text-center'>
								<motion.div
									initial={{ scale: 0 }}
									animate={{ scale: 1 }}
									transition={TRANSITION_BOUNCY}
									className='mx-auto mb-5 flex size-thumbnail-lg items-center justify-center rounded-full bg-success/10 text-success'
								>
									<CheckCircle className='h-9 w-9' />
								</motion.div>
								<h3 className='mb-3 text-xl font-extrabold'>
									Report Submitted
								</h3>
								<p className='mb-6 leading-relaxed text-text-muted'>
									Thanks for helping keep ChefKix safe. Our team will review
									this content within 24 hours.
								</p>
								<div className='mb-6 rounded-2xl bg-bg-elevated p-5 text-left'>
									<h4 className='mb-3 text-sm font-bold'>What happens next?</h4>
									<ul className='space-y-2 text-sm text-text-muted'>
										<li>• AI moderators will review immediately</li>
										<li>• If flagged, human moderators will take action</li>
										<li>• We&apos;ll notify you if action is taken</li>
									</ul>
								</div>
								<motion.button
									onClick={handleClose}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='w-full rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 py-3.5 font-bold text-white'
								>
									Done
								</motion.button>
							</div>
						) : (
							// Report Form
							<>
								<div className='flex items-center justify-between border-b border-border p-7'>
									<h2 className='text-xl font-extrabold'>Report Content</h2>
									<motion.button
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										onClick={handleClose}
										className='flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-text-muted hover:text-text'
									>
										<X className='h-5 w-5' />
									</motion.button>
								</div>{' '}
								<div className='p-7'>
									{/* Content Preview */}
									<div className='mb-6 flex items-center gap-3.5 rounded-xl bg-bg-elevated px-4 py-3.5'>
										<div className='relative h-12 w-12 overflow-hidden rounded-full'>
											<Image
												src={content.author.avatarUrl}
												alt={content.author.username}
												fill
												className='object-cover'
											/>
										</div>
										<div>
											<div className='font-bold'>
												@{content.author.username}
											</div>
											<div className='text-sm text-text-muted capitalize'>
												{content.type}
											</div>
										</div>
									</div>

									{/* Reasons */}
									<div className='mb-5'>
										<h3 className='mb-3.5 text-sm font-bold'>
											Why are you reporting this?
										</h3>
										<div className='flex flex-col gap-2.5'>
											{reportReasons.map(reason => (
												<label
													key={reason.value}
													className={cn(
														'flex cursor-pointer items-start gap-3.5 rounded-xl border-2 border-transparent bg-bg-elevated p-4 transition-all',
														selectedReason === reason.value
															? 'border-purple-500 bg-purple-500/10'
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
															'mt-0.5 flex size-icon-md flex-shrink-0 items-center justify-center rounded-full border-2',
															selectedReason === reason.value
																? 'border-purple-500'
																: 'border-border',
														)}
													>
														{selectedReason === reason.value && (
															<div className='h-2.5 w-2.5 rounded-full bg-purple-500' />
														)}
													</div>
													<div className='flex flex-col gap-1'>
														<span className='font-semibold'>
															{reason.title}
														</span>
														<span className='text-sm text-text-muted'>
															{reason.desc}
														</span>
													</div>
												</label>
											))}
										</div>
									</div>

									{/* Additional Details */}
									<div className='mb-5'>
										<h3 className='mb-2 text-sm font-bold'>
											Additional details (optional)
										</h3>
										<textarea
											value={details}
											onChange={e => setDetails(e.target.value)}
											placeholder="Provide more context about why you're reporting this content..."
											className='min-h-textarea w-full resize-y rounded-xl border-2 border-transparent bg-bg-elevated p-4 text-sm leading-relaxed outline-none transition-colors focus:border-purple-500'
										/>
									</div>

									{/* Trust Signal */}
									<div className='mb-5 flex items-start gap-2.5 rounded-xl bg-purple-500/10 p-4'>
										<Shield className='mt-0.5 size-icon-sm flex-shrink-0 text-purple-500' />
										<span className='text-sm leading-relaxed text-text-muted'>
											Reports are reviewed within 24 hours. False reports may
											affect your account.
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
										className='flex w-full items-center justify-center gap-2.5 rounded-xl bg-error py-4 font-bold text-white disabled:opacity-50'
									>
										{isSubmitting ? (
											<Loader2 className='size-icon-sm animate-spin' />
										) : (
											<>
												<Flag className='size-icon-sm' />
												<span>Submit Report</span>
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
	)
}

// ============================================
// REPORT LIMIT MODAL
// ============================================

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
	return (
		<AnimatePresence>
			{isOpen && (
				<motion.div
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					onClick={onClose}
					className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'
				>
					<motion.div
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						onClick={e => e.stopPropagation()}
						className='w-full max-w-modal-sm rounded-3xl bg-panel-bg p-7 text-center'
					>
						<div className='mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-warning/10 text-warning'>
							<AlertCircle className='h-8 w-8' />
						</div>
						<h3 className='mb-3 text-xl font-extrabold'>
							Daily Report Limit Reached
						</h3>
						<p className='mb-5 text-sm leading-relaxed text-text-muted'>
							You&apos;ve submitted 3 reports today. This limit helps prevent
							abuse and ensures quality reviews.
						</p>
						<div className='mb-5 flex items-center justify-center gap-2 rounded-lg bg-bg-elevated p-3 text-sm text-text-muted'>
							<Clock className='size-icon-sm' />
							<span>
								Limit resets in{' '}
								<strong className='text-text'>{hoursUntilReset} hours</strong>
							</span>
						</div>
						<motion.button
							onClick={onClose}
							whileHover={BUTTON_HOVER}
							whileTap={BUTTON_TAP}
							className='w-full rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 py-3.5 font-bold text-white'
						>
							Okay
						</motion.button>
					</motion.div>
				</motion.div>
			)}
		</AnimatePresence>
	)
}

// ============================================
// ACCOUNT RESTRICTED NOTICE
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
	const isPermanent = violation.restrictionDays === 'permanent'
	const offenseLabels = [
		'1st Offense',
		'2nd Offense',
		'3rd Offense',
		'4th+ Offense',
	]

	return (
		<div className='mx-auto max-w-modal-lg overflow-hidden rounded-3xl bg-panel-bg'>
			{/* Header */}
			<div
				className={cn(
					'flex flex-col items-center gap-4 p-8 text-center',
					isPermanent
						? 'bg-gradient-to-br from-error/20 to-red-900/10'
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
						<Ban className='h-9 w-9' />
					) : (
						<AlertTriangle className='h-9 w-9' />
					)}
				</div>
				<h2 className='text-2xl font-extrabold'>
					{isPermanent ? 'Account Permanently Banned' : 'Account Restricted'}
				</h2>
			</div>

			{/* Body */}
			<div className='p-6'>
				<p className='mb-5 text-base leading-relaxed text-text-muted'>
					Your account has been{' '}
					{isPermanent ? 'permanently banned' : 'temporarily restricted'} due to
					violation of our community guidelines.
				</p>

				{/* Violation Details */}
				<div className='mb-5 rounded-2xl bg-bg-elevated p-4'>
					<div className='flex justify-between border-b border-border py-2.5'>
						<span className='text-sm text-text-muted'>Violation Type</span>
						<span className='text-sm font-semibold'>{violation.type}</span>
					</div>
					<div className='flex justify-between border-b border-border py-2.5'>
						<span className='text-sm text-text-muted'>Offense</span>
						<span className='rounded-lg bg-warning/10 px-2.5 py-1 text-xs font-semibold text-warning'>
							{offenseLabels[Math.min(violation.offense - 1, 3)]}
						</span>
					</div>
					<div className='flex justify-between border-b border-border py-2.5'>
						<span className='text-sm text-text-muted'>Restriction Period</span>
						<span className='text-sm font-semibold'>
							{isPermanent ? 'Permanent' : `${violation.restrictionDays} days`}
						</span>
					</div>
					{violation.endDate && (
						<div className='flex justify-between py-2.5'>
							<span className='text-sm text-text-muted'>Restriction Ends</span>
							<span className='text-sm font-semibold'>{violation.endDate}</span>
						</div>
					)}
				</div>

				{/* Effects */}
				{!isPermanent && (
					<div className='mb-5'>
						<h4 className='mb-3 text-sm font-bold'>
							During this restriction, you cannot:
						</h4>
						<ul className='space-y-2.5'>
							{[
								'Create posts or comments',
								'Complete cooking sessions',
								'Earn or accumulate XP',
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
								<span>View content and browse</span>
							</li>
						</ul>
					</div>
				)}

				{/* Escalation Warning */}
				{!isPermanent && (
					<div className='mb-5 flex items-start gap-3 rounded-xl border border-error/20 bg-error/10 p-4'>
						<TrendingUp className='mt-0.5 h-5 w-5 flex-shrink-0 text-error' />
						<div className='flex flex-col gap-1'>
							<strong className='text-sm text-error'>
								Future violations will have longer restrictions:
							</strong>
							<span className='text-sm text-text-muted'>
								2nd: 7 days • 3rd: 14 days • 4th: Permanent ban
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
					{isPermanent ? 'Submit Final Appeal' : 'Appeal Decision'}
				</motion.button>
				{!isPermanent && (
					<motion.button
						onClick={onDismiss}
						whileHover={BUTTON_HOVER}
						whileTap={BUTTON_TAP}
						className='flex-1 rounded-xl bg-warning py-3.5 text-sm font-bold text-white'
					>
						I Understand
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
	const [appealText, setAppealText] = useState('')
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [submitted, setSubmitted] = useState(false)

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
		<AnimatePresence>
			{isOpen && (
				<motion.div
					variants={overlayVariants}
					initial='hidden'
					animate='visible'
					exit='hidden'
					onClick={handleClose}
					className='fixed inset-0 z-modal flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm'
				>
					<motion.div
						variants={modalVariants}
						initial='hidden'
						animate='visible'
						exit='exit'
						onClick={e => e.stopPropagation()}
						className='max-h-[90vh] w-full max-w-modal-lg overflow-y-auto rounded-3xl bg-panel-bg'
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
									<CheckCircle className='h-9 w-9' />
								</motion.div>
								<h3 className='mb-3 text-xl font-extrabold'>
									Appeal Submitted
								</h3>
								<p className='mb-6 leading-relaxed text-text-muted'>
									Your appeal has been received. Our moderation team will review
									it within 48 hours.
								</p>

								{/* Status Card */}
								<div className='mb-6 rounded-2xl bg-bg-elevated p-5 text-left'>
									<div className='mb-4 flex items-center justify-between'>
										<span className='text-sm text-text-muted'>
											Appeal Status
										</span>
										<span className='rounded-lg bg-warning/10 px-3 py-1.5 text-xs font-bold text-warning'>
											Under Review
										</span>
									</div>
									<div className='mb-4 flex items-center justify-center gap-2 text-sm text-text-muted'>
										<Clock className='h-4 w-4' />
										<span>
											Estimated decision:{' '}
											<strong className='text-text'>~48 hours</strong>
										</span>
									</div>
								</div>

								<motion.button
									onClick={handleClose}
									whileHover={BUTTON_HOVER}
									whileTap={BUTTON_TAP}
									className='w-full rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 py-3.5 font-bold text-white'
								>
									Got It
								</motion.button>
							</div>
						) : (
							// Appeal Form
							<>
								<div className='flex items-center justify-between border-b border-border p-7'>
									<h2 className='text-xl font-extrabold'>Appeal Decision</h2>
									<motion.button
										whileHover={ICON_BUTTON_HOVER}
										whileTap={ICON_BUTTON_TAP}
										onClick={handleClose}
										className='flex h-9 w-9 items-center justify-center rounded-lg bg-bg-elevated text-text-muted hover:text-text'
									>
										<X className='h-5 w-5' />
									</motion.button>
								</div>{' '}
								<div className='p-7'>
									{/* Context */}
									<div className='mb-5 rounded-xl bg-bg-elevated p-4'>
										<div className='flex justify-between border-b border-border py-2'>
											<span className='text-sm text-text-muted'>Violation</span>
											<span className='text-sm font-semibold'>
												{violation.type}
											</span>
										</div>
										<div className='flex justify-between py-2'>
											<span className='text-sm text-text-muted'>Penalty</span>
											<span className='text-sm font-semibold'>
												{violation.restrictionDays === 'permanent'
													? 'Permanent ban'
													: `${violation.restrictionDays} day restriction`}
											</span>
										</div>
									</div>

									{/* Appeal Form */}
									<div className='mb-5'>
										<label className='mb-2.5 block text-sm font-bold'>
											Why do you believe this decision was incorrect?
										</label>
										<textarea
											value={appealText}
											onChange={e =>
												setAppealText(e.target.value.slice(0, 1000))
											}
											placeholder='Explain your side of the situation. Provide any context or evidence that might help us review your case...'
											className='min-h-textarea w-full resize-y rounded-xl border-2 border-transparent bg-bg-elevated p-4 text-sm leading-relaxed outline-none transition-colors focus:border-purple-500'
										/>
										<div className='mt-2 text-right text-xs text-text-muted'>
											{appealText.length} / 1000
										</div>
									</div>

									{/* Guidelines */}
									<div className='mb-5 rounded-xl bg-bg-elevated p-4'>
										<h4 className='mb-2.5 text-sm font-bold'>
											Appeal Guidelines
										</h4>
										<ul className='space-y-1.5 text-sm text-text-muted'>
											<li>• Be honest and respectful in your appeal</li>
											<li>• Provide specific details about the situation</li>
											<li>• Include any evidence that supports your case</li>
											<li>• Appeals are reviewed within 48 hours</li>
											<li>• You can only submit one appeal per violation</li>
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
											Cancel
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
											className='flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-violet-500 py-3.5 text-sm font-bold text-white disabled:opacity-50'
										>
											{isSubmitting ? (
												<Loader2 className='size-icon-sm animate-spin' />
											) : (
												<>
													<Send className='size-icon-sm' />
													<span>Submit Appeal</span>
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
	return (
		<div className='max-w-modal-md overflow-hidden rounded-xl border border-error/20 bg-panel-bg'>
			{/* Header */}
			<div className='flex items-center gap-2.5 bg-error/10 px-5 py-4 font-bold text-error'>
				<Trash2 className='h-5 w-5' />
				<span>Content Removed</span>
			</div>

			{/* Body */}
			<div className='p-5'>
				<p className='mb-3.5 text-sm text-text-muted'>
					Your post was removed for violating our community guidelines:
				</p>

				<div className='mb-4 inline-flex items-center gap-2 rounded-lg bg-bg-elevated px-4 py-2.5 text-sm font-semibold text-error'>
					<AlertCircle className='h-4 w-4' />
					<span>{violationType}</span>
				</div>

				{/* Content Preview */}
				<div className='mb-3.5 flex items-center gap-3.5 rounded-xl bg-bg-elevated p-3.5'>
					{thumbnailUrl && (
						<div className='relative size-thumbnail-md overflow-hidden rounded-lg opacity-50'>
							<Image src={thumbnailUrl} alt='' fill className='object-cover' />
						</div>
					)}
					<div className='flex flex-col gap-1'>
						<span className='text-sm font-semibold'>{contentTitle}</span>
						<span className='text-xs text-text-muted'>{contentDate}</span>
					</div>
				</div>

				<p className='rounded-lg bg-warning/10 p-3 text-sm font-semibold text-warning'>
					Repeated violations may result in account restrictions.
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
					Learn About Guidelines
				</motion.button>
				<motion.button
					onClick={onDismiss}
					whileHover={BUTTON_HOVER}
					whileTap={BUTTON_TAP}
					className='flex-1 rounded-lg bg-bg-elevated py-3 text-sm font-semibold'
				>
					Dismiss
				</motion.button>
			</div>
		</div>
	)
}
