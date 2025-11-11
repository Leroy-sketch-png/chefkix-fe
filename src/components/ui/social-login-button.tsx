import { Button } from '@/components/ui/button'
import React from 'react'
import { cn } from '@/lib/utils'

type SocialLoginButtonProps = {
	icon: React.ReactNode
	label: string
	onClick?: () => void
	className?: string
	variant?: 'default' | 'outline'
}

export const SocialLoginButton: React.FC<SocialLoginButtonProps> = ({
	icon,
	label,
	onClick,
	className = '',
	variant = 'outline',
}) => {
	return (
		<Button
			onClick={onClick}
			variant={variant}
			className={cn(
				'flex h-11 w-full items-center justify-center gap-2 text-sm font-medium',
				variant === 'outline' &&
					'border-border-medium bg-bg-card hover:bg-bg-hover',
				className,
			)}
		>
			{icon}
			<span>{label}</span>
		</Button>
	)
}
