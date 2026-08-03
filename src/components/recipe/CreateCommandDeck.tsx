import { motion } from 'framer-motion'
import { FileText } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { cn } from '@/lib/utils'

interface CreateCommandDeckProps {
	className?: string
}

export function CreateCommandDeck({ className }: CreateCommandDeckProps) {
	const t = useTranslations('recipe')

	return (
		<motion.header
			initial={{ opacity: 0, y: 8 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
			className={cn(
				'flex items-start gap-3 border-b border-border-subtle pb-5 sm:gap-4',
				className,
			)}
		>
			<div className='flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand/10 text-brand sm:size-11'>
				<FileText className='size-5' aria-hidden='true' />
			</div>
			<div className='min-w-0 max-w-2xl'>
				<p className='text-xs font-semibold text-brand'>
					{t('draftLibraryEyebrow')}
				</p>
				<h1 className='mt-1 text-xl font-bold text-text-primary sm:text-2xl'>
					{t('draftLibraryTitle')}
				</h1>
				<p className='mt-1.5 text-sm leading-relaxed text-text-secondary'>
					{t('draftLibraryDescription')}
				</p>
			</div>
		</motion.header>
	)
}
