'use client'

import { useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import type { OtpDeliveryTiming } from '@/lib/types'
import { cn } from '@/lib/utils'

interface ResendOtpButtonProps {
	onResend: () => Promise<OtpDeliveryTiming | null>
	resendAvailableAt?: string | null
	className?: string
}

export const ResendOtpButton = ({
	onResend,
	resendAvailableAt = null,
	className,
}: ResendOtpButtonProps) => {
	const t = useTranslations('auth')
	const [availableAt, setAvailableAt] = useState(resendAvailableAt)
	const [now, setNow] = useState(() => Date.now())
	const [isResending, setIsResending] = useState(false)
	const cooldown = availableAt
		? Math.max(0, Math.ceil((Date.parse(availableAt) - now) / 1000))
		: 0

	const handleClick = async () => {
		if (cooldown > 0 || isResending) return
		setIsResending(true)
		try {
			const delivery = await onResend()
			if (delivery) {
				setAvailableAt(delivery.resendAvailableAt)
				setNow(Date.now())
			}
		} finally {
			setIsResending(false)
		}
	}

	useEffect(() => {
		setAvailableAt(resendAvailableAt)
		setNow(Date.now())
	}, [resendAvailableAt])

	useEffect(() => {
		if (!availableAt || Date.parse(availableAt) <= Date.now()) return
		const interval = window.setInterval(() => setNow(Date.now()), 1000)
		return () => clearInterval(interval)
	}, [availableAt])

	const isDisabled = cooldown > 0 || isResending

	return (
		<button
			type='button'
			onClick={handleClick}
			disabled={isDisabled}
			className={cn(
				'text-xs font-medium transition-colors hover:underline',
				isDisabled
					? 'pointer-events-none cursor-not-allowed text-text-secondary'
					: 'cursor-pointer text-brand hover:text-brand/80',
				className,
			)}
		>
			{isResending
				? t('resendingCode')
				: cooldown > 0
					? t('resendAvailableIn', { seconds: cooldown })
					: t('resendCode')}
		</button>
	)
}
