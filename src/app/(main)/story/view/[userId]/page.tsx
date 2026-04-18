'use client'

import { StoryViewer } from '@/components/story/StoryViewer'

export default function View({ params }: { params: { userId: string } }) {
	return <StoryViewer userId={params.userId} />
}
