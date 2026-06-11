'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

interface MeshGradientProps {
	children?: React.ReactNode
	className?: string
}

export function MeshGradient({ children, className }: MeshGradientProps) {
	return <div className={cn('relative bg-bg', className)}>{children}</div>
}
