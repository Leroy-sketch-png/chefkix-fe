export type ThesisChapterId = '5' | '6' | '7' | '8' | '10' | '11'

export type EvidenceKind =
	| 'screenshot'
	| 'diagram'
	| 'example'
	| 'figure'
	| 'demo'

export type EvidenceStatus = 'ready' | 'pending-data' | 'capture-needed'

export interface EvidenceArtifact {
	id: string
	chapterId: ThesisChapterId
	title: string
	kind: EvidenceKind
	description: string
	route?: string
	dependency: string
	status: EvidenceStatus
	captureBrief: string[]
}

export interface ThesisChapter {
	id: ThesisChapterId
	title: string
	focus: string
	criteria: string[]
	artifacts: EvidenceArtifact[]
}

export interface ThesisEvidenceManifest {
	version: string
	updatedAt: string
	chapters: ThesisChapter[]
}
