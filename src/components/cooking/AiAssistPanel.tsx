'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import { Portal } from '@/components/ui/portal'
import { Sparkles, Send, X, Lightbulb } from 'lucide-react'
import { askCookingAssistant } from '@/services/ai'
import type { CookingAssistantResponse } from '@/services/ai'
import { cn } from '@/lib/utils'
import { useFocusTrap } from '@/hooks/useFocusTrap'
import { TRANSITION_SPRING } from '@/lib/motion'

interface AiAssistPanelProps {
	isOpen: boolean
	onClose: () => void
	recipeTitle: string
	currentStep: string
	stepNumber: number
}

export function AiAssistPanel({
	isOpen,
	onClose,
	recipeTitle,
	currentStep,
	stepNumber,
}: AiAssistPanelProps) {
	const t = useTranslations('cooking')
	const [query, setQuery] = useState('')
	const [isLoading, setIsLoading] = useState(false)
	const [result, setResult] = useState<CookingAssistantResponse | null>(null)
	const [error, setError] = useState<string | null>(null)
	const inputRef = useRef<HTMLInputElement>(null)
	const panelRef = useFocusTrap<HTMLDivElement>(isOpen)

	// Focus input when panel opens
	useEffect(() => {
		if (!isOpen) return
		const id = setTimeout(() => inputRef.current?.focus(), 100)
		return () => clearTimeout(id)
	}, [isOpen])

	// Close on Escape
	useEffect(() => {
		if (!isOpen) return
		const handleEsc = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		window.addEventListener('keydown', handleEsc)
		return () => window.removeEventListener('keydown', handleEsc)
	}, [isOpen, onClose])

	const handleAsk = async () => {
		const trimmed = query.trim()
		if (!trimmed || isLoading) return

		setIsLoading(true)
		setError(null)

		const context = `Recipe: ${recipeTitle}\nCurrent Step ${stepNumber}: ${currentStep}`

		try {
			const response = await askCookingAssistant(trimmed, context)
			if (response.success && response.data) {
				setResult(response.data)
			} else {
				setError(response.message || t('aiCouldNotRespond'))
			}
		} catch {
			setError(t('aiUnavailable'))
		} finally {
			setIsLoading(false)
		}
	}

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault()
			handleAsk()
		}
	}

	const handleNewQuestion = () => {
		setQuery('')
		setResult(null)
		setError(null)
		setTimeout(() => inputRef.current?.focus(), 50)
	}

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					{/* Backdrop */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						exit={{ opacity: 0 }}
						onClick={onClose}
						className='fixed inset-0 z-modal bg-black/60'
					/>
					{/* Panel */}
					<motion.div
						ref={panelRef}
						initial={{ opacity: 0, y: 40, scale: 0.95 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						exit={{ opacity: 0, y: 40, scale: 0.95 }}
						transition={TRANSITION_SPRING}
						onClick={e => e.stopPropagation()}
						className='fixed inset-x-4 bottom-4 z-modal mx-auto max-w-lg rounded-2xl border border-border-subtle bg-bg-card shadow-warm sm:inset-x-auto sm:bottom-8 sm:w-full'
					>
						{/* Header */}
						<div className='flex items-center justify-between border-b border-border-subtle px-5 py-3'>
							<div className='flex items-center gap-2'>
								<Sparkles className='size-5 text-brand' />
							<h3 className='font-semibold text-text'>{t('aiChefAssistant')}</h3>
							</div>
							<button
								type='button'
								onClick={onClose}
								aria-label='Close AI assistant'
								className='grid size-8 place-items-center rounded-full text-text-muted transition-colors hover:bg-bg-hover hover:text-text'
							>
								<X className='size-4' />
							</button>
						</div>

						{/* Body */}
						<div className='max-h-80 overflow-y-auto p-5'>
							{/* Context hint */}
							<p className='mb-3 text-xs text-text-muted'>
								{t('aiAskingAboutStep', { step: stepNumber, recipe: recipeTitle })}
							</p>

							{/* Result */}
							{result ? (
								<div className='space-y-4'>
									<div className='rounded-lg bg-bg-elevated p-4'>
										<p className='leading-relaxed text-text'>{result.answer}</p>
									</div>

									{result.tips.length > 0 && (
										<div className='space-y-2'>
											<h4 className='flex items-center gap-1.5 text-sm font-medium text-text-secondary'>
												<Lightbulb className='size-4 text-warning' />
												Tips
											</h4>
											<ul className='space-y-1.5'>
												{result.tips.map((tip, i) => (
													<li
														key={i}
														className='rounded-md bg-warning/5 px-3 py-2 text-sm text-text-secondary'
													>
														{tip}
													</li>
												))}
											</ul>
										</div>
									)}

									<button
										type='button'
										onClick={handleNewQuestion}
										className='text-sm font-medium text-brand transition-colors hover:text-brand-hover'
									>
										{t('aiAskAnother')}
									</button>
								</div>
							) : error ? (
								<div className='rounded-lg bg-error/10 p-4 text-sm text-error'>
									{error}
									<button
										type='button'
										onClick={handleNewQuestion}
										className='mt-2 block text-sm font-medium text-brand hover:text-brand-hover'
									>
										{t('aiTryAgain')}
									</button>
								</div>
							) : isLoading ? (
								<div className='flex flex-col items-center gap-3 py-8'>
									<div className='flex items-center gap-1.5'>
										{[0, 1, 2].map(i => (
											<motion.div
												key={i}
												className='size-2.5 rounded-full bg-brand'
												animate={{ y: [0, -8, 0], opacity: [0.5, 1, 0.5] }}
												transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
											/>
										))}
									</div>
									<p className='text-sm text-text-muted'>{t('aiThinking')}</p>
								</div>
							) : (
								<p className='py-4 text-center text-sm text-text-muted'>
									{t('aiEmptyPrompt')}
								</p>
							)}
						</div>

						{/* Input */}
						{!result && (
							<div className='border-t border-border-subtle px-5 py-3'>
								<div className='flex items-center gap-2'>
									<input
										ref={inputRef}
										type='text'
										value={query}
										onChange={e => setQuery(e.target.value)}
										onKeyDown={handleKeyDown}
										placeholder={t('aiInputPlaceholder')}
										disabled={isLoading}
										className='flex-1 rounded-lg bg-bg-elevated px-3 py-2 text-sm text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-brand/30'
									/>
									<button
										type='button'
										onClick={handleAsk}
										disabled={!query.trim() || isLoading}
										className={cn(
											'grid size-9 place-items-center rounded-lg transition-colors',
											query.trim() && !isLoading
												? 'bg-brand text-white hover:bg-brand-hover'
												: 'bg-bg-elevated text-text-muted',
										)}
									>
										<Send className='size-4' />
									</button>
								</div>
								<p className='mt-1.5 text-2xs text-text-muted'>
									<kbd className='rounded bg-bg-elevated px-1 py-0.5 font-mono'>
										Enter
									</kbd>{' '}
									to ask Â·{' '}
									<kbd className='rounded bg-bg-elevated px-1 py-0.5 font-mono'>
										Esc
									</kbd>{' '}
									to close
								</p>
							</div>
						)}
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
