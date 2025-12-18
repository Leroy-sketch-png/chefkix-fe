import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'

type SocialLoginButtonProps = {
	icon: React.ReactNode
	label: string
	onClick?: () => void
	className?: string
	variant?: 'default' | 'outline'
	disabled?: boolean
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
	icon,
	label,
	onClick,
	className = '',
	variant = 'outline',
	disabled = false,
}) => {
	return (
		<Button
			onClick={onClick}
			variant={variant}
			disabled={disabled}
			className={cn(
				'flex h-11 w-full items-center justify-center gap-2 text-sm font-medium',
				variant === 'outline' &&
					'border-border-medium bg-bg-card hover:bg-bg-hover',
				disabled && 'cursor-not-allowed opacity-50',
				className,
			)}
		>
			{icon}
			<span>{label}</span>
		</Button>
	)
}
