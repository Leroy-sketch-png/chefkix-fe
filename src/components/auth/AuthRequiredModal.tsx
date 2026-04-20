'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
	Heart,
	MessageSquare,
	Bookmark,
	UserPlus,
	ChefHat,
	Lock,
	type LucideIcon,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Portal } from '@/components/ui/portal'
import { cn } from '@/lib/utils'
import { TRANSITION_SPRING } from '@/lib/motion'
import { useTranslations } from 'next-intl'

// ─── Action Configurations ──────────────────────────

interface ActionConfig {
	icon: LucideIcon
	titleKey: string
	descKey: string
}

const ACTION_CONFIGS: Record<string, ActionConfig> = {
	like: {
		icon: Heart,
		titleKey: 'authReqLikeTitle',
		descKey: 'authReqLikeDesc',
	},
	save: {
		icon: Bookmark,
		titleKey: 'authReqSaveTitle',
		descKey: 'authReqSaveDesc',
	},
	comment: {
		icon: MessageSquare,
		titleKey: 'authReqCommentTitle',
		descKey: 'authReqCommentDesc',
	},
	follow: {
		icon: UserPlus,
		titleKey: 'authReqFollowTitle',
		descKey: 'authReqFollowDesc',
	},
	cook: {
		icon: ChefHat,
		titleKey: 'authReqCookTitle',
		descKey: 'authReqCookDesc',
	},
	default: {
		icon: Lock,
		titleKey: 'authReqDefaultTitle',
		descKey: 'authReqDefaultDesc',
	},
}

export type AuthAction = keyof typeof ACTION_CONFIGS

// ─── Component ──────────────────────────────────────

interface AuthRequiredModalProps {
	isOpen: boolean
	onClose: () => void
	action?: AuthAction
	className?: string
}

export function AuthRequiredModal({
	isOpen,
	onClose,
	action = 'default',
	className,
}: AuthRequiredModalProps) {
	const router = useRouter()
	const t = useTranslations('shared')

	useEffect(() => {
		if (!isOpen) return

		const original = document.body.style.overflow
		document.body.style.overflow = 'hidden'

		const handleKey = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}
		document.addEventListener('keydown', handleKey)

		return () => {
			document.body.style.overflow = original
			document.removeEventListener('keydown', handleKey)
		}
	}, [isOpen, onClose])

	const config = ACTION_CONFIGS[action] || ACTION_CONFIGS.default
	const Icon = config.icon

	return (
		<AnimatePresence>
			{isOpen && (
				<Portal>
					<div className='fixed inset-0 z-modal flex items-center justify-center'>
						{/* Backdrop */}
						<motion.div
							initial={{ opacity: 0 }}
							animate={{ opacity: 1 }}
							exit={{ opacity: 0 }}
							className='absolute inset-0 bg-black/50 backdrop-blur-sm'
							onClick={onClose}
						/>

						{/* Modal */}
						<motion.div
							initial={{ opacity: 0, scale: 0.95, y: 10 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							exit={{ opacity: 0, scale: 0.95, y: 10 }}
							transition={TRANSITION_SPRING}
							className={cn(
								'relative z-10 mx-4 w-full max-w-sm rounded-xl border border-border-subtle bg-bg-card p-6 shadow-warm',
								className,
							)}
							role='dialog'
							aria-modal='true'
							aria-labelledby='auth-modal-title'
						>
							<div className='flex flex-col items-center text-center'>
								<div className='mb-4 flex size-14 items-center justify-center rounded-full bg-brand/10'>
									<Icon className='size-7 text-brand' />
								</div>

								<h2
									id='auth-modal-title'
									className='text-lg font-semibold text-text'
								>
									{t(config.titleKey)}
								</h2>
								<p className='mt-2 text-sm text-text-secondary'>
									{t(config.descKey)}
								</p>

								<div className='mt-6 flex w-full flex-col gap-2'>
									<Button
										onClick={() => {
											onClose()
											router.push('/auth/sign-in')
										}}
										className='w-full'
									>
										Sign In
									</Button>
									<Button
										variant='outline'
										onClick={() => {
											onClose()
											router.push('/auth/sign-up')
										}}
										className='w-full'
									>
										Create Account
									</Button>
								</div>

								<button
									type='button'
									onClick={onClose}
									className='mt-4 text-sm text-text-muted transition-colors hover:text-text'
								>
									Maybe later
								</button>
							</div>
						</motion.div>
					</div>
				</Portal>
			)}
		</AnimatePresence>
	)
}
