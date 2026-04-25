'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import { ChevronRight, Home } from 'lucide-react'
import Link from 'next/link'

interface BreadcrumbItem {
	label: string
	href?: string
}

interface BreadcrumbsProps {
	items: BreadcrumbItem[]
	showHomeIcon?: boolean
	className?: string
}

/**
 * Accessible breadcrumb navigation for secondary pages.
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Home', href: '/' },
 *   { label: 'Recipes', href: '/recipes' },
 *   { label: 'Pasta Carbonara' },
 * ]} />
 */
export function Breadcrumbs({
	items,
	showHomeIcon = true,
	className,
}: BreadcrumbsProps) {
	return (
		<nav aria-label='Breadcrumb' className={cn('flex items-center', className)}>
			<ol className='flex items-center gap-1.5 text-sm'>
				{items.map((item, i) => {
					const isLast = i === items.length - 1
					const isFirst = i === 0

					return (
						<li key={i} className='flex items-center gap-1.5'>
							{i > 0 && (
								<ChevronRight
									className='size-3.5 text-text-muted'
									aria-hidden='true'
								/>
							)}

							{isLast ? (
								<span className='font-medium text-text' aria-current='page'>
									{item.label}
								</span>
							) : item.href ? (
								<Link
									href={item.href}
									className='flex items-center gap-1 text-text-secondary transition-colors hover:text-text'
								>
									{isFirst && showHomeIcon && <Home className='size-3.5' />}
									<span>{item.label}</span>
								</Link>
							) : (
								<span className='flex items-center gap-1 text-text-secondary'>
									{isFirst && showHomeIcon && <Home className='size-3.5' />}
									<span>{item.label}</span>
								</span>
							)}
						</li>
					)
				})}
			</ol>
		</nav>
	)
}
