'use client'

import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

/**
 * Popover Component
 *
 * A floating content container that appears on hover or click.
 * Perfect for hover cards, tooltips, contextual menus.
 *
 * Positioning:
 * - top, bottom, left, right
 * - Auto-flips when near viewport edges
 *
 * Trigger modes:
 * - click (default) - click to open/close
 * - hover - hover to show, leave to hide
 *
 * Design Token Compliant:
 * - Spacing: gap-sm, gap-md, p-4
 * - Radius: rounded-radius
 * - Shadows: shadow-lg
 * - Colors: bg-panel-bg, border-border
 *
 * @example
 * ```tsx
 * <Popover>
 *   <PopoverTrigger asChild>
 *     <Button>Hover me</Button>
 *   </PopoverTrigger>
 *   <PopoverContent>
 *     <p>Popover content here</p>
 *   </PopoverContent>
 * </Popover>
 * ```
 */

const popoverVariants = cva(
	'z-50 rounded-radius border border-border bg-panel-bg shadow-lg outline-none animate-in fade-in-0 zoom-in-95',
	{
		variants: {
			side: {
				top: 'slide-in-from-bottom-2',
				bottom: 'slide-in-from-top-2',
				left: 'slide-in-from-right-2',
				right: 'slide-in-from-left-2',
			},
		},
		defaultVariants: {
			side: 'bottom',
		},
	},
)

interface PopoverContextValue {
	open: boolean
	onOpenChange: (open: boolean) => void
	triggerRef: React.RefObject<HTMLElement>
	contentRef: React.RefObject<HTMLDivElement>
	triggerMode: 'click' | 'hover'
}

const PopoverContext = React.createContext<PopoverContextValue | undefined>(
	undefined,
)

const usePopover = () => {
	const context = React.useContext(PopoverContext)
	if (!context) {
		throw new Error('Popover components must be used within Popover')
	}
	return context
}

export interface PopoverProps {
	children: React.ReactNode
	open?: boolean
	onOpenChange?: (open: boolean) => void
	triggerMode?: 'click' | 'hover'
	defaultOpen?: boolean
}

export const Popover = ({
	children,
	open: controlledOpen,
	onOpenChange,
	triggerMode = 'click',
	defaultOpen = false,
}: PopoverProps) => {
	const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen)
	const open = controlledOpen !== undefined ? controlledOpen : uncontrolledOpen
	const setOpen = onOpenChange || setUncontrolledOpen

	const triggerRef = React.useRef<HTMLElement>(null)
	const contentRef = React.useRef<HTMLDivElement>(null)

	// Click outside to close
	React.useEffect(() => {
		if (!open) return

		const handleClickOutside = (event: MouseEvent) => {
			if (
				!triggerRef.current?.contains(event.target as Node) &&
				!contentRef.current?.contains(event.target as Node)
			) {
				setOpen(false)
			}
		}

		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [open, setOpen])

	// Escape key to close
	React.useEffect(() => {
		if (!open) return

		const handleEscape = (event: KeyboardEvent) => {
			if (event.key === 'Escape') {
				setOpen(false)
			}
		}

		document.addEventListener('keydown', handleEscape)
		return () => document.removeEventListener('keydown', handleEscape)
	}, [open, setOpen])

	return (
		<PopoverContext.Provider
			value={{
				open,
				onOpenChange: setOpen,
				triggerRef,
				contentRef,
				triggerMode,
			}}
		>
			{children}
		</PopoverContext.Provider>
	)
}

// Popover Trigger
export interface PopoverTriggerProps {
	asChild?: boolean
	children: React.ReactNode
}

export const PopoverTrigger = React.forwardRef<
	HTMLButtonElement,
	PopoverTriggerProps
