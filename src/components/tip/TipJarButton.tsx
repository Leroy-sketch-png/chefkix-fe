'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Heart, Loader2, X, DollarSign, Send } from 'lucide-react'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { toast } from 'sonner'
import { getCreatorTipSettings, sendTip } from '@/services/tips'
import { CreatorTipSettings } from '@/lib/types/tips'
import { Portal } from '@/components/ui/portal'
import { BUTTON_HOVER, BUTTON_TAP, BUTTON_SUBTLE_HOVER, BUTTON_SUBTLE_TAP, TRANSITION_SPRING } from '@/lib/motion'
import { cn } from '@/lib/utils'

interface TipJarButtonProps {
	creatorId: string
	creatorName: string
	recipeId?: string
	/** 'recipe' = large icon button, 'profile' = small avatar-sized button */
	variant?: 'recipe' | 'profile'
}

export function TipJarButton({
	creatorId,
	creatorName,
	recipeId,
	variant = 'recipe',
}: TipJarButtonProps) {
	const [settings, setSettings] = useState<CreatorTipSettings | null>(null)
	const [loaded, setLoaded] = useState(false)
	const [showModal, setShowModal] = useState(false)
	const [selectedAmount, setSelectedAmount] = useState<number | null>(null)
	const [customAmount, setCustomAmount] = useState('')
	const [message, setMessage] = useState('')
	const [isSending, setIsSending] = useState(false)
	const focusTrapRef = useFocusTrap<HTMLDivElement>(showModal)

	useEffect(() => {
		getCreatorTipSettings(creatorId)
			.then(s => {
				setSettings(s)
				setLoaded(true)
			})
			.catch(() => setLoaded(true))
	}, [creatorId])

	// Don't render if tips not enabled or settings not loaded
	if (!loaded || !settings || !settings.tipsEnabled) return null

	const amounts = settings.suggestedAmounts ?? [1, 3, 5]

	const effectiveAmountCents = selectedAmount
		? selectedAmount * 100
		: customAmount
			? Math.round(parseFloat(customAmount) * 100)
			: 0

	const handleSend = async () => {
		if (effectiveAmountCents <= 0) {
			toast.error('Please select or enter a tip amount')
			return
		}
		setIsSending(true)
		try {
			await sendTip({
				creatorId,
				recipeId,
				amountCents: effectiveAmountCents,
				message: message.trim() || undefined,
			})
			toast.success(
				settings.payoutAccountId
					? (settings.thankYouMessage || `Thanks for supporting ${creatorName}!`)
					: `Tip recorded! ${creatorName} will receive it once payouts are live.`,
			)
			setShowModal(false)
			setSelectedAmount(null)
			setCustomAmount('')
			setMessage('')
		} catch {
			toast.error('Failed to send tip. Please try again.')
		} finally {
			setIsSending(false)
		}
	}

	const isRecipe = variant === 'recipe'

	return (
		<>
			<motion.button
				onClick={() => setShowModal(true)}
				whileHover={BUTTON_HOVER}
				whileTap={BUTTON_TAP}
				className={cn(
					'transition-colors',
					isRecipe
						? 'grid size-14 place-items-center rounded-xl border-2 border-border-medium hover:border-brand hover:bg-brand/10'
						: 'flex h-avatar-sm w-avatar-sm items-center justify-center rounded-lg border border-border bg-bg-elevated text-text-muted hover:bg-brand/10 hover:text-brand hover:border-brand/30',
				)}
				title={`Tip ${creatorName}`}
				aria-label={`Send a tip to ${creatorName}`}
			>
				<DollarSign className={isRecipe ? 'size-5' : 'size-4'} />
			</motion.button>

			<AnimatePresence>
				{showModal && (
					<Portal>
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='fixed inset-0 z-modal flex items-center justify-center bg-black/50 p-4'
							onClick={() => setShowModal(false)}
						>
							<motion.div							ref={focusTrapRef}
							role='dialog'
							aria-labelledby='tip-jar-title'
							aria-modal='true'								initial={{ opacity: 0, scale: 0.9, y: 20 }}
								animate={{ opacity: 1, scale: 1, y: 0 }}
								exit={{ opacity: 0, scale: 0.9, y: 20 }}
								transition={TRANSITION_SPRING}
								className='relative w-full max-w-sm rounded-2xl border border-border bg-bg-card p-6 shadow-warm'
								onClick={e => e.stopPropagation()}
							>
								{/* Close */}
								<button
									type='button'
									onClick={() => setShowModal(false)}
									className='absolute right-4 top-4 text-text-muted hover:text-text'
									aria-label='Close'
								>
									<X className='size-5' />
								</button>

								{/* Header */}
								<div className='mb-4 text-center'>
									<div className='mx-auto mb-2 grid size-12 place-items-center rounded-full bg-brand/10'>
										<Heart className='size-6 text-brand' />
									</div>
									<h3 id='tip-jar-title' className='text-lg font-bold text-text'>
										Support {creatorName}
									</h3>
									<p className='mt-1 text-sm text-text-secondary'>
										Show appreciation for this recipe
									</p>
								</div>

								{/* Amounts */}
								<div className='mb-4 flex justify-center gap-3'>
									{amounts.map(amt => (
										<motion.button
											key={amt}
										whileHover={BUTTON_SUBTLE_HOVER}
										whileTap={BUTTON_SUBTLE_TAP}
											onClick={() => {
												setSelectedAmount(
													selectedAmount === amt ? null : amt,
												)
												setCustomAmount('')
											}}
											className={cn(
												'rounded-xl px-5 py-3 text-base font-bold transition-all',
												selectedAmount === amt
													? 'bg-brand text-white shadow-glow'
													: 'border border-border bg-bg-elevated text-text hover:border-brand/50',
											)}
										>
											${amt}
										</motion.button>
									))}
								</div>

								{/* Custom amount */}
								<div className='mb-4'>
									<input
										type='number'
										min='0.50'
										step='0.50'
										placeholder='Custom amount ($)'
										value={customAmount}
										onChange={e => {
											setCustomAmount(e.target.value)
											setSelectedAmount(null)
										}}
										className='w-full rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
									/>
								</div>

								{/* Message */}
								<div className='mb-4'>
									<textarea
										placeholder='Add a message (optional)'
										value={message}
										onChange={e => setMessage(e.target.value)}
										maxLength={200}
										rows={2}
										className='w-full resize-none rounded-lg border border-border bg-bg-elevated px-4 py-2.5 text-sm text-text placeholder:text-text-muted focus:border-brand focus:outline-none'
									/>
								</div>

								{/* Send Button */}
								<motion.button
									onClick={handleSend}
									disabled={
										isSending || effectiveAmountCents <= 0
									}
									whileHover={
										effectiveAmountCents > 0 && !isSending
											? BUTTON_HOVER
											: undefined
									}
									whileTap={
										effectiveAmountCents > 0 && !isSending
											? BUTTON_TAP
											: undefined
									}
									className={cn(
										'flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-base font-bold transition-all',
										effectiveAmountCents > 0
											? 'bg-brand text-white hover:bg-brand/90'
											: 'cursor-not-allowed bg-border text-text-muted',
									)}
								>
									{isSending ? (
										<Loader2 className='size-5 animate-spin' />
									) : (
										<>
											<Send className='size-5' />
											{effectiveAmountCents > 0
												? `Send $${(effectiveAmountCents / 100).toFixed(2)}`
												: 'Select an amount'}
										</>
									)}
								</motion.button>

								{/* Payment note */}
								<p className='mt-3 text-center text-xs text-text-muted'>
									{settings.payoutAccountId
										? 'Tips are processed securely via our payment provider.'
										: 'Payment processing coming soon. Your tip will be recorded and the creator will be notified when payouts go live.'}
								</p>
							</motion.div>
						</motion.div>
					</Portal>
				)}
			</AnimatePresence>
		</>
	)
}
