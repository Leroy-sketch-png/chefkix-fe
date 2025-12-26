'use client'

import * as React from 'react'
import { X } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'

/**
 * Sheet Component
 *
 * A slide-out panel component for mobile-first experiences.
 * Better than modals for mobile - feels more native with slide animations.
 *
 * Variants:
 * - side="left" - Slides from left (navigation, menu)
 * - side="right" - Slides from right (settings, filters)
 * - side="bottom" - Slides from bottom (mobile filters, details)
 *
 * Design Token Compliant:
 * - Spacing: gap-sm, gap-md, gap-lg
 * - Radius: rounded-radius
 * - Shadows: shadow-lg
 * - Colors: bg-panel-bg, text-text-primary, border-border
 *
 * @example
 * ```tsx
 * const [open, setOpen] = useState(false)
 *
 * <Sheet open={open} onOpenChange={setOpen} side="right">
 *   <SheetTrigger asChild>
 *     <Button>Open Settings</Button>
 *   </SheetTrigger>
 *   <SheetContent>
 *     <SheetHeader>
 *       <SheetTitle>Settings</SheetTitle>
 *       <SheetDescription>Manage your preferences</SheetDescription>
 *     </SheetHeader>
 *     <div className="py-4">Your content here</div>
 *     <SheetFooter>
 *       <Button>Save</Button>
 *     </SheetFooter>
 *   </SheetContent>
 * </Sheet>
 * ```
 */

const sheetVariants = cva(
	'fixed z-modal bg-panel-bg shadow-lg transition-transform duration-300 ease-in-out',
	{
		variants: {
			side: {
				left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-border data-[state=closed]:-translate-x-full',
				right:
					'inset-y-0 right-0 h-full w-3/4 max-w-sm border-l border-border data-[state=closed]:translate-x-full',
				bottom:
					'inset-x-0 bottom-0 max-h-sheet-mobile w-full rounded-t-radius border-t border-border data-[state=closed]:translate-y-full',
			},
		},
		defaultVariants: {
			side: 'right',
		},
	},
)

interface SheetContextValue {
	open: boolean
	onOpenChange: (open: boolean) => void
}

const SheetContext = React.createContext<SheetContextValue | undefined>(
	undefined,
)

const useSheet = () => {
	const context = React.useContext(SheetContext)
	if (!context) {
		throw new Error('Sheet components must be used within Sheet')
	}
	return context
}

export interface SheetProps {
	open?: boolean
	onOpenChange?: (open: boolean) => void
	children: React.ReactNode
	side?: 'left' | 'right' | 'bottom'
}

export const Sheet = ({
	open: controlledOpen,
	onOpenChange,
	children,
	side = 'right',
}: SheetProps) => {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(false)
	const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
	const setOpen = onOpenChange || setUncontrolledOpen

	return (
		<SheetContext.Provider value={{ open, onOpenChange: setOpen }}>
			{React.Children.map(children, child => {
				if (React.isValidElement(child)) {
					return React.cloneElement(child as React.ReactElement<any>, {
						side,
					})
				}
				return child
			})}
		</SheetContext.Provider>
	)
}

// Sheet Trigger
export interface SheetTriggerProps {
	asChild?: boolean
	children: React.ReactNode
}

export const SheetTrigger = ({ asChild, children }: SheetTriggerProps) => {
	const { onOpenChange } = useSheet()

	if (asChild && React.isValidElement(children)) {
		return React.cloneElement(children as React.ReactElement<any>, {
			onClick: () => onOpenChange(true),
		})
	}

	return (
		<button
			onClick={() => onOpenChange(true)}
			className='inline-flex items-center justify-center'
		>
			{children}
		</button>
	)
}

// Sheet Content
export interface SheetContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof sheetVariants> {
	children: React.ReactNode
	showClose?: boolean
}

export const SheetContent = React.forwardRef<HTMLDivElement, SheetContentProps>(
	(
		{ className, children, side = 'right', showClose = true, ...props },
		ref,
	) => {
		const { open, onOpenChange } = useSheet()
		const contentRef = React.useRef<HTMLDivElement>(null)

		// Handle Escape key
		React.useEffect(() => {
			const handleEscape = (e: KeyboardEvent) => {
				if (e.key === 'Escape' && open) {
					onOpenChange(false)
				}
			}
			document.addEventListener('keydown', handleEscape)
			return () => document.removeEventListener('keydown', handleEscape)
		}, [open, onOpenChange])

		// Prevent body scroll when open
		React.useEffect(() => {
			if (open) {
				document.body.style.overflow = 'hidden'
			} else {
				document.body.style.overflow = ''
			}
			return () => {
				document.body.style.overflow = ''
			}
		}, [open])

		if (!open) return null

		return (
			<>
				{/* Backdrop */}
				<div
					className='fixed inset-0 z-modal bg-black/50 transition-opacity duration-300'
					onClick={() => onOpenChange(false)}
					aria-hidden='true'
				/>

				{/* Sheet */}
				<div
					ref={contentRef}
					data-state={open ? 'open' : 'closed'}
					className={cn(sheetVariants({ side }), className)}
					{...props}
				>
					<div className='flex h-full flex-col overflow-hidden'>
						{/* Close button */}
						{showClose && (
							<button
								onClick={() => onOpenChange(false)}
								className='absolute right-4 top-4 rounded-sm opacity-70 ring-offset-bg transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2'
								aria-label='Close'
							>
								<X className='h-5 w-5' />
							</button>
						)}

						{/* Content */}
						<div className='flex-1 overflow-y-auto'>{children}</div>
					</div>
				</div>
			</>
		)
	},
)
SheetContent.displayName = 'SheetContent'

// Sheet Header
export interface SheetHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode
}

export const SheetHeader = ({
	className,
	children,
	...props
}: SheetHeaderProps) => {
	return (
		<div
			className={cn(
				'flex flex-col gap-sm border-b border-border px-6 py-4',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

// Sheet Title
export interface SheetTitleProps
	extends React.HTMLAttributes<HTMLHeadingElement> {
	children: React.ReactNode
}

export const SheetTitle = ({
	className,
	children,
	...props
}: SheetTitleProps) => {
	return (
		<h2
			className={cn('text-lg font-semibold text-text-primary', className)}
			{...props}
		>
			{children}
		</h2>
	)
}

// Sheet Description
export interface SheetDescriptionProps
	extends React.HTMLAttributes<HTMLParagraphElement> {
	children: React.ReactNode
}

export const SheetDescription = ({
	className,
	children,
	...props
}: SheetDescriptionProps) => {
	return (
		<p className={cn('text-sm text-text-secondary', className)} {...props}>
			{children}
		</p>
	)
}

// Sheet Body
export interface SheetBodyProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode
}

export const SheetBody = ({
	className,
	children,
	...props
}: SheetBodyProps) => {
	return (
		<div className={cn('flex-1 space-y-4 px-6 py-4', className)} {...props}>
			{children}
		</div>
	)
}

// Sheet Footer
export interface SheetFooterProps extends React.HTMLAttributes<HTMLDivElement> {
	children: React.ReactNode
}

export const SheetFooter = ({
	className,
	children,
	...props
}: SheetFooterProps) => {
	return (
		<div
			className={cn(
				'flex items-center justify-end gap-sm border-t border-border px-6 py-4',
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

export { sheetVariants }
