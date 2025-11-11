'use client'

import app from '@/configs/app'
import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

interface ResendOtpButtonProps {
	onResend: () => void
	className?: string
}

export const ResendOtpButton = ({
	onResend,
	className,
}: ResendOtpButtonProps) => {
	const [cooldown, setCooldown] = useState(0)

	const handleClick = () => {
		if (cooldown > 0) return
		onResend()

		const endTime = Date.now() + app.OTP_COOLDOWN_SECONDS * 1000
		localStorage.setItem(app.OTP_STORAGE_KEY, endTime.toString())
		setCooldown(app.OTP_COOLDOWN_SECONDS)
	}

	useEffect(() => {
		const savedTime = localStorage.getItem(app.OTP_STORAGE_KEY)
		if (savedTime) {
			const remaining = Math.floor((parseInt(savedTime) - Date.now()) / 1000)
			if (remaining > 0) setCooldown(remaining)
			else localStorage.removeItem(app.OTP_STORAGE_KEY)
		}

		if (cooldown === 0) return

		const interval = setInterval(() => {
			setCooldown(prev => {
				if (prev <= 1) {
					localStorage.removeItem(app.OTP_STORAGE_KEY)
					clearInterval(interval)
					return 0
				}
				return prev - 1
			})
		}, 1000)

		return () => clearInterval(interval)
	}, [cooldown])

	return (
		<button
			type='button'
			onClick={handleClick}
			disabled={cooldown > 0}
			className={cn(
				'text-xs font-medium transition-colors hover:underline',
				cooldown > 0
					? 'text-primary/50 cursor-not-allowed pointer-events-none'
					: 'text-primary hover:text-primary/80 cursor-pointer',
				className,
			)}
		>
			{cooldown > 0 ? `Resend OTP in ${cooldown}s` : 'Resend OTP?'}
		</button>
	)
}
