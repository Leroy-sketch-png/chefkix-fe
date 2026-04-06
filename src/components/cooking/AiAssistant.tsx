'use client'

import { useState, useRef, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Sparkles,
	X,
	Send,
	Lightbulb,
	AlertTriangle,
	Mic,
	MicOff,
	Loader2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Portal } from '@/components/ui/portal'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import {
	TRANSITION_SPRING,
	TRANSITION_BOUNCY,
	AI_BUTTON_PULSE,
	CELEBRATION_MODAL,
	ICON_BUTTON_HOVER,
	ICON_BUTTON_TAP,
} from '@/lib/motion'
import { askCookingAssistant } from '@/services/ai'

// ============================================
// WEB SPEECH API (not in all TS lib versions)
// ============================================

interface SpeechRecognitionInstance {
	continuous: boolean
	interimResults: boolean
	lang: string
	onresult:
		| ((event: {
				results: { [i: number]: { [i: number]: { transcript: string } } }
		  }) => void)
		| null
	onerror: (() => void) | null
	onend: (() => void) | null
	start(): void
	stop(): void
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance

// ============================================
// TYPES
// ============================================

type MessageRole = 'user' | 'assistant'
type MessageType = 'text' | 'substitution' | 'technique' | 'warning' | 'tip'

interface Message {
	id: string
	role: MessageRole
	type: MessageType
	content: string
	timestamp: Date
	metadata?: {
		substitution?: {
			original: string
			replacement: string
			ratio?: string
		}
		confidence?: number
	}
}

interface QuickAction {
	id: string
	icon: React.ReactNode
	labelKey: string
	promptKey: string
}

interface AiAssistantProps {
	recipeId: string
	recipeTitle: string
	currentStep: number
	currentStepInstruction: string
	onClose: () => void
	isOpen: boolean
}

// ============================================
// CONSTANTS
// ============================================

const QUICK_ACTIONS: QuickAction[] = [
	{
		id: 'substitute',
		icon: <span>🔄</span>,
		labelKey: 'qaMissingIngredient',
		promptKey: 'qaMissingPrompt',
	},
	{
		id: 'technique',
		icon: <span>🔪</span>,
		labelKey: 'qaTechnique',
		promptKey: 'qaTechniquePrompt',
	},
	{
		id: 'timing',
		icon: <span>⏱️</span>,
		labelKey: 'qaDoneYet',
		promptKey: 'qaDonePrompt',
	},
	{
		id: 'troubleshoot',
		icon: <span>🆘</span>,
		labelKey: 'qaWentWrong',
		promptKey: 'qaWrongPrompt',
	},
]
// ============================================
// SUB-COMPONENTS
// ============================================

interface ChatMessageProps {
	message: Message
}

const ChatMessage = ({ message }: ChatMessageProps) => {
	const t = useTranslations('cooking')
	const isUser = message.role === 'user'

	return (
		<motion.div
			initial={{ opacity: 0, y: 10, scale: 0.95 }}
			animate={{ opacity: 1, y: 0, scale: 1 }}
			transition={TRANSITION_SPRING}
			className={cn('flex gap-2', isUser ? 'flex-row-reverse' : 'flex-row')}
		>
			{/* Avatar */}
			<div
				className={cn(
					'flex size-8 shrink-0 items-center justify-center rounded-full text-sm',
					isUser ? 'bg-brand text-white' : 'bg-gradient-indigo text-white',
				)}
			>
				{isUser ? '👤' : '✨'}
			</div>

			{/* Message content */}
			<div
				className={cn(
					'max-w-[80%] rounded-2xl px-4 py-2.5',
					isUser ? 'bg-brand text-white' : 'bg-bg-elevated text-text',
					message.type === 'warning' &&
						!isUser &&
						'border border-warning/30 bg-warning/10',
					message.type === 'tip' &&
						!isUser &&
						'border border-success/30 bg-success/10',
				)}
			>
				{/* Type indicator for special messages */}
				{message.type === 'warning' && (
					<div className='mb-1.5 flex items-center gap-1.5 text-warning'>
						<AlertTriangle className='size-4' />
						<span className='text-xs font-semibold uppercase'>{t('aiWarning')}</span>
					</div>
				)}
				{message.type === 'tip' && (
					<div className='mb-1.5 flex items-center gap-1.5 text-success'>
						<Lightbulb className='size-4' />
						<span className='text-xs font-semibold uppercase'>{t('aiProTip')}</span>
					</div>
				)}

				{/* Substitution card */}
				{message.type === 'substitution' && message.metadata?.substitution && (
					<div className='mb-2 rounded-lg bg-bg-card p-3'>
						<p className='text-xs font-medium uppercase text-text-tertiary'>
							Substitution
						</p>
						<div className='mt-1 flex items-center gap-2'>
							<span className='font-medium line-through opacity-60'>
								{message.metadata.substitution.original}
							</span>
							<span>→</span>
							<span className='font-bold text-success'>
								{message.metadata.substitution.replacement}
							</span>
						</div>
						{message.metadata.substitution.ratio && (
							<p className='mt-1 text-sm text-text-secondary'>
								{t('aiRatio', { ratio: message.metadata.substitution.ratio })}
							</p>
						)}
					</div>
				)}

				<p className='text-sm leading-relaxed'>{message.content}</p>
			</div>
		</motion.div>
	)
}

// Typing indicator
const TypingIndicator = () => (
	<motion.div
		initial={{ opacity: 0, scale: 0.8 }}
		animate={{ opacity: 1, scale: 1 }}
		exit={{ opacity: 0, scale: 0.8 }}
		className='flex gap-2'
	>
		<div className='flex size-8 items-center justify-center rounded-full bg-gradient-indigo text-white'>
			✨
		</div>
		<div className='flex items-center gap-1.5 rounded-2xl bg-bg-elevated px-4 py-3'>
			{[0, 1, 2].map(i => (
				<motion.div
					key={i}
					animate={{ y: [0, -4, 0] }}
					transition={{
						duration: 0.6,
						repeat: Infinity,
						delay: i * 0.15,
					}}
					className='size-2 rounded-full bg-text-tertiary'
				/>
			))}
		</div>
	</motion.div>
)

// ============================================
// FLOATING AI BUTTON
// ============================================

interface AiButtonProps {
	onClick: () => void
	hasUnreadSuggestion?: boolean
}

export const AiButton = ({ onClick, hasUnreadSuggestion }: AiButtonProps) => {
	const t = useTranslations('cooking')
	return (
	<motion.button
		type='button'
		onClick={onClick}
		whileHover={ICON_BUTTON_HOVER}
		whileTap={ICON_BUTTON_TAP}
		animate={hasUnreadSuggestion ? AI_BUTTON_PULSE.animate : undefined}
		className={cn(
			'fixed bottom-24 right-4 z-popover flex size-14 items-center justify-center rounded-full shadow-lg md:bottom-6 focus-visible:ring-2 focus-visible:ring-brand/50',
			'bg-gradient-indigo text-white',
		)}
		aria-label={t('ariaOpenAiAssistant')}
	>
		<Sparkles className='size-6' />
		{hasUnreadSuggestion && (
			<span className='absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-error text-xs font-bold'>
				1
			</span>
		)}
	</motion.button>
	)
}

// ============================================
// MAIN COMPONENT
// ============================================

export const AiAssistant = ({
	recipeId,
	recipeTitle,
	currentStep,
	currentStepInstruction,
	onClose,
	isOpen,
}: AiAssistantProps) => {
	const t = useTranslations('cooking')
	const [messages, setMessages] = useState<Message[]>([])
	const [inputValue, setInputValue] = useState('')
	const [isTyping, setIsTyping] = useState(false)
	const [isListening, setIsListening] = useState(false)
	const [speechSupported] = useState(
		() => 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window,
	)
	const recognitionRef = useRef<SpeechRecognitionInstance | null>(null)
	const messagesEndRef = useRef<HTMLDivElement>(null)
	const inputRef = useRef<HTMLInputElement>(null)

	useEscapeKey(isOpen, onClose)

	// Auto-scroll to bottom on new messages
	useEffect(() => {
		messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
	}, [messages, isTyping])

	// Focus input when opened
	useEffect(() => {
		if (!isOpen) return
		const id = setTimeout(() => inputRef.current?.focus(), 300)
		return () => clearTimeout(id)
	}, [isOpen])

	// Initial welcome message
	useEffect(() => {
		if (isOpen && messages.length === 0) {
			setMessages([
				{
					id: 'welcome',
					role: 'assistant',
					type: 'text',
					content: t('aiWelcome', { recipe: recipeTitle }),
					timestamp: new Date(),
				},
			])
		}
	}, [isOpen, recipeTitle, messages.length, t])

	const handleSend = async (prompt?: string) => {
		const text = prompt || inputValue.trim()
		if (!text) return

		// Add user message
		const userMessage: Message = {
			id: `user-${Date.now()}`,
			role: 'user',
			type: 'text',
			content: text,
			timestamp: new Date(),
		}
		setMessages(prev => [...prev, userMessage])
		setInputValue('')
		setIsTyping(true)

		try {
			// Build context string with step info
			const context = `Step ${currentStep}: ${currentStepInstruction}`
			const response = await askCookingAssistant(text, context)

			const aiResponse: Message = {
				id: `ai-${Date.now()}`,
				role: 'assistant',
				type: determineMessageType(text),
				content:
					response.success && response.data
						? response.data.answer
						: t('aiSorryRetry'),
				timestamp: new Date(),
				metadata: text.toLowerCase().includes('substitute')
					? {
							substitution: {
								original: 'ingredient',
								replacement: response.data?.tips?.[0] || 'alternative',
								ratio: 'See tips for details',
							},
						}
					: undefined,
			}
			setMessages(prev => [...prev, aiResponse])

			// Add tips as follow-up if available
			if (response.data?.tips && response.data.tips.length > 0) {
				const tipMessage: Message = {
					id: `tip-${Date.now()}`,
					role: 'assistant',
					type: 'tip',
					content: response.data.tips.join('\n• '),
					timestamp: new Date(),
				}
				setMessages(prev => [...prev, tipMessage])
			}
		} catch (error) {
			const errorResponse: Message = {
				id: `error-${Date.now()}`,
				role: 'assistant',
				type: 'warning',
				content:
					t('aiErrorReach'),
				timestamp: new Date(),
			}
			setMessages(prev => [...prev, errorResponse])
		} finally {
			setIsTyping(false)
		}
	}

	const handleQuickAction = (action: QuickAction) => {
		handleSend(t(action.promptKey))
	}

	const toggleListening = () => {
		if (!speechSupported) return

		if (isListening) {
			recognitionRef.current?.stop()
			setIsListening(false)
			return
		}

		const WebSpeech =
			(
				window as Window & {
					SpeechRecognition?: SpeechRecognitionConstructor
					webkitSpeechRecognition?: SpeechRecognitionConstructor
				}
			).SpeechRecognition ??
			(
				window as Window & {
					webkitSpeechRecognition?: SpeechRecognitionConstructor
				}
			).webkitSpeechRecognition
		if (!WebSpeech) return

		const recognition = new WebSpeech()
		recognition.continuous = false
		recognition.interimResults = false
		recognition.lang = 'en-US'

		recognition.onresult = event => {
			const transcript = event.results[0]?.[0]?.transcript
			if (transcript) {
				setInputValue(transcript)
				inputRef.current?.focus()
			}
		}

		recognition.onerror = () => {
			setIsListening(false)
		}

		recognition.onend = () => {
			setIsListening(false)
		}

		recognitionRef.current = recognition
		recognition.start()
		setIsListening(true)
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
						className='fixed inset-0 z-modal bg-black/50 backdrop-blur-sm'
					/>

					{/* Chat Panel */}
					<motion.div
						variants={CELEBRATION_MODAL}
						initial='hidden'
						animate='visible'
						exit='exit'
						className='fixed inset-x-4 bottom-4 top-20 z-modal mx-auto flex max-w-lg flex-col overflow-hidden rounded-2xl bg-bg-card shadow-xl md:inset-x-auto md:right-4 md:top-auto md:h-panel-xl md:max-h-modal-constrained'
					>
						{/* Header */}
						<div className='flex items-center justify-between border-b border-border bg-gradient-indigo p-4 text-white'>
							<div className='flex items-center gap-3'>
								<div className='flex size-10 items-center justify-center rounded-full bg-white/20'>
									<Sparkles className='size-5' />
								</div>
								<div>
									<h3 className='font-bold'>{t('aiCookingAssistant')}</h3>
									<p className='text-sm text-white/80'>
										{t('aiStepDot', { step: currentStep, recipe: recipeTitle })}
									</p>
								</div>
							</div>
							<div className='flex items-center gap-2'>
								<button
									type='button'
									onClick={onClose}
									aria-label={t('cpClose')}
									className='rounded-full p-2 text-white/80 transition-colors hover:bg-white/20 hover:text-white'
								>
									<X className='size-5' />
								</button>
							</div>
						</div>

						{/* Current step context */}
						<div className='border-b border-border bg-bg-elevated px-4 py-3'>
							<p className='text-xs font-medium uppercase text-text-tertiary'>
								{t('aiCurrentStep')}
							</p>
							<p className='mt-1 line-clamp-2 text-sm text-text-secondary'>
								{currentStepInstruction}
							</p>
						</div>

						{/* Messages */}
						<div className='flex-1 space-y-4 overflow-y-auto p-4'>
							<AnimatePresence>
								{messages.map(message => (
									<ChatMessage key={message.id} message={message} />
								))}
							</AnimatePresence>

							{isTyping && <TypingIndicator />}

							<div ref={messagesEndRef} />
						</div>

						{/* Quick actions */}
						{messages.length <= 1 && (
							<div className='border-t border-border bg-bg-elevated p-4'>
								<p className='mb-2 text-xs font-medium uppercase text-text-tertiary'>
									{t('aiQuickActions')}
								</p>
								<div className='grid grid-cols-2 gap-2'>
									{QUICK_ACTIONS.map(action => (
										<button
											type='button'
											key={action.id}
											onClick={() => handleQuickAction(action)}
											className='flex items-center gap-2 rounded-lg bg-bg-card p-3 text-left text-sm transition-colors hover:bg-bg-hover'
										>
											<span className='text-lg'>{action.icon}</span>
											<span className='font-medium'>{t(action.labelKey)}</span>
										</button>
									))}
								</div>
							</div>
						)}

						{/* Input */}
						<div className='border-t border-border p-4'>
							<div className='flex items-center gap-2'>
								{/* Voice input button - only shown when Web Speech API is available */}
								{speechSupported && (
									<button
										type='button'
										onClick={toggleListening}
										aria-label={
											isListening ? t('aiStopListening') : t('aiStartVoice')
										}
										className={cn(
											'flex size-10 shrink-0 items-center justify-center rounded-full transition-colors',
											isListening
												? 'bg-error text-white'
												: 'bg-bg-elevated text-text-tertiary hover:bg-bg-hover',
										)}
									>
										{isListening ? (
											<Mic className='size-5 animate-pulse' />
										) : (
											<MicOff className='size-5' />
										)}
									</button>
								)}

								<div className='relative flex-1'>
									<input
										ref={inputRef}
										type='text'
										value={inputValue}
										onChange={e => setInputValue(e.target.value)}
										onKeyDown={e => e.key === 'Enter' && handleSend()}
										placeholder={t('aiAskAnything')}
										className='w-full rounded-full bg-bg-elevated px-4 py-2.5 pr-12 text-sm outline-none placeholder:text-text-muted focus:ring-2 focus:ring-brand/30'
									/>
									<button
										type='button'
										onClick={() => handleSend()}
										disabled={!inputValue.trim() || isTyping}
										className={cn(
											'absolute right-1 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-full transition-colors',
											inputValue.trim()
												? 'bg-brand text-white'
												: 'text-text-tertiary',
										)}
									>
										{isTyping ? (
											<Loader2 className='size-4 animate-spin' />
										) : (
											<Send className='size-4' />
										)}
									</button>
								</div>
							</div>
						</div>
					</motion.div>
				</Portal>
			)}
		</AnimatePresence>
	)
}

// ============================================
// HELPER FUNCTIONS
// ============================================

function determineMessageType(text: string): MessageType {
	const lower = text.toLowerCase()
	if (
		lower.includes('substitute') ||
		lower.includes('replace') ||
		lower.includes('missing')
	)
		return 'substitution'
	if (
		lower.includes('technique') ||
		lower.includes('how to') ||
		lower.includes('how do')
	)
		return 'technique'
	if (
		lower.includes('wrong') ||
		lower.includes('burnt') ||
		lower.includes('mistake')
	)
		return 'warning'
	return 'text'
}