>(({ asChild, children }, ref) => {
	const { open, onOpenChange, triggerRef, triggerMode } = usePopover()

	const handleClick = () => {
		if (triggerMode === 'click') {
			onOpenChange(!open)
		}
	}

	const handleMouseEnter = () => {
		if (triggerMode === 'hover') {
			onOpenChange(true)
		}
	}

	const handleMouseLeave = () => {
		if (triggerMode === 'hover') {
			// Small delay before closing on hover
			setTimeout(() => onOpenChange(false), 100)
		}
	}

	const props = {
		onClick: handleClick,
		onMouseEnter: handleMouseEnter,
		onMouseLeave: handleMouseLeave,
	}

	if (asChild && React.isValidElement(children)) {
		return React.cloneElement(children as React.ReactElement<any>, {
			...props,
			ref: (node: HTMLElement) => {
				;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
					node
				if (typeof ref === 'function') ref(node as any)
				else if (ref) (ref as React.MutableRefObject<any>).current = node
			},
		})
	}

	return (
		<button
			ref={node => {
				;(triggerRef as React.MutableRefObject<HTMLElement | null>).current =
					node
				if (typeof ref === 'function') ref(node)
				else if (ref) (ref as React.MutableRefObject<any>).current = node
			}}
			{...props}
			className='inline-flex items-center justify-center'
		>
			{children}
		</button>
	)
})
PopoverTrigger.displayName = 'PopoverTrigger'

// Popover Content
export interface PopoverContentProps
	extends React.HTMLAttributes<HTMLDivElement>,
		VariantProps<typeof popoverVariants> {
	children: React.ReactNode
	align?: 'start' | 'center' | 'end'
	sideOffset?: number
}

export const PopoverContent = React.forwardRef<
	HTMLDivElement,
	PopoverContentProps
>(
	(
		{
			className,
			children,
			side = 'bottom',
			align = 'center',
			sideOffset = 8,
			...props
		},
		ref,
	) => {
		const { open, contentRef, triggerRef, triggerMode, onOpenChange } =
			usePopover()
		const [position, setPosition] = React.useState({ top: 0, left: 0 })

		// Calculate position based on trigger
		React.useEffect(() => {
			if (!open || !triggerRef.current || !contentRef.current) return

			const triggerRect = triggerRef.current.getBoundingClientRect()
			const contentRect = contentRef.current.getBoundingClientRect()
			const viewportWidth = window.innerWidth
			const viewportHeight = window.innerHeight

			let top = 0
			let left = 0

			// Calculate base position
			switch (side) {
				case 'top':
					top = triggerRect.top - contentRect.height - sideOffset
					break
				case 'bottom':
					top = triggerRect.bottom + sideOffset
					break
				case 'left':
					left = triggerRect.left - contentRect.width - sideOffset
					top =
						triggerRect.top + triggerRect.height / 2 - contentRect.height / 2
					break
				case 'right':
					left = triggerRect.right + sideOffset
					top =
						triggerRect.top + triggerRect.height / 2 - contentRect.height / 2
					break
			}

			// Align
			if (side === 'top' || side === 'bottom') {
				switch (align) {
					case 'start':
						left = triggerRect.left
						break
					case 'center':
						left =
							triggerRect.left + triggerRect.width / 2 - contentRect.width / 2
						break
					case 'end':
						left = triggerRect.right - contentRect.width
						break
				}
			}

			// Keep within viewport
			if (left + contentRect.width > viewportWidth) {
				left = viewportWidth - contentRect.width - 8
			}
			if (left < 8) {
				left = 8
			}
			if (top + contentRect.height > viewportHeight) {
				top = viewportHeight - contentRect.height - 8
			}
			if (top < 8) {
				top = 8
			}

			setPosition({ top, left })
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [open, side, align, sideOffset])

		const handleMouseEnter = () => {
			if (triggerMode === 'hover') {
				onOpenChange(true)
			}
		}

		const handleMouseLeave = () => {
			if (triggerMode === 'hover') {
				setTimeout(() => onOpenChange(false), 100)
			}
		}

		if (!open) return null

		return (
			<div
				ref={node => {
					;(
						contentRef as React.MutableRefObject<HTMLDivElement | null>
					).current = node
					if (typeof ref === 'function') ref(node)
					else if (ref) (ref as React.MutableRefObject<any>).current = node
				}}
				className={cn(popoverVariants({ side }), 'fixed p-4', className)}
				style={{
					top: `${position.top}px`,
					left: `${position.left}px`,
				}}
				onMouseEnter={handleMouseEnter}
				onMouseLeave={handleMouseLeave}
				{...props}
			>
				{children}
			</div>
		)
	},
)
PopoverContent.displayName = 'PopoverContent'

export { popoverVariants }
