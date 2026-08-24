'use client'

import {
	Check,
	Clipboard,
	ExternalLink,
	FileImage,
	GitBranch,
	Presentation,
} from 'lucide-react'
import { useState } from 'react'
import type { EvidenceArtifact } from '../types'
import { ThesisStatusPill } from './ThesisStatusPill'

const kindIcons = {
	screenshot: FileImage,
	figure: FileImage,
	diagram: GitBranch,
	example: Presentation,
	demo: ExternalLink,
}

export function ThesisArtifactCard({
	artifact,
}: {
	artifact: EvidenceArtifact
}) {
	const [copied, setCopied] = useState(false)
	const Icon = kindIcons[artifact.kind]

	async function copyBrief() {
		const brief = `${artifact.title}\n${artifact.description}\n\nCapture checklist:\n${artifact.captureBrief.map(item => `- ${item}`).join('\n')}\n\nDependency: ${artifact.dependency}`
		if (navigator.clipboard) await navigator.clipboard.writeText(brief)
		setCopied(true)
		window.setTimeout(() => setCopied(false), 1600)
	}

	return (
		<article className='rounded-2xl border border-border-subtle bg-bg-card p-4'>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex min-w-0 items-start gap-3'>
					<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-bg-elevated text-primary'>
						<Icon className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-[10px] font-semibold uppercase tracking-[0.16em] text-text-muted'>
							{artifact.kind}
						</p>
						<h3 className='mt-1 font-semibold text-text-primary'>
							{artifact.title}
						</h3>
					</div>
				</div>
				<ThesisStatusPill status={artifact.status} />
			</div>
			<p className='mt-3 text-sm leading-6 text-text-muted'>
				{artifact.description}
			</p>
			<div className='mt-3 rounded-xl bg-bg-elevated/60 p-3'>
				<p className='text-xs font-semibold text-text-primary'>Capture brief</p>
				<ul className='mt-2 space-y-1 text-xs leading-5 text-text-muted'>
					{artifact.captureBrief.map(item => (
						<li key={item}>• {item}</li>
					))}
				</ul>
			</div>
			<p className='mt-3 text-xs leading-5 text-text-muted'>
				<span className='font-semibold text-text-primary'>Dependency:</span>{' '}
				{artifact.dependency}
			</p>
			<div className='mt-4 flex flex-wrap gap-2'>
				{artifact.route && (
					<a
						href={artifact.route}
						className='inline-flex min-h-9 items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-text-primary hover:border-primary hover:text-primary'
					>
						<ExternalLink className='size-3.5' /> Open surface
					</a>
				)}
				<button
					type='button'
					onClick={() => void copyBrief()}
					className='inline-flex min-h-9 items-center gap-2 rounded-lg border border-border-subtle px-3 py-2 text-xs font-semibold text-text-primary hover:border-primary hover:text-primary'
				>
					{copied ? (
						<Check className='size-3.5 text-emerald-600' />
					) : (
						<Clipboard className='size-3.5' />
					)}
					{copied ? 'Brief copied' : 'Copy brief'}
				</button>
			</div>
		</article>
	)
}
