'use client'

import { Download, Loader2 } from 'lucide-react'
import { useState } from 'react'

interface ChartExportButtonProps {
	onExport: () => Promise<void>
}

/** Small, shared action used by every exportable evaluation chart. */
export function ChartExportButton({ onExport }: ChartExportButtonProps) {
	const [isExporting, setIsExporting] = useState(false)

	const handleExport = async () => {
		setIsExporting(true)
		try {
			await onExport()
		} finally {
			setIsExporting(false)
		}
	}

	return (
		<button
			type='button'
			onClick={() => void handleExport()}
			disabled={isExporting}
			className='inline-flex min-h-9 items-center gap-2 rounded-lg border border-border-subtle bg-bg-card px-3 py-2 text-xs font-semibold text-text-primary transition-colors hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-primary/40'
		>
			{isExporting ? (
				<Loader2 className='size-3.5 animate-spin' />
			) : (
				<Download className='size-3.5' />
			)}
			{isExporting ? 'Preparing image…' : 'Export image'}
		</button>
	)
}
