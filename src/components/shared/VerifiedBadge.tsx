'use client'

import { useTranslations } from 'next-intl'

import { BadgeCheck } from 'lucide-react'

interface VerifiedBadgeProps {
	size?: 'sm' | 'md' | 'lg'
	className?: string
}

const SIZE_MAP = {
	sm: 'size-3.5',
	md: 'size-4',
	lg: 'size-5',
} as const

/**
 * Verified creator badge — blue checkmark shown next to usernames.
 * W5.9: Verified Creator Badge.
 */
export function VerifiedBadge({
	size = 'md',
	className = '',
}: VerifiedBadgeProps) {
	const t = useTranslations('shared')
	return (
		<BadgeCheck
			className={`${SIZE_MAP[size]} shrink-0 text-info ${className}`}
			aria-label={t('vbVerified')}
		/>
	)
}
