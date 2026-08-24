'use client'

import { useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, CheckCircle2, FileText } from 'lucide-react'
import Link from 'next/link'
import { thesisEvidenceManifest } from '../data/thesisEvidenceManifest'
import type { ThesisChapter } from '../types'
import { ThesisArchitectureDiagram } from './ThesisArchitectureDiagram'
import { ThesisArtifactCard } from './ThesisArtifactCard'
import { ThesisChapterCard } from './ThesisChapterCard'

function countArtifacts(chapters: ThesisChapter[]) {
	return chapters.flatMap(chapter => chapter.artifacts)
}

function getInitialChapter(chapters: ThesisChapter[]) {
	return chapters[0]?.id ?? '5'
}

export function ThesisWorkspace() {
	const [activeChapterId, setActiveChapterId] = useState(
		getInitialChapter(thesisEvidenceManifest.chapters),
	)
	const artifacts = useMemo(
		() => countArtifacts(thesisEvidenceManifest.chapters),
		[],
	)
	const activeChapter =
		thesisEvidenceManifest.chapters.find(
			chapter => chapter.id === activeChapterId,
		) ?? thesisEvidenceManifest.chapters[0]
	const readyCount = artifacts.filter(
		artifact => artifact.status === 'ready',
	).length
	const pendingDataCount = artifacts.filter(
		artifact => artifact.status === 'pending-data',
	).length
	const coveragePercent = artifacts.length
		? Math.round((readyCount / artifacts.length) * 100)
		: 0

	return (
		<div className='space-y-5'>
			<section className='rounded-2xl border border-border-subtle bg-gradient-to-br from-bg-card via-bg-card to-primary/5 p-6'>
				<div className='flex flex-col justify-between gap-5 lg:flex-row lg:items-end'>
					<div>
						<div className='flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary'>
							<FileText className='size-4' /> Epic 11 · Thesis engineering
						</div>
						<h1 className='mt-2 text-3xl font-bold tracking-tight text-text-primary'>
							Evidence workspace
						</h1>
						<p className='mt-2 max-w-2xl text-sm leading-6 text-text-muted'>
							A single capture plan for the compound, safety, behavioral,
							multi-modal, architecture, and evaluation chapters. It separates
							what can be captured now from what must wait for the Leader’s
							measured exports.
						</p>
					</div>
					<div className='rounded-xl border border-border-subtle bg-bg-card px-4 py-3 text-xs text-text-muted'>
						<span className='font-semibold text-text-primary'>Manifest:</span>{' '}
						{thesisEvidenceManifest.version} · updated{' '}
						{thesisEvidenceManifest.updatedAt}
					</div>
				</div>
				<div className='mt-6 grid gap-3 sm:grid-cols-3'>
					<div className='rounded-xl bg-bg-elevated/60 p-3'>
						<p className='text-xs text-text-muted'>Chapter coverage</p>
						<p className='mt-1 text-2xl font-bold text-text-primary'>
							{coveragePercent}%
						</p>
						<p className='mt-1 text-xs text-text-muted'>
							{readyCount}/{artifacts.length} artifacts ready to capture
						</p>
					</div>
					<div className='rounded-xl bg-bg-elevated/60 p-3'>
						<p className='text-xs text-text-muted'>Chapters mapped</p>
						<p className='mt-1 text-2xl font-bold text-text-primary'>
							{thesisEvidenceManifest.chapters.length}
						</p>
						<p className='mt-1 text-xs text-text-muted'>
							Member backlog criteria traced
						</p>
					</div>
					<div className='rounded-xl bg-amber-500/5 p-3'>
						<p className='text-xs text-text-muted'>Leader dependencies</p>
						<p className='mt-1 text-2xl font-bold text-amber-700'>
							{pendingDataCount}
						</p>
						<p className='mt-1 text-xs text-text-muted'>
							Remain explicitly pending-data
						</p>
					</div>
				</div>
			</section>

			<div className='grid gap-5 lg:grid-cols-[20rem_1fr]'>
				<aside className='space-y-3' aria-label='Thesis chapters'>
					<div className='flex items-center justify-between px-1'>
						<p className='text-xs font-semibold uppercase tracking-[0.16em] text-text-muted'>
							Chapter map
						</p>
						<span className='text-xs text-text-muted'>
							{thesisEvidenceManifest.chapters.length} chapters
						</span>
					</div>
					{thesisEvidenceManifest.chapters.map(chapter => (
						<ThesisChapterCard
							key={chapter.id}
							chapter={chapter}
							active={chapter.id === activeChapter?.id}
							onSelect={() => setActiveChapterId(chapter.id)}
						/>
					))}
				</aside>
				<section
					className='min-w-0 rounded-2xl border border-border-subtle bg-bg-card p-5 shadow-card'
					aria-labelledby='active-chapter-title'
				>
					{activeChapter && (
						<>
							<div className='flex flex-col justify-between gap-3 border-b border-border-subtle pb-5 sm:flex-row sm:items-start'>
								<div>
									<p className='text-[11px] font-semibold uppercase tracking-[0.18em] text-primary'>
										Chapter {activeChapter.id}
									</p>
									<h2
										id='active-chapter-title'
										className='mt-1 text-2xl font-bold text-text-primary'
									>
										{activeChapter.title}
									</h2>
									<p className='mt-2 max-w-2xl text-sm leading-6 text-text-muted'>
										{activeChapter.focus}
									</p>
								</div>
								<div className='rounded-xl bg-bg-elevated/60 p-3 text-xs text-text-muted'>
									<span className='font-semibold text-text-primary'>
										{activeChapter.artifacts.length}
									</span>{' '}
									mapped artifacts
								</div>
							</div>
							<div className='mt-5 rounded-xl border border-primary/15 bg-primary/5 p-4'>
								<p className='text-xs font-semibold uppercase tracking-[0.14em] text-primary'>
									Backlog criteria
								</p>
								<ul className='mt-2 grid gap-2 text-sm text-text-muted sm:grid-cols-2'>
									{activeChapter.criteria.map(criterion => (
										<li key={criterion} className='flex gap-2'>
											<CheckCircle2 className='mt-0.5 size-4 shrink-0 text-primary' />
											{criterion}
										</li>
									))}
								</ul>
							</div>
							<div className='mt-5 grid gap-4 xl:grid-cols-2'>
								{activeChapter.artifacts.map(artifact => (
									<ThesisArtifactCard key={artifact.id} artifact={artifact} />
								))}
							</div>
						</>
					)}
				</section>
			</div>

			<ThesisArchitectureDiagram />
			<section className='flex flex-col justify-between gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/5 p-4 text-sm sm:flex-row sm:items-center'>
				<div className='flex gap-3'>
					<AlertTriangle className='mt-0.5 size-5 shrink-0 text-amber-600' />
					<div>
						<p className='font-semibold text-text-primary'>
							Evidence integrity rule
						</p>
						<p className='mt-1 leading-6 text-text-muted'>
							Pending exports remain labeled in screenshots and figures. Replace
							values through the existing Epic 9 and Epic 10 adapters, then
							recapture the linked artifacts.
						</p>
					</div>
				</div>
				<Link
					href='/admin/evaluation'
					className='inline-flex shrink-0 items-center gap-2 text-xs font-semibold text-primary hover:underline'
				>
					Open evaluation surfaces <ArrowRight className='size-3.5' />
				</Link>
			</section>
		</div>
	)
}
