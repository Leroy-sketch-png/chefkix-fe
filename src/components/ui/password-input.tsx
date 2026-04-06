'use client'

import { useState } from 'react'
import { Input } from '@/components/ui/input'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTranslations } from '@/i18n/hooks'

export function PasswordInput({
	className,
	...props
}: React.ComponentProps<'input'>) {
	const [showPassword, setShowPassword] = useState(false)
	const t = useTranslations('common')

	return (
		<div className='relative'>
			<Input
				type={showPassword ? 'text' : 'password'}
				placeholder='********'
				className={cn(className)}
				{...props}
			/>
			<button
				type='button'
				onClick={() => setShowPassword(!showPassword)}
				className='absolute inset-y-0 right-0 flex items-center pr-3 text-text-muted hover:text-text-secondary transition-colors cursor-pointer'
				aria-label={showPassword ? t('hidePassword') : t('showPassword')}
			>
				{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
			</button>
		</div>
	)
}
