'use client'

import { Clipboard } from 'lucide-react'

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
}: PasteAreaProps) => (
	<div className='overflow-hidden rounded-2xl border-2 border-dashed border-border bg-bg'>
		<textarea
			value={value}
			onChange={e => onChange(e.target.value)}
			placeholder={`Paste your recipe text here...

Example:
Spicy Garlic Noodles

Ingredients:
- 8 oz rice noodles
- 4 cloves garlic, minced
- 2 tbsp soy sauce
...

Instructions:
1. Cook noodles according to package
2. Sauté garlic until fragrant
...`}
			className='min-h-textarea-lg w-full resize-y bg-transparent p-5 text-sm leading-relaxed text-text placeholder:text-text-secondary focus:outline-none'
		/>
		<div className='flex items-center justify-between border-t border-border bg-panel-bg px-5 py-3'>
			<button
				onClick={onPaste}
				className='flex items-center gap-2 rounded-lg border border-border px-3.5 py-2 text-xs font-semibold text-text-secondary transition-colors hover:bg-bg'
			>
				<Clipboard className='size-4' />
				Paste from Clipboard
			</button>
			<span className='text-xs text-text-secondary'>
				{charCount} / {maxChars}
			</span>
		</div>
	</div>
)
