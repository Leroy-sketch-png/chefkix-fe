'use client'

import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@/components/ui/alert-dialog'

// ============================================
// CONFIRM DIALOG
// ============================================
// A reusable confirmation dialog to replace window.confirm()
// with a proper modal that matches the design system.

interface ConfirmDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	title: string
	description: string
	confirmLabel?: string
	cancelLabel?: string
	variant?: 'default' | 'destructive'
	onConfirm: () => void
	onCancel?: () => void
}

export function ConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel = 'Confirm',
	cancelLabel = 'Cancel',
	variant = 'default',
	onConfirm,
	onCancel,
}: ConfirmDialogProps) {
	const handleConfirm = () => {
		onConfirm()
		onOpenChange(false)
	}

	const handleCancel = () => {
		onCancel?.()
		onOpenChange(false)
	}

	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className='rounded-2xl border-border bg-bg-card'>
				<AlertDialogHeader>
					<AlertDialogTitle className='text-text'>{title}</AlertDialogTitle>
					<AlertDialogDescription className='text-text-secondary'>
						{description}
					</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter>
					<AlertDialogCancel
						onClick={handleCancel}
						className='rounded-lg border-border bg-bg-elevated hover:bg-bg-hover'
					>
						{cancelLabel}
					</AlertDialogCancel>
					<AlertDialogAction
						onClick={handleConfirm}
						className={
							variant === 'destructive'
								? 'rounded-lg bg-error text-white hover:bg-error/90'
								: 'rounded-lg bg-brand text-white hover:bg-brand/90'
						}
					>
						{confirmLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	)
}
