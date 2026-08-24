import { BookOpen, CheckCircle2, Clock3, FileText } from 'lucide-react'
import type { ThesisChapter } from '../types'
import { ThesisStatusPill } from './ThesisStatusPill'

function getChapterStatus(chapter: ThesisChapter) {
	if (chapter.artifacts.every(artifact => artifact.status === 'ready'))
		return 'ready' as const
	if (chapter.artifacts.some(artifact => artifact.status === 'pending-data'))
		return 'pending-data' as const
	return 'capture-needed' as const
}

export function ThesisChapterCard({
	chapter,
	active,
	onSelect,
}: {
	chapter: ThesisChapter
	active: boolean
	onSelect: () => void
}) {
	const status = getChapterStatus(chapter)
	const readyCount = chapter.artifacts.filter(
		artifact => artifact.status === 'ready',
	).length
	return (
		<button
			type='button'
			onClick={onSelect}
			aria-pressed={active}
			className={`w-full rounded-2xl border p-4 text-left transition-colors ${active ? 'border-primary bg-primary/5 shadow-card' : 'border-border-subtle bg-bg-card hover:border-primary/40'}`}
		>
			<div className='flex items-start justify-between gap-3'>
				<div className='flex min-w-0 items-start gap-3'>
					<div className='grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary'>
						<BookOpen className='size-4' />
					</div>
					<div className='min-w-0'>
						<p className='text-[11px] font-semibold uppercase tracking-[0.16em] text-primary'>
							Chapter {chapter.id}
						</p>
						<h2 className='mt-1 truncate font-semibold text-text-primary'>
							{chapter.title}
						</h2>
					</div>
				</div>
				<ThesisStatusPill status={status} />
			</div>
			<p className='mt-3 line-clamp-2 text-xs leading-5 text-text-muted'>
				{chapter.focus}
			</p>
			<div className='mt-4 flex items-center gap-3 text-xs text-text-muted'>
				<span className='inline-flex items-center gap-1.5'>
					<FileText className='size-3.5' /> {chapter.artifacts.length} artifacts
				</span>
				<span className='inline-flex items-center gap-1.5'>
					<CheckCircle2 className='size-3.5 text-emerald-600' /> {readyCount}{' '}
					ready
				</span>
				<span className='inline-flex items-center gap-1.5'>
					<Clock3 className='size-3.5' /> {chapter.criteria.length} criteria
				</span>
			</div>
		</button>
	)
}
