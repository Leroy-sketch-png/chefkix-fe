'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

// ============================================================================
// Modal Overlay Component
// ============================================================================

interface ModalProps {
	isOpen: boolean
	onClose: () => void
	children: React.ReactNode
	size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
	closeOnOverlayClick?: boolean
	closeOnEscape?: boolean
	className?: string
}

export const Modal = ({
	isOpen,
	onClose,
	children,
	size = 'md',
	closeOnOverlayClick = true,
	closeOnEscape = true,
	className,
}: ModalProps) => {
	// Handle escape key
	useEffect(() => {
		if (!closeOnEscape || !isOpen) return

		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === 'Escape') onClose()
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [closeOnEscape, isOpen, onClose])

	// Prevent body scroll when modal is open
	useEffect(() => {
		if (isOpen) {
			document.body.style.overflow = 'hidden'
		} else {
			document.body.style.overflow = ''
		}

		return () => {
			document.body.style.overflow = ''
		}
	}, [isOpen])

	if (!isOpen) return null

	const sizeClasses = {
		sm: 'max-w-md',
		md: 'max-w-2xl',
		lg: 'max-w-4xl',
		xl: 'max-w-6xl',
		full: 'max-w-full mx-4',
	}

	return (
		<div
			className='fixed inset-0 z-modal flex animate-fadeIn items-center justify-center bg-foreground/60 p-6 backdrop-blur-sm'
			onClick={closeOnOverlayClick ? onClose : undefined}
		>
			<div
				className={cn(
					'relative flex max-h-[90vh] w-full animate-scaleIn flex-col overflow-hidden rounded-2xl bg-card shadow-glow',
					sizeClasses[size],
					className,
				)}
				onClick={e => e.stopPropagation()}
			>
				{children}
			</div>
		</div>
	)
}

// ============================================================================
// Modal Header Component
// ============================================================================

interface ModalHeaderProps {
	title: string
	onClose?: () => void
	showCloseButton?: boolean
	children?: React.ReactNode
	className?: string
}

export const ModalHeader = ({
	title,
	onClose,
	showCloseButton = true,
	children,
	className,
}: ModalHeaderProps) => {
	return (
		<div
			className={cn(
				'flex items-center justify-between border-b border-border px-6 py-4',
				className,
			)}
		>
			<h2 className='text-xl font-bold text-foreground'>{title}</h2>
			{children}
			{showCloseButton && onClose && (
				<button
					onClick={onClose}
					className='grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition-all hover:bg-muted/80 hover:text-foreground'
					aria-label='Close modal'
				>
					<X className='size-5' />
				</button>
			)}
		</div>
	)
}

// ============================================================================
// Modal Body Component
// ============================================================================

interface ModalBodyProps {
	children: React.ReactNode
	className?: string
	noPadding?: boolean
}

export const ModalBody = ({
	children,
	className,
	noPadding = false,
}: ModalBodyProps) => {
	return (
		<div
			className={cn(
				'flex-1 overflow-y-auto',
				!noPadding && 'px-6 py-4',
				className,
			)}
		>
			{children}
		</div>
	)
}

// ============================================================================
// Modal Footer Component
// ============================================================================

interface ModalFooterProps {
	children: React.ReactNode
	className?: string
}

export const ModalFooter = ({ children, className }: ModalFooterProps) => {
	return (
		<div
			className={cn(
				'flex items-center justify-end gap-3 border-t border-border px-6 py-4',
				className,
			)}
		>
			{children}
		</div>
	)
}

// ============================================================================
// Confirmation Modal (Common Pattern)
// ============================================================================

interface ConfirmModalProps {
	isOpen: boolean
	onClose: () => void
	onConfirm: () => void
	title: string
	message: string
	confirmText?: string
	cancelText?: string
	variant?: 'default' | 'danger'
	isLoading?: boolean
}

export const ConfirmModal = ({
	isOpen,
	onClose,
	onConfirm,
	title,
	message,
	confirmText = 'Confirm',
	cancelText = 'Cancel',
	variant = 'default',
	isLoading = false,
}: ConfirmModalProps) => {
	return (
		<Modal isOpen={isOpen} onClose={onClose} size='sm'>
			<ModalHeader title={title} onClose={onClose} />
			<ModalBody>
				<p className='text-sm leading-relaxed text-muted-foreground'>
					{message}
				</p>
			</ModalBody>
			<ModalFooter>
				<button
					onClick={onClose}
					disabled={isLoading}
					className='rounded-lg px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:bg-muted disabled:opacity-50'
				>
					{cancelText}
				</button>
				<button
					onClick={onConfirm}
					disabled={isLoading}
					className={cn(
						'rounded-lg px-4 py-2 text-sm font-semibold transition-all hover:-translate-y-0.5 disabled:opacity-50',
						variant === 'default' &&
							'bg-primary text-primary-foreground hover:shadow-md',
						variant === 'danger' &&
							'bg-destructive text-destructive-foreground hover:shadow-md',
					)}
				>
					{isLoading ? 'Processing...' : confirmText}
				</button>
			</ModalFooter>
		</Modal>
	)
}

// ============================================================================
// Alert Modal (Info/Success/Error)
// ============================================================================

interface AlertModalProps {
	isOpen: boolean
	onClose: () => void
	title: string
	message: string
	type?: 'info' | 'success' | 'error' | 'warning'
	buttonText?: string
}

export const AlertModal = ({
	isOpen,
	onClose,
	title,
	message,
	type = 'info',
	buttonText = 'OK',
}: AlertModalProps) => {
	const typeColors = {
		info: 'text-primary',
		success: 'text-accent',
		error: 'text-destructive',
		warning: 'text-gold',
	}

	return (
		<Modal isOpen={isOpen} onClose={onClose} size='sm'>
			<ModalHeader
				title={title}
				onClose={onClose}
				className={typeColors[type]}
			/>
			<ModalBody>
				<p className='text-sm leading-relaxed text-muted-foreground'>
					{message}
				</p>
			</ModalBody>
			<ModalFooter>
				<button
					onClick={onClose}
					className='rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:shadow-md'
				>
					{buttonText}
				</button>
			</ModalFooter>
		</Modal>
	)
}
