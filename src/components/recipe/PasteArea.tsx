'use client'

import { Clipboard } from 'lucide-react'
import { useTranslations } from 'next-intl'

// ── Props ───────────────────────────────────────────────────────────
interface PasteAreaProps {
	value: string
	onChange: (v: string) => void
	onPaste: () => void
	charCount: number
	maxChars?: number
}

/**
 * Textarea with clipboard-paste button and character counter.
 */
export const PasteArea = ({
	value,
	onChange,
	onPaste,
	charCount,
	maxChars = 5000,
}: PasteAreaProps) => {
	const t = useTranslations('recipe')
	return (
	<div className='overflow-hidden rounded-2xl border-2 border-dashed border-border bg-bg'>
		<textarea
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={t('pasteAreaPlaceholder')}
			className='min-h-textarea-lg w-full resize-y bg-transparent p-5 text-sm leading-relaxed text-text placeholder:text-text-secondary focus:outline-none'
		/>
		<div className='flex items-center justify-between border-t border-border bg-bg-card px-5 py-3'>
			<button
				type='button'
				onClick={onPaste}
				className='flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg'
			>
				<Clipboard className='size-4' />
				{t('pasteFromClipboard')}
			</button>
			<span className='tabular-nums text-xs text-text-secondary'>
				{charCount} / {maxChars}
			</span>
		</div>
	</div>
)
}
